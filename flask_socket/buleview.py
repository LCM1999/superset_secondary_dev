from flask import Blueprint
from superset.exceptions import (
    SupersetException,
)

from superset.utils import core as utils
from superset.views.base import json_error_response, CsvResponse, generate_download_headers, data_payload_response

from superset.views.utils import (
    apply_display_max_row_limit,
    bootstrap_user_data,
    get_datasource_info,
    get_form_data,
    get_viz,#获取图表类型
)
import json
import time
import operator
from .kafka_customer import (
    create_kafka_consumer,
    massage_do,
    latest_kafka,
    set_timeout,
)
import time
import geventwebsocket

ws = Blueprint(r'ws', __name__)


def generate_json(
        viz_obj
):
    payload = viz_obj.get_payload()  # payload是已经包含了完全的要相应的信息包括语句，查询结果等等
    return payload

@ws.route('/chart')
def chart_socket(socket):
    form_data = json.loads(socket.receive())#only once receive
    lastQuery = form_data['data']
    datasource_id = None
    datasource_type = None
    try:
        datasource_id, datasource_type = get_datasource_info(
            datasource_id, datasource_type, form_data
        )
    except SupersetException as e:
        socket.send(utils.error_msg_from_exception(e))
        socket.close()
        print('链接因为错误已经关闭了')
    viz_obj = get_viz(
        datasource_type=datasource_type,
        datasource_id=datasource_id,
        form_data=form_data,
        force='false',
        )
    while not socket.closed:
        try:
            newquery = generate_json(viz_obj)
            newquerydata = newquery['data']
            if operator.eq(newquerydata, lastQuery):
                print('结果相同不用传输')
            else:
                print('结果不同，返回新数据')
                lastQuery = newquerydata#更新数据
                socket.send(json.dumps(newquery))
            data = 'ping'
            time.sleep(2)  # sop 2s
            socket.send(data)  # 定时心跳检测推送
        except geventwebsocket.exceptions.WebSocketError:
            print('链接已经关闭了')  # socket前端关闭链接，后端不知情继续传递消息会报错，我们捕捉这个消息打印链接关闭并跳出循环
            break

@ws.route('/chart/kafka')
def kafka_chart_socket(socket):
    form_data = json.loads(socket.receive())#only once receive
    lastQuery = form_data['data']
    datasource_id = None
    datasource_type = None
    try:
        datasource_id, datasource_type = get_datasource_info(
            datasource_id, datasource_type, form_data
        )
    except SupersetException as e:
        socket.send(utils.error_msg_from_exception(e))
        socket.close()
        print('链接因为错误已经关闭了')

    try:
        cs = create_kafka_consumer()
    except Exception as e:
        error = 'kafka reeor:'+str(e)
        socket.send(error)
        socket.colse()
        print('链接因为错误已经关闭了')

    print('create kafka consymer success')
    print(cs.topics())

    def function_do_query(i):
        return True

    def after_timeout(): # 超时后的处理函数
        print("Time out!,jingzingPINGJjiance")
        data = 'ping'
        socket.send(data)  # 定时心跳检测推送

    def new_massage_do(cs,function_do,i):#之前调试的多余函数可以删除
        result = massage_do(cs,function_do,i)
        print(result)
        return result

    viz_obj = get_viz(
        datasource_type=datasource_type,
        datasource_id=datasource_id,
        form_data=form_data,
        force='false',
            )
    latest_kafka(cs)



    while not socket.closed:
        try:
            newquery = new_massage_do(cs,function_do_query,viz_obj)#防止查询时间过长引起的超时
            print('打印的标志',newquery)
            if newquery:
                print('执行了这一个了')
                newquery = generate_json(viz_obj)
                socket.send(json.dumps(newquery))
        except UnboundLocalError:#没有消息就不会调用消息触发函数就没有返回值，会触发返回值没赋值就调用的错误
            after_timeout()
        except geventwebsocket.exceptions.WebSocketError:
            print('链接已经关闭了')  # socket前端关闭链接，后端不知情继续传递消息会报错，我们捕捉这个消息打印链接关闭并跳出循环
            break
        

