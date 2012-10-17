$(document).ready(function(){
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
    
    $("#chatPanel").css("max-height", $(window).height() 
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
}

function sendMessage() {
    addMessage(1, myInfo.bareJid, $("#chatInput").val());
    sendTextMessage(myInfo.rosters[0], $("#chatInput").val());
    $("#chatInput").val("");
    $("#chatPanel").animate({
		scrollTop: $("#chatPanel")[0].scrollHeight}, 1000);
}

function initVideo() {
    $("#videoContent").hide();
    $("#videoLoading").show();
}

function startVideo() {
    $("#videoLoading").hide();
    $("#videoContent").show();
    // FIXME: check null
    //if (myInfo.rosters.length > 0)
        startVideoChat(myInfo.rosters[0]);
}

function stopVideo() {
	initVideo();
}
