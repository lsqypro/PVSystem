"""
配置文件
# 获取配置
# 1. app.config.get
# 2. Config().
"""

import redis
from datetime import timedelta


# 服务配置
class Config(object):
    """配置信息"""
    # CSRF 随机字符
    SECRET_KEY = "XHSOI*Y9dfs9cshd9"

    # MySQL
    SQLALCHEMY_DATABASE_URI = "mysql://root:Password2_mysql@127.0.0.1:3306/vist_db"
    SQLALCHEMY_TRACK_MODIFICATIONS = True

    # redis
    REDIS_HOST = "127.0.0.1"
    REDIS_PORT = 6379
    
    # flask-session
    # https://flask-session.readthedocs.io/en/latest/
    SESSION_TYPE = "redis"
    SESSION_REDIS = redis.StrictRedis(host=REDIS_HOST, port=REDIS_PORT)
    SESSION_USE_SIGNER = True  # 对cookie中session_id进行隐藏处理
    PERMANENT_SESSION_LIFETIME = 86400  # session数据的有效期，单位秒

    # 文件缓存时间
    SEND_FILE_MAX_AGE_DEFAULT = timedelta(seconds=0)


class DevelopmentConfig(Config):
    """开发模式"""
    DEBUG = True


class ProductionConfig(Config):
    """生产模式"""


config_map = {
    'develop': DevelopmentConfig,
    'product': ProductionConfig
}


# 返回值
class RET(object):
    OK                  = "0"
    DBERR               = "4001"
    NODATA              = "4002"
    DATAEXIST           = "4003"
    DATAERR             = "4004"
    SESSIONERR          = "4101"
    LOGINERR            = "4102"
    PARAMERR            = "4103"
    USERERR             = "4104"
    ROLEERR             = "4105"
    PWDERR              = "4106"
    REQERR              = "4201"
    IPERR               = "4202"
    THIRDERR            = "4301"
    IOERR               = "4302"
    SERVERERR           = "4500"
    UNKOWNERR           = "4501"
    DATEERR             = "4601"


# 返回值说明
error_map = {
    RET.OK                    : u"成功",
    RET.DBERR                 : u"数据库查询错误",
    RET.NODATA                : u"无数据",
    RET.DATAEXIST             : u"数据已存在",
    RET.DATAERR               : u"数据错误",
    RET.SESSIONERR            : u"用户未登录",
    RET.LOGINERR              : u"用户登录失败",
    RET.PARAMERR              : u"参数错误",
    RET.USERERR               : u"用户不存在或未激活",
    RET.ROLEERR               : u"用户身份错误",
    RET.PWDERR                : u"密码错误",
    RET.REQERR                : u"非法请求或请求次数受限",
    RET.IPERR                 : u"IP受限",
    RET.THIRDERR              : u"第三方系统错误",
    RET.IOERR                 : u"文件读写错误",
    RET.SERVERERR             : u"内部错误",
    RET.UNKOWNERR             : u"未知错误",
    RET.DATEERR               : u"时间错误",
}


# 常量
class Constants(object):
    # 图片验证码的redis有效期, 单位：秒
    IMAGE_CODE_REDIS_EXPIRES = 180

    # 短信验证码的redis有效期, 单位：秒
    SMS_CODE_REDIS_EXPIRES = 300

    # 发送短信验证码的间隔, 单位：秒
    SEND_SMS_CODE_INTERVAL = 60

    # 短信验证码错误次数
    SMS_CODE_ERROR_COUNTS = 3

    # 登录错误尝试次数
    LOGIN_ERROR_COUNTS = 3

    # 登录错误限制的时间, 单位：秒
    LOGIN_ERROR_MAXTIMES = 86400  # 3600 * 24=86400

    # roomID保存时间, 单位：秒
    ROOM_ID_MAXTIMES = 7200  # 3600 * 2=7200

    # 阿里云
    ACCESS_KEY_ID = " "
    ACCESS_KEY_SECRET = " "
    ENDPOINT = "oss-cn-shanghai.aliyuncs.com"
    BUCKET = "api_1_0-face"

    # 腾讯云
    SDK_APP_ID = 1400527235
    SDK_KEY = "031ce4c908ebae8891f2b6577409ab00b88a8f5a709cadbc84c64ab98a9ca226"
