  ////////////////////////////////////////////////
 /// slu's JS browser debug/util layer deluxe ///
////////////////////////////////////////////////

// towel.js contains a set of utilities. It is for keeping things DRY. 

var TOWEL = (function () {
    "use strict";
    
    // parallel script loading, could perhaps be using jQuery deferred/promises
    // but I *really* like the elegant simplicity of my approach here
    // can put in potentially null entries in array (they will be cleanly skipped)
    // Sample usage: 

    // var resources = [
    //     window.jQuery ? {
    //         url: "https://ajax.googleapis.com/ajax/libs/jquery/1.9.1/jquery.min.js",
    //         tag: "script", 
    //         cb: function(){ ply_$ = $.noConflict(true) }
    //     } : null,
    //     {url: "https://raw.github.com/unphased/ply/master/modernizr-2.6.2.min.js", tag: "script"}
    // ];

    function async_load(resources_array, cb_all_done){
        var total_remaining = resources_array.length;
        var queue = resources_array.map(function(e){
            var elem = document.body.appendChild(document.createElement(e.tag));
            elem.src = e.url;
            for (var attr in e.attrs) {
                elem.setAttribute(attr, e.attrs[attr]);
            }
            if (e.tag == "script") // auto-add async attr to script
                elem.setAttribute('async','');
            var x = {url: e.url, loaded: false};
            elem.onload = function(){
                if (e.cb) e.cb();
                total_remaining--;
                x.loaded = true;
                console.log("Dynamically loaded "+e.url);
                if (total_remaining === 0)
                    cb_all_done();
            };
            return x;
        });
    }

    // for scoped iteration over an object (clean version of jquery each)
    // if you need a comment to show you how to use this fn, you might wanna think twice about what you're doing. 
    function each(obj, f) {
        for (var i in obj) {
            f(i, obj[i]);
        }
    }

    // named this way because "each" functions generally are for iterating over obj/hashes
    // but for an array we must ensure the order
    // cb receives index and item
    function each_reverse_on_array(array, cb) {

    }

    function loadjs(resources, cb_done) {
        if (Array.isArray(resources)) {
            var cur_cont = cb_done; // this strange continuation passing procedural programming style is ... strangely fun 
            for (var i=resources.length-1; i>=0; --i) {
                var next_cb = function() {

                };
            }
        } else {
            var x=document.body.appendChild(document.createElement('script'));
            x.src=url;
            x.onload=function(){
                console.log("Dynamically loaded "+url);
                if(cb){cb();}
            };
            if(!cb){
                x.setAttribute('async','')
            }
        }
    }
    
    return {
        each: each,
        // each_reverse_on_array: each_reverse_on_array,
        async_load: async_load,
        loadjs: loadjs
    };
})();