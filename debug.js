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

    var git_context = "#% REVISION %#";

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

    function error(e) {
        log_buffer.push('<div class="error">'+e.toString()+" at "+e.stack+"</div>");
    }
    
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

    /* Modernizr 2.6.2 (Custom Build) | MIT & BSD
    * Build: http://modernizr.com/download/#-prefixed-testprop-testallprops-domprefixes
    */
    local_Modernizr=function(a,b,c){function w(a){i.cssText=a}function x(a,b){return w(prefixes.join(a+";")+(b||""))}function y(a,b){return typeof a===b}function z(a,b){return!!~(""+a).indexOf(b)}function A(a,b){for(var d in a){var e=a[d];if(!z(e,"-")&&i[e]!==c)return b=="pfx"?e:!0}return!1}function B(a,b,d){for(var e in a){var f=b[a[e]];if(f!==c)return d===!1?a[e]:y(f,"function")?f.bind(d||b):f}return!1}function C(a,b,c){var d=a.charAt(0).toUpperCase()+a.slice(1),e=(a+" "+m.join(d+" ")+d).split(" ");return y(b,"string")||y(b,"undefined")?A(e,b):(e=(a+" "+n.join(d+" ")+d).split(" "),B(e,b,c))}var d="2.6.2",e={},f=b.documentElement,g="modernizr",h=b.createElement(g),i=h.style,j,k={}.toString,l="Webkit Moz O ms",m=l.split(" "),n=l.toLowerCase().split(" "),o={},p={},q={},r=[],s=r.slice,t,u={}.hasOwnProperty,v;!y(u,"undefined")&&!y(u.call,"undefined")?v=function(a,b){return u.call(a,b)}:v=function(a,b){return b in a&&y(a.constructor.prototype[b],"undefined")},Function.prototype.bind||(Function.prototype.bind=function(b){var c=this;if(typeof c!="function")throw new TypeError;var d=s.call(arguments,1),e=function(){if(this instanceof e){var a=function(){};a.prototype=c.prototype;var f=new a,g=c.apply(f,d.concat(s.call(arguments)));return Object(g)===g?g:f}return c.apply(b,d.concat(s.call(arguments)))};return e});for(var D in o)v(o,D)&&(t=D.toLowerCase(),e[t]=o[D](),r.push((e[t]?"":"no-")+t));return e.addTest=function(a,b){if(typeof a=="object")for(var d in a)v(a,d)&&e.addTest(d,a[d]);else{a=a.toLowerCase();if(e[a]!==c)return e;b=typeof b=="function"?b():b,typeof enableClasses!="undefined"&&enableClasses&&(f.className+=" "+(b?"":"no-")+a),e[a]=b}return e},w(""),h=j=null,e._version=d,e._domPrefixes=n,e._cssomPrefixes=m,e.testProp=function(a){return A([a])},e.testAllProps=C,e.prefixed=function(a,b,c){return b?C(a,b,c):C(a,"pfx")},e}(this,this.document);

    var transEndEventNames = {
        'WebkitTransition' : 'webkitTransitionEnd',
        'MozTransition'    : 'transitionend',
        'OTransition'      : 'oTransitionEnd',
        'msTransition'     : 'MSTransitionEnd',
        'transition'       : 'transitionend'
    }; 
    var transEndEventName;
    var transformStyle = local_Modernizr.prefixed('transform');

    // init some CSS for styling our highlighters (this debug script is intended to be a self contained bundle of magic)
    // tis a shame jquery doesn't help out with this sort of thing
    if (document.styleSheets.length === 0) {
        // must init a stylesheet 
        var s = document.createElement('style');
        s.type = 'text/css';
        s.appendChild(document.createTextNode("dummy_tag {/* dummy selector */}"));
        document.head.appendChild(s);
    }
    document.styleSheets[0].insertRule('#debug_element_highlighter_container {}',0);
    document.styleSheets[0].cssRules[0].style.position = "absolute";
    document.styleSheets[0].cssRules[0].style.pointerEvents = 'none';
    document.styleSheets[0].cssRules[0].style.top = '0';
    document.styleSheets[0].cssRules[0].style.left = '0';
    
    document.styleSheets[0].insertRule('#debug_element_highlighter_container * {}',0);
    document.styleSheets[0].cssRules[0].style[local_Modernizr.prefixed('transitionDuration')] = '0.3s, 0.3s';
    document.styleSheets[0].cssRules[0].style[local_Modernizr.prefixed('transitionProperty')] = 'transform, opacity';
    document.styleSheets[0].cssRules[0].style[local_Modernizr.prefixed('transformOrigin')] = '0 0';
    document.styleSheets[0].cssRules[0].style.backgroundColor = 'rgba(0,0,255,0.3)';
    document.styleSheets[0].cssRules[0].style.pointerEvents = 'none';
    document.styleSheets[0].cssRules[0].style.width = '100px';
    document.styleSheets[0].cssRules[0].style.height = '100px';

    transEndEventName = transEndEventNames[ local_Modernizr.prefixed('transition') ];

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
        console.log('highlight1', target.length)
        if (!e) { // remove command: remove if present
            // fade out
            target.on(transEndEventName,function(){
                target.remove(); // erase me
            });
            target.css({ // fade
                opacity: 0
            });
        } else {
            if (target.length === 0) { // update command: add if not present
                jc.append("<div "+(identifier?"data-id="+identifier:"id=debug_element_highlighter_noid")+"></div>");
                target = jc.children(selector);
            }
            // assign to the target styles that has it overlap the target element
            var je = $(e);
            var p = je.offset();
            var w = je.outerWidth();
            var h = je.outerHeight();
            target[0].style[transformStyle] = "translate3d("+p.left+"px, "+p.top+"px,0) scale3d("+w/100+","+h/100+",1) ";
        }
        original_console_log.apply(window.console,["highlight2",e, jc]);
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
        highlight: highlight,
        error: error,
     
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
