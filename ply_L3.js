////////////////////////////////////////////
//////////////// ply_L3.js /////////////////
////////////////////////////////////////////
////  Tertiary event generation stage   ////
//// For use in conjunction with ply.js ////
////////////////////////////////////////////
//// Level 3 focuses on global gestures ////
////////////////////////////////////////////

// ============================================================================
// Copyright (c) 2013 Steven Lu 

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

/*global PLY:false Modernizr:false DEBUG:false */
(function(){
    "use strict";
    var assert = DEBUG.assert || function(assertion,message){if (!assertion) console.log("ASSERTION FAILED: "+message);};

    // Independently define multiple standard listeners rather than conjoin them all at the hip. 
    // Enables separation of concerns, very powerful.
    var level_3_events = { 
        // this implements a no-delay button operation, including setting convenient state classes 
        ply_onestart: function() {

        },
        ply_twostart: function() { // when the second finger is put down on the same item, the click will not be issued. 

        },
        ply_oneend: function() {


            // following is taken from ply.js: must adapt... 
            
                        // now this is super neat. I don't know if preventDefault on touchend will change
                        // the behavior (for firing or not firing click), but with ply it will be possible
                        // to prevent the click by preventDefault on oneend! How nice is that? 
                        if (defaultNotPrevented && ed.count === 1 && exposed.click_possible) {
                            // the naive $.click() generally fails on anchor elements because 
                            // probably for preventing script kiddie nastiness. 

                            // So, I fire a click event created using the DOM API and attempt to 
                            // fill it up with what data is available in the original touchstart. 
                            var clickevent = document.createEvent("MouseEvents");
                            // Not sure if touch can provide a screenX/Y
                            clickevent.initMouseEvent("click", true, true, window, 1, 
                                ei.t.screenX, ei.t.screenY, ei.t.clientX, ei.t.clientY, 
                                false, false, false, false, 0, null);
                            var click_not_prevented = ei.e.dispatchEvent(clickevent);
                        }
        },
        ply_transform: function() {
            // todo: also gotta adapt this. 

                    // if at any point a single touch has moved too far, prevent it from ever firing 
                    // the click event 
                    if (exposed.click_possible && (Math.abs(event.deltaX)+Math.abs(event.deltaY)) > 10) {
                        exposed.click_possible = false;
                    }

        }
    };

    PLY.attach_handlers_on_document(level_3_events);
})();