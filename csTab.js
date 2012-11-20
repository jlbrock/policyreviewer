console.log('csTab.js load');

var selector = 'body p, body div, body ul, body td, body h1, body h2, body h3, body h4, body h5, body h6';
$(document).ready(function(){

	chrome.extension.sendMessage({ eventname: 'newPolicy', data : {}});

	// === paragraph hightlighting ===
	$(selector).click(function(e){
	
		if ($("#policyTurkToolbar").length != 0) {
		
			e.stopPropagation();

			console.log('HIGHTLIGHT LENGTH: ' + $(this).text().length );
			
			if( $(this).text().length < 3000 ) { //lenght limit prevents most outer wrapper clicks that grab the whole page.
				if( $(this).hasClass('policyTurkSelected') ){		
					$(this).css('background-color', '');
					$(this).removeClass('policyTurkSelected');
				} else {
					$(this).css('background-color', 'yellow');		
					$(this).addClass('policyTurkSelected');
				}
				
				console.log($('.policyTurkSelected'));
				
				var data = new Object();
				$('.policyTurkSelected').each(function(index) {
					console.log(index + ': ' + $(this).text());	
					data[index] = $(this).text();
				});
				
				chrome.extension.sendMessage({ eventname: 'keepTextSelections', data : data});
			}
						
		}
	
	});

});

function clearallselection(){

	$(".policyTurkSelected").each(function(index){
	
		$(this).css('background-color', '');
		$(this).removeClass('policyTurkSelected');
		
	});

}

// ==== Receive message from Background ========================================================
chrome.extension.onMessage.addListener( function(request, sender, sendResponse) {

		console.log('HEARD in CONTENTSCRIPT TAB from BACKGROUND'); console.log(request);
		
		switch(request.eventname)
		{	
			case 'getwindowlocation':
				
				sendResponse({hostname: window.location.hostname, url: window.location.href});
				
				break;
				
			case 'highlight':
			
				//highlight key words
				$('body').removeHighlight();				
				for(var i in request.words){
					$('body').highlight(request.words[i]);
				}
				
				//highligh paragraphs
				$.each(request.data, function(k, v) {
					console.log('HIGHTLIGHT');
					
					$(selector).each(function(index, element){					
						if( $(this).text() == v ){						
							$(this).css('background-color', 'yellow');
							$(this).addClass('policyTurkSelected');
						}									
					});
				
                });
				
				break;
				
			case 'clearAllSelections':
			
				clearallselection();				
				break;
				
			case 'showHints':
			
				$('#policyTurkToolbarIframe').css('height', request.data.height);
				sendResponse({eventname:'showHints'});
				break;
				
			case 'hideHints':
			
				$('#policyTurkToolbarIframe').css('height', request.data.height);
				sendResponse({eventname:'hideHints'});
				break;
			
			case 'opentool':
			
				$('head').append('<style> .highlight{background-color:#FFD800; color:navy;} </style>');							

				var url = request.appserver + '/policyturk';
								
				if ($("#policyTurkToolbar").length != 0) {
					$("#policyTurkToolbar").remove();
					$('body').css('cursor', '');
					$('html').css('margin-top', '');
					return;
				} else {
					$('body').css('cursor', 'pointer');
					$('html').css('margin-top', '200px');
					$('<div id="policyTurkToolbar" \
					style=" \
					width:100%; \
					position:fixed; \
					top:0px; \
					right:0px; \
					border-bottom:solid black 1px; \
					z-index: 2147483647; \
					background-color: #eee;\
					overflow: hidden;" > \
					<iframe id="policyTurkToolbarIframe" \
					src="' + url + '" \
					width="100%" \
					frameBorder="0" \
					style="background-color: transparent; border-bottom:solid red 1px; height:200px;" scrolling="no"> \
					</iframe> \
					</div>').
					click(function(e) {
						e.stopPropagation();
					}).appendTo(document.body);										
				}	

				
				break;
		}
		//sendResponse({farewell: "goodbye"});
});
