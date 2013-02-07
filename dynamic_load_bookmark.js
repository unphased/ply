(function(){
    // serial script loading 
    function load(url,cb){var x=document.body.appendChild(document.createElement('script'));x.src=url;if (cb){x.onload=cb;}}
    load('http://code.jquery.com/jquery-1.8.3.min.js',function(){
        load('http://unphased.github.com/ply/debug.js',function(){            
            load('http://unphased.github.com/ply/ply.js',function(){
                load('http://unphased.github.com/ply/2ply.js'); // 2ply can be executed at any point to transparently augment functionality                

                // some basic UI to allow selection of features via my debug lib
                // In order to preserve regular site functionality as much as possible, 
                // a double-tap custom gesture is required to start selection mode.
                
                var tracked_elements = {};
                var tap_start_time = 0;
                PLY.attach_handlers_on_document({
                    mousedown: function(evt) {
                        var btn;
                        if (typeof(evt.which) !== "undefined")
                            btn = evt.which;
                        else if (typeof(evt.button) !== "undefined") 
                            btn = evt.button;
                        if (btn == 1) { // right mouse 
                            DEBUG.highlight(evt.target);
                            evt.preventDefault();
                        }
                    },
                    mouseup: function(evt) {
                        DEBUG.highlight(null);
                    },
                    touchstart: function(evt) {
                        if (Date.now() - tap_start_time < 300) {
                            // is second tap start
                            evt.preventDefault();
                            tracked_elements[evt.changedTouches[0].identifier] = true;
                        } // too much waiting, just function as normal
                        tap_start_time = Date.now();
                    },
                    touchmove: function(evt) {
                        for (var i=0; i<evt.changedTouches.length; ++i) {
                            if (tracked_elements[evt.changedTouches[i].identifier]) {
                                DEBUG.highlight(document.elementFromPoint(evt.changedTouches[i].clientX,evt.changedTouches[i].clientY), evt.changedTouches[i].identifier)
                            }
                        }
                    },
                    touchend: function(evt) {
                        var hash={};
                        for (var i=0; i<evt.touches.length; ++i) {
                            hash[evt.touches[i].identifier] = true;
                        }
                        for (var x in tracked_elements) {
                            if (!hash[x]) {
                                delete tracked_elements[x];
                                DEBUG.highlight(null, x);
                            }
                        }
                    }
                });
            });
        });
    });
})();