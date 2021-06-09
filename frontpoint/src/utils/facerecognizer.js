import {domImageFrameCapture} from './screenshoter'
import {request} from './commons'
import {CONSTANT} from '../constant'


export default class FaceRecognizer {
    constructor(props) {

    }

    static recognizer = async (image, id, imageType='VIDEO_DOM') => {
        if (!image) {
            console.error("参数错误")
            return;
        }
        // URL, videoDOM
        if (imageType === 'VIDEO_DOM') {
            image = domImageFrameCapture(image)
        }

        let url = CONSTANT.USER_FACE_RECOGNIZE
        let data = {
            image: image
        }
        if (id) {
            url = CONSTANT.FACE_RECOGNIZE
            data = {
                image: image,
                user_id: id
            }
        }
        // console.log(image);
        // 识别
        // console.log("data:", data)
        const ret = await request(url, {
            method: 'POST',
            data: data
        })
        return ret
    }
}