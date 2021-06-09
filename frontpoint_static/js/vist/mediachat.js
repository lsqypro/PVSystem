import {getUrlParams} from '../utils/utils.js';
import {MyCookie} from '../utils/commons.js';
import {Dialog} from '../component/dialog.js'

// turnserver -o -a -f -user=lsqypro:123456 -r lsqypro
// turnserver -o -a -f -user=lsqypro:123456 -r lsqypro
let PC_OPTIONS = {
    'iceServers': [{
        'urls': 'turn:1.15.136.145:3478',
        'credential': '123456',
        'username': 'lsqypro'
    }]
};

let SIGNAL_SERVER_ADDR = "https://www.qingyun.work:8888"

$(function() {
    // 返回
    $("#back-btn").click(function(){
        let dialog = new Dialog(
            '提示', 
            '是否退出',
            function() {
                history.back(-1);
                dialog.hide();
            },
            function() {
                dialog.hide();
            }
        );
        dialog.getElement().appendTo($('body'));
        dialog.show();
    }) 
    
    // 主窗口视频显示
    let main_video = document.getElementById("video-main");
    let main_video_flag = 1; 

    // 获取本地视频
    let local_video = document.getElementById("video-local");
    let local_stream;
    let local_media_options = {video: true, audio: true};
    getLocalUserMedia();
    
    // 远程视频
    let remote_video = document.getElementById("video-remote");
    let remote_stream;

    // 切换主视频
    let $locol_window = $(".locol");
    let $remote_window = $(".remote");

    $("#video-local").click(function(){
        main_video_flag = 1;
        flush_page();
        change_stream();
    });

    $("#video-remote").click(function(){
        main_video_flag = 2;
        flush_page();
        change_stream();
    });

    //////////////////////////////////////////////////////////////////////
    // 信令系统
    let socket, pc;
    let userID = 1, roomID=1, cookie="session";
    userID = getUrlParams("userID");
    roomID = getUrlParams("roomID");
    userID = MyCookie.get("session");
    log(userID, roomID, userID);

    // 链接完成后创建 PeerConnection
    function create_peer_connection() {
        pc = new RTCPeerConnection(PC_OPTIONS);
    
        pc.onnegotiationneeded = e => pc.createOffer()
        .then(desc => {
            pc.setLocalDescription(desc);  // 触发 pc.onicecandidate
            socket.emit('message', {userID: userID, roomID: roomID, cookie: cookie, desc: desc});
        })
        .catch(()=>{
            log("onnegotiationneeded faild");
        });
    
        pc.onicecandidate = e=>{
            if (e.candidate) {
                log('local find an new candidate');
                let desc = {
                    type: 'candidate',
                    sdpMLineIndex: e.candidate.sdpMLineIndex,
                    sdpMid: e.candidate.sdpMid,
                    candidate: e.candidate.candidate
                };
                // log("lcoal candidate:", desc);
                // 发送收集到的candidate
                socket.emit('message', {userID: userID, roomID: roomID, cookie: cookie, desc: desc});
            }
        };
    
        pc.ontrack = e=>{
            // 收到远端视频后触发
            remote_stream = e.streams[0];
            remote_video.srcObject = remote_stream;
            log('recive remote video ...');
        };
    
        // 先添加本地流,媒体协商时提供媒体处理能力信息
        local_stream.getTracks().forEach(track=>{
            pc.addTrack(track, local_stream);
        });
    }

    // 链接服务器成功
    function handle_connected(arg) {
        log("connected");
    
        socket.emit('join', {userID: userID, roomID: roomID, cookie: cookie});
    
        // 创建 peerConnection
        create_peer_connection();
    }

    // 加入房间成功
    function handle_joined(arg) {
        log("joined");
    }

    // 离开房间成功
    function handle_leaved(arg) {
        log("leaved");
    
        // 离开房间成功应释放资源
        if (socket) {
            socket.disconnect();
        }
        socket = null;
        close_steram();
    }

    // 另一个成员离开
    function handle_otherleave(arg) {
        log('otherleave');
        // 对方挂断
        leave();
    };

    // 媒体协商
    function handle_message(arg) {
        log('message');
        if (arg && arg.hasOwnProperty('desc') && arg.desc.hasOwnProperty('type')) {
            if (arg.desc.type === 'offer') {
                var desc = new RTCSessionDescription(arg.desc);
                pc.setRemoteDescription(desc);
                // createAnswer();
                pc.createAnswer()
                    .then(desc=>{
                        pc.setLocalDescription(desc);
                        socket.emit('message', {userID: userID, roomID: roomID, desc: desc});
                    })
                    .catch(e=>{
                        log("create Answer error");
                    });
            }
            else if (arg.desc.type === 'answer') {
                desc = new RTCSessionDescription(arg.desc);
                pc.setRemoteDescription(desc);
            }
            else if (arg.desc.type === 'candidate') {
                // console.log("net candidate:", arg.desc);
                let desc = new RTCIceCandidate({
                    sdpMLineIndex: arg.desc.sdpMLineIndex,
                    sdpMid: arg.desc.sdpMid,
                    candidate: arg.desc.candidate
                });
                pc.addIceCandidate(desc);
            }
            else {
                log("unknow message type");
            }
        }
    };

    // 保持连接
    function handle_keeplive(arg) {
        log('keeplive');
        // TODO 重置定时器
    };

    // 服务端发送error,代表服务端主动断开链接
    function handle_error(arg) {
        log('server return error:' + arg);
        leave();
    }

    // 另一个成员加入
    function handle_otherjoin(arg) {
        log('otherjoin');
    
        // createOffer
        pc.createOffer()
            .then(desc=>{
                pc.setLocalDescription(desc);  // 触发 pc.onicecandidate
                socket.emit('message', {userID: userID, roomID: roomID, cookie: cookie, desc: desc});
            })
            .catch(e=>{
                log("createOffer error");
            });
    };

    // 连接信令服务器
    function call() {
        // 链接信令服务器
        socket = io.connect(SIGNAL_SERVER_ADDR);
        socket.on('connected', handle_connected);
        socket.on('joined', handle_joined);
        socket.on('leaved', handle_leaved);
        socket.on('otherjoin', handle_otherjoin);
        socket.on('otherleave', handle_otherleave);
        socket.on('message', handle_message);
        socket.on('keeplive', handle_keeplive);
        socket.on('error', handle_error);
    }

    // 断开连接
    function leave() {
        log('leave...');
        
        if (socket) {
            socket.emit('leave', {userID: userID, roomID: roomID, cookie: cookie});
        }
        else {
            socket = null;
            close_stream();
        }
    }

    // 关闭pc
    function close_steram() {
        log('close stream');
    
        if (pc) {
            pc.close();
        }
        pc = null;
    
        if(local_stream){
            if ( local_stream.getTracks()) {
                local_stream.getTracks().forEach((track)=>{
                    track.stop();
                });
            }
        }
        flush_page();
    }

    //////////////////////////////////////////////////////////////////////
    // 更换视频源
    function change_stream() {
        if (main_video_flag === 1) {
            main_video.srcObject = local_stream;
        }
        else {
            main_video.srcObject = remote_stream;
        }
    }

    // 刷新页面样式
    function flush_page() {
        if(main_video_flag === 1) {
            $locol_window.addClass("video-select");
            $remote_window.removeClass("video-select");
        }
        else if(main_video_flag === 2) {
            $remote_window.addClass("video-select");
            $locol_window.removeClass("video-select");
        }
    }
    
    // 列出设备
    function showDevices() {
        navigator.mediaDevices.enumerateDevices()
        .then(data=>{
            console.log(data);
        })
        .catch(err=>{
            console.log(err);
        })
    }

    // 获取本地视频
    function getLocalUserMedia(){
        // navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia
        navigator.mediaDevices.getUserMedia(local_media_options)
        .then(stream=>{
            local_stream = stream;
            local_video.srcObject = local_stream;
            main_video.srcObject = local_stream;
            call();
        })
        .catch(e=>{
            console.log("获取本地视频失败", e);
        });
    }

    // 日志
    function log() {
        console.log(...arguments);
    }
})