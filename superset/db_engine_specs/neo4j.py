from sqlalchemy.engine.url import URL
from py2neo import Cursor,GraphService
from superset.db_engine_specs.base import BaseEngineSpec
from typing import List,Optional,Type,Any,Dict
from sqlalchemy import column, DateTime, select
from sqlalchemy.engine.base import Engine
from sqlalchemy.engine.interfaces import Compiled, Dialect
from sqlalchemy.engine.reflection import Inspector
from sqlalchemy.engine.url import URL
from sqlalchemy.ext.compiler import compiles
from sqlalchemy.orm import Session
from sqlalchemy.sql import quoted_name, text
from sqlalchemy.sql.expression import ColumnClause, ColumnElement, Select, TextAsFrom
from sqlalchemy.types import TypeEngine

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
    def fetch_data(cls) -> List[Dict]:

        #这个cursor和cursor不是一个概念，是py2neo中的的缓存
        nodes = []
        links = []
        cursor_data = cls.cursor.data()
        #print('拿到了游标数据',cursor_data)

        for item in cursor_data:
            node = {}
            link = {}
            if item['r']:
                node1 = {}
                node2 = {}
                link = {}
                s_node = item['r'].start_node
                e_node = item['r'].end_node
                r_link = item['r']

                node1['label'] = str(s_node.labels).replace(':','')
                keys = s_node.keys()
                for key in keys:
                    node1[key] = s_node[key]

                node2['label'] = str(e_node.labels).replace(':','')
                keys = e_node.keys()
                for key in keys:
                    node2[key] = e_node[key]
                
                link['from'] = str(node1['id'])
                link['to'] = str(node2['id'])
                keys = r_link.keys()
                for key in keys:
                    link[key] = r_link[key]
                if node1 not in nodes:
                    nodes.append(node1)
                if node2 not in nodes:
                    nodes.append(node2)
                links.append(link)
            elif item.keys()[0]=='n':
                node['label'] = str(item['n'].labels).replace(':','')
                keys = item['n'].keys()
                for key in keys:
                    node[key] = item['n'][key]
                nodes.append(node)        
        data = {
            'nodes':nodes,
            'links':links
        }
        print(data,'打印的数据库返回数据')
        return data#是一个列表

    @classmethod
    def get_table_names(cls, database: "Database", inspector: GraphService, schema: Optional[str]
    ) -> List[str]:
        return sorted([inspector.default_graph.name])

    #重写根据方言创建的一条查询语句，图数据库的方言应该是Cypher
    @classmethod
    def select_star(  # pylint: disable=too-many-arguments,too-many-locals
    #图数据库传入的engine是GraphSevers，一般参数只传入一个table_name
        cls,
        database: "Database",
        table_name: str,
        engine: GraphService,
        schema: Optional[str] = None,
        limit: int = 100,
        show_cols: bool = False,
        indent: bool = True,
        latest_partition: bool = True,
        cols: Optional[List[Dict[str, Any]]] = None,
    ) -> str:
        """
        重写后的函数只考虑图数据库，查询所有关系即可返回所有信息，
        有查询个数限制的时候加上个数限制即可。
        """
        cypher = "MATCH p=()-->() RETURN p"
        if limit:
            cypher = cypher+" LIMIT "+str(limit)
        return cypher