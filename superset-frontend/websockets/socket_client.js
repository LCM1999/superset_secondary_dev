
import { allowCrossDomain as allowDomainSharding } from '../src/utils/hostNamesConfig';
import getClientErrorObject from '../src/utils/getClientErrorObject';
import { isFeatureEnabled, FeatureFlag } from 'src/featureFlags';
import { SupersetClient } from '@superset-ui/connection';
import { KAFKA_MYSQL } from './config';

//需要在服务器创建名称空间，现在计划创建chart的和sqllab的
var NAMESPANCES = []
var SOCKET = []

export function creat_namespaces_socket(payload,namespaces,lastQuery,UpdateChart){
    const socket_id = payload.slice_id//针对每个不同的的socket给定一个id(由slice_id决定)
    let urlNamespaces  = ''
    if(KAFKA_MYSQL){
      urlNamespaces = namespaces+'/kafka'
    }
    else{
      urlNamespaces = namespaces
    }
    const url = 'ws://localhost:5000/'+urlNamespaces
    console.log('打印的url',url)
    const socket =  new WebSocket(url);

    payload = {
        ...payload,
        ...lastQuery
    }
    socket.onopen = function(e) {
      console.log('链接成功')
      socket.send(JSON.stringify(payload));
    };

    register_event(socket,socket_id,UpdateChart)//注册链接事件相应函数

    //const respon = post_http(payload)//发起一个post请求
    console.log('全局变量',socket)
    const skInstance = { socket_id: socket_id , sk:socket ,namespace: namespaces}
    SOCKET.push(skInstance)
    return socket_id
}


export function test_var_socket(slice_id){//每个chart slice只允许同时存在一个socket链接
   var ifSocketAlive = false
   SOCKET.forEach(IfAlive)
      function IfAlive(value){
         if (value.socket_id == slice_id && ifSocketAlive == false){
            ifSocketAlive = true
         }
      }
   console.log('全局变量',SOCKET)
   return ifSocketAlive
}

function post_http(payload){
   const controller = new AbortController();
   const {signal} = controller;
   const url = 'http://127.0.0.1:5000/superset/websocket/test'
   const timeout = 10;
   const method = 'POST'
   let querySettings = {
      url,
      postPayload: { form_data: payload },
      signal,
      timeout: timeout * 1000,
    };
    if (allowDomainSharding) {
      querySettings = {
        ...querySettings,
        mode: 'cors',
        credentials: 'include',
      };
    }

    const clientMethod =
      method === 'GET' && isFeatureEnabled(FeatureFlag.CLIENT_CACHE)
        ? SupersetClient.get
        : SupersetClient.post;
    const queryPromise = clientMethod(querySettings)
    .then(({json})=>{
      console.log('打印的后端返回结果',json)
      const rep = 'ok'
      return rep
    })
    .catch(response => {
      if (response.statusText === 'timeout') {
        return response.statusText
      } else if (response.name === 'AbortError') {
        return response.name
      }
      return getClientErrorObject(response).then(parsedResponse => {
        return parsedResponse
      });
    });
}

function register_event(socket,socket_id,UpdateChart){
   socket.onmessage = function(event) {
      if (event.data == 'ping'){
      console.log(`链接健康 ${event.data}`);
      }
      //这里加入错误显示函数，从chart的action调用即可，前端我已经写好了错误信息回传,因为时间原因这里暂时不做修缮
      else{
         console.log('shuxinyemian')
         const jsonData = JSON.parse(event.data)
         UpdateChart(jsonData,socket_id)
      }
    };
   socket.onerror = function(error) {
      console.log(`[socket真的关闭了！！！:] ${error.message}`);
    };
}

function emit_formdata(payload,sk,namespaces){
   sk.emit('cookie',payload)
}

export function delete_namespaces_socket(namespaces,id = 9999){
   SOCKET.forEach((value) =>{
      //console.log('测试namespaces',namespaces)
      if (value.namespace == namespaces){
         id = value.socket_id
      }

   })
   //console.log('测试id的值',id)
   if(id == 9999){
      console.log('不存在id不用删除')
   }
   else{
      SOCKET.forEach(shutdown_socket)
      SOCKET = SOCKET.filter(delete_socket)

      function shutdown_socket(value){//关闭socket连接
         if (value.socket_id==id){
            value.sk.close()
            if (value.sk.readyState != value.sk.OPEN) {
               console.log("客户端连接已经单向关闭")
           }
         }
      }

      function delete_socket(value,index,array){//将socket连接从SOCKET组中删除
         return value.socket_id != id
      }
      console.log('test全局变量',SOCKET)
   }
}