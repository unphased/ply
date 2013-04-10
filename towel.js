  ////////////////////////////////////////////////
 /// slu's JS browser debug/util layer deluxe ///
////////////////////////////////////////////////

// towel.js contains a set of utilities. It is for keeping things DRY.
// There is occasionally some overlap with jQuery's good stuff.
// Modernizr is used a little bit for the sake of brevity.


var UTIL = (function () {
    /*global assert:true, Modernizr:false*/
    //"use strict"; // temporarily comment out to let safari's debugger through

    // util is the first included script usually: initializes release mode assert
    assert = function () {};

    // for scoped iteration over an object (clean version of jquery each)
    // f receives args (key, value)
    function each(obj, f) {
        for (var i in obj) {
            f(i, obj[i]);
        }
    }

    // iterates through array (which as you know is a hash), via a for loop over integers
    // f receives args (value, index)
    function array_each(arr, f) {
        var l = arr.length; // will die if you modify the array in the loop function. BEWARE
        for (var i=0; i<l; ++i) {
            f(arr[i], i);
        }
    }

    function array_each_reverse(arr, f) {
        var l = arr.length; // will die if you modify the array in the loop function. BEWARE
        for (var i=l-1; i>=0; --i) {
            f(arr[i], i);
        }
    }

    // parallel script loading, could perhaps be using jQuery deferred/promises
    // but I *really* like the elegant simplicity of my approach here
    // can put in potentially null entries in array (they will be cleanly skipped)
    // Sample (not very dry example) usage:

    // resources = [
    //     window.jQuery ? {
    //         url: "https://ajax.googleapis.com/ajax/libs/jquery/1.9.1/jquery.min.js",
    //         tag: "script",
    //         cb: function(){ ply_$ = $.noConflict(true) }
    //     } : {
    //         url: "https://ajax.googleapis.com/ajax/libs/jquery/1.9.1/jquery.min.js",
    //         tag: "script"
    //     },
    //     {url: "https://raw.github.com/unphased/ply/master/modernizr-2.6.2.min.js", tag: "script"}
    // ];

    function async_load(resources_array, cb_all_done){
        var total_remaining = resources_array.length;
        array_each(resources_array, function(e) { if (e) {
            if (typeof e === 'string') e = {url: e};
            e.tag = e.tag || 'script';
            var tag = document.body.appendChild(document.createElement(e.tag));
            tag.src = e.url;
            for (var attr in e.attrs) { tag.setAttribute(attr, e.attrs[attr]) }
            if (e.tag == 'script') // auto-add async attr to script
                tag.setAttribute('async','');
            tag.onload = function(){
                if (e.cb) e.cb();
                total_remaining--;
                console.log("Dynamically loaded "+e.url+", "+total_remaining+" parallel scripts left to load");
                if (total_remaining === 0)
                    cb_all_done();
            };
        }});
    }

    // synchronous dynamic script loading.
    // takes an array of js url's to be loaded in that specific order.
    // assembles an array of functions that are referenced more directly rather than
    // using only nested closures. I couldn't get it going with the closures and gave up on it.
    function js_load(resources, cb_done) {
        var cb_list = []; // this is not space optimal but nobody gives a damn
        array_each(resources, function(r, i) {
            cb_list[i] = function() {
                var x = document.body.appendChild(document.createElement('script'));
                x.src = r;
                x.onload = function() {
                    console.log("Dynamically loaded "+r+" via js_load");
                    if (i === resources.length-1) {
                        cb_done();
                    } else {
                        cb_list[i+1]();
                    }
                };
            };
        });
        cb_list[0]();
    }

    // combined synchronous and asynchronous dynamic script loading scripting sugar.
    // takes a nested hash (js object) that encodes both the dependency graph
    // and whatever actions need to be taken during the loading process. Usage example follows

    // resources = {
    //     "https://ajax.googleapis.com/ajax/libs/jquery/1.9.1/jquery.min.js": {
    //         tag: "script",
    //         cb: function(){ ply_$ = $.noConflict(true) }
    //     },
    //     "https://raw.github.com/unphased/ply/master/modernizr-2.6.2.min.js": true
    // ];
    function load_js_dependency_tree(resources, cb_all_done) {

    }

    var transEndEventNames = {
        'WebkitTransition' : 'webkitTransitionEnd',
        'MozTransition'    : 'transitionend',
        'OTransition'      : 'oTransitionEnd',
        'msTransition'     : 'MSTransitionEnd',
        'transition'       : 'transitionend'
    };
    var transEndEventName = transEndEventNames[ Modernizr.prefixed('transition') ];
    var transformStyle = Modernizr.prefixed('transform');

    if (!Modernizr.testAllProps('animationName'))
        alert("@keyframes are not supported");
    var keyframesPrefixed = hyphen_mp('animationName').replace('animation-name','keyframes');

    function hyphen_style(style) {
        return style.replace(/([A-Z])/g, function(str,m1){ return '-' + m1.toLowerCase(); }).replace(/^ms-/,'-ms-');
    }

    function hyphen_mp(style) {
        return hyphen_style(Modernizr.prefixed(style));
    }

    var transitionDurationStyle = Modernizr.prefixed('transitionDuration');

    function inject_css(css) {
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
    }

    function attach_handlers_on_document(handler_map, profile_list) {
        each(handler_map, function (event_name,v) {
            if (!v) return;
            var prof_v;
            var h_args = arguments, v_wrap = function () { v.apply(arguments.callee.caller, h_args); };
            if (window.DEBUG && profile_list && profile_list[event_name]) {
                prof_v = window.DEBUG.instrument_profile_on(v_wrap,event_name,30);
            }
            document.addEventListener(event_name, function() {
                // in debug mode (i.e. if debug.js is included) all exceptions originating from
                // this handler maker are caught and reported to debug elements if present

                if (window.DEBUG && profile_list && profile_list[event_name] && !prof_v) {
                    // dynamic profiled routine generation
                    prof_v = window.DEBUG.instrument_profile_on(v_wrap,event_name,30);
                }
                if (window.DEBUG && window.DEBUG.enabled) {
                    try {
                        if (prof_v && window.DEBUG.profiles[event_name].enabled) {
                            prof_v();
                        }
                        v_wrap();
                    } catch (e) {
                        // show the error to the DOM to help out for mobile (also cool on PC)
                        window.DEBUG.error(e);
                        throw e; // rethrow to give it to debugging safari, rather than be silent
                    }
                    window.DEBUG.event_processed = true;
                } else if (window.DEBUG && prof_v && window.DEBUG.profiles[event_name].enabled) {
                    prof_v();
                } else {
                    v_wrap();
                }
            }, true);
            // hook to capture phase to catch in the event of stopPropagation()
        });
    }

    return {
        each: each,
        array_each: array_each,
        async_load: async_load,
        js_load: js_load,
        transEndEventName: transEndEventName,
        transformStyle: transformStyle,
        hyphen_mp: hyphen_mp,
        transitionDurationStyle: transitionDurationStyle,
        injectCSS: inject_css,
        attach_handlers_on_document: attach_handlers_on_document
    };
})();