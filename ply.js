//////////////////////////////
/////////// ply.js ///////////
//////////////////////////////
// This is a jQuery library //
//////////////////////////////

// When using the library, please be careful about stopPropagation(). It can prevent things from functioning. 
// Be aware that whenever any element in the DOM has a event handler which returns false or calls stopPropagation(), this library's default behavior 
// will cease to function for those elements. 

var PLY = (function($){
	// contains all "global" state of the library. 
	var data_model = {
		keys_depressed: {}, 
		// the (serialized HTML) debug view of the data-model (i.e., me) 
		dump: function () {
			var str = "<ul>";
			for (var prop in this) {
				str += "<li>";
				str += prop + ": "; 
				str += this[prop].toString();
				str += "</li>";
			}
			str += "</ul>";
		}
	};
	// entry point for code is the document's event handlers. 
	var handlers_for_doc = {
		mousedown: function(evt) {

		},
		mouseup: function(evt) {

		},
		mousemove: function(evt) {

		}
	};
	// for the sake of simplicity i rely on jQuery to correctly bind event handlers
	for (var event_name in handlers_for_doc) {
		$(document).on(event_name, handlers_for_doc[event_name]);
	}
	return data_model;
})(jQuery);