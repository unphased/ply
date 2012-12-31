//////////////////////////////
/////////// ply.js ///////////
//////////////////////////////
// This is a jQuery library //
//////////////////////////////

// ============================================================================
// Copyright (c) 2012 Steven Lu 

// Permission is hereby granted, free of charge, to any person obtaining a 
// copy of this software and associated documentation files (the "Software"), 
// to deal in the Software without restriction, including without limitation 
// the rights to use, copy, modify, merge, publish, distribute, sublicense,
// and/or sell copies of the Software, and to permit persons to whom the 
// Software is furnished to do so, subject to the following conditions: 

// The above copyright notice and this permission notice shall be included in 
// all copies or substantial portions of the Software. 

// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR 
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE 
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER 
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING 
// FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS 
// IN THE SOFTWARE. 
// ============================================================================

var PLY = (function($) {

	// all vars except the variable "exposed" are private variables 

	// various parts of state of the library 
	// accessible via window.PLY to allow debug display
	var exposed = {
		// Never assume that keys is not filled with keys that were held down 
		// the last time the browser was in focus.		
		keys_depressed: {}, 

		// The pointer_state array's order is important. It is maintained in
		// the order that touches are created. If you lift a finger it is 
		// removed and the rest of the array's ordering remains. 
		// all mouse-pointer activity is mapped onto the first pointer. This is 
		// not terribly complicated because on a mouse system in all likelihood
		// (barring strange IE10 touch-notebook situations) the mouse will be 
		// the only member of the pointer list. 
		pointer_state: []
	};

	function key(evt) {
		return evt.which || evt.keyCode || /*window.*/event.keyCode;
	}

	// entry point for code is the document's event handlers. 
	var handlers_for_doc = {
		mousedown: function(evt) {
			// need to trap drag-of-selection. Crap. You'll have to prevent 
			// selections entirely. Funny this stuff is quite
			// less problematic for touch events. 

			// trap the right clicks!! this is huge
			if (evt.which === 3) // secondary mouse button causes context menu,
				// context menu prevents mouseup. ply by default ignores
				// the secondary mouse button interaction
				return;
			var x = {ty:"m", x:evt.pageX, y:evt.pageY, e: evt.target};
			exposed.pointer_state.unshift(x); // keep at front
		},
		mouseup: function(evt) {
			// this event may fail to fire by dragging mouse out of
			// window. This is less of a concern for touch since most touch
			// devices do not use window systems. 
			for (var i=0;i<exposed.pointer_state.length;++i) {
				if (exposed.pointer_state[i].ty === "m") {
					exposed.pointer_state.splice(i,1); --i; 
				}
			}
		},
		mousemove: function(evt) {
			var ep0 = exposed.pointer_state[0];
			if (ep0 && ep0.ty === "m") {
				ep0.x = evt.pageX; ep0.y = evt.pageY;
			}
		}, 
		keydown: function(evt) {
			exposed.keys_depressed[key(evt)] = String.fromCharCode(key(evt));
		},
		keyup: function(evt) {
			delete exposed.keys_depressed[key(evt)];
		},
		touchstart: function(evt) {
			//exposed.pointer_state.push(evt.changedTouches);
			//evt.preventDefault();
			for (var i=0;i<evt.changedTouches.length;++i) {
				var eci = evt.changedTouches[i];
				//console.log(eci);
				exposed.pointer_state.push({id: eci.identifier, 
					x: eci.pageX, y: eci.pageY});
			}
		},
		touchend: function(evt) {
			for (var i=0;i<evt.changedTouches.length;++i) {
				var eci = evt.changedTouches[i];
				
			}
		},
		touchmove: function(evt) {

		},
		touchcancel: function(evt) {

		}
	};
	for (var event_name in handlers_for_doc) {
		document.addEventListener(event_name, handlers_for_doc[event_name], true);
		//$(document).on(event_name, handlers_for_doc[event_name]);
	}
	return exposed;
})(jQuery);