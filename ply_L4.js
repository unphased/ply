////////////////////////////////////////////
///////////////// ply_L4.js ////////////////
////////////////////////////////////////////
////  Quaternary event generation stage  ///
///  For use in conjunction with ply.js ////
////////////////////////////////////////////
///////// Level 4: Mouse + Keyboard ////////
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

// Usage note: This file depends on ply.js.

/*global PLY:false Modernizr:false DEBUG:false */
(function(){
    "use strict";

    var exposed = {
        key_state: {}
    };

    function key(evt) {
        return evt.which || evt.keyCode || /*window.*/event.keyCode;
    }

    var level_4_events = {
        click: function (evt) { console.log('click', evt.pageX, evt.pageY, "on", evt.target);

        },
        mousedown: function (evt) { //console.log('mousedown',evt.pageX,evt.pageY);
            // need to trap drag-of-selection. Crap. You'll have to prevent
            // selections entirely. Funny this stuff is quite
            // less problematic for touch events.

            // trap the right clicks!! this is huge
            if (evt.which === 3) // secondary mouse button causes context menu,
                // context menu prevents mouseup. ply does not respond to
                // the secondary mouse button interaction
                return;
            PLY.pointer_state.m = {xs:evt.pageX, ys:evt.pageY,
                xc: evt.pageX, yc: evt.pageY, es: evt.target, ec: evt.target};
        },
        mouseup: function (evt) { //console.log('mouseup',evt.pageX,evt.pageY);
            // this event may fail to fire by dragging mouse out of
            // window. This is less of a concern for touch since most touch
            // devices do not use window systems.
            delete PLY.pointer_state.m;
        },
        mousemove: function (evt) {
            var epm = PLY.pointer_state.m;
            if (epm) {
                epm.xc = evt.pageX; epm.yc = evt.pageY;
                epm.ec = evt.target;
            }
        },
        mousewheel: function (evt) { console.log("mousewheel", evt.wheelDeltaX, evt.wheelDeltaY);
            if (evt.target.tagName === "HTML") return; // don't waste cycles scanning Modernizr's class list on <html>
            var et = evt.target;
            // check for safari "bug"
            if (evt.target.nodeType === 3) /* is text node */
                et = evt.target.parentNode;
            if (et.className && (' '+et.className+' ').indexOf(" ply-noscroll ") !== -1)
                evt.preventDefault();
        },
        keydown: function (evt) { console.log("keydown",key(evt));
            exposed.key_state[key(evt)] = String.fromCharCode(key(evt));
        },
        keyup: function (evt) { console.log("keyup",key(evt));
            delete exposed.key_state[key(evt)];
        }
    };

    PLY.attach_handlers_on_document(level_4_events);

    return exposed;
})();