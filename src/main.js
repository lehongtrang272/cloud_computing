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
				$('.loginDiv').css("display","none");
                $('.chatDiv').css("display","block");
                $('#logo').removeClass("logoLogIn").addClass("hidden");
				appendChatMessage( ">>"+msg.message+" "+ user+"<<","serverMessage");
				$('#m').focus();
				//$('#messages').append($('<li>').append($('<p class="serverMessage">').text(">>"+msg.message+" "+ user+"<<")));
			});
					
			socket.on('onLoginFailure', function(msg){
				$('#errorMessage').text(msg.message);
			});
			
			//Handle chat messages
            $('#chatForm').submit(function(){
		    socket.emit('chat message',  {"message":$('#m').val(), "user":user});
			$('#m').val('');
			$('#m').focus();
            return false;
            });
            socket.on('chat message', function(msg){
            $('#messages').append($('<li>').text(msg.timeStamp+" "+msg.user+": "+msg.message));
			
			socket.on('UserList', function(msg){
				console.log(msg);
			});
			
    });
        });
   
   function appendChatMessage(message, type){
		className = type;
		console.log(message);
		$('#messages').append($('<li class="'+className+'">').text(message));
   }