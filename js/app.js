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

    $("#chatSend").click(function(){
        addMessage(1, "Client 1", $("#chatInput").val());
        $("#chatInput").val("");
    });
});

function deleteUser() {
    $("#otherUser").append($(this).parent().parent());
    $(this).parent().hide();
    $(this).parent().append('<img src="image/add.png" alt="add user" class="addUser" />');
    $(this).parent().find("img.addUser").click(addUser);
    $(this).parent().find("img.deleteUser").remove();
}

function addUser() {
    $("#personPanel").append($(this).parent().parent());
    $(this).parent().hide();
    $(this).parent().append('<img src="image/minus.png" alt="delete user" class="deleteUser" />');
    $(this).parent().find("img.deleteUser").click(deleteUser);
    $(this).parent().find("img.addUser").remove();
}

// TODO: clientId, clientName and time should be from the server. Currently use time on client side.
function addMessage(clientId, clientName, content) {
    if (content == null || content == '') {
        return;
    }
    var msg = '<div class="chatMsg"><div class="chatMsgName ';
    if (clientId % 2 == 1) {
        msg += 'clientColor1';
    } else {
        msg += 'clientColor2';
    }
    var time = new Date();
    var timeStr = time.getFullYear() + '-' + (time.getMonth() + 1) + '-' + time.getDate() + ' ' + 
        time.getHours() + ':' + time.getMinutes() + ':' + time.getSeconds();
    msg += '">' + clientName + '</div><div class="chatMsgTime">' + timeStr + '</div><div class="chatMsgText">' + content + '</div></div>';
    $("#chatPanel").append(msg);
}
