"""
定义接口
获取图片验证码，短信验证码
"""

from flask import Flask, jsonify, request, current_app, render_template, make_response, Response, redirect
from . import api
from flask_wtf import csrf
from config import RET, error_map, Constants
from vist.utils.imagecode.imagecode import ImageCode
from vist.utils.mobiecode.mobiecode import MobieCode
from vist import redis_store, models
from vist.utils.objectstorage.imagestorage import put_image_data


@api.route('/csrf_token')
def get_csrf_token():
    """
    获取csrf_token
    """

    csrf_token = csrf.generate_csrf()
    response = jsonify(errno=RET.OK, errmsg="获取成功");
    response.set_cookie("csrf_token", csrf_token)
    return response


@api.route('/image_codes/<image_code_id>')
def get_image_codes(image_code_id):
    """
    获取图片验证码 GET /vist/api/v1.0/image_codes/<image_code_id>
    : params image_code_id: 图片验证码ID
    : return: 图片验证码二进制数据
    """   
    # TODO 参数校验

    try:
        code, byte = ImageCode()
    except Exception as e:
        current_app.logger.error(e)
        # 返回错误信息
        return jsonify(errno=RET.SERVERERR, errmsg="生成图片验证码失败")

    try:
        redis_store.setex('image_code_%s' % image_code_id, Constants.IMAGE_CODE_REDIS_EXPIRES, code)
    except Exception as e:
        current_app.logger.error(e)
        # 返回错误信息
        return jsonify(errno=RET.DBERR, errmsg="设置Redis异常")

    resp = make_response(byte)
    resp.headers['Content-Type'] = 'image/jpg'
    return resp


@api.route("/sms_codes/<re(r'1[34578]\d{9}'):mobile>")
def get_mobile_codes(mobile):
    """
    获取短信验证码 GET /vist/api/v1.0/sms_codes/<mobile>?image_code=xxxx&image_code_id=xxxx
    : params mobile: 电话号码
    : return: json
    """
    image_code = request.args.get('image_code')
    image_code_id = request.args.get('image_code_id')

    # TODO 校验参数
    if not all ([image_code, image_code_id]):
        return jsonify(errno=RET.PARAMERR, errmsg="参数错误")
    
    # 验证图片验证码
    try:
        real_image_code = redis_store.get("image_code_%s" % image_code_id)
    except Exception as e:
        current_app.logger.error(e)
        return jsonify(errno=RET.DBERR, errmsg="Redis获取图片验证码错误")
    
    # 判断图片验证码是否过期
    if real_image_code is None:
        return jsonify(errno=RET.NODATA, errmsg="图片验证码过期")
    
    # 删除图片验证码, 防止多次验证
    try:
        redis_store.delete("image_code_%s" % image_code_id)
    except Exception as e:
        current_app.logger.error(e)
    
    # 比较图片验证码
    if image_code.lower() != real_image_code.decode('utf-8').lower():
        return jsonify(errno=RET.DATAERR, errmsg="图片验证码错误")
    
    # 频繁请求验证60s
    try:
        flag = redis_store.get("sms_code_flag_%s" % mobile)
    except Exception as e:
        current_app.logger.error(e)
    else:
        if flag is not None:
            # 60内发送过
            return jsonify(errno=RET.REQERR, errmsg="请求过于频繁, 请60后重试")
    
    # 发送短信验证码
    try:
        mobile, sms_code = MobieCode(mobile)
    except Exception as e:
        current_app.logger.error(e)
        return jsonify(errno=RET.THIRDERR, errmsg="发送短信验证码失败")
    
    # 保存短信验证码
    try:
        redis_store.setex("sms_code_%s" % mobile, Constants.SMS_CODE_REDIS_EXPIRES, sms_code)
        redis_store.setex("sms_code_flag_%s" % mobile, Constants.SEND_SMS_CODE_INTERVAL, "1")
    except Exception as e:
        current_app.logger.error(e)
        return jsonify(errno=RET.DBERR, errmsg="Redis保存短信验证码异常")

    return jsonify(errno=RET.OK, errmsg="发送成功")
    

# 上传图片
@api.route("/image", methods=["POST"])
def upload_image():
    # 获取图片
    image = request.files.get("image")
    
    # 参数校验
    if image is None:
        return jsonify(errno=RET.PARAMERR, errmsg="未上传文件")
    
    # 上传图片, 返回 image_url
    try:
        image_url = put_image_data(image)
    except Exception as e:
        current_app.logger.error(e)
        return jsonify(errno=RET.THIRDERR, errmsg="文件上传失败")
    
    return jsonify(errno=RET.OK, errmsg="保存成功", data={"image_url": image_url})

