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


