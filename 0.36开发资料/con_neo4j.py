from py2neo import *           # *中常用的是Node,Relationship,Graph
from contextlib import closing
from datetime import datetime
import pytz
from typing import List,Optional,Type
import re
import logging
logger = logging.getLogger(__name__)

cursor : Optional[Type[Cursor]]
try:
    if (Graph('http://neo4j:asd134679852@127.0.0.1:7474')):
        engine = Graph('http://neo4j:asd134679852@127.0.0.1:7474')
        ceshi = GraphService('http://neo4j:asd134679852@127.0.0.1:7474')
        # print(ceshi.default_graph.name)
        matcher = NodeMatcher(engine)
        #node = matcher.match('香港大公网')
        a = Node("Person", name="Bob")
        # print(engine.exists(a))
        #print (list(node))
        # print("{}".format('hello')[1:])
        del engine  # close the connection pool
        logger.debug('这是一个debug')
        graph = ceshi.default_graph
        cypher = 'MATCH p=()-[r:`包含`]->() RETURN r LIMIT 10'
        if_code = 'RETURN n'
        cursor = graph.run(cypher)
        # for item in cursor:
        #     print(item['p'].start_node)
        #     print(item['p'].end_node)
        #     print(item['p'].relationships)
        # if re.search(if_code,cypher):
        number = 0
        print('执行完了')
        #print(cursor.data())
        data = cursor.data()
        print('开始进入循环')
        for item in data:
            if item['r']:
                number = number+1
                print(item['r'])
            node = {}
            #number = number+1
            # if item.keys()[0]=='p':
            #     node1 = {}
            #     node2 = {}
            #     link = {}
            #     s_node = item['p'].start_node
            #     e_node = item['p'].end_node
            #     r_link = item['r']

            #     node1['label'] = str(s_node.labels).replace(':','')
            #     keys = s_node.keys()
            #     for key in keys:
            #         node1[key] = s_node[key]

            #     node2['label'] = str(e_node.labels).replace(':','')
            #     keys = e_node.keys()
            #     for key in keys:
            #         node2[key] = e_node[key]
                
            #     link['from'] = str(node1['id'])
            #     link['to'] = str(node2['id'])
            #     keys = r_link.keys()
            #     for key in keys:
            #         link[key] = r_link[key]

            #     # print(node1)
            #     # print(node2)
            #     #print(link)              
            # elif item.keys()[0]=='n':
            #     node['label'] = str(item['n'].labels).replace(':','')
            #     keys = item['n'].keys()
            #     for key in keys:
            #         node[key] = item['n'][key]
            if number%100 == 0:
                print(number)
        if None:
            print('执行了')



except ClientError as e:
    print("password error！")  


# def _serialize_and_expand_data(
#     result_set,#直接注释掉默认的类因为可能会输入S_neo4j类: SupersetResultSet,
#     db_engine_spec: BaseEngineSpec,
#     use_msgpack: Optional[bool] = False,
#     expand_data: bool = False,
# ) -> Tuple[Union[bytes, str], list, list, list]:
#     selected_columns: List[Dict] = result_set.columns
#     expanded_columns: List[Dict]

#     if use_msgpack:
#         with stats_timing(
#             "sqllab.query.results_backend_pa_serialization", stats_logger
#         ):
#             data = (
#                 pa.default_serialization_context()
#                 .serialize(result_set.pa_table)
#                 .to_buffer()
#                 .to_pybytes()
#             )

#         # expand when loading data from results backend
#         all_columns, expanded_columns = (selected_columns, [])
#     else:
#         df = result_set.to_pandas_df()
#         data = df_to_records(df) or []

#         if expand_data:
#             all_columns, data, expanded_columns = db_engine_spec.expand_data(
#                 selected_columns, data
#             )
#         else:
#             all_columns = selected_columns
#             expanded_columns = []

#     return (data, selected_columns, all_columns, expanded_columns)