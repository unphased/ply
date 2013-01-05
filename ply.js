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
        pointer_state: {}, 

        // allow_scroll is a global flag that (basically) triggers calling 
        // preventDefault on touch events. This is more or less geared toward 
        // Android because iOS already prevents scroll from triggering on 
        // subsequent touches if the initial touch's touchstart has default
        // prevented (iOS's behavior is still inconsistent with touchstart pD'd
        // on the second or later finger that goes down (messes up the scroll, 
        // actually))
        allow_scroll: true,

        debug: true
    };

    var AssertException, assert; 
    
    AssertException = function(message) { this.message = message; };
    AssertException.prototype.toString = function () {
        return 'AssertException: ' + this.message;
    };

    assert = function (exp, message) {
        if (!exp) {
            throw new AssertException(message);
        }
    };

    // this HTML escapist came from mustache.js
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

    var original_console_log = console.log;
    // echo console logs to the debug 
    window.instrumented_log = function () {
        original_console_log.apply(console, arguments);
        if (!exposed.debug) return;
        var str = "";
        var json_handler = function(key,val) {
                if (val instanceof HTMLElement) {
                    var cn = val.className;
                    var tn = val.tagName;
                    if (tn === "HTML") { cn = ""; } // too much due to Modernizr
                    return "DOMElement<"+tn+" c="+cn+" id="+val.id+">";
                }
                return val;
            };
        for (var i=0;i<arguments.length;++i) {
            str += JSON.stringify(arguments[i],json_handler);
            str += ", ";
        }
        str = str.slice(0,-2);
        $("#debug_log").prepend('<div class="log" data-time="'+Date.now()+'">'+escapeHtml(str)+'</div>');            
    };
    console.log = instrumented_log; 
    // this means all logs in your application get dumped into #debug_log if 
    // you've got one

    function each(obj, f) {
        for (var i in obj) {
            f(i, obj[i]);
        }
    }

    

    var class_set = {
        'ply-translate': function() {

        }
    };

    // a neat little exercise in recursive programming
    $.fn.addClassToChildren = function (class_name) {
        var c = this.children();
        if (c.length)
            c.addClass(class_name).addClassToChildren(class_name);
    };

    // propagate "umbrella" style classes through to their children, now and in
    // the future. 
    $(function(){
        // consolidate event handler behavior of marked elements by setting 
        // ply-noscroll on all of them
        for (var classname in class_set) {
            $("."+classname).addClass("ply-noscroll");
        }
        // propagate the noscroll class to all children and apply it to all 
        // future children 
        $(".ply-noscroll").on("DOMNodeInserted",function(evt){
                $(evt.target).addClass("ply-noscroll");
            }).addClassToChildren("ply-noscroll");
    });

    function key(evt) {
        return evt.which || evt.keyCode || /*window.*/event.keyCode;
    }

    // entry point for code is the document's event handlers. 
    var handlers_for_doc = {
        click: function(evt) { console.log('click', evt.pageX, evt.pageY); 

        },
        mousedown: function(evt) { console.log('mousedown',evt.pageX,evt.pageY);
            // need to trap drag-of-selection. Crap. You'll have to prevent 
            // selections entirely. Funny this stuff is quite
            // less problematic for touch events. 

            // trap the right clicks!! this is huge
            if (evt.which === 3) // secondary mouse button causes context menu,
                // context menu prevents mouseup. ply by default ignores
                // the secondary mouse button interaction
                return;
            exposed.pointer_state.m = {xs:evt.pageX, ys:evt.pageY, 
                xc: evt.pageX, yc: evt.pageY, es: evt.target, ec: evt.target};
        },
        mouseup: function(evt) { console.log('mouseup',evt.pageX,evt.pageY);
            // this event may fail to fire by dragging mouse out of
            // window. This is less of a concern for touch since most touch
            // devices do not use window systems. 
            delete exposed.pointer_state.m;
        },
        mousemove: function(evt) { 
            var epm = exposed.pointer_state.m;
            if (epm) {
                epm.xc = evt.pageX; epm.yc = evt.pageY;
                epm.ec = evt.target;
            }
        }, 
        mouseover: function(evt) { //console.log("mouseover", evt.target);

        },
        mouseout: function (evt) { //console.log("mouseout", evt.target);

        },
        mousewheel: function (evt) { console.log("mousewheel", evt.wheelDeltaX, evt.wheelDeltaY); 
            if (evt.target.tagName === "HTML") return; // don't waste cycles 
            // scanning Modernizr's class list on <html>
            var et = evt.target;
            // check for safari "bug"
            if (evt.target.nodeType === 3) /* is text node */ 
                et = evt.target.parentNode;
            if (et.className && et.className.indexOf("ply-noscroll") !== -1) 
                evt.preventDefault();
        },
        keydown: function(evt) { console.log("keydown",key(evt));
            exposed.keys_depressed[key(evt)] = String.fromCharCode(key(evt));
        },
        keyup: function(evt) { console.log("keyup",key(evt));
            delete exposed.keys_depressed[key(evt)];
        },
        touchstart: function(evt) { //console.log("touchstart", evt.touches);
            // if allow scroll, then never prevent default: once you're
            // scrolling, touching anything else should never mess with the 
            // browser default scrolling. 
            // On touch devices the touchstart is the critical event that keys 
            // off a complex interaction, so it will be the place that 
            // allow_scroll is directly assigned (when it is the first touch,
            // of course).
            var seen_target;
            for (var i=0;i<evt.changedTouches.length;++i) {
                var eci = evt.changedTouches[i];
                
                if (seen_target) assert(eci.target === seen_target);
                else seen_target = eci.target;
                exposed.pointer_state[eci.identifier] = {xs: eci.pageX, 
                    ys: eci.pageY, xc: eci.pageX, yc: eci.pageY, es: evt.target, ec: evt.target};
            }
            if (exposed.allow_scroll && ((' '+seen_target.className+' ').indexOf(" ply-noscroll ") !== -1)) {
                exposed.allow_scroll = false;
            }
            if (!exposed.allow_scroll) 
                evt.preventDefault();
        },
        touchend: function(evt) { //console.log("touchend", evt.changedTouches);
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
            if (evt.touches.length === 0) { // this indicates no touches remain
                exposed.allow_scroll = true;
            }
        },
        touchmove: function(evt) { //console.log("touchmove",evt);
            if (!exposed.allow_scroll) evt.preventDefault(); 
            var ec = evt.changedTouches;
            var ecl = ec.length;
            for (var i=0; i<ecl; ++i) {
                var eci = ec[i];
                var ep_ecid = exposed.pointer_state[eci.identifier];
                if (ep_ecid) {
                    ep_ecid.xc = eci.pageX;
                    ep_ecid.yc = eci.pageY;
                    ep_ecid.ec = eci.target;
                    if (eci.webkitForce) { // curious bit of extra data on
                        // Android (why does iOS not provide this kind of thing?)
                        ep_ecid.fatness = eci.webkitForce;
                    }
                }
            }
        },
        touchcancel: function(evt) { console.log("touchcancel", evt.changedTouches, evt.touches);
            for (var i=0;i<evt.changedTouches.length; ++i) {
                delete exposed.pointer_state[evt.changedTouches[i].identifier];
            }
            if (evt.touches.length === 0) { // this indicates no touches remain
                // should be safe to return to default allow_scroll mode
                exposed.allow_scroll = true;
            }
        }
    };

    // use each because we need a scoped loop
    each(handlers_for_doc, function (event_name,v) {
        document.addEventListener(event_name, function () {
            try {
                v.apply(this, arguments);
            } catch (e) {
                $("#debug_log").prepend($('<div class="error">').text(e.toString()+": "+e.stack));
            }
        }, true);
        //$(document).on(event_n, handlers_for_doc[event_n]);
    });
    return exposed;
})(jQuery);