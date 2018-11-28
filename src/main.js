
	$(document).ready(function(){	   
		   $('#u').focus();
	});
//Authors : Felix Schoch - Id: 761390 ; Hanna Haist - Id: 752731; Trang Le Hong - Id: 310195

$(document).ready(function(){	   
		   $(".onlineUser").click(function(){
				alert("button");
			});    
		});

var user ='';
var mood = '';
var anzDownloadButton = 0;
        $(function() {
			
			
			var socket = io();

			$("#logoutbutton").addClass("hidden");
			
			//Handle File Upload
			var uploader = new SocketIOFileClient(socket);
			var form = document.getElementById('fileUploadForm');
			 
			uploader.on('start', function(fileInfo) {
				console.log('Start uploading', fileInfo);
				$('#uploadButton').css("background-color","#17a2b8");
				$('#uploadButton').css("border-color-color","#17a2b8");
				$('#uploadButton').css("font-size","0.9rem");
				$('#uploadButton').val("Uploading");
			});
			uploader.on('stream', function(fileInfo) {
				console.log('Streaming... sent ' + fileInfo.sent + ' bytes.');
			});
			uploader.on('complete', function(fileInfo) {
				console.log('Upload Complete', fileInfo);
				$('#uploadButton').css("background-color","green");
				$('#uploadButton').css("border-color","green");
				$('#uploadButton').css("font-size","1rem");
				$('#uploadButton').val("Upload");
			});
			uploader.on('error', function(err) {
				console.log('Error!', err);
			});
			uploader.on('abort', function(fileInfo) {
				console.log('Aborted: ', fileInfo);
			});
			 //Upload Media File
			form.onsubmit = function(ev) {
				ev.preventDefault();
				var privateMessage =0;
				var sendTo = "";
				if($('#m').val().charAt(0)=="@"){
					var message = $('#m').val();
					var privateUser =[];
					var i = message.indexOf(' ');
					var splits = [message.slice(0,i), message.slice(i+1)];
					privateUser= splits;
					var receiver = privateUser[0].substr(1);
					if(receiver != user){
						if(privateUser.length>1){
							sendTo = receiver;
							var privateMessage =1;
						}
					}else{
							appendChatMessage("","" ,"You send to yourself","serverMessage");
						}
						$('#m').val("");
				}
					var fileEl = document.getElementById('file');
					var uploadIds = uploader.upload(fileEl, {
						data: { "privateMessage":privateMessage,
								"sendTo": sendTo}
					});
				
			};
						
			//Login Process
			$('#setUsername').submit(function(){			
				socket.emit('onLogin', {"user": $('#u').val()});
				return false;
			});   
			socket.on('onLoginSuccess', function(msg){
				user=msg.user; //SetUsername
				$('.container1').addClass("hidden");
                $('.chatDiv').removeClass("hidden").show();
                $('#logo').removeClass("logoLogIn").addClass("hidden");
				appendChatMessage( "", "", msg.message+" "+ user,"serverMessage");
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
					sendPrivateMessage(message);
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
			
			function sendPrivateMessage(message){
					var privateUser =[];
					var i = message.indexOf(' ');
					var splits = [message.slice(0,i), message.slice(i+1)];
					privateUser= splits;
					var receiver = privateUser[0].substr(1);
					if(receiver != user){
						if(privateUser.length>1){
							socket.emit('private message',{"user": receiver, "message": privateUser[1]});
						}
					}else{
							appendChatMessage("","" ,"You cant whisper to yourself","serverMessage");
						}
			}
				
			
			//receive chat message
            socket.on('chat message', function(msg){
				var type = msg.type;
				if(msg.user === user){
					type = "ownMessage";
					if(msg.type == "mediaFile"){
						type+= " "+msg.type;
					}
					
				}
				
				if(type.includes("mediaFile")) {
					if(msg.success == 1){
					$('#messages').append($('<li class="'+type+'">:').text(msg.timeStamp+" "+msg.user+':').append($('<a href="http://localhost:8080/'+msg.message+'" download="'+msg.message+'" class=mediaDownload'+anzDownloadButton+' value="'+msg.message+'">').text(msg.message)));
					anzDownloadButton++;
					}
					else{
						appendChatMessage(msg.timestamp,"" ,"User does not exist","serverMessage");
					}
				}
				else{
					appendChatMessage(msg.timeStamp,msg.user,msg.message, type);
					socket.on('UserList', function(msg){
					console.log(msg);
					});
						
						}
			
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
					html+= '<li class="list-group-item"><button class="onlineUser" onclick="selectUser(this.value);" value="'+userlist[i]+'" >'+userlist[i]+'</button>'
					
					+'</li>';
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
	
			
				
				$("#logoutbutton").on('click', function(){
				socket.disconnect();
				console.log("logoutbutton");
				 $('.container1').removeClass("hidden").show();
				 $('.chatDiv').addClass("hidden");
				 $('#logo').addClass("logoLogIn").removeClass("hidden");
				 $('#u').val()='';
				});
		
			
			});
			
			
			
		
		   
   

   function selectUser(value){
	   $('#m').val("@"+value+" ");
	   $('#m').focus();
   }
   

   function appendChatMessage(timeStamp, sender, message, type, mood){
		className = type;
		if(type.includes("mediaFile")) {
			$('#messages').append($('<li class="'+className + ' ' + mood+'">').append($('<button id="mediaFileButton" class="mediaButton" value="'+message+'">').text(message)));
		}else {
			$('#messages').append($('<li class="'+className+' '+ mood + '">').text(timeStamp + " " + sender + " " + message));
			mood="neutral";
		}
		var div = document.getElementById("m");
		div.scrollTop = div.scrollHeight - div.clientHeight;
   }
   //function handle changing state of label for upload Form
	$(function(){
		var input = $('.inputFile' );
		var label	 = $(input).next(),
			labelVal = $(label).html();

		$(input).on( 'change', function( e )
			{
			var fileName = '';
			if( this.files && this.files.length > 1 ){
				fileName = ( this.getAttribute( 'data-multiple-caption' ) || '' ).replace( '{count}', this.files.length );
			} else {
				fileName = e.target.value.split( '\\' ).pop();
			}
			if( fileName  ){
				$(label).css("background-color", "rgb(22, 114, 22)");
				$(label).children().text(fileName);
			} else{
				$(label).html(labelVal);
				$(label).css("background-color", "#2D2C86");
			}
				
			});
	});
