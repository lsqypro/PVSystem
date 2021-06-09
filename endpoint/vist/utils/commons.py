# coding:utf-8

from flask.globals import current_app
from werkzeug.routing import BaseConverter
import re
import functools
from flask import session, g, jsonify
from config import RET

class ReConverter(BaseConverter):
    """
    定义正则转换器
    """
    def __init__(self, url_map, regex):
        # 调用父类的初始化方法
        super(ReConverter, self).__init__(url_map)
        # 保存正则表达式
        self.regex = regex

def is_mobile(mobile):
    return True
    return re.match(r"1[34578]\d{9}", mobile)

def is_password(password):
    return True

# 检查登录状态装饰器
# check_prisoner, check_relation, check_jailer, check_system, check_admin, check_user
def check_user(view_func):
    @functools.wraps(view_func)
    def wrapper(*args, **kwargs):
        try:
            user_dict = session.get("user")
        except Exception as e:
            current_app.logger.error(e)
            return jsonify(errno=RET.SESSIONERR, errmsg="数据库读取错误")

        if user_dict is None:
            return jsonify(errno=RET.SESSIONERR, errmsg="用户未登录")
        g.user = user_dict
        return view_func(*args, **kwargs)
    return wrapper


def check_admin(view_func):
    @functools.wraps(view_func)
    def wrapper(*args, **kwargs):
        try:
            user_dict = session.get("user")
        except Exception as e:
            current_app.logger.error(e)
            return jsonify(errno=RET.SESSIONERR, errmsg="数据库读取错误")

        if user_dict is None:
            return jsonify(errno=RET.SESSIONERR, errmsg="用户未登录")
        g.user = user_dict
        if g.get("user").get("user_type") != "系统管理员" and g.get("user").get("user_type") != "监狱管理员":
            return jsonify(errno=RET.ROLEERR, errmsg="权限不足")
        return view_func(*args, **kwargs)
    return wrapper


def check_system(view_func):
    @functools.wraps(view_func)
    def wrapper(*args, **kwargs):
        try:
            user_dict = session.get("user")
        except Exception as e:
            current_app.logger.error(e)
            return jsonify(errno=RET.SESSIONERR, errmsg="数据库读取错误")

        if user_dict is None:
            return jsonify(errno=RET.SESSIONERR, errmsg="用户未登录")
        g.user = user_dict
        if g.get("user").get("user_type") != "系统管理员":
            return jsonify(errno=RET.ROLEERR, errmsg="权限不足")
        return view_func(*args, **kwargs)
    return wrapper


def check_relation(view_func):
    @functools.wraps(view_func)
    def wrapper(*args, **kwargs):
        try:
            user_dict = session.get("user")
        except Exception as e:
            current_app.logger.error(e)
            return jsonify(errno=RET.SESSIONERR, errmsg="数据库读取错误")

        if user_dict is None:
            return jsonify(errno=RET.SESSIONERR, errmsg="用户未登录")
        g.user = user_dict
        if g.get("user").get("user_type") != "家属":
            return jsonify(errno=RET.ROLEERR, errmsg="权限不足")
        return view_func(*args, **kwargs)
    return wrapper


def check_prisoner(view_func):
    @functools.wraps(view_func)
    def wrapper(*args, **kwargs):
        try:
            user_dict = session.get("user")
        except Exception as e:
            current_app.logger.error(e)
            return jsonify(errno=RET.SESSIONERR, errmsg="数据库读取错误")

        if user_dict is None:
            return jsonify(errno=RET.SESSIONERR, errmsg="用户未登录")
        g.user = user_dict
        if g.get("user").get("user_type") != "服刑人员":
            return jsonify(errno=RET.ROLEERR, errmsg="权限不足")
        return view_func(*args, **kwargs)
    return wrapper


# DEBUG
# def check_user(view_func):
#     @functools.wraps(view_func)
#     def wrapper(*args, **kwargs):
#         g.user = {
#             "avatar_url": "https://vist-face.oss-cn-shanghai.aliyuncs.com/70fc985ac23611ebada4525400aa89b3.png",
#             "id": 20,
#             "id_card": None,
#             "id_card_url_back": None,
#             "id_card_url_front": None,
#             "mobile": "admin",
#             "real_name": "未实名",
#             "real_status": "未实名",
#             "user_type": "家属"
#         }
#         return view_func(*args, **kwargs)
#     return wrapper


# def check_admin(view_func):
#     @functools.wraps(view_func)
#     def wrapper(*args, **kwargs):
#         g.user = {
#             "avatar_url": None,
#             "id": 5,
#             "id_card": None,
#             "id_card_url_back": None,
#             "id_card_url_front": None,
#             "mobile": "admin",
#             "real_name": "未实名",
#             "real_status": "未实名",
#             "user_type": "系统管理员"
#         }
#         return view_func(*args, **kwargs)
#     return wrapper


# def check_system(view_func):
#     @functools.wraps(view_func)
#     def wrapper(*args, **kwargs):
#         g.user = {
#             "avatar_url": None,
#             "id": 5,
#             "id_card": None,
#             "id_card_url_back": None,
#             "id_card_url_front": None,
#             "mobile": "admin",
#             "real_name": "未实名",
#             "real_status": "未实名",
#             "user_type": "系统管理员"
#         }
#         return view_func(*args, **kwargs)
#     return wrapper


# def check_relation(view_func):
#     @functools.wraps(view_func)
#     def wrapper(*args, **kwargs):
#         g.user = {
#             "avatar_url": None,
#             "id": 20,
#             "id_card": None,
#             "id_card_url_back": None,
#             "id_card_url_front": None,
#             "mobile": "admin",
#             "real_name": "未实名",
#             "real_status": "未实名",
#             "user_type": "系统管理员"
#         }
#         return view_func(*args, **kwargs)
#     return wrapper


# def check_prisoner(view_func):
#     @functools.wraps(view_func)
#     def wrapper(*args, **kwargs):
#         g.user = {
#             "avatar_url": None,
#             "id": 5,
#             "id_card": None,
#             "id_card_url_back": None,
#             "id_card_url_front": None,
#             "mobile": "admin",
#             "real_name": "未实名",
#             "real_status": "未实名",
#             "user_type": "系统管理员"
#         }
#         return view_func(*args, **kwargs)
#     return wrapper