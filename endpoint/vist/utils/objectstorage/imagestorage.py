# -*- coding: utf-8 -*-
import oss2, json, base64
import uuid
from config import Constants

# 阿里云账号AccessKey拥有所有API的访问权限，风险很高。强烈建议您创建并使用RAM用户进行API访问或日常运维，请登录RAM控制台创建RAM用户。
auth = oss2.Auth(Constants.ACCESS_KEY_ID, Constants.ACCESS_KEY_SECRET)

# yourEndpoint填写Bucket所在地域对应的Endpoint。以华东1（杭州）为例，Endpoint填写为https://oss-cn-hangzhou.aliyuncs.com。
endpoint = Constants.ENDPOINT

# 填写Bucket名称。
bucket = oss2.Bucket(auth, endpoint, Constants.BUCKET)                    

# result = bucket.put_object('exampleobject.jpg', 'abc')
# https://vist-project.oss-cn-chengdu.aliyuncs.com/exampleobject.jpg

def base64_to_image(base64):
    return base64.b64decode(base64)

def put_image_data(data, type=".png"):
    # print(data)
    suuid = str(uuid.uuid1())
    file_name = ''.join(suuid.split('-')) + type
    bucket.put_object(file_name, data)
    url = "https://" + Constants.BUCKET + "." + Constants.ENDPOINT + "/" + file_name
    return url

if __name__ == "__main__":
    ret = put_image_data("hhhh")
    print(ret)
