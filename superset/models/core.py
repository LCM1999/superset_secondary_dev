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
# pylint: disable=line-too-long,unused-argument,ungrouped-imports
"""A collection of ORM sqlalchemy models for Superset"""
import json
import logging
import textwrap
from py2neo import * 
from contextlib import closing
from copy import deepcopy
from datetime import datetime#下面一行的import后面不要改动，会莫名其妙出错
from typing import Any, Callable, Dict, List, Optional, Set, Tuple, Type

import numpy
import pandas as pd
import sqlalchemy as sqla
import sqlparse
from flask import g, request
from flask_appbuilder import Model
from sqlalchemy import (
    Boolean,
    Column,
    create_engine,
    DateTime,
    ForeignKey,
    Integer,
    MetaData,
    String,
    Table,
    Text,
)
from sqlalchemy.engine import Dialect, Engine, url
from sqlalchemy.engine.reflection import Inspector
from sqlalchemy.engine.url import make_url, URL
from sqlalchemy.orm import relationship
from sqlalchemy.pool import NullPool
from sqlalchemy.schema import UniqueConstraint
from sqlalchemy.sql import Select
from sqlalchemy_utils import EncryptedType

from superset import app, db_engine_specs, is_feature_enabled, security_manager
from superset.db_engine_specs.base import TimeGrain
from superset.models.dashboard import Dashboard
from superset.models.helpers import AuditMixinNullable, ImportMixin
from superset.models.tags import DashboardUpdater, FavStarUpdater
from superset.utils import cache as cache_util, core as utils

config = app.config
custom_password_store = config["SQLALCHEMY_CUSTOM_PASSWORD_STORE"]#配置文件中是None
stats_logger = config["STATS_LOGGER"]
log_query = config["QUERY_LOGGER"]
metadata = Model.metadata  # pylint: disable=no-member
logger = logging.getLogger(__name__)


PASSWORD_MASK = "X" * 10
DB_CONNECTION_MUTATOR = config["DB_CONNECTION_MUTATOR"]


class ViewColumn():
    def __init__(self,name,if_dafult,type):
        self.name = name
        self.if_dafult = if_dafult
        self.type = type

class VIEWS_SOURCES():
    name:str
    columns:list
    def __init__(self, name,columns):
        self.name = name
        self.columns = columns

class Url(Model, AuditMixinNullable):
    """Used for the short url feature"""

    __tablename__ = "url"
    id = Column(Integer, primary_key=True)  # pylint: disable=invalid-name
    url = Column(Text)


class KeyValue(Model):  # pylint: disable=too-few-public-methods

    """Used for any type of key-value store"""

    __tablename__ = "keyvalue"
    id = Column(Integer, primary_key=True)  # pylint: disable=invalid-name
    value = Column(Text, nullable=False)


class CssTemplate(Model, AuditMixinNullable):

    """CSS templates for dashboards"""

    __tablename__ = "css_templates"
    id = Column(Integer, primary_key=True)  # pylint: disable=invalid-name
    template_name = Column(String(250))
    css = Column(Text, default="")


class Database(
    Model, AuditMixinNullable, ImportMixin
):  # pylint: disable=too-many-public-methods

    """An ORM object that stores Database related information
    一个用来存储数据库关联信息的类"""

    __tablename__ = "dbs"
    type = "table"
    __table_args__ = (UniqueConstraint("database_name"),)
  

    #创建了字段？
    id = Column(Integer, primary_key=True)  # pylint: disable=invalid-name
    verbose_name = Column(String(250), unique=True)
    # short unique name, used in permissions
    database_name = Column(String(250), unique=True, nullable=False)
    sqlalchemy_uri = Column(String(1024), nullable=False)
    password = Column(EncryptedType(String(1024), config["SECRET_KEY"]))
    cache_timeout = Column(Integer)
    select_as_create_table_as = Column(Boolean, default=False)
    expose_in_sqllab = Column(Boolean, default=True)
    allow_run_async = Column(Boolean, default=False)
    allow_csv_upload = Column(Boolean, default=False)
    allow_ctas = Column(Boolean, default=False)
    allow_dml = Column(Boolean, default=False)
    force_ctas_schema = Column(String(250))
    allow_multi_schema_metadata_fetch = Column(  # pylint: disable=invalid-name
        Boolean, default=False
    )
    extra = Column(
        Text,
        default=textwrap.dedent(
            """\
    {
        "metadata_params": {},
        "engine_params": {},
        "metadata_cache_timeout": {},
        "schemas_allowed_for_csv_upload": []
    }
    """
        ),
    )
    encrypted_extra = Column(EncryptedType(Text, config["SECRET_KEY"]), nullable=True)
    perm = Column(String(1000))
    impersonate_user = Column(Boolean, default=False)
    server_cert = Column(EncryptedType(Text, config["SECRET_KEY"]), nullable=True)
    export_fields = [
        "database_name",
        "sqlalchemy_uri",
        "cache_timeout",
        "expose_in_sqllab",
        "allow_run_async",
        "allow_ctas",
        "allow_csv_upload",
        "extra",
    ]
    export_children = ["tables"]

    def __repr__(self):
        return self.name

    @property #直接通过方法名来访问后面不用加（）
    def name(self) -> str:
        return self.verbose_name if self.verbose_name else self.database_name

    @property
    def allows_subquery(self) -> bool:
        return self.db_engine_spec.allows_subqueries

    @property
    def function_names(self) -> List[str]:
        return self.db_engine_spec.get_function_names(self)

    @property
    def allows_cost_estimate(self) -> bool:
        extra = self.get_extra()

        database_version = extra.get("version")
        cost_estimate_enabled: bool = extra.get("cost_estimate_enabled")  # type: ignore

        return (
            self.db_engine_spec.get_allow_cost_estimate(database_version)
            and cost_estimate_enabled
        )

    @property
    def data(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "name": self.database_name,
            "backend": self.backend,
            "allow_multi_schema_metadata_fetch": self.allow_multi_schema_metadata_fetch,
            "allows_subquery": self.allows_subquery,
            "allows_cost_estimate": self.allows_cost_estimate,
        }

    @property
    def unique_name(self) -> str:
        return self.database_name

    @property
    def url_object(self) -> URL:
        return make_url(self.sqlalchemy_uri_decrypted)

    @property
    def backend(self) -> str:
        sqlalchemy_url = make_url(self.sqlalchemy_uri_decrypted)#解密url
        return sqlalchemy_url.get_backend_name()

    @property
    def metadata_cache_timeout(self) -> Dict[str, Any]:
        return self.get_extra().get("metadata_cache_timeout", {})

    @property
    def schema_cache_enabled(self) -> bool:
        return "schema_cache_timeout" in self.metadata_cache_timeout

    @property
    def schema_cache_timeout(self) -> Optional[int]:
        return self.metadata_cache_timeout.get("schema_cache_timeout")

    @property
    def table_cache_enabled(self) -> bool:
        return "table_cache_timeout" in self.metadata_cache_timeout

    @property
    def table_cache_timeout(self) -> Optional[int]:
        return self.metadata_cache_timeout.get("table_cache_timeout")

    @property
    def default_schemas(self) -> List[str]:
        return self.get_extra().get("default_schemas", [])

    @classmethod
    def get_password_masked_url_from_uri(cls, uri: str):  # pylint: disable=invalid-name
        sqlalchemy_url = make_url(uri)
        return cls.get_password_masked_url(sqlalchemy_url)

    @classmethod
    def get_password_masked_url(
        cls, url: URL  # pylint: disable=redefined-outer-name
    ) -> URL:
        url_copy = deepcopy(url)#构造一个新的复合对象，然后，递归地将在原始对象里找到的对象的 副本 插入其中。
        if url_copy.password is not None:
            url_copy.password = PASSWORD_MASK
        return url_copy

    def set_sqlalchemy_uri(self,uri: str) -> None:#用来遮盖password的
        conn = sqla.engine.url.make_url(uri.strip())#取出url中开头结尾的空格符
        if conn.password != PASSWORD_MASK and not custom_password_store:#是否使用外部存储存储密码而不是放在数据库中此处配置文件中设置的是None
                # do not over-write the password with the password mask
            self.password = conn.password
        conn.password = PASSWORD_MASK if conn.password else None
        self.sqlalchemy_uri = str(conn)  # hides the password

    def get_effective_user(
        self,
        url: URL,  # pylint: disable=redefined-outer-name
        user_name: Optional[str] = None,
    ) -> Optional[str]:
        """
        Get the effective user, especially during impersonation.
        获得有效的用户，尤其是在冒充期间
        :param url: SQL Alchemy URL object
        :param user_name: Default username 默认的用户名，这个比传进来的用户名优先级要高
        :return: The effective username
        """
        effective_username = None
        if self.impersonate_user:
            effective_username = url.username
            if user_name:
                effective_username = user_name
            elif (
                hasattr(g, "user")
                and hasattr(g.user, "username")
                and g.user.username is not None
            ):#hasattr（）函数用来判断对象是否包含对应的属性
                effective_username = g.user.username
        return effective_username

    @utils.memoized(watch=("impersonate_user", "sqlalchemy_uri_decrypted", "extra"))
    
    def get_sqla_engine(
        self,
        schema: Optional[str] = None,
        nullpool: bool = True,
        user_name: Optional[str] = None,
        source: Optional[utils.QuerySource] = None,
    ) -> Engine or Graph :
        extra = self.get_extra()#从基础BaseEngineSpec中拿到连接数据库须要的且由用户输入的额外东西
        sqlalchemy_url = make_url(self.sqlalchemy_uri_decrypted)#给定一个字符串或Unicode实例，生成一个新的URL实例。
        #如果传入图数据库实例是没有database这个字符串被解析出来的
        self.db_engine_spec.adjust_database_uri(sqlalchemy_url, schema)#传入数据库连接模式图数据库这块还没重写
        effective_username = self.get_effective_user(sqlalchemy_url, user_name)
        # If using MySQL or Presto for example, will set url.username
        # If using Hive, will not do anything yet since that relies on a
        # configuration parameter instead.
        self.db_engine_spec.modify_url_for_impersonation(
            sqlalchemy_url, self.impersonate_user, effective_username
        )
        #下面两行是遮盖password后打印url日志
        masked_url = self.get_password_masked_url(sqlalchemy_url)
        logger.debug("Database.get_sqla_engine(). Masked URL: %s", str(masked_url))
        #########中间的这些用不到 ，一般不会填extra这个表单对象
        params = extra.get("engine_params", {})
        if nullpool:
            params["poolclass"] = NullPool

        connect_args = params.get("connect_args", {})
        configuration = connect_args.get("configuration", {})

        # If using Hive, this will set hive.server2.proxy.user=$effective_username
        configuration.update(
            self.db_engine_spec.get_configuration_for_impersonation(
                str(sqlalchemy_url), self.impersonate_user, effective_username
            )
        )
        if configuration:
            connect_args["configuration"] = configuration
            #print('执行了')
        if connect_args:
            params["connect_args"] = connect_args
            #print('执行了2')

        params.update(self.get_encrypted_extra())
        print(params)
        ##########
        if DB_CONNECTION_MUTATOR:#这个是配置文件中的DB_CONNECTION_MUTATOR字段 是None
            if not source and request and request.referrer:
                if "/superset/dashboard/" in request.referrer:
                    source = utils.QuerySource.DASHBOARD
                elif "/superset/explore/" in request.referrer:
                    source = utils.QuerySource.CHART
                elif "/superset/sqllab/" in request.referrer:
                    source = utils.QuerySource.SQL_LAB

            sqlalchemy_url, params = DB_CONNECTION_MUTATOR(
                sqlalchemy_url, params, effective_username, security_manager, source
            )
            print('执行了3')
        #should import py2neo here
        print(str(sqlalchemy_url))
        if self.database_kind:
            engine = GraphService(str(sqlalchemy_url))
            return engine#为了不更改变量名字引起麻烦暂时就继续使用sqlalchemy_url
        else:
            return create_engine(sqlalchemy_url, **params)

    def get_reserved_words(self) -> Set[str]:
        return self.get_dialect().preparer.reserved_words

    def get_quoter(self):
        return self.get_dialect().identifier_preparer.quote

    def get_json(# pylint: disable=too-many-locals
        self, sql: str, schema: Optional[str] = None, mutator: Optional[Callable] = None
        ) -> list:#返回的是一个[json,]
        cypher = sql
        print('开始拿数据库服务器')
        engine = self.get_sqla_engine(schema=schema)#修改以后拿到的应该是Graphservice
        print('拿到数据库服务器了')
        username = utils.get_username()
        self.db_engine_spec.execute(engine.default_graph,cypher)
        print('执行完了查询了')
        json_data = self.db_engine_spec.fetch_data()
        return json_data



    def get_df(  # pylint: disable=too-many-locals
        self, sql: str, schema: Optional[str] = None, mutator: Optional[Callable] = None
    ) -> pd.DataFrame:
        sqls = [str(s).strip(" ;") for s in sqlparse.parse(sql)]

        engine = self.get_sqla_engine(schema=schema)
        username = utils.get_username()

        def needs_conversion(df_series: pd.Series) -> bool:
            return not df_series.empty and isinstance(df_series[0], (list, dict))

        def _log_query(sql: str) -> None:
            if log_query:
                log_query(engine.url, sql, schema, username, __name__, security_manager)

        with closing(engine.raw_connection()) as conn:
            with closing(conn.cursor()) as cursor:
                for sql_ in sqls[:-1]:
                    _log_query(sql_)
                    self.db_engine_spec.execute(cursor, sql_)
                    cursor.fetchall()

                _log_query(sqls[-1])
                self.db_engine_spec.execute(cursor, sqls[-1])

                if cursor.description is not None:
                    columns = [col_desc[0] for col_desc in cursor.description]
                else:
                    columns = []

                df = pd.DataFrame.from_records(
                    data=list(cursor.fetchall()), columns=columns, coerce_float=True
                )

                if mutator:
                    mutator(df)

                for k, v in df.dtypes.items():
                    if v.type == numpy.object_ and needs_conversion(df[k]):
                        df[k] = df[k].apply(utils.json_dumps_w_dates)
                return df

    def compile_sqla_query(self, qry: Select, schema: Optional[str] = None) -> str:
        engine = self.get_sqla_engine(schema=schema)

        sql = str(qry.compile(engine, compile_kwargs={"literal_binds": True}))

        if (
            engine.dialect.identifier_preparer._double_percents  # pylint: disable=protected-access
        ):
            sql = sql.replace("%%", "%")

        return sql

    def select_star(  # pylint: disable=too-many-arguments
        self,
        table_name: str,
        schema: Optional[str] = None,
        limit: int = 100,
        show_cols: bool = False,
        indent: bool = True,
        latest_partition: bool = False,
        cols: Optional[List[Dict[str, Any]]] = None,
    ):
        """Generates a ``select *`` statement in the proper dialect"""
        """用适当的方言生成一个' ' select * ' '语句"""
        eng = self.get_sqla_engine(schema=schema, source=utils.QuerySource.SQL_LAB)
        return self.db_engine_spec.select_star(
            self,
            table_name,
            schema=schema,
            engine=eng,
            limit=limit,
            show_cols=show_cols,
            indent=indent,
            latest_partition=latest_partition,
            cols=cols,
        )

    def apply_limit_to_sql(self, sql: str, limit: int = 1000) -> str:
        return self.db_engine_spec.apply_limit_to_sql(sql, limit, self)

    def safe_sqlalchemy_uri(self) -> str:
        return self.sqlalchemy_uri

    @property
    def inspector(self) -> Inspector:
        engine = self.get_sqla_engine()
        if self.database_kind:
            print(engine)
            return engine
        else:#不是图数据库就按之前的来    
            print(sqla.inspect(engine))
            return sqla.inspect(engine)

    @property
    def database_kind(self) ->bool:#自己加的方法
        if str(self.sqlalchemy_uri).startswith('http'):#图数据库的url形式
            print('是图数据库')
            database_kind = True #代表不是传统的数据库
        else:
            database_kind = False  
        return database_kind

    @property
    def if_materialize(self) ->bool:#自己加的方法
        if str(self.sqlalchemy_uri).endswith('materialize'):
            print('it`s a materialize database')
            return True
        else:
            return False
    
    @cache_util.memoized_func(
        key=lambda *args, **kwargs: "db:{}:schema:None:table_list",
        attribute_in_key="id",
    )
    def get_all_table_names_in_database(
        self, cache: bool = False, cache_timeout: Optional[bool] = None, force=False
    ) -> List[utils.DatasourceName]:
        """Parameters need to be passed as keyword arguments."""
        if not self.allow_multi_schema_metadata_fetch:
            return []
        return self.db_engine_spec.get_all_datasource_names(self, "table")

    @cache_util.memoized_func(
        key=lambda *args, **kwargs: "db:{}:schema:None:view_list",
        attribute_in_key="id",  # type: ignore
    )
    def get_all_view_names_in_database(
        self,
        cache: bool = False,
        cache_timeout: Optional[bool] = None,
        force: bool = False,
    ) -> List[utils.DatasourceName]:
        """Parameters need to be passed as keyword arguments."""
        if not self.allow_multi_schema_metadata_fetch:
            return []
        return self.db_engine_spec.get_all_datasource_names(self, "view")

    @cache_util.memoized_func(
        key=lambda *args, **kwargs: f"db:{{}}:schema:{kwargs.get('schema')}:table_list",  # type: ignore
        attribute_in_key="id",
    )
    def get_all_table_names_in_schema(
        self,
        schema: str,
        cache: bool = False,
        cache_timeout: int = None,
        force: bool = False,
    ) -> List[utils.DatasourceName]:
        """Parameters need to be passed as keyword arguments.

        For unused parameters, they are referenced in
        cache_util.memoized_func decorator.

        :param schema: schema name
        :param cache: whether cache is enabled for the function
        :param cache_timeout: timeout in seconds for the cache
        :param force: whether to force refresh the cache
        :return: list of tables
        """
        try:
            tables = self.db_engine_spec.get_table_names(
                database=self, inspector=self.inspector, schema=schema
            )
            return [
                utils.DatasourceName(table=table, schema=schema) for table in tables
            ]
        except Exception as e:  # pylint: disable=broad-except
            logger.exception(e)

    @cache_util.memoized_func(
        key=lambda *args, **kwargs: f"db:{{}}:schema:{kwargs.get('schema')}:view_list",  # type: ignore
        attribute_in_key="id",
    )
    def get_all_view_names_in_schema(
        self,
        schema: str,
        cache: bool = False,
        cache_timeout: int = None,
        force: bool = False,
    ) -> List[utils.DatasourceName]:
        """Parameters need to be passed as keyword arguments.

        For unused parameters, they are referenced in
        cache_util.memoized_func decorator.

        :param schema: schema name
        :param cache: whether cache is enabled for the function
        :param cache_timeout: timeout in seconds for the cache
        :param force: whether to force refresh the cache
        :return: list of views
        """
        try:
            views = self.db_engine_spec.get_view_names(
                database=self, inspector=self.inspector, schema=schema
            )
            return [utils.DatasourceName(table=view, schema=schema) for view in views]
        except Exception as e:  # pylint: disable=broad-except
            logger.exception(e)

    @cache_util.memoized_func(
        key=lambda *args, **kwargs: "db:{}:schema_list", attribute_in_key="id"
    )
    def get_all_schema_names(
        self,
        cache: bool = False,
        cache_timeout: Optional[int] = None,
        force: bool = False,
    ) -> List[str]:
        """Parameters need to be passed as keyword arguments.

        For unused parameters, they are referenced in
        cache_util.memoized_func decorator.

        :param cache: whether cache is enabled for the function
        :param cache_timeout: timeout in seconds for the cache
        :param force: whether to force refresh the cache
        :return: schema list
        """
        print('打印的必要元素',self.inspector)
        return self.db_engine_spec.get_schema_names(self.inspector)

    @property
    def db_engine_spec(self) -> Type[db_engine_specs.BaseEngineSpec]:
        return db_engine_specs.engines.get(self.backend, db_engine_specs.BaseEngineSpec)#backend是直接拿到后端的名字
    #engines是一个字典里面存储
    @classmethod
    def get_db_engine_spec_for_backend(
        cls, backend
    ) -> Type[db_engine_specs.BaseEngineSpec]:
        return db_engine_specs.engines.get(backend, db_engine_specs.BaseEngineSpec)#获取了这个后端key对应的继承于BaseEngineSpec的value

    def grains(self) -> Tuple[TimeGrain, ...]:
        """Defines time granularity database-specific expressions.

        The idea here is to make it easy for users to change the time grain
        from a datetime (maybe the source grain is arbitrary timestamps, daily
        or 5 minutes increments) to another, "truncated" datetime. Since
        each database has slightly different but similar datetime functions,
        this allows a mapping between database engines and actual functions.
        """
        return self.db_engine_spec.get_time_grains()

    def get_extra(self) -> Dict[str, Any]:
        return self.db_engine_spec.get_extra_params(self)#拿到用户输入的连接某些数据库额外需要的东西

    def get_encrypted_extra(self):
        encrypted_extra = {}
        if self.encrypted_extra:
            try:
                encrypted_extra = json.loads(self.encrypted_extra)
            except json.JSONDecodeError as e:
                logger.error(e)
                raise e
        return encrypted_extra

    def get_table(self, table_name: str, schema: Optional[str] = None) -> Table:
    #niaho ni 
        extra = self.get_extra()
        meta = MetaData(**extra.get("metadata_params", {}))
        if self.database_kind:
            return self.get_sqla_engine()
        if self.if_materialize:
            sql1 = 'show sources'
            sql2 = 'show views;'
    #print(sql)
            r1 = self.get_sqla_engine().execute(sql2)
            r2 = self.get_sqla_engine().execute(sql1)
            table = []
            for i in r1:
                table.append(i[0])
                print(i)
            for i in r2:
                table.append(i[0])
                print(i)
            if table_name not in table:
                ex = Exception("the table you entered is neither in sources nor views")
                raise ex
            else:
                sql = 'show columns from '+table_name+';'
                r = self.get_sqla_engine().execute(sql)
                columns = []
                for i in r:
                    columns.append(
                        ViewColumn(
                            i[0],
                            i[1],
                            i[2]
                        )
                    )

                return VIEWS_SOURCES(
                    name = table_name,
                    columns = columns
                )
        else:
            return Table(
                table_name,
                meta,
                schema=schema or None,
                autoload=True,
                autoload_with=self.get_sqla_engine(),
            )

    def get_columns(
        self, table_name: str, schema: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        return self.db_engine_spec.get_columns(self.inspector, table_name, schema)

    def get_indexes(
        self, table_name: str, schema: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        return self.inspector.get_indexes(table_name, schema)

    def get_pk_constraint(
        self, table_name: str, schema: Optional[str] = None
    ) -> Dict[str, Any]:
        return self.inspector.get_pk_constraint(table_name, schema)

    def get_foreign_keys(
        self, table_name: str, schema: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        return self.inspector.get_foreign_keys(table_name, schema)

    def get_schema_access_for_csv_upload(  # pylint: disable=invalid-name
        self,
    ) -> List[str]:
        return self.get_extra().get("schemas_allowed_for_csv_upload", [])

    @property
    def sqlalchemy_uri_decrypted(self) -> str:#相当于返回了一个url的连接对象
        conn = sqla.engine.url.make_url(self.sqlalchemy_uri)
        #print('这是解密以后的',conn)
        if custom_password_store:
            conn.password = custom_password_store(conn)
        else:
            conn.password = self.password
        #print('这是解密以后的',conn)
        return str(conn)

    @property
    def sql_url(self) -> str:
        return f"/superset/sql/{self.id}/"

    def get_perm(self) -> str:
        return f"[{self.database_name}].(id:{self.id})"

    def has_table(self, table: Table) -> bool:
        engine = self.get_sqla_engine()
        return engine.has_table(table.table_name, table.schema or None)

    def has_table_by_name(self, table_name: str, schema: Optional[str] = None) -> bool:
        engine = self.get_sqla_engine()
        return engine.has_table(table_name, schema)

    @utils.memoized
    def get_dialect(self) -> Dialect:
        sqla_url = url.make_url(self.sqlalchemy_uri_decrypted)
        return sqla_url.get_dialect()()#返回SQLAlchemy Dialect 类与此URL的驱动程序名称相对应


sqla.event.listen(Database, "after_insert", security_manager.set_perm)
sqla.event.listen(Database, "after_update", security_manager.set_perm)


class Log(Model):  # pylint: disable=too-few-public-methods

    """ORM object used to log Superset actions to the database"""

    __tablename__ = "logs"

    id = Column(Integer, primary_key=True)  # pylint: disable=invalid-name
    action = Column(String(512))
    user_id = Column(Integer, ForeignKey("ab_user.id"))
    dashboard_id = Column(Integer)
    slice_id = Column(Integer)
    json = Column(Text)
    user = relationship(
        security_manager.user_model, backref="logs", foreign_keys=[user_id]
    )
    dttm = Column(DateTime, default=datetime.utcnow)
    duration_ms = Column(Integer)
    referrer = Column(String(1024))


class FavStar(Model):  # pylint: disable=too-few-public-methods
    __tablename__ = "favstar"

    id = Column(Integer, primary_key=True)  # pylint: disable=invalid-name
    user_id = Column(Integer, ForeignKey("ab_user.id"))
    class_name = Column(String(50))
    obj_id = Column(Integer)
    dttm = Column(DateTime, default=datetime.utcnow)

# events for updating tags
if is_feature_enabled("TAGGING_SYSTEM"):
    sqla.event.listen(Dashboard, "after_insert", DashboardUpdater.after_insert)
    sqla.event.listen(Dashboard, "after_update", DashboardUpdater.after_update)
    sqla.event.listen(Dashboard, "after_delete", DashboardUpdater.after_delete)
    sqla.event.listen(FavStar, "after_insert", FavStarUpdater.after_insert)
    sqla.event.listen(FavStar, "after_delete", FavStarUpdater.after_delete)
