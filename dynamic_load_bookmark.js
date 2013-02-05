(function(){
	// serial script loading 
	var jq=document.body.appendChild(document.createElement('script'));
	jq.src='http://code.jquery.com/jquery-1.8.3.min.js';
	jq.onload=function(){
		var ply=document.body.appendChild(document.createElement('script'));
		ply.src='http://unphased.github.com/ply/ply.js';
		ply.onload=function(){
			var dbg=document.body.appendChild(document.createElement('script'));
			ply.src='http://unphased.github.com/ply/debug.js';
			ply.onload=function(){
				// some basic UI to allow selection of features via my debug lib
				// In order to preserve regular site functionality as much as possible, 
				// a double-tap custom gesture is required to start selection mode. 
				
			}
		};
	};
})();