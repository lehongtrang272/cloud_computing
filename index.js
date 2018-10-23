var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var path = require('path');

app.get('/', function(req, res){
  res.sendFile(__dirname + '/src/index.html');
});

//Routing to src folder
app.use(express.static(path.join(__dirname, 'src')));
app.use('/js', express.static(__dirname + '/node_modules/bootstrap/dist/js')); // redirect bootstrap JS
app.use('/js', express.static(__dirname + '/node_modules/jquery/dist')); // redirect JS jQuery
app.use('/css', express.static(__dirname + '/node_modules/bootstrap/dist/css')); // redirect CSS bootstrap

var UserList = [];
var MessageList=[];
var Connections=[];
io.on('connection', function(socket){
	
	socket.on('onLogin', function(msg){
		newUser = msg.user;
		socket.user =newUser;
		//socket.username=msg;
		if(UserList.indexOf(newUser)<0){
			UserList.push(newUser);
			Connections.push(socket);
			updateUsernames();
		//message back to the User
		for(message in MessageList){
			console.log(MessageList[message]);
			socket.emit('chat message', MessageList[message]);
		}
			socket.emit('onLoginSuccess', {"message": 'Welcome to the chat', "user": newUser});
			//broadcast message to all other users
			socket.broadcast.emit('chat message', {"timeStamp": getTimeStamp(), "message": newUser+" connected"});
		}else{
			socket.emit('onLoginFailure', {"message": 'Username '+newUser+ ' is  already taken'});
		}

		
  }); 

  function updateUsernames(){
	io.sockets.emit('get userlist',{"userlist":UserList})
}
	
  socket.on('chat message', function(msg){
	if(false){
		socket.emit('UserList', UserList);
	}
	else{
	timeStamp = getTimeStamp();
    io.emit('chat message', {"user": msg.user, "message": msg.message, "timeStamp": getTimeStamp()});
	MessageList.push({"user": msg.user, "message": msg.message, "timeStamp": getTimeStamp()});
	console.log(MessageList[0].user);
	}
  });

  socket.on('get userlist', function(data){
	  console.log("getUserList");
	socket.emit('get userlist',{"userlist":UserList});
  });

  socket.on('private message',function(data){
	  console.log("private Message");
	  
	  for (i=0; i<Connections.length;i++){
		   console.log(Connections[i].user+"connection.user");
		   console.log(data.user+"data.user");
		  if (data.user==Connections[i].user){
				console.log(Connections[i]+data.message+socket.user);
			    socket.emit('private message',{"message":data.message, "user":socket.user,"success":1,"timestamp":getTimeStamp()});
			    Connections[i].emit('private message',{"message":data.message, "user":socket.user,"success":1,"timestamp":getTimeStamp()});
		  }
	  }
  });
  
  socket.on('disconnect', function () {
	  UserList.splice( UserList.indexOf(socket.user), 1 );
	  updateUsernames();
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