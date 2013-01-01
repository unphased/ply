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

    /* function flatten(obj, levels) {
        if (levels === 0) return '';
        var empty = true;
        if (obj instanceof Array) {
            str = '[';
            empty = true;
            for (var i=0;i<obj.length;i++) {
               empty = false;
               str += flatten(obj[i],levels-1)+', ';
            }
            return (empty?str:str.slice(0,-2))+']';
        } else if (obj instanceof Function) {
            str += 'function';
        } else if (obj instanceof Object) {
            str = '{'; 
            empty = true;
            for (var j in obj) { 
                empty = false;
                str += j + ':' + flatten(obj[j],levels-1)+', '; 
            } 
            return (empty?str:str.slice(0,-2))+'}';
        } else {
            return obj.toString(); 
        }
    } */
    
    var transform_name = Modernizr.prefixed('transform');
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
        //console.log(Date.now());
        // the HTML debug dump of the data
        var str = "<ul>";
        for (var prop in PLY) {
            var s = JSON.stringify(PLY[prop],function(key,val) {
                var cn = val.className;
                var tn = val.tagName;
                if (tn === "HTML") { cn = ""; } // too much due to Modernizr
                if (val instanceof HTMLElement) return "DOMElement &lt;"+tn+" c="+cn+" id="+val.id+"&gt;";
                return val;
            });
            str += "<li>";
            str += prop + ": "; 
            str += s;
            str += "</li>";
        }
        str += "</ul>";
        $("#debug").html(str);
        // actual debug visualization of pointer locations
        if (!$('#pointer_marker_container').length) {
            $('body').append('<div id="pointer_marker_container"></div>');
        }
        var jmpc = $("#pointer_marker_container");
        var mpc = jmpc[0];
        var ppk = Object.keys(PLY.pointer_state);
        var ppl = ppk.length;
        while (mpc.children.length < ppl) {
            var ne = document.createElement('DIV');
            ne.className = "pointer_marker";
            mpc.appendChild(ne);
        }
        while (mpc.children.length > ppl) {
            mpc.removeChild(mpc.lastChild);
        }
        var i = 0;
        for (var p in PLY.pointer_state) {
            var ppp = PLY.pointer_state[p];
            var mci = mpc.children[i++];
            mci.style[transform_name] = "translate3d("+ppp.x+"px,"+ppp.y+"px,0)";
            if (ppp.fatness) { 
                var rounded_fatness = Math.floor(ppp.fatness*100);
                mci.style.width = mci.style.height = rounded_fatness+"px";
                mci.style.top = mci.style.left = -(rounded_fatness/2+2)+"px";
            }
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
}());