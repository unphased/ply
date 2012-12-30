//////////////////////////////
/////////// ply.js ///////////
//////////////////////////////
// This is a jQuery library //
//////////////////////////////

// When using the library, please be careful about stopPropagation(). It can prevent things from functioning. 
// Be aware that whenever any element in the DOM has a event handler which returns false or calls stopPropagation(), this library's default behavior 
// will cease to function for those elements. 

// ===================================================================================================================================================
// Copyright (c) 2012 Steven Lu 

// Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), 
// to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense,
// and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions: 

// The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software. 

// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER 
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS 
// IN THE SOFTWARE. 
// ===================================================================================================================================================

var PLY = (function($) {
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