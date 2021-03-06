// This script is one an exception to the rule that code should function simply by
// failing to include debug.js prior to loading it.

(function() {
    /*global UTIL:false DEBUG:false Modernizr:false requestAnimationFrame:true cancelAnimationFrame:true PLY:false PLY_L2:false assert:false*/
    //"use strict"; // permissible to uncomment strict mode when in need of debugging
    var datenow = DEBUG.datenow;
    var lastTime = 0;
    var vendors = ['ms', 'moz', 'webkit', 'o'];
    for(var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
        window.requestAnimationFrame = window[vendors[x]+'RequestAnimationFrame'];
        window.cancelAnimationFrame = window[vendors[x]+'CancelAnimationFrame'] ||
            window[vendors[x]+'CancelRequestAnimationFrame'];
    }
    if (!window.requestAnimationFrame) {
        window.requestAnimationFrame = function(callback, element) {
            var currTime = datenow();
            var timeToCall = Math.max(0, 16 - (currTime - lastTime));
            var id = window.setTimeout(function() { callback(currTime + timeToCall); },
              timeToCall);
            lastTime = currTime + timeToCall;
            return id;
        };
    }

    if (!window.cancelAnimationFrame) {
        window.cancelAnimationFrame = function(id) {
            clearTimeout(id);
        };
    }

    // var transform_name = Modernizr.prefixed('transform');
    // var hide_transform = "translate3d(-99999px,-99999px,0)";

    var no_events_processed_for = 0;

    // be aware this routine sucks CPU a bit -- I use both rAF and window focus listening to make it friendlier
    // I am implementing this as a separate component rather than building it into the library. This is to decouple
    // the debug logic into the test page, and keep the library itself as lean and mean as it can reasonably be.
    function debug_refresh(time) {
        if (time < 1e12) {
            // we're getting new-style sub-ms time stamp
        }
        // schedule
        if (document.hasFocus())
            requestAnimationFrame(debug_refresh);
        else console.log("document has lost focus. Stopping rAF");

        if (!DEBUG.enable_debug_printing) return; // wait next tick (iOS does not issue window focus
                                // rAF start/restart won't work with toggling debug; ios simply wont fire rAF)
        if (!DEBUG.event_processed) {
            if (no_events_processed_for++ > 0) { // counts ticks (technically could be a boolean)
                return; // wait next tick
            }
        } else {
            no_events_processed_for = 0;
        }

        DEBUG.event_processed = false; // mark it updated: we're gonna go update the stuff.

        // Preventing a mess in PLY.pointer_state caused by .html() setting #debug
        var pp = PLY.pointer_state;
        for (var id in pp) {
            if (pp[id].e && !DEBUG.isInDOM(pp[id].e)) { // if not touch don't worry about it
                delete pp[id];
            }
        }

        // gonna do our sanity check for ply
        PLY.sanityCheck();

        if (debug_show_hide) {
            // skip the HTML debug dump of the data if its view is hidden

            var str = '<div>node_ids:</div><ol start="0">';
            // dump the contents of $.data(e,'ply') for e in exposed.node_ids
            for (var j=0;j<PLY.node_ids.length;++j) {
                str += "<li>"+DEBUG.escapeHtml(DEBUG.serialize($.data(PLY.node_ids[j],'ply')))+"</li>";
            }
            str += "</ol>";

            str += "<div>ply state:</div><ul>";
            // dump the contents of exposed
            for (var prop in PLY) {
                if (prop === "Modernizr") continue;
                str += "<li>" + prop + ": " + DEBUG.escapeHtml(DEBUG.serialize(PLY[prop])) + "</li>";
            }
            str += "</ul><div>ply L2 state:</div><ul>";
            for (var prop2 in PLY_L2) {
                str += "<li>" + prop2 + ": " + DEBUG.escapeHtml(DEBUG.serialize(PLY_L2[prop2])) + "</li>";
            }
            str += "</ul><div>revision: "+DEBUG.revision+"</div>";

            $("#debug").html(str);
        }

        /*
        // actual debug visualization of pointer locations
        if (!$('#pointer_marker_container').length) {
            $('#debug').before(
                '<div id="element_current_highlight_layers">'+
                    '<div class="element_current_highlight"></div>'+
                    '<div class="element_current_highlight"></div>'+
                    '<div class="element_current_highlight"></div>'+
                    '<div class="element_current_highlight"></div>'+
                    '<div class="element_current_highlight"></div>'+
                    '<div class="element_current_highlight"></div>'+
                    '<div class="element_current_highlight"></div>'+
                    '<div class="element_current_highlight"></div>'+
                    '<div class="element_current_highlight"></div>'+
                    '<div class="element_current_highlight"></div></div>'+
                '<div id="element_start_highlight_layers">'+
                    '<div class="element_start_highlight"></div>'+
                    '<div class="element_start_highlight"></div>'+
                    '<div class="element_start_highlight"></div>'+
                    '<div class="element_start_highlight"></div>'+
                    '<div class="element_start_highlight"></div>'+
                    '<div class="element_start_highlight"></div>'+
                    '<div class="element_start_highlight"></div>'+
                    '<div class="element_start_highlight"></div>'+
                    '<div class="element_start_highlight"></div>'+
                    '<div class="element_start_highlight"></div></div>'+
                '<div id="pointer_marker_container">'+
                    '<div class="pointer_marker"></div>'+
                    '<div class="pointer_marker"></div>'+
                    '<div class="pointer_marker"></div>'+
                    '<div class="pointer_marker"></div>'+
                    '<div class="pointer_marker"></div>'+
                    '<div class="pointer_marker"></div>'+
                    '<div class="pointer_marker"></div>'+
                    '<div class="pointer_marker"></div>'+
                    '<div class="pointer_marker"></div>'+
                    '<div class="pointer_marker"></div></div>'+
                '<div id="pointer_secondary_start_marker_container">'+
                    '<div class="pointer_marker_secondary"></div>'+
                    '<div class="pointer_marker_secondary"></div>'+
                    '<div class="pointer_marker_secondary"></div>'+
                    '<div class="pointer_marker_secondary"></div>'+
                    '<div class="pointer_marker_secondary"></div>'+
                    '<div class="pointer_marker_secondary"></div>'+
                    '<div class="pointer_marker_secondary"></div>'+
                    '<div class="pointer_marker_secondary"></div>'+
                    '<div class="pointer_marker_secondary"></div>'+
                    '<div class="pointer_marker_secondary"></div></div>'+
                '<div id="pointer_start_marker_container">'+
                    '<div class="pointer_start_marker"></div>'+
                    '<div class="pointer_start_marker"></div>'+
                    '<div class="pointer_start_marker"></div>'+
                    '<div class="pointer_start_marker"></div>'+
                    '<div class="pointer_start_marker"></div>'+
                    '<div class="pointer_start_marker"></div>'+
                    '<div class="pointer_start_marker"></div>'+
                    '<div class="pointer_start_marker"></div>'+
                    '<div class="pointer_start_marker"></div>'+
                    '<div class="pointer_start_marker"></div></div>'
            );
        }
        var jpmc = $("#pointer_marker_container");
        var jpsmc = $("#pointer_start_marker_container");
        var jpssmc = $("#pointer_secondary_start_marker_container");
        var jechl = $("#element_current_highlight_layers");
        var jeshl = $("#element_start_highlight_layers");
        var pmc = jpmc[0];
        var psmc = jpsmc[0];
        var pssmc = jpssmc[0];
        var echl = jechl[0];
        var eshl = jeshl[0];
        var scrollY = document.body.scrollTop;
        var scrollX = document.body.scrollLeft;
        //console.log("scrollY"+scrollY);
        var ppk = Object.keys(PLY.pointer_state);
        var ppl = ppk.length;

        var i = 0;
        for (var p in PLY.pointer_state) {
            if (i === 10) { alert("I see more than 10 pointers. wat"); }
            var ppp = PLY.pointer_state[p];
            var echli = echl.children[i];
            var eshli = eshl.children[i];
            var pci = pmc.children[i];
            var psci = psmc.children[i];
            var pssci = pssmc.children[i];
            if (ppp.e || ppp.es === ppp.ec) {
                // I defer the calling of elementFromPoint to here for performance reasons
                var detected_element;
                if ((detected_element = document.elementFromPoint(ppp.xc-scrollX,ppp.yc-scrollY)) !== ppp.es) {
                    var de = $(detected_element);
                    var deo = de.offset();
                    if (deo) {
                        echli.style.width = de.outerWidth()+"px";
                        echli.style.height = de.outerHeight()+"px";
                        echli.style[transform_name] = "translate3d("+deo.left+"px,"+deo.top+"px,0)";
                    } else {
                        echli.style[transform_name] = hide_transform;
                    }
                } else
                    echli.style[transform_name] = hide_transform;
            } else {
                var jpppec = $(ppp.ec);
                var jpppeco = jpppec.offset();
                echli.style.width = jpppec.outerWidth()+"px";
                echli.style.height = jpppec.outerHeight()+"px";
                echli.style[transform_name] = "translate3d("+jpppeco.left+"px,"+jpppeco.top+"px,0)";
            }

            var pppe = ppp.e || ppp.es;
            var jpppes = $(pppe);
            var jpppeso = jpppes.offset();
            eshli.style.width = jpppes.outerWidth()+"px";
            eshli.style.height = jpppes.outerHeight()+"px";
            eshli.style[transform_name] = "translate3d("+jpppeso.left+"px,"+jpppeso.top+"px,0)";

            pci.style[transform_name] = "translate3d("+ppp.xc+"px,"+ppp.yc+"px,0)";
            psci.style[transform_name] = "translate3d("+ppp.xs+"px,"+ppp.ys+"px,0)";
            if (ppp.xs2) {
                pssci.style[transform_name] = "translate3d("+ppp.xs2+"px,"+ppp.ys2+"px,0)";
            } else {
                pssci.style[transform_name] = hide_transform;
            }
            if (ppp.fatness) {
                var rounded_fatness = Math.floor(ppp.fatness*100);
                pci.style.width = pci.style.height = rounded_fatness+"px";
                pci.style.top = pci.style.left = -(rounded_fatness/2+2)+"px";
            }
            ++i;
        }
        for (;i<10;++i) {
            echl.children[i].style[transform_name] = hide_transform;
            eshl.children[i].style[transform_name] = hide_transform;
            pmc.children[i].style[transform_name] = hide_transform;
            psmc.children[i].style[transform_name] = hide_transform;
            pssmc.children[i].style[transform_name] = hide_transform;
        } */

        DEBUG.update_pointer_state();
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
        // cleaning up the debug log
        clean();
    }
    DEBUG.attach_log_cb(function (logbuffer) {
        // insert the latest value in here (as it will always be on)
        var str = '<div class="log" data-time="'+datenow()+'">' + logbuffer[logbuffer.length-1].substr(2) + '</div>';
        if (DEBUG.enable_debug_printing) {
            $("#debug_log").prepend(str);
        }
    });
    requestAnimationFrame(debug_refresh);
    $(window).focus(function(){
        console.log("Window got focus. Jumpstarting rAF");
        requestAnimationFrame(debug_refresh);
    });

    var debug_show_hide = true;
    $('.ply_js_title').parent().on('mousedown touchstart',function(e) {
        e.preventDefault();
        var w = $("#debug").innerWidth();
        $("#debug").css('WebkitTransform','translate3d('+(debug_show_hide?w+10:0)+'px,0,0)');
        debug_show_hide = !debug_show_hide;
    });

    // i have no idea what's going on with the behavior of this bug where the tap top to scroll up does not work.
    // it looks like once i defer the assignment of the class that enables the touch scrolling to page load
    // it all just magically functions.
    $(function(){$("#debug").addClass('touchscroll');});
    // $(document).on('touchstart', '#debug', function(){
    //     $(this).addClass('touchscroll');
    // });
    // $(document).on('touchend', '#debug', function(){
    //     $(this).removeClass('touchscroll');
    // });

    // enable_debug_printing is an ad-hoc solution for storing some globally debug-related state.
    $("h1").after('<button id="debug_toggle" onclick="DEBUG.enable_debug_printing = !DEBUG.enable_debug_printing">toggle all debug</button>');
    //}
    UTIL.attach_handlers_on_document({
        ply_oneend: function(evt) {
            var dt = $.data(evt.target,"ply");
            if (!dt._test_no_reset) {
                PLY_L2.reset_transform_to_zero(evt.target,"1s");
                dt._test_no_reset = false;
            }
        },
        ply_threestart: function(evt) {
            var dt = $.data(evt.target,"ply");
            dt._test_no_reset = !dt._test_no_reset;
        }
    });

    var TransformStyle = Modernizr.prefixed("transform");
    var TransitionDurationStyle = Modernizr.prefixed("transitionDuration");
    DEBUG.globalAsyncKeybind({
        '1': function() { $('.keyboard-bound')[0].style[TransitionDurationStyle] = '1s'; },
        '5': function() { $('.keyboard-bound')[0].style[TransitionDurationStyle] = '5s'; },
        '6': function() { var x = $('.keyboard-bound')[0]; x.style[TransitionDurationStyle] = '5s'; assert(getComputedStyle(x)[TransitionDurationStyle] === '5s'); },
        '0': function() { $('.keyboard-bound')[0].style[TransitionDurationStyle] = '0s'; },
        'M': function() { $('.keyboard-bound')[0].style[TransformStyle] = 'translate3d(300px, 0, 0) rotateZ(180deg)'; },
        'O': function() { $('.keyboard-bound')[0].style[TransformStyle] = ''; },
        'S': function() { var x = $('.keyboard-bound')[0]; x.style[TransformStyle] = getComputedStyle(x)[TransformStyle]; },
        // Set 0 and transition to zero, at once
        '9': function() {
            var x = $('.keyboard-bound')[0];
            x.style[TransitionDurationStyle] = '0s';
            x.style[TransformStyle] = '';
        },
        // same as 9 but with an attempt to force the duration to stick in the middle
        '8': function() {
            var x = $('.keyboard-bound')[0];
            x.style[TransitionDurationStyle] = '0s';
            //assert(getComputedStyle(x)[TransitionDurationStyle] === '0s');
            x.style[TransformStyle] = 'translate3d(0,0,1px)';
            console.log('phantomgcs: '+getComputedStyle(x)[TransformStyle]);
            x.style[TransformStyle] = '';
        }
    });
}());
