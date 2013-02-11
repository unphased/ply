(function(){
    // serial script loading 
    function load(url,cb){var x=document.body.appendChild(document.createElement('script'));x.src=url;if (cb){x.onload=cb;}}
    load('http://code.jquery.com/jquery.min.js',function(){
        load('http://unphased.github.com/ply/debug.js',function(){            
            load('http://unphased.github.com/ply/ply.js',function(){
                load('http://unphased.github.com/ply/2ply.js'); // 2ply can be executed at any point to transparently augment functionality                

                // some basic UI to allow selection of features via my debug lib
                // In order to preserve regular site functionality as much as possible, 
                // a double-tap custom gesture is required to start selection mode.
                
                var tracked_elements = {};
                var tap_start_time = 0;
                var highlight_active = false;
                PLY.attach_handlers_on_document({
                    keydown: function(evt) {
                        if (evt.shiftKey && evt.altKey && evt.ctrlKey) {
                            switch (evt.which) {
                                case 65: // a
                                    highlight_active = true;
                                break;
                            }
                        }
                    },
                    mousedown: function(evt) {
                        if (evt.which === 3) { // middle mouse btn (prolly indicates right button on IE. Screw you IE)
                            DEBUG.highlight(evt.target);
                            //evt.preventDefault(); // this appears to not be able to prevent context menu
                            highlight_active = true;
                        } else if (evt.which === 1) {
                            if (Date.now() - tap_start_time < 300) {
                                evt.preventDefault(); // hopefully this can suppress selection of text. 
                                DEBUG.highlight(evt.target);
                                highlight_active = true;
                            }
                           tap_start_time = Date.now();
                        }
                    },
                    contextmenu: function(evt) {
                        evt.preventDefault();
                    },
                    mouseup: function(evt) {
                        highlight_active = false;
                        DEBUG.highlight(null);
                    },
                    mouseover: function(evt){
                        if (highlight_active)
                            DEBUG.highlight(evt.target);                        
                    },
                    touchstart: function(evt) {
                        if (Date.now() - tap_start_time < 300) {
                            // is second tap start
                            evt.preventDefault(); // stop scroll 
                            tracked_elements[evt.changedTouches[0].identifier] = true;
                        } // too much waiting, just function as normal
                        tap_start_time = Date.now();
                    },
                    touchmove: function(evt) {
                        for (var i=0; i<evt.changedTouches.length; ++i) {
                            if (tracked_elements[evt.changedTouches[i].identifier]) {
                                DEBUG.highlight(document.elementFromPoint(evt.changedTouches[i].clientX,evt.changedTouches[i].clientY), evt.changedTouches[i].identifier);
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