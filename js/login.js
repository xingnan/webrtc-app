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

// delete all cookies
function clearCookie() {
	var cookies = document.cookie.split(";");
	for (var i = 0; i < cookies.length; ++i) {
		var c = cookies[i];
		var eqPos = c.indexOf("=");
		var name = eqPos > -1 ? c.substr(0, eqPos) : c;
		document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT";
	}
}

$(document).ready(function () {
	// clear previous information
	clearCookie();
	
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

	// Login as Alice or Bob
    $('.loginBtn').click(function () {
        var id = "none";
        if ($(this).hasClass('alice')) {
            id = 'alice';
        } else if ($(this).hasClass('bob')) {
            id = 'bob';
        } else {
            alert('Illegal because client name is neither Alice nor Bob!');
            return;
        }
    	$(document).trigger('connect', {
            jid: id + "@" + domain,// + "/" + device,
            password: "rt24"
        });
    });
});

//connect to the XMPP server
$(document).bind('connect', function (ev, data) {
    var conn = new Strophe.Connection(serverAddr + "/http-bind");
    conn.connect(data.jid, data.password, function (status) {
        if (status === Strophe.Status.CONNECTED) {
            conn.disconnect();
            setCookie("jid", data.jid);
            setCookie("password", data.password);
			window.location.href = "chat.html";
        } else if(status===Strophe.Status.AUTHFAIL){
			alert("Login failed. Please check your user name and password.");
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
    console.log("note: " + iq);
    Gab.connection.sendIQ(iq, Gab.on_roster);

    //set handler for roster change messages and chat messages
    Gab.connection.addHandler(Gab.on_roster_changed, "jabber:iq:roster", "iq", "set");
    Gab.connection.addHandler(Gab.on_message, null, "message", "chat");
});
