$(document).ready(function() {

	$('#generator').click(function(e){
		e.preventDefault();
		
		var filePath = $('#inputFile').val();
		if(!filePath)
			filePath = '%~1';
		
		var startTime = $('#startTime').val().trim();
		var endTime = $('#endTime').val().trim();
		var duration = $('#duration').val().trim();
		if(endTime && (startTime > endTime))
			return alert('Please enter start and end times in the correct order.');
			
		var width = $('#width').val().trim();
		var height = $('#height').val().trim();
		
		var targetSize = $('#targetSize').val().trim();
		var targetBitrate = $('#targetBitrate').val().trim();
		if(targetSize && (!endTime && !duration))
			return alert('Please enter an end time or duration in order to set a target file size.');
		
		var sound = $('#sound');
		var subtitles = $('#subtitles').val();
		var cbr = $('#cbr');
		
		var size = '';
		if(width && height)
			size = width+':'+height;
		else if(!width && height)
			size = '-1:'+height;
		else if(!height && width)
			size = width+':-1';
			
		var pass1 = generatePass(1,filePath,startTime,endTime,duration,size,sound,subtitles,targetSize,targetBitrate,cbr);
		var pass2 = generatePass(2,filePath,startTime,endTime,duration,size,sound,subtitles,targetSize,targetBitrate,cbr);

		var fileString = '@ECHO OFF\r\n\r\n';
		if(subtitles == 'ass') fileString += passString + '-c:s:0.2 copy "tempsub.ass"\r\n\r\n';

		fileString += pass1 + '\r\n\r\n' + pass2 + '\r\n\r\ndel null';
		if(subtitles == 'ass') fileString += '\r\ndel "tempsub.ass"';
		fileString += '\r\n\r\npause';
		
		//alert(fileString);
		download(fileString, "encode.bat", "text/plain");
	});
});

function generatePass(pass,filePath,startTime,endTime,duration,size,sound,subtitles,targetSize,targetBitrate,cbr)
{
	var passString = 'ffmpeg -i "' + filePath + '" ';
	if(startTime) passString += '-ss ' + startTime + ' ';
	if(endTime) passString += '-to ' + endTime + ' ';
	else if(duration) passString += '-t ' + duration + ' ';

	passString += '-c:v libvpx -quality good ';

	if(targetSize || targetBitrate)
	{
		if(endTime) duration = (Date.parse('01/01/2000 ' + endTime.substring(0,endTime.indexOf('.'))) - Date.parse ('01/01/2000 ' + startTime.substring(0,startTime.indexOf('.')))) / 1000;
		if(targetSize) var targetRate = targetSize * 1024 * 8 / duration;
		else if(targetBitrate) var targetRate = targetBitrate * 1024 * 8;
		if(cbr.is(':checked')) passString += '-minrate ' + targetRate + ' -maxrate ' + targetRate + ' ';
		passString += '-b:v ' + targetRate + ' ';
	}

	passString += '-cpu-used 0 ';

	if(pass == 1)
		if(size) passString += '-vf scale=' + size + ' ';
	
	if(pass == 2)
	{
		if(size || subtitles != 'none') passString += '-vf ';
		if(size) passString += 'scale=' + size;
		if(size && subtitles != 'none') passString += ',';
		if(subtitles == 'srt') passString += 'subtitles="' + filePath.replace(/\[/g,'\\[').replace(/\]/g,'\\]') + '" ';
		else if(subtitles == 'ass') passString += 'ass="tempsub.ass" ';
	}

	if(sound.is(':checked')) passString += '-c:a libvorbis ';
	else passString += '-an ';
	passString += '-pass ' + pass + ' -f webm ';
	if(pass == 1) passString += 'null';
	if(pass == 2) passString += '"' + filePath + '.webm"';
	
	return passString;
}

function download(strData, strFileName, strMimeType) {
    var D = document,
        A = arguments,
        a = D.createElement("a"),
        d = A[0],
        n = A[1],
        t = A[2] || "text/plain";

    //build download link:
    a.href = "data:" + strMimeType + "charset=utf-8," + escape(strData);


    if (window.MSBlobBuilder) { // IE10
        var bb = new MSBlobBuilder();
        bb.append(strData);
        return navigator.msSaveBlob(bb, strFileName);
    } /* end if(window.MSBlobBuilder) */



    if ('download' in a) { //FF20, CH19
        a.setAttribute("download", n);
        a.innerHTML = "downloading...";
        D.body.appendChild(a);
        setTimeout(function() {
            var e = D.createEvent("MouseEvents");
            e.initMouseEvent("click", true, false, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
            a.dispatchEvent(e);
            D.body.removeChild(a);
        }, 66);
        return true;
    }; /* end if('download' in a) */



    //do iframe dataURL download: (older W3)
    var f = D.createElement("iframe");
    D.body.appendChild(f);
    f.src = "data:" + (A[2] ? A[2] : "application/octet-stream") + (window.btoa ? ";base64" : "") + "," + (window.btoa ? window.btoa : escape)(strData);
    setTimeout(function() {
        D.body.removeChild(f);
    }, 333);
    return true;
}
