from superset.app import create_app

superset = create_app()

#se this run app by py file
# if __name__ == '__main__':
#     app = create_app()
#     from gevent import pywsgi
#     from geventwebsocket.handler import WebSocketHandler
#     server = pywsgi.WSGIServer(('', 5000), app, handler_class=WebSocketHandler)
#     server.serve_forever()
#     gunicorn -k flask_sockets.worker --bind 127.0.0.1:5000 run:superset