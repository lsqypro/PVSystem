#coding:utf-8

from logging import error, log
from . import api
from vist.utils.commons import check_user, check_admin, check_system, check_relation, check_prisoner
from flask import g, current_app, jsonify, request, session
from config import RET, Constants
from vist.utils.objectstorage.imagestorage import put_image_data
from vist.models import User, AuthorRecord, VistRecord
from vist import db, redis_store
from flask import Blueprint, current_app, make_response
from flask_wtf import csrf
import time, uuid


# 家属提交探监申请
@api.route("/relation_vist_record", methods=["POST"])
@check_relation
def submit_form():
    req_dict = request.get_json()
    if not req_dict:
        return jsonify(errno=RET.PARAMERR, errmsg="参数错误")
    
    prisoner_id_card = req_dict.get("prisoner_id")
    relation_id = g.get("user").get("id")
    prisoner_mobile = req_dict.get("prisoner_mobile")
    start_time = req_dict.get("start_time")
    end_time = req_dict.get("end_time")
    apply_desc = req_dict.get("apply_desc")
   
    # 参数合法性检查
    if not all([relation_id, prisoner_id_card, prisoner_mobile, start_time, end_time, apply_desc]):
        return jsonify(errno=RET.PARAMERR, errmsg="参数错误")

    if start_time >= end_time:
        return jsonify(errno=RET.DATEERR, errmsg="时间错误")

    try:
        user = User.query.filter_by(id_card=prisoner_id_card).first()
        prisoner_id = user.id
    except Exception as e:
        current_app.logger.error(e)
        return jsonify(errno=RET.DBERR, errmsg="数据库异常")

    if user is None or user.user_type != "服刑人员":
        return jsonify(errno=RET.NODATA, errmsg="未找到该用户")

    # 未进行实名认证
    self_user = g.get("user")
    # print(self_user)
    if self_user.get('real_status') != "已实名":
        return jsonify(errno=RET.REQERR, errmsg="未进行实名认证")

    # 存在待审批记录
    try:
        record = VistRecord.query.filter_by(relation_id=relation_id, status="审核中").first()
    except Exception as e:
        current_app.logger.error(e)
        return jsonify(errno=RET.DBERR, errmsg="数据库异常")
    # print(self_user)
    if record:
        return jsonify(errno=RET.DATAEXIST, errmsg="存在待审批申请")

    # 新建记录
    suuid = str(uuid.uuid1())
    record = VistRecord(relation_id=relation_id, prisoner_id=prisoner_id, start_time=start_time, end_time=end_time, apply_desc=apply_desc, room_id=suuid)

    try:
        db.session.add(record)
        db.session.commit()
    except Exception as e:
        current_app.logger.error(e)
        db.session.rollback()
        return jsonify(errno=RET.DBERR, errmsg="数据库异常")

    return jsonify(errno=RET.OK, errmsg="提交成功")


# 管理员身份修改探监申请信息
@api.route("/vist_record", methods=["PUT"])
@check_admin
def change_vist_record():
    req_dict = request.get_json()
    if not req_dict:
        return jsonify(errno=RET.PARAMERR, errmsg="参数错误")
    id = req_dict.get("id")
    vist_record_dict = req_dict.get("vist_record_dict")

    if not all([id, vist_record_dict]):
        return jsonify(errno=RET.PARAMERR, errmsg="参数错误")

    try:
        VistRecord.query.filter_by(id=id).update(vist_record_dict)
        db.session.commit()
    except Exception as e:
        current_app.logger.error(e)
        db.session.rollback()
        return jsonify(errno=RET.DBERR, errmsg="数据库更新异常")

    return jsonify(errno=RET.OK, errmsg="修改成功")


# 通过系统管理员身份，获取探监申请数据
@api.route("/vist_record", methods=["GET"])
@check_system
def get_vist_record():
    # page = request.args.get('page')
    page = None
    vist_record_id = request.args.get('vist_record_id')
    try:
        if vist_record_id:
            rs = VistRecord.query.filter_by(id=vist_record_id).all()
        elif page:
            rs = VistRecord.query.paginate(page=int(page), per_page=10, error_out=False).items
        else:
            rs = VistRecord.query.all()
    except Exception as e:
        current_app.logger.error(e)
        return jsonify(errno=RET.DBERR, errmsg="数据库异常")

    ulist = []
    for r in rs:
        ulist.append(r.get_dict())
    return jsonify(errno=RET.OK, errmsg="获取成功", data={
        "list": ulist
    })


# 家属用户获取探监记录
@api.route("/relation_vist_record", methods=["GET"])
@check_relation
def relation_get_vist_record():
    user_id = g.get("user").get("id")
    record_id = request.args.get("id")
    try:
        if record_id:
            rs = VistRecord.query.filter_by(id=record_id, relation_id=user_id).all()
        else:
            rs = VistRecord.query.filter_by(relation_id=user_id).all()
    except Exception as e:
        current_app.logger.error(e)
        return jsonify(errno=RET.DBERR, errmsg="数据库异常")

    ulist = []
    for r in rs:
        ulist.append(r.get_dict())
    return jsonify(errno=RET.OK, errmsg="获取成功", data={
        "list": ulist
    })


# 服刑人员用户获取未开始的探监记录
@api.route("/prisoner_vist_record", methods=["GET"])
@check_prisoner
def prisoner_get_vist_record():
    user_id = g.get("user").get("id")
    # print(record_id)
    try:
        rs = VistRecord.query.filter_by(prisoner_id=user_id, status="已通过").all()
    except Exception as e:
        current_app.logger.error(e)
        return jsonify(errno=RET.DBERR, errmsg="数据库异常")

    ulist = []
    for r in rs:
        ulist.append(r.get_dict())
    if not ulist:
        return jsonify(errno=RET.NODATA, errmsg="不存在已通过的探监申请")
    return jsonify(errno=RET.OK, errmsg="获取成功", data={
        "list": ulist
    })


# # chat, 服刑用户，家属用户
# @api.route("/chat/<int:record_id>", methods=["GET"])
# @check_login_status
# def get_chat(record_id):
#     """
#     验证user_id, record_id
#     获取聊天室ID
#     """
#     user_id = g.get("user_id")

#     # 该用户user_id是否为record_id参与者
#     try:
#         r1 = Record.query.filter_by(user_a=user_id, id=int(record_id)).first()
#         r2 = Record.query.filter_by(user_b=user_id, id=int(record_id)).first()
#     except Exception as e:
#         current_app.logger.error(e)
#         return jsonify(errno=RET.DBERR, errmsg="数据库操作异常")

#     if r1 is None and r2 is None:
#         return jsonify(errno=RET.NODATA, errmsg="未找到该记录")
    
#     if r1:
#         r = r1
#     if r2:
#         r = r2
    
#     # 状态检查
#     if r and r.status != "已通过":
#         return jsonify(errno=RET.DATAERR, errmsg="申请未通过")   

#     # 时间检查
#     curt = time.localtime()
#     if curt < r.start_time.timetuple():
#         return jsonify(errno=RET.REQERR, errmsg="未到指定时间")
#     if curt > r.end_time.timetuple():
#         # 更新数据库
#         try:
#             r.status = "已完成"
#         except Exception as e:
#             current_app.logger.error(e)
#         return jsonify(errno=RET.REQERR, errmsg="已过期")

#     # 查看redis中是否存在
#     try:
#         room_id = redis_store.get("chat_room_id_%s" % record_id)
#     except Exception as e:
#         current_app.logger.error(e)
#         return jsonify(errno=RET.DBERR, errmsg="Redis获取roomID异常")

#     if room_id is None:
#         try:
#             room_id = str(uuid.uuid1())
#             redis_store.setex("chat_room_id_%s" % record_id, Constants.ROOM_ID_MAXTIMES, room_id)
#         except Exception as e:
#             current_app.logger.error(e)
#             return jsonify(errno=RET.DBERR, errmsg="Redis保存roomID异常")

#     return jsonify(errno=RET.OK, errmsg="获取成功", data={"roomID": room_id.decode('utf-8')})
