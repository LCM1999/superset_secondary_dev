import json
import pymysql
import random
import string
import time

# def get_data():
#     with open('E:\\QQ文档\\1420944066\\FileRecv\\Code (2)\\data\\nice looking data\\与gooddata里重复\\20_30(1).json', 'r') as f:
#         camera_text = json.load(f)  # 解析每一行数据
#     print(camera_text)
#     return camera_text
    

# def data_insert(text):
#     db = pymysql.connect(host = "localhost",user = "root",password = "lxyroot",database = "superset-test")
#     cur = db.cursor()
#     try:
#         cur.execute("drop table liutu_data")
#         cur.execute("create table liutu_data(id int,name char(20),fillcolor char(20),time char(20),size_data TINYTEXT)")
#     except:
#         cur.execute("create table liutu_data(id int,name char(20),fillcolor char(20),time char(20),size_data TINYTEXT)")
#     for i in text:
#         for j in range(0,len(text[0]['size'])):
#             sql="INSERT INTO liutu_data (id,name,fillcolor,time,size_data) VALUES ('"+str(i['id'])+"','"+i['name']+"','"+i['fillcolor']+"','"+str(j)+"','"+str(i['size'][j])+"');"
#             cur.execute(sql)
#     db.commit()
#     cur.close()

def new_table():
    db = pymysql.connect(host = "10.0.2.15",user = "mysqluser",password = "mysqlpw",database = "inventory")
    cur = db.cursor()
    #cur.execute("drop table refresh_data")
    cur.execute("create table refresh_data(id int,name char(20),email char(20),view_data char(30))")
    for i in range(0,30):
        name = ''.join(random.sample(string.ascii_letters + string.digits, 8))
        email = random.choice('abcdefghijklmnopqrstuvwxyz!@#$%^&*()')
        view_data = random.random()*100
        sql="INSERT INTO refresh_data (id,name,email,view_data) VALUES ("+str(i)+",'"+name+"','"+email+"','"+str(view_data)+"');"
        print(sql)
        cur.execute(sql)
    db.commit()
    return cur,db

def data_update(cur,update_num,db):
    for i in range(0,update_num):
        view_data = random.random()*100
        sql = 'update refresh_data set view_data="'+str(view_data)+'" where id='+str(random.randint(1,30))+';'
        cur.execute(sql)
        db.commit()


if __name__ == "__main__": 
    cur,db = new_table()
    i = 0
    while 1==1:
        time.sleep(5)
        print('one update')
        data_update(cur,20,db)
        i = i+1
