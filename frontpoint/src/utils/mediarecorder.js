/*
媒体录制，截图等
*/
import {dateFormat} from './date'

// 从DOM元素获取图片objectURL
export const domImageFrameCapture = (dom) => {
    if (!dom) {
        console.error("参数错误")
        return false
    }
    const width = dom.clientWidth, height = dom.clientHeight
    console.log(width, height)

    // canvas
    const canvasDOM = document.createElement('canvas')
    canvasDOM.setAttribute("width", width)
    canvasDOM.setAttribute("height", height)
    canvasDOM.getContext('2d').drawImage(dom, 0, 0, width, height)

    const ret = canvasDOM.toDataURL('image/png')
    canvasDOM.remove()
    return ret
}

// 保存URL数据到本地
export const saveImage = (url, fileName) => {
    const aDOM = document.createElement('a')
    aDOM.style.display = 'none'
    aDOM.href = url
    if (!fileName) {
        fileName = `截图_${dateFormat("YYYY-mm-dd HH:MM")}.png`
    }
    aDOM.download = fileName
    aDOM.click()
    aDOM.remove()
    return fileName
}

export class VideoRecorder {
    constructor(props) {
        this.recorder = null
        this.buffer = []
        this.timeslice = 5
        this.stream = props.stream || null
        if (!this.stream && props.videoDOM) {
            this.stream = props.videoDOM.captureStream()
        }

        this.isRecord = false
        if (this.stream) {
            this.recorder = new MediaRecorder(this.stream, {mimeType: 'video/webm;codecs=vp8'})
        }
    }

    start = ()=>{
        if (!this.stream) {
            this.error("没有视频流")
            return false
        }

        if (this.isRecord) {
            this.log("正在录制")
            return false
        }

        this.buffer = []
        this.recorder.ondataavailable = (e)=>{
            if (e && e.data && e.data.size > 0) {
                this.buffer.push(e.data)
            } 
        }
        this.recorder.start(this.timeslice);
    }

    stop = () => {
        if (this.isRecord) {
            this.log("没有录制")
            return false
        }
        return this.recorder && this.recorder.stop()
    }

    save = async (fileName) => {
        if (!fileName) {
            fileName = `录制_${dateFormat("YYYY-mm-dd HH:MM")}.webm`
        }
        this.stop()

        const blob = new Blob(this.buffer, {type: 'video/webm'})
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        
        a.href = url
        a.style.display = 'none'
        a.download = `录制_${fileName}.webm`
        a.click()
        a.remove()
        return fileName
    }

    log() {
        console.log(...arguments)
    }

    error() {
        console.error(...arguments)
    }
}