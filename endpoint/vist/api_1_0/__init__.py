from flask import Blueprint, make_response

api = Blueprint('api_1_0', __name__)


@api.after_request
def after_request(res):
    print("after_request")
    resp = make_response(res)
    res.headers['Access-Control-Allow-Origin'] = 'http://localhost:3000' 
    res.headers["Access-Control-Allow-Headers"] = "Referer, User-Agent, Origin, X-Requested-With, Content-Type, Accept, X-ID, X-TOKEN, X-ANY-YOUR-CUSTOM-HEADER" 
    res.headers['Access-Control-Allow-Credentials'] = 'true'  # 有这个,可以cookie跨域
    res.headers['Access-Control-Allow-Methods'] = "GET,POST,PUT,DELETE,OPTIONS"  # 对于复杂请求必须加
    return resp


@api.route('hello')
def hello():
    print("hello")
    return 'hello'

from . import verify_code, account, profile, vist_record
