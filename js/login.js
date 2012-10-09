var connection;
var domain;
var ipAddress;
var serverAddr;
var serverCodeAddr;
var webappName;
var device = window.navigator.platform;

if (device.indexOf("Win32") > -1) {
    device = "Ultrabook";
}

if (device.indexOf("Linux") > -1) {
    device = "LinuxLaptop";
}

function setCookie(c_name, value) {
	document.cookie = c_name + "=" + escape(value);
}

$(document).ready(function () {
    // Get configuration from JSON file.
    $.getJSON("manifest.json", function(data) {
        domain = data.domain;
        ipAddress = data.ip_address;
        webappName = data.webapp_name;
        serverAddr = "http://" + ipAddress;
        serverCodeAddr = serverAddr + "/" + webappName;

        // Set cookie
        setCookie("domain", domain);
        setCookie("serverAddr", serverAddr);
        setCookie("serverCodeAddr", serverCodeAddr);
        setCookie("webappName", webappName);
    });

	//remove item on the right click menu
    $('#login').click(function () {
    	$(document).trigger('connect', {
            jid: $('#jid').val() + "@" + domain,// + "/" + device,
            password: $('#password').val()
        });
    });
    
    $('#password').bind('keypress', function(ev) {
    	if (ev.which === 13) {
            ev.preventDefault();
            $(document).trigger('connect', {
                jid: $('#jid').val() + "@" + domain + "/" + device,
                password: $('#password').val()
            });
    	}
    });
    
    $('#login').bind("mousedown", function () {
    	$(this).addClass("mousedown");
    });
    $('#login').bind("mouseup", function () {
    	$(this).removeClass("mousedown");
    });
    $('#login').bind("mouseout", function () {
    	$(this).removeClass("mousedown");
    });
    
    var h = $(window).height(); 
    var w = $(window).width();
    var conWidth = $('#container').width();
    var conHeight = $('#container').height();
    $('#container').css({position:"absolute", 'top':h/2-conHeight/2, 'left':w/2-conWidth/2});
    
    $('#jid').focus();
});

//connect to the XMPP server
$(document).bind('connect', function (ev, data) {
    var conn = new Strophe.Connection(serverAddr + "/http-bind");
    conn.connect(data.jid, data.password, function (status) {
        if (status === Strophe.Status.CONNECTED) {
            conn.disconnect();
            setCookie("jid", data.jid);
            setCookie("password", data.password);
	    window.location.href = serverCodeAddr + "/WooGeen.html";
        } else if(status===Strophe.Status.AUTHFAIL){
        	$('#login_msg').text("Login failed. Please check your user name and password.");
        	$('#login_dialog').dialog('open');
        } else if (status === Strophe.Status.DISCONNECTED) {
            $(document).trigger('disconnected');
        }
    });

    connection = conn;
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
