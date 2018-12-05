//Authors : Felix Schoch - Id: 761390 ; Hanna Haist - Id: 752731; Trang Le Hong - Id: 310195
var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
const assert = require('assert');
const util = require('util')
var path = require('path');
const SocketIOFile = require('socket.io-file');
var fs = require('fs');
var ibmdb = require('ibm_db');
const helmet = require('helmet');
//const bcrypt = require('bcrypt');
var VisualRecognitionV3 = require('watson-developer-cloud/visual-recognition/v3');
var md5 = require('md5'); 
var waitUntil = require('wait-until');
var compress_images = require('compress-images')
 
const cluster = require('cluster')
const os = require('os')	

if (false && cluster.isMaster) {
    const cpuCount = os.cpus().length
    for (let i = 0; i < cpuCount; i++) {
        cluster.fork()
    }
	console.log("Master");
}
else {


//security setting for hsts, x-xxs & not to sniff MIME type
const hundredEightyDaysInSeconds = 15552000 
app.use(helmet());
app.use(helmet.hsts({
  maxAge: hundredEightyDaysInSeconds
})) 

var port = process.env.PORT || 3000;
	http.listen(port, function(){
	  console.log('listening on *: '+port);
	});

 
 
var connectionStr = "DATABASE=BLUDB;"+
			"HOSTNAME=dashdb-txn-sbox-yp-dal09-04.services.dal.bluemix.net;"+
			"UID=mds89277;"+
			"PWD=fs^tlg7qrv4z236d;"+
			"PORT=50000"; 
 
var visualRecognition = new VisualRecognitionV3({
	version: '2018-03-19',
	iam_apikey: 'VLgTIgrFOnXC3MxqFS08yPDOAW0l_I0qQIImOFc2nNNY',
	url: 'https://gateway.watsonplatform.net/visual-recognition/api'
});	


app.get('/', function(req, res){
  res.sendFile(__dirname + '/src/index.html');
});

app.get('/socket.io.js', (req, res, next) => {
    return res.sendFile(__dirname + '/node_modules/socket.io-client/dist/socket.io.js');
});
 
app.get('/socket.io-file-client.js', (req, res, next) => {
    return res.sendFile(__dirname + '/node_modules/socket.io-file-client/socket.io-file-client.js');
});




app.use(express.static('data'));
app.use(express.static(path.join(__dirname, 'src')));
app.use(express.static(path.join(__dirname, 'profilePicture')));
/*app.use(function(req,res,next){
	if(req.secure || process.env.BLUEMIX_REGION === undefined){
		next();
	} else {
		console.log('redirect to secured connection');
		res.redirect('https://'+req.headers.host + req.url);
	}
})
*/
//Routing to src folder

app.use('/js', express.static(__dirname + '/node_modules/bootstrap/dist/js')); // redirect bootstrap JS
app.use('/js', express.static(__dirname + '/node_modules/jquery/dist')); // redirect JS jQuery
app.use('/css', express.static(__dirname + '/node_modules/bootstrap/dist/css')); // redirect CSS bootstrap

var UserList = [];
var MessageList=[];
var Connections=[];
var registrationPicture = false;
var picturePath = '';
var pictureHasFace = false;
var visualRecognitionDone = false;
io.on('connection', function(socket){
	//console.log(cluster.worker.process.pid);
	//When a users sets his username, the name is safed to a list and ever online user is notified
	socket.on('onLogin', (msg)=>{
		var newUser = msg.user
		ibmdb.open(connectionStr, function (err,conn) {
			if (err) return console.log(err);
			console.log("db_connected");
			conn.query("select username, passwort, profilePicture from MDS89277.loginData where username ='"+newUser+"'", function (err, data) {
			if (err) console.log(err);
			else { 
				//When the user exists
				if(data.length==1){

					
					//Password is correct
					if(md5(msg.password)==data[0]['PASSWORT']){
						if(UserList.indexOf(newUser)<0){
							console.log(data[0]['PROFILEPICTURE']);
							//UserList.push(newUser);
							UserList.push({'user': newUser, 'profilePicture': data[0]['PROFILEPICTURE']});
							Connections.push(socket);
							updateUsernames();
							//message back to the User
							for(message in MessageList){
								socket.emit('chat message', MessageList[message]);
							}
							socket.emit('onLoginSuccess', {"message": 'Welcome to the chat', "user": newUser});
							//broadcast message to all other users
							socket.broadcast.emit('chat message', {"timeStamp": getTimeStamp(), "user": "server", "message": newUser+" connected", "type":"serverMessage"});
						}else{
							socket.emit('onLoginFailure', {"message": 'Username '+newUser+ ' is  already online'});
						}
					}
					else{
						//Passwort wrong
						console.log("passwort wrong");
						socket.emit('onLoginFailure', {"message": 'Password is incorrect'});
					}
				}
				else{
					//User does not exists
					console.log("user does not exist");
					socket.emit('onLoginFailure', {"message": 'User does not exist, please register'});
				}
			}
			conn.close(function () {
			console.log('done');
			});}); 
			});

		
  }); 
  
  socket.on('registration', function(msg){
	  console.log("Registration without Picture");
	  registration(msg, false, "");	
	  
  });
  
  
  function registration(msg, profilePicture, picturePath){
	  var newUser = msg.user;
	  ibmdb.open(connectionStr, function (err,conn) {
			if (err) return console.log(err);
			console.log("db_connected");
			conn.query("select username, passwort from MDS89277.loginData where username ='"+newUser+"'", function (err, data) {
			
			
			if (err) console.log(err);
			else { 
				//When the user does not exists
				if(data.length==0){
					//Check Password strength
					//TODO check numbers and symbols
					
				//console.log("pictureUpload: "+msg.pictureUpload);
				console.log("Bool Picturehasfaces: "+pictureHasFace);
					if(pictureHasFace){
						
						if(msg.passwort.length >7){
								var hashedpw = md5(msg.passwort);
								//console.log(hashedpw + msg.passwort);
								conn.query("insert into MDS89277.loginData (username, passwort, profilePicture)values('"+newUser+"', '"+hashedpw+"', '"+newUser+".jpg')", function (err, data) {
									if (err) console.log(err);
									else{
											
										compress_images(picturePath, __dirname+'/profilePicture/', {compress_force: false, statistic: true, autoupdate: true}, false,
																{jpg: {engine: 'mozjpeg', command: ['-quality', '60']}},
																{png: {engine: 'pngquant', command: ['--quality=20-50']}},
																{svg: {engine: 'svgo', command: '--multipass'}},
																{gif: {engine: 'gifsicle', command: ['--colors', '64', '--use-col=web']}}, function(error, completed, statistic){
										console.log('-------------');
										console.log('error: '+error);
										console.log('completed: '+completed);
										console.log('static: '+statistic.path_out_new);
										});
										socket.emit('onRegistrationSuccess', {'message': 'Registration successfull, please Login now'});
											}
											});
							
						}	
						else{
							socket.emit('onRegistrationFailure', {"message": 'Password is too short, at least 8 letters'});
							
					}	
					}
					else{
						// console.log("registrationPicture: "+registrationPicture);
						// console.log("registrationpicture:" +pictureHasFace);
						// console.log("no face");
						socket.emit('onRegistrationFailure', {"message": 'Profilepicture has no face'});
					}
				}
				else{
					//User does exists
					socket.emit('onRegistrationFailure', {"message": 'Username already exists'});
					
				}
			}
			conn.close(function () {
			//console.log('done');
			});}); 
			});
  }
  
	
	//Send a chat Message to all Clients and save the Message in an Array
  socket.on('chat message', function(msg){
	timeStamp = getTimeStamp();
    io.emit('chat message', {"user": msg.user, "message": msg.message, "timeStamp": getTimeStamp(), "type": "chatMessage"});
	MessageList.push({"user": msg.user, "message": msg.message, "timeStamp": getTimeStamp(), "type": "oldMessage"});
	console.log(msg.message);
	
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
   
   var uploader = new SocketIOFile(socket, {
        // uploadDir: {			// multiple directories
        // 	music: 'data/music',
        // 	document: 'data/document'
        // },
        uploadDir: 'data',							// simple directory
        accepts: ['audio/mpeg', 'audio/mp3', "image/jpeg", "video/mp4"],		// chrome and some of browsers checking mp3 as 'audio/mp3', not 'audio/mpeg'
        //maxFileSize: 10194304, 						// 4 MB. default is undefined(no limit)
        chunkSize: 10240,							// default is 10240(1KB)
        transmissionDelay: 0,						// delay of each transmission, higher value saves more cpu resources, lower upload speed. default is 0(no delay)
        overwrite: true 							// overwrite file if exists, default is true.
		
    });
    uploader.on('start', (fileInfo) => {
		registrationPicture = false;
        console.log('Start uploading');
        console.log(fileInfo);
    });
    uploader.on('stream', (fileInfo) => {
        console.log(`${fileInfo.wrote} / ${fileInfo.size} byte(s)`);
		if(fileInfo.data.registration == 1){
			registrationPicture = true;
		}
    });
    uploader.on('complete', (fileInfo) => {
        console.log('Upload Complete.');
        console.log(fileInfo);
		//Message to all clients
		console.log(fileInfo.data);
		console.log(fileInfo.data.privateMessage);
		if(fileInfo.data.registration == 0){
		if(fileInfo.data.privateMessage == 0){
		 io.emit('chat message', {"user": socket.user, "message": fileInfo.name, "timeStamp": getTimeStamp(), "success":1, "type": "mediaFile"});
		}else{
			var userExists = false;
			var sendTo = fileInfo.data.sendTo;
			  var toSocket;
			  for (i=0; i<Connections.length;i++){
				   console.log(Connections[i].user+"connection.user");
				   console.log(sendTo+"data.user");
				  if (sendTo==Connections[i].user){
					  toSocket = Connections[i];
						userExists = true
				  }
			  }
			  if(userExists){
				socket.emit('chat message', {"user": socket.user+"->"+sendTo, "message": fileInfo.name, "success":1, "timeStamp": getTimeStamp(), "type": "mediaFile privateMessage ownMessage"});
				toSocket.emit('chat message', {"user": socket.user+"->"+sendTo, "message": fileInfo.name, "success":1, "timeStamp": getTimeStamp(), "type": "mediaFile privateMessage"});
			  }
			  else{
				  socket.emit('private message',{"message":"", "sender":socket.user, "receiver":sendTo,"success":0,"timestamp":getTimeStamp()});
			  }
		}
		}
		else{
			
			picturePath = '/data/'+fileInfo.name;
			//console.log("Pfad: "+fileInfo.name);
			
			
			var images_file= fs.createReadStream(__dirname+picturePath);

			var params = {
			  images_file: images_file, 
			};
			visualRecognitionDone = false;
			visualRecognition.detectFaces(params, function(err, response) {
				//console.log(JSON.stringify(response, null, 2));
				//console.log("Faces: "+response.images[0].faces.length);
				if(response.images[0].faces.length > 0){
					pictureHasFace = true;
					console.log("pictureHasFace");
				}
				visualRecognitionDone = true;
				//console.log(pictureHasFace);
		  });
		  waitUntil()
			.interval(500)
			.times(10)
			.condition(function() {
				return (visualRecognitionDone ? true : false);
			})
			.done(function(result) {
					if (!fs.existsSync('./profilePicture')){
						fs.mkdirSync('./profilePicture');
					}
					fs.rename(__dirname+picturePath, __dirname+'/profilePicture/'+fileInfo.data.user+'.jpg', (err) => {
										  if (err) throw err;
										  console.log('source.txt was copied to destination.txt');
																												
										});	
					
								console.log("Start Registration with profilePicture");
								registration(fileInfo.data, true, __dirname+'/profilePicture/'+fileInfo.data.user+'.jpg');	
			});
			
			

			
			
		}
    });
    uploader.on('error', (err) => {
        console.log('Error!', err);
    });
    uploader.on('abort', (fileInfo) => {
        console.log('Aborted: ', fileInfo);
    });
 
	 
 //Send onlineUsers to all Clients
  function updateUsernames(){
	io.sockets.emit('get userlist',{"userlist":UserList})
}
   
   
});
}

cluster.on('exit', (worker) => {
    console.log('mayday! mayday! worker', worker.id, ' is no more!')
    cluster.fork()
})

/**
 * Parse a base 64 image and return the extension and buffer
 * @param  {String} imageString The image data as base65 string
 * @return {Object}             { type: String, data: Buffer }
 */
function parseBase64Image(imageString) {
	var matches = imageString.match(/^data:image\/([A-Za-z-+/]+);base64,(.+)$/);
	var resource = {};
  
	if (matches.length !== 3) {
	  return null;
	}
  
	resource.type = matches[1] === 'jpeg' ? 'jpg' : matches[1];
	resource.data = new Buffer(matches[2], 'base64');
	return resource;
  }

function requireHTTPS(req,res,next){
	if( req.headers && req.headers.$wssp === "80"){
		return res.redirect('https://'+ req.get('host')+req.url);
	}
	next();
}


//Returns the current Timestampt as String
function getTimeStamp(){
	var date = new Date();
	return date.getHours()+":"+date.getMinutes()+":"+date.getSeconds();
}

function login(username, passwort){
	
		
}

function sleep(millis) {
    return new Promise(resolve => setTimeout(resolve, millis));
}