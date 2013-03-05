var ply_$ = null;
(function(){
    "use strict";
    // serial script loading; if no cb provided, it will also be set as async
    function load(url,cb){var x=document.body.appendChild(document.createElement('script'));x.src=url;x.onload=function(){console.log("Dynamically loaded "+url);if(cb){cb();}};if(!cb){x.setAttribute('async','')}}

    // BEGIN parallel script loading (one-shot), could perhaps be using jQuery deferred/promises
    // but I *really* like the elegant simplicity of my approach here
    var async_load = function(resources_array, cb_all_done){
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
    };
    // END parallel script loading (todo: make me into a gist)

    var resources = [
        {url: "https://ajax.googleapis.com/ajax/libs/jquery/1.9.1/jquery.min.js", tag: "script", cb: 
            (window.jQuery?function(){ ply_$ = $.noConflict(true) }:null)
            // To explain this a bit: only if jQuery already exists on the page we're injecting to should noConflict
            // be invoked. Otherwise, our up-to-date jQuery will be enabled like normal. This is the best of all worlds
        },
        {url: "https://raw.github.com/unphased/ply/master/modernizr-2.6.2.min.js", tag: "script"}
    ];

    // if jQuery of a sufficiently recent pedigree is present then 
    if (window.jQuery) {
        var jqv = jQuery().jquery.split(".");
        if (jqv[0]>=1&&jqv[1]>=8) {
            resources.splice(0,1);
            console.log("jQuery >= 1.8.0 present("+jQuery().jquery+"), not loading latest jQuery.");
        }
    }

    async_load(resources,function(){
        load("https://raw.github.com/unphased/ply/master/debug.js",function(){
            load('https://raw.github.com/unphased/ply/master/ply.js',function(){
                load('https://raw.github.com/unphased/ply/master/ply_L2.js');
                /*global PLY:false DEBUG:false*/

                // defines some UI to allow selection of features via my debug lib
                // In order to preserve regular site functionality as much as possible, 
                // a double-tap custom gesture is required to start selection mode.
                
                var start_time = 0;
                var highlight_active = false;
                var mouse_down_at;
                var element_selected; 
                var enable_ctx_menu = true;
                PLY.attach_handlers_on_document({
                    keyup: function(evt) {
                        // secret shortcut keys 
                        if (evt.shiftKey && evt.altKey && evt.ctrlKey) {
                            switch (evt.which) {
                                case 65: // a
                                    highlight_active = true;
                                break;
                                case 66: // b
                                break;
                                default:
                                break;
                            }
                        }
                        if (evt.which === 27) { // esc should abort immediate action
                            // currently aborts *everything*
                            element_selected = null;
                            DEBUG.focused(null);
                            highlight_active = false;
                            DEBUG.highlight(null);
                        }
                    },
                    mousedown: function(evt) { //console.log("mousedown");
                        mouse_down_at = {x: evt.clientX, y: evt.clientY};
                        enable_ctx_menu = true;
                        if (evt.which === 3) {
                            //evt.preventDefault(); // this appears to not be able to prevent context menu
                            if (!evt.shiftKey) { 
                                DEBUG.highlight(evt.target, DEBUG.get_focused());
                                element_selected = evt.target;
                                highlight_active = true;
                            }
                        } else if (evt.which === 1) {
                            // treat double-click also as starting selection (nice for touchpad users)
                            if (Date.now() - start_time < 300) {
                                evt.preventDefault(); // this hopefully suppresses selection of text. 
                                DEBUG.highlight(evt.target, DEBUG.get_focused());
                                element_selected = evt.target;
                                highlight_active = true;
                            }
                            start_time = Date.now();
                        }
                    },
                    // a right-click overload (very nice for mouse users)
                    // unfortunately does break on OS X due to ctxmenu event 
                    // coming in before the mouseup. There is a workaround though
                    // and that is hold Shift to get the menu :)
                    contextmenu: function(evt) { 
                        if (!enable_ctx_menu || highlight_active) {
                            evt.preventDefault();
                        }
                    },
                    mouseup: function(evt) { //console.log("mouseup");
                        if (highlight_active) {
                            if (enable_ctx_menu && evt.which === 3) { // if we're about to trigger ctxmenu
                                // do not go on to select, just abort the action
                                highlight_active = false;
                                DEBUG.highlight(null);
                                // not interfere with focused 
                            } else {
                                highlight_active = false;
                                DEBUG.highlight(null);
                                DEBUG.focused(element_selected); 
                            }
                        }
                    },
                    mousemove: function(evt) {
                        if (mouse_down_at && (Math.abs(mouse_down_at.x-evt.clientX) + Math.abs(mouse_down_at.y-evt.clientY)) > 5) {
                            enable_ctx_menu = false;
                        }
                    }, 
                    mouseover: function(evt) { //console.log("highlight_active",highlight_active);
                        if (highlight_active) {
                            DEBUG.highlight(evt.target);
                            element_selected = evt.target;
                        }
                    },
                    touchstart: function(evt) {
                        // todo: make this not depend on clean start (i.e. allow double tap with non first finger)
                        if (Date.now() - start_time < 300 && evt.touches.length === 1) {
                            // is second tap start
                            evt.preventDefault(); // stop scroll, stop "copy" popup and selector 
                            highlight_active = true;
                            DEBUG.highlight(evt.target, DEBUG.get_focused());
                            element_selected = evt.target;
                        } 
                        // if not fast enough, just function as normal
                        start_time = Date.now();
                    },
                    touchmove: function(evt) {
                        if (highlight_active) {
                            var e = document.elementFromPoint(evt.changedTouches[0].clientX,evt.changedTouches[0].clientY);
                            DEBUG.highlight(e);
                            element_selected = e;
                        }
                    },
                    touchend: function(evt) {
                        // todo: make me a bit less dumb by remembering the finger ID of the triggering finger
                        if (evt.touches.length === 0 && highlight_active) { 
                            // no touches = terminate selection
                            DEBUG.highlight(null);
                            DEBUG.focused(element_selected);
                            highlight_active = false;
                        }
                    }
                }); // PLY.attach_handlers_on_document
            }); // load(ply.js)
        });
    }); // async_load call
})(); // function wrapper