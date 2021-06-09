var video_main = document.getElementById("video_main");  // 主视频窗口
var video_local = document.getElementById("video_local");  // 本地视频选择按钮
var video_remote = document.getElementById("video_remote");  // 远端视频选择按钮

var btn_microphone = document.getElementById("btn_microphone")
var btn_phone = document.getElementById("btn_phone")
var btn_device = document.getElementById("btn_device")

// 全局变量
var microphone_status = 'close';
var phone_status = 'close';
var device_status = 'user';
var video_main_status = 'local';
var pc_status =  'disconnect';
var stream_source_status = 'user';  // user env desktop

var local_media_options, remote_media_options, create_offer_options, pc_options;
var local_stream, remote_stream;
var pc;
var socket;

// TODO 打开页面时从URL参数中获取 roomID
var userID = 'userID';
var roomID = '123';
var cookie = "this is cookit";

// 打印日志
function mlog(e) {
    // document.getElementById("textarea_log").value += e + '\n';
    console.log(e);
}

// 获取URL参数
function getQueryVariable(variable) {
    var query = window.location.search.substring(1);
    console.log(query);
    var vars = query.split("&");
    console.log(vars);
    for (var i=0;i<vars.length;i++) {
            var pair = vars[i].split("=");
            if(pair[0] == variable){return pair[1];}
    }
    return(false);
 }

// TODO 设置参数
function init() {
    local_media_options = {video: true, audio: false};
    remote_media_options = {video: true, audio: false};
    
    pc_options = {
        'iceServers': [{
            'urls': 'turn:1.15.136.145:3478',
            'credential': '123456',
            'username': 'lsqypro'
        }]
    };
    create_offer_options = {offerToReceiveVideo: 1, offerToReceiveVideo: 1};
}

// 改变peerconnection状态
function pc_status_change(new_status) {
    console.log("status:", pc_status, " -> ", new_status);
    pc_status = new_status;
}

function create_peer_connection() {
    // 链接完成后创建 PeerConnection
    pc = new RTCPeerConnection(pc_options);

    pc.onnegotiationneeded = e => pc.createOffer()
    .then(desc => {
        pc.setLocalDescription(desc);  // 触发 pc.onicecandidate
        socket.emit('message', {userID: userID, roomID: roomID, cookie: cookie, desc: desc});
        // pc.setLocalDescription(offer)
    })
    .catch(()=>{
        mlog("onnegotiationneeded faild");
    });
    // .then(() => signalingChannel.send(JSON.stringify({ "sdp": pc.localDescription }));
    // .catch(failed);

    pc.onicecandidate = e=>{
        if (e.candidate) {
            mlog('local find an new candidate');
            let desc = {
                type: 'candidate',
                sdpMLineIndex: e.candidate.sdpMLineIndex,
                sdpMid: e.candidate.sdpMid,
                candidate: e.candidate.candidate
            };
            // console.log("lcoal candidate:", desc);
            // TODO 发送收集到的candidate
            socket.emit('message', {userID: userID, roomID: roomID, cookie: cookie, desc: desc});
        }
    };

    pc.ontrack = e=>{
        // 收到远端视频后触发
        remote_stream = e.streams[0];
        video_remote.srcObject = remote_stream;

        mlog('recive remote video ...');
    };

    // 先添加本地流,媒体协商时提供媒体处理能力信息
    local_stream.getTracks().forEach(track=>{
        pc.addTrack(track, local_stream);
    });
}

function handle_connected(arg) {
    // 链接服务器成功
    mlog("connected");

    pc_status_change('connet');
    socket.emit('join', {userID: userID, roomID: roomID, cookie: cookie});

    // TODO 创建 peerConnection
    create_peer_connection();
}

function handle_joined(arg) {
    // 加入房间成功
    mlog("joined");
    pc_status_change('joined');
}

function handle_leaved(arg) {
    // 离开房间成功
    mlog("leaved");

    // TODO 离开房间成功应释放资源
    if (socket) {
        socket.disconnect();
    }
    socket = null;
    close_steram();
}

function handle_otherjoin(arg) {
    // 另一个成员加入
    mlog('otherjoin');

    // createOffer
    pc.createOffer(create_offer_options)
        .then(desc=>{
            pc.setLocalDescription(desc);  // 触发 pc.onicecandidate
            socket.emit('message', {userID: userID, roomID: roomID, cookie: cookie, desc: desc});
        })
        .catch(e=>{
            mlog("createOffer error");
        });
};

function handle_otherleave(arg) {
    // 另一个成员离开
    mlog('otherleave');
    // 对方挂断
    leave();
};

function handle_message(arg) {
    mlog('message');
    // 媒体协商
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
                    mlog("create Answer error");
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
            mlog("unknow message type");
        }
    }
};

function handle_keeplive(arg) {
    mlog('keeplive');
    // TODO 重置定时器
};

function handle_error(arg) {
    // 服务端发送error,代表服务端主动断开链接
    mlog('server return error:' + arg);

    pc_status_change('error');
    leave();
}

// 拨号连接
function call() {
    // 链接信令服务器
    socket = io.connect();
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
    mlog('leave...');
    
    if (socket) {
        socket.emit('leave', {userID: userID, roomID: roomID, cookie: cookie});
    }
    else {
        socket = null;
        close_stream();
    }
}

function close_steram() {
    mlog('close stream');

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
    // local_stream = null;

    phone_status = 'close';
    pc_status = 'disconnect';
    reflush_UI();
}

function replaceStream() {
    if (pc) {
        var audio_sender;
        pc.getSenders().forEach(sender=>{
            if (sender.track && sender.track.kind === "audio") {
                audio_sender = sender; 
            }
        });

        // if (audio_sender) {
        //     mlog("get a audio sender");
        // }
        // else {
        //     mlog("don't get a audio sender");
        // }
        // mlog("micro:"+microphone_status);
        // mlog("local_media_options:" + local_media_options.audio);

        local_stream.getTracks().forEach(track=>{
            mlog(track);
            if (microphone_status === "open" && track.kind === "audio") {
                // 替换或添加音频流
                if (audio_sender) {
                    audio_sender.replaceTrack(track);
                    mlog("replace a audio track");
                }
                else {
                    pc.addTrack(track);
                    mlog("add a audio track");
                }
            }
            else if (microphone_status === "close" && track.kind === "audio") {
                // 替换或添加音频流
                if (audio_sender) {
                    pc.removeTrack(audio_sender);
                    mlog("remove a audio track");
                }
            }
        });

        pc.createOffer(create_offer_options)
        .then(desc=>{
            pc.setLocalDescription(desc);  // 触发 pc.onicecandidate
            socket.emit('message', {userID: userID, roomID: roomID, cookie: cookie, desc: desc});
        })
        .catch(e=>{
            mlog("re createOffer error");
        });
        
    }
}

// 获取本地摄像头视频流
function getUserMedia() {
    // 根据视频源状态字获取local_stream
    var se = document.getElementById("vsrc");
    stream_source_status = se[se.selectedIndex].value;
    mlog(stream_source_status);
    if (stream_source_status === 'user') {
        navigator.mediaDevices.getUserMedia(local_media_options)
        .then(stream=>{
            local_stream = stream;
            video_local.srcObject = local_stream;
            if(video_main_status === 'local') {
                video_main.srcObject = local_stream;
            }
            replaceStream();
        })
        .catch(e=>{
            mlog("get user media error");
        });
    }
    else if (stream_source_status === 'env') {
        local_media_options.facingMode = 'environment';
        mlog("get env stream");
        navigator.mediaDevices.getUserMedia(local_media_options)
        .then(stream=>{
            local_stream = stream;
            video_local.srcObject = local_stream;
            if(video_main_status === 'local') {
                video_main.srcObject = local_stream;
            }
            replaceStream();

        })
        .catch(e=>{
            mlog("get user media error");
        });
    }
    else if (stream_source_status === 'desktop') {
        navigator.mediaDevices.getDisplayMedia(local_media_options)
        .then(stream=>{
            local_stream = stream;
            video_local.srcObject = local_stream;
            if(video_main_status === 'local') {
                video_main.srcObject = local_stream;
            }
            replaceStream();
        })
        .catch(e=>{
            mlog("get user media error");
        });
    }
}

// 主窗口显示本地画面
video_local.onclick = ()=>{
    video_main_status = 'local';
    video_main.srcObject = local_stream;
    reflush_UI();
}

// 主窗口显示远程画面
video_remote.onclick = ()=>{
    video_main_status = 'remote'
    video_main.srcObject = remote_stream;
    reflush_UI();
}

// 按下麦克风按钮
btn_microphone.onclick = ()=>{
    if (microphone_status === 'open') {
        microphone_status = 'close';
        local_media_options.audio = false;
        getUserMedia();
    }
    else {
        microphone_status = 'open'
        local_media_options.audio = true;
        getUserMedia();
    }
    reflush_UI();
}

// 按下拨号按钮
btn_phone.onclick = ()=>{
    // TODO 拨号
    if (phone_status === 'open') {
        leave()
        phone_status = 'close';
    }
    else {
        call()
        phone_status = 'open';
    }
    reflush_UI();
}

// 按下切换摄像头按钮
btn_device.onclick = ()=>{
    // TODO 切换前后置摄像头
    if (device_status === 'user') {
        device_status = 'env';

    }
    else {
        device_status = 'user';
    }
    reflush_UI();
}

// 刷新页面UI
function reflush_UI() {
    // 改变主窗口画面UI
    if (video_main_status === 'local') {
        video_local.setAttribute('style', 'border: 1px solid #1ABC9C;');
        video_remote.setAttribute('style', 'border: 1px solid black;');
    }
    else {
        video_local.setAttribute('style', 'border: 1px solid black;');
        video_remote.setAttribute('style', 'border: 1px solid #1ABC9C;');
    }

    // 麦克风按钮
    if (microphone_status === 'open') {
        btn_microphone.setAttribute('class', 'img_box iconfont icon-maikefeng selected');
    }
    else {
        btn_microphone.setAttribute('class', 'img_box iconfont icon-maikefeng');
    }

    // 拨号按钮
    if (phone_status === 'open') {
        btn_phone.setAttribute('class', 'img_box iconfont icon-bohao selected');
    }
    else {
        btn_phone.setAttribute('class', 'img_box iconfont icon-bohao');
    }

    // 摄像头按钮
    if (device_status === 'user') {
        btn_device.setAttribute('class', 'img_box iconfont icon-qiehuanshexiangtou');
    }
    else {
        btn_device.setAttribute('class', 'img_box iconfont icon-qiehuanshexiangtou selected');
    }
}

// 主程序
init()
getUserMedia()
