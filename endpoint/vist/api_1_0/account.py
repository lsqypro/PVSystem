#coding:utf-8

"""
定义接口
用户管理
注册，登录，密码修改等
"""

import time
from logging import error
from . import api
from flask import g, current_app, jsonify, request, session
from config import RET, Constants
from vist.utils.commons import check_user, check_admin, check_system
# from vist.utils.commons import check_prisoner, check_relation, check_jailer, check_system, check_admin, check_user
from vist.utils.objectstorage.imagestorage import put_image_data
from vist.models import User, AuthorRecord, VistRecord
from vist import db, redis_store
from vist.utils.commons import is_mobile, is_password
from sqlalchemy.exc import IntegrityError


# 家属用户注册
@api.route("/relation", methods=["POST"])
def relation_register():
    req_dict = request.get_json()
    if not req_dict:
        return jsonify(errno=RET.PARAMERR, errmsg="参数错误")
    mobile = req_dict.get("mobile")
    sms_code = req_dict.get("sms_code")
    password = req_dict.get("password")

    if not all([mobile, sms_code, password]):
        return jsonify(errno=RET.PARAMERR, errmsg="参数错误")

    if not is_mobile(mobile):
        return jsonify(errno=RET.PARAMERR, errmsg="手机号格式错误")

    if not is_password(password):
        return jsonify(errno=RET.PARAMERR, errmsg="密码格式错误")

    # 获取短信验证码真值和短信验证码错误次数
    try:
        real_sms_code = redis_store.get("sms_code_%s" % mobile)
        sms_err_cnt = redis_store.get("sms_error_counts_%s" % mobile)
    except Exception as e:
        current_app.logger(e)
        return jsonify(errno=RET.DBERR, errmsg="数据库读取验证码异常")
    
    if real_sms_code is None:
        return jsonify(errno=RET.NODATA, errmsg="验证码已过期")
    
    if real_sms_code.decode(encoding='UTF-8').lower() != sms_code.lower():
        try:
            redis_store.incr("sms_error_counts_%s" % mobile)
        except Exception as e:
            current_app.logger(e)
        
        if sms_err_cnt is not None and int(sms_err_cnt) + 1 >=  Constants.SMS_CODE_ERROR_COUNTS:
            # 验证码错误次数过多
            try:
                redis_store.delete("sms_code_%s" % mobile)
                redis_store.delete("sms_error_counts_%s" % mobile)
            except Exception as e:
                current_app.logger(e)
            return jsonify(errmo=RET.REQERR, errmsg="尝试次数过多, 请稍重新发送")
        return jsonify(errno=RET.DATAERR, errmsg="短信验证码错误")
    
    # 删除验证码
    try:
        redis_store.delete("sms_code_%s" % mobile)
        redis_store.delete("sms_error_counts_%s" % mobile)
    except Exception as e:
        current_app.logger.error(e)

    # 保存用户数据
    user = User(mobile=mobile)
    user.passord = password
    
    try:
        db.session.add(user)
        db.session.commit()
    except IntegrityError as e:
        # 数据重复时抛出该异常
        current_app.logger.error(e)
        db.session.rollback()
        return jsonify(errno=RET.DATAEXIST, errmsg="手机号已注册")
    except Exception as e:
        current_app.logger.error(e)
        db.session.rollback()
        return jsonify(errno=RET.DBERR, errmsg="数据库异常")

    return jsonify(errno=RET.OK, errmsg="注册成功")


# 家属用户登录
@api.route("/relation_session", methods=["POST"])
def relation_login():
    req_dict = request.get_json()
    if not req_dict:
        return jsonify(errno=RET.PARAMERR, errmsg="参数错误")
    mobile = req_dict.get("mobile")
    password = req_dict.get("password")

    if not all([mobile, password]) or not is_mobile(mobile) or not is_password(password):
        return jsonify(errno=RET.PARAMERR, errmsg="参数错误")
    
    # 错误次数统计
    try:
        access_count = redis_store.get("access_count_%s" % mobile)
    except Exception as e:
        current_app.lower.error(e)
    else:
        if access_count is not None and int(access_count) >=  Constants.LOGIN_ERROR_COUNTS:
            return jsonify(errmo=RET.REQERR, errmsg="尝试次数过多, 账户锁定中")

    # 用户验证, 错误次数统计
    try:
        user = User.query.filter_by(mobile=mobile).first()
    except Exception as e:
        current_app.logger.error(e)
        return jsonify(errno=RET.DBERR, errmsg="数据库查询错误")
    
    if user is None or not user.check_password(password) or user.user_type != "家属":
        try:
            redis_store.incr("access_count_%s" % mobile)
            redis_store.expire("access_count_%s" % mobile, Constants.LOGIN_ERROR_MAXTIMES)
        except Exception as e:
            current_app.logger.error(e)
        return jsonify(errno=RET.PWDERR, errmsg="账号或用户名错误")
    
    try:
        # 保存用户信息
        session["user"] = user.get_dict()
        user_dict = session["user"]
        # 保存登录状态
        redis_store.set("user_status_%s" % mobile, "在线")
        # 登录或离线时间
        redis_store.set("user_update_time_%s" % mobile, time.strftime("%Y-%m-%d %H:%M:%S", time.localtime()))
    except Exception as e:
        return jsonify(errno=RET.DBERR, errmsg="数据库异常")

    return jsonify(errno=RET.OK, errmsg="登录成功", data={
        "user": user_dict
    })


# 获取用户数据
@api.route("/session", methods=["GET"])
@check_user
def get_session():
    user = g.get("user")

    return jsonify(errno=RET.OK, errmsg="已登录", data={
        "user": user
    })
    

# 退出登录
@api.route("/session", methods=["DELETE"])
@check_user
def logout():
    mobile = g.get("user").get("mobile")

    # 清除session
    csrf_token = session.get("csrf_token")
    session.clear()
    session["csrf_token"] = csrf_token

    # 保存登录状态
    redis_store.set("user_status_%s" % mobile, "在线")
    # 登录或离线时间
    redis_store.set("user_update_time_%s" % mobile, time.strftime("%Y-%m-%d %H:%M:%S", time.localtime()))
    return jsonify(errno=RET.OK, errmsg="登出成功")


# 家属用户更改密码
@api.route("/relation", methods=["PUT"])
def relation_change_password():
    req_dict = request.get_json()
    if not req_dict:
        return jsonify(errno=RET.PARAMERR, errmsg="参数错误")
    mobile = req_dict.get("mobile")
    old_password = req_dict.get("old_password")
    password = req_dict.get("password")

    if not all([mobile, old_password, password]) or not is_password(old_password) or not is_password(password):
        return jsonify(errno=RET.PARAMERR, errmsg="参数错误")
    
    # 错误次数统计
    try:
        access_count = redis_store.get("access_count_%s" % mobile)
    except Exception as e:
        current_app.lower.error(e)
    else:
        if access_count is not None and int(access_count) >=  Constants.LOGIN_ERROR_COUNTS:
            return jsonify(errmo=RET.REQERR, errmsg="尝试次数过多, 账户锁定中")

    # 用户验证
    try:
        user = User.query.filter_by(mobile=mobile).first()
    except Exception as e:
        current_app.logger.error(e)
        return jsonify(errno=RET.DBERR, errmsg="数据库查询错误")
    
    if user is None or not user.check_password(old_password):
        try:
            redis_store.incr("access_count_%s" % mobile)
            redis_store.expire("access_count_%s" % mobile, Constants.LOGIN_ERROR_MAXTIMES)
        except Exception as e:
            current_app.logger.error(e)
        return jsonify(errno=RET.PWDERR, errmsg="账号或用户名错误")

    # 保存url到数据库
    try:
        user.passord = password
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(e)
        return jsonify(errno=RET.DBERR, errmsg="数据更新失败")

    return jsonify(errno=RET.OK, errmsg="修改成功")


# 系统管理员注册
@api.route("/system", methods=["POST"])
def admin_register():
    req_dict = request.get_json()
    if not req_dict:
        return jsonify(errno=RET.PARAMERR, errmsg="参数错误")
    mobile = req_dict.get("mobile")
    password = req_dict.get("password")

    if not all([mobile, password]):
        return jsonify(errno=RET.PARAMERR, errmsg="参数错误")

    # 保存用户数据
    user = User(mobile=mobile, user_type="系统管理员")
    user.passord = password

    try:
        db.session.add(user)
        db.session.commit()
    except IntegrityError as e:
        # 数据重复时抛出该异常
        current_app.logger.error(e)
        db.session.rollback()
        return jsonify(errno=RET.DATAEXIST, errmsg="用户名已注册")
    except Exception as e:
        current_app.logger.error(e)
        db.session.rollback()
        return jsonify(errno=RET.DBERR, errmsg="数据库异常")

    return jsonify(errno=RET.OK, errmsg="注册成功")


# 管理员登录
@api.route("/admin_session", methods=["POST"])
def admin_login():
    req_dict = request.get_json()
    if not req_dict:
        return jsonify(errno=RET.PARAMERR, errmsg="参数错误")
    mobile = req_dict.get("mobile")
    password = req_dict.get("password")

    if not all([mobile, password]) or not is_mobile(mobile) or not is_password(password):
        return jsonify(errno=RET.PARAMERR, errmsg="参数错误")
    
    # 错误次数统计
    try:
        access_count = redis_store.get("access_count_%s" % mobile)
    except Exception as e:
        current_app.lower.error(e)
    else:
        if access_count is not None and int(access_count) >=  Constants.LOGIN_ERROR_COUNTS:
            return jsonify(errmo=RET.REQERR, errmsg="尝试次数过多, 账户锁定中")

    # 用户验证, 错误次数统计
    try:
        user = User.query.filter_by(mobile=mobile).first()
    except Exception as e:
        current_app.logger.error(e)
        return jsonify(errno=RET.DBERR, errmsg="数据库查询错误")
    
    if user is None or not user.check_password(password) or (user.user_type != "系统管理员" and user.user_type != "监狱管理员"):
        try:
            redis_store.incr("access_count_%s" % mobile)
            redis_store.expire("access_count_%s" % mobile, Constants.LOGIN_ERROR_MAXTIMES)
        except Exception as e:
            current_app.logger.error(e)
        return jsonify(errno=RET.PWDERR, errmsg="账号或用户名错误")
    
    try:
        # 保存用户信息
        session["user"] = user.get_dict()
        user_dict = session["user"]
        # 保存登录状态
        redis_store.set("user_status_%s" % mobile, "在线")
        # 登录或离线时间
        redis_store.set("user_update_time_%s" % mobile, time.strftime("%Y-%m-%d %H:%M:%S", time.localtime()))
    except Exception as e:
        return jsonify(errno=RET.DBERR, errmsg="数据库异常")

    return jsonify(errno=RET.OK, errmsg="登录成功", data={
        "user": user_dict
    })

    # 跨域
    # response = jsonify(errno=RET.OK, errmsg="登录成功", data={
    #     "user": user_dict
    # })
    # response.headers['Access-Control-Allow-Origin'] = '*'
    # response.headers['Access-Control-Allow-Headers'] = "content-type"
    # response.headers['Access-Control-Allow-Methods'] = "GET,POST,PUT,DELETE,OPTIONS"

    # return response

# 服刑人员登录
@api.route("/prisoner_session", methods=["POST"])
def prisoner_login():
    req_dict = request.get_json()
    if not req_dict:
        return jsonify(errno=RET.PARAMERR, errmsg="参数错误")
    mobile = req_dict.get("mobile")
    password = req_dict.get("password")

    if not all([mobile, password]) or not is_mobile(mobile) or not is_password(password):
        return jsonify(errno=RET.PARAMERR, errmsg="参数错误")
    
    # 错误次数统计
    try:
        access_count = redis_store.get("access_count_%s" % mobile)
    except Exception as e:
        current_app.lower.error(e)
    else:
        if access_count is not None and int(access_count) >=  Constants.LOGIN_ERROR_COUNTS:
            return jsonify(errmo=RET.REQERR, errmsg="尝试次数过多, 账户锁定中")

    # 用户验证, 错误次数统计
    try:
        user = User.query.filter_by(mobile=mobile).first()
    except Exception as e:
        current_app.logger.error(e)
        return jsonify(errno=RET.DBERR, errmsg="数据库查询错误")
    
    if user is None or not user.check_password(password) or user.user_type != "服刑人员":
        try:
            redis_store.incr("access_count_%s" % mobile)
            redis_store.expire("access_count_%s" % mobile, Constants.LOGIN_ERROR_MAXTIMES)
        except Exception as e:
            current_app.logger.error(e)
        return jsonify(errno=RET.PWDERR, errmsg="账号或用户名错误")
    
    try:
        # 保存用户信息
        session["user"] = user.get_dict()
        user_dict = session["user"]
        # 保存登录状态
        redis_store.set("user_status_%s" % mobile, "在线")
        # 登录或离线时间
        redis_store.set("user_update_time_%s" % mobile, time.strftime("%Y-%m-%d %H:%M:%S", time.localtime()))
    except Exception as e:
        return jsonify(errno=RET.DBERR, errmsg="数据库异常")

    return jsonify(errno=RET.OK, errmsg="登录成功", data={
        "user": user_dict
    })


# 管理员修改密码
@api.route("/admin", methods=["PUT"])
@check_admin
def admin_change_password():
    req_dict = request.get_json()
    if not req_dict:
        return jsonify(errno=RET.PARAMERR, errmsg="参数错误")
    mobile = req_dict.get("mobile")
    old_password = req_dict.get("old_password")
    password = req_dict.get("password")

    if not all([mobile, old_password, password]) or not is_password(old_password) or not is_password(password):
        return jsonify(errno=RET.PARAMERR, errmsg="参数错误")
    
    # 身份验证
    if mobile != g.get("user").get("mobile"):
        return jsonify(errno=RET.ROLEERR, errmsg="身份错误")

    # 错误次数统计
    try:
        access_count = redis_store.get("access_count_%s" % mobile)
    except Exception as e:
        current_app.lower.error(e)
    else:
        if access_count is not None and int(access_count) >=  Constants.LOGIN_ERROR_COUNTS:
            return jsonify(errmo=RET.REQERR, errmsg="尝试次数过多, 账户锁定中")

    # 用户验证
    try:
        user = User.query.filter_by(mobile=mobile).first()
    except Exception as e:
        current_app.logger.error(e)
        return jsonify(errno=RET.DBERR, errmsg="数据库查询错误")
    
    if user is None or not user.check_password(old_password):
        try:
            redis_store.incr("access_count_%s" % mobile)
            redis_store.expire("access_count_%s" % mobile, Constants.LOGIN_ERROR_MAXTIMES)
        except Exception as e:
            current_app.logger.error(e)
        return jsonify(errno=RET.PWDERR, errmsg="账号或用户名错误")

    # 保存url到数据库
    try:
        user.passord = password
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(e)
        return jsonify(errno=RET.DBERR, errmsg="数据更新失败")

    return jsonify(errno=RET.OK, errmsg="修改成功")


# 通过系统管理员身份，注册任何类型账户
@api.route("/user", methods=["POST"])
@check_system
def user_register():
    req_dict = request.get_json()
    if not req_dict:
        return jsonify(errno=RET.PARAMERR, errmsg="参数错误")
    mobile = req_dict.get("mobile")
    password = req_dict.get("password")
    user_type = req_dict.get("user_type")

    if not all([mobile, user_type, password]):
        return jsonify(errno=RET.PARAMERR, errmsg="参数错误")

    # 保存用户数据
    user = User(mobile=mobile, user_type=user_type)
    user.passord = password
    
    try:
        db.session.add(user)
        db.session.commit()
    except IntegrityError as e:
        # 数据重复时抛出该异常
        current_app.logger.error(e)
        db.session.rollback()
        return jsonify(errno=RET.DATAEXIST, errmsg="用户名已注册")
    except Exception as e:
        current_app.logger.error(e)
        db.session.rollback()
        return jsonify(errno=RET.DBERR, errmsg="数据库异常")

    return jsonify(errno=RET.OK, errmsg="注册成功")


# 通过系统管理员身份，获取用户数据
@api.route("/user", methods=["GET"])
# @check_system
def get_users():
    # page = request.args.get('page')
    user_id = request.args.get('user_id')
    page = None
    try:
        if user_id:
            users = User.query.filter_by(id=int(user_id)).all()
        elif page:
            users = User.query.paginate(page=int(page), per_page=10, error_out=False).items
        else:
            users = User.query.all()
    except Exception as e:
        current_app.logger.error(e)
        return jsonify(errno=RET.DBERR, errmsg="数据库异常")

    ulist = []
    for u in users:
        ulist.append(u.get_dict())
    return jsonify(errno=RET.OK, errmsg="获取成功", data={
        "list": ulist
    })


# 通过系统管理员身份，更改用户数据
@api.route("/user", methods=["PUT"])
@check_system
def change_users():
    req_dict = request.get_json()
    if not req_dict:
        return jsonify(errno=RET.PARAMERR, errmsg="参数错误")
    id = req_dict.get("id")
    user_dict = req_dict.get("user_dict")

    if not all([id, user_dict]):
        return jsonify(errno=RET.PARAMERR, errmsg="参数错误")

    try:
        User.query.filter_by(id=id).update(user_dict)
        db.session.commit()
    except Exception as e:
        current_app.logger.error(e)
        db.session.rollback()
        return jsonify(errno=RET.DBERR, errmsg="数据库更新异常")

    return jsonify(errno=RET.OK, errmsg="修改成功")