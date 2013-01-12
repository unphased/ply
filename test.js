(function() {
    var lastTime = 0;
    var vendors = ['ms', 'moz', 'webkit', 'o'];
    for(var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
        window.requestAnimationFrame = window[vendors[x]+'RequestAnimationFrame'];
        window.cancelAnimationFrame = window[vendors[x]+'CancelAnimationFrame']
                                   || window[vendors[x]+'CancelRequestAnimationFrame'];
    }
    var datenow = Date.now?Date.now:function(){return (new Date()).getTime();};
    if (!window.requestAnimationFrame)
        window.requestAnimationFrame = function(callback, element) {
            var currTime = datenow();
            var timeToCall = Math.max(0, 16 - (currTime - lastTime));
            var id = window.setTimeout(function() { callback(currTime + timeToCall); }, 
              timeToCall);
            lastTime = currTime + timeToCall;
            return id;
        };
 
    if (!window.cancelAnimationFrame)
        window.cancelAnimationFrame = function(id) {
            clearTimeout(id);
        };
    
    var transform_name = Modernizr.prefixed('transform');
    var hide_transform = "translate3d(-99999px,-99999px,0)";

    var has_bounding_client_rect = !!document.body.getBoundingClientRect;

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

        if (!PLY.event_processed) return; // wait next tick 
        PLY.event_processed = false; // mark it: we're gonna go update the stuff. 
        //console.log(Date.now());
        // the HTML debug dump of the data
        var str = "<ul>";
        var json_handler = function(key,val) {
            if (Modernizr.touch && key === "ec") return;
            //if (Modernizr.touch && key === "es") return;            
            if (val instanceof HTMLElement) {
                var cn = val.className;
                var tn = val.tagName;
                if (tn === "HTML") { cn = ""; } // too much due to Modernizr
                return "DOMElement &lt;"+tn+" c="+cn+" id="+val.id+"&gt;";
            }
            return val;
        };
        for (var prop in PLY) {
            if (prop === "touch_move_last_time") continue;
            var s = JSON.stringify(PLY[prop],json_handler);
            str += "<li>";
            str += prop + ": "; 
            str += s.replace(/\},"/g,'},</br>"').replace(/,"/g,', "');
            str += "</li>";
        }
        str += "</ul>";
        
        $("#debug").html(str);
        
        // actual debug visualization of pointer locations
        if (!$('#pointer_marker_container').length) {
            $('body').append(
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
        var jechl = $("#element_current_highlight_layers");
        var jeshl = $("#element_start_highlight_layers");
        var pmc = jpmc[0];
        var psmc = jpsmc[0];
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
            if (ppp.e || ppp.es === ppp.ec) {
                // I defer the calling of elementFromPoint to here for performance reasons
                // ply will never do this kind of heavy lifting without being told to
                var detected_element;
                if ((detected_element = document.elementFromPoint(ppp.xc-scrollX,ppp.yc-scrollY)) !== ppp.es) {
                    var de = $(detected_element);
                    var deo = de.offset();
                    echli.style.width = de.outerWidth()+"px";
                    echli.style.height = de.outerHeight()+"px";
                    echli.style[transform_name] = "translate3d("+deo.left+"px,"+deo.top+"px,0)";
                } else
                    echli.style[transform_name] = hide_transform;
            } else {
                if (has_bounding_client_rect) {
                    var cbcr = ppp.ec.getBoundingClientRect();
                    echli.style.width = cbcr.width+"px";
                    echli.style.height = cbcr.height+"px";
                    echli.style[transform_name] = "translate3d("+(scrollX+cbcr.left)+"px,"+(scrollY+cbcr.top)+"px,0)";
                } else {
                    var jpppec = $(ppp.ec);
                    var jpppeco = jpppec.offset();
                    echli.style.width = jpppec.outerWidth()+"px";
                    echli.style.height = jpppec.outerHeight()+"px";
                    echli.style[transform_name] = "translate3d("+jpppeco.left+"px,"+jpppeco.top+"px,0)";
                }
            }
            if (has_bounding_client_rect) {
                var sbcr = ppp.es.getBoundingClientRect();
                eshli.style.width = sbcr.width+"px";
                eshli.style.height = sbcr.height+"px";
                eshli.style[transform_name] = "translate3d("+(scrollX+sbcr.left)+"px,"+(scrollY+sbcr.top)+"px,0)";
            } else {
                var jpppes = $(ppp.es);
                var jpppeso = jpppes.offset();
                eshli.style.width = jpppes.outerWidth()+"px";
                eshli.style.height = jpppes.outerHeight()+"px";
                eshli.style[transform_name] = "translate3d("+jpppeso.left+"px,"+jpppeso.top+"px,0)";
            }
            pci.style[transform_name] = "translate3d("+ppp.xc+"px,"+ppp.yc+"px,0)";
            psci.style[transform_name] = "translate3d("+ppp.xs+"px,"+ppp.ys+"px,0)";
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
        }
        // cleaning up the debug log 
        var now = Date.now();
        var debuglog = $("#debug_log")[0];
        var dc = debuglog.children;
        for (i = dc.length-1; dc.length > 50 && i >= 0; --i) {
            if (dc[i].getAttribute('data-time') < (now - 15000))
                debuglog.removeChild(dc[i]);
        }
    }
    requestAnimationFrame(debug_refresh);
    $(window).focus(function(){
        console.log("Window got focus. Jumpstarting rAF");
        requestAnimationFrame(debug_refresh);
    });
    $("h1").after('<button id="append_logs_dom_toggle" onclick="PLY.append_logs_dom = !PLY.append_logs_dom">toggle realtime log display</button>')
        .after('<button id="debug_toggle" onclick="PLY.debug = !PLY.debug">toggle all debug</button>');
}());