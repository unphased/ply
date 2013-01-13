//////////////////////////////
/////////// ply.js ///////////
//////////////////////////////
//// A JavaScript library ////
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

var PLY = (function ($) {
    
    // all vars except the variable "exposed" are private variables 
    var log_buffer = [];

    var git_context = "#% 275915b looking at the ply prop of data %#";

    // various parts of state of the library 
    // accessible via window.PLY to allow debug display
    var exposed = {

        // version string updated with git hash from scripts
        revision: git_context.slice(3,-3),

        // Never assume that keys is not filled with keys that were held down 
        // the last time the browser was in focus.

        keys_depressed: {}, 

        // pointer_state stores state of mouse and/or touches. It will treat 
        // the mouse somewhat differently by storing it into the "m" property,
        // and touches will be in an array called "touch", one for each element
        // that is marked by ply to be a manipulable element, and that will contain
        // a hash of touch id's that control it. 
        pointer_state: {}, 

        // used by touchmove event to run code only when necessary
        tmTime: Date.now(),

        // allow_scroll is a global flag that (basically) triggers calling 
        // preventDefault on touch events. This is more or less geared toward 
        // Android because iOS already prevents scroll from triggering on 
        // subsequent touches if the initial touch's touchstart has default
        // prevented (iOS's behavior is still inconsistent with touchstart pD'd
        // on the second or later finger that goes down (messes up the scroll, 
        // actually))
        allow_scroll: true,

        // This is just marked when any event makes its way through the primary
        // event handlers so that the test site can be a bit more efficient about 
        // re-updating the DOM. I will eventually let the events that don't 
        // change the debugprints to also not set this either. 
        event_processed: true, 
        debug: true,
        append_logs_dom: true
    };


    var AssertException, assert; 
    
    AssertException = function (message) { this.message = message; };
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

    var json_handler = function (key,val) {
        if (val instanceof HTMLElement) {
            var cn = val.className;
            var tn = val.tagName;
            if (tn === "HTML") { cn = ""; } // too much due to Modernizr
            return "<"+tn+" c="+cn+" id="+val.id+">";
        }
        return val;
    };
    function serialize(arg) {
        return JSON.stringify(arg,json_handler);
    }

    var original_console_log = console.log;
    // echo console logs to the debug 
    window.instrumented_log = function () {
        original_console_log.apply(console, arguments);
        if (!exposed.debug) return;
        var str = "";
        for (var i=0;i<arguments.length;++i) {
            str += escapeHtml(serialize(arguments[i])).replace(/\},&quot;/g,'},</br>&quot;').replace(/,&quot;/g,', &quot;');
            str += ", ";
        }
        str = str.slice(0,-2);
        var now = Date.now();
        var html_str = '<div class="log" data-time="'+now+'">'+str+'</div>';
        log_buffer.push(html_str);
        if (!exposed.append_logs_dom) return;
        $("#debug_log").prepend(html_str); 
        // this means all logs in your application get dumped into #debug_log if 
        // you've got one
    };
    console.log = instrumented_log;

    // set up a way to show the log buffer if debug mode 
    // (note toggling the debug off will stop logs being written)
    if (exposed.debug) {
        var show = false;
        $("#log_buffer_dump").before($('<button>toggle full log buffer snapshot</button>').on('click',function(){
            show = !show;
            if (show) {
                $("#log_buffer_dump").html(log_buffer.join(''));
            } else {
                $("#log_buffer_dump").html("");
            }
        }));
    }

    // this is a helper for logging touchlists for debug purposes
    function id_string_for_touch_list(list) {
        var str = "[";
        for (var i=0; i<list.length; ++i) {
            str += list[i].identifier + ", ";
        }
        return str.slice(0,-2)+"]";
    }

    function each(obj, f) {
        for (var i in obj) {
            f(i, obj[i]);
        }
    }

    var noscroll_class_set = {
        'ply-translate': function () {

        }
    };

    // a neat little exercise in recursive programming
    $.fn.addClassToChildren = function (class_name) {
        var c = this.children();
        if (c.length)
            c.addClass(class_name).addClassToChildren(class_name);
    };

    var Mutation_Observer = (window.MutationObserver || window.WebKitMutationObserver || window.MozMutationObserver);
    
    $(function (){
        // propagate "umbrella" style classes through to their children, now and in
        // the future. 
        
        // consolidate event handler behavior of marked elements by setting 
        // ply-noscroll on all of them, but only on touch devices because 
        // the PC allows you to drag just fine while scrolling.
        if (Modernizr.touch) {
            for (var classname in noscroll_class_set) {
                $("."+classname).addClass("ply-noscroll");
            }
        
            // propagate the noscroll class to all children and apply it to all 
            // future children 
            $(".ply-noscroll").on("DOMNodeInserted",function (evt){
                $(evt.target).addClass("ply-noscroll");
            }).addClassToChildren("ply-noscroll");
        }

        // handle ply-collect. 
        // The change that needs to happen here is to simply update the target 
        // of the fired event: While it might make some sense to just attach
        // an event handler to the collect-elements, but that means that during
        // manipulation all those new events are being sent through an 
        // unnecessarily costly event pipeline. 

        $(".ply-collect").on("DOMNodeInserted",function (evt){
            $(evt.target).addClass("ply-cc");
        }).addClassToChildren("ply-cc");
    });

    function key(evt) {
        return evt.which || evt.keyCode || /*window.*/event.keyCode;
    }

    var touchend_touchcancel;

    // entry point for code is the document's event handlers. 
    var handlers_for_doc = {
        click: function (evt) { console.log('click', evt.pageX, evt.pageY); 

        },
        mousedown: function (evt) { console.log('mousedown',evt.pageX,evt.pageY);
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
        mouseup: function (evt) { console.log('mouseup',evt.pageX,evt.pageY);
            // this event may fail to fire by dragging mouse out of
            // window. This is less of a concern for touch since most touch
            // devices do not use window systems. 
            delete exposed.pointer_state.m;
        },
        mousemove: function (evt) { 
            var epm = exposed.pointer_state.m;
            if (epm) {
                epm.xc = evt.pageX; epm.yc = evt.pageY;
                epm.ec = evt.target;
            }
        }, 
        mouseover: function (evt) { //console.log("mouseover", evt.target);

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
        keydown: function (evt) { console.log("keydown",key(evt));
            exposed.keys_depressed[key(evt)] = String.fromCharCode(key(evt));
        },
        keyup: function (evt) { console.log("keyup",key(evt));
            delete exposed.keys_depressed[key(evt)];
        },
        touchstart: function (evt) { //console.log("touchstart", evt.targetTouches);            
            // if allow scroll, then never prevent default: once you're
            // scrolling, touching anything else should never mess with the 
            // browser default scrolling. 
            // On touch devices the touchstart is the critical event that keys 
            // off a complex interaction, so it will be the place that 
            // allow_scroll is directly assigned (when it is the first touch,
            // of course).
            var ps_count = 0;
            for (var x in exposed.pointer_state) {
                if (x !== "m") ps_count++;
            }
            var seen_target;
            for (var i=0;i<evt.changedTouches.length;++i) {
                var eci = evt.changedTouches[i];
                // this assertion is to check my assumption that all touchstarts batch cT list based on target elem.
                if (seen_target) assert(eci.target === seen_target);
                else seen_target = eci.target;
                // here, we must determine the actual real target that this set of touches
                // is destined to control. store that... for right now it stores the immediate
                // target which is fine to test that the thing works. 

                var pointer_data = {xs: eci.pageX, ys: eci.pageY, xc: eci.pageX, yc: eci.pageY, e: seen_target};
                if (!$.data(seen_target,"ply")) {
                    var to_add = {};
                    to_add[eci.identifier] = pointer_data;
                    $.data(seen_target,"ply",to_add);
                } else {
                    $.data(seen_target,"ply")[eci.identifier] = pointer_data;
                }
                exposed.pointer_state[eci.identifier] = pointer_data; 
            }
           
            if (exposed.allow_scroll && ps_count === 0 && 
                ((' '+seen_target.className+' ').indexOf(" ply-noscroll ") !== -1))
            {
                exposed.allow_scroll = false;
            }
            if (!exposed.allow_scroll) {
                evt.preventDefault();
            }
        },
        touchend: (touchend_touchcancel = function (evt) { //console.log("touchend", evt.changedTouches);
            // clean out the touches that got removed 
            var ec = evt.changedTouches;
            var ecl = ec.length;
            for (var i=0;i<ecl;++i) {
                var eci = ec[i];
                $.data(exposed.pointer_state[eci.identifier].e,'ply',false);
                delete exposed.pointer_state[eci.identifier];
            }
            // if debug check the model in fact is correctly maintained by cT by comparing to touches
            if (exposed.debug) {
                var touches_hash = {};
                for (var t=0;t<evt.touches.length;++t) {
                    var etti = evt.touches[t].identifier;
                    touches_hash[etti] = true;
                    assert(exposed.pointer_state[etti],"this element should be in the pointer_state because it is in the touches: "+t);
                }
                for (var x in exposed.pointer_state) {
                    if (x === "m") continue; // skip the mouse
                    assert(touches_hash[x],"this element should be in the touches in the event because it is in the pointer state: "+x);
                    assert($.data(exposed.pointer_state[x].e,'ply'),"exists: data of element in pointer_state indexed "+x);
                    assert($.data(exposed.pointer_state[x].e,'ply') === exposed.pointer_state[x], "pointer_state["+x+"] is exactly equal to the data of its e property: "+serialize(exposed.pointer_state[x])+"; "+serialize($.data(exposed.pointer_state[x].e,'ply')));
                }
            }
            if (evt.touches.length === 0) { // this indicates no touches remain
                exposed.allow_scroll = true;
            }
        }),
        touchcancel: touchend_touchcancel,
        // The majority of functionality is funneled through the (capturing) touchmove handler on the document. 
        // It is quite possible for this to execute 180 times per second. 
        // Because of this, extra effort is put toward optimizing this function. 
        touchmove: function (evt) { //if (!window.lastTM){window.lastTM = Date.now();} console.log("touchmove ",Date.now()-window.lastTM,evt.rotation,evt.scale); window.lastTM=Date.now(); 
        //console.log("touchmove ",id_string_for_touch_list(evt.changedTouches),id_string_for_touch_list(evt.touches));
            if (exposed.allow_scroll) return; // since this is touch device, when scrolling we don't do ply-things
            evt.preventDefault(); // prevent the pinching (this is primarily for Android: on iOS a preventdefault on the touchstart is sufficient to suppress pinch)            
                     
            // if updates are sent faster than 7ms they are ignored!
            // This should work reliably up until devices provide faster than 120Hz touch events
            // and gives browser about 7 ms of grace-period between touchmove events
            // (which is way more than it should be taking esp. since I start the timing after
            // completing ply transform tasks)
            if (Date.now() - exposed.tmTime < 7) return; // discard the event                
            
            var et = evt.touches;
            var etl = et.length;
            for (var i=0;i<etl;++i) { // loop over all pointers: assemble the elements to transform array 
                var eti = et[i];
                var ep_etid = exposed.pointer_state[eti.identifier];
                // ep_etid.es is the actual element to be manipulated
                // full_pointer_list.push({e: ep_etid.es, x: eti.pageX-ep_etid.xs, y: eti.pageY-ep_etid.ys});
                // update this for display purposes
                ep_etid.xc = eti.pageX;
                ep_etid.yc = eti.pageY;
                if (eti.webkitForce) {
                    ep_etid.fatness = eti.webkitForce;
                }
            }

            exposed.tmTime = Date.now(); // update this last

            // loop through the exposed.pointer_state, messaging the elements that received updates in ct
            // 
            /* 

            var full_pointer_list = [];
            
            var el = full_pointer_list;
            var ell = el.length;
            var first, second, rest;
            for (var e; true; e = undefined) {
                first = undefined;
                second = undefined;
                rest = [];
                console.log("entering j-loop");
                for (var j=0;j<ell;++j) {
                    var elj = el[j];
                    var v = {x: elj.x, y: elj.y};
                    if (!elj.e && !e) { 
                        // init e
                        e = elj.e;
                        console.log("first finger for element ",e);
                        elj.e = undefined;
                        first = v;
                    } else if (elj === e) {
                        // a second (or third etc)
                        if (!second) {
                            second = v;
                            console.log("second finger for element ",e);
                        } else {
                            rest.push(v);
                            console.log("third(or more) finger for element ",e); 
                        }
                        elj.e = undefined;
                    } // else, is another element we'll come back for it later
                }
                // NOW we process element e
                if (!e) {
                    // at this point we know we're done; all elements exhausted
                    break;
                }
                if (!second) {
                    // only first is set: only one finger on this element
                    // build and send out a translate event 
                    var event = document.createEvent('HTMLEvents'); // this is for compatibility with DOM Level 2
                    event.initEvent('ply_translate',true,true);
                    event.deltaX = first.x;
                    event.deltaY = first.y;
                    var defaultPrevented = e.dispatchEvent(event);
                } else {
                    // first and second are set 
                    // do full two finger logic 
                    console.log("two fingers on",e);
                    // process 3+ fingers
                    for (var k=0;k<rest.length;++k) {
                        console.log("finger #"+(k+3));
                    }
                }
            } */
            
            // translation is difference between xs,ys and x,y
            
            // compute and issue events to either target or stored parent collecting target


        },
        /*touchcancel: function (evt) { console.log("touchcancel", evt.changedTouches);
            for (var i=0;i<evt.changedTouches.length; ++i) {
                delete exposed.pointer_state[evt.changedTouches[i].identifier];
            }
            if (evt.touches.length === 0) { // this indicates no touches remain: In all instances I've seen, 
                // any touchcancel firing cancels *all* touches.
                // In any case, should be safe to return to default allow_scroll mode
                exposed.allow_scroll = true;
                // and also clear this out 
                exposed.last_pointer_id = null;
            }
        }*/ 
        DOMNodeInserted: Mutation_Observer ? null : function (evt) { //console.log("DOMNodeInserted: ",evt.target);
            // handle specially new elements which have the classes we're 
            // interested in
        }
    };

    // use each because we need a scoped loop
    each(handlers_for_doc, function (event_name,v) {
        if (!v) return; 
        document.addEventListener(event_name, function () {
            try {
                v.apply(this, arguments);
            } catch (e) {
                // show the error to the DOM to help out for mobile (also cool on PC)
                $("#debug_log").prepend($('<div class="error">').text(e.toString()+": "+e.stack));
                throw e; // rethrow to give it to debugging safari, rather than be silent
            }
            exposed.event_processed = true;
        }, true); // hook to capture phase to circumvent stopPropagation()
    });
    return exposed;
})(jQuery);
