$(document).ready(function(){
	var canvas = $("#waveCanvas").get(0);
	if (canvas) {
		ctx = canvas.getContext("2d");

		$("#waveCanvas").attr("width", $("#waveMain").width());
		$("#waveCanvas").attr("height", 110);

		barCnt = 32;
		pieceCnt = 16;
		pieceMaxDelta = 8; // max delta value of piece in each bar each frame
		topMaxDelta = 1; // max delta value of pixel top piece can change
		totalWidth = $("#waveCanvas").width();
		totalHeight =$("#waveCanvas").height();
		barWidth = totalWidth / 32 * 0.75;
		pieceHeight = totalHeight / (pieceCnt + 1) * 0.75;
		topHeight = 2;
		barGap = barWidth / 3;
		pieceGap = pieceHeight / 3;

		waveBuf = [];
		topBuf = [];
		frameCnt = 0;

		setInterval(drawWave, 20);
	} else {
		alert("Canvas not enabled!");
	}
});

function drawWave() {
	++frameCnt;
	if (frameCnt % 8 == 0) { 
		var buf = [];
		if (waveBuf.length == 0) {
			topBuf = [];
			for (var i = 0; i < barCnt; ++i) {
				var pos = Math.floor(Math.random() * pieceCnt);
				buf.push(pos);
				topBuf.push(pos - pieceGap / 2);
			}
		} else {
			for (var i = 0; i < barCnt; ++i) {
				var pos = waveBuf[i] + Math.round(
						pieceMaxDelta * (Math.random() - 0.5));
				if (pos < 0 || Math.random() > 0.9) pos = 0;
				else if (pos > pieceCnt) pos = pieceCnt;
				buf.push(pos);
			}
		}
		waveBuf = buf;
	}

	// update top piece
	for (var i = 0; i < barCnt; ++i) {
		var pos = totalHeight - (pieceGap + pieceHeight) * Math.floor(waveBuf[i]) - pieceGap / 2;
		//if (pos < topBuf[i]) {
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

