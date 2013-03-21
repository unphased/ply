  ////////////////////////////////////////////////
 /// slu's JS browser debug/util layer deluxe ///
////////////////////////////////////////////////

/// Please include prior to loading libraries that depend on it
/// Primarily provides functionality for live DOM manipulation style debugging
/// which was used heavily throughout development of ply.js.
/// You will be able to access exposed features through window.DEBUG.

// there are a few special DOM id's:
// #debug_log
// #log_buffer_dump

/*global Modernizr:false ply_$:false*/
var DEBUG = (function($) {
    "use strict";

	var AssertException, assert;
    
    AssertException = function (message) { this.message = message; };
    AssertException.prototype.toString = function () {
        return 'AssertException: ' + this.message;
    };

    assert = function (exp, message) {
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
        if (typeof arg === "undefined") return "undefined";
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
   
    var git_context = "#% 92150a1 taking it out %#";

    var datenow = Date.now?Date.now:function(){return (new Date()).getTime();};

    function is_touch_device() {
        return !!('ontouchstart' in window) || 
            !!('onmsgesturechange' in window); // works on ie10
    }

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

    if (is_touch_device()) 
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
        log_buffer.push('<div class="error">'+e.toString()+" at "+e.stack+"</div>");
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

    var transEndEventNames = {
        'WebkitTransition' : 'webkitTransitionEnd',
        'MozTransition'    : 'transitionend',
        'OTransition'      : 'oTransitionEnd',
        'msTransition'     : 'MSTransitionEnd',
        'transition'       : 'transitionend'
    }; 
    var transEndEventName;
    var transformStyle = Modernizr.prefixed('transform');

    if (!Modernizr.testAllProps('animationName')) { alert("@keyframes are not supported"); }
    var keyframesPrefixed = hyphen_mp('animationName').replace('animation-name','keyframes');

    function hyphen_style(style) {
        return style.replace(/([A-Z])/g, function(str,m1){ return '-' + m1.toLowerCase(); }).replace(/^ms-/,'-ms-');
    }

    function hyphen_mp(style) {
        return hyphen_style(Modernizr.prefixed(style));
    }

    var transitionDurationStyle = Modernizr.prefixed('transitionDuration');

    var css = //"body { "+hyphen_mp('backfaceVisibility')+": hidden; "+hyphen_mp('perspective') + ": 1000; }\n" +
        "#debug_element_container { \n" +
        "\tposition: absolute; \n" +
        "\tpointer-events: none; \n" +
        "\ttop: 0; left: 0; \n" +
        "\toverflow: visible; z-index: 2147483647; \n\t" +
        //hyphen_mp('transform') + ": translate3d(0,0,-1px);\n\t" + 
        //hyphen_mp('backfaceVisibility') + ": hidden;\n\t" + 
        //hyphen_mp('transformStyle') + ": preserve-3d;\n\t" +
        //hyphen_mp('perspective') + ": 1000;\n" +
        "width: 100; height: 100; \n} \n" +
        "#debug_element_container > div { \n\t" +
        hyphen_style(transitionDurationStyle) + ": 0.4s, 0.4s, 0.4s; \n\t" + 
        hyphen_mp('transitionProperty') + ": "+hyphen_mp('transform')+", opacity, background-color; \n\t" +
        hyphen_mp('transformOrigin') + ": 0 0; \n\t" + 
        hyphen_mp('transitionTimingFunction') + ": cubic-bezier(0.500, 0.500, 0.200, 1.000), linear; \n\t" +
        //hyphen_mp('backfaceVisibility') + ": hidden;\n\t" + 
        //hyphen_mp('perspective') + ": 1000;\n\t" +
        //hyphen_mp('transformStyle') + ": preserve-3d;\n\t" +
        "position: absolute; top: 0; left: 0; \n" + 
        "\tpointer-events: none; height: 500px; width: 500px; \n} \n" + 
        "#debug_element_highlighter_outer {\n\tbackground-color: rgba(45,60,255,0.2); \n} \n" + 
        "#debug_element_highlighter_inner {\n\tbackground-color: rgba(25,255,35,0.2); \n} \n" + 
        "@"+keyframesPrefixed+" pulsate_opacity {\n\tfrom {\n\t\topacity: 0.5;\n\t}\n\tto {\n\t\topacity: 1;\n\t}\n}\n" + 
        "#debug_element_focused {\n\t" + 
        "background-color: rgba(255,150,25,0.3);\n}" + 
        ".pulsate_opacity {\n\t" +
        hyphen_mp('animationName') + ": pulsate_opacity;\n\t" + 
        hyphen_mp('animationIterationCount') + ": infinite;\n\t" + 
        hyphen_mp('animationDirection') + ": alternate;\n\t" + 
        hyphen_mp('animationTimingFunction') + ": ease;\n\t" + 
        hyphen_mp('animationDuration') + ": 1.1s;\n\t" + 
        hyphen_mp('animationDelay') + ": -1.1s;\n\t" + 
        //hyphen_mp('animationFillMode') + ": both;\n" + 
        "} \n";

    // append a style tag to head 
    var head = document.getElementsByTagName("head")[0];
    var style = document.createElement("style");
    style.type = "text/css";
    if (style.styleSheet){
        style.styleSheet.cssText = css;
    } else {
        style.appendChild(document.createTextNode(css));
    }
    head.appendChild(style);

    transEndEventName = transEndEventNames[ Modernizr.prefixed('transition') ];

    //var show_border_highlights = false;
    var highlight_last_invoked_with = null;
    // an interface for portably highlighting any page element (without doing anything to it)
    // start_from determines the animation source for initializing the highlight. It can be 
    // either an element (in which case its measurements are obtained with jQuery like usual)
    // or a more optimized datastructure that holds the geometry data for direct use
    // leaving start_from falsy == fade in starting from global page shape 
    // obviously has no effect on the intermediate calls to highlight (as they automatically
    // transition from current position)
    function highlight(e, start_from) {
        if (highlight_last_invoked_with === e) { // highlight invoked on the same target
            return; // an optimization
        }
        console.log("highlight",e,start_from);
        // lazily init top level element 
        var jc = $("#debug_element_container");
        if (jc.length === 0) {
            $("html").append("<div id=debug_element_container></div>");
            jc = $("#debug_element_container");
        }
        var jouter = jc.children("#debug_element_highlighter_outer");
        var outer = jouter[0];
        var jinner = jc.children("#debug_element_highlighter_inner");
        var inner = jinner[0];
        //console.log('highlight1', jouter.length)
        if (!e) { // remove command: remove if present
            if (!outer) return;
            // fade out
            jouter.on(transEndEventName,function(){
                jouter.remove(); // erase me
                jinner.remove();
                //console.log("removed");
            });
            
            // uses a static width to animate by (this is the fade out anim), not a proportional one. Good visual effect.
            var ws = (outer.ply_HL_dimX + 20) / outer.ply_HL_dimX; 
            var hs = (outer.ply_HL_dimY + 20) / outer.ply_HL_dimY; 
            outer.style.opacity = "0";
            outer.style[transformStyle] = "translate(-10px, -10px) "+outer.style[transformStyle]+" scale3d("+ws+", "+hs+", 1)";
            ws = (inner.ply_HL_dimX - 10) / inner.ply_HL_dimX;
            hs = (inner.ply_HL_dimY - 10) / inner.ply_HL_dimY;
            inner.style.opacity = "0";
            inner.style[transformStyle] = "translate(5px, 5px) "+inner.style[transformStyle]+" scale3d("+(ws<=0.1?0.1:ws)+", "+(hs<=0.1?0.1:hs)+", 1)";
        } else {
            jouter.off(transEndEventName);
            //console.log("running the update");
            if (!outer) { // update command: add if not present
                assert(!inner, "outer does not exist so neither should inner"); // just a sanity check
                var css_set = {opacity: 0};
                //css_set[local_Modernizr.prefixed('backfaceVisibility')] = "hidden";
                if (start_from) {
                    if (start_from instanceof HTMLElement) {
                        var jsf = $(start_from);
                        var jsfp = jsf.offset();
                        css_set[transformStyle] = "translate3d("+jsfp.left+"px,"+jsfp.top+"px,0) scale3d("+jsf.outerWidth()/500+","+jsf.outerHeight()/500+",1)";
                    } else {
                        css_set[transformStyle] = "translate3d("+start_from.left+"px,"+start_from.top+"px,0) scale3d("+start_from.owf/500+","+start_from.ohf/500+",1)";
                    }
                } else {
                    css_set[transformStyle] = "scale3d("+document.documentElement.scrollWidth/500+","+document.documentElement.scrollHeight/500+",1)";
                }
                var jo = $('<div id="debug_element_highlighter_outer"></div>').css(css_set);
                var ji = $('<div id="debug_element_highlighter_inner"></div>').css(css_set);
                // insert to DOM
                jc.append(jo);
                jc.append(ji);
                jouter = jo; outer = jouter[0];
                jinner = ji; inner = jinner[0];
            }
            var je = $(e);
            var p = je.offset();
            var ow = je.outerWidth(true);
            var oh = je.outerHeight(true);
            var owf = je.outerWidth(); // outside border (corresponds with offset)
            var ohf = je.outerHeight(); 
            // if (show_border_highlights) {
            //     var iw = je.innerWidth(); // incl padding (inside border)
            //     var ih = je.innerHeight();
            // }
            var w = je.width();
            var h = je.height();

            var style_of_e = getComputedStyle(e); 
            //console.log("soe",style_of_e);

            var transOuter = "translate3d("+
                (p.left-parseInt(style_of_e.marginLeft,10))+"px, "+
                (p.top-parseInt(style_of_e.marginTop,10))+"px,0) scale3d("+
                ow/500+","+oh/500+",1)";
            outer.style[transformStyle] = transOuter;
            outer.style.opacity = "1";
            outer.ply_HL_dimX = ow;
            outer.ply_HL_dimY = oh;
            if (parseInt(style_of_e.marginLeft,10) < 0 || parseInt(style_of_e.marginTop,10) < 0 || parseInt(style_of_e.marginRight,10) < 0 || parseInt(style_of_e.marginBottom,10) < 0) {
                // if a negative margin exists, mark the extents of the margin out more prominently
                outer.style.backgroundColor = "rgba(255,40,20,0.5)";
            } else {
                outer.style.backgroundColor = ""; // unset
            }
            var transInner = "translate3d("+
                (p.left+parseInt(style_of_e.paddingLeft,10)+
                    parseInt(style_of_e.borderLeftWidth,10))+"px, "+
                (p.top+parseInt(style_of_e.paddingTop,10)+
                    parseInt(style_of_e.borderTopWidth,10))+"px,0) scale3d("+
                w/500+","+h/500+",1)";
            inner.style[transformStyle] = transInner;
            inner.style.opacity = "1";
            inner.ply_HL_dimX = w;
            inner.ply_HL_dimY = h;
            //console.log("O",transOuter);
            //console.log("I",transInner); 
        }
        //original_console_log.apply(window.console,["highlight2",e, jc]);
        highlight_last_invoked_with = e;
    }

    var focused_element;
    function focused(e) {
        focused_element = e;
        //console.log("focused",e);
        // lazily init
        var jc = $("#debug_element_container");
        if (jc.length === 0) {
            $("html").append("<div id=debug_element_container></div>");
            jc = $("#debug_element_container");
        }
        var jfocus = jc.children("#debug_element_focused");
        var focus = jfocus[0];
        if (e) { // setting 
            jfocus.off(transEndEventName);
            jfocus.addClass('pulsate_opacity'); // for consistency
            var je = $(e);
            var p = je.offset();
            var ow = je.outerWidth();
            var oh = je.outerHeight();
            var transFocus = "translate3d("+p.left+"px,"+p.top+"px,0) scale3d("+ow/500+","+oh/500+",1)"; 
            if (jfocus.length === 0) { // jouter not present 
                // create. 
                var css_obj = {opacity: 0};
                var transStart = "translate3d("+(p.left+ow/2)+"px,"+(p.top+oh/2)+"px,0) scale3d(0,0,1)";
                css_obj[transformStyle] = transStart;
                jfocus = $('<div id="debug_element_focused"></div>').css(css_obj);
                jc.append(jfocus);
                focus = jfocus[0];
                assert(window.getComputedStyle(focus).getPropertyValue('opacity') === "0"); // must ensure this does not get optimized out
                focus.style.opacity = "1";
                focus.style[transformStyle] = transFocus;
                jfocus.on(transEndEventName, function() {
                    jfocus.off(transEndEventName);
                    jfocus.addClass('pulsate_opacity');
                });
                /* setTimeout(function(){ // alternatively we can do a getComputedStyle
                },0); */
            } else {
                focus.style[transformStyle] = transFocus; 
            }
            //focus.ply_HL_dimX = ow;
        } else if (focus) { // removing 
            // must normalize for browsers that don't interpolate starting with ending animation value
            focus.style[transitionDurationStyle] = "0"; // put in state that lets me directly set opacity
            // obtain current opacity level (dictated by animation),
            // simultaneously putting the durationstyle change into effect
            var opacity_now = window.getComputedStyle(focus).getPropertyValue('opacity'); 
            focus.style.opacity = opacity_now; // set the opacity of the element to what it is now
            jfocus.removeClass('pulsate_opacity'); // cause animation to terminate
            window.getComputedStyle(focus).getPropertyValue('opacity'); // function call forces style reflow
            focus.style[transitionDurationStyle] = ""; // re-enable the transitions
            focus.style.opacity = "0"; // initiate fade out
            jfocus.on(transEndEventName, function(){ // handles fade out completion 
                jfocus.remove();
            });
        }
    }
    function get_focused() {
        return focused_element;
    }


    // use some magic (like getBoundingClientRect) 
    // to support visualization of more elements than jQuery does out of the box
    // such as SVG <g> elements. Oh, also, do account for transforms as well. 
    // and wouldn't hurt either to account for scroll offset (which may be custom or builtin -- sigh)
    // Also uses the element specific text display through this
    // (gotta think about whether these text tips, and also the 
    // size measurements and position (and showing a removal animation upon removal)
    // of the marker indicators can be made to listen to dynamic changes due to
    // existing, independent client scripting.) 

    // the initial implementation will use a timed polling approach to achieve responsiveness 
    // to page dynamism; transitioning to event/observer based responsiveness comes later 
    // because that is one of those diminishing ROI situations. 

    // With that in mind, then this function's scope is simply to evaluate the state of 
    // its target element and manage the instrumentation of indicator elements according
    // to the specified indicator state 

    // architecturally, this function handles setting the visible indicative styles 
    // present on a single element on the page. This is a more or less trivial state machine;
    // the indicator_state is a string that specifies what the indication of this element
    // will become. Whatever is specified will be applied (and transitioned to). 
    function indication(item, indicator_state) {
        
    }

    // this is the one that encapsulates the previous highlight() and focus(), 
    // consolidates the logic for manipulating HW-Accel'd layers and their transitions
    // and their borders. region specifies which region (inner, with padding, with border, with margin)
    function indicator_pane(item, region) {}

    // placement is not trivial for this so it should be managed separately and appear on top of the 
    // indicator panes. 
    function indicator_text(item, offset) {

    }

    // A heads-up display in the sense that it pops up in your face. 
    // I use OSD (on-screen-display) as that term better describes the experience of this feature. 
    // This is for displaying the activation of global events with large text. 
    function OSD(item) {
        if (typeof item !== "string") { console.log("non-string item for OSD is not acceptable"); return; }
        // lazy init a container for holding and showing the display. They are to be shown horizontally centered and at the bottom of the window. 
    }

    // Exploratory work on fixed UI elements that stay in their position regardless of
    // zoom and pan of the browser **EXPERIMENTAL** (will most likely be subject to
    // zoom and limited to left and top sides, on touch platforms) 
    // pretty much any regular elements should be able to be dynamically manipulated
    // inside a HUD element and it should overlay everything 
    // This is for building static UI elements like an expanding scrolling view of 
    // the DOM structure of the HTML. 
    function HUD() {

    }

    // abstraction of a 3d-accelerated scrolling view? There might be enough semantic 
    // weight through the setting of CSS. 
    // function () {}


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
                var html = '<div class="error">'+e.toString()+" at "+e.stack+"</div>";
                $("#debug_log").prepend(html);
                error(e);
                throw e; // rethrow to give it to debugging safari, rather than be silent
            }
        });
    }

    // methods provided by debug
    var exposed = {
        enabled: true,
        assert: assert,
        escapeHtml: escapeHtml,
        serialize: serialize,
        isInDOM: isInDOM,
        revision: git_context.slice(3,-3), 
        clean_list: clean,
        highlight: highlight,
        focused: focused, 
        get_focused: get_focused,
        error: error,
        globalAsyncKeybind: globalAsyncKeybind,
     
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
