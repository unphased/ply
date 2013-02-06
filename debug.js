/// slu's JS debug layer. Please include prior to loading libraries that use it
/// Primarily provides functionality for live DOM manipulation style debugging
/// which was used heavily throughout development of ply.js.
/// Access features through window.DEBUG

// there are a few special DOM id's: 
// #debug_log
// #log_buffer_dump

var DEBUG = (function() {

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
            // tells us which child we are (incl. textnodes)
            // for (var k=0,e=val; (e = e.previousSibling); ++k); 
            // tells us which (real node) index it is
            var k = val.parentNode&&val.parentNode.children?Array.prototype.indexOf.call(val.parentNode.children,val):undefined;
            var cn = val.className;
            var tn = val.tagName;
            var id = val.id;
            if (tn === "HTML") { cn = ""; } // in case of Modernizr don't dump it all
            return "<"+tn+(k?" #"+k:"")+(cn?" c="+cn:"")+(id?" id="+id:"")+">";
        }
        return val;
    };
    function serialize(arg) {
        if (typeof arg === "function") return "function";
        return JSON.stringify(arg,json_handler).replace(/"([^"]*)":/g,"$1: ").replace(/\},([^ ])/g,'},  $1').replace(/,([^ ])/g,', $1');
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

    var git_context = "#% 2037117 untransformedoffset %#";

    var datenow = Date.now?Date.now:function(){return (new Date()).getTime();};

    var original_console_log = console.log;
    // echo console logs to the debug 
    var instrumented_log = function () {
        original_console_log.apply(window.console, arguments);
        if (!exposed.enabled) return;
        var str = "";
        for (var i=0;i<arguments.length;++i) {
            str += escapeHtml(serialize(arguments[i])).replace(/ {2}/g,'</br>');
            str += ", ";
        }
        str = str.slice(0,-2);
        var now = datenow();
        var html_str = '<div class="log" data-time="'+now+'">'+str+'</div>';
        log_buffer.push(html_str);
        $("#debug_log").prepend(html_str); 
        // this means all logs in your application get dumped into #debug_log if 
        // you've got one
    };

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

    // clears out old values in debug log (run me periodically)
    function clean() {
        var now = datenow();
        var debuglog = $("#debug_log")[0];
        var dc = debuglog.children;
        for (i = dc.length-1; dc.length > 50 && i >= 0; --i) {
            var timestamp = dc[i].getAttribute('data-time');
            if (timestamp && timestamp < (now - 15000))
                debuglog.removeChild(dc[i]);
        }
    }

    // an interface for portably highlighting any page element (without changing it)
    function highlight(e, identifier){
        // lazily init top level element 
        var jc = $("#debug_element_highlighter_container");
        if (jc.length === 0) {
            $("html").append("<div id=debug_element_highlighter_container></div>");
            jc = $("#debug_element_highlighter_container")
        }        
        var selector = identifier?'[data-id="'+identifier+'"]':"#debug_element_highlighter_noid";
        var target = jc.children(selector);
        if (!e) { // remove command: remove if present
            target.remove();
        } else if (target.length === 0) { // update command: add if not present
            jc.append("<div "+(identifier?"data-id="+identifier:"id=debug_element_highlighter_noid")+"></div>");
            target = jc.children(selector);
            target.css({ // init

            });
        }
        // assign to the target styles that has it overlap the target element

    }

    // primitive set of methods provided by debug
    var exposed = {
        enabled: true,
        assert: assert,
        escapeHtml: escapeHtml,
        serialize: serialize,
        isInDOM: isInDOM,
        revision: git_context.slice(3,-3), 
        clean_list: clean,
     
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

    return exposed;
})();
