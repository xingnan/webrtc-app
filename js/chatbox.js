var videoInvitor;
var forwardInvitor;
var gCurrChatJid = null;
var gCurrVideoJid = null;
var local_stream = null;
var isdebug = false;	//enable or disable log message;
var remotePeers = new Array();
var gInvited = false;


var SCREEN_WIDTH = $(window).width();
var SCREEN_height = $(window).height();

var VideoState = {
    VIDEO_STATE_READY: "READY",
    VIDEO_STATE_CONNECTING: "CONNECTING",
    VIDEO_STATE_CONNECTED: "CONNECTED",
    VIDEO_STATE_STOPPED: "STOPPED"
};

var gVideoChatState = VideoState.VIDEO_STATE_READY;

function getCookie(c_name) {
    if (document.cookie.length > 0) {
        c_start = document.cookie.indexOf(c_name + "=");
        if (c_start != -1) {
            c_start = c_start + c_name.length + 1;
            c_end = document.cookie.indexOf(";", c_start);
            if (c_end == -1) c_end = document.cookie.length;
            return unescape(document.cookie.substring(c_start, c_end));
        }
    }
    return "";
}

function MyInfo(jid) {
	this.fullJid = jid;
	this.bareJid = Strophe.getBareJidFromJid(jid);
	this.name = Strophe.getNodeFromJid(this.bareJid);
	this.rosters = new Array();
}

var myInfo;

var UserStatus = {
    AVAILABLE: "Available",
    UNAVAILABLE: "Unavailable"
};

var Gab = {
    connection: null,

    jid_to_id: function (jid) {
        return Strophe.getBareJidFromJid(jid)
            .replace("@", "-")
            .replace(".", "-");
    },
    
    //handle the roster list
    on_roster: function (iq) {
        $(iq).find('item').each(function () {
            var jid = $(this).attr('jid');
            var name = $(this).attr('name') || Strophe.getNodeFromJid(jid);
            console.log("jid: " + jid + ", name: " + name);
            // Store rosters
            myInfo.rosters.push(jid);
            // Hack
            $('#myPeer').text(name);
            // transform jid into an id
            var jid_id = Gab.jid_to_id(jid);

            var showJid = jid;
            var showStatus = "offline";
            if (jid == myInfo.bareJid) {
				// FIXME: self, seems never to be called
                showStatus = "online"
                showJid = myInfo.fullJid;
                jid_id = myInfo.fullJid.replace("@", "-").replace("/", "-");
            }
            console.log("showStatus", showStatus);
            if (showStatus == "online"){
				
            } else {
            }
 
            //Gab.insert_contact(contact);
        });

        // set up presence handler and send initial presence`
        Gab.connection.addHandler(Gab.on_presence, null, "presence");
        Gab.connection.send($pres());
    },

    pending_subscriber: null,

    //handle the Presence Stanzas
    on_presence: function (presence) {
        var ptype = $(presence).attr('type');
        var from = $(presence).attr('from');
        var jid_id = Gab.jid_to_id(from);
        if (ptype === 'unavailable' && from.substring(0, from.indexOf("@")) == myInfo.name) {
            jid_id = from.replace("@", "-").replace("/", "-");
            $('#' + jid_id).remove();
            //window.location.href = serverCodeAddr + "/chatbox.html";
        } 

        //handle subscribe presence stanza
        if (ptype === 'subscribe') {
            // populate pending_subscriber, the approve-jid span, and
            // open the dialog
            Gab.pending_subscriber = from;
            $('#approve-jid').text(Strophe.getBareJidFromJid(from));
            $('#approve_dialog').dialog('open');
        } else if (ptype !== 'error') {
            var userinfo = $('#contactlist div#' + jid_id + ' .contactinfo')
                .removeClass("online")
                .removeClass("away")
                .removeClass("offline");
            var usericon = $('#contactlist div#' + jid_id + ' div.usericon1 #userimg');
            var usertexticon = $('#contactlist div#' + jid_id + ' div.contactinfo div' + '.contacttextchat #textimg' );
            if (ptype === 'unavailable') {
                // TODO:(yujie.mao@intel.com) We need to remove offline devices.
            	//userinfo.addClass("offline");
            	Gab.connection.send($pres());
            } else {
                var show = $(presence).find("show").text();
                if (show === "" || show === "chat") {
                	userinfo.addClass("online");
                        usericon.attr('src','images/online.png');
                       // usertexticon.attr('src','images/toolbar_icon_072.png');
                } else {
                	userinfo.addClass("away");
                }
            }

            var contact = userinfo.parent();
            contact.remove();
            Gab.insert_contact(contact);
 //           window.location.href = serverCodeAddr + "/WooGeen.html";
        }

        // reset addressing for user since their presence changed
        var jid_id = Gab.jid_to_id(from);
        $('#chat-' + jid_id).data('jid', Strophe.getBareJidFromJid(from));

        return true;
    },

    //when rosters have been added or removed, or changed names
    on_roster_changed: function (iq) {
        // FIXME 
        $(iq).find('item').each(function () {
            var sub = $(this).attr('subscription');
            var jid = $(this).attr('jid');
            var name = $(this).attr('name') || jid;
            var jid_id = Gab.jid_to_id(jid);

            if (sub === 'remove') {
                // contact is being removed
            	trace("remove succeed");
                $('#' + jid_id).remove();
            } else {
                // contact is being added or modified
                var contact_html = "<li id='" + jid_id + "'>" +
                    "<div class='" + 
                    ($('#' + jid_id).attr('class') || "roster-contact offline") +
                    "'>" +
                    "<div class='roster-name'>" +
                    name +
                    "</div><div class='roster-jid'>" +
                    jid +
                    "</div></div></li>";

                if ($('#' + jid_id).length > 0) {
                    $('#' + jid_id).replaceWith(contact_html);
                } else {
                    Gab.insert_contact(contact_html);
                }
            }
        });

        return true;
    },

    //handle message stanzas
    on_message: function (message) {
        var full_jid = $(message).attr('from');
        var jid = Strophe.getBareJidFromJid(full_jid);
        var jid_id = Gab.jid_to_id(jid);
        
        var forwardingMsg = $(message).find('video-forwarding');
        //if there isn't chat tab in the chat aera, create one
        // FIXME: binding text Chat
        if (forwardingMsg.length<=0) {
            startTextChat(jid, Strophe.getNodeFromJid(jid));
        }
        
        //$('#inputbox').focus();
        //fowarding-handshake information
		var forwardingMsg = $(message).find('video-forwarding');
		 if(forwardingMsg.length>0){
		    handleForwardingMsg(message);
			return true;
		}
        //video handshake information
        var videoChat = $(message).find('video-chat');
        if(videoChat.length>0) {
        	handleVideoMsg(message);
            return true;
        }

        // FIXME: Binding text chat
        //if it is a chat text message
        var body = $(message).find("html > body");
        if (body.length === 0) {
            body = $(message).find('body');
            if (body.length > 0) {
                body = body.text();
            } else {
                body = null;
            }
        } else {
            body = body.contents();

            var span = $("<span></span>");
            body.each(function () {
                if (document.importNode) {
                    $(document.importNode(this, true)).appendTo(span);
                } else {
                    // IE workaround
                    span.append(this.xml);
                }
            });

            body = span;
        }
        if (body) {
             addMessage(0, jid, body);
        }
        if(jid!=gCurrChatJid) {
        	trace("add class new-msg");
        }
        return true;
    },

    scroll_chat: function (jid_id) {
        var div = $('#chat-' + jid_id + ' .chat-messages').get(0);
        div.scrollTop = div.scrollHeight;
    },

    //get the elem's presence value, "online" or "away" or "unavailable"
    presence_value: function (elem) {
        if (elem.hasClass('online')) {
            return 2;
        } else if (elem.hasClass('away')) {
            return 1;
        }

        return 0;
    },

    //insert the element after sort them by availability
    insert_contact: function (elem) {
        var jid = elem.find('.contactshare').text();
        var pres = Gab.presence_value(elem.find('.contactinfo'));
        
        var contacts = $('#contactlist .contact');
        if (contacts.length > 0) {
            var inserted = false;
            contacts.each(function () {
                var cmp_pres = Gab.presence_value($(this).find('.contactinfo'));
                var cmp_jid = $(this).find('.contactjid').text();
                if(jid == cmp_jid){
                    inserted = true;
                    return false;
                }
                if (pres > cmp_pres) {
                    $(this).before(elem);
                    inserted = true;
                    return false;
                } else {
                    if (jid < cmp_jid) {
                        $(this).before(elem);
                        inserted = true;
                        return false;
                    }
                }
            });

            if (!inserted) {
                $('#contactlist').append(elem);
            }
        } else {
            $('#contactlist').append(elem);
        }
      
    },
    
    resolveMyInfo: function(iq) {
    	var fullJid = $(iq).attr('to');
    	//var name = $(iq).find("query").find("name").text();
    	myInfo = new MyInfo(fullJid);
    	$('#selfName').text(Strophe.getNodeFromJid(fullJid));
    	//$('#mystatus').text(UserStatus.AVAILABLE);
    },
    
    scroll_chat: function (jid_id) {
        var div = $('#chat-page-' + jid_id).get(0);
        div.scrollTop = div.scrollHeight;
    }
    
};

function initPage() {

    $(document).trigger('connect', {
        jid: getCookie("jid"),
        password: getCookie("password")
    });
	
    $(document).click(function() {
        hideRightMenu();
    });

   // text chat  yanbin
    $('#contacttextchat').live('click', function () {
        var jid = $(this).parent().find(".contactjid").text();
        var name = $(this).parent().find(".contactname").text();
           var a = $(this).prev().text();
        var b = $(this).next().next().text();
        startTextChat(jid, name);
    });

    $('#startVideo').live('click', function () {
        // FIXME: Handle the situation of 1+ rosters.
        startVideoChat(myInfo.rosters[0]);
    });
    //forward chat
     $('#contactnameforward').live('click',function (){
       // var jid = $(this).parent().find(".contactjid").text();
        var fullname_temp=$(this).parent().parent().attr('id'); 
        var jid_temp = fullname_temp.replace('-','@');
//        var jid = jid_temp.replace('-','/');
         var de=jid_temp.substring(jid_temp.lastIndexOf("-")+1);
          var jid=jid_temp.replace(jid_temp.substring(jid_temp.lastIndexOf("-")),"/");
          jid=jid+de;
        //var name = $(this).parent().find(".contactname").text();
        startForwarding(jid);
    });
      $('.contacticon').live('hover',function(){
         $(this).children("div").fadeToggle('fast');
     });
      $('.toolico-fat').live('hover',function(){
         $(this).children("div").fadeToggle('fast');
     });
    //press "Enter" on the input text to send a message
    $('#inputbox').live('keypress', function (ev) {
        var jid = $(this).parent().data('jid');
        if (ev.which === 13) {
            ev.preventDefault();
            var body = $(this).val();
            sendTextMessage(gCurrChatJid, body);
        } else {
            var composing = $(this).parent().data('composing');
            if (!composing) {
                var notify = $msg({to: jid, "type": "chat"}).c('composing', {xmlns: "http://jabber.org/protocol/chatstates"});
                Gab.connection.send(notify);

                $(this).parent().data('composing', true);
            }
        }
    });
    
    //send text chat msg to current peer.
    $('#sendbtn').click(function() {
        var body = $('#inputbox').val();
        sendTextMessage(gCurrChatJid, body);
    });
    
    $('#sendbtn').bind("mousedown", function () {
    	$(this).addClass("btnmousedown");
    });
    $('#sendbtn').bind("mouseup", function () {
    	$(this).removeClass("btnmousedown");
    });
    $('#sendbtn').bind("mouseout", function () {
    	$(this).removeClass("btnmousedown");
    });

    $('#disconnect').click(function () {
        Gab.connection.disconnect();
        Gab.connection = null;
    });
    // forward click function 
  //   $('#forward').click(function(){
   //     sendTextMessage(gCurrChatJid,body);     

     //}); 
    //right click event
    $('.chat-tab').live("click", function(e) {
    	var jid = $(this).data("jid");
    	var name = $(this).find("div").text();
    	startTextChat(jid, name);
    });
    
    $('.control_button').live('mousedown', function() {
    	$(this).addClass('mouse-down');
    });
    $('.control_button').live('mouseup', function() {
    	$(this).removeClass('mouse-down');
    });
    //hidden left contact list
    $('#title').live('mousedown', function () {
      $("#contact-area").removeClass("hidden");
	  $("#right").addClass("hidden");
    //  $("#title img").attr('src','images/more.png');
     // $("#title").attr('id','hidden_button_back');
      
    }); 
	
	$('#hidden_button_back').live('mousedown', function() {
    //   $("#contact-area").removeClass("hidden");	
	  //    $("#right").addClass("hidden");
      //$("#hidden_button_back img").attr('src','images/hiddenleft.png');
      //$("#hidden_button_back").attr('id',"title");
    });
	//hidden right list
	$('#hiddenbutton').live('mousedown', function () {
//      $("#contact_area").addClass("hidden");
//	  $("#right").removeClass("hidden");
   //   $("#hidden img").attr('src','images/left_back.png');
    //  $("#hidden").attr('id','left_back');
      
    }); 
	$('#left_back').live('mousedown', function() {
      // $("#right").removeClass("hidden");	
	    //  $("#right").addClass("hidden");
      //$("#hidden_button_back img").attr('src','images/hiddenleft.png');
      //$("#hidden_button_back").attr('id',"title");
    });
    //video chat item on the right click menu
   // $('#video-chat').click(function () {
   // 	startVideoChat(gCurrChatJid);
   // });
    
    $('#closeLocal').click(function () {
    	if(local_stream!=null) {
//    		local_stream.stop();
//    		local_stream = null;
    		if(local_stream.tracks[1]) {
    			local_stream.tracks[1].enabled = false;
    		}
    		if(local_stream.tracks[0]) {
    			local_stream.tracks[0].enabled = false;
    		}
    		$('#localView').addClass("hidden");
		    var closeVideo = $msg({to: gCurrVideoJid, "type": "chat"}).c('video-chat', {type: "close-one-part"});
		    Gab.connection.send(closeVideo);
    	}
    });
    
    $('.close-img').live("mouseup", function() {
    	if($(this).parent().parent().hasClass("on-icon")) {
    		if($(this).parent().parent().prev(".chat-tab").length!=0) {
    			var jid = $(this).parent().parent().prev(".chat-tab").data("jid");
    	    	var name = $(this).parent().parent().prev(".chat-tab").find("div").text();
    	    	startTextChat(jid, name);
        	} else if($(this).parent().parent().next(".chat-tab").length!=0){
        		var jid = $(this).parent().parent().next(".chat-tab").data("jid");
    	    	var name = $(this).parent().parent().next(".chat-tab").find("div").text();
    	    	startTextChat(jid, name);
        	}
    	}
    	var jid = $(this).parent().parent().data('jid');
    	$(this).parent().parent().remove();
    	$('#chat-page-'+Gab.jid_to_id(jid)).remove();
    });
    
    //right click event
    $('.contact').live("contextmenu", function(e) {
		var jid = $(this).find(".contactinfo .contactjid").text();
		showRightMenu(e, jid);
    });
    
    //remove item on the right click menu
    $('#remove-contact').click(function () {
    	trace("start removing");
    	var jid = $(this).parent().data('jid');
    	removeContact(jid);
    });
    
    $('#video-ok').click(function() {
    //function agreeVideo() {
        if(local_stream==null) {
        	trace("trying to get user media");
			navigator.webkitGetUserMedia({audio: true, video: true}, gotStream, gotStreamFailed);
                       //$('#localView').play();
		} else {
			trace("local stream not null!");
//		    var url = webkitURL.createObjectURL(local_stream);
//		    document.getElementById("localView").src = url;
			if(local_stream.tracks[1]) {
				local_stream.tracks[1].enabled = true;
			}
			if(local_stream.tracks[0]) {
				local_stream.tracks[0].enabled = true;
			}
		 //   moveChatArea("left");
	    	var videoAgree = $msg({to: videoInvitor, "type": "chat"}).c('video-chat', {type: "video-agree"});
	        Gab.connection.send(videoAgree);
	        gCurrVideoJid = videoInvitor;
	        gVideoChatState = VideoState.VIDEO_STATE_CONNECTED;
		}
                       //$('#localView').play();
        //$('#video-invitation').addClass("hidden");
    });
    
    $('#video-cancel').click(function() {
        //$('#video-invitation').addClass("hidden");
    });
	
	  $('#forwarding-ok').click(function() {
   
	    	var videoAgree = $msg({to: forwardInvitor, "type": "chat"}).c('video-forwarding').c('type', {}, "video-forwarding-accept");
	        Gab.connection.send(videoAgree);
			startVideoChat();
                 
		
        $('#forwarding-invitation').addClass("hidden");
    });
    
    $('#forwarding-cancel').click(function() {
    	var videoDeny = $msg({to: forwardInvitor, "type": "chat"}).c('video-forwarding').c('type', {}, "video-forwarding-reject");
        Gab.connection.send(videoDeny);
        $('#forwarding-invitation').addClass("hidden");
    });
    
    
    $('#logoff').click(function() {
    	if(!confirm("Are you sure to log off")) {
    		return;
    	}
    	if(Gab.connection!=null) {
    		Gab.connection.disconnect();
    	}
 //       window.location.href=getCookie("serverCodeAddr") + "/login.html";
    });
    
    $('#videoFullScreen').click(function() {
    	setVideoFullScreen(true);
    });
    $('#endfullscreen').click(function() {
    	setVideoFullScreen(false);
    });
    
    $('#search-img').click(function() {
    	var name = trim($('#searchbox').val());
    	if(name==""||name==null) {
    		alert("Please enter something to search.");
    		return;
    	}
    	var searchStr = getSearchString(name);
    	var xml = text_to_xml(searchStr);
        if (xml) {
            Gab.connection.send(xml);
        } else {
            alert("error");
        }
    });
}

function stopVideoChat() {
	if(gCurrVideoJid!=null) {
		var currVideoPeer = getUserPeer(gCurrVideoJid);
		local_stream.stop();
		if (currVideoPeer == null) {
			// stop because remote one stopped video
			gVideoChatState = VideoState.VIDEO_STATE_STOPPED;
			// init video state
			initVideo();
			addMessage(-1, "System", "Romote has stopped the video chat.");
		} else if (gVideoChatState==VideoState.VIDEO_STATE_CONNECTED
				|| gVideoChatState == VideoState.VIDEO_STATE_CONNECTING){
			// first one to stop video
			currVideoPeer.closeVideo();
			var closeMsg = $msg({to: gCurrVideoJid, "type": "chat"}).c('video-chat', {type: "video-close"});
			Gab.connection.send(closeMsg);
			// stopMultipleConnection();
			gVideoChatState = VideoState.VIDEO_STATE_STOPPED;
		}
		gCurrVideoJid = null;
		gInvited = false;
	}
}

function toFull(){ 
	// Create a new jQuery.Event object with specified event properties.
//	var e = jQuery.Event();
	// trigger an artificial keydown event with keyCode 64
	$(document).trigger("keydown", { keyCode: 122 });
}

function setVideoFullScreen(fullscreen) {
	if(fullscreen) {
		if(gVideoChatState=VideoState.VIDEO_STATE_CONNECTED) {
			//$('#endfullscreen').css({position:"absolute",'z-index':14, 'top':0, 'left':$(window).width()-$('#endfullscreen').width()});
			$('#endfullscreen').css({position:"absolute",'z-index':14, 'top':0, 'left':800-$('#endfullscreen').width()});
			$('#endfullscreen').removeClass("hidden");
		//	$('#mask').removeClass("hidden");
        		$('#R5').css({position:"absolute", 'width':"800px",'height':"600px",'top':0,'left':0, 'margin-top':0, 'margin-left':0});
			$('#videobox-f').css({position:"relactive",'width':"800px",'height':"600px", 'top':0, 'left':0, 'margin-top':0, 'margin-left':0});
			$('#remoteView').css({position:"relactive", 'top':0, 'left':0, 'width':"800px", 'height':"600px"});
			//$('.videobox-u').css({position:"absolute", 'z-index':15, 
//			$('.video-f').css({position:"relactive",
//				'top':$(window).height()-$('.videobox-f').height(), 
		//		'left':$(window).width()-$('.videobox-f').width(), 'margin-top':0});
		//	$('.controllbar-f').addClass("hidden");
                  $('#send').addClass("hidden");      
		}
	} else {
		$('#endfullscreen').addClass("hidden");
		$('#endfullscreen').removeAttr("style");
	//	$('#mask').addClass("hidden");
		$('#R5').removeAttr("style");
		$('#remoteView').removeAttr("style");
		$('.videobox-f').removeAttr("style");
//		$('.video-f').removeAttr("style");
                $('#send').removeClass("hidden");
	}

}

function sendTextMessage(jid, body) {
    if(body==null||body=="") {
    	alert("You cannot send empty message.");
    	return;
    }
    if(jid==null) {
    	alert("Please select a contact first.");
    	return;
    }
    var message = $msg({to: jid, "type": "chat"}).c('body').t(body).up().c('active', {xmlns: "http://jabber.org/protocol/chatstates"});
    Gab.connection.send(message);
}

//显示右键菜单可见
function showRightMenu(e, jid) {
	var menuleft = e.clientX;
    var menutop = e.clientY;
	$('#right-menu').css({position:"absolute", 'top':menutop, 'left':menuleft});
    $('#right-menu').data('jid', jid);

    $('#right-menu').removeClass("hidden");
    event.preventDefault();
    return false;
};

//隐藏右键菜单,设置visibility为hidden就OK！
function hideRightMenu() {
	$('#right-menu').addClass("hidden");
};

//remove a Contact
function removeContact(jid) {
	trace("send to remove");
	var iq = $iq({type: "set"}).c("query", {xmlns: Strophe.NS.ROSTER}).c("item", {jid: jid, subscription: "remove"});
	Gab.connection.sendIQ(iq);
}

$(document).ready(function () {
	initPage();
	toFull();
});

function bindDocumentEvent() {
	//Register an account
	$(document).bind('register', function (ev, data) {
		startRegistration(data);
	});

	//connect to the XMPP server
	$(document).bind('connect', function (ev, data) {
            if(data==null||data.jid==null||data.jid==""||data.password==null||data.password=="") {
         //       window.location.href = getCookie("serverCodeAddr") + "/login.html";
            }

	    var conn = new Strophe.Connection(getCookie("serverAddr") + "/http-bind");
	    conn.connect(data.jid, data.password, function (status) {
	        if (status === Strophe.Status.CONNECTED) {
	            $(document).trigger('connected');
	        } else if(status===Strophe.Status.AUTHFAIL){
	        	$('#login_msg').text("Login failed. Please check your user name and password.");
	        	$('#login_dialog').dialog('open');
	        } else if (status === Strophe.Status.DISCONNECTED) {
	            $(document).trigger('disconnected');
	        }
	    });

	    Gab.connection = conn;
	});

	//after connected to the XMPP Server
	$(document).bind('connected', function () {
	    //Get my name
		var iq = $iq({type: 'get'}).c('query', {xmlns: 'jabber:iq:register'});
		Gab.connection.sendIQ(iq, Gab.resolveMyInfo);
	    //get the roster list
	    var iq = $iq({type: 'get'}).c('query', {xmlns: 'jabber:iq:roster'});
	    Gab.connection.sendIQ(iq, Gab.on_roster);
	    //set handler for roster change messages and chat messages
	    Gab.connection.addHandler(Gab.on_roster_changed, "jabber:iq:roster", "iq", "set");
	    Gab.connection.addHandler(Gab.on_message, null, "message", "chat");
	});

	$(document).bind('disconnected', function () {
	    Gab.connection = null;
	    Gab.pending_subscriber = null;

	    //empty the roster list
	    $('#roster-area ul').empty();
	    $('#chat-area ul').empty();
	    $('#chat-area div').remove();

	    $('#login_dialog').dialog('open');
	});

	$(document).bind('contact_added', function (ev, data) {
	    //add as a contact
	    var iq = $iq({type: "set"}).c("query", {xmlns: "jabber:iq:roster"}).c("item", data);
	    Gab.connection.sendIQ(iq);
	    //send a presence subscription request
	    var subscribe = $pres({to: data.jid, "type": "subscribe"});
	    Gab.connection.send(subscribe);
	});
}

bindDocumentEvent();

//define functions
function startTextChat(jid, name) { 
//	trace("start chat with "+jid+", name: "+name);
    var jid_id = Gab.jid_to_id(jid);
    
    gCurrChatJid = jid;
}

function startForwarding(jid){
              if(jid==null){                 
		alert("Please select a contact first.");
		return;
	}
	var jid = jid;

    if(gVideoChatState!=VideoState.VIDEO_STATE_CONNECTED) {
		alert("Please Join Video conversation at first.");
		return;
	}
              var forwardInvt = $msg({to: jid, "type": "chat"}).c('video-forwarding').c('type', {}, "video-forwarding-request");
               
              Gab.connection.send(forwardInvt);
}

//has got a forward sig msg from peer, handle it.
function handleForwardingMsg(message) {
	var full_jid = $(message).attr('from');
    var jid = Strophe.getBareJidFromJid(full_jid);
    var jid_id = Gab.jid_to_id(jid);
    
    //forward msg type
    var forwardmsg = $(message).find('video-forwarding').find('type');
    var msgType = forwardmsg[0].textContent;
    
    //recieved a forward invitation
    if(msgType=='video-forwarding-request') {
    	//	trace("received an forwarding invitation from "+full_jid);
            forwardInvitor = full_jid;
            gInvited = true;
            showForwardInit();
	//		startVideoCall();
    	//	alert("You've received a forward invitation from "+jid+", you can stop current connection to accept it.");
        return true;
    }
    //remote has agreed to forwarding
    if(msgType=='video-forwarding-accept') {
        trace(full_jid+" has agreed to forwarding.");
        gCurrVideoJid = jid;
		
    		//alert("You've received a forward invitation from "+jid+", you should stop current connection to accept it.");
		//need to check
		stopMultipleConnection();
		//startVideoCall();
        $('#text_logo').removeClass("hidden"); 
        $('#biglogo').removeClass("hidden"); 
        $('#intel_logo').removeClass("hidden"); 
          $('#videobox-f').addClass("hidden");
		$('#remoteView').addClass("hidden");
    		gVideoChatState = VideoState.VIDEO_STATE_STOPPED;
		
		return true;
   } 
    //remote has denied forwarding
    if(msgType=='video-forwarding-reject') {
        trace(full_jid+" has denied to forwarding .");
        alert(jid+" has denied your forwarding request.");
        return true;
    }
 
    trace("error type: "+type);
    return true;
}

function showForwardInit() {
	$('#forwarding-from').text(Strophe.getBareJidFromJid(forwardInvitor));
	$('#forwarding-invitation').removeClass("hidden");
}
//Send a video chat invitation to jid
function startVideoChat(gCurrChatJid) {
	if(gCurrChatJid==null) {
		alert("Please select a contact first.");
		return;
	}
	var jid = gCurrChatJid;
//	startTextChat(jid);
	if(gVideoChatState==VideoState.VIDEO_STATE_CONNECTING) {
		alert("Connecting to mixserver please wait.");
		return;
	} else if(gVideoChatState==VideoState.VIDEO_STATE_CONNECTED) {
		return;
	}
	
	if(local_stream==null) {
		navigator.webkitGetUserMedia({audio: true, video: true}, gotStream, gotStreamFailed);
		var intervalId = setInterval(function() {
	//			if(local_stream!=null) {
		gVideoChatState = VideoState.VIDEO_STATE_CONNECTING;
		trace("sending an video chat invitation to "+jid);
		var videoInvt = $msg({to: jid, "type": "chat"}).c('video-chat', {type: "video-invitation"});
         // alert(videoInvt);				
    		Gab.connection.send(videoInvt);
		clearInterval(intervalId);
//		}
		}, 200);
	} else {
		trace("localstream not null!");
		if(local_stream.audioTracks[1]) {
			local_stream.audioTracks[1].enabled = true;
		}
		if(local_stream.audioTracks[0]) {
			local_stream.audioTracks[0].enabled = true;
		}
		if(local_stream.videoTracks[1]) {
			local_stream.videoTracks[1].enabled = true;
		}
		if(local_stream.videoTracks[0]) {
			local_stream.videoTracks[0].enabled = true;
		}
/*	    var url = webkitURL.createObjectURL(local_stream);
	    document.getElementById("localView").src = url;*/
	//    moveChatArea("left");
	  
		gVideoChatState = VideoState.VIDEO_STATE_CONNECTING;
		trace("sending an video chat invitation to "+jid);
	    var videoInvt = $msg({to: jid, "type": "chat"}).c('video-chat', {type: "video-invitation"});
	    Gab.connection.send(videoInvt);
	}
       $('#text_logo').addClass("hidden");
        $('#intel_logo').addClass("hidden");
        $('#biglogo').addClass("hidden");
          $('#videobox-f').removeClass("hidden");
          $('#remoteView').removeClass("hidden");
           $('#R5').css("background-image","url(./images/white.png");
           $('#R5').css("background-color","transparent");

        // createMultipleConnection();

	//	gVideoChatState = VideoState.VIDEO_STATE_CONNECTED;
}

//has got a video sig msg from peer, handle it.
function handleVideoMsg(message) {
	var full_jid = $(message).attr('from');
    var jid = Strophe.getBareJidFromJid(full_jid);
    var jid_id = Gab.jid_to_id(jid);
    
    //video msg type
    var videoChat = $(message).find('video-chat');
    var msgType = videoChat.attr('type');
    
    //recieved a video invitation
    if(msgType=='video-invitation') {
    	switch(gVideoChatState) {
    	case VideoState.VIDEO_STATE_READY:
    	case VideoState.VIDEO_STATE_STOPPED:
            trace("received a video invitation from "+full_jid);
            videoInvitor = full_jid;
            gInvited = true;
            showVideoInit();
            break;
    	case VideoState.VIDEO_STATE_CONNECTED:
    	case VideoState.VIDEO_STATE_CONNECTING:
    		alert("You've received a video invitation from "+jid+", you can stop current connection to accept it.");
    	}
        return true;
    }
    //remote has agreed to video chat
    if(msgType=='video-agree') {
    	gVideoChatState = VideoState.VIDEO_STATE_CONNECTED;
        trace(full_jid+" has agreed to video chat.");
        gCurrVideoJid = jid;

		startVideoCall(full_jid);
		return true;
    }
    //remote has denied video chat
    if(msgType=='video-deny') {
    	gVideoChatState = VideoState.VIDEO_STATE_READY;
        trace(full_jid+" has denied to video chat.");
        alert(jid+" has denied your video request.");
        if(local_stream!=null) {
//        	local_stream.stop();
        	if(local_stream.tracks[1]) {
    			local_stream.tracks[1].enabled = false;
    		}
    		if(local_stream.tracks[0]) {
    			local_stream.tracks[0].enabled = false;
    		}
        }
        moveChatArea("right");
        return true;
    }
    //signaling msg video chat
    if(msgType=='video-msg') {
    	//if(gVideoChatState!=VideoState.VIDEO_STATE_CONNECTED) {
    	//	return;
    	//}
		handlePeerMessage(videoChat.text(), full_jid);
        return true;
    }
    //signaling msg video chat
    if(msgType=='video-close') {
    	if(gVideoChatState==VideoState.VIDEO_STATE_CONNECTED) {
    		gVideoChatState = VideoState.VIDEO_STATE_STOPPED;
        	gInvited = false;
    		var userPeer = getUserPeer(jid);
    		if(userPeer!=null) {
    			userPeer.closeVideo();
    			console.log(userPeer);
    		}
    		stopVideoChat();
    	}
    	return true;
    }
    //signaling msg video chat
    if(msgType=='close-one-part') {
//		alert(full_jid+" has closed his video");
		$('#remoteView').addClass("hidden");
        return true;
    }
    trace("error type: "+type);
    return true;
}

function agreeVideo() {
        if(local_stream==null) {
        	trace("trying to get user media");
			navigator.webkitGetUserMedia({audio: true, video: true}, gotStream, gotStreamFailed);
		} else {
			trace("local stream not null!");
    		if(local_stream.audioTracks[1]) {
    			local_stream.audioTracks[1].enabled = true;
    		}
    		if(local_stream.audioTracks[0]) {
    			local_stream.audioTracks[0].enabled = true;
    		}
    		if(local_stream.videoTracks[1]) {
    			local_stream.videoTracks[1].enabled = true;
    		}
    		if(local_stream.videoTracks[0]) {
    			local_stream.videoTracks[0].enabled = true;
    		}
	    	var videoAgree = $msg({to: videoInvitor, "type": "chat"}).c('video-chat', {type: "video-agree"});
	        Gab.connection.send(videoAgree);
	        gCurrVideoJid = videoInvitor;
	        gVideoChatState = VideoState.VIDEO_STATE_CONNECTED;
		}
}

function denyVideo() {
    	var videoDeny = $msg({to: videoInvitor, "type": "chat"}).c('video-chat', {type: "video-deny"});
        Gab.connection.send(videoDeny);
}

function showVideoInit() {
	addMessage(-1, 'System', 'You have received a video chat request. <div class="chatPanelBtn"><div class="videoMsg acceptVideoBtn">Accept</div><div class="videoMsg denyVideoBtn">Decline</div></div>');
	$(".acceptVideoBtn").click(function(){
		agreeVideo();
        $("#videoLoading").hide();
		$("#videoContent").show();
        $(this).parent().remove(".chatPanelBtn");
        addMessage(-1, "System", "You have accepted the video chat.");
	});
	$(".denyVideoBtn").click(function(){
		denyVideo();
        $(this).parent().parent().append("<br />You have declined the video chat.");
        $(this).parent().remove(".chatPanelBtn");
	});
	//$('#video-from').text(Strophe.getBareJidFromJid(videoInvitor));
	//$('#video-invitation').removeClass("hidden");
}

//return a new chat tab content
function getNewTab(jid_id, name) {
	var newChatTab = '<div class="on-icon chat-tab" id="chat-tab-'+jid_id+'" style="background-image:url(images/headsmall.png)">'+
	//var newChatTab = '<div class="on-icon chat-tab" id="chat-tab-'+jid_id+'>' +name+
			       '<div class="chat-tab-name" id="chat-tab-name">'+name+
				     '<img class="close-img" src="images/close.png" alt="close">'+
					 '</div>'+
				'</div>';
    return newChatTab;
}

//return a new chat page content
function getNewChatPage(jid_id) {
	var newChatPage = '<div class="dail-detail" id="chat-page-'+jid_id+'"></div>';
    return newChatPage;
}

function getChatHTML(jid_id,body, self) {
	var chatHTML = "";
	if(self) {
		chatHTML = '<div class="message-u">'+
					   	'<div class="icon-s-u">'+'<img src="images/headsmall.png" width="20" height="20">'+'me:'+'</div>'+
					    '<div class="words-u">'+
					    	'<p>'+body+'</p>'+
					    '</div>'+
					'</div>';
	} else {
         var name=jid_id.split("@");
       
    	chatHTML = '<div class="message-f">'+
				    	'<div class="icon-s-f">'+'<img src="images/headsmall.png" width="20" height="20">'+name[0]+':'+'</div>'+
				        	'<div class="words-f"><p>'+body+'</p>'+
                                        '</div>'+
				    '</div>';
	}
	return chatHTML;
}

//高亮度鼠标滑过的菜单条项目
function highlightie5() {
    if (event.srcElement.className == "menuitems") {
        event.srcElement.style.backgroundColor = "highlight";
        event.srcElement.style.color = "white";
    }
}

//恢复菜单条项目的正常显示
function lowlightie5() {
    if (event.srcElement.className == "menuitems") {
        event.srcElement.style.backgroundColor = "";
        event.srcElement.style.color = "black";
        window.status = "";
    }
}

function checkState(jid) {
	for(var i=0; i<remotePeers.length; i++) {
		if(remotePeers[i].jid==Strophe.getBareJidFromJid(jid)) {
			return remotePeers[i].state;
		}
	}
	return "NONE";
}

var gMarginLeft = 300;
function moveChatArea(direction) {
	if(direction=="left") {
	//	$('#chatarea').animate({marginLeft:"0px"},{duration:1000});
	//	$('#chatarea').animate({width:"50%",marginLeft:"300px"},{duration:1000});
		$('#videobox-f').removeClass("hidden");
		$('#remoteView').removeClass("hidden");
		trace("move left");
	} else if(direction=="right") {
//		$('#chatarea').animate({marginLeft:"300px"},{duration:1000});
		$('#videobox-f').addClass("hidden");
		$('#remoteView').addClass("hidden");
		trace("move right");
	}
}

function text_to_xml(text) {
    var doc = null;
    if (window['DOMParser']) {
    	alert('window DOMParser');
        var parser = new DOMParser();
        doc = parser.parseFromString(text, 'text/xml');
    } else if (window['ActiveXObject']) {
    	alert('window ActiveXObject');
        var doc = new ActiveXObject("MSXML2.DOMDocument");
        doc.async = false;
        doc.loadXML(text);
    } else {
        alert("no DOMParser");
    }

    var elem = doc.documentElement;
    if ($(elem).filter('parsererror').length > 0) {
        return null;
    }
    return elem;
}

function trim(str){
	if(str==null) {
		return str;
	}
    for(var i = 0;  i<str.length && str.charAt(i)==" "; i++);
    for(var j = str.length;  j>0 && str.charAt(j-1)==" "; j--);
    if(i>j)  return  "";  
    return  str.substring(i,j);  
}

function getSearchString(name) {
	return '<iq to="search."'+domain+' type="set">' +
			    '<query xmlns="jabber:iq:search">'+
				    '<x xmlns="jabber:x:data" type="submit">'+
				        '<field var="FORM_TYPE" type="hidden">'+
				            '<value>jabber:iq:search</value>'+
				        '</field>'+
				        '<field var="search" type="text-single">'+
				            '<value>'+name+'</value>'+
				        '</field>'+
				        '<field var="Username" type="boolean">'+
				            '<value>1</value>'+
				        '</field>'+
				        '<field var="Name" type="boolean">'+
				            '<value>1</value>'+
				        '</field>'+
				        '<field var="Email" type="boolean">'+
				            '<value>0</value>'+
				        '</field>'+
				    '</x>'+
				'</query>'+
			'</iq>';
}

window.onbeforeunload = function() {
	Gab.connection.disconnect();
    Gab.connection = null;
};
