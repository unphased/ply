(function(){
	// serial script loading 
	function load(url,cb){var x=document.body.appendChild(document.createElement('script'));x.src=url;if (cb){x.onload=cb;}}
	load('http://code.jquery.com/jquery-1.8.3.min.js',function(){
		load('http://unphased.github.com/ply/ply.js',function(){
			load('http://unphased.github.com/ply/2ply.js');
			load('http://unphased.github.com/ply/debug.js',function(){
				// some basic UI to allow selection of features via my debug lib
				// In order to preserve regular site functionality as much as possible, 
				// a double-tap custom gesture is required to start selection mode. 
				
				PLY.attach_handlers_on_document({
					touchstart: function() {},
					touchmove: function() {},
					touchend: function() {}
				});
			});
		});
	});
})();