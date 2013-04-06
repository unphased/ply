///////////////////////////////////////////
////////////////// ply.js /////////////////
///////////////////////////////////////////
//// A JavaScript event expansion pack ////
///////////////////////////////////////////
///// + DOM-aware per-element events  /////
////  + Dependent on jQuery.data()   //////
///////////////////////////////////////////

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


var PLY = (function ($data) {
    /*global DEBUG:false, UTIL:false, Modernizr:false, assert:false*/
    // following line is for use with jshint, it is a global decl

    "use strict";

    var datenow = DEBUG.datenow;
    // var escapeHtml = DEBUG.escapeHtml;
    var serialize = DEBUG.serialize;
    // var isInDOM = DEBUG.isInDOM;

    // various parts of state of the library
    // accessible via window.PLY to allow debug display
    var exposed = {

        // Never assume that keys is not filled with keys that were held down
        // the last time the browser was in focus.
        keys_depressed: {},

        // pointer_state stores state of mouse and/or touches. It will treat
        // the mouse somewhat differently by storing it into the "m" property
        // touches are stored under their id as key.
        pointer_state: {},

        // used by touchmove event to run code only when necessary
        // TODO: why is this public?
        tmTime: datenow(),

        // converges on the time it takes to run touchmove
        tmProfile: 3,
        // just for reference purposes: my iPhone 5 appears to execute (not
        // including the dispatch/computation stage)
        // touchmove, when debug is off, within 200 microseconds (one touch)
        tmProfileDispatch: 3,
        // converges on the time it takes to run only the block that computes
        // and dispatches (and executes) the ply manipulation events

        // converges on the rate touchmove is run
        tmRate: 16,

        // allow_scroll is a global flag that (basically) triggers calling
        // preventDefault on touch events. This is more or less geared toward
        // Android because iOS already prevents scroll from triggering on
        // subsequent touches if the initial touch's touchstart has default
        // prevented (iOS's behavior is still inconsistent with touchstart pD'd
        // on the second or later finger that goes down (messes up the scroll,
        // actually))
        allow_scroll: true,

        // node_ids is my approach to assigning unique IDs to elements of
        // interest to ply. When the user starts manipulating an element it is
        // added to the end of this list, and when stopping it is removed.
        // Some performance testing must be done to determine if it is worth the
        // effort of re-allocating/re-ordering this to save space (as elements
        // cannot be spliced out because it would mess with the indexing)
        // tl;dr: node_ids array is so we can have O(1) lookup DOM node sets.
        node_ids: [],
        // what will be necessary, however, is for mutation events/observer to
        // clear out the values in here so as to not leak DOM nodes.

        // the ply mechanism for globally assigning event handlers
        attach_handlers_on_document: attach_handlers_on_document,

        sanityCheck: internalCheck // this is like a unit test that you can run any time
        // sanityCheck is not bound to/dependent on debug status
    };


    // this is a helper for logging touchlists for friendlier debug output
    function id_string_for_touch_list(list) {
        var str = "[";
        for (var i=0; i<list.length; ++i) {
            str += list[i].identifier + ", ";
        }
        return str.slice(0,-2)+"]";
    }

    var each = UTIL.each;

    // var noscroll_class_set = {
    //     'ply-translate': function () {

    //     }
    // };

    /* a neat little exercise in recursive programming
    $.fn.addClassToChildren = function (class_name) {
        var c = this.children();
        if (c.length)
            c.addClass(class_name).addClassToChildren(class_name);
    }; */

    // var TransformStyle = Modernizr.prefixed("transform");
    // var TransformOriginStyle = Modernizr.prefixed("transformOrigin");
    //var PerspectiveStyle = ply_Modernizr.prefixed("perspective");
    //var BackfaceVisibilityStyle = ply_Modernizr.prefixed("backfaceVisibility");
    //console.log("bfvs: "+BackfaceVisibilityStyle);

    // var Mutation_Observer = true;
    //(window.MutationObserver || window.WebKitMutationObserver || window.MozMutationObserver);

    /*$(function (){
        // propagate "umbrella" style classes through to their children, now and in
        // the future.

        for (var classname in noscroll_class_set) {
            $("."+classname).addClass("ply-noscroll");
        }

        // propagate the noscroll class to all children and apply it to all
        // future children
        $(".ply-noscroll").on("DOMNodeInserted",function (evt){
            $(evt.target).addClass("ply-noscroll");
        }).addClassToChildren("ply-noscroll");

        // handle ply-collect.
        // The change that needs to happen here is to simply update the target
        // of the fired event: While it might make some sense to just attach
        // an event handler to the collect-elements, but that means that during
        // manipulation all those new events are being sent through an
        // unnecessarily costly event pipeline.

        $(".ply-collect").on("DOMNodeInserted",function (evt){
            $(evt.target).addClass("ply-cc");
        }).addClassToChildren("ply-cc");
    }); */

    // routine that should be run for debug sanity checking at any point in time that you desire or are able to
    function internalCheck() {
        //console.log("running internalcheck");
        // check the model for consistency
        /* var touches_hash = {};
        for (var t=0;t<et.length;++t) {
            var etti = et[t].identifier;
            touches_hash[etti] = true;
            //assert(exposed.pointer_state[etti],"this element should be in the pointer_state because it is in the touches: "+etti+" in "+serialize(exposed.pointer_state));
            // this assertion also trips because it is possible for the touches to produce a touch that is new
            // while running the touchend of a previous touch. Not surprising, really.
        } */
        var ep = exposed.pointer_state;
        var en = exposed.node_ids;
        for (var x in ep) {
            if (x === "m") continue; // skip the mouse
            //assert(touches_hash[x],"this element should be in the touches in the event because it is in the pointer state: "+x+" in "+serialize(touches_hash));
            // this above assert fails:
            // looks like sometimes something can be taken out of touches list before a touchend
            // for it is sent out!
            if (ep[x].hasOwnProperty('ni')) {
                assert($data(ep[x].e,'ply'),"exists: data of element in pointer_state indexed "+x);
                assert($data(ep[x].e,'ply').t[x] === ep[x], "pointer_state["+x+"] is exactly equal to the data of its e property: "+serialize(ep[x])+"; "+serialize($data(ep[x].e,'ply')));
                assert(ep[x].ni === $data(ep[x].e,'ply').node_id, "node id check "+ep[x].ni+", "+$data(ep[x].e,'ply').node_id);
                assert(en[ep[x].ni] === ep[x].e, "check element with id");
            }
        }
        for (var j=0;j<en.length;++j) {
            // check internal consistency of touches container by verifying with data contents
            assert($data(en[j],'ply').node_id === j, "node_id "+j+" should be equal to $data(en["+j+"],'ply').node_id");
            // check the count matches
            var touch_count = 0;
            for (var y in $data(en[j],'ply').t) {
                touch_count ++;
            }
            assert(touch_count === $data(en[j],'ply').count, "count checks out for touches on element ");
        }
    }

    function key(evt) {
        return evt.which || evt.keyCode || /*window.*/event.keyCode;
    }

    var touchend_touchcancel;

    // entry point for code is the document's event handlers.
    var level_1_events = {
        touchstart: function (evt) { //console.log("touchstart", id_string_for_touch_list(evt.targetTouches));

            exposed.tmTime = 0; // reset touchmove timer

            // if allow scroll, then never prevent default: once you're
            // scrolling, touching anything else should never mess with the
            // browser default scrolling.


            var ep = exposed.pointer_state;
            var en = exposed.node_ids;
            var ps_count = 0; // ps_count at beginning
            for (var x in ep) {
                if (x !== "m") ps_count++;
            }
            var ps_count_real = ps_count; // ps_count, updated
            var seen_target;
            var data_list = [];
            assert(evt.changedTouches.length > 0, "evt.changedTouches length > 0 on touchstart: "+evt.changedTouches.length);
            // process list of new fingers
            for (var i=0; i<evt.changedTouches.length; ++i) {
                var eci = evt.changedTouches[i];
                var ecii = eci.identifier;
                // this assertion is to check my assumption that all touchstarts batch cT list based on target elem.
                if (seen_target) assert(eci.target === seen_target);
                seen_target = eci.target;
                // here, we must determine the actual real target that this set of touches
                // is destined to control. for right now it uses the immediate
                // target which is fine to test that the thing works.

                var v = {t: eci, id: ecii, xs: eci.pageX, ys: eci.pageY, xc: eci.pageX, yc: eci.pageY, e: seen_target};
                data_list.push(v);
            }

            // always track touch data (ep)
            // The values in our data_list are to be referenced by two datastructus: the $data(e) and the ep
            var dl = data_list.length;
            for (var k=0;k<dl;++k) { // go and insert the new touches into ep
                var dk = data_list[k];
                ep[dk.id] = dk;
                ps_count_real++;
            }

            // only when element is a noscroll (interesting element) AND in noscroll mode (or could initiate it) do we track touches on the element's data (on a per element basis) -- this runs at least once on each element AFAIK
            if ((ps_count === 0 || !exposed.allow_scroll) && (' '+seen_target.className+' ').indexOf(" ply-noscroll ") !== -1) {
                // set up $data stuff on element
                var dt = $data(seen_target,"ply");
                var nid = en.length;
                //console.log('nid',nid);
                if (!dt) { // new element to put in our node index buffer
                    dt = $data(seen_target,"ply",{node_id: nid, count: 0, t: {}});
                    en.push(seen_target);
                    console.log('en extended ',en);
                } else { // otherwise look node up and use its index
                    nid = dt.node_id;
                }
                //dt.offset = untransformed_offset(seen_target); // only set this on creation of first touch!
                //dt.trans = seen_target.style[TransformStyle]; // this should be tracked by the user not by ply's data. It must be set on start

                /*
                var touches_on_e = 0;
                var touch;
                for (var x in dt) {
                    var c = x.charCodeAt(0);
                    if (c < 58 && c > 47) { // fast is-number check
                        touch = dt[x];
                        touches_on_e++;
                        if (touches_on_e > 1) break; // short-circuit (take note count will be either 0, 1, or 2)
                    }
                }
                if (touches_on_e === 1) {
                    // insert a special marker property in the data to use the fresh value for transforming. The original
                    // pointerstate properties tracking the raw touch input shall not be trampled.
                    //console.log("Here I am about to add new xs/ys props to ptr state", touch);
                }*/

                for (var j=0;j<dl;++j) { // go and insert the new touches into our element (ep is done outside this conditional)
                    var dj = data_list[j];
                    dj.ni = nid;
                    if (!dt.t.hasOwnProperty(dj.id)) {
                        dt.count++;
                        dt.t[dj.id] = dj;
                        var event = document.createEvent('HTMLEvents');
                        switch (dt.count) {
                            case 1:
                                event.initEvent('ply_onestart',true,true);
                                break;
                            case 2:
                                event.initEvent('ply_twostart',true,true);
                                // set an updated start position for the existing point to prevent a "warp"
                                // find the first touch on the element and set it to current value
                                for (var ti in dt.t) { if (ti !== dj.id) { break; } }
                                event.existingTouch = ep[ti].t;
                                // take note that existingTouch *could be created at the exact same time* as changedTouch
                                ep[ti].xs2 = ep[ti].xc;
                                ep[ti].ys2 = ep[ti].yc;
                                break;
                            case 3:
                                event.initEvent('ply_threestart',true,true);
                                break;
                            default:
                                console.log("zero or fourth or fifth or... touchstart (unimplemented) n="+dt.count);
                        }
                        // set some helpful touch specific info into the event
                        // "touch" is a nod at "touches" but here we only give the one Touch this event refers to
                        event.changedTouch = dj.t;
                        // also allow the event handler to inspect the other touches (this is not a full blown TouchList and if you modify this structure from your handler things may end badly)
                        event.touches_active_on_element = dt.t;
                        var defNotPrevented = seen_target.dispatchEvent(event);
                    }
                }
                //if (ps_count === 0) {
                    // this is so that if you start scrolling and then with 2nd
                    // finger touch a ply-noscroll element it will not
                    // preventDefault on the touchstart on this 2nd touch (which
                    // produces strange stuff, trust me)
                    exposed.allow_scroll = false;
                //}
            }
            if (!exposed.allow_scroll) { // never allow scroll once you start manipulating something
                evt.preventDefault();
            }
        },

        // After extensive testing on devices it became clear that the tracking of state
        // based on the API of changedTouches and differentiating between events is clearly
        // suboptimal.
        // 1) It is possible for the touches list to include a touch that is new
        // while running the touchend of a previous touch.
        // 2) It is possible for the touches list to exclude a touch that has been removed
        // while running the touchend of a previous touch.
        // There are likely even more similar cases with touchstart and touchcancel.
        // My conclusion is that the `touches` property found in these events is likely
        // to be a reference to a much more reliable source of information and thus
        // the goal should be to simply use that list to determine and update ply's state.
        // unfortunately I can't simply assign the same handler to touchstart and touchend
        // and touchcancel so i will have independent touchstart but touchend and touchcancel
        // will use the same handler which uses the touches list. This is because I must use
        // preventDefault on touchstart in order to force behavior reliably and running the
        // same routine off of all three of these events is probably overkill

        touchend: (touchend_touchcancel = function (evt) { //console.log("touchend", id_string_for_touch_list(evt.changedTouches));

            exposed.tmTime = 0; // reset touchmove timer

            // clean out the touches that got removed
            /* var ec = evt.changedTouches;
            var ecl = ec.length;
            for (var i=0;i<ecl;++i) {
                var eci = ec[i];
                delete $data(exposed.pointer_state[eci.identifier].e,'ply')[eci.identifier];
                delete exposed.pointer_state[eci.identifier];
                console.log('removed ',eci.identifier, " now pointer_state is ",exposed.pointer_state);
            } */

            // using touches (because it is more reliable) to determine which touches have been removed
            var et = evt.touches;
            var etl = et.length;
            var hash = {};
            var ep = exposed.pointer_state;
            var en = exposed.node_ids;
            for (var i=0;i<etl;++i) {
                var eti = et[i];
                var etii = eti.identifier;
                hash[etii] = true;

                // "sanity" check (more like implementation consistency/spec check)
                // make sure the touch object stored with the touchstart from before
                // is the same obj as the one seen at this point within the touches list
                assert(!ep[etii] || ep[etii].t === eti,"Touch is same object as saved from touchstart");
            }
            for (var id in ep) {
                if (!hash[id] && id !== "m") {
                    if (ep[id].hasOwnProperty('ni')) { // if is a touch that requires removing from data
                        // i.e. is a "ply enabled" element
                        var ei = ep[id];
                        var ed = $data(ei.e, 'ply');

                        var event = document.createEvent('HTMLEvents');
                        switch (ed.count) {
                            case 1:
                                event.initEvent('ply_oneend',true,true);
                                break;
                            case 2:
                                event.initEvent('ply_twoend',true,true);
                                for (var ti in ed.t) {
                                    if (ti !== id) break;
                                }
                                event.remainingTouch = ep[ti].t;
                                break;
                            case 3:
                                event.initEvent('ply_threeend',true,true);
                                break;
                            default:
                                console.log("nthtouchend n="+ed.count);
                        }
                        event.changedTouch = ei.t;
                        event.touches_active_on_element = ed.t;
                        var defaultNotPrevented = ei.e.dispatchEvent(event);

                        // this touch is no longer valid so remove from element's touch hash
                        delete ed.t[id];
                        // update count
                        ed.count--;
                    }

                    // en[ep[id].ni] = null; // clear out reference to node
                    // no! don't clear out ref to node. If same node re-touched, reuse id

                    // delete the other ref to this touch's state object
                    delete ep[id];
                    //console.log('removed ',id," now ep is ",ep);
                }
            }
            if (etl === 0) { // this indicates no touches remain
                exposed.allow_scroll = true;
            }
        }),
        touchcancel: touchend_touchcancel,
        // The majority of functionality is funneled through the (capturing) touchmove handler on the document.
        // It is quite possible for this to execute 180 times per second for a three finger situation.
        // Because of this, extra effort should be put toward optimizing this function.
        touchmove: function (evt) {
        //console.log("touchmove ",id_string_for_touch_list(evt.changedTouches),id_string_for_touch_list(evt.touches));
            if (exposed.allow_scroll) return; // since this is touch device, when scrolling we don't do ply-things
            evt.preventDefault(); // prevent the pinching (this is primarily for Android: on iOS a preventdefault on the touchstart is sufficient to suppress pinch)

            // if updates are sent faster than 7ms they are ignored!
            // This should work reliably up until devices provide faster than 120Hz touch events
            // and gives browser about 7 ms of grace-period between touchmove events
            // (which is way more than it should be taking esp. since I start the timing after
            // completing ply transform tasks)
            var start = datenow();
            if (start - exposed.tmTime < 7) return; // discard the event

            var et = evt.touches;
            var etl = et.length;
            var ep = exposed.pointer_state;
            var en = exposed.node_ids;
            var elems = {}; // this is a hash of integers
            for (var i=0; i<etl; ++i) { // loop over all pointers: assemble the elements to transform array
                var eti = et[i];
                var ep_etid = ep[eti.identifier];
                if (!ep_etid) continue;
                // ep_etid.es is the actual element to be manipulated
                // full_pointer_list.push({e: ep_etid.es, x: eti.pageX-ep_etid.xs, y: eti.pageY-ep_etid.ys});
                // update this for display purposes
                if (ep_etid.xc !== eti.pageX || ep_etid.yc !== eti.pageY) { // must update this id
                    // do not mark change if only force changes
                    ep_etid.xc = eti.pageX;
                    ep_etid.yc = eti.pageY;

                    // Assembles a hash of node_id's to get an efficient DOM node list
                    // does not set this if the current changed touch is not on a tracked node
                    if (ep_etid.hasOwnProperty('ni')) {
                        elems[ep_etid.ni] = true;
                    }
                }
                if (eti.webkitForce) {
                    ep_etid.fatness = eti.webkitForce;
                }
            }

            //console.log("elems=",elems);

            var beforeDispatch = datenow();

            // for each element
            for (var ni in elems) {
                var nd = $data(en[Number(ni)],'ply');
                /*
                var one, two;
                one = undefined; two = undefined;
                var more = [];
                // var tc = Object.keys(nd)-1; // touch count (on this node) // (assumes there is always one prop "node_id")
                var tc = 0;
                for (var t in nd) {
                    var c = t.charCodeAt(0);
                    if (c < 58 && c > 47) { // only the touches using fast number check
                        var ndt = nd[t];
                        var v = {xc: ndt.xc, xs: ndt.xs, yc: ndt.yc, ys:ndt.ys};
                        if (!one) {
                            one = v;
                        } else if (!two) {
                            two = v;
                        } else {
                            // this one is more than 2
                            more.push(v);
                        }
                        tc++;
                    }
                }*/
                //console.log("tc "+tc);
                // at long last ready to parse our element's manipulating touches
                assert(nd.count > 0);
                var one;
                if (nd.count === 1) {
                    for (var z in nd.t) { // set to the only value in nd.t (technically not a loop)
                        one = nd.t[z];
                    }
                    //console.log("touch",one,"on",en[ni]);
                    var event = document.createEvent('HTMLEvents'); // this is for compatibility with DOM Level 2
                    event.initEvent('ply_translate',true,true);
                    event.deltaX = one.xc - one.xs;
                    event.deltaY = one.yc - one.ys;
                    // What we do here is if the element has been specified to react automatically
                    // the default behavior will be the direct application (via rAF) of the transform,
                    // which is probably about as efficient as we can get given what is available (early 2013).
                    // Since this is the single finger case there is no transform computation so the event
                    // will be sent like usual
                    var defaultNotPrevented = en[ni].dispatchEvent(event);
                } else {
                    var two, j;
                    j=0;
                    for (var y in nd.t) { // a two iteration loop
                        if (j === 0) one = nd.t[y];
                        else {
                            two = nd.t[y]; // if j !== 0, then j must be 1
                            break;
                        }
                        j++;
                    }
                    // we need to do the transform
                    // If the element has been specified to react automatically to the two finger
                    // transforms, the default behavior should be the direct application of the
                    // transform, and thus the transform event will only be produced when rAF is idle.
                    // This is to eliminate the inefficiency of having to use an
                    // input sampling dependent update scheme, because in all likelihood the computation of
                    // the new transform *need* *not* *occur* unless rAF indicates for us that our
                    // system can handle "more things".

                    // That being said, it's a bit complicated to code up so right now we just go ahead and call based on inputs. Seems to not suffer from adverse effects due to bad perf on e.g. Android.

                    //console.log("two touches",one,two,"on",en[ni]);
                    var event2 = document.createEvent('HTMLEvents'); // this is for compatibility with DOM Level 2
                    event2.initEvent('ply_transform',true,true);
                    var xs1 = one.xs2 || one.xs;
                    var ys1 = one.ys2 || one.ys;
                    var xs2 = two.xs2 || two.xs;
                    var ys2 = two.ys2 || two.ys;
                    // might be the case that only one of these should have the xs2/ys2
                    var xs_bar = 0.5 * (xs1 + xs2);
                    var ys_bar = 0.5 * (ys1 + ys2);
                    var xc_bar = 0.5 * (one.xc + two.xc);
                    var yc_bar = 0.5 * (one.yc + two.yc);
                    event2.startX = xs_bar; // the originating origin point around which scale+rotate happens
                    event2.startY = ys_bar;
                    // TODO: reduce to a single sqrt, and otherwise optimize the crap out of this
                    var xs_diff = xs1 - xs2;
                    var ys_diff = ys1 - ys2;

                    var xc_diff = one.xc - two.xc;
                    var yc_diff = one.yc - two.yc;
                    var xs_dist = Math.abs(xs_diff);
                    var ys_dist = Math.abs(ys_diff);
                    var xc_dist = Math.abs(xc_diff);
                    var yc_dist = Math.abs(yc_diff);
                    var start_dist = Math.sqrt(xs_dist * xs_dist + ys_dist * ys_dist);
                    var currt_dist = Math.sqrt(xc_dist * xc_dist + yc_dist * yc_dist);
                    event2.scale = currt_dist / start_dist;
                    var start_angle = Math.atan2(ys_diff, xs_diff);
                    var currt_angle = Math.atan2(yc_diff, xc_diff);
                    event2.rotate = currt_angle - start_angle;
                    event2.translateX = xc_bar - xs_bar;
                    event2.translateY = yc_bar - ys_bar;
                    var defaultNotPrevented2 = en[ni].dispatchEvent(event2);

                    if (nd.count > 2) {
                        console.log("total " + nd.count + " touches:", nd.t);
                        // do more things on these touches
                    }
                }
            }
            var now = datenow();
            var diff = Math.min(now - exposed.tmTime,200);
            exposed.tmTime = now; // update this last
            if (DEBUG) {
                var profile = now - start;
                var dispatchProfile = now - beforeDispatch;
                exposed.tmProfile += (profile - exposed.tmProfile) * 0.02;
                exposed.tmProfileDispatch += (dispatchProfile - exposed.tmProfileDispatch) * 0.02;
                exposed.tmRate += (diff - exposed.tmRate) * 0.02;
            }
        }
        // these two don't bubble according to MDN. So it'd be useless putting them on document.
        // also fairly certain that no browser implements them yet.
        /* touchenter: function(evt) {
            console.log("touchenter");
        },
        touchleave: function(evt) {
            console.log("touchleave");
        }, */
    };

    function attach_handlers_on_document(handler_map) {
        each(handler_map, function (event_name,v) {
            if (!v) return;
            document.addEventListener(event_name, function() {
                if (DEBUG) {
                    // in debug mode (i.e. if debug.js is included) all exceptions originating from
                    // ply and 2ply global events are caught and reported to debug elements if present
                    try {
                        v.apply(this, arguments);
                    } catch (e) {
                        // show the error to the DOM to help out for mobile (also cool on PC)
                        DEBUG.error(e);
                        throw e; // rethrow to give it to debugging safari, rather than be silent
                    }
                    DEBUG.event_processed = true;
                } else {
                    v.apply(this, arguments);
                }
            }, true);
            // hook to capture phase to catch in the event of stopPropagation()
        });
    }
    attach_handlers_on_document(level_1_events);

    return exposed;
})(jQuery.data);
// only dependency is on jQuery.data, any old version of it should work