$(document).ready(function(){
	$(window).resize(function() {
		// text chat height    
		$("#chatPanel").css("max-height", $(document).height() 
			- $("#inputPanel").height() 
			- parseInt($("#chatPanel").css("margin")) * 2);
		$("#chatPanel").scrollTop($("#chatPanel")[0].scrollHeight);
		
		// remote video
		var margin = parseInt($("#video-s").css("margin"));
		var width = $("#video-f").width();
		if (width <= 0) {
			return;
		}
		var height = $("#video-f").height();
		if (height / width < 0.75) { // wider
			var newWidth = height * 4 / 3;
			$("#remoteView").width(newWidth).height(height)
				.css("margin-left", (width - newWidth) / 2)
				.css("margin-top", 0);
		    // local video
    		$("#video-s").css("right", 
	    		(width - newWidth) / 2 + $("#textPanel").width())
                .css("bottom", 150);
		} else {
			var newHeight = width * 3 / 4;
			$("#remoteView").width(width).height(newHeight)
				.css("margin-top", (height - newHeight) / 2)
				.css("margin-left", 0);
            $("#video-s").css("right", $("#textPanel").width())
                .css("bottom", 150 + (height - newHeight) / 2);
		}
	});
		
    $("#otherHead").click(function(){
        $("#otherUser").slideToggle();
    });

    $(".personDetail").hover(function(){
        if ($(this).find(".userOper").length == 1) {
            $(this).find(".userOper").show();
        }
    }, function(){
        if ($(this).find(".userOper").length == 1) {
            $(this).find(".userOper").hide();
        }
    });

    $(".addUser").click(addUser);
    $(".deleteUser").click(deleteUser);

	// text chat height    
	$("#chatPanel").css("max-height", $(document).height() 
		- $("#inputPanel").height() 
		- parseInt($("#chatPanel").css("margin")) * 2);
		
    $("#chatSend").click(function(){
        sendMessage();
    });

    $("#chatInput").keypress(function(event){
        if (event.keyCode == 13) { // enter pressed
            sendMessage();
        }
    });

    $(".startVideo").click(function(){
        startVideo();
    });
    $("#startAllVideo").click(function(){
        startVideo();
    });
    $("#videoStopBtn").click(function(){
        stopVideo();
    });

    $("#effect1").click(function(){
        soundEffect.use(0);
    });

    $("#effect2").click(function(){
        soundEffect.use(1);
    });

    $("#effect3").click(function(){
        soundEffect.use(2);
    });

    $("#effect4").click(function(){
        soundEffect.use(3);
    });
});

function deleteUser() {
    $("#otherUser").append($(this).parent().parent());
    $(this).parent().hide();
    $(this).parent().append('<img src="image/add.png" alt="add user" class="addUser" title="Add this user" />');
    $(this).parent().find("img.addUser").click(addUser);
    $(this).parent().find("img.startVideo").remove();
    $(this).parent().find("img.deleteUser").remove();
}

function addUser() {
    $("#personPanel").append($(this).parent().parent());
    $(this).parent().hide();
    $(this).parent().append('<img src="image/video.png" alt="start video" class="startVideo" title="Start video chat" />');
    $(".startVideo").click(function(){
        startVideo();
    });
    $(this).parent().append('<img src="image/minus.png" alt="delete user" class="deleteUser" title="Delete this user" />');
    $(this).parent().find("img.deleteUser").click(deleteUser);
    $(this).parent().find("img.addUser").remove();
}

// TODO: clientId, clientName and time should be from the server. Currently use time on client side.
function addMessage(clientId, clientName, content) {
    if (content == null || content == '') {
        return;
    }
    var msg = '<div class="chatMsg"><div class="chatMsgName ';
    if (clientId == -1) {
        msg += 'systemColor';
    } else if (clientId % 2 == 1) {
        msg += 'clientColor1';
    } else {
        msg += 'clientColor2';
    }
    var time = new Date();
    var timeStr = time.getHours() + ':' + time.getMinutes() + ':' + time.getSeconds();
    msg += '">' + clientName + '</div><div class="chatMsgTime">' + timeStr + '</div><div class="chatMsgText">' + content + '</div></div>';
    $("#chatPanel").append(msg);
    $("#chatPanel").scrollTop($("#chatPanel")[0].scrollHeight);
}

function sendMessage() {
    addMessage(1, myInfo.bareJid, $("#chatInput").val());
    sendTextMessage(myInfo.rosters[0], $("#chatInput").val());
    $("#chatInput").val("");
}

function initVideo() {
    $("#videoContent").hide();
    $("#videoLoading").show();
}

function startVideo() {
    // FIXME: check null
    //if (myInfo.rosters.length > 0)
        startVideoChat(myInfo.rosters[0]);
}

function stopVideo() {
    stopVideoChat();
	initVideo();
}
