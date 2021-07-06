from superset.db_engine_specs import BaseEngineSpec
from typing import List, Optional, Type, Any, Dict
from py2neo.cypher import Cursor
from py2neo import GraphService


class Neo4jEngineSpec(BaseEngineSpec):
    engine = "http"
    engine_name = "Neo4j"
    max_column_name_length = 0
    cursor: Optional[Type[Cursor]]

    default_driver = "py2neo"
    sqlalchemy_uri_placeholder = (
        "http://user:password@host:port"
    )

    @classmethod
    def get_schema_names(cls, inspector: GraphService) -> List[str]:
        return sorted([inspector.default_graph.name])

    # overwrite sql execute func
    @classmethod
    def execute(cls, cursor: Any, query: str, **kwargs: Any) -> None:
        """
        Execute a Cypher query

        :param cursor: actually is a graph engine
        :param query: Query to execute
        :param kwargs: parameters to be passed to cursor.execute()
        :return:
        """
        cls.cursor = cursor.run(query)

    @classmethod
    def fetch_data(cls) -> List[Dict]:
        nodes = []
        links = []
        cursor_data = cls.cursor.data()
        print('Cursor Data: ', cursor_data)

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

                node1['label'] = str(s_node.labels).replace(':', '')
                keys = s_node.keys()
                for key in keys:
                    node1[key] = s_node[key]

                node2['label'] = str(e_node.labels).replace(':', '')
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
            elif item.keys()[0] == 'n':
                node['label'] = str(item['n'].labels).replace(':', '')
                keys = item['n'].keys()
                for key in keys:
                    node[key] = item['n'][key]
                nodes.append(node)

        data = {
            'nodes': nodes,
            'links': links
        }
        print(data, " Dataset Response")
        return data

    @classmethod
    def get_table_names(
        cls, database: "Database", inspector: GraphService, schema: Optional[str]
    ) -> List[str]:
        return sorted([inspector.default_graph.name])

    # Generate a Cypher to query all relationship
    @classmethod
    def select_star(  # pylint: disable=too-many-arguments,too-many-locals
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
        cypher = "MATCH p=()-->() RETURN p"
        if limit:
            cypher = cypher + " LIMIT " + str(limit)
        return cypher
