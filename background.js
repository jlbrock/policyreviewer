
//var appserver = 'http://localhost:88';
var appserver = 'https://privacyfix.com';
//var appserver = 'http://dev.privacyfix.com';

var policy = new Object();
var currentSection = '';
var autopop = false;


function setLSO(name, value) { //string name in, js object in
	var obj = JSON.parse(localStorage["lso"]);
	obj[name] = value;
	localStorage["lso"] = JSON.stringify(obj);
}
function setEntireLSO(lso) { //js object in
	localStorage["lso"] = JSON.stringify(lso);
}
function fetchLSO() { //js object out
	var obj = JSON.parse(localStorage["lso"]);
	return obj;
}

//=== init lso ===================================
if( localStorage["lso"] == undefined ){
	setEntireLSO({});
}
var lso = fetchLSO();
if( lso.useremail == undefined ) {
	lso.useremail = '';
}
if( lso.installcode == undefined ) {
	lso.installcode = createUUID();
}
setEntireLSO(lso);
//=== init lso done ==============================



$(document).ready( function() {

	console.log('Background ready');
	policy = new Object();
	

	//============  RECEIVE MESSAGE FROM CONTENT SCRIPTS ==============================
	chrome.extension.onMessage.addListener(  function(request, sender, sendResponse) {
	
		console.log('HEARD in BACKGROUND: '); console.log(request);
		
	
		switch(request.eventname)
		{	
			case 'test':
				sendResponse(request.data);
				break;
				
			case 'getLSO':
			
				sendResponse(fetchLSO());
				break;
				
			case 'setLSO':
			
				setEntireLSO(request.lso);
				sendResponse(fetchLSO());
				break;
				
			case 'showHints':
			
				callActiveTab(request, function(response){ } );				
				sendResponse({eventname: "showHints"});
				break;
				
			case 'hideHints':
			
				callActiveTab(request, function(response){ });				
				sendResponse({eventname: "hideHints"});
				break;
				
			case 'getVersion':
			
				sendResponse({version: manifest.version});
				break;						
			
			case 'getuseremail':
			
				var lso = fetchLSO();
				sendResponse({'useremail': lso.useremail});
				break;
				
			case 'clearAllSelections':
			
				callActiveTab({eventname: "clearAllSelections"}, function(response){} );				
				break;
			
			case 'newPolicy':
							
				policy = new Object();
				currentSection = '';
				if(autopop){
					var tabId = autopop;
					autopop = false;
					openToolBar(tabId);
				}
				break;
				
			case 'selectSection': //from csToolbar
				
				currentSection = request.data.sectionName;
				if( policy[currentSection] == undefined ){
					policy[currentSection] = new Object();
					policy[currentSection].policytext = new Object();						
				}	

				var keywords = {
					sharing: [ 'PII', 'personally identifiable', 'personal information','personal data','identify', 'identified', 'identifiable', 'identifying','name', 'email',  'phone', 'telephone', 'address', 'share', 'sharing', 'shared','marketing','purpose','purposes']				
					,deletion: [ 'account','delete','deleted','suspend','suspended','remove','removed','erase','erased', 'terminate','termination','close','closed','day','days','month','months','retain','retained','keep']
					,disclosure: [ 'subpoena','subpoenas','court','order','government','legal','legal process','law enforcement','legal claims','defend' ]
					,vendors: [ 'vendor','vendors','third party','third-party','third parties','third-parties','another company','other companies','confidentiality','restrict','restricted' ]
				};
				console.log(keywords);
				var words = keywords[currentSection];
				console.log(words);
				callActiveTab({eventname: "highlight", data: policy[currentSection].policytext, words: words }); //to csTab
				break;
			
			case 'keepTextSelections' :
			
				if(currentSection != ''){									
					policy[currentSection].policytext = request.data;
				}
				console.log('policy object:');
				console.log(policy);
				break;
			
			case 'nextPolicy' :
			
				setLSO('useremail', request.data.useremail);
				chrome.tabs.getSelected(null, function(tab) { 
					goNextPolicy(tab.id, request.data.useremail);
				});
				break;
				
			case 'saveTurk':
			
				setLSO('useremail', request.data.useremail);				
				var data = new Object();
								
				chrome.tabs.getSelected(null, function(tab) { 
					callSpecificTab(tab.id, {eventname: "getwindowlocation"}, function(response){				
							
							data.domain = response.hostname;
							data.url = response.url;		
							data.useremail = fetchLSO().useremail;	
							data.installcode = fetchLSO().installcode;						
							data.policy = policy;
							
							for( var n in request.data ){
							
								for( var p in data.policy ){
								
									if( n == p ){
										data.policy[p].choice = request.data[n];
									}
								
								}
							
							}
							
							console.log(data);
							
							$.ajax({
								type: "POST",
								url: appserver + '/policyturk/saveturk',
								async: false,
								data: {jsondata: JSON.stringify(data)}
							}).done(function () {
														
								goNextPolicy(tab.id, data.useremail);
								
							});
					});
				});
				break;
		}
		
			
	});
	
	
	
	
	// ====== ON TOOLBAR ICON CLICK LISTENER ======================
	chrome.browserAction.onClicked.addListener(function(tab) {
		openToolBar(tab.id);
	});

});

function openToolBar(tabId){
	callSpecificTab(tabId, {eventname: "opentool", appserver: appserver}, function(response){} );
}

function goNextPolicy(tabId, useremail){

	autopop = tabId;
	
	$.ajax({
		type: "GET",
		url: appserver + '/policyturk/next',
		async: false,
		data: {username: useremail}
	}).done(function (data) {
	
		console.log('NEXT LOCATION: ' + data);
		
		chrome.tabs.getSelected(null, function(tab) {
		
			chrome.tabs.update(tab.id,{url: data});
		
		});
		
	});

}

function callSpecificTab(tabId, request, callback){
	chrome.tabs.sendMessage(tabId, request, callback);
}

function callActiveTab(request, callback){
	chrome.tabs.getSelected(null, function(tab) { 
	  chrome.tabs.sendMessage(tab.id, request, callback);
	});			
}

	


// ================ UTILITY ===========================================
manifest = (function() { //easy access to manifest settings
    var manifestObject = false;
    var xhr = new XMLHttpRequest();

    xhr.onreadystatechange = function() {
        if (xhr.readyState == 4) {
            manifestObject = JSON.parse(xhr.responseText);
        }
    };
    xhr.open("GET", chrome.extension.getURL('/manifest.json'), false);

    try {
        xhr.send();
    } catch(e) {
        console.log('Couldn\'t load manifest.json');
    }

    return manifestObject;

})();


function createUUID() {
    // http://www.ietf.org/rfc/rfc4122.txt
    var s = [];
    var hexDigits = "0123456789abcdef";
    for (var i = 0; i < 36; i++) {
        s[i] = hexDigits.substr(Math.floor(Math.random() * 0x10), 1);
    }
    s[14] = "4";  // bits 12-15 of the time_hi_and_version field to 0010
    s[19] = hexDigits.substr((s[19] & 0x3) | 0x8, 1);  // bits 6-7 of the clock_seq_hi_and_reserved to 01
    s[8] = s[13] = s[18] = s[23] = "-";

    var uuid = s.join("");
    return uuid;
}
