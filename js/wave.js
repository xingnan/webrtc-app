$(document).ready(function(){
	$(window).resize(function(){
		resize();
	});

	var canvas = $("#waveCanvas").get(0);
	if (canvas) {
		ctx = canvas.getContext("2d");
		barCnt = 128;
		pieceCnt = 32;
		topMaxDelta = 3; // max delta value of pixel top piece can change
		topHeight = 2;
		
		resize();

		waveBuf = [];
		topBuf = [];
		frameCnt = 0;

		setInterval(drawWave, 40);
	} else {
		alert("Canvas not enabled!");
	}
});

function resize() {
	$("#waveCanvas").attr("width", $("#waveMain").width());
	$("#waveCanvas").attr("height", 110);

	totalWidth = $("#waveCanvas").width();
	totalHeight =$("#waveCanvas").height();
	barWidth = totalWidth / barCnt * 0.75;
	pieceHeight = totalHeight / (pieceCnt + 1) * 0.75;
	barGap = barWidth / 3;
	pieceGap = pieceHeight / 3;
}

function drawWave() {
	++frameCnt;
	var buf = new Array(barCnt);
	soundEffect.getTimeDomainData(buf);
	waveBuf = buf;
		
	// update top piece
	for (var i = 0; i < barCnt; ++i) {
		var pos = totalHeight - (pieceGap + pieceHeight) * Math.floor(waveBuf[i]) - pieceGap / 2;
		if (topBuf[i] + topMaxDelta < pos) {
			topBuf[i] += topMaxDelta;
		} else {
			topBuf[i] = pos;
		}
	}	

	ctx.clearRect(0, 0, totalWidth, totalHeight);

	var left = barGap / 2;
	for (var i = 0; i < barCnt; ++i) {
		ctx.fillStyle = "hsl(" + Math.floor(90 - waveBuf[i] / pieceCnt * 90) + ", 60%, 50%)";
		if (waveBuf[i] != null && 
				(waveBuf[i] > 0 && waveBuf[i] <= pieceCnt)){
			var top = totalHeight - pieceGap / 2 - pieceHeight;
			for (var j = 0; j < waveBuf[i]; ++j) {
				ctx.fillRect(left, top, barWidth, pieceHeight);
				top -= pieceGap + pieceHeight;
			}
		}

		// top piece
		ctx.fillStyle = "#ff0";
		if (topBuf[i] != null) {
			ctx.fillRect(left, topBuf[i],
					barWidth, topHeight);
		}

		left += barWidth + barGap;
	}
}

