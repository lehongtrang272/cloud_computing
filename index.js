var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});
var UserList = [];
var MessageList=[];
io.on('connection', function(socket){
	
	socket.on('onLogin', function(msg){
		newUser = msg.user;
		socket.user =newUser;
		if(UserList.indexOf(newUser)<0){
			UserList.push(newUser);
		//message back to the User
		for(message in MessageList){
			console.log(MessageList[message]);
			socket.emit('chat message', MessageList[message]);
		}
			socket.emit('onLoginSuccess', {"message": 'welcome to the chat', "user": newUser});
			//broadcast message to all other users
			socket.broadcast.emit('chat message', {"timeStamp": getTimeStamp(), "message": newUser+" connected"});
		}else{
			socket.emit('onLoginFailure', {"message": 'Username '+newUser+ ' is  already taken'});
		}
  }); 

	
  socket.on('chat message', function(msg){
	 timeStamp = getTimeStamp();
    io.emit('chat message', {"user": msg.user, "message": msg.message, "timeStamp": timeStamp});
	MessageList.push({"user": msg.user, "message": msg.message, "timeStamp": timeStamp});
	console.log(MessageList[0].user);
  });
  
  socket.on('disconnect', function () {
	  UserList.splice( UserList.indexOf(socket.user), 1 );
	socket.broadcast.emit('chat message', {"timeStamp": getTimeStamp(), "message": socket.user+" disconnected"});
   });
});

http.listen(3000, function(){
  console.log('listening on *:3000');
});

//Returns the current Timestampt as String
function getTimeStamp(){
	var date = new Date();
	return date.getHours()+":"+date.getMinutes()+":"+date.getSeconds();
}