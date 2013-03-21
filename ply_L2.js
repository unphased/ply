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
    //"use strict"; // permissible to uncomment strict mode when in need of debugging

    var assert = (DEBUG && DEBUG.assert) || function() {}; 

    var TransformStyle = Modernizr.prefixed("transform"); 
    var TransformOriginStyle = Modernizr.prefixed("transformOrigin");
    var TransitionPropertyStyle = Modernizr.prefixed("transitionProperty");
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

    // this is used to obtain the true offset within the page to get the authoritative 
    // origin point (which is used along with pageX/Y from input)
    function untransformed_offset(e) {
        var computed = getComputedStyle(e);
        var currentTransform = computed[TransformStyle]; 
        var currentDuration = computed[TransitionDurationStyle];
        e.style[TransitionDurationStyle] = '0s';
        e.style[TransformStyle] = 'translate3d(0,0,1px)'; // absolutely guarantee reset
        getComputedStyle(e);
        e.style[TransformStyle] = '';                 // by consecutively twiddling CSS
        /// var gCS_TS = getComputedStyle(e)[TransformStyle];
        /// assert(gCS_TS === "none", "check clearing: "+gCS_TS); 
        console.log("checking via gcs here: "+getComputedStyle(e)[TransformStyle]);
        // use an appropriate method to obtain the offset after clearing out transform
        // taking the easy way out with jQuery is probably the best way to go 
        // (1.9.0(+?) will use fast method, but DOM walking method in older jQueries is also legit)
        var jeo = $(e).offset();
        var jeoc = {x: jeo.left, y: jeo.top};
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
        var dt = $.data(e,'ply');
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
            dt.offset = untransformed_offset(evt.target); // todo: only run this when necessary by marking a flag 
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
            $.data(evt.target,"ply").trans = evt.target.style[TransformStyle]; 
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
            var dt = $.data(evt.target,"ply");
            if (evt.target.className.indexOf('ply-transforming') === -1) return;
            //console.log("transform before setting translate: "+$(evt.target).css(TransformStyle));
            evt.target.style[TransformStyle] = "translate3d("+evt.deltaX+"px,"+evt.deltaY+"px,0) " + $.data(evt.target,"ply").trans;
            console.log("transform got set to: "+evt.target.style[TransformStyle], "using", "translate3d("+evt.deltaX+"px,"+evt.deltaY+"px,0) " + dt.trans);
        },
        ply_transform: function(evt) {
            // todo: make this not require a per-input run of $.data (actually it may be unavoidable.. sigh)
            var dt = $.data(evt.target,"ply");
            if (evt.target.className.indexOf('ply-transforming') === -1) return;
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