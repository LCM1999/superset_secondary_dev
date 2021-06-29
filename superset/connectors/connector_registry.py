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
from collections import OrderedDict
from typing import Dict, List, Optional, Set, Type, TYPE_CHECKING

from sqlalchemy import or_
from sqlalchemy.orm import Session, subqueryload

if TYPE_CHECKING:
    # pylint: disable=unused-import
    from superset.models.core import Database
    from superset.connectors.base.models import BaseDatasource


class ConnectorRegistry:
    """ Central Registry for all available datasource engines
    所有可用数据源引擎的中央注册表"""

    sources: Dict[str, Type["BaseDatasource"]] = {} #表明键值对的数据类型

    @classmethod
    def register_sources(cls, datasource_config: OrderedDict) -> None:
        for module_name, class_names in datasource_config.items():
            class_names = [str(s) for s in class_names]
            module_obj = __import__(module_name, fromlist=class_names)
            for class_name in class_names:
                source_class = getattr(module_obj, class_name)#返回的是一个对象属性值，第一个参数是对象，第二个参数是参数名字
                cls.sources[source_class.type] = source_class

    @classmethod#用cls表示class，表示可以通过类直接调用；
    def get_datasource(
        cls, datasource_type: str, datasource_id: int, session: Session
    ) -> "BaseDatasource":
        #print('这是打印的'+str(cls.sources[datasource_type]))#只要是利用table添加chart的数据源，就只能拿到sqla的模型内容
        #cls.sources[datasource_type]直接抓取了connectors中sqla下面models.py中的父类是BaseDatesource，元素yype是datasource_type的类
        #query函数可以接受多种参数类型。可以是类，或者是类的instrumented descriptor。
        #print("阿尔带件衣服过去玩",session.query(cls.sources[datasource_type]).filter_by(id=datasource_id).all())
            
        return (
            session.query(cls.sources[datasource_type])
            .filter_by(id=datasource_id)
            .one()
        )#返回通过orm查询的数据库中Tables表中的table_name

    @classmethod
    #在选择数据源的时候返回所有table数据源要用的到
    def get_all_datasources(cls, session: Session) -> List["BaseDatasource"]:
        datasources: List["BaseDatasource"] = []
        for source_type in ConnectorRegistry.sources:
            source_class = ConnectorRegistry.sources[source_type]
            print(source_class)
            print('这是打印的')
            qry = session.query(source_class)
            print(qry)
            qry = source_class.default_query(qry)
            datasources.extend(qry.all())##返回所有符合结果的orm对象 
        return datasources

    @classmethod
    def get_datasource_by_name(  # pylint: disable=too-many-arguments
        cls,
        session: Session,
        datasource_type: str,
        datasource_name: str,
        schema: str,
        database_name: str,
    ) -> Optional["BaseDatasource"]:
        datasource_class = ConnectorRegistry.sources[datasource_type]
        return datasource_class.get_datasource_by_name(
            session, datasource_name, schema, database_name
        )

    @classmethod
    def query_datasources_by_permissions(  # pylint: disable=invalid-name
        cls,
        session: Session,
        database: "Database",
        permissions: Set[str],
        schema_perms: Set[str],
    ) -> List["BaseDatasource"]:
        # TODO(bogdan): add unit test
        datasource_class = ConnectorRegistry.sources[database.type]
        return (
            session.query(datasource_class)
            .filter_by(database_id=database.id)
            .filter(
                or_(
                    datasource_class.perm.in_(permissions),
                    datasource_class.schema_perm.in_(schema_perms),
                )
            )
            .all()
        )

    @classmethod
    def get_eager_datasource(
        cls, session: Session, datasource_type: str, datasource_id: int
    ) -> "BaseDatasource":
        """Returns datasource with columns and metrics.
        返回带列和指标的数据源"""
        datasource_class = ConnectorRegistry.sources[datasource_type]
        return (
            session.query(datasource_class)
            .options(
                subqueryload(datasource_class.columns),
                subqueryload(datasource_class.metrics),
            )
            .filter_by(id=datasource_id)
            .one()
        )

    @classmethod
    def query_datasources_by_name(
        cls,
        session: Session,
        database: "Database",
        datasource_name: str,
        schema: Optional[str] = None,
    ) -> List["BaseDatasource"]:
        datasource_class = ConnectorRegistry.sources[database.type]
        return datasource_class.query_datasources_by_name(
            session, database, datasource_name, schema=schema
        )
