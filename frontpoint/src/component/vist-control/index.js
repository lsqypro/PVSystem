
import React, { Component, Fragment, useState } from 'react';
import {Link, withRouter} from 'react-router-dom';
import './style.css'
import {Button, Modal, Input, message, Avatar, Form, Checkbox, Menu, Dropdown, Tooltip, Row, Col, Space, Card, Drawer } from 'antd';
import { MenuFoldOutlined, AudioOutlined, VideoCameraOutlined, AudioMutedOutlined, SnippetsOutlined} from '@ant-design/icons';
import sockjs from 'socket.io-client'
import TRTC from 'trtc-js-sdk';
import {genTestUserSig} from '../../debug/trtc'
import VideoPlayer from '../videoplayer'
import { CONSTANT } from "../../constant";
import { request } from '../../utils/commons';
import { dateFormat } from "../../utils/date";

// 主页
class VistControl extends Component {
    constructor(props) {
        super(props);
        const id = props.match.params.id
        this.closeTimeOutNum = 5

        this.state = {
            vist_recordID: id,
            vist_record: null,
            message_list: [],
            vist_record_text: "",
            isToken: false,
            isChatOpen: false,
            onLineStatus: {
                admin: "离线",
                relative: "离线",
                prisoner: "离线"
            },
            relative_avatar_url: "",
            prisoner_avatar_url: "",
            test: "hhh",
            relative: {},
            prisoner: {},
            isShowFaceRecognizerResult: false,
            warningText: ""
        }
        
    }

    render() {
        // 控制栏
        const controlFiled = (
            <Space size={5}>
                <Button onClick={this.onOpenChat} type={this.state.isChatOpen ? "primary" : "default"}>{this.state.isChatOpen ? "切断会见" : "开启会见"}</Button>
                <Button onClick={this.onToken} type={this.state.isToken ? "primary" : "default"}>插话</Button>
                {/* <Button onClick={this.test}>测试</Button> */}
                <div style={{color: "red"}}>
                    {this.state.vist_record_text} 
                </div>
            </Space>
        )

        // 视频窗口
        const videoContainer = (
            <Row gutter={10}>
                <Col span={12}>
                    <VideoPlayer 
                    title="亲属" 
                    videoID="relative"
                    user={this.state.relative}
                    test={this.state.test}
                    status={this.state.onLineStatus.relative}
                    avatar_url = {this.state.relative_avatar_url}
                    onMuteClick = {this.onMuteClick}
                    onMessageClick = {this.onMessageClick}
                    onCloseClick = {this.onCloseClick}
                    onWaring = {this.onWaring}
                    />
                </Col>
                <Col span={12}>
                    <VideoPlayer 
                    title="服刑人" 
                    videoID="prisoner"
                    user={this.state.prisoner}
                    test={this.state.test}
                    status={this.state.onLineStatus.prisoner}
                    avatar_url = {this.state.prisoner_avatar_url}
                    onMuteClick = {this.onMuteClick}
                    onMessageClick = {this.onMessageClick}
                    onCloseClick = {this.onCloseClick}
                    onWaring = {this.onWaring}
                    />
                </Col>
            </Row>
        )

        return (
                <Fragment>
                <Modal title="人脸识别" visible={this.state.isShowFaceRecognizerResult} onOk={this.onFaceModalOkClick} onCancel={this.onFaceModalCancelClick}>
                   <span>{this.state.warningText}</span>
                </Modal>
                <Space direction="vertical" style={{ width: '100%' }}>
                    {controlFiled}
                    {videoContainer}
                </Space>
            </Fragment>
        );
    }

    // 生命周期函数
    async componentDidMount() {
        const id = this.props.match.params.id;
        await this.getVistRecord(id)
        await this.showVistRecord()
        
        this.getUser('relative')
        await this.getUser('prisoner')
        this.connectSocketIO()
        this.connectTRTC()
    }

    async componentWillReceiveProps(nextProps) {
        
    }

    componentWillUnmount () {
        this.disconnectTRTC()
        this.disconnectSocketIO()
    }

    test = () => {
        const test = dateFormat()
        // console.log(test)
        this.setState({test})
    }

    onFaceModalOkClick = () => {
        if (this.close_user_type)
            this.onCloseClick({user_type: this.close_user_type})
        this.setState({isShowFaceRecognizerResult: false})
    }

    onFaceModalCancelClick = () => {
        this.closeTimeOutNum = 5
        this.setState({isShowFaceRecognizerResult: false})
    }

    // 开启通话
    onOpenChat = async () => {
        const isChatOpen = !this.state.isChatOpen

        if (isChatOpen) {
            // 进入websocket房间
            this.joinRoom()
        }
        else {
            // 退出websocket房间
            this.leaveRoom()
        }
        this.setState({isChatOpen})
    }

    // 获取探监申请信息
    getVistRecord = async (id) => {
        if (!id) {
            return false
        }
        // 根据id获取探监申请
        const ret = await request(CONSTANT.VIST_RECORD_MANAGER_API, {
            methods: "GET",
            params: {vist_record_id: id}
        })
        
        if (ret.errno === "0") {
            const vist_record = ret.data.list[0]
            this.setState({vist_record})
        }
        else {
            message.error("没有获取到探监记录")
            return false
        }
    }

    // 获取用户数据
    getUser = async (user_type) => {
        if (!this.state.vist_record) {
            message.error("获取用户信息失败")
            return false
        }
        let id = this.state.vist_record.relative_id
        if (user_type === 'prisoner') {
            id = this.state.vist_record.prisoner_id
        }
        // 获取用户数据，头像
        const ret = await request(CONSTANT.USER_MANAGER_API, {
            methods: "GET",
            params: {
                user_id: id
            }
        })

        if (ret.errno === "0") {
            console.log(user_type, id, ret)
            const user = ret.data.list[0]
            if (user_type === 'prisoner')
                this.setState({prisoner: user})
            else
                this.setState({relative: user})
        } else {
            message.error(ret.errmsg)
        }    
    }

    // 显示探监具体信息
    showVistRecord = async () => {
        if (this.state.vist_record) {
            if (this.timer) {
                clearInterval(this.timer)
            }
            this.timer = setInterval(this.flushVistRecordText, 1000)
        }
    }

    flushVistRecordText = () => {
        const vist_record_text = `当前时间:${dateFormat()} 允许时间段:${this.state.vist_record.create_time} - ${this.state.vist_record.end_time}`
        this.setState({vist_record_text})
    }

    // WEBSOCKET连接
    onMuteClick = (e) => {
        console.log("onMuteClick:", e)
        if (this.socket) {
            this.socket.emit('control', {
                session: this.state.session,
                roomID: this.state.vist_record.room_id,
                user_type: 'admin',
                vist_record_id: this.state.vist_record.id,
                data: {
                    from: "admin",
                    to: e.user_type,
                    control: e.opt
                }
            })
        }
    }

    onMessageClick = (e) => {
        // console.log(e)
        const socket = this.socket
        const vist_record = this.state.vist_record
        if (!socket || !vist_record) {
            return false
        }
        const data = {
            roomID: vist_record.room_id,
            session: "",
            user_type: 'admin',
            vist_record_id: vist_record.id,  
            data: {
                from: "admin",
                to: e.sendTo,
                msg: e.msg
            }
        }
        socket.emit('message', data)
        console.log(data)
    }

    onCloseClick = (e) => {
        console.log("onCloseClick", e)
        const socket = this.socket
        const vist_record = this.state.vist_record
        if (!socket || !vist_record) {
            return false
        }
        const data = {
            roomID: vist_record.room_id,
            session: "",
            user_type: "admin",
            vist_record_id: vist_record.id,  
            data: {
                from: "admin",
                to: e.user_type,
                control: "CLOSE"
            }
        }
        socket.emit('control', data)
        console.log(data)
    }

    // TODO
    onWaring = (e) => {
        if (!e) {
            return false
        }
        console.log("onWaring:", e)
        if (e.type === "KEYWORDS") {
            this.keywordsModal = Modal.warning({
                title: '关键词警告',
                content: `${e.words.words}出现了${e.words.count}次`
            })
            // KEYWORDS
            // type: 'KEYWORDS', 
            // user_type: this.state.videoID,
            // words: keywords.wordsList[i],
            // sentenceList: list 
            setTimeout(()=>this.keywordsModal.destroy(), 3000);
        }
        else if (e.type === "FACE_RECOGNIZER") {
            // FACE_RECOGNIZER
            // type: "FACE_RECOGNIZER",
            // user_type: this.state.videoID,
            // data: ret
            const warningText = ``
            // console.log(e.data.confidence, e.data.personNumber)
            if (e.data.personNumber >= 1) {
                this.closeTimeOutNum--
                this.close_user_type = e.user_type

                if (this.closeTimeOutNum === 0) {
                    this.onFaceModalOkClick()
                }
                else if (this.closeTimeOutNum > 0) {
                    const warningText = `出现未审批人员，是否结束会见(${this.closeTimeOutNum}后自动结束)`
                    this.setState({warningText, isShowFaceRecognizerResult: true})
                }
                else {
                    this.onFaceModalCancelClick()
                }
            }
        }
    }

    joined = (ret) => {
        console.log("joined", ret)
        this.setState({onLineStatus: ret})
    }

    otherJoin = (ret) => {
        console.log("otherJoin", ret)
        this.setState({onLineStatus: ret.status})
    }

    otherLeaved = (ret) => {
        console.log("otherLeaved", ret)
        this.setState({onLineStatus: ret.status})
    }

    controlMessage = (ret) => {
        console.log("controlMessage", ret)
    } 

    messaged = (ret) => {
        message.success("成功发送")
        console.log("成功发送:", ret)
        const message_list = [...this.state.message_list, ret]
        this.setState({message_list})
    }

    joinRoom = () => {
        this.socket.emit('join', {
            session: this.state.session,
            roomID: this.state.vist_record.room_id,
            user_type: 'admin',
            vist_record_id: this.state.vist_record.id
        })
    }

    leaveRoom = () => {
        if (!this.socket) {
            return false
        }
        this.socket.emit('leave', {
            session: this.state.session,
            roomID: this.state.vist_record.room_id,
            user_type: 'admin',
            vist_record_id: this.state.vist_record.id
        })
    }

    connectSocketIO = ()=>{
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
            console.error("重新连接WEBSOCKET出错")
            console.error(attemptNumber)
        });
    
        //连接成功走这个方法
        this.socket.on('connect',()=>{
            console.log("成功连接WEBSOCKET")
            console.log(this.socket.connected)
        })
    
        //报错时走这个方法
        this.socket.on('connect_error', (error) => {
            console.error('连接WEBSOCKET出错')
            console.error(error)
        });
    
        //连接存活验证 
        this.socket.on('pong', (error) => {
            console.log('WEBSOCKET连接正常')
        });

        // 成功加入房间
        this.socket.on('joined', this.joined)

        // 成功离开房间
        this.socket.on('leaved', ret=>{
            console.log("leaved")
            message.success('已离开WEBSOCKET房间')
        })

        // 其它用户加入
        this.socket.on('other_joined', this.otherJoin)

        // 其它用户离开
        this.socket.on('other_leaved', this.otherLeaved)

        // 发送消息回执
        this.socket.on('messaged', this.messaged)

        // 收到消息
        this.socket.on('message', ret=>{
            console.log("收到消息");
        })

        // 控制消息
        this.socket.on('control', this.controlMessage)
        
        this.socket.on('controled', ret=>{
            console.log("已发送控制消息", ret);
        })
        
    }

    disconnectSocketIO = () => {
        if (!this.socket || !this.state.vist_record) {
            return false
        }
        this.socket.emit("leave", {
            session: this.state.session,
            roomID: this.state.vist_record.room_id,
            user_type: 'admin',
            vist_record_id: this.state.vist_record.id
        })
    }

    // TRTC连接, 并不添加本地视频流
    connectTRTC = async ()=>{
        if (!this.state.vist_record) {
            return false
        }
        const roomID = this.state.vist_record.room_id
        const userID = 'admin'
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

                message.success(`${userID}加入视频`)
                // console.log('远端流订阅成功：' + remoteStream.getId());
                
                // 播放远端流
                if (userID === 'relative') {
                    document.getElementById(userID).innerHTML = ""
                    remoteStream.play(userID)
                }
                else if (userID === 'prisoner') {
                    document.getElementById(userID).innerHTML = ""
                    remoteStream.play(userID)
                }
            });

        await this.client.join({ roomId: roomID })
            .catch(error=>{
                console.error('进房失败 ' + error);
            })
        console.log("进房成功");
        message.success("进入房间")
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

    // 插话
    onToken = async () => {
        const isToken = !this.state.isToken
        if (isToken) {
            if (this.localStream) {
                this.localStream.unmuteAudio()
            }
            else {
                const localStream = TRTC.createStream({ userId: 'police', audio: true, video: false });
                console.log("初始化本地流")
                await localStream.initialize()
                    .catch(error => {
                        console.error('初始化本地流失败 ' + error);
                    })
                console.log('初始化本地流成功');
                console.log('本地用户:', localStream.getId())
                // localStream.muteVideo();
                // localStream.play('relative')
                if (this.client) {
                    await this.client.publish(localStream)
                    .catch(error => {
                        console.error('本地流发布失败 ' + error);
                    })
                    console.log('本地流发布成功');
                    this.localStream = localStream
                }
            }
            message.success("插话中")
        }
        else {
            if (this.localStream) {
                this.localStream.muteAudio()
            }
            message.success("已静音")
        }
       
        this.setState({isToken})
    }
}

export default withRouter(VistControl);