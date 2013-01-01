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

    var PLY_DEBUG = true; 
    // sigh... Android browser touch events are super difficult to deal with 

    // this came from mustache.js
    var entityMap = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': '&quot;',
        "'": '&#39;',
        "/": '&#x2F;'
    };

    function escapeHtml(string) {
        return String(string).replace(/[&<>"'\/]/g, function (s) {
            return entityMap[s];
        });
    }

    var AssertException, assert; 
    
    if (PLY_DEBUG) {    
        AssertException = function(message) { this.message = message; };
        AssertException.prototype.toString = function () {
            return 'AssertException: ' + this.message;
        };

        assert = function (exp, message) {
            if (!exp) {
                throw new AssertException(message);
            }
        };

        var original_console_log = console.log;
        // echo console logs to the debug 
        window.instrumented_log = function () {
            var str = "";
            for (var i=0;i<arguments.length;++i) {
                str += JSON.stringify(arguments[i],function(key,val) {
                    var cn = val.className;
                    var tn = val.tagName;
                    if (tn === "HTML") { cn = ""; } // too much due to Modernizr
                    if (val instanceof HTMLElement) return "DOMElement &lt;"+tn+" c="+cn+" id="+val.id+"&gt;";
                    return val;
                });
                str += ", ";
            }
            str = str.slice(0,-2);
            $("#debug_log").append('<div class="log">'+escapeHtml(str)+'</div>');
            original_console_log.apply(console, arguments);
        };
        console.log = instrumented_log;
    }

    function each(obj, f) {
        for (var i in obj) {
            f(i, obj[i]);
        }
    }

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
        pointer_state: {}
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
            exposed.pointer_state.m = {x:evt.pageX, y:evt.pageY, e: evt.target};
        },
        mouseup: function(evt) {
            // this event may fail to fire by dragging mouse out of
            // window. This is less of a concern for touch since most touch
            // devices do not use window systems. 
            delete exposed.pointer_state.m;
            instrumented_log('mouseup');
        },
        mousemove: function(evt) {
            var epm = exposed.pointer_state.m;
            if (epm) {
                epm.x = evt.pageX; epm.y = evt.pageY;
            }
        }, 
        keydown: function(evt) {
            console.log("keydown");
            exposed.keys_depressed[key(evt)] = String.fromCharCode(key(evt));
        },
        keyup: function(evt) {
            delete exposed.keys_depressed[key(evt)];
        },
        touchstart: function(evt) {
            //console.log("touchstart");
            for (var i=0;i<evt.changedTouches.length;++i) {
                var eci = evt.changedTouches[i];
                //console.log(eci);
                exposed.pointer_state[eci.identifier] = 
                    {x: eci.pageX, y: eci.pageY, e: evt.target};
            }
        },
        touchend: function(evt) {
            var ids_touches_hash = {};
            for (var i=0;i<evt.touches.length;++i) {
                var eti = evt.touches[i];
                ids_touches_hash[eti.identifier] = true;
            }
            //console.log("touchend", $.extend({},ids_touches_hash));
            for (var id in exposed.pointer_state) {
                if (!ids_touches_hash[id]) {
                    delete exposed.pointer_state[id];
                }
            }
        },
        touchmove: function(evt) {
            var ec = evt.changedTouches;
            var ecl = ec.length;
            for (var i=0; i<ecl; ++i) {
                var eci = ec[i];
                var ep_ecid = exposed.pointer_state[eci.identifier];
                ep_ecid.x = eci.pageX;
                ep_ecid.y = eci.pageY;
            }
        },
        touchcancel: function(evt) {
            console.log("touchcancel");
        }
    };

    // use each because we need a scoped loop
    each(handlers_for_doc, function (event_name,v) {
        document.addEventListener(event_name, function () {
            try {
                v.apply(this, arguments);
            } catch (e) {
                $("#debug_log").append($('<div class="error">').text(e.toString()+": "+e.stack));
            }
        }, true);
        //$(document).on(event_n, handlers_for_doc[event_n]);
    });
    return exposed;
})(jQuery);