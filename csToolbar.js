console.log('csToolbar.js load');



// ==== Receive message from Page =================================================================
document.addEventListener('EventPolicyTurkContent', function (e) {

	var request = new Object();
	request.eventname = e.target.getAttribute('eventname');
	request.data = e.target.getAttribute('data');
	
	if( request.data != undefined ) {
		request.data = JSON.parse(request.data);
	}
	
	console.log('HEARD in CONTENTSCRIPT GOING UP: '); console.log(request);
		
	// === Forward message to Background ===	
	chrome.extension.sendMessage(request, function (data) {
	
		console.log('HEARD in CONTENTSCRIPT GOING DOWN: ' + request.eventname); console.log(data);
		
		_msgPage({ "data": JSON.stringify(data) });
	
	});
	
});


// ==== Receive message from Background ===========================================================
chrome.extension.onMessage.addListener( function(request, sender, sendResponse) {

		console.log('HEARD in CONTENTSCRIPT TOOLBAR from BACKGROUND'); console.log(request);		
		
		switch(request.eventname)
		{			
			case 'clearAllSelections':
		}
		
});



//==================== UTILITY ====================================================================
function _msgPage(attrs) { //sends message to page
	var element = document.createElement("PrivacyScoreDataElement");
	document.documentElement.appendChild(element);
	for (var attr in attrs) {
		element.setAttribute(attr, attrs[attr]);
	}
	var evt = document.createEvent("Events");
	evt.initEvent("EventPolicyTurkPage", true, false);
	element.dispatchEvent(evt);
	element.parentNode.removeChild(element)
}
