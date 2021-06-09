# -*- coding: utf8 -*-
from aliyunsdkcore.client import AcsClient
from aliyunsdkfacebody.request.v20191230 import CompareFaceRequest
from aliyunsdkfacebody.request.v20191230 import DetectBodyCountRequest
from config import Constants

# 创建 AcsClient 实例
# client = AcsClient("<your-access-key-id>", "<your-access-key-secret>", "cn-shanghai")
client = AcsClient(Constants.ACCESS_KEY_ID, Constants.ACCESS_KEY_SECRET, "cn-shanghai")

# # 人脸检测定位
# request = DetectFaceRequest.DetectFaceRequest();
# ## 如下url替换为自有的上海region的oss文件地址
# request.set_ImageURL("https://viapi-demo.oss-cn-shanghai.aliyuncs.com/viapi-demo/images/SegmentCommonImage/segmengImage.png")
# response = client.do_action_with_exception(request)
# print(response)

# 人脸比对
def compare_face(url_a, url_b):
    request = CompareFaceRequest.CompareFaceRequest();
    ## 如下url替换为自有的上海region的oss文件地址
    request.set_ImageURLA(url_a)
    request.set_ImageURLB(url_b)
    response = client.do_action_with_exception(request)
    # print(response)
    return response


# 人体计数
def body_count(url):
    print(url)
    request = DetectBodyCountRequest.DetectBodyCountRequest()
    request.set_accept_format('json')
    request.set_ImageURL(url)
    response = client.do_action_with_exception(request)
    # python2:  print(response) 
    # print(str(response, encoding='utf-8'))
    return response


if __name__ == '__main__':
    print(compare_face('https://vist-face.oss-cn-shanghai.aliyuncs.com/CompareFace-right1.png', 'https://vist-face.oss-cn-shanghai.aliyuncs.com/CompareFace-left1.png'))
    print(body_count('http://viapi-test.oss-cn-shanghai.aliyuncs.com/viapi-3.0domepic/facebody/DetectBodyCount/DetectBodyCount1.jpg'))