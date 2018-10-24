	$(document).ready(function(){	   
		   $(".onlineUser").click(function(){
				alert("button");
			});    
		});


var user ='';
        $(function() {
            
			var socket = io('http://localhost:3000');
			
			//Handle File Upload
			var uploader = new SocketIOFileClient(socket);
			var form = document.getElementById('fileUploadForm');
			 
			uploader.on('start', function(fileInfo) {
				console.log('Start uploading', fileInfo);
			});
			uploader.on('stream', function(fileInfo) {
				console.log('Streaming... sent ' + fileInfo.sent + ' bytes.');
			});
			uploader.on('complete', function(fileInfo) {
				console.log('Upload Complete', fileInfo);
			});
			uploader.on('error', function(err) {
				console.log('Error!', err);
			});
			uploader.on('abort', function(fileInfo) {
				console.log('Aborted: ', fileInfo);
			});
			 
			form.onsubmit = function(ev) {
				ev.preventDefault();
				
				var fileEl = document.getElementById('file');
				var uploadIds = uploader.upload(fileEl, {
					data: { /* Arbitrary data... */ }
				});
			};
						
			//Login Process
			$('#setUsername').submit(function(){			
				socket.emit('onLogin', {"user": $('#u').val()});
				return false;
			});   
			socket.on('onLoginSuccess', function(msg){
				user=msg.user; //SetUsername
				$('.loginDiv').addClass("hidden");
                $('.chatDiv').removeClass("hidden").show();
                $('#logo').removeClass("logoLogIn").addClass("hidden");
				appendChatMessage( null, "server", msg.message+" "+ user,"serverMessage");
				$('#m').focus();
				//$('#messages').append($('<li>').append($('<p class="serverMessage">').text(">>"+msg.message+" "+ user+"<<")));
			});
					
			socket.on('onLoginFailure', function(msg){
				$('#errorMessage').text(msg.message);
			});
			
			//Handle chat messages
            $('#chatForm').submit(function(){
				var message = $('#m').val();
				if(message != ""){
				//Send private Message
				if(message.charAt(0)=="@"){
					var privateUser =[];
					var i = message.indexOf(' ');
					var splits = [message.slice(0,i), message.slice(i+1)];
					privateUser= splits;
					console.log(privateUser);
					var receiver = privateUser[0].substr(1);
					if(receiver != user){
						if(privateUser.length>1){
							socket.emit('private message',{"user": receiver, "message": privateUser[1]});
							console.log(privateUser[0].substr(1));
						}
					}else{
							appendChatMessage("","" ,"You cant whisper to yourself","serverMessage");
						}
				}else if(message=="/list"){
					socket.emit('get userlist');
					//$(".modal-body").append($('<li>').text("Place holder for user list"))
				}else{
					//send normal chat message
					 socket.emit('chat message',  {"message":$('#m').val(), "user":user});
				}
				}
				$('#m').val('');
				$('#m').focus();
			
            return false;
            });
			
			
			//receive chat message
            socket.on('chat message', function(msg){
				var type = msg.type;
				if(msg.user === user){
					type = "ownMessage";
					if(msg.type == "mediaFile"){
						type+= " "+msg.type;
					}
					
				}
				appendChatMessage(msg.timeStamp,msg.user,msg.message, type);
				socket.on('UserList', function(msg){
				console.log(msg);
				});
			
			});
			//receive private message
			socket.on('private message',function(data){
				if(data.success == 1){
					var type ="";
					if(data.sender === user){
						type = "privateOwnMessage";
					}
					else{
						type="privateMessage";
					}
					appendChatMessage(data.timestamp,data.sender+"->"+data.receiver ,data.message,type);
				}else{
					appendChatMessage(data.timestamp,"" ,"User does not exist","serverMessage");
				}
			})
			
			//Get userlist on login and when a user connects/disconnects
			socket.on('get userlist',function(data){
				var $users = $("#users");
				var userlist= data.userlist;
				var html='';
				//Add userlist to sidebar
				for (i=0; i< userlist.length;i++){
					html+= '<li class="list-group-item"><button class="onlineUser" onclick="selectUser(this.value);" value="'+userlist[i]+'" >'+userlist[i]+'</button></li>';
					console.log(html);
				}
				$users.html(html);
				$(".modal-body").html(html);
				//$(".modal").show();
				//$(".blurBackground").show();
				$("#closeButton").on('click', function(){
					$(".userList").hide();
					$(".blurBackground").hide();
				});
			});
	
   
			
			});
			
			
   function logOut(){
	   //placeHolder for LogOut
   }

   function selectUser(value){
	   $('#m').val("@"+value+" ");
	   $('#m').focus();
   }
   
   $('#mediaFileButton').on( "click", function() {
		  alert( "Goodbye!" ); // jQuery 1.3+
		});
  /* 
   function getMediaFile(value){
	   socket.emit("getMediaFile", {"fileName":value});
   }*/
   
   /*  
	Append chat Message
	@type: css-classname to style different types of messages:
	serverMessage, privateMessage, privateOwnMessage, chatMessage, oldMessage, ownMessage
   */
   function appendChatMessage(timeStamp, sender, message, type){
		className = type;
		if(type.includes("mediaFile")) {
			console.log(message);
			$('#messages').append($('<li class="'+className+'">').append($('<button id="mediaFileButton" class="mediaButton" value="'+message+'">').text(message)));
		}else {
			$('#messages').append($('<li class="'+className+'">').text(timeStamp + " " + sender + ": " + message));
		}
		var div = document.getElementById("m");
		div.scrollTop = div.scrollHeight - div.clientHeight;
   }
