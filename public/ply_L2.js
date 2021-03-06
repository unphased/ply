////////////////////////////////////////////
//////////////// ply_L2.js /////////////////
////////////////////////////////////////////
////  Secondary event generation stage   ///
///  For use in conjunction with ply.js ////
////////////////////////////////////////////
//// Level 2: DOM-aware auto-transform /////
////////////////////////////////////////////

// ============================================================================
// Copyright (c) 2013 Steven Lu

// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the "Software"),
// to deal in the Software without restriction, including without limitation
// the rights to use, copy, modify, merge, publish, distribute, sublicense,
// and/or sell copies of the Software, and to permit persons to whom the
// Software is furnished to do so, subject to the following conditions:

// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.

// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
// FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS
// IN THE SOFTWARE.
// ============================================================================


var PLY_L2 = (function ($) {
    /*global Modernizr:false, PLY:false, assert:false*/
    //"use strict"; // permissible to uncomment strict mode when in need of debugging

    var TransformStyle = Modernizr.prefixed("transform");
    var TransformOriginStyle = Modernizr.prefixed("transformOrigin");
    // var TransitionPropertyStyle = Modernizr.prefixed("transitionProperty");
    var TransitionDurationStyle = Modernizr.prefixed("transitionDuration");

    // this is used to obtain the true offset within the page to get the authoritative
    // origin point (which is used along with pageX/Y from input)
    function transformed_offset(e) {
        var computed = getComputedStyle(e);
        var currentTransform = computed[TransformStyle];
        var currentDuration = computed[TransitionDurationStyle];
        e.style[TransitionDurationStyle] = '0s';
        e.style[TransformStyle] = 'translate3d(0,0,1px)'; // absolutely guarantee reset
        console.log("checking via gcs here: "+getComputedStyle(e)[TransformStyle]);

        //getComputedStyle(e);
        e.style[TransformStyle] = 'none';                 // by consecutively twiddling CSS
        /// var gCS_TS = getComputedStyle(e)[TransformStyle];
        /// assert(gCS_TS === "none", "check clearing: "+gCS_TS);

        // use an appropriate method to obtain the offset after clearing out transform
        // taking the easy way out with jQuery is probably the best way to go
        // (1.9.0(+?) will use fast method, but DOM walking method in older jQueries is also legit)
        var jeo = $(e).offset();
        var jeoc = {x: jeo.left, y: jeo.top};
        if (false && currentTransform.indexOf('atrix') !== -1) {
            // so it accepts capital M in matrix. yeah i know, this is pretty stupid.
            var split = currentTransform.split(',');
            console.log('split ',split);
            jeoc.x += Number(split[12] || split[4]);
            jeoc.y += Number(split[13] || split[5].slice(1,-1)); // extract out the x and y translations, these will be needed
            // to adjust offset since we're grabbing the item
            console.log('jeoc ',jeoc.x,jeoc.y);
        }
        // set our style back
        e.style[TransitionDurationStyle] = currentDuration; // restore duration of transition
        e.style[TransformStyle] = currentTransform;
        // this can actually interrupt any existing animation, but we really don't care about it too much. Just leave it.
        return jeoc;
    }

    function reset_transform_with_duration(e, duration) {
        e.style[TransitionDurationStyle] = duration;
        console.log('tds: '+TransitionDurationStyle);
        assert(getComputedStyle(e)[TransitionDurationStyle] === duration, 'durationstyle: '+duration+' vs '+getComputedStyle(e)[TransitionDurationStyle]);
        // var dt = $.data(e,'ply');
        e.style[TransformStyle] = ''; // reset position
        // mark to stop applying xforms
        e.className.replace('ply-transforming','');
    }

    var exposed = {
        // This could for example contain methods for
        // avoiding touch gesture conflicts between ongoing manipulation and gesture recognition.

        // takes single argument with
        reset_transform_to_zero: reset_transform_with_duration,

        // following items are for revealing the state of manipulations for easy monitoring
        active_items: []
    };

    var level_2_events = {
        ply_onestart: function(evt) { console.log("1S");
            //console.log("1S", evt.changedTouch.identifier, "all touches: ", evt.touches_active_on_element);
            //assert(this === evt.changedTouch.target, "this is evt.ct.target (firsttouchstart)");
            // I am not sure that this assertion should be true, the target of touch could also be a child...
            assert(evt.target === evt.changedTouch.target, "this is evt.ct.target (firsttouchstart)");
            var dt = $.data(evt.target,"ply");
            assert(dt,"dt exists");
            dt.offset = transformed_offset(evt.target); // todo: only run this when necessary by marking a flag
            // upon DOM modifications occur that could result in offset changes.

            // set this because the rest of this stuff depends on it
            // TODO: Make this all apply based on CSS class
            evt.target.style[TransformOriginStyle] = "0 0";

            // set this to prevent rubber band effect
            evt.target.style[TransitionDurationStyle] = "0s";
            if ((' '+evt.target.className+' ').indexOf('ply-transforming') === -1) {
                evt.target.className += ' ply-transforming';
            }

            /*
            // ensure backface visibility
            if (evt.target.style[BackfaceVisibilityStyle] !== "hidden")
                evt.target.style[BackfaceVisibilityStyle] = "hidden";
            // ensure perspective
            if (evt.target.style[PerspectiveStyle] !== "1000")
                evt.target.style[PerspectiveStyle] = "1000";
            */

            // This gives us prefiltered antialiasing via texture sampling (smooths out the edges of stuff as they are transformed)
            evt.target.style.outline = "1px solid transparent";
            var etst = evt.target.style[TransformStyle];
            console.log("etst "+etst);
            if (!etst || etst === "none") {
                dt.trans = ""; // I know of no way to avoid matrix() matrix without applying an actual 3d matrix does not interfere
            } else {
                dt.trans = etst;
            }

            if (etst.length > 140) { // bigger than a tweet means probably will convert to a shorter matrix() format
                evt.target.style[TransformStyle] = getComputedStyle(evt.target)[TransformStyle];
            }
        },
        ply_twostart: function(evt) { console.log("2S");
            //console.log("2S", $.data(evt.target,"ply").trans);
            // The tracking of the position the initial finger was at actually has to be taken care of by ply itself
            // and becomes the .xs2 .ys2 properties
            //var touch = evt.existingTouch;
            var TS = evt.target.style[TransformStyle];
            if (TS === 'none') TS = '';
            $.data(evt.target,"ply").trans = TS;
            // simply keep the same spot
            //console.log("into",  $.data(evt.target,"ply").trans, "end 2S");
        },
        ply_threestart: function(evt) {
            console.log("3S", evt.changedTouch.identifier, "all touches: ", evt.touches_active_on_element);
        },
        ply_oneend: function(evt) {
            console.log("1E");
        },
        ply_twoend: function(evt) {
            console.log("2E", $.data(evt.target,"ply").trans);
            // must properly update trans on termination of second touch
            // append to my transform the offset of the remaining touch
            var t = evt.remainingTouch;
            var touch = evt.touches_active_on_element[t.identifier];
            $.data(evt.target,"ply").trans = "translate3d(" + (touch.xs-touch.xc) + "px," + (touch.ys-touch.yc) + "px,0) " + evt.target.style[TransformStyle];
            //console.log("ed trans"+"translate3d(" + (touch.xs-touch.xc) + "px," + (touch.ys-touch.yc) + "px,0) " + evt.target.style[TransformStyle]);
            console.log("into", $.data(evt.target,"ply").trans, "remainingTouch", touch, "end 2E");
        },
        ply_threeend: function(evt) {
            console.log("3E");
        },
        ply_translate: function(evt) {
            // var dt = $.data(evt.target,"ply");
            if (evt.target.className.indexOf('ply-transforming') === -1) return;
            //console.log("transform before setting translate: "+$(evt.target).css(TransformStyle));
            evt.target.style[TransformStyle] = "translate3d("+evt.deltaX+"px,"+evt.deltaY+"px,0) " + $.data(evt.target,"ply").trans;
            // console.log("translate got set to: "+evt.target.style[TransformStyle], "using", "translate3d("+evt.deltaX+"px,"+evt.deltaY+"px,0) " + dt.trans);
        },
        ply_transform: function(evt) {
            // todo: make this not require a per-input run of $.data (actually it may be unavoidable.. sigh)
            var dt = $.data(evt.target,"ply");
            if (evt.target.className.indexOf('ply-transforming') === -1) return;
            var o = dt.offset;
            var t = dt.trans;
            //console.log('in transform offset=',o.x+','+o.y);
            var startX = evt.startX - o.x;
            var startY = evt.startY - o.y;
            //console.log("ply_transform",o);

            // transform := T * T_o * R * S * T_o^-1 * transform
            var final_style = "";
            // T * T_o can be combined so we do so
            final_style += "translate3d("+(startX+evt.translateX)+"px,"+(startY+evt.translateY)+"px,0) ";
            // next line takes care of R and S
            final_style += "rotate("+evt.rotate+"rad) scale("+evt.scale+") ";
            // T_o^-1
            final_style += "translate3d("+(-startX)+"px,"+(-startY)+"px,0) ";
            // all premult'd to original transform
            final_style += t;
            evt.target.style[TransformStyle] = final_style;
            //console.log("transform set to: "+final_style);
            //console.log("transform after: "+evt.target.style[TransformStyle]);
        }
    };

    // make use of shared code (this attaches handlers to document)
    UTIL.attach_handlers_on_document(level_2_events);

    // produce public interface
    return exposed;
})(jQuery);