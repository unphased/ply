  ////////////////////////////////////////////////
 /// slu's JS browser debug/util layer deluxe ///
////////////////////////////////////////////////

// debug.js is a resource-level instrumentation script. Include to gain
// debugging capabilities, and absence implies a lean release environment.
// predicate debugging features on the presence of this DEBUG global variable.

// routines found in this debug layer are permitted to fail spectacularly in
// the absence of necessary components such as jQuery, ply.js, utils (towel.js)

// For now, there might be a few special DOM id's that are referenced:
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
            console.log("ASSERTION FAILED ", args.slice(1));
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

    /* var original_console_log = console.log;
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

    console.log = instrumented_log; */

    var LOGENABLED = true; // if false, no logging thru _log occurs (regular console log works like normal)
    var CAPTURELOG = true; // if true, debug_log list is filled in when _log runs. whether traditional logging occurs or not is not affected and does not affect this.

    var log_attachments = []; // log attachments are a creation of mine which
    var log_attachments_len = 0; // desperate and paranoid attempt at performance squeezing

    // This is something that can potentially make things slow. Just be careful with it...
    // For instance, don't store references to anything your cb receives. It would consume massive amounts of memory.
    function attach_log_cb(cb) {
        log_attachments.push(cb);
        log_attachments_len ++;
    }
    // the log below will also invoke, this will 
    // This amazing log wrapper for webkit lifted from http://stackoverflow.com/a/14842659/340947
    _log = (function (methods, undefined) {

        var Log = Error; // does this do anything?  proper inheritance...?
        Log.prototype.write = function (args, method) {
            /// <summary>
            /// Paulirish-like console.log wrapper.  Includes stack trace via @fredrik SO suggestion (see remarks for sources).
            /// </summary>
            /// <param name="args" type="Array">list of details to log, as provided by `arguments`</param>
            /// <param name="method" type="string">the console method to use:  debug, log, warn, info, error</param>
            /// <remarks>Includes line numbers by calling Error object -- see
            /// * http://paulirish.com/2009/log-a-lightweight-wrapper-for-consolelog/
            /// * http://stackoverflow.com/questions/13815640/a-proper-wrapper-for-console-log-with-correct-line-number
            /// * http://stackoverflow.com/a/3806596/1037948
            /// </remarks>

            // via @fredrik SO trace suggestion; wrapping in special construct so it stands out
            var suffix = {
                "@": (this.lineNumber ?
                    this.fileName + ':' + this.lineNumber + ":1" :
                    // add arbitrary column value for chrome linking
                    extractLineNumberFromStack(this.stack)
                )
            };

            args = args.concat([suffix]);
            // via @paulirish console wrapper
            if (console && console[method]) {
                if (console[method].apply) { console[method].apply(console, args); } else { console[method](args); } // nicer display in some browsers
            }
        };
        var extractLineNumberFromStack = function (stack) {
            /// <summary>
            /// Get the line/filename detail from a Webkit stack trace.  See http://stackoverflow.com/a/3806596/1037948
            /// </summary>
            /// <param name="stack" type="String">the stack string</param>

            // correct line number according to how Log().write implemented
            var line = stack.split('\n')[3];
            // fix for various display text
            line = (line.indexOf(' (') >= 0 ?
                line.split(' (')[1].substring(0, line.length - 1) :
                line.split('at ')[1]);
            return line;
        };

        // method builder
        var logMethod = function(method) {
            return function (params) {
                /// <summary>
                /// Paulirish-like console.log wrapper
                /// </summary>
                /// <param name="params" type="[...]">list your logging parameters</param>
                var v;
                if (CAPTURELOG || LOGENABLED) {
                    v = Array.prototype.slice.call(arguments,0);
                }
                if (CAPTURELOG) {
                    // log_buffer takes on a slightly proprietary compact format 
                    log_buffer.push(method[0]+' '+v.map(function(e){return escapeHtml(serialize(e)).replace(/ {2}/g,'</br>');}).join(' '));
                }
                // only if explicitly true somewhere
                if (LOGENABLED) {
                    Log().write(v, method); // turn into proper array & declare method to use
                }

                if (log_attachments_len) {
                    for (var x in log_attachments) {
                        log_attachments[x](log_buffer);
                    }
                }
            };//--  fn  logMethod
        };
        var result = logMethod('log'); // base for backwards compatibility, simplicity
        // add some extra juice
        for(var i in methods) result[methods[i]] = logMethod(methods[i]);

        return result; // expose
    })(['error', 'debug', 'info', 'warn']); // _log

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
                _log.error(e);
                throw e; // rethrow to give it to debugging safari, rather than be silent
            }
        });
    }

    // exposed for easy review and is filled with summary from state
    // currently works as plain holder of whatever instrumenter gives it
    var profiles = {};

    // be sure to use me correctly (i.e. don't throw away my retval, etc)
    function reporter_maker(name_of_profile_report, cb) {
        profiles[name_of_profile_report] = { value: "initprofile", enabled: true, cb: cb };
        return function (report_from_profiler) {
            var pn = profiles[name_of_profile_report];
            pn.value = report_from_profiler;
            if (pn.cb) { pn.cb(name_of_profile_report, report_from_profiler); }
        };
    }

    function instrument_with_accumulated_profile(routine, report_receiver, duration_ratio) {
        var rc = 1.0/duration_ratio;

        // some ephemeral profiling DS's closed over the instrumented routine's function
        var accum = 0;
        var starting = true;
        var count = 0;
        return function() {
            var time = datenow();
            routine.apply(this, arguments);
            if (starting) {
                accum += rc*(datenow()-time);
            } else {
                accum += (accum - (datenow()-time) * duration_ratio);
            }
            if (++count === duration_ratio) {
                count = 0;
                starting = false;
                report_receiver(accum);
            }
        };
    }
    function instrument_profile_on(routine, name, count, cb) {
        return instrument_with_accumulated_profile(routine, reporter_maker(name, cb), count);
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
        update_pointer_state: update_pointer_state,
        globalAsyncKeybind: globalAsyncKeybind,
        instrument_profile_on: instrument_profile_on,
        profiles: profiles,
        CAPTURELOG: CAPTURELOG,
        LOGENABLED: LOGENABLED,
        attach_log_cb: attach_log_cb,
        // This is just marked when any event makes its way through the primary
        // event handlers so that the test site can be a bit more efficient about
        // re-updating the DOM. I may eventually let the events that don't
        // change the debugprints to also not set this either.
        event_processed: false,
        datenow: datenow
    };

    // generally helpful debugging info we're gonna globally provide
    $(function() {
        console.info("UA: "+navigator.userAgent);
        console.info("window.devicePixelRatio:", window.devicePixelRatio);
        console.info("Revision: "+exposed.revision);
    });
    return exposed;
})(window.ply_$ || jQuery);
// will use either your site's jQuery, or if in conjunction with ply and a jQuery conflict had occurred,
// use the guaranteed-up-to-date jQuery
