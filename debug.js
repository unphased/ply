/// slu's deluxe JS browser debug layer. Please include prior to loading libraries that depend on it
/// Primarily provides functionality for live DOM manipulation style debugging
/// which was used heavily throughout development of ply.js.
/// You will be able to access exposed features through window.DEBUG.

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
   
    var git_context = "#% bdd3643 forgot a close curly bracket in css %#";

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

    function hyphen_style(style) {
        return style.replace(/([A-Z])/g, function(str,m1){ return '-' + m1.toLowerCase(); }).replace(/^ms-/,'-ms-');
    }

    function hyphen_mp(style) {
        return hyphen_style(local_Modernizr.prefixed(style));
    }

    var css = "#debug_element_highlighter_container { "+
        "position: absolute; "+
        "pointerEvents: none; "+
        "top: 0; left: 0; "+
        "overflow: visible; "+
        "width: 0; height: 0; "+
        "#debug_element_highlighter_container * { "+
        hyphen_mp('transitionDuration') + ": 2s, 2s; " + 
        hyphen_mp('transitionProperty') + ": "+hyphen_mp('transform')+", opacity; " +
        hyphen_mp('transformOrigin') + ": 0 0; " + 
        "position: absolute; top: 0; left: 0; " + 
        "pointer-events: none; height: 500px; width: 500px; } " + 
        "#debug_element_highlighter_outer { background-color: rgba(45,60,255,0.2); } " + 
        "#debug_element_highlighter_inner { background-color: rgba(25,255,35,0.2); } ";

    // append a style tag to head 
    var head = document.getElementsByTagName("head")[0];
    var style = document.createElement("style");
    style.type = "text/css";
    if (style.styleSheet){
        style.styleSheet.cssText = css;
    } else {
        style.appendChild(document.createTextNode(css));
    }

    transEndEventName = transEndEventNames[ local_Modernizr.prefixed('transition') ];

    // an interface for portably highlighting any page element (without changing it)
    function highlight(e){
        // lazily init top level element 
        var jc = $("#debug_element_highlighter_container");
        if (jc.length === 0) {
            $("html").append("<div id=debug_element_highlighter_container></div>");
            jc = $("#debug_element_highlighter_container");
        }
        var jouter = jc.children("#debug_element_highlighter_outer");
        var jinner = jc.children("#debug_element_highlighter_inner");
        //console.log('highlight1', jouter.length)
        if (!e) { // remove command: remove if present
            // fade out
            jouter.on(transEndEventName,function(){
                jouter.remove(); // erase me
                jinner.remove();
                //console.log("removed");
            });
            var css_set_outer = {opacity: 0};
            css_set_outer[transformStyle] = function(i,old) { 
                // get the old position to adjust the origin of scale animation
                assert(old.indexOf("matrix") === 0); // check we're seeing a matrix
                assert(old.indexOf("(") === 6); // make sure it's not a matrix3d (only to ensure no error todo: write impl for matrix3d)
                var mat = old.slice(7,-1).split(","); // epic oneliner
                return "translate("+(-mat[0]*250)+"px,"+(-mat[3]*250)+"px) "+old+" scale(2)";
            }; // expand-fade out
            jouter.css(css_set_outer);
            var css_set_inner = {opacity: 0};
            css_set_inner[transformStyle] = function(i,old) { // this could be scrunched down and abstracted
                var mat = old.slice(7,-1).split(","); 
                return "translate("+(mat[0]*125)+"px,"+(mat[3]*125)+"px) "+old+" scale(0.5)";
            };
            jinner.css(css_set_inner); 
        } else {
            jouter.off(transEndEventName);
            //console.log("running the update");
            if (jouter.length === 0) { // update command: add if not present
                assert(jinner.length === 0, "jouter does not exist so neither should jinner"); // just a sanity check
                css_set = {opacity: 0};
                css_set[transformStyle] = "scale3d("+document.documentElement.scrollWidth/500+","+document.documentElement.scrollHeight/500+",1)";
                var jo = $('<div '+"id=debug_element_highlighter_outer"+"></div>").css(css_set);
                var ji = $('<div '+"id=debug_element_highlighter_inner"+"></div>").css(css_set);
                // insert to DOM
                jc.append(jo);
                jc.append(ji);
                jouter = jo;
                jinner = ji;
            }
            var je = $(e);
            var p = je.offset();
            var ow = je.outerWidth(true);
            var oh = je.outerHeight(true);
            var iw = je.innerWidth();
            var ih = je.innerHeight();
            var w = je.width();
            var h = je.height();

            var style_of_e = getComputedStyle(e);

            jouter[0].style[transformStyle] = "translate3d("+(p.left-style_of_e.marginLeft.replace("px",""))+"px, "+(p.top-style_of_e.marginTop.replace("px",""))+"px,0) scale3d("+ow/500+","+oh/500+",1)";
            jouter[0].style.opacity = "1";
            jinner[0].style[transformStyle] = "translate3d("+p.left+"px, "+p.top+"px,0) scale3d("+iw/500+","+ih/500+",1)";
            jinner[0].style.opacity = "1";
        }
        //original_console_log.apply(window.console,["highlight2",e, jc]);
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
    console.log("Revision: "+exposed.revision);

    return exposed;
})();
