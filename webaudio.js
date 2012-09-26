var soundEffect = new SoundEffect();
soundEffect.soundList = [
	new Sound("sounds/feedback-spring.wav", "spring reverb simulation"),
	new Sound("sounds/spreader.wav", "spreader"),
	new Sound("sounds/telephone.wav", "telephone"),
	new Sound("sounds/wildecho.wav", "wild echo")
];

$(document).ready(function () {
	soundEffect.load();
});

function Sound(url, name) {
    this.url = url;
    this.name = name;
    this.startedLoading = false;
    this.loaded = false;
    this.buffer = 0;
}

Sound.prototype.load = function() {
    if (this.loaded) {
        // Already loaded
        return;
    }

    if (this.startedLoading) {
        return;
    }

    this.startedLoading = true;
        
    // Load asynchronously
    var request = new XMLHttpRequest();
    request.open("GET", this.url, true);
    request.responseType = "arraybuffer";
    
    var sound = this;
    request.onload = function() {
		sound.buffer = soundEffect.context.createBuffer(request.response, false);
        //sound.buffer = request.response;
        sound.loaded = true;
    }
    request.send();
}

function SoundEffect() {
	this.soundList = null;
    this.context = new webkitAudioContext();
	this.convolver = null;
	this.gain = null;
	this.convolverGain = null;

	this.support = function () {
    	if (this.context.createMediaStreamSource == undefined || this.context.createMediaStreamDestination == undefined) {
        	return false;
			console.log("APIs for webaudio and webrtc integration are not supported!");
		}
		return true;
	}
}

SoundEffect.prototype.load = function () {
	if (!this.support())
		return;
	if (this.soundList == null) {
		alert("No sound sources to load!");
		return;
	}
	for (var i = 0; i < this.soundList.length; i++)
		this.soundList[i].load();
}

SoundEffect.prototype.init = function (stream) {
	if (!this.support())
		return;
	// Check the source
	for (var i = 0; i < this.soundList.length; i++) {
		if (!this.soundList[i].loaded) {
			alert("Loading source of \"" + this.soundList[i].name + "\" failed!");
			return;
		}
	}

    if (stream == null)
    	return;
    if (this.context == null)
        this.context = new webkitAudioContext();
    var source = this.context.createMediaStreamSource(stream);
    var dest = this.context.createMediaStreamDestination();
   	this.gain = this.context.createGainNode();
    this.convolverGain = this.context.createGainNode();
    this.gain.gain.value = 1.0;
    this.convolverGain.gain.value = 2.0;
	source.connect(this.gain);
	this.gain.connect(dest);

	this.convolver = this.context.createConvolver();
    source.connect(this.convolver);
	//this.convolver.connect(this.convolverGain);
    this.convolverGain.connect(dest);
}

SoundEffect.prototype.list = function () {
	if (!this.support())
		return;

}

SoundEffect.prototype.use = function (i) {
	if (!this.support())
		return;
	if (i >= this.soundList.length)
		return;
	this.convolver.buffer = this.soundList[i].buffer;
	//this.convolver.buffer = this.context.createBuffer(this.soundList[i].buffer, false);
	this.convolver.connect(this.convolverGain);
}

SoundEffect.prototype.none = function () {
	if (!this.support())
		return;
	this.convolver.disconnect();
}
