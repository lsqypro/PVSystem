/* 
videoplayer 提供流媒体播放容器，控制流媒体等
*/
import React, {Component, Fragment} from 'react'
import {
    Button, 
    Space,
    Tooltip,
    Input,
    Image,
    Menu,
    Form,
    Dropdown,
    Checkbox,
    message
} from 'antd'
import { CameraOutlined, 
    AudioOutlined, 
    VideoCameraOutlined, 
    AudioMutedOutlined, 
    VideoCameraAddOutlined,
    FontColorsOutlined,
    SmileOutlined,
    MessageOutlined,
    CloseCircleOutlined
} from '@ant-design/icons';
import {domImageFrameCapture, saveImage, VideoRecorder} from '../../utils/mediarecorder'
import StreamSpeechRecognizer from '../../utils/streamspeechrecognizer'
import {dateFormat} from '../../utils/date'
import FaceRecognizer from '../../utils/facerecognizer'

import './index.css'
import { request } from '../../utils/commons';
import { CONSTANT } from "../../constant";

export default class VideoPlayer extends Component {
    constructor(props) {
        super(props)
        this.state = {
            user: {
                id: 0,
                avatar_url: ""
            },
            title: "用户",  // 窗口名
            userID: Date.parse(new Date()),
            videoID: Date.parse(new Date()),  // 视频容器ID
            avatar_url: "https://zos.alipayobjects.com/rmsportal/ODTLcjxAfvqbxHnVXCYX.png",
            isMuteAudio: false,  
            isMuteVideo: false,
            isVideoRecording: false,
            isTextRecording: false,
            status: "离线",
            bodyNumber: 0,
            accuracy: 0,
            faceTimeVar: 3000,
            confidenceLowLimit: 0.6,
            sendMessageText: "",
            sentenceList: [{
                'name': 'relative',
                'time': 'YYYY-mm-dd HH:MM:SS',
                'sentence': "这是 一个富强明主文明和谐的社会"
            }],
            keywordsMaxCount: 1,
            keywords: {
                maxCount: 0,
                wordsList: [
                    {
                        words: "富强",
                        count: 0,
                        sentenceIndexList: []
                    }
                ]
            },
            currentSentence: "",
            ...props
        }
    }

    render() {
        // const send_to = (
        //     <Menu>
        //       <Menu.Item>
        //         1st menu item
        //       </Menu.Item>
        //       <Menu.Item>
        //         2nd menu item
        //       </Menu.Item>
        //       <Menu.Item>
        //         3rd menu item
        //       </Menu.Item>
        //     </Menu>
        //   );

        // const message_list = (
        //     <textarea className="message-history" defaultValue={this.state.message_list.map(v=>v)}></textarea>
        // )

        // const send_message = (
        //     <div className="message-container">
        //         发送消息
        //         <br />
        //         {message_list}
        //         <Form
        //         name="basic"
        //         initialValues={{ isToRelation: true }}
        //         onFinish={this.onFinish}
        //         onFinishFailed={this.onFinishFailed}
        //         >
                    
        //         <Form.Item
        //             label="消息"
        //             name="message"
        //             rules={[{ required: true, message: '请输入你要发送的消息!' }]}
        //         >
        //             <Input />
        //         </Form.Item>

        //         <Form.Item>
        //             <Dropdown overlay={send_to} placement="bottomLeft">
        //                 <Button>常用消息</Button>
        //             </Dropdown>
        //         </Form.Item>
                

        //         <Form.Item name="isToRelation" valuePropName="checked">
        //             <Checkbox>发送到家属</Checkbox>
        //         </Form.Item>
        //         <Form.Item name="isToPrisoner" valuePropName="checked">
        //             <Checkbox>发送到服刑人员</Checkbox>
        //         </Form.Item>

        //         <Form.Item >
        //             <Button type="primary" htmlType="submit">
        //             Submit
        //             </Button>
        //         </Form.Item>
        //         </Form>
        //     </div>
        // )

        return (
            <div className="video-container">
                <div>{this.state.title}</div>
                <div className="video-option">
                    <Space size={5}>
                        <Tooltip title={this.state.isMuteAudio ? "已静音" : "麦克风"}>
                            <Button type={this.state.isMuteAudio ? "default" : "primary"} icon={this.state.isMuteAudio ? <AudioMutedOutlined /> : <AudioOutlined />} 
                            onClick={this.onAudioMuteClick}
                            />
                        </Tooltip>

                        <Tooltip title={this.state.isMuteVideo ? "摄像头已关闭" : "摄像头"}>
                            <Button type={this.state.isMuteVideo ? "default" : "primary"} icon={<VideoCameraOutlined />} 
                            onClick={this.onVideoMuteClick}
                            />
                        </Tooltip>

                        <Tooltip title={"截图"}>
                            <Button type="default" icon={<CameraOutlined />} 
                            onClick={this.imageCapture}
                            />
                        </Tooltip>

                        <Tooltip title={this.state.isVideoRecording ? "视频录制中" : "视频录制"}>
                            <Button type={this.state.isVideoRecording ? "primary" : "default"} icon={<VideoCameraAddOutlined />} 
                            onClick={this.onVideoRecordClick}
                            />
                        </Tooltip>

                        <Tooltip title={this.state.isTextRecording ? "语音识别中" : "语音识别"}>
                            <Button type={this.state.isTextRecording ? "primary" : "default"} icon={<FontColorsOutlined />} 
                            onClick={this.onTextRecordClick}
                            />
                        </Tooltip>

                        <Tooltip title={this.state.isFaceRecognition ? "人脸识别中" : "人脸识别"}>
                            <Button type={this.state.isFaceRecognition ? "primary" : "default"} icon={<SmileOutlined />} 
                            onClick={this.onFaceRecognitionClick}
                            />
                        </Tooltip>

                
                        <Tooltip title={"踢出房间"}>
                            <Button type="default" icon={<CloseCircleOutlined />} 
                            onClick={this.onCloseVideoClick}
                            />
                        </Tooltip>

                        <Tooltip title={"消息"}>
                            <Input placeholder="请输入消息" value={this.state.sendMessageText} onChange={this.onSendMessageTextChange}></Input>
                        </Tooltip>
                        <Tooltip title={"发送消息"}>
                            <Button type="primary"
                            onClick={this.onSendMessageClick}
                            disabled={this.state.sendMessageText ? false : true}
                            >
                                发送
                            </Button>
                        </Tooltip>
                        <Tooltip title={"设置"}>
                            <Button type="primary"
                            onClick={this.onAddKeywordsClick}
                            disabled={this.state.sendMessageText ? false : true}
                            >
                                添加关键字
                            </Button>
                        </Tooltip>

                    </Space>
                </div>
                <Input placeholder="没有检测声音" disabled="true" value={this.state.currentSentence} onChange={this.onCurrentSentenceChange}></Input>
                <div>
                        <div className="video-avatar">
                            <div className="face-status">状态: {this.state.status} 人数: {this.state.bodyNumber} 相似度: {this.state.accuracy}%</div>
                            <Image
                                width={100}
                                src={this.state.user.avatar_url}
                                />
                        </div>
                    <div id={this.state.videoID} className="video-window">
                        
                        
                    </div>
                </div>
            </div>
        )
    }

    async componentDidMount() {
            
    }

    async componentWillReceiveProps(nextProps) {
        // const id = nextProps.match.params.id;
        this.props = nextProps
        this.setUser(nextProps)
        
        // this.checkSentence(0)
        // console.log("nextProps:", nextProps)
        // console.log("prop:", this.props)
    }

    componentWillUnmount () {
        this.closeOption()
    }

    onAddKeywordsClick = () => {
        const words = this.state.sendMessageText
        let keywords = this.state.keywords
        let wlist = keywords.wordsList

        wlist = [...wlist, {
            'words': words,
            'count': 0,
            sentenceIndexList: []
        }]
        keywords.wordsList = wlist
        this.setState({keywords, sendMessageText: ""})
        message.success(`添加关键字:${words}`)
        console.log(this.state.keywords)
    }

    // user
    setUser = (props) => {
        if (props.user) {
            // console.log("avatar", props.user.avatar_url)
            this.setState({
                user: props.user,
                avatar_url: props.avatar_url,
                status: props.status
            })
        }
    }

    // 说话显示变化时
    onSendMessageTextChange = (e) => {
        this.setState({
            sendMessageText: e.target.value
        });
    }

    // 点击麦克风
    onAudioMuteClick = () => {
        if (this.state.status === "离线") {
            message.error("用户离线")
            return false
        }
        const isMuteAudio = !this.state.isMuteAudio
        const onMuteClick = this.props.onMuteClick
        if (!onMuteClick) {
            return false
        }
        if (isMuteAudio) {
            onMuteClick({
                user_type: this.state.videoID, 
                opt: 'MUTE_AUDIO'
            })            
        }
        else {
            onMuteClick({
                user_type: this.state.videoID, 
                opt: 'UNMUTE_AUDIO'
            })            
        }
        this.setState({isMuteAudio})
    }

    // 点击摄像头
    onVideoMuteClick = () => {
        if (this.state.status === "离线") {
            message.error("用户离线")
            return false
        }
        const isMuteVideo = !this.state.isMuteVideo
        const onMuteClick = this.props.onMuteClick
        if (!onMuteClick) {
            return false
        }
        if (isMuteVideo) {
            onMuteClick({
                user_type: this.state.videoID, 
                opt: 'MUTE_VIDEO'
            })            
        }
        else {
            onMuteClick({
                user_type: this.state.videoID, 
                opt: 'UNMUTE_VIDEO'
            })            
        }
        this.setState({isMuteVideo})
    }

    // 截图
    imageCapture = () => {
        if (this.state.status === "离线") {
            message.error("用户离线")
            return false
        }
        const videoDOM = this.getVideoDOM()
        if (!videoDOM) {
            return false
        }
        const url = domImageFrameCapture(videoDOM)
        if (!url) {
            return false
        }
        return saveImage(url)
    }

    closeOption = () => {
        if(this.isVideoRecording) {
            this.onVideoRecordClick()
        }
        if (this.isTextRecording) {
            this.onTextRecordClick()
        }
        if (this.isFaceRecognition) {
            this.onFaceRecognitionClick()
        }
    }

    // 视频录制
    onVideoRecordClick = () => {
        if (this.state.status === "离线") {
            message.error("用户离线")
            return false
        }
        let isVideoRecording = !this.state.isVideoRecording
        
        if (isVideoRecording) {
            const videoDOM = this.getVideoDOM()
            if (videoDOM) {
                this.videoRecorder = new VideoRecorder({videoDOM})
                this.videoRecorder.start()
            }
            else {
                isVideoRecording = false
            }
        }
        else if (this.videoRecorder) {
            this.videoRecorder.save()
        }
        
        this.setState({isVideoRecording})
    }

    // 文本录制
    onTextRecordClick = async () => {
        if (this.state.status === "离线") {
            message.error("用户离线")
            return false
        }
        let isTextRecording = !this.state.isTextRecording
        
        if (isTextRecording) {
            const audioDOM = this.getAudioDOM()
            if (audioDOM) {
                this.textRecorder = new StreamSpeechRecognizer({audioDOM})

                this.textRecorder.OnRecognitionResultChange = text=>{
                    this.setState({currentSentence: text})
                }

                this.textRecorder.OnSentenceEnd = text=>{
                    if (text) {
                        const list = [...this.state.sentenceList, {
                            'name': this.state.title,
                            'time': dateFormat('YYYY-mm-dd HH:MM:SS'),
                            'sentence': text
                        }]
                        this.setState({sentenceList: list})
                        this.checkSentence(list, list.length-1)
                    }
                    this.setState({currentSentence: text})
                }
                
                this.textRecorder.start()
            }
            else {
                isTextRecording = false
            }
        }
        else if (this.textRecorder) {
            this.textRecorder.stop()
        }
        
        this.setState({isTextRecording})
    }

    // 检查句子
    checkSentence = (list, index) => {
        // console.log("index:", index)
        const sentence = list[index].sentence
        const keywords = this.state.keywords
        // console.log("checkSentence", sentence, keywords)
        
        // 查找关键字
        for (let i = 0; i < keywords.wordsList.length; i++) {
            const words = keywords.wordsList[i].words
            for (let j = 0; j + words.length <= sentence.length; j++) {
                console.log(`words:${words} sentence:${sentence} i:${i} j:${j} len:${words.length} ${words} ?= ${sentence.substr(j, words.length)}`)
                if (words === sentence.substr(j, words.length)) {
                    keywords.wordsList[i].count++
                    if (keywords.wordsList[i].count >= this.state.keywordsMaxCount) {
                        this.onWaring({
                                type: 'KEYWORDS', 
                                user_type: this.state.videoID,
                                words: keywords.wordsList[i],
                                sentenceList: list 
                            })
                        this.props.onWaring()
                    }
                    keywords.maxCount = keywords.wordsList[i].count > keywords.maxCount ? keywords.wordsList[i].count : keywords.maxCount
                    keywords.wordsList[i].sentenceIndexList = [...keywords.wordsList[i].sentenceIndexList, index]
                    break
                }
            }
        }
    }
    
    // waring
    onWaring = (data) => {
        if (this.props.onWaring) {
            this.props.onWaring(data)
        }
    }

    // 人脸识别
    onFaceRecognitionClick = async () => {
        if (this.state.status === "离线") {
            message.error("用户离线")
            return false
        }
        const isFaceRecognition = !this.state.isFaceRecognition

        if (isFaceRecognition) {
            const videoDOM = this.getVideoDOM()
            if (!videoDOM) {
                return false
            }

            this.faceTimer = setInterval(async ()=>{
                const ret = await FaceRecognizer.recognizer(videoDOM, this.state.user.id)
                if (ret.errno === "0") {
                    // confidence
                    if (ret.data.confidence < this.state.confidenceLowLimit) {
                        this.onWaring({
                            type: "FACE_RECOGNIZER",
                            user_type: this.state.videoID,
                            data: ret.data
                        })
                    }
                    this.setState({bodyNumber: ret.data.personNumber, accuracy: ret.data.confidence})
                    console.log(ret)
                }
            }, this.state.faceTimeVar)
        }
        else {
            if (this.faceTimer) {
                clearInterval(this.faceTimer)
            }
        }

        this.setState({isFaceRecognition})
    }

    // 发送消息
    onSendMessageClick = () => {
        if (this.state.status === "离线") {
            message.error("用户离线")
            return false
        }
        if (this.props.onMessageClick && this.state.sendMessageText) {
            this.props.onMessageClick({
                sendTo: this.state.videoID,
                msg: this.state.sendMessageText
            })
            this.setState({
                sendMessageText: ""
            });
        }
    }

    // 踢出房间
    onCloseVideoClick = () => {
        if (this.state.status === "离线") {
            message.error("用户离线")
            return false
        }
        if (this.props.onCloseClick) {
            this.props.onCloseClick({
                user_type: this.state.videoID
            })
        }
    }

    // 获取视频DOM
    getVideoDOM = () => {
        let ret = null
        if (this.state.videoID && (ret = document.querySelector(`#${this.state.videoID} video`)) ) {
            return ret
        }
        console.error("获取视频DOM失败")
        return false
    }

    getAudioDOM = () => {
        let ret = null
        if (this.state.videoID && (ret = document.querySelector(`#${this.state.videoID} audio`)) ) {
            return ret
        }
        console.error("获取音频DOM失败")
        return false
    }
    
}