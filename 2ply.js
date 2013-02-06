////////////////////////////////////////////
///////////////// 2ply.js //////////////////
////////////////////////////////////////////
//// For use in conjunction with ply.js ////
////////////////////////////////////////////

// ============================================================================
// Copyright (c) 2012 Steven Lu 

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

var TransformStyle = PLY.Modernizr.prefixed("transform"); 
var TransformOriginStyle = PLY.Modernizr.prefixed("transformOrigin");

var level_2_events = {
    ply_onetouchstart: function(evt) {
        console.log("1S", evt.changedTouch.identifier, "all touches: ", evt.touches_active_on_element);
        //assert(this === evt.changedTouch.target, "this is evt.ct.target (firsttouchstart)");
        assert(evt.target === evt.changedTouch.target, "this is evt.ct.target (firsttouchstart)");
        var dt = $.data(evt.target,"ply");
        assert(dt,"dt exists");
        dt.offset = untransformed_offset(evt.target);
        // set the initial styles 
        evt.target.style[TransformOriginStyle] = "0 0"; 

        /* 
        // ensure backface visibility 
        if (evt.target.style[BackfaceVisibilityStyle] !== "hidden") 
            evt.target.style[BackfaceVisibilityStyle] = "hidden";
        // ensure perspective
        if (evt.target.style[PerspectiveStyle] !== "1000")
            evt.target.style[PerspectiveStyle] = "1000";
        */
        
        // This gives us beautiful prefiltered antialiasing via texture sampling (helps on pretty much all browsers)
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
    ply_twotouchesstart: function(evt) {
        console.log("2S", $.data(evt.target,"ply").trans);
        // The tracking of the position the initial finger was at actually has to be taken care of by ply itself
        // and becomes the .xs2 .ys2 properties
        //var touch = evt.existingTouch;
        $.data(evt.target,"ply").trans = evt.target.style[TransformStyle]; 
        // simply keep the same spot
        console.log("into",  $.data(evt.target,"ply").trans, "end 2S");
    },
    ply_threetouchesstart: function(evt) {
        console.log("3S", evt.changedTouch.identifier, "all touches: ", evt.touches_active_on_element);
    },
    ply_onetouchend: function(evt) {
        console.log("1E");
    },
    ply_twotouchesend: function(evt) {
        console.log("2E", $.data(evt.target,"ply").trans);
        // must properly update trans on termination of second touch 
        // append to my transform the offset of the remaining touch
        var t = evt.remainingTouch;
        var touch = exposed.pointer_state[t.identifier];
        $.data(evt.target,"ply").trans = "translate3d(" + (touch.xs-touch.xc) + "px," + (touch.ys-touch.yc) + "px,0) " + evt.target.style[TransformStyle];
        //console.log("ed trans"+"translate3d(" + (touch.xs-touch.xc) + "px," + (touch.ys-touch.yc) + "px,0) " + evt.target.style[TransformStyle]);
        console.log("into", $.data(evt.target,"ply").trans, "remainingTouch", touch, "end 2E");
    },
    ply_threetouchesend: function(evt) {
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
        startX = evt.startX - o.x;
        startY = evt.startY - o.y;
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
        console.log("transform set to: "+final_style);
        //console.log("transform after: "+evt.target.style[TransformStyle]);
    }
};

PLY.attach_handlers_on_document(level_2_events);
