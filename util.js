  ////////////////////////////////////////////////
 /// slu's JS browser debug/util layer deluxe ///
////////////////////////////////////////////////

// util.js contains a set of tools. Use as a shared library. Keeping it DRY. 

var UTIL = (function ($) {
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
    
    return {
        async_load: async_load
    };
})(jQuery);