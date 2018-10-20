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
				if($('#m').val()=="/list"){
					$(".modal").show();
					$(".blurBackground").show();
					$(".modal-body").append($('<li>').text("Place holder for user list"))
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
			$("#closeButton").on('click', function(){
				$(".userList").hide();
				$(".blurBackground").hide();
			})
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
