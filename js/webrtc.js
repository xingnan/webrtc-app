//定义类RemotePeer
function RemotePeer(jid) {
	this.fullJid = jid;
	this.jid = Strophe.getBareJidFromJid(jid);
	this.name = Strophe.getNodeFromJid(jid);
	this.videoViewId = "video_"+Gab.jid_to_id(this.jid);	//video view tag's ID
	this.state = "READY";
	
	trace("New RemotePeer, jid: "+this.jid);
	var _this = this;
	
	//var stun = "STUN NONE";
	var stun = "STUN stun.l.google.com:19302";

	this.peerConn = new webkitPeerConnection00(stun, function(candidate, moreToFollow) {
		if (candidate) {
			_this.sendMessage({type: 'candidate', label: candidate.label, candidate: candidate.toSdp()});
    	}

    	if (!moreToFollow) {
      		trace("End of candidates.");
    	}
	});
    this.peerConn.onaddstream = function(e) {
    	trace("onaddstream");
    	var stream = this.remoteStreams[0];
        var url = webkitURL.createObjectURL(stream);
        trace("onAddStream to: remoteView");
//        document.getElementById(_this.videoViewId).src = url;
        document.getElementById("remoteView").src = url;
        _this.state = "CHATTING";
//        posLocalView();
    };
    this.peerConn.onremovestream = function(e) {
        document.getElementById(this.videoViewId).src = "";
        trace("Stopped showing remote stream.");
        _this.peerConn = null;
    };
    
    this.addStream = function() {
        trace("addStream to PeerConn "+ this.jid);
    	if(local_stream==null) {
    		trace("error: local stream null");
    		return;
    	}
        this.peerConn.addStream(local_stream);
    };
    
    this.closeVideo = function() {
    	trace("closing video in " +this.jid);
    	this.peerConn.close();
    	if(local_stream!=null) {
//    		local_stream.stop();
//    		local_stream = null;
    		if(local_stream.tracks[1]) {
    			local_stream.tracks[1].enabled = false;
    		}
    		if(local_stream.tracks[0]) {
    			local_stream.tracks[0].enabled = false;
    		}
    	}
    	_this.state = "CLOSED";
    	_this.fullJid=null;
    	_this.jid=null;
    };
	this.doCall = function() {
    	trace("Send offer to " + this.jid);
   	 	var offer = this.peerConn.createOffer({audio:true, video:true});
    	this.peerConn.setLocalDescription(this.peerConn.SDP_OFFER, offer);
    	this.sendMessage({type: 'offer', sdp: offer.toSdp()});
        this.peerConn.startIce();
        if(_this.state=="READY") {
        	_this.state = "CONNECTING";
        }
    };
    this.sendMessage = function (message) {
		var data = JSON.stringify(message);
console.log('C->S: ' +data);
		var remotejid = Strophe.getBareJidFromJid(_this.jid);
    	trace("onsigmsg: sending msg to "+remotejid);
        var sigMsg = $msg({to: remotejid, "type": "chat"}).c('video-chat', {type: "video-msg"}).t(data);
//console.log("Send: " + sigMsg);
        Gab.connection.send(sigMsg);
	};
	this.processSignalingMessage = function(message) {
		var msg = JSON.parse(message);
	console.log('S->C: ' + msg);

    	if (msg.type === 'offer') {
      	// Callee creates PeerConnection
      	//if (!initiator && !started)
        //maybeStart();

      		this.peerConn.setRemoteDescription(this.peerConn.SDP_OFFER, new SessionDescription(msg.sdp));
      		this.doAnswer();
    	} else if (msg.type === 'answer') {
      		this.peerConn.setRemoteDescription(this.peerConn.SDP_ANSWER, new SessionDescription(msg.sdp));
    	} else if (msg.type === 'candidate') {
      		var candidate = new IceCandidate(msg.label, msg.candidate);
      		this.peerConn.processIceMessage(candidate);
		} else if (msg.type === 'bye') {
			//FIXME onRemoteHangup();
    	}
	};
	this.doAnswer = function() {
		trace("Send answer to peer");
    	var offer = this.peerConn.remoteDescription;
    	var answer = this.peerConn.createAnswer(offer.toSdp(), {audio:true,video:true});
	    this.peerConn.setLocalDescription(this.peerConn.SDP_ANSWER, answer);
    	this.sendMessage({type: 'answer', sdp: answer.toSdp()});
    	this.peerConn.startIce();
	};
}

function startVideoCall(jid) {
	trace("startVideoCall");
	var len = remotePeers.length;
	remotePeers[len] = new RemotePeer(jid);
	remotePeers[len].addStream();
	remotePeers[len].doCall();
}

function handlePeerMessage(msg, jid) {
	trace("Got video sig msg from "+jid + ", msg: " + msg);
	msg = msg.replace(/&quot;/g, "\"");
	
	for(var i=0; i<remotePeers.length; i++) {
		if(remotePeers[i].jid==Strophe.getBareJidFromJid(jid)) {
			trace("start handle by "+i+"th RemotePeer");
			try {
				remotePeers[i].processSignalingMessage(msg);
			} catch(e) {
				trace("Signaling message error: " + e.description);
			}
			return;
		}
	}
	trace("No existing RemotePeer, Will Create New one");
	var len = remotePeers.length;
	remotePeers[len] = new RemotePeer(jid);
	remotePeers[len].addStream();
	remotePeers[len].processSignalingMessage(msg);
}

//close 跟jid正在进行的video chat, 这是主动close的一方
function closeVideoChat(jid) {
	var userPeer = getUserPeer(jid);
	if(userPeer!=null) {
		userPeer.closeVideo();
		//send video close msg to peer
		var closeMsg = $msg({to: jid, "type": "chat"}).c('video-chat', {type: "video-close"});
	    Gab.connection.send(closeMsg);
	} else {
		trace("error: no such user exist");
	}
}

//get the right RemotePeer from array remotePeers
function getUserPeer(jid) {
	for(var i=0; i<remotePeers.length; i++) {
		if(remotePeers[i].jid==Strophe.getBareJidFromJid(jid)) {
			return remotePeers[i];
		}
	}
	return null;
}

// Local stream generation
function gotStream(s) {
    var url = webkitURL.createObjectURL(s);
    document.getElementById("localView").src = url;
    trace("Got local video stream!");//. url = " + url);
    local_stream = s;

    // Insert the local media filter with audio
    soundEffect.init(local_stream);
    //soundEffect.use(2);

    //  $('#localView').play();
  //  moveChatArea("left");
    if(gInvited) {
    	var videoAgree = $msg({to: videoInvitor, "type": "chat"}).c('video-chat', {type: "video-agree"});
        Gab.connection.send(videoAgree);
        gCurrVideoJid = videoInvitor;
        gVideoChatState = VideoState.VIDEO_STATE_CONNECTED;
    }
}

function gotStreamFailed(error) {
    alert("Failed to get access to webcam. Error code was " + error.code);
    trace("Failed to get access to webcam. Error code was " + error.code);
}

function trace(txt) {
	console.log(txt);
}
