var user ='';
        $(function() {
            var socket = io();
			
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
				if($('#m').val().charAt(0)=="@"){
					var privateUser =[];
					var i = $('#m').val().indexOf(' ');
					var splits = [message.slice(0,i), message.slice(i+1)];
					privateUser= splits;
					console.log(privateUser);
					
					if(privateUser.length>1){
						socket.emit('private message',{"user": privateUser[0].substr(1), "message": privateUser[1]});
						console.log(privateUser[0].substr(1));
					}
					

					
				}else if($('#m').val()=="/list"){
					socket.emit('get userlist');
					//$(".modal-body").append($('<li>').text("Place holder for user list"))
				}else{
					 socket.emit('chat message',  {"message":$('#m').val(), "user":user});
				}
				$('#m').val('');
				$('#m').focus();
			
            return false;
            });
            socket.on('chat message', function(msg){
				appendChatMessage(msg.timeStamp,msg.user,msg.message, null);
				socket.on('UserList', function(msg){
				console.log(msg);
				});
			
			});
			socket.on('private message',function(data){
				appendChatMessage(data.timestamp,data.user,data.message,null);
			})

			socket.on('get userlist',function(data){
				
				var $users = $("#users");
				var userlist= data.userlist;
				var html='';
				console.log(userlist);
				for (i=0; i< userlist.length;i++){
					html+= '<li class="list-group-item">'+userlist[i]+'</li>';
					console.log(html);
					//html += '<li class="list-group-item">'+data[i]+'</li>';
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
   function appendChatMessage(timeStamp, sender, message, type){
		if(sender=="server") {
			className = type;
			console.log(message);
			$('#messages').append($('<li class="'+className+'">').text(message));
		}else {
			$('#messages').append($('<li>').text(timeStamp + " " + sender + ": " + message));
		}
   }
