import {config} from '../lib/config'
import SpeechRecognizer from '../lib/speechrecognizer'
import StreamRecorder from './streamrecorder'

export default class StreamSpeechRecognizer{
    constructor(props) {
        console.log(props)
        this.recorder = null;
        this.speechRecognizer = null;
        this.isCanSendData = false;
        this.isCanStop = true;
        this.stream = props.stream
        if (!this.stream && props.audioDOM) {
            this.stream = props.audioDOM.captureStream()
        }

        console.log("stream:", this.stream);

        const params = {
            // 用户参数
            secretid:  config.secretId,
            appid: config.appId,
            // 实时识别接口参数
            engine_model_type : '16k_zh', // 引擎
            voice_format : 1,
            // 以下为非必填参数，可跟据业务自行修改
            hotword_id : '08003a00000000000000000000000000',
            needvad: 1,
            filter_dirty: 1,
            filter_modal: 1,
            filter_punc: 1,
            convert_num_mode : 1,
            word_info: 2
        }
        
        let resultText = '';
        this.speechRecognizer = null;
        this.isCanSendData = false; 
        // 获取录音数据
        this.recorder = new StreamRecorder({stream: this.stream});
        this.recorder.OnReceivedData = (res) => {
            // console.log("采集数据 ", res) // res 为采集到浏览器数据
            if (this.isCanSendData) {
                // 发送数据
                this.speechRecognizer.write(res);
            }
        };
        // 录音失败时
        this.recorder.OnError = (err) => {
            console.log("录音失败", err);
            this.recorder.stop();
        };
        this.recorder.start();

        if (!this.speechRecognizer) {
            this.speechRecognizer = new SpeechRecognizer(params)
        }
        // 开始识别
        this.speechRecognizer.OnRecognitionStart = (res) => {
            console.log('开始识别', res);
            this.isCanSendData = true;
            this.isCanStop = true;
        };
        // 一句话开始
        this.speechRecognizer.OnSentenceBegin = (res) => {
            console.log('一句话开始', res);
        };
        // 识别变化时
        this.speechRecognizer.OnRecognitionResultChange = (res) => {
            // console.log('识别变化时', res);
            const currentText = `${resultText}${res.voice_text_str}`;
            this.OnRecognitionResultChange(res.voice_text_str)
            // this.OnRecognitionResultChange(currentText)
        };
        // 一句话结束
        this.speechRecognizer.OnSentenceEnd = (res) => {
            // console.log('一句话结束', res);
            resultText += res.voice_text_str;
            // this.OnSentenceEnd(resultText)
            this.OnSentenceEnd(res.voice_text_str)
        };
        // 识别结束
        this.speechRecognizer.OnRecognitionComplete = (res) => {
            console.log('识别结束', res);
            this.isCanSendData = false;
        };
        // 识别错误
        this.speechRecognizer.OnError = (res) => {
            console.log('识别失败', res);
            this.isCanSendData = false;
        };
    }

    // 语音识别
    start = ()=>{
        // 建立连接
        this.speechRecognizer.start();
    }

    stop = ()=>{
        console.log("停止语音识别")
        this.recorder.stop();
        if (this.speechRecognizer) {
            this.speechRecognizer.stop();
        }
    }

    // 识别变化时
    OnRecognitionResultChange(text){
        console.log(text)
    }

    // 一句话识别结束
    OnSentenceEnd(text){

    }

}


