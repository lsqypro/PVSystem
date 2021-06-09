from . import api
from vist.utils.commons import check_user, check_admin, check_system, check_relation, check_prisoner
from flask import g, current_app, jsonify, request, session
from config import RET, Constants
from vist.utils.objectstorage.imagestorage import put_image_data, base64_to_image
from vist.models import User, AuthorRecord, VistRecord
from vist import db, redis_store
from vist.utils.facebody.facebody import compare_face, body_count
from vist.utils.TLSSigAPIv2 import genUserSig
import base64, json


# 更换头像
@api.route("/profile_avator", methods=["PUT"])
@check_user
def set_user_avatar():
    user_dict = g.get('user')

    # 获取图片url
    avatar_url = request.args.get("image_url")

    # 参数校验
    if avatar_url is None:
        return jsonify(errno=RET.PARAMERR, errmsg="参数错误")
    
    # 保存url到数据库
    try:
        User.query.filter_by(id=user_dict.get("id")).update({"avatar_url": avatar_url})
        db.session.commit()
        user = User.query.filter_by(id=user_dict.get("id")).first()
        session["user"] = user.get_dict()
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(e)
        return jsonify(errno=RET.DBERR, errmsg="数据更新失败")
    
    return jsonify(errno=RET.OK, errmsg="头像更换成功", data={"avatar_url": avatar_url})
 

# 用户实名认证
@api.route("/relation_author_record", methods=["POST"])
@check_relation
def relation_author():
    req_dict = request.get_json()
    if not req_dict:
        return jsonify(errno=RET.PARAMERR, errmsg="参数错误1")
    real_name = req_dict.get("real_name")
    id_card = req_dict.get("id_card")
    sms_code = req_dict.get("sms_code")
    id_card_url_front = req_dict.get("id_card_url_front")
    id_card_url_back = req_dict.get("id_card_url_back")

    if not all([real_name, id_card, sms_code, id_card_url_front, id_card_url_back]):
        return jsonify(errno=RET.PARAMERR, errmsg="参数错误2")
    
    user_dict = g.get('user')
    user_id = user_dict.get("id")
    mobile = user_dict.get('mobile')

    # 获取短信验证码
    try:
        real_sms_code = redis_store.get("sms_code_%s" % mobile)
    except Exception as e:
        current_app.logger(e)
        return jsonify(errno=RET.DBERR, errmsg="数据库读取验证码异常")
    
    if real_sms_code is None:
        return jsonify(errno=RET.NODATA, errmsg="验证码已过期")
    
    # 短信验证码错误次数
    try:
        sms_err_cnt = redis_store.get("sms_error_counts_%s" % mobile)
    except Exception as e:
        current_app.lower.error(e)
    
    if sms_err_cnt is not None and int(sms_err_cnt) >=  Constants.SMS_CODE_ERROR_COUNTS:
        # 验证码错误次数过多
        try:
            redis_store.delete("sms_code_%s" % mobile)
            redis_store.delete("sms_error_counts_%s" % mobile)
        except Exception as e:
            current_app.logger(e)
        return jsonify(errmo=RET.REQERR, errmsg="尝试次数过多, 请稍后再试")
    
    if real_sms_code.decode(encoding='UTF-8').lower() != sms_code.lower():
        try:
            redis_store.incr("sms_error_counts_%s" % mobile)
        except Exception as e:
            current_app.logger(e)
        return jsonify(errno=RET.DATAERR, errmsg="短信验证码错误")
    
    # 删除验证码
    try:
        redis_store.delete("sms_code_%s" % mobile)
        redis_store.delete("sms_error_counts_%s" % mobile)
    except Exception as e:
        current_app.logger.error(e)
    
    # 保存实名订单
    ac = AuthorRecord(user_id=user_id, real_name=real_name, id_card=id_card, id_card_url_front=id_card_url_front, id_card_url_back=id_card_url_back)

    try:
        db.session.add(ac)
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(e)
        return jsonify(errno=RET.DBERR, errmsg="数据保存异常")

    # 实名状态
    try:
        User.query.filter_by(id=user_id).update({"real_status": "实名中"})
        db.session.commit();
        user = User.query.filter_by(id=user_id).first()
        if user:
            session['user'] = user.get_dict()
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(e)
        return jsonify(errno=RET.DBERR, errmsg="更新实名状态失败")
    
    return jsonify(errno=RET.OK, errmsg="提交成功")


# 管理员身份修改探监申请信息
@api.route("/author_record", methods=["PUT"])
@check_admin
def change_author_record():
    req_dict = request.get_json()
    if not req_dict:
        return jsonify(errno=RET.PARAMERR, errmsg="参数错误")
    id = req_dict.get("id")
    author_record_dict = req_dict.get("author_record_dict")

    if not all([id, author_record_dict]):
        return jsonify(errno=RET.PARAMERR, errmsg="参数错误")

    # 更新用户实名信息
    try:
        AuthorRecord.query.filter_by(id=id).update(author_record_dict)
        ret = AuthorRecord.query.filter_by(id=id).first()
        if ret.status == "已提交":
            status = '实名中'
        elif ret.status == "未通过": 
            status = '未实名'
        elif ret.status == "已通过": 
            status = '已实名'

        if ret:
            User.query.filter_by(id=ret.user_id).update({
                "real_status": status, 
                "real_name": ret.real_name, 
                "id_card": ret.id_card, 
                "id_card_url_front": ret.id_card_url_front,
                "id_card_url_back": ret.id_card_url_back
            })
            # user = User.query.filter_by(id=ret.user_id).first()
            # session['user'] = user.get_dict()
        else:
            return jsonify(errno=RET.DATAERR, errmsg="未找到用户")
           
        db.session.commit()
    except Exception as e:
        current_app.logger.error(e)
        db.session.rollback()
        return jsonify(errno=RET.DBERR, errmsg="数据库更新异常")

    return jsonify(errno=RET.OK, errmsg="修改成功")


# 通过系统管理员身份，获取探监申请数据
@api.route("/author_record", methods=["GET"])
@check_admin
def get_author_record():
    page = request.args.get('page')
    try:
        if page:
            rs = AuthorRecord.query.paginate(page=int(page), per_page=10, error_out=False).items
        else:
            rs = AuthorRecord.query.all()
    except Exception as e:
        current_app.logger.error(e)
        return jsonify(errno=RET.DBERR, errmsg="数据库异常")

    ulist = []
    for a in rs:
        ulist.append(a.get_dict())
    return jsonify(errno=RET.OK, errmsg="获取成功", data={
        "list": ulist
    })


# 上传图片，人员验证
@api.route('/face_recognize', methods=["POST"])
@check_admin
def face_recognize():
    req_dict = request.get_json()
    if not req_dict:
        return jsonify(errno=RET.PARAMERR, errmsg="参数错误")
    image = req_dict.get("image")
    user_id = req_dict.get("user_id")
    if image is None:
        return jsonify(errno=RET.PARAMERR, errmsg="参数错误")

    # 查询用户
    try:
        user = User.query.filter_by(id=user_id).first()
    except Exception as e:
        current_app.logger.error(e)
        return jsonify(errno=RET.DBERR, errmsg="数据库错误")

    if user is None:
        return jsonify(errno=RET.NODATA, errmsg="用户不存在")
    left_url = user.avatar_url

    try:
        # 存放图片
        right_url = put_image_data(base64.b64decode(image[22:]))
        
        # 人体数
        count_resp = body_count(right_url)
        count_resp = json.loads(count_resp)
        # print(count_resp)
        personNumber = count_resp.get("Data").get("PersonNumber")
    except Exception as e:
        current_app.logger.error(e)
        return jsonify(errno=RET.THIRDERR, errmsg="识别异常")

    if personNumber != 1:
        return jsonify(errno=RET.OK, errmsg="识别成功", data={
            "confidence": 0,
            "personNumber": personNumber
        })

    try:
        # 1:1
        compare_resp = compare_face(left_url, right_url)
        compare_resp = json.loads(compare_resp)
        print(compare_resp)
        confidence = compare_resp.get("Data").get("Confidence")
    except Exception as e:
        current_app.logger.error(e)
        return jsonify(errno=RET.THIRDERR, errmsg="识别异常")
        
    return jsonify(errno=RET.OK, errmsg="识别成功", data={
        "confidence": confidence,
        "personNumber": personNumber
    })


@api.route('/user_face_recognize', methods=["POST"])
@check_user
def user_face_recognize():
    req_dict = request.get_json()
    user_dict = g.get('user')

    if not req_dict:
        return jsonify(errno=RET.PARAMERR, errmsg="参数错误")
    image = req_dict.get("image")
    user_id = user_dict.get("id")
    left_url = user_dict.get("avatar_url")

    if image is None or user_id is None or left_url is None:
        return jsonify(errno=RET.PARAMERR, errmsg="参数错误")

    try:
        # 存放图片
        right_url = put_image_data(base64.b64decode(image[22:]))
        
        # 人体数
        count_resp = body_count(right_url)
        count_resp = json.loads(count_resp)
        # print(count_resp)
        personNumber = count_resp.get("Data").get("PersonNumber")
    except Exception as e:
        current_app.logger.error(e)
        return jsonify(errno=RET.THIRDERR, errmsg="人数识别异常")

    # print(personNumber)
    if personNumber != 1:
        return jsonify(errno=RET.OK, errmsg="识别成功", data={
            "confidence": 0,
            "personNumber": personNumber
        })

    try:
        # 1:1
        compare_resp = compare_face(left_url, right_url)
        compare_resp = json.loads(compare_resp)
        print(compare_resp)
        confidence = compare_resp.get("Data").get("Confidence")
    except Exception as e:
        current_app.logger.error(e)
        return jsonify(errno=RET.THIRDERR, errmsg="人脸识别异常")
        
    return jsonify(errno=RET.OK, errmsg="识别成功", data={
        "confidence": confidence,
        "personNumber": personNumber
    })


@api.route('/tlssig', methods=["GET"])
def genUsig():
    uid = request.args.get('user_id')

    try:
        data = genUserSig(uid)
    except Exception as e:
        current_app.logger.error(e)
        return jsonify(errno=RET.THIRDERR, errmsg="生成USIG失败")
    
    return jsonify(errno=RET.OK, errmsg="获取成功", data=data)
