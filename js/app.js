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
});

function deleteUser() {
    console.log("delete");
    $("#otherUser").append($(this).parent().parent());
    $(this).parent().hide();
    $(this).parent().append('<img src="image/add.png" alt="add user" class="addUser" />');
    console.log($(this).parent());
    $(this).parent().find("img.addUser").click(addUser);
    $(this).parent().find("img.deleteUser").remove();
}

function addUser() {
    console.log("add");
    $("#personPanel").append($(this).parent().parent());
    $(this).parent().hide();
    $(this).parent().append('<img src="image/minus.png" alt="delete user" class="deleteUser" />');
    $(this).parent().find("img.deleteUser").click(deleteUser);
    $(this).parent().find("img.addUser").remove();
}

