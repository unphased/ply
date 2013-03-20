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

/*global Modernizr:false DEBUG:false PLY:false */
var PLY_L2 = (function ($) {
    "use strict";

    var assert = DEBUG.assert || function(assertion,message){if (!assertion) console.log("ASSERTION FAILED: "+message);};
    var TransformStyle = Modernizr.prefixed("transform"); 
    var TransformOriginStyle = Modernizr.prefixed("transformOrigin");
    var TransitionDurationStyle = Modernizr.prefixed("transitionDuration");

    // this is used to obtain the true offset within the page to get the authoritative 
    // origin point (which is used along with pageX/Y from input)
    function untransformed_offset(e) {
        var currentTransform = e.style[TransformStyle];
        e.style[TransformStyle] = "none"; // clear it out
        assert(getComputedStyle(e).getPropertyValue(TransformStyle) === "none", "check clearing"); // this assert should as a side effect ensure the clearing out occurs
        // use an appropriate method to obtain the offset after clearing out transform
        // taking the easy way out with jQuery is probably the best way to go 
        // (1.9.0(+?) will use fast method, but DOM walking method in older jQueries is also legit)
        var jeo = $(e).offset();
        var jeoc = {x: jeo.left, y: jeo.top};
        // set our style back 
        e.style[TransformStyle] = currentTransform;
        return jeoc;
    }

    function reset_transform_with_duration(e, duration) {
        e.style[TransitionDurationStyle] = duration;
        console.log('tds: '+TransitionDurationStyle);
        assert(getComputedStyle(e).getPropertyValue(TransitionDurationStyle) === duration, "durationstyle: "+duration+" vs "+getComputedStyle(e)[TransitionDurationStyle]);
        e.style[TransformStyle] = "translate3d(0,0,0)";
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
        ply_onestart: function(evt) {
            //console.log("1S", evt.changedTouch.identifier, "all touches: ", evt.touches_active_on_element);
            //assert(this === evt.changedTouch.target, "this is evt.ct.target (firsttouchstart)");
            // I am not sure that this assertion should be true, the target of touch could also be a child...
            assert(evt.target === evt.changedTouch.target, "this is evt.ct.target (firsttouchstart)");
            var dt = $.data(evt.target,"ply");
            assert(dt,"dt exists");
            dt.offset = untransformed_offset(evt.target);
            // set this because the rest of this stuff depends on it
            evt.target.style[TransformOriginStyle] = "0 0"; 

            // set this to prevent rubber band effect
            evt.target.style[TransitionDurationStyle] = "0s"; 

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
            if (!etst || etst === "none") {
                dt.trans = ""; // I know of no way to avoid matrix() matrix without applying an actual 3d matrix does not interfere
            } else {
                dt.trans = etst;
            }

            if (etst.length > 140) { // bigger than a tweet means probably will convert to a shorter matrix() format
                evt.target.style[TransformStyle] = getComputedStyle(evt.target)[TransformStyle];
            }
        },
        ply_twostart: function(evt) {
            //console.log("2S", $.data(evt.target,"ply").trans);
            // The tracking of the position the initial finger was at actually has to be taken care of by ply itself
            // and becomes the .xs2 .ys2 properties
            //var touch = evt.existingTouch;
            $.data(evt.target,"ply").trans = evt.target.style[TransformStyle]; 
            // simply keep the same spot
            //console.log("into",  $.data(evt.target,"ply").trans, "end 2S");
        },
        ply_threestart: function(evt) {
            console.log("3S", evt.changedTouch.identifier, "all touches: ", evt.touches_active_on_element);
            reset_transform_with_duration(evt.target,"2s");
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
            //console.log("transform before setting translate: "+$(evt.target).css(TransformStyle));
            evt.target.style[TransformStyle] = "translate3d("+evt.deltaX+"px,"+evt.deltaY+"px,0) " + $.data(evt.target,"ply").trans;
            console.log("transform got set to: "+evt.target.style[TransformStyle], "using", "translate3d("+evt.deltaX+"px,"+evt.deltaY+"px,0) " + $.data(evt.target,"ply").trans);
        },
        ply_transform: function(evt) {
            // todo: make this not require a per-input run of $.data (actually it may be unavoidable.. sigh)
            var dt = $.data(evt.target,"ply");
            var o = dt.offset; 
            var t = dt.trans;
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
    PLY.attach_handlers_on_document(level_2_events);

    // produce public interface
    return exposed;
})(jQuery);