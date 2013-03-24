  ////////////////////////////////////////////////
 /// slu's JS browser debug/util layer deluxe ///
////////////////////////////////////////////////

// towel.js contains a set of utilities. It is for keeping things DRY. 

var UTIL = (function () {
    //"use strict"; // temporarily comment out to let safari's debugger through
    
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
    function js_load(resources, cb_done) {
        var cur_cont = cb_done; // this strange continuation passing procedural programming style is ... strangely fun 
        // So this is an iterative approach that makes a nested "function stack" where 
        // the inner functions are hidden inside the closures. 
        array_each_reverse(resources, function(r) {
            var tmp_f = function() {
                var x = document.body.appendChild(document.createElement('script'));
                x.src = r;
                console.log("loading "+r);
                // epic not-quite-recursion. I don't even know what this is called. It's inside-out.
                x.onload = function() { console.log("js_load: loaded "+r); cur_cont(); }; // TODO: get rid of this function creation once we know it works right 
            };
            cur_cont = tmp_f; // do not make the function recursive. We're generating a closure with it inside. 
        });
        cur_cont();
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
    
    return {
        each: each,
        async_load: async_load,
        js_load: js_load
    };
})();