  ////////////////////////////////////////////////
 /// slu's JS browser debug/util layer deluxe ///
////////////////////////////////////////////////

// debug.js is a resource-level instrumentation script. Include to gain
// debugging capabilities, and absence implies release deployment.
// predicate debugging features on the presence of DEBUG global.
// TODO: Remove all references to DEBUG.enabled (it used to be the switchable debug flag).
// Instead, build individual toggle controls into debugging features separately.

// routines found in this debug layer are permitted to fail spectacularly in
// the absence of necessary components such as jQuery, ply.js, utils (towel.js)

// For now, there might be a few special DOM id's that are referenced:
// #debug_log
// #log_buffer_dump

var DEBUG = (function($) {
    /*global UTIL:false, PLY:false, Modernizr:false, ply_$:false*/
    //"use strict";

	var AssertException = function (message) { this.message = message; };
    AssertException.prototype.toString = function () {
        return 'AssertException: ' + this.message;
    };

    window.assert = function (exp, message) {
        if (!exp) {
            console.log("ASSERTION FAILED: "+message);
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
            // tells us which child we are (incl. textnodes)
            // for (var k=0,e=val; (e = e.previousSibling); ++k);
            // tells us which (real node) index it is
            var k = val.parentNode && val.parentNode.children ?
                Array.prototype.indexOf.call(val.parentNode.children,val) : undefined;
            var cn = val.className;
            var tn = val.tagName;
            var id = val.id;
            if (tn === "HTML") { cn = ""; } // in case of Modernizr don't dump it all
            return "<"+tn+(k?" #"+k:"")+(cn?" c="+cn:"")+(id?" id="+id:"")+">";
        }
        return val;
    };


    function serialize(arg) {
        if (typeof arg === "undefined") return "undefined";
        if (typeof arg === "function") return "function";
        return JSON.stringify(arg,json_handler).replace(/"([^"]*)":/g,"$1: ")
            .replace(/\},([^ ])/g,'},  $1').replace(/,([^ ])/g,', $1');
    }

    function isInDOM(e) {
        while ((e = e.parentNode)) {
            if (e == document) {
                return true;
            }
        }
        return false;
    }

    // all vars except the variable "exposed" are private variables
    var log_buffer = [];

    var git_context = "#% REVISION %#";

    var datenow = Date.now?Date.now:function(){return (new Date()).getTime();};

    function is_touch_device() {
        return !!('ontouchstart' in window) ||
            !!('onmsgesturechange' in window); // works on ie10
    }

    var original_console_log = console.log;
    // echo console logs to the debug
    var instrumented_log = function () {
        original_console_log.apply(window.console, arguments);
        var str = "";
        for (var i=0;i<arguments.length;++i) {
            str += escapeHtml(serialize(arguments[i])).replace(/ {2}/g,'</br>');
            str += ", ";
        }
        str = str.slice(0,-2);
        var now = datenow();
        var html_str = '<div class="log" data-time="'+now+'">'+str+'</div>';
        log_buffer.push(html_str);
        if (DEBUG && DEBUG.enable_debug_printing) $("#debug_log").prepend(html_str);
        // this means all logs in your application get dumped into #debug_log if
        // you've got one
    };

    if (true)
    {
        console.log = instrumented_log;

        var show_log_buffer = false;
        $("#log_buffer_dump").before($('<button>toggle full log buffer snapshot</button>').on('click',function(){
            show_log_buffer = !show_log_buffer;
            if (show_log_buffer) {
                $("#log_buffer_dump").html(log_buffer.join(''));
            } else {
                $("#log_buffer_dump").html("");
            }
        })).on("touchenter",function(){console.log("touchenter on toggle buffer dump button");})
            .on('touchleave',function(){console.log("touchleave on toggle buffer dump button");});
    }

    function error(e) {
        var e_html = '<div class="error">'+e.toString()+" at "+e.stack+"</div>";
        log_buffer.push(e_html);
        $("#debug_log").prepend(e_html);
    }

    // clears out old values in debug log (run me periodically)
    function clean() {
        var now = datenow();
        var debuglog = $("#debug_log")[0];
        var dc = debuglog.children;
        for (var i = dc.length-1; dc.length > 50 && i >= 0; --i) {
            var timestamp = dc[i].getAttribute('data-time');
            if (timestamp && timestamp < (now - 15000))
                debuglog.removeChild(dc[i]);
        }
    }

// the stuff following this are to be moved over to util because they are not debug-only
// functionality.



    // this is a convenience debugger helper to map arbitrary code to keyboard input
    // keychar_funclist must be a hash of functions where the key is a char representing the
    // keyboard key that will trigger the function. These funcs will be invoked with no args.
    function globalAsyncKeybind(keychar_funclist) {
        document.addEventListener("keydown", function (evt) {
            function key(evt) {
                return evt.which || evt.keyCode || /*window.*/event.keyCode;
            }
            try {
                var target_func = keychar_funclist[String.fromCharCode(key(evt))];
                if (target_func) target_func();
            } catch (e) {
                // show the error to the DOM to help out for mobile (also cool on PC)
                //var html = '<div class="error">'+e.toString()+" at "+e.stack+"</div>";
                //$("#debug_log").prepend(html);
                error(e);
                throw e; // rethrow to give it to debugging safari, rather than be silent
            }
        });
    }

    function instrument_with_accumulated_profile(routine, report_receiver, report_count) {
        var rc = report_count || 30;
        var each = 1.0/rc; // keeping shit simple
        var accum = 0;
        var count = 0; // some ephemeral profiling DS's closed over the instrumented routine's function
        return function() {
            var time = datenow();
            routine();
            accum += each*(datenow()-time);
            if (++count === rc) {
                count = 0;
                report_count(accum);
                accum = 0;
            }
        };
    }

    var hide_transform = 'translate3d(-99999px,-99999px,0)';
    var transformStyle = UTIL.transformStyle;

    var pointer_debug_css =
        '#ply_ptr_marker_ctnr, #ply_ptr_marker_ctnr > div {\n' +
            'pointer-events: none;\n' +
            'border: none;\n' +
            'position: absolute;\n' +
            'top: 0; left: 0;\n' +
        '}\n' +
        '#ply_ptr_marker_ctnr > div > div {\n' +
            'pointer-events: none;\n' +
            'position: absolute;\n' +
            'background-color: #33f;\n' +
            'border: #009 2px solid;\n' +
            'top: -4px;\n' +
            'left: -4px;\n' +
            'width: 4px;\n' +
            'height: 4px;\n' +
            'border-radius: 300px;\n' +
            'box-shadow: 0 0 8px 0 #33f;\n' +
        '}\n' +
        '#ply_ptr_marker_ctnr > .start > div {\n' +
            'background-color: #f33;\n' +
            'border: #900 2px solid;\n' +
            'box-shadow: 0 0 8px 0 #f33;\n' +
        '}\n' +
        '#ply_ptr_marker_ctnr > .intermediate_start > div {\n' +
            'background-color: #3c3;\n' +
            'border: #070 2px solid;\n' +
            'box-shadow: 0 0 8px 0 #3c3;\n' +
        '\n}';

    UTIL.injectCSS(pointer_debug_css);

    // touch point location debug functionality is encapsulated in these public functions
    // this depends on PLY but not in the sense that it requires it on load. it requires it to run:
    // so they can be loaded asynchronously so long as this does not run before it loads.
    function update_pointer_state() {
        var jptr_marker_ctnr = $("#ply_ptr_marker_ctnr");
        if (jptr_marker_ctnr.length === 0) {
            jptr_marker_ctnr =
                $('<div id="ply_ptr_marker_ctnr">'+
                    '<div class="current">'+
                        '<div></div>'+
                        '<div></div>'+
                        '<div></div>'+
                        '<div></div>'+
                        '<div></div>'+
                        '<div></div>'+
                        '<div></div>'+
                        '<div></div>'+
                        '<div></div>'+
                        '<div></div>'+
                    '</div>'+
                    '<div class="start">'+
                        '<div></div>'+
                        '<div></div>'+
                        '<div></div>'+
                        '<div></div>'+
                        '<div></div>'+
                        '<div></div>'+
                        '<div></div>'+
                        '<div></div>'+
                        '<div></div>'+
                        '<div></div>'+
                    '</div>'+
                    '<div class="intermediate_start">'+ // these are "interrupted" start pts
                        '<div></div>'+
                        '<div></div>'+
                        '<div></div>'+
                        '<div></div>'+
                        '<div></div>'+
                        '<div></div>'+
                        '<div></div>'+
                        '<div></div>'+
                        '<div></div>'+
                        '<div></div>'+
                    '</div>'+
                '</div>').appendTo('html');
        }
        var pmc = jptr_marker_ctnr[0];
        var pmcc = pmc.children[0];
        var pmcs = pmc.children[1];
        var pmci = pmc.children[2];
        // var scrollX = document.body.scrollTop;
        // var scrollY = document.body.scrollLeft;
        var i=0;
        for (var p in PLY.pointer_state) {
            if (i === 10) { alert( 'More than 10 fingers. Wat'); }
            var pp = PLY.pointer_state[p];
            var pmcci = pmcc.children[i];
            var pmcsi = pmcs.children[i];
            var pmcii = pmci.children[i];
            pmcci.style[transformStyle] = 'translate3d('+pp.xc+'px,'+pp.yc+'px,0)';
            pmcsi.style[transformStyle] = 'translate3d('+pp.xs+'px,'+pp.ys+'px,0)';
            if (pp.xs2) {
                pmcii.style[transformStyle] = 'translate3d('+pp.xs2+'px,'+pp.ys2+'px,0)';
            } else {
                pmcii.style[transformStyle] = hide_transform;
            }
            if (pp.fatness) {
                var rounded_fatness = Math.floor(pp.fatness*100);
                pmcci.style.width = pmcci.style.height = rounded_fatness+'px';
                pmcci.style.top = pmcci.style.left = -(rounded_fatness/2+2)+'px';
            }
            ++i;
        }
        for (;i<10;++i) {
            pmcc.children[i].style[transformStyle] = hide_transform;
            pmcs.children[i].style[transformStyle] = hide_transform;
            pmci.children[i].style[transformStyle] = hide_transform;
        }
    }

    // methods provided by debug
    var exposed = {
        enable_debug_printing: true,
        escapeHtml: escapeHtml,
        serialize: serialize,
        isInDOM: isInDOM,
        revision: git_context.slice(3,-3),
        clean_list: clean,
        update_pointer_state: update_pointer_state,
        error: error,
        globalAsyncKeybind: globalAsyncKeybind,
        instrument_profile: instrument_with_accumulated_profile,

        // This is just marked when any event makes its way through the primary
        // event handlers so that the test site can be a bit more efficient about
        // re-updating the DOM. I may eventually let the events that don't
        // change the debugprints to also not set this either.
        event_processed: false,
        datenow: datenow
    };

    // generally helpful debugging info
    console.log("UA: "+navigator.userAgent);
    console.log("window.devicePixelRatio:", window.devicePixelRatio);
    console.log("Revision: "+exposed.revision);

    return exposed;
})(window.ply_$ || jQuery);
// will use either your site's jQuery, or if in conjunction with ply and a jQuery conflict had occurred,
// use the guaranteed-up-to-date jQuery