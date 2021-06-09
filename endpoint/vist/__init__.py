from flask import Flask
from flask_session import Session
from config import config_map
import redis
import logging
from flask_wtf import CSRFProtect
from logging.handlers import RotatingFileHandler
from vist.utils.commons import ReConverter
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate, MigrateCommand
from flask_script import Shell, Manager
from flask_socketio import SocketIO
from flask_cors import CORS


# 日志  current_app.logger.error('msg warn info debug')
logging.basicConfig(level=logging.WARN)  # DEBUG 及其以上级别记录, 当处于 develop 模式时不生效
file_log_handler = RotatingFileHandler('logs/log', maxBytes=1024*1024*100, backupCount=10)  # 1000M
formatter = logging.Formatter('%(levelname)s %(filename)s:%(lineno)d %(message)s')
file_log_handler.setFormatter(formatter)
logging.getLogger().addHandler(file_log_handler)

# MySQL
db = SQLAlchemy()

# Redis
redis_store = None

# websocket
socketio = None

def create_app(config_name, script=False):
    """

    :param config_name:
    :return:
    """
    config_class = config_map.get(config_name)
    app = Flask(__name__)
    app.config.from_object(config_class)
    
    # websocket
    global socketio
    socketio = SocketIO(app)
    
    # CSRF
    # 从cookie中获取 csrf_token, 从请求体中获取 csrf_token 两者比较(400错误)
    # request.data.get
    # request.form.get 只能获取表单 CSRF 默认
    # csrf_token 可存放到请求头中 X-CSRFToken: ""
    # CSRFProtect(app)
    # 允许跨域
    CORS(app, supports_credentials=True)

    # 数据库迁移
    manager = Manager(app)
    #第一个参数是Flask的实例，第二个参数是Sqlalchemy数据库实例
    migrate = Migrate(app, db) 

    #manager是Flask-Script的实例，这条语句在flask-Script中添加一个db命令
    manager.add_command('db', MigrateCommand)
    
    # MySQL
    db.init_app(app)

    # Redis
    global redis_store
    redis_store = redis.StrictRedis(host=config_class.REDIS_HOST, port=config_class.REDIS_PORT)

    # flask-session
    Session(app)

    # 为flask添加自定义的转换器
    app.url_map.converters["re"] = ReConverter

    # 静态文件
    from vist import web_html
    app.register_blueprint(web_html.html)
    
    # api
    from vist import api_1_0
    app.register_blueprint(api_1_0.api, url_prefix='/vist/api/v1.0')

    if script:
        from vist import utils
        return manager
    return app

