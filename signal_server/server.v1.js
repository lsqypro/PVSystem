var https = require('https');
var fs = require('fs');

var express = require('express');
var serveIndex = require('serve-index');

var app = express();
app.use(serveIndex('./public'));
app.use(express.static('./public'));

var opts = {
	key: fs.readFileSync('./cert/server.key'),
	cert: fs.readFileSync('./cert/server.pem')
}
var https_server = https.createServer(opts, app);

var io = require('socket.io')(https_server);
io.sockets.on('connection', client=>{
	console.log('new connection id:', client.id);

	// 新连接时发送链接成功
	client.emit('connected', {});

	client.on('join', arg=>{
		client.join(arg.roomID);
		console.log(client.id + " join to " + arg.roomID);
		client.emit('joined', {});

		client.to(arg.roomID).emit('otherjoin', {userID: arg.userID, roomID: arg.roomID});
	});

 	client.on('leave', arg=>{
		client.leave(arg.roomID);
		console.log(client.id + " leave to " + arg.roomID);

		client.emit('leaved', {});
		client.to(arg.roomID).emit('otherleave', {userID: arg.userID, roomID: arg.roomID});
	});

 	client.on("message", arg=>{
 		client.to(arg.roomID).emit('message', {userID: arg.userID, roomID: arg.roomID, desc: arg.desc});
	})

});

https_server.listen('443', '0.0.0.0');
