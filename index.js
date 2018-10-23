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
	
	//When a users sets his username, the name is safed to a list and ever online user is notified
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
			socket.broadcast.emit('chat message', {"timeStamp": getTimeStamp(), "user": "server", "message": newUser+" connected", "type":"serverMessage"});
		}else{
			socket.emit('onLoginFailure', {"message": 'Username '+newUser+ ' is  already taken'});
		}

		
  }); 

  //Send onlineUsers to all Clients
  function updateUsernames(){
	io.sockets.emit('get userlist',{"userlist":UserList})
}
	
	//Send a chat Message to all Clients and save the Message in an Array
  socket.on('chat message', function(msg){
	timeStamp = getTimeStamp();
    io.emit('chat message', {"user": msg.user, "message": msg.message, "timeStamp": getTimeStamp(), "type": "chatMessage"});
	MessageList.push({"user": msg.user, "message": msg.message, "timeStamp": getTimeStamp(), "type": "oldMessage"});
	console.log(MessageList[0].user);
	
  });

  //obsolete, userlist request of one client with /list
  socket.on('get userlist', function(data){
	  console.log("getUserList");
	socket.emit('get userlist',{"userlist":UserList});
  });

  //Handle private message, sends one message back and one to the receiver
  socket.on('private message',function(data){
	  console.log("private Message");
	  var userExists = false;
	  var toSocket;
	  for (i=0; i<Connections.length;i++){
		   console.log(Connections[i].user+"connection.user");
		   console.log(data.user+"data.user");
		  if (data.user==Connections[i].user){
			  toSocket = Connections[i];
				userExists = true
		  }
	  }
	  if(userExists){
		  console.log(Connections[i]+data.message+socket.user);
		socket.emit('private message',{"message":data.message, "sender":socket.user, "receiver":data.user,"success":1,"timestamp":getTimeStamp()});
		toSocket.emit('private message',{"message":data.message, "sender":socket.user, "receiver":data.user,"success":1,"timestamp":getTimeStamp()});
	  }
	  else{
		  socket.emit('private message',{"message":data.message, "sender":socket.user, "receiver":data.user,"success":0,"timestamp":getTimeStamp()});
	  }
  });
  //on disconnect the user is deleted from the userlist and the socketlist and the online Users get the updatet userlist
  socket.on('disconnect', function () {
	  UserList.splice( UserList.indexOf(socket.user), 1 );
	  Connections.splice( UserList.indexOf(socket), 1 );
	  updateUsernames();
	socket.broadcast.emit('chat message', {"timeStamp": getTimeStamp(),"user":"server", "message": socket.user+" disconnected", "type":"serverMessage"});
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