from kafka import KafkaConsumer,TopicPartition
import json
import time
import signal
import time
import timeout_decorator
import geventwebsocket


def set_timeout(num, callback):
  def wrap(func):
    def handle(signum, frame): # 收到信号 SIGALRM 后的回调函数，第一个参数是信号的数字，第二个参数是the interrupted stack frame.
      raise RuntimeError
    def to_do(*args, **kwargs):
      try:
        signal.signal(signal.SIGALRM, handle) # 设置信号和回调函数
        signal.alarm(num) # 设置 num 秒的闹钟
        #print('start alarm signal.')
        r = func(*args, **kwargs)
        #print('close alarm signal.')
        signal.alarm(0) # 关闭闹钟
        return r
      except RuntimeError as e:
        callback()
    return to_do
  return wrap
def after_timeout(): # 超时后的处理函数
  print("Time out!,jingzingPINGJjiance")

def create_kafka_consumer():
    consumer = KafkaConsumer('dbserver1.inventory.refresh_data',bootstrap_servers = ['localhost:9092'],auto_offset_reset  = 'latest',consumer_timeout_ms=2000)
    return consumer#限时 2 秒超时,主要用于定时检测websocket的健康

def latest_kafka(consumer,topic = "dbserver1.inventory.refresh_data"):
    consumer.poll(100)
    consumer.seek_to_end(TopicPartition(topic,0))


def function_do(i):
    return True


#在知晓数据库更新的时候短暂的延迟在进行查询，延迟时间可以自己确定，这样可以防止在短时间内更新多条数据时进行同等次数的查询
def massage_do(cs,function_do,i):#i在测试的时候表示更新次数,应用时表示的是一个执行函数要用到的对象
    for masg in cs:
      print('打印的kafka数据',masg)
      time.sleep(1)
      result = function_do(i)
      latest_kafka(cs)
      break
    return result


if __name__ == '__main__':
    cs = create_kafka_consumer()
    print('create kafka consymer success')
    print(cs.topics())
    ts = time.time()#huo qu dang qian shi jian chuo 
    latest_kafka(cs)
    i = 0
    while True:
      a = i
      i = massage_do (cs,function_do,i)
      if i:
        print(i)
      else:
        i = a

        