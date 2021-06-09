# -*- coding: utf-8 -*-
import sys, random, string

from typing import List

from alibabacloud_dysmsapi20170525.client import Client as Dysmsapi20170525Client
from alibabacloud_tea_openapi import models as open_api_models
from alibabacloud_dysmsapi20170525 import models as dysmsapi_20170525_models
from config import Constants

class Sample:
    def __init__(self):
        pass

    @staticmethod
    def create_client(
        access_key_id: str,
        access_key_secret: str,
    ) -> Dysmsapi20170525Client:
        """
        使用AK&SK初始化账号Client
        @param access_key_id:
        @param access_key_secret:
        @return: Client
        @throws Exception
        """
        config = open_api_models.Config(
            # 您的AccessKey ID,
            access_key_id=access_key_id,
            # 您的AccessKey Secret,
            access_key_secret=access_key_secret
        )
        # 访问的域名
        config.endpoint = 'dysmsapi.aliyuncs.com'
        return Dysmsapi20170525Client(config)

    @staticmethod
    def main(
        args: List[str],
    ) -> None:
        # print(args)
        # client = Sample.create_client('accessKeyId', 'accessKeySecret')
        client = Sample.create_client(Constants.ACCESS_KEY_ID, Constants.ACCESS_KEY_SECRET)
        send_sms_request = dysmsapi_20170525_models.SendSmsRequest(
            phone_numbers=args[0],
            sign_name='ABC商城',
            template_code='SMS_197872624',
            template_param='{"code":"' + args[1] + '"}'
        )
        # 复制代码运行请自行打印 API 的返回值
        client.send_sms(send_sms_request)

    @staticmethod
    async def main_async(
        args: List[str],
    ) -> None:
        client = Sample.create_client('accessKeyId', 'accessKeySecret')
        send_sms_request = dysmsapi_20170525_models.SendSmsRequest(
            phone_numbers=args[0],
            sign_name='ABC商城',
            template_code='SMS_197872624',
            template_param='{"code":"' + args[1] + '"}'
        )
        # 复制代码运行请自行打印 API 的返回值
        await client.send_sms_async(send_sms_request)


def MobieCode(mobie, code=None):
    if not code:
        code = random.sample(string.digits, 6)
        code = ''.join(code)
    Sample.main([mobie, code])
    return mobie, code

if __name__ == '__main__':
    code = MobieCode('17396240186')
    print(code)