
import React, { Component, Fragment } from "react"
import {withRouter} from 'react-router-dom'
import { Modal, NavBar, Icon, Button, WhiteSpace, WingBlank, Toast} from 'antd-mobile';
import 'antd-mobile/dist/antd-mobile.css';
import TRTC from 'trtc-js-sdk';
import sockjs from 'socket.io-client'
import {genTestUserSig} from '../../debug/trtc'
import StreamSpeechRecognizer from '../../utils/streamspeechrecognizer'
import {domImageFrameCapture, saveImage} from '../../utils/mediarecorder'
import FaceRecognizer from '../../utils/facerecognizer'
import $ from 'jquery'
import {MyCookie} from '../../utils/commons'
import MyUpload from '../upload/index'
import './index.css'
import {request} from '../../utils/commons'
import { CONSTANT } from "../../constant";
// import creatHistory from 'history/createHashHistory'
// const history = creatHistory();  //返回上一页这段代码


const history = require("history").createHashHistory()
const alert = Modal.alert;

class MediaChat extends Component{
    constructor(props) {
        super(props)
        const id = props.match.params.id
        this.state = {
            onLineStatus: {
                admin: "离线",
                relative: "离线",
                prisoner: "离线"
            },
            session: "",
            user: "",
            vistRecordID: id,
            user_type: "",
            vist_record: null,
            // user_type: "prisoner",
            // vist_record: {
            //     "apply_desc": "测试",
            //     "create_time": "2021-06-07 16:09:49",
            //     "current_time": "2021-06-08 03:55:04",
            //     "end_time": "2021-06-08 16:00:00",
            //     "id": 1,
            //     "prisoner_id": 2,
            //     "real_chat_time": null,
            //     "relative_id": 3,
            //     "room_id": "ba6315ce-c767-11eb-8fc1-525400aa89b3",
            //     "start_time": "2021-06-07 16:00:00",
            //     "status": "已通过",
            //     "update_time": "2021-06-07 16:10:06"
            // },
            confidenceLowLimit: 0.6,
            currentRelative: true,
            isFaceRecognizer: false,
            // isFaceRecognizer: true,
            isConnection: false,
            isJoinRoom: false,
            isChat: false,
        }
        

    }

    render(){
        return (
            <Fragment>

                <div className="main-container">
                    {/* 导航栏 */}
                    <NavBar
                    mode="dark"
                    icon={<Icon type="left" />}
                    onLeftClick={this.goBack}
                    className="nav-bar"
                    rightContent={[
                        <Icon key="0" type="ellipsis" onClick={this.selectCamera} />,
                    ]}
                    >{this.state.user_type}:管理员{this.state.onLineStatus.admin}</NavBar>

                    {/* 视频容器 */}
                    <div id="video-main-container">
                        <video autoPlay playsInline src={this.state.mainVideo} id="main-video"></video>
                    </div>
                    <div className="video-select" style={{display: (this.state.isFaceRecognizer && this.state.isChat) ? " " : "none"}}>
                        <div id="video-admin-container"></div>
                        <div id="video-relative-container" onClick={this.relativeClick}  className={this.state.currentRelative ? "select" : ""}></div>
                        <div id="video-prisoner-container" onClick={this.prisonerClick} className={this.state.currentRelative ? "" : "select"}></div>
                    </div>

                    {/* 按钮 */}
                    <WingBlank className="btn-container">
                        <WhiteSpace /><WhiteSpace /><WhiteSpace /><WhiteSpace /><WhiteSpace /><WhiteSpace />
                        <WhiteSpace /><WhiteSpace /><WhiteSpace /><WhiteSpace /><WhiteSpace /><WhiteSpace />
                        <WhiteSpace /><WhiteSpace /><WhiteSpace /><WhiteSpace /><WhiteSpace /><WhiteSpace />
                        <WhiteSpace /><WhiteSpace /><WhiteSpace /><WhiteSpace /><WhiteSpace /><WhiteSpace />
                        <WhiteSpace /><WhiteSpace /><WhiteSpace /><WhiteSpace /><WhiteSpace /><WhiteSpace />
                        <WhiteSpace /><WhiteSpace /><WhiteSpace /><WhiteSpace /><WhiteSpace /><WhiteSpace />
                        <WhiteSpace /><WhiteSpace /><WhiteSpace /><WhiteSpace /><WhiteSpace /><WhiteSpace />
                        <WhiteSpace /><WhiteSpace /><WhiteSpace /><WhiteSpace /><WhiteSpace /><WhiteSpace />
                        <WhiteSpace /><WhiteSpace /><WhiteSpace /><WhiteSpace /><WhiteSpace /><WhiteSpace />
                    
                        <Button type="primary" className="btn" onClick={this.onFaceRecognizerClick} style={{display: !this.state.isFaceRecognizer ? " " : "none"}}>人脸识别</Button>
                        <Button type="primary" className="btn" onClick={this.onRequestClick} style={{display: (this.state.isFaceRecognizer && !this.state.isChat) ? " " : "none"}}>请求连接</Button>
                        <WhiteSpace />
                    </WingBlank>
                </div>

            </Fragment>
        )
    }

    selectCamera = async () => {
        console.log("selectCamera")
        this.cameras = await TRTC.getCameras()
        let btns = []
        for (let i = 0; i < this.cameras.length; i++) {
            btns = [...btns, {
                text: this.cameras[i].label,
                onPress: ()=> {
                    this.switchDevice(this.cameras[i].deviceId)
                }
            }]
        }
        if (btns.length) {
            alert('提示', <div>切换摄像头</div>, btns)
        }
    }

    goBack = () => {
        alert('退出', '是否退出?', [
            { text: '取消', onPress: () => console.log('cancel') },
            {
              text: '确定',
              onPress: () =>
                new Promise((resolve) => {
                  history.goBack()
                  setTimeout(resolve, 1);
                }),
            },
          ])
    }

    // 生命周期函数
    async componentDidMount() {
        const id = this.state.vistRecordID
        if (!id) {
            return false
        }
        // 获取用户信息
        await this.getUser()

        // 获取vist_record
        await this.getVistRecord(id)

        // 获取本地视频
        this.getLocalVideo()

        // 进入房间
        this.connectSocketIO()
    }

    componentWillUnmount () {
        console.log("componentWillUnmount")
        this.disconnectTRTC()
        this.leaveRoom()
        this.disconnectSocketIO()
    }

    async componentWillReceiveProps(nextProps) {
        const id = nextProps.match.params.id;
        console.log(nextProps)
    }

    // 连接websocket
    otherJoin = (e) => {
        console.log('otherJoin', e)
        this.setState({onLineStatus: e.status})
        Toast.info(`${e.user_type}上线`)
    }

    otherLeaved = (e) => {
        console.log('otherLeaved', e)
        this.setState({onLineStatus: e.status})
        if (e.user_type === "admin") {
            Toast.info(`管理员离线,即将退出`)
            setTimeout(()=>history.goBack(), 3000);
        }
        else {
            Toast.info(`${e.user_type}离线`)
        }
    }

    // TODO
    recvMessage = (e) => {
        console.log('recvMessage', e)
        if (e.from !== "admin" || e.to !== this.state.user_type) {
            return false
        }
        alert('消息', e.msg, [{ text: '确定', onPress: () => console.log('确定') }])
    }

    recvControlMessage = async (e) => {
        console.log('recvControlMessage', e)
        const localStream = this.localStream
        const client = this.client
        // from: "admin", to: "relative", control: "MUTE_AUDIO"
        if (e.from !== "admin" || !localStream || !client) {
            return false
        }
        if (e.control === "CLOSE") {
            Toast.info(`强制结束会见`)
            setTimeout(()=>history.goBack(), 3000);
        }
        else if (e.control === "MUTE_AUDIO") {
            await client.unpublish(localStream)
            localStream.muteAudio()
            await client.publish(localStream)
            Toast.info('您已被静音')
        }
        else if (e.control === "UNMUTE_AUDIO") {
            await client.unpublish(localStream)
            localStream.unmuteAudio()
            await client.publish(localStream)
            Toast.info('您已被解除静音')
        }
        else if (e.control === "MUTE_VIDEO") {
            await client.unpublish(localStream)
            localStream.muteVideo()
            await client.publish(localStream)
           
            Toast.info('摄像头已屏蔽')
        }
        else if (e.control === "UNMUTE_VIDEO") {
            await client.unpublish(localStream)
            localStream.unmuteVideo()
            await client.publish(localStream)
            
            Toast.info('摄像头已解除屏蔽')
        }

    }

    leaveRoom = () => {
        if (!this.socket) {
            return false
        }
        this.socket.emit('leave', {
            session: this.state.session,
            roomID: this.state.vist_record.room_id,
            user_type: this.state.user_type,
            vist_record_id: this.state.vist_record.id
        })
    }

    connectSocketIO = () => {
       this.socket = sockjs(CONSTANT.WEBSOCKET_API, {
            transports: ['websocket']
           })

       // 不间断尝试重连接
       this.socket.on('reconnect_attempt',()=> { 
           console.log("重新连接WEBSOCKET")
           this.socket.transports = ['websocket','polling', 'flashsocket']; 
       });
   
       // 重连接时出错
       this.socket.on('reconnect_error',(attemptNumber)=> { 
           this.setState({isConnection: false})
           console.error("重新连接WEBSOCKET出错")
           console.error(attemptNumber)
       });
   
       //连接成功走这个方法
       this.socket.on('connect',()=>{
           console.log("成功连接WEBSOCKET")
           console.log(this.socket.connected)
           this.setState({isConnection: true})
           this.socket.emit('join', {
                session: this.state.session,
                roomID: this.state.vist_record.room_id,
                user_type: this.state.user_type,
                vist_record_id: this.state.vist_record.id
            })
       })
   
       //报错时走这个方法
       this.socket.on('connect_error', (error) => {
           console.error('连接WEBSOCKET出错')
           console.error(error)
           this.setState({isConnection: false})
       });
   
       //连接存活验证 
       this.socket.on('pong', (error) => {
           console.log('WEBSOCKET连接正常')
       });

       // 成功加入房间
       this.socket.on('joined', e => {
            // Toast.success("加入房间")
            console.log('joined', e)
            this.setState({
                onLineStatus: e,
                isJoinRoom: true
            })
       })

       // 成功离开房间
       this.socket.on('leaved', ret=>{
           console.log("leaved")
        //    message.success('已离开WEBSOCKET房间')
       })

       // 其它用户加入
       this.socket.on('other_joined', this.otherJoin)

       // 其它用户离开
       this.socket.on('other_leaved', this.otherLeaved)

       // 发送消息回执
    //    this.socket.on('messaged', ()=>{})

       // 收到消息
       this.socket.on('message', this.recvMessage)

       // 控制消息
       this.socket.on('control', this.recvControlMessage)
       
       this.socket.on('controled', ret=>{
           console.log("已发送控制消息", ret);
       })
    }

    getLocalVideo = async () => {
        if (!this.state.user_type) {
            return false
        }
        const localStream = TRTC.createStream({ userId: this.state.user_type, audio: true, video: true });
        this.localStream = localStream
        console.log("初始化本地流")
        await localStream.initialize()
            .catch(error => {
                console.error('初始化本地流失败 ' + error);
            })
        console.log('初始化本地流成功');
        console.log('本地用户:', localStream.getId())
        // localStream.muteVideo();
        document.getElementById(`video-${this.state.user_type}-container`).innerHTML = ""
        localStream.play(`video-${this.state.user_type}-container`)

        if (this.state.user_type === 'relative') {
            this.setState({currentRelative: true})
        }
        else {
            this.setState({currentRelative: false})
        }
        const videoDOM = this.getVideoDom(this.state.user_type)
        if (videoDOM) {
            document.getElementById("main-video").srcObject = videoDOM.captureStream()
        }
    }

    switchDevice = (cameraID) => {
        if (cameraID) {
            return false
        }
        if (this.localStream) {
            this.localStream.switchDevice('video', cameraID).then(() => {
                Toast.info("切换成功")
                document.getElementById(`video-${this.state.user_type}-container`).innerHTML = ""
                this.localStream.play(`video-${this.state.user_type}-container`)
              });
        }          
    }

    disconnectSocketIO = () => {
        if (!this.socket || this.state.vist_record) {
            return false
        }
        this.socket.emit("leave", {
            session: this.state.session,
            roomID: this.state.vist_record.room_id,
            user_type: this.state.user_type,
            vist_record_id: this.state.vist_record.id
        })
    }

    connectTRTC = async ()=>{
        console.log("connectTRTC")
        if (!this.state.vist_record || !this.state.user_type) {
            return false
        }
        const roomID = this.state.vist_record.room_id
        const userID = this.state.user_type
        console.log("connectTRTC", roomID, userID)
        // TRTC
        const usig = await genTestUserSig(userID)
        this.client = TRTC.createClient({
            useStringRoomId: true,
            mode: 'rtc',
            ...usig
            });

        this.client.on('stream-added', event => {
            const remoteStream = event.stream;
            // console.log('远端流增加: ' + remoteStream.getId());
            // 订阅远端流
            this.client.subscribe(remoteStream);
        });

        this.client.on('stream-subscribed', event => {
                const remoteStream = event.stream;
                const userID = event.stream.userId_

                Toast.success(`${userID}加入视频`)
                // console.log('远端流订阅成功：' + remoteStream.getId());
                
                // 播放远端流
                if (userID === 'relative') {
                    remoteStream.play(`video-relative-container`)
                }
                else if (userID === 'prisoner') {
                    remoteStream.play(`video-prisoner-container`)
                }
            });

        await this.client.join({ roomId: roomID })
            .catch(error=>{
                console.error('进房失败 ' + error);
            })
        console.log("进房成功");
        // message.success("进入房间")
        this.setState({isChat: true})
        if (!this.localStream) {
            this.getLocalVideo()
        }

        await this.client.publish(this.localStream)
        .catch(error => {
            console.error('本地流发布失败 ' + error);
        })
        console.log('本地流发布成功');
    }

    // 退出房间
    disconnectTRTC = async ()=>{
        if (!this.client || !this.client.leave) {
            return false
        }
        this.client.leave()
            .then(() => {
                // 退房成功，可再次调用client.join重新进房开启新的通话。
                console.log('退房成功');
            })
            .catch(error => {
                console.error('退房失败 ' + error);
                // 错误不可恢复，需要刷新页面。
            });
    }

    // 获取
    getVistRecord = async (id) => {
        if (!id) {
            return false
        }
        // 根据id获取探监申请
        let url = CONSTANT.VIST_RECORD_RELATION_API
        if (this.state.user_type === 'prisoner') {
            url = CONSTANT.VIST_RECORD_PRISONER_API
        }
        const ret = await request(url, {
            methods: "GET",
            params: {id}
        })
        console.log("获取探监申请:", ret.data)
        
        if (ret.errno === "0") {
            const vist_record = ret.data.list[0]
            this.setState({vist_record})
        }
        else {
            Toast.fail("没有获取到探监记录")
            return false
        }
    }

    getUser = async () => {
        const ret = await request(CONSTANT.SESSION_API, {
            methods: 'GET'
        })
        console.log("获取用户信息:", ret.data)
        if (ret.errno === '0') {
            this.setState({user: ret.data.user})
            if (ret.data.user.user_type === "家属") {
                this.setState({user_type: "relative"})
            }
            else if (ret.data.user.user_type === "服刑人员") {
                this.setState({user_type: "prisoner", isFaceRecognizer: true})
            }
        }
        else {
            Toast.fail(ret.errmsg)
        }
    }

    relativeClick = e => {
        // 获取
        const videoDOM = this.getVideoDom('relative')
        if (!videoDOM) {
            return false
        }
        document.getElementById("main-video").srcObject = videoDOM.captureStream()
        this.setState({
            currentRelative: true
        })
    }

    prisonerClick = e => {
        // 获取
        const videoDOM = this.getVideoDom('prisoner')
        if (!videoDOM) {
            return false
        }
        document.getElementById("main-video").srcObject = videoDOM.captureStream()
        this.setState({
            currentRelative: false
        })
    }

    onFaceRecognizerClick = async e => {
        const videoDOM = this.getVideoDom('main')
        if (!videoDOM) {
            return false
        }
        Toast.loading("人脸识别中", 10)
        const ret = await FaceRecognizer.recognizer(videoDOM)
        Toast.hide()
        // const ret = {
        //     errmsg: "识别成功",
        //     errno: "0",
        //     data: {
        //         confidence: 0.7
        //     }
        // }
        if (ret.errno === "0") {
            // confidence
            if (ret.data.confidence >= this.state.confidenceLowLimit) {
                Toast.success('人脸识别成功', 2);
                this.setState({isFaceRecognizer: true})
            }
            else {
                Toast.fail('非本人操作', 1);
            }
        }
        else {
            Toast.fail(ret.errmsg, 2);
        }
    }   

    onRequestClick = async e => {
        if (!this.state.isConnection) {
            Toast.loading("未连接请稍后再试")
            this.connectSocketIO()
            return false
        }
        else if (!this.state.isJoinRoom) {
            Toast.loading("未加入房间请稍后再试")
            this.joinRoom()
            return false
        }
        if (this.state.onLineStatus.admin === "离线") {
            Toast.loading("管理员离线，请稍后再试")
            return false
        }
        this.connectTRTC()
    }

    getVideoDom = (user_type) => {
        const videoDOM = document.querySelector(`#video-${user_type}-container video`)
        if (!videoDOM) {
            console.log("获取视频DOM失败")
            return false
        }
        return videoDOM
    }
   
}

export default withRouter(MediaChat)