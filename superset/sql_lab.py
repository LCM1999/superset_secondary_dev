# Licensed to the Apache Software Foundation (ASF) under one
# or more contributor license agreements.  See the NOTICE file
# distributed with this work for additional information
# regarding copyright ownership.  The ASF licenses this file
# to you under the Apache License, Version 2.0 (the
# "License"); you may not use this file except in compliance
# with the License.  You may obtain a copy of the License at
#
#   http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing,
# software distributed under the License is distributed on an
# "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
# KIND, either express or implied.  See the License for the
# specific language governing permissions and limitations
# under the License.
import logging
import uuid
from contextlib import closing
from datetime import datetime
from sys import getsizeof
from typing import Dict, List, Optional, Tuple, Union

import backoff
import msgpack
import pyarrow as pa
import simplejson as json
import sqlalchemy
from celery.exceptions import SoftTimeLimitExceeded
from contextlib2 import contextmanager
from flask_babel import lazy_gettext as _
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import NullPool

from superset import (
    app,
    db,
    results_backend,
    results_backend_use_msgpack,
    security_manager,
)
from superset.dataframe import df_to_records,list_to_dict
from superset.db_engine_specs import BaseEngineSpec
from superset.extensions import celery_app
from superset.models.sql_lab import Query
from superset.result_set import SupersetResultSet,SupersetResultSet_neo4j
from superset.sql_parse import ParsedQuery
from superset.utils.core import (
    json_iso_dttm_ser,
    QuerySource,
    QueryStatus,
    zlib_compress,
)
from superset.utils.dates import now_as_float
from superset.utils.decorators import stats_timing

config = app.config
stats_logger = config["STATS_LOGGER"]
SQLLAB_TIMEOUT = config["SQLLAB_ASYNC_TIME_LIMIT_SEC"]
SQLLAB_HARD_TIMEOUT = SQLLAB_TIMEOUT + 60
SQL_MAX_ROW = config["SQL_MAX_ROW"]
SQLLAB_CTAS_NO_LIMIT = config["SQLLAB_CTAS_NO_LIMIT"]
SQL_QUERY_MUTATOR = config["SQL_QUERY_MUTATOR"]
log_query = config["QUERY_LOGGER"]
logger = logging.getLogger(__name__)


class SqlLabException(Exception):
    pass


class SqlLabSecurityException(SqlLabException):
    pass


class SqlLabTimeoutException(SqlLabException):
    pass


def handle_query_error(msg, query, session, payload=None):
    """Local method handling error while processing the SQL"""
    payload = payload or {}
    troubleshooting_link = config["TROUBLESHOOTING_LINK"]#????????????
    query.error_message = msg
    query.status = QueryStatus.FAILED#??????query????????????failed
    query.tmp_table_name = None
    session.commit()
    payload.update({"status": query.status, "error": msg})
    if troubleshooting_link:
        payload["link"] = troubleshooting_link
    return payload#???????????????????????????????????????id?????????????????????????????????????????????????????????bad_link


def get_query_backoff_handler(details):
    query_id = details["kwargs"]["query_id"]
    logger.error(f"Query with id `{query_id}` could not be retrieved")
    stats_logger.incr("error_attempting_orm_query_{}".format(details["tries"] - 1))
    logger.error(f"Query {query_id}: Sleeping for a sec before retrying...")


def get_query_giveup_handler(_):
    stats_logger.incr("error_failed_at_getting_orm_query")


@backoff.on_exception(
    backoff.constant,
    SqlLabException,
    interval=1,
    on_backoff=get_query_backoff_handler,
    on_giveup=get_query_giveup_handler,
    max_tries=5,
)
def get_query(query_id, session):
    """attempts to get the query and retry if it cannot"""
    try:
        return session.query(Query).filter_by(id=query_id).one()
    except Exception:
        raise SqlLabException("Failed at getting query")


@contextmanager#????????????????????????????????????yield???????????????
def session_scope(nullpool):
    """Provide a transactional scope around a series of operations.
    ??????????????????????????????????????????"""
    if nullpool:
        engine = sqlalchemy.create_engine(
            app.config["SQLALCHEMY_DATABASE_URI"], poolclass=NullPool
        )
        session_class = sessionmaker()
        session_class.configure(bind=engine)
        session = session_class()
    else:
        session = db.session()
        session.commit()  # HACK#?????????????????????????????????????????????select??????????????????????????????

    try:
        yield session
        session.commit()
    except Exception as e:
        session.rollback()
        logger.exception(e)
        raise
    finally:
        session.close()


@celery_app.task(
    name="sql_lab.get_sql_results",
    bind=True,
    time_limit=SQLLAB_HARD_TIMEOUT,
    soft_time_limit=SQLLAB_TIMEOUT,
)
def get_sql_results(  # pylint: disable=too-many-arguments
    ctask,
    query_id,
    rendered_query,
    return_results=True,
    store_results=False,
    user_name=None,
    start_time=None,
    expand_data=False,
    log_params=None,
):
    """Executes the sql query returns the results.
    ??????sql??????????????????????????????????????????"""
    with session_scope(not ctask.request.called_directly) as session:#???????????????????????????????????????????????????session
        print('?????????with?????????',)#not ctask.request.called_directly???False
        try:
            return execute_sql_statements(#??????????????????
                query_id,
                rendered_query,
                return_results,
                store_results,
                user_name,
                session=session,
                start_time=start_time,
                expand_data=expand_data,
                log_params=log_params,
            )
        except Exception as e:  # pylint: disable=broad-except
            logger.error("Query %d", query_id)
            logger.debug("Query %d: %s", query_id, e)
            stats_logger.incr("error_sqllab_unhandled")
            query = get_query(query_id, session)
            return handle_query_error(str(e), query, session)


# pylint: disable=too-many-arguments
def execute_sql_statement(sql_statement, query, user_name, session, cursor, log_params):
    """Executes a single SQL statement"""
    database = query.database
    db_engine_spec = database.db_engine_spec
    parsed_query = ParsedQuery(sql_statement)
    sql = parsed_query.stripped()

    if not parsed_query.is_readonly() and not database.allow_dml:
        raise SqlLabSecurityException(
            _("Only `SELECT` statements are allowed against this database")
        )
    if query.select_as_cta:#false
        if not parsed_query.is_select():
            raise SqlLabException(
                _(
                    "Only `SELECT` statements can be used with the CREATE TABLE "
                    "feature."
                )
            )
        if not query.tmp_table_name:
            start_dttm = datetime.fromtimestamp(query.start_time)
            query.tmp_table_name = "tmp_{}_table_{}".format(
                query.user_id, start_dttm.strftime("%Y_%m_%d_%H_%M_%S")
            )
        sql = parsed_query.as_create_table(
            query.tmp_table_name, schema_name=query.tmp_schema_name
        )
        query.select_as_cta_used = True

    # Do not apply limit to the CTA queries when SQLLAB_CTAS_NO_LIMIT is set to true
    if parsed_query.is_select() and not (
        query.select_as_cta_used and SQLLAB_CTAS_NO_LIMIT
    ):
        if SQL_MAX_ROW and (not query.limit or query.limit > SQL_MAX_ROW):
            query.limit = SQL_MAX_ROW
        if query.limit:
            sql = database.apply_limit_to_sql(sql, query.limit)

    # Hook to allow environment-specific mutation (usually comments) to the SQL
    if SQL_QUERY_MUTATOR:#None
        sql = SQL_QUERY_MUTATOR(sql, user_name, security_manager, database)

    try:
        if log_query:#None
            log_query(
                query.database.sqlalchemy_uri,
                query.executed_sql,
                query.schema,
                user_name,
                __name__,
                security_manager,
                log_params,
            )
        query.executed_sql = sql
        session.commit()
        with stats_timing("sqllab.query.time_executing_query", stats_logger):
            logger.debug("Query %d: Running query: %s", query.id, sql)
            db_engine_spec.execute(cursor, sql, async_=True)
            logger.debug("Query %d: Handling cursor", query.id)
            db_engine_spec.handle_cursor(cursor, query, session)

        with stats_timing("sqllab.query.time_fetching_results", stats_logger):
            logger.debug(
                "Query %d: Fetching data for query object: %s",
                query.id,
                str(query.to_dict()),
            )
            data = db_engine_spec.fetch_data(cursor, query.limit)

    except SoftTimeLimitExceeded as e:
        logger.error("Query %d: Time limit exceeded", query.id)
        logger.debug("Query %d: %s", query.id, e)
        raise SqlLabTimeoutException(
            "SQL Lab timeout. This environment's policy is to kill queries "
            "after {} seconds.".format(SQLLAB_TIMEOUT)
        )
    except Exception as e:
        logger.error("Query %d: %s", query.id, type(e))
        logger.debug("Query %d: %s", query.id, e)
        raise SqlLabException(db_engine_spec.extract_error_message(e))

    logger.debug("Query %d: Fetching cursor description", query.id)
    cursor_description = cursor.description#???????????????????????????
    #print('???????????????????????????',cursor_description)
    return SupersetResultSet(data, cursor_description, db_engine_spec)

def execute_cypher_statement (sql_statement, query, user_name, session, cursor, log_params):
    database = query.database
    db_engine_spec = database.db_engine_spec
    parsed_query = ParsedQuery(sql_statement)
    cypher = parsed_query.stripped()
    #print('??????execute_cypher_statement??????cypher????????????????????????',cypher)
    if not sql_statement.startswith('MATCH'):
        raise SqlLabSecurityException(
            _("Only `MATCH` statements are allowed against this database")
        )
    if query.select_as_cta:#false
        if not parsed_query.is_select():
            raise SqlLabException(
                _(
                    "Only `SELECT` statements can be used with the CREATE TABLE "
                    "feature."
                )
            )        
        if not query.tmp_table_name:
            start_dttm = datetime.fromtimestamp(query.start_time)
            query.tmp_table_name = "tmp_{}_table_{}".format(
                query.user_id, start_dttm.strftime("%Y_%m_%d_%H_%M_%S")
            )
        sql = parsed_query.as_create_table(
            query.tmp_table_name, schema_name=query.tmp_schema_name
        )
        query.select_as_cta_used = True
    if SQL_QUERY_MUTATOR:#None
        sql = SQL_QUERY_MUTATOR(sql, user_name, security_manager, database)

    try:
        if log_query:#None
            log_query(
                query.database.sqlalchemy_uri,
                query.executed_sql,
                query.schema,
                user_name,
                __name__,
                security_manager,
                log_params,
            )
        query.executed_sql = cypher
        with stats_timing("sqllab.query.time_executing_query", stats_logger):
            logger.debug("Query %d: Running query: %s", query.id, cypher)
            db_engine_spec.execute(cursor, cypher, async_=True)
            logger.debug("Query %d: Handling cursor", query.id)
            db_engine_spec.handle_cursor(cursor, query, session)
        
        with stats_timing("sqllab.query.time_fetching_results", stats_logger):
            logger.debug(
                "Query %d: Fetching data for query object: %s",
                query.id,
                str(query.to_dict()),
            )
            data = db_engine_spec.fetch_data()   

    except SoftTimeLimitExceeded as e:
        logger.error("Query %d: Time limit exceeded", query.id)
        logger.debug("Query %d: %s", query.id, e)
        raise SqlLabTimeoutException(
            "SQL Lab timeout. This environment's policy is to kill queries "
            "after {} seconds.".format(SQLLAB_TIMEOUT)
        )
    except Exception as e:
        logger.error("Query %d: %s", query.id, type(e))
        logger.debug("Query %d: %s", query.id, e)
        raise SqlLabException(db_engine_spec.extract_error_message(e))

    logger.debug("Query %d: Fetching cursor description", query.id)
    cursor_description = (['nodes',],['links',])#????????????????????????????????????link???node
    return SupersetResultSet_neo4j(data, cursor_description, db_engine_spec) 

def _serialize_payload(
    payload: dict, use_msgpack: Optional[bool] = False
) -> Union[bytes, str]:
    logger.debug(f"Serializing to msgpack: {use_msgpack}")
    if use_msgpack:
        return msgpack.dumps(payload, default=json_iso_dttm_ser, use_bin_type=True)

    return json.dumps(payload, default=json_iso_dttm_ser, ignore_nan=True)


def _serialize_and_expand_data(
    result_set: SupersetResultSet,
    db_engine_spec: BaseEngineSpec,
    use_msgpack: Optional[bool] = False,
    expand_data: bool = False,
) -> Tuple[Union[bytes, str], list, list, list]:
    selected_columns: List[Dict] = result_set.columns
    expanded_columns: List[Dict]

    if use_msgpack:#false
        with stats_timing(
            "sqllab.query.results_backend_pa_serialization", stats_logger
        ):
            data = (
                pa.default_serialization_context()
                .serialize(result_set.pa_table)
                .to_buffer()
                .to_pybytes()
            )

        # expand when loading data from results backend
        all_columns, expanded_columns = (selected_columns, [])
    else:#true
        print(result_set.to_pandas_df())
        df = result_set.to_pandas_df()#??????pd.DataFrame????????????????????????dict[str,[nodes]]
        if db_engine_spec.engine == 'http':
            print('??????????????????????????????????????????')
            data = list_to_dict(df) or {}#
        else:
            data = df_to_records(df) or []

        if expand_data:#false
            all_columns, data, expanded_columns = db_engine_spec.expand_data(
                selected_columns, data
            )
        else:
            all_columns = selected_columns
            expanded_columns = []

    return (data, selected_columns, all_columns, expanded_columns)


def execute_sql_statements(
    query_id,
    rendered_query,
    return_results=True,
    store_results=False,
    user_name=None,
    session=None,
    start_time=None,
    expand_data=False,
    log_params=None,
):  # pylint: disable=too-many-arguments, too-many-locals, too-many-statements
    """Executes the sql query returns the results."""
    if store_results and start_time:#flase and none
        # only asynchronous queries
        stats_logger.timing("sqllab.query.time_pending", now_as_float() - start_time)

    query = get_query(query_id, session)#??????query?????????????????????
    payload = dict(query_id=query_id)
    database = query.database#????????????????????????database_id
    db_engine_spec = database.db_engine_spec#????????????????????????db_engine_specs??????????????????????????????????????????
    db_engine_spec.patch()#??????hive?????????????????????pass???????????????
    if_neo4j = False

    if database.allow_run_async and not results_backend:
        raise SqlLabException("Results backend isn't configured.")

    # Breaking down into multiple statements
    #?????????????????????
    parsed_query = ParsedQuery(rendered_query)
    statements = parsed_query.get_statements()
    logger.info(f"Query {query_id}: Executing {len(statements)} statement(s)")

    logger.info(f"Query {query_id}: Set query to 'running'")
    query.status = QueryStatus.RUNNING#????????????running???
    query.start_running_time = now_as_float()#????????????????????? es???1618495112876.656
    session.commit()

    engine = database.get_sqla_engine(
        schema=query.schema,
        nullpool=True,
        user_name=user_name,
        source=QuerySource.SQL_LAB,
    )#??????????????????????????????GraphService
    # Sharing a single connection and cursor across the
    # execution of all statements (if many)
    #engine.raw_connection()???????????????????????????
    #??????Engine.connect()???????????????Engine??????????????????????????????????????????
    #Connection?????????????????????Connection???????????????????????????Engine.raw_connection()
    #???????????????????????????
    if database.database_name == 'ceshineo4j':
        if_neo4j = True
        print('?????????????????????????????????????????????????????????')
        #graph = engine.default_graph
        cursor = engine.default_graph#??????py2neo?????????????????????????????????????????????????????????engine.run???cpher?????????
        #print(graph.name)
        statement_count = len(statements)
        for i,statement in enumerate(statements):
        # Check if stopped????????????????????????????????????????????????running??????????????????????????????
            query = get_query(query_id, session)
            if query.status == QueryStatus.STOPPED:
                return None 
        #run Cypher
            msg = f"Running statement {i+1} out of {statement_count}"
            logger.info(f"Query {query_id}: {msg}")
            query.set_extra_json_key("progress", msg)
            try:
                result_set = execute_cypher_statement(
                    statement, query, user_name, session, cursor, log_params
                )
            except Exception as e:  # pylint: disable=broad-except
                msg = str(e)
                if statement_count > 1:
                    msg = f"[Statement {i+1} out of {statement_count}] " + msg
                payload = handle_query_error(msg, query, session, payload)#?????????id
                return payload

    else:#run sql  
        if_neo4j = False
        with closing(engine.raw_connection()) as conn:
            with closing(conn.cursor()) as cursor:#?????????????????????
                statement_count = len(statements)#sql????????????
                for i, statement in enumerate(statements):#?????????????????????????????????(??????????????????????????????)??????????????????????????????????????????????????????????????????
                    # Check if stopped????????????????????????????????????????????????running??????????????????????????????
                    query = get_query(query_id, session)
                    if query.status == QueryStatus.STOPPED:
                        return None

                    # Run statement??????sql
                    msg = f"Running statement {i+1} out of {statement_count}"
                    logger.info(f"Query {query_id}: {msg}")
                    query.set_extra_json_key("progress", msg)#???extra???????????????????????????????????????json?????????????????????extra_json
                    session.commit()
                    try:
                        result_set = execute_sql_statement(
                            statement, query, user_name, session, cursor, log_params
                        )
                    except Exception as e:  # pylint: disable=broad-except
                        msg = str(e)
                        if statement_count > 1:
                            msg = f"[Statement {i+1} out of {statement_count}] " + msg
                        payload = handle_query_error(msg, query, session, payload)
                        return payload

            # Commit the connection so CTA queries will create the table.
            conn.commit()

    # Success, updating the query entry in database
    query.rows = result_set.size
    query.progress = 100
    query.set_extra_json_key("progress", None)
    if query.select_as_cta:#false
        query.select_sql = database.select_star(
            query.tmp_table_name,
            schema=query.tmp_schema_name,
            limit=query.limit,
            show_cols=False,
            latest_partition=False,
        )
    query.end_time = now_as_float()

    use_arrow_data = store_results and results_backend_use_msgpack#false
    data, selected_columns, all_columns, expanded_columns = _serialize_and_expand_data(
        result_set, db_engine_spec, use_arrow_data, expand_data
    )
    print('????????? _serialize_and_expand_data')
    # TODO: data should be saved separately from metadata (likely in Parquet)
    payload.update(
        {
            "status": QueryStatus.SUCCESS,
            "if_neo4j":if_neo4j,
            "data": data,
            "columns": all_columns,
            "selected_columns": selected_columns,
            "expanded_columns": expanded_columns,
            "query": query.to_dict(),
        }
    )
    payload["query"]["state"] = QueryStatus.SUCCESS
    #print('paload????????????',store_results and results_backend)
    if store_results and results_backend:#false
        #print('?????????store_results')
        key = str(uuid.uuid4())
        logger.info(f"Query {query_id}: Storing results in results backend, key: {key}")
        with stats_timing("sqllab.query.results_backend_write", stats_logger):
            with stats_timing(
                "sqllab.query.results_backend_write_serialization", stats_logger
            ):
                serialized_payload = _serialize_payload(
                    payload, results_backend_use_msgpack
                )
            cache_timeout = database.cache_timeout
            if cache_timeout is None:
                cache_timeout = config["CACHE_DEFAULT_TIMEOUT"]

            compressed = zlib_compress(serialized_payload)
            logger.debug(
                f"*** serialized payload size: {getsizeof(serialized_payload)}"
            )
            logger.debug(f"*** compressed payload size: {getsizeof(compressed)}")
            results_backend.set(key, compressed, cache_timeout)
        query.results_key = key

    query.status = QueryStatus.SUCCESS
    session.commit()
    #print('???????????????????????????')
    if return_results:#true
        #print('?????????return_results')
        # since we're returning results we need to create non-arrow data???????????????????????????
        if use_arrow_data:#false
            (
                data,
                selected_columns,
                all_columns,
                expanded_columns,
            ) = _serialize_and_expand_data(
                result_set, db_engine_spec, False, expand_data
            )
            payload.update(
                {
                    "data": data,
                    "columns": all_columns,
                    "selected_columns": selected_columns,
                    "expanded_columns": expanded_columns,
                }
            )
        print(payload)
        return payload#????????????payload
    print('?????????execute ??????s')
    return None
