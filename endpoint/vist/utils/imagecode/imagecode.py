from wheezy.captcha.image import captcha

from wheezy.captcha.image import background
from wheezy.captcha.image import curve
from wheezy.captcha.image import noise
from wheezy.captcha.image import smooth
from wheezy.captcha.image import text

from wheezy.captcha.image import offset
from wheezy.captcha.image import rotate
from wheezy.captcha.image import warp

import random
import string
import io
import os


def ImageCode():
    captcha_image = captcha(drawings=[
        background(),
        text(fonts=[
            'vist/utils/imagecode/fonts/CourierNew-Bold.ttf',
            'vist/utils/imagecode/fonts/LiberationMono-Bold.ttf'],
            drawings=[
                warp(),
                rotate(),
                offset()
            ]),
        curve(),
        noise(),
        smooth()
    ])

    code = random.sample(string.ascii_uppercase + string.digits, 4)
    image = captcha_image(code)
    code = ''.join(code)

    imgByteArr = io.BytesIO()
    image.save(imgByteArr, format='JPEG', quality=75)
    imgByteArr = imgByteArr.getvalue()

    # image.show()
    print(os.getcwd())

    return code, imgByteArr

# class ImageCode:
#     captcha_image = captcha(drawings=[
#         background(),
#         text(fonts=[
#             'C:/Users/lsqy/Desktop/wxmnapi/Awesome-Flask-Web-Chat/chat/utils/imagecode/fonts/CourierNew-Bold.ttf',
#             'C:/Users/lsqy/Desktop/wxmnapi/Awesome-Flask-Web-Chat/chat/utils/imagecode/fonts/LiberationMono-Bold.ttf'],
#             drawings=[
#                 warp(),
#                 rotate(),
#                 offset()
#             ]),
#         curve(),
#         noise(),
#         smooth()
#     ])
#
#     @staticmethod
#     def getByte():
#         text = random.sample(string.ascii_uppercase + string.digits, 4)
#         image = ImageCode.captcha_image(text)
#         text = ''.join(text)
#
#         imgByteArr = io.BytesIO()
#         image.save(imgByteArr, format='JPEG', quality=75)
#         imgByteArr = imgByteArr.getvalue()
#
#         image.show()
#         print(text)
#
#         return text, imgByteArr


if __name__ == '__main__':
    # print(ImageCode.getByte())
    ImageCode()





