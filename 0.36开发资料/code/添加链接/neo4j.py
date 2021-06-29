from sqlalchemy.engine.url import URL
from py2neo import *
from superset.db_engine_specs.base import BaseEngineSpec
from typing import List,Optional,Type,Any,Dict

class Neo4jEngineSpec(BaseEngineSpec):
    engine = "http"
    max_column_name_length = 999#暂时不清楚功能大点好
    cursor : Optional[Type[Cursor]] #新增Cursor存储查询到的数据。我们不把数据放在游标中因为没有用到游标

    @classmethod
    def get_schema_names(cls, inspector: GraphService) -> List[str]:
        """
        Get all schemas from database

        :param inspector: SqlAlchemy inspector
        :return: All schemas in the database
        """
        return sorted([inspector.default_graph.name])

    #重写查询语句执行功能    
    @classmethod
    def execute(cls, cursor: Any, query: str, **kwargs: Any) -> None:
        """
        Execute a Cypher query

        :param cursor: actullay is a graph engine
        :param query: Query to execute
        :param kwargs: kwargs to be passed to cursor.execute()
        :return:
        """
        cls.cursor = cursor.run(query)
    
    @classmethod
    def fetch_data(cls, cursor: Any, limit: int) -> List[Dict]:
        """

        :param cursor: Cursor instance
        :param limit: Maximum number of rows to be returned by the cursor
        :return: Result of query
        """
        #这个cursor和cursor不是一个概念，是py2neo中的的缓存
        return cls.cursor.data()#是一个列表