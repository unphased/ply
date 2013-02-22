////////////////////////////////////////////
//////////////// ply_L3.js /////////////////
////////////////////////////////////////////
////  Tertiary event generation stage   ////
//// For use in conjunction with ply.js ////
////////////////////////////////////////////
//// Level 3 focuses on global gestures ////
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

var assert = DEBUG.assert || function(assertion,message){if (!assertion) console.log("ASSERTION FAILED: "+message);};

// Independently define multiple standard listeners rather than conjoin them all at the hip. 
// Mumbo jumbo "separation of concerns", etc. 
// No, seriously though, it's super important if you don't enjoy pulling hair out ;)
var level_3_events = {
    touchstart: function(evt) {
        
    },
    touchend: function(evt) {

    }
};

PLY.attach_handlers_on_document(level_3_events);
