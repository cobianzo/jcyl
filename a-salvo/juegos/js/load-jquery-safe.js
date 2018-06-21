// load jquery only if it was not previously loaded

// Only do anything if jQuery isn't defined
if (typeof jQuery == 'undefined') {

	if (typeof $ == 'function') {
		// warning, global var
		thisPageUsingOtherJSLibrary = true;
	}
	
	function getScript(url, success) {
	
		var script     = document.createElement('script');
		     script.src = url;
		
		var head = document.getElementsByTagName('head')[0],
		done = false;
		
		// Attach handlers for all browsers
		script.onload = script.onreadystatechange = function() {
		
			if (!done && (!this.readyState || this.readyState == 'loaded' || this.readyState == 'complete')) {
			
			done = true;
				
				// callback function provided as param
				success();
				
				script.onload = script.onreadystatechange = null;
				head.removeChild(script);
				
			};
		
		};
		
		head.appendChild(script);
	
	};
	
	getScript('https://ajax.googleapis.com/ajax/libs/jquery/3.3.1/jquery.min.js', function() {
	
		if (typeof jQuery=='undefined') {
		
			// Super failsafe - still somehow failed...
		
		} else {
		

			// jQuery loaded! Make sure to use .noConflict just in case
			// fancyCode();
			console.log('jquery loaded with load-jquery-safe because it was not loaded before');
			
			/*if (thisPageUsingOtherJSLibrary) {

				// Run your jQuery Code

			} else {

				// Use .noConflict(), then run your jQuery Code

			}*/
		
		}
	
	});
	
} else { // jQuery was already loaded
	
	// Run your jQuery Code

};