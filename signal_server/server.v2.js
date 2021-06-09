let https = require('https');
let fs = require('fs');
let express = require('express');
let serveIndex = require('serve-index');

let app = express();
app.use(serveIndex('./public'));
app.use(express.static('./public'));

let opts = {
	key: fs.readFileSync('./cert/server.key'),
	cert: fs.readFileSync('./cert/server.pem')
}
let https_server = https.createServer(opts, app);

let io = require('socket.io')(https_server);

const RET = {
	OK: "0",
	USERERR: "1001"
}

// 检查用户权限
const check_session = (client)=>{
	
	return true;
} 
const rooms = []
const online_status = {}

function leaveRoom(arg) {
	const {roomID, user_type} = arg
	if (!roomID || !user_type) {
		return false
	}
	if (!online_status.hasOwnProperty(roomID)) {
		online_status[roomID] = {
			relative: "离线",
			prisoner: "离线",
			admin: "离线"
		}
	}
	online_status[roomID][user_type] = "离线"
}

function joinRoom(arg) {
	const {roomID, user_type} = arg
	if (!roomID || !user_type) {
		return false
	}
	if (!online_status.hasOwnProperty(roomID)) {
		online_status[roomID] = {
			relative: "离线",
			prisoner: "离线",
			admin: "离线"
		}
	}
	online_status[roomID][user_type] = "在线"
}

function getStatus(arg) {
	console.log(online_status)
	return online_status[arg.roomID]
}

io.sockets.on('connection', client=>{
	console.log('new connection id:', client.id);

	// 新连接时发送链接成功
	client.emit('connected');

	// 加入房间
	client.on('join', ret=>{
		if (check_session(client)) {
			client.join(ret.roomID) 
			joinRoom({roomID: ret.roomID, user_type: ret.user_type})
			rooms[client.id] = {
				roomID: ret.roomID,
				user_type: ret.user_type
			}
			const status = getStatus({roomID: ret.roomID})
			client.emit('joined', status)
			client.to(ret.roomID).emit('other_joined', {
				user_type: ret.user_type,
				status 
			})
		} else {
			client.emit('error')
		}
	})

	// 离开房间
	client.on('leave', ret=>{
		if (check_session(client)) {
			client.leave(ret.roomID) 
			const status = getStatus({roomID: ret.roomID})
			client.emit('leaved', status)
			client.to(ret.roomID).emit('other_leaved', {
				user_type: ret.user_type,
				status
			})
		} else {
			client.emit('error')
		}
	})

	// 发送消息 
	client.on("message", ret=>{
		if (check_session(ret)) {
			client.emit('messaged', ret.data)
			client.to(ret.roomID).emit('message', ret.data);
		}	
		else {
			client.emit('error')
		}
	})

	// 控制消息
	client.on("control", ret => {
		if (check_session(ret) && ret.hasOwnProperty('data')) {
			client.to(ret.roomID).emit('control', ret.data)
		}
		else {
			client.emit('error')
		}
	})

	client.on("controled", ret => {
		if (check_session(ret) && ret.hasOwnProperty(data)) {
			client.to(ret.roomID).emit('controled', ret.data)
		}
		else {
			client.emit('error')
		}
	})

	client.on("disconnect", ret=>{
		if (rooms[client.id]) {
			const user = rooms[client.id]
			leaveRoom(user)
			// rooms[client.id] = {
			// 	roomID: ret.roomID,
			// 	user_type: ret.user_type
			// }
			client.to(user.roomID).emit('other_leaved', {
				user_type: user.user_type,
				status: getStatus({roomID: user.roomID})
			})
		}
		
	})

});

https_server.listen('8888', '0.0.0.0');
