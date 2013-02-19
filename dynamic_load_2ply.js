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
                var select_active = false;
                var mouse_down_at;
                var element_selected; 
                var enable_ctx_menu = true;
                PLY.attach_handlers_on_document({
                    keydown: function(evt) {
                        // secret shortcut keys 
                        if (evt.shiftKey && evt.altKey && evt.ctrlKey) {
                            switch (evt.which) {
                                case 65: // a
                                    select_active = true;
                                break;
                                case 66: // b
                                break;
                                default:
                                break;
                            }
                        }
                        if (evt.which === 27) { // esc
                            if (element_selected) {
                                element_selected = null;
                                DEBUG.focused(null);
                            }
                        }
                    },
                    mousedown: function(evt) { //console.log("mousedown");
                        mouse_down_at = {x: evt.clientX, y: evt.clientY};
                        enable_ctx_menu = true;
                        if (evt.which === 3) {
                            //evt.preventDefault(); // this appears to not be able to prevent context menu
                            if (!evt.shiftKey) { 
                                select_active = true;
                                DEBUG.highlight(evt.target);
                                element_selected = evt.target;
                            }
                        } else if (evt.which === 1) {
                            // treat double-click also as starting selection (nice for touchpad users)
                            if (Date.now() - tap_start_time < 300) {
                                evt.preventDefault(); // hopefully this can suppress selection of text. 
                                DEBUG.highlight(evt.target);
                                element_selected = evt.target;
                                select_active = true;
                            }
                           tap_start_time = Date.now();
                        }
                    },
                    // a right-click overload (very nice for mouse users)
                    // unfortunately does break on OS X due to ctxmenu event 
                    // coming in before the mouseup. There is a workaround though
                    // and that is hold Shift to get the menu :)
                    contextmenu: function(evt) { console.log("ctxmenu ecm, ha:",enable_ctx_menu,select_active);
                        if (!enable_ctx_menu || select_active) {
                            evt.preventDefault();
                        }
                    },
                    mouseup: function(evt) { console.log("mouseup");
                        if (select_active) {
                            if (enable_ctx_menu) { // if we've not moved outside 
                                // do not go on to select, just abort the action
                                select_active = false;
                                DEBUG.highlight(null);
                                // not interfere with focused 
                            } else {
                                select_active = false;
                                DEBUG.highlight(null);
                                DEBUG.focused(element_selected); 
                                //element_selected = null;
                            }
                        }
                    },
                    mousemove: function(evt) {
                        if (mouse_down_at && (Math.abs(mouse_down_at.x-evt.clientX) + Math.abs(mouse_down_at.y-evt.clientY)) > 5) {
                            enable_ctx_menu = false;
                        }
                    }, 
                    mouseover: function(evt) { console.log("select_active",select_active);
                        if (select_active) {
                            DEBUG.highlight(evt.target);
                            element_selected = evt.target;
                        }
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