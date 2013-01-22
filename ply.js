//////////////////////////////
/////////// ply.js ///////////
//////////////////////////////
//// A JavaScript library ////
//////////////////////////////

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

/*
 * JSS v0.3 - JavaScript Stylesheets
 * https://github.com/Box9/jss
 *
 * Copyright (c) 2011, David Tang
 * MIT Licensed (http://www.opensource.org/licenses/mit-license.php)
 */

var jss = (function (undefined) {
    var jss,
        Jss,
        // Shortcuts
        doc = document,
        head = doc.head || doc.getElementsByTagName('head')[0],
        sheets = doc.styleSheets,
        adjSelAttrRgx = /((?:\.|#)[^\.\s#]+)((?:\.|#)[^\.\s#]+)/g;
    
    jss = function (selector, sheet) {
        var obj = new Jss();
        obj.init(selector, sheet);
        return obj;
    };
    
    // Core functions for manipulating stylesheets
    
    jss._sheetToNode = function (sheet) {
        return sheet.ownerNode || sheet.owningElement;
    };
    
    jss._nodeToSheet = function (node) {
        var result = null,
            i;
        
        for (i = 0; i < sheets.length; i++) {
            if (node === jss._sheetToNode(sheets[i])) {
                result = sheets[i];
                break;
            }
        }
        
        return result;
    };
    
    jss._getSheets = function (sheetSelector) {
        var results = [],
            node,
            i;
        
        if (!sheetSelector) {
            results = sheets;
        } else if (typeof sheetSelector == 'number') {
            results = [sheets[sheetSelector]];
        } else if (typeof sheetSelector == 'object') {
            if (sheetSelector.href) {
                for (i = 0; i < sheets.length; i++) {
                    node = jss._sheetToNode(sheets[i]);
                    if (sheetSelector.href && node.href == sheetSelector.href ||
                        sheetSelector.title && node.title == sheetSelector.title) {
                        results.push(sheets[i]);
                    }
                }
            }
        }
        
        return results;
    };
    
    jss._addSheet = function () {
        var styleNode = doc.createElement('style'),
            i;
        
        styleNode.type = 'text/css';
        styleNode.rel = 'stylesheet';
        head.appendChild(styleNode);
        
        return jss._nodeToSheet(styleNode);
    };
    
    jss._removeSheet = function (sheet) {
        var node = jss._sheetToNode(sheet);
        node.parentNode.removeChild(node);
    };
    
    jss._getRules = function (sheet, selector) {
        var results = [],
            rules,
            i,
            ruleText,
            selText;

        // Browsers report selectors in lowercase
        if (selector) selector = selector.toLowerCase();

        if (typeof sheet.length == 'number') {
            // Array of sheets
            for (i = 0; i < sheet.length; i++) {
                results = results.concat(jss._getRules(sheet[i], selector));
            }
        } else {
            // Single sheet
            rules = sheet.cssRules || sheet.rules;
            for (i = 0; i < rules.length; i++) {
                // Warning, selectorText may not be correct in IE<9
                // as it splits selectors with ',' into multiple rules.
                // Also, certain rules (e.g. @rules) don't have selectorText
                if (rules[i].selectorText) {
                    ruleText = rules[i].selectorText;
                    if (!selector || ruleText == selector || ruleText == jss._swapAdjSelAttr(selector)) {
                        results.push({
                            sheet: sheet,
                            index: i,
                            style: rules[i].style
                        });
                    }
                }
            }
        }

        return results;
    };
    
    // IE9 stores rules with attributes (classes or ID's) adjacent in the opposite order as defined
    // causing them to not be found, so this method swaps [#|.]sel1[#|.]sel2 to become [#|.]sel2[#|.]sel1
    jss._swapAdjSelAttr = function (selector) {
        var swap = '',
            lastIndex = 0;
            
        while ((match = adjSelAttrRgx.exec(selector)) != null) {
            if (match[0] == '') break;
            swap += selector.substring(lastIndex, match.index);
            swap += selector.substr(match.index + match[1].length, match[2].length);
            swap += selector.substr(match.index, match[1].length);
            lastIndex = match.index + match[0].length;
        }
        swap += selector.substr(lastIndex);
        
        return swap;
    };

    // Add an (empty) rule
    jss._addRule = function (sheet, selector) {
        var rules = sheet.cssRules || sheet.rules,
            index = rules.length;

        if (sheet.insertRule) {
            sheet.insertRule(selector + ' { }', index);
        } else if (sheet.addRule) {
            sheet.addRule(selector, null, index);
        }
        
        return {
            sheet: sheet,
            index: index,
            style: rules[index].style
        };
    };
    
    jss._removeRule = function (rule) {
        var sheet = rule.sheet,
            index = rule.index;

        if (sheet.deleteRule) {
            sheet.deleteRule(index);
        } else if (sheet.removeRule) {
            sheet.removeRule(index);
        }
    };
    
    jss._toCamelCase = function(prop) {
        return prop.replace(/-([a-z])/gi, function(s, group1) {return group1.toUpperCase();});
    };
    
    // Object structure for some code candy
    Jss = function () {};

    Jss.prototype = {
        init: function (selector, sheet) {
            var i;

            if (sheet == null) {
                if (!this.sheets) this.sheets = jss._getSheets();
            } else if (sheet === jss) {
                if (jss.dfault === undefined)
                    jss.dfault = jss._addSheet();
                this.sheets = [jss.dfault];
            } else if (typeof sheet == 'number') {
                this.sheets = jss._getSheets(sheet);
            } else if (typeof sheet == 'object') {
                // Recursive call to init
                return this.init(selector, jss).add(sheet);
            }

            this.selector = selector;
            
            return this;
        },
        add: function (prop, value) {
            var i;

            // Add new rule to every sheet that doesn't already have it
            for (i = 0; i < this.sheets.length; i++) {
                if (jss._getRules(this.sheets[i], this.selector).length == 0) {
                    jss._addRule(this.sheets[i], this.selector);
                }
            }

            this.set(prop, value);

            return this;
        },
        set: function (prop, value) {
            var i,
                rules,
                propName;

            if (value === undefined) {
                if (prop && typeof prop == 'object') {
                    for (i in prop) {
                        if (!prop.hasOwnProperty(i)) continue;
                        this.set(i, prop[i]);
                    }
                }
            } else {
                rules = jss._getRules(this.sheets, this.selector);
                propName = jss._toCamelCase(prop);
                // Set properties for each rule
                for (i = 0; i < rules.length; i++) {
                    rules[i].style[propName] = value;
                }
            }

            return this;
        },
        get: function (prop) {
            var result,
                rules = jss._getRules(this.sheets, this.selector),
                propName,
                i,
                j;

            if (prop !== undefined) {
                propName = jss._toCamelCase(prop);
                for (i = rules.length - 1; i >=0; i--) {
                    // added test for emtpy string to handle style selector defined more than once
                    if (rules[i].style[propName] != null && rules[i].style[propName] != '') {
                        result = rules[i].style[propName];
                        break;
                    }
                }
            } else {
                result = {};
                for (i = 0; i < rules.length; i++) {
                    for (j = 0; j < rules[i].style.length; j++) {
                        propName = rules[i].style[j];
                        result[propName] = rules[i].style[propName];
                    }
                }
            }
            
            return result;
        },
        remove: function () {
            var rules = jss._getRules(this.sheets, this.selector),
                i;

            // Remove backwards so indices don't shift
            for (i = rules.length - 1; i >= 0; i--) {
                jss._removeRule(rules[i]);
            }
        }
    };
    
    return jss;
})();


var PLY = (function ($) {
    
    // all vars except the variable "exposed" are private variables 
    var log_buffer = [];

    var git_context = "#% affe77c resetting the trasnform only in the correct situation now.. lets see if remaining finger offset is applied right %#";

    // various parts of state of the library 
    // accessible via window.PLY to allow debug display
    var exposed = {

        // version string updated with git hash from scripts
        revision: git_context.slice(3,-3),

        // Never assume that keys is not filled with keys that were held down 
        // the last time the browser was in focus.
        keys_depressed: {}, 

        // pointer_state stores state of mouse and/or touches. It will treat 
        // the mouse somewhat differently by storing it into the "m" property
        // touches are stored under their id as key.
        pointer_state: {}, 

        // used by touchmove event to run code only when necessary
        tmTime: Date.now(),

        // converges on the time it takes to run touchmove
        tmProfile: 3, 
        // just for reference purposes: my iPhone 5 appears to execute the 
        // touchmove, when debug is off, within 200 microseconds (one touch)

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

        // This is just marked when any event makes its way through the primary
        // event handlers so that the test site can be a bit more efficient about 
        // re-updating the DOM. I will eventually let the events that don't 
        // change the debugprints to also not set this either. 
        event_processed: true, 
        debug: true,
        append_logs_dom: true, 
        escape: escapeHtml,
        serialize: serialize, // exposed helper functions
        isInDOM: isInDOM
    };


    var AssertException, assert; 
    
    AssertException = function (message) { this.message = message; };
    AssertException.prototype.toString = function () {
        return 'AssertException: ' + this.message;
    };

    assert = function (exp, message) {
        if (!exp) {
            throw new AssertException(message);
        }
    };

    // this HTML escapist came from mustache.js
    var entityMap = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': '&quot;',
        "'": '&#39;',
        "/": '&#x2F;'
    };
    function escapeHtml(string) {
        return String(string).replace(/[&<>"'\/]/g, function (s) {
            return entityMap[s];
        });
    }

    var json_handler = function (key,val) {
        if (val instanceof HTMLElement) {
            // tells us which child we are (incl. textnodes)
            // for (var k=0,e=val; (e = e.previousSibling); ++k); 
            // tells us which (real node) index it is
            var k = val.parentNode.children?Array.prototype.indexOf.call(val.parentNode.children,val):undefined;
            var cn = val.className;
            var tn = val.tagName;
            var id = val.id;
            if (tn === "HTML") { cn = ""; } // too much output due to Modernizr
            return "<"+tn+(k?" #"+k:"")+(cn?" c="+cn:"")+(id?" id="+id:"")+">";
        }
        return val;
    };
    function serialize(arg) {
        if (typeof arg === "function") return "function";
        return JSON.stringify(arg,json_handler).replace(/"([^"]*)":/g,"$1: ").replace(/\},([^ ])/g,'},  $1').replace(/,([^ ])/g,', $1');
    }

    function isInDOM(e) {
        while ((e = e.parentNode)) {
            if (e == document) {
                return true;
            }
        }
        return false;
    }

    var TransformStyle = Modernizr.prefixed("transform"); 
    var TransformOriginStyle = Modernizr.prefixed("transformOrigin");

    var original_console_log = console.log;
    // echo console logs to the debug 
    var instrumented_log = function () {
        original_console_log.apply(window.console, arguments);
        if (!exposed.debug) return;
        var str = "";
        for (var i=0;i<arguments.length;++i) {
            str += escapeHtml(serialize(arguments[i])).replace(/ {2}/g,'</br>');
            str += ", ";
        }
        str = str.slice(0,-2);
        var now = Date.now();
        var html_str = '<div class="log" data-time="'+now+'">'+str+'</div>';
        log_buffer.push(html_str);
        if (!exposed.append_logs_dom) return;
        $("#debug_log").prepend(html_str); 
        // this means all logs in your application get dumped into #debug_log if 
        // you've got one
    };
    if (exposed.debug) {
        console.log = instrumented_log; // pre-empt usage of this if starting off not debug
        // if the previous line is not conditional on debug then it will be always
        // possible to "turn on debug" but with this here like this debug is never instrumented
        // when debug is initially off.

        // set up a way to show the log buffer if debug mode 
        // (note toggling the debug off will stop logs being written)
        // (and if debug is not true to begin with, no button is made)
        var show = false;
        $("#log_buffer_dump").before($('<button>toggle full log buffer snapshot</button>').on('click',function(){
            show = !show;
            if (show) {
                $("#log_buffer_dump").html(log_buffer.join(''));
            } else {
                $("#log_buffer_dump").html("");
            }
        }));
    }

    // this is a helper for logging touchlists for debug purposes
    function id_string_for_touch_list(list) {
        var str = "[";
        for (var i=0; i<list.length; ++i) {
            str += list[i].identifier + ", ";
        }
        return str.slice(0,-2)+"]";
    }

    // for scoped iteration over an object
    function each(obj, f) {
        for (var i in obj) {
            f(i, obj[i]);
        }
    }

    var noscroll_class_set = {
        'ply-translate': function () {

        }
    };

    // a neat little exercise in recursive programming
    $.fn.addClassToChildren = function (class_name) {
        var c = this.children();
        if (c.length)
            c.addClass(class_name).addClassToChildren(class_name);
    };

    // this is used to obtain the true offset within the page to get the authoritative 
    // origin point (which is used along with clientX/Y from input)
    function untransformed_offset(e) {
        var currentTransform = e.style[TransformStyle];
        e.style[TransformStyle] = "none"; // clear it out
        assert(getComputedStyle(e)[TransformStyle] === "none"); // this assert should as a side effect ensure the clearing out occurs
        // use an appropriate method to obtain the offset after clearing out transform
        // taking the easy way out with jQuery is probably the best way to go 
        // (1.9.0(+?) will use fast method, but DOM walking method is also legit)
        var jeo = $(e).offset();
        var jeoc = {x: jeo.left, y: jeo.top};
        // set our style back 
        e.style[TransformStyle] = currentTransform;
        return jeoc;
    }

    var Mutation_Observer = true;
    //(window.MutationObserver || window.WebKitMutationObserver || window.MozMutationObserver);
    
    $(function (){
        // propagate "umbrella" style classes through to their children, now and in
        // the future. 
        
        // consolidate event handler behavior of marked elements by setting 
        // ply-noscroll on all of them, but only on touch devices because 
        // the PC allows you to drag just fine while scrolling.
        if (Modernizr.touch) {
            for (var classname in noscroll_class_set) {
                $("."+classname).addClass("ply-noscroll");
            }
        
            // propagate the noscroll class to all children and apply it to all 
            // future children 
            $(".ply-noscroll").on("DOMNodeInserted",function (evt){
                $(evt.target).addClass("ply-noscroll");
            }).addClassToChildren("ply-noscroll");
        }

        // handle ply-collect. 
        // The change that needs to happen here is to simply update the target 
        // of the fired event: While it might make some sense to just attach
        // an event handler to the collect-elements, but that means that during
        // manipulation all those new events are being sent through an 
        // unnecessarily costly event pipeline. 

        $(".ply-collect").on("DOMNodeInserted",function (evt){
            $(evt.target).addClass("ply-cc");
        }).addClassToChildren("ply-cc");
    });

    // dynamic CSS. This is for setting global behavioral CSS styles


    function key(evt) {
        return evt.which || evt.keyCode || /*window.*/event.keyCode;
    }

    // entry point for code is the document's event handlers. 
    var handlers_for_doc = {
        click: function (evt) { console.log('click', evt.pageX, evt.pageY); 

        },
        mousedown: function (evt) { console.log('mousedown',evt.pageX,evt.pageY);
            // need to trap drag-of-selection. Crap. You'll have to prevent 
            // selections entirely. Funny this stuff is quite
            // less problematic for touch events. 

            // trap the right clicks!! this is huge
            if (evt.which === 3) // secondary mouse button causes context menu,
                // context menu prevents mouseup. ply by default ignores
                // the secondary mouse button interaction
                return;
            exposed.pointer_state.m = {xs:evt.pageX, ys:evt.pageY, 
                xc: evt.pageX, yc: evt.pageY, es: evt.target, ec: evt.target};
        },
        mouseup: function (evt) { console.log('mouseup',evt.pageX,evt.pageY);
            // this event may fail to fire by dragging mouse out of
            // window. This is less of a concern for touch since most touch
            // devices do not use window systems. 
            delete exposed.pointer_state.m;
        },
        mousemove: function (evt) { 
            var epm = exposed.pointer_state.m;
            if (epm) {
                epm.xc = evt.pageX; epm.yc = evt.pageY;
                epm.ec = evt.target;
            }
        }, 
        mouseover: function (evt) { //console.log("mouseover", evt.target);

        },
        mouseout: function (evt) { //console.log("mouseout", evt.target);

        },
        mousewheel: function (evt) { console.log("mousewheel", evt.wheelDeltaX, evt.wheelDeltaY); 
            if (evt.target.tagName === "HTML") return; // don't waste cycles 
            // scanning Modernizr's class list on <html>
            var et = evt.target;
            // check for safari "bug"
            if (evt.target.nodeType === 3) /* is text node */ 
                et = evt.target.parentNode;
            if (et.className && et.className.indexOf("ply-noscroll") !== -1) 
                evt.preventDefault();
        },
        keydown: function (evt) { console.log("keydown",key(evt));
            exposed.keys_depressed[key(evt)] = String.fromCharCode(key(evt));
        },
        keyup: function (evt) { console.log("keyup",key(evt));
            delete exposed.keys_depressed[key(evt)];
        },
        touchstart: function (evt) { //console.log("touchstart", id_string_for_touch_list(evt.targetTouches));

            exposed.tmTime = 0; // reset touchmove timer

            // if allow scroll, then never prevent default: once you're
            // scrolling, touching anything else should never mess with the 
            // browser default scrolling. 


            // On touch devices the touchstart is the critical event that keys 
            // off a complex interaction, so it will be the place that 
            // allow_scroll is directly assigned (when it is the first touch,
            // of course).
            var ep = exposed.pointer_state;
            var en = exposed.node_ids;
            var ps_count = 0;
            for (var x in ep) {
                if (x !== "m") ps_count++;
            }
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
                // is destined to control. store that... for right now it stores the immediate
                // target which is fine to test that the thing works. 

                var v = {id: ecii, xs: eci.pageX, ys: eci.pageY, xc: eci.pageX, yc: eci.pageY, e: seen_target};
                data_list.push(v);
            }

            // only when element is a noscroll (interesting element) AND in noscroll mode (or could initiate it) do we track element's touches
            if ((ps_count === 0 || !exposed.allow_scroll) && (' '+seen_target.className+' ').indexOf(" ply-noscroll ") !== -1) {
                // set up $.data stuff on element
                var dt = $.data(seen_target,"ply");
                var nid = en.length;
                //console.log('nid',nid);
                if (!dt) { // new element to put in our node index buffer
                    dt = $.data(seen_target,"ply",{node_id: nid, offset: untransformed_offset(seen_target)});
                    en.push(seen_target);
                    console.log('en extended ',en);
                } else { // otherwise look node up and use its index
                    nid = dt.node_id;
                }
                dt.trans = seen_target.style[TransformStyle]; // hold on to this because it can be very helpful
                if (dt.trans) {
                    console.log("Existing transform on newly touched element: ",dt.trans,seen_target);
                }
                var dl = data_list.length;
                for (var j=0;j<dl;++j) { // go and insert the new touches into our element and ep
                    var dj = data_list[j];
                    dj.ni = nid;
                    //console.log('set dj.ni to nid=',nid);
                    dt[dj.id] = dj;
                    ep[dj.id] = dj;
                }

                if (ps_count === 0) {
                    // this is so that if you start scrolling and then with 2nd
                    // finger touch a ply-noscroll element it will not 
                    // preventDefault on the touchstart on this 2nd touch (which
                    // produces strange stuff, trust me)
                    exposed.allow_scroll = false;
                }
            } else { // not a no-scroll, means only need to track touch data
                var d_l = data_list.length;
                for (var k=0;k<d_l;++k) { // go and insert the new touches into ep
                    var dk = data_list[k];
                    ep[dk.id] = dk;
                }
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

        touchend: (touchend_touchcancel = function (evt) { console.log("touchend", id_string_for_touch_list(evt.changedTouches));

            exposed.tmTime = 0; // reset touchmove timer

            // clean out the touches that got removed 
            /* var ec = evt.changedTouches;
            var ecl = ec.length;
            for (var i=0;i<ecl;++i) {
                var eci = ec[i];
                delete $.data(exposed.pointer_state[eci.identifier].e,'ply')[eci.identifier];
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
            }
            for (var id in ep) {
                if (!hash[id] && id !== "m") {
                    if (ep[id].hasOwnProperty('ni')) { // if is a touch that requires removing from data
                        var ed = $.data(ep[id].e, 'ply');
                        // this touch is no longer valid so remove from element's touch hash
                        delete ed[id];
                        
                        // we set the transform on the data for the element while leaving 
                        // touch info the same (as I want to preserve the semantics of pointer_state)
                        // to the value that would achieve the correct positioning
                        // it then follows that this is only necessary in the case where the number of 
                        // remaining touches is 1: 
                        var count_touches = 0;
                        var touch; 
                        for (var x in ed) {
                            var c = x.charCodeAt(0);
                            if (c < 58 && c > 47) { // fast is-number check
                                touch = ed[x];
                                count_touches++;
                            }
                        }
                        if (count_touches === 1) {
                            ed.trans = "translate3d("+(touch.xs-touch.xc)+"px,"+(touch.ys-touch.yc)+"px,0) " + ep[id].e.style[TransformStyle];
                        }
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
            // debug check the model for consistency here
            if (exposed.debug) {
                var touches_hash = {};
                for (var t=0;t<et.length;++t) {
                    var etti = et[t].identifier;
                    touches_hash[etti] = true;
                    //assert(exposed.pointer_state[etti],"this element should be in the pointer_state because it is in the touches: "+etti+" in "+serialize(exposed.pointer_state));
                    // this assertion also trips because it is possible for the touches to produce a touch that is new
                    // while running the touchend of a previous touch. Not surprising, really.
                }
                for (var x in ep) {
                    if (x === "m") continue; // skip the mouse
                    //assert(touches_hash[x],"this element should be in the touches in the event because it is in the pointer state: "+x+" in "+serialize(touches_hash));
                    // looks like sometimes something can be taken out of touches list before a touchend
                    // for it is sent out!
                    if (ep[x].hasOwnProperty('ni')) {
                        assert($.data(ep[x].e,'ply'),"exists: data of element in pointer_state indexed "+x);
                        assert($.data(ep[x].e,'ply')[x] === ep[x], "pointer_state["+x+"] is exactly equal to the data of its e property: "+serialize(ep[x])+"; "+serialize($.data(ep[x].e,'ply')));
                        assert(ep[x].ni === $.data(ep[x].e,'ply').node_id, "node id check "+ep[x].ni+", "+$.data(ep[x].e,'ply').node_id);
                        assert(en[ep[x].ni] === ep[x].e, "check element with id");
                    }
                }
                for (var j=0;j<en.length;++j) {
                    // check consistency of node_ids by verifying with data contents
                    assert($.data(en[j],'ply').node_id === j, "node_id "+j+" should be equal to $.data(en["+j+"],'ply').node_id");
                }
            }
        }),
        touchcancel: touchend_touchcancel,
        // The majority of functionality is funneled through the (capturing) touchmove handler on the document. 
        // It is quite possible for this to execute 180 times per second. 
        // Because of this, extra effort is put toward optimizing this function. 
        touchmove: function (evt) { 
        //console.log("touchmove ",id_string_for_touch_list(evt.changedTouches),id_string_for_touch_list(evt.touches));
            if (exposed.allow_scroll) return; // since this is touch device, when scrolling we don't do ply-things
            evt.preventDefault(); // prevent the pinching (this is primarily for Android: on iOS a preventdefault on the touchstart is sufficient to suppress pinch)

            // if updates are sent faster than 7ms they are ignored!
            // This should work reliably up until devices provide faster than 120Hz touch events
            // and gives browser about 7 ms of grace-period between touchmove events
            // (which is way more than it should be taking esp. since I start the timing after
            // completing ply transform tasks)
            var start = Date.now();
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

            // for each element 
            for (var ni in elems) {
                var nd = $.data(en[Number(ni)],'ply');
                var one, two; 
                one = undefined; two = undefined;
                var more = [];
                // var tc = Object.keys(nd)-1; // touch count (on this node) // (assumes there is always one prop "node_id")
                var tc = 0; 
                for (var t in nd) {
                    var int_of_t = parseInt(t,10);
                    //assert(int_of_t === int_of_t);
                    if (int_of_t === int_of_t) { // only the touches
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
                }
                //console.log("tc "+tc);
                // at long last ready to parse our element's manipulating touches
                if (!two) { // only one!
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
                    var defaultPrevented = en[ni].dispatchEvent(event);
                } else {
                    // we need to do the transform
                    // If the element has been specified to react automatically to the two finger 
                    // transforms, the default behavior will be the direct application (via rAF) of the
                    // transform, and thus the transform event will only be produced when rAF is idle.
                    // This is to eliminate the inefficiency of having to use an
                    // input sampling dependent update scheme, because in all likelihood the computation of
                    // the new transform *need* *not* *occur* unless rAF indicates for us that our
                    // system can handle "more things". 
                    
                    //console.log("two touches",one,two,"on",en[ni]);
                    var event2 = document.createEvent('HTMLEvents'); // this is for compatibility with DOM Level 2
                    event2.initEvent('ply_transform',true,true);
                    var xs_bar = 0.5 * (one.xs + two.xs);
                    var ys_bar = 0.5 * (one.ys + two.ys);
                    var xc_bar = 0.5 * (one.xc + two.xc);
                    var yc_bar = 0.5 * (one.yc + two.yc);
                    event2.originX = xs_bar - nd.offset.x; // the origin point around which to scale+rotate.
                    event2.originY = ys_bar - nd.offset.y;
                    // TODO: reduce to a single sqrt, and otherwise optimize the crap out of this
                    var xs_diff = one.xs - two.xs;
                    var ys_diff = one.ys - two.ys;
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
                    var defaultPrevented2 = en[ni].dispatchEvent(event2);

                    if (more.length > 0) {
                        console.log("total " + (2 + more.length) + " touches:", more);
                    }
                }
            }
            var now = Date.now();
            var diff = Math.min(now - exposed.tmTime,200);
            exposed.tmTime = now; // update this last
            if (exposed.debug) {
                var profile = now - start;
                exposed.tmProfile += (profile - exposed.tmProfile) * 0.02;
                exposed.tmRate += (diff - exposed.tmRate) * 0.02;
            }
        },
        touchenter: function(evt) {
            console.log("touchenter");
        },
        touchleave: function(evt) {
            console.log("touchleave");
        },
        ply_translate: function(evt) {
            console.log("transform before setting translate: "+$(evt.target).css(TransformStyle));
            evt.target.style[TransformStyle] = "translate3d("+evt.deltaX+"px,"+evt.deltaY+"px,0) " + $.data(evt.target,"ply").trans;
            console.log("transform set to: "+"translate3d("+evt.deltaX+"px,"+evt.deltaY+"px,0) " + $.data(evt.target,"ply").trans);            
        },

        ply_transform: function(evt) {
            // ensure zeroing xformorigin CSS
            if (evt.target.style[TransformOriginStyle] !== "0 0")
                evt.target.style[TransformOriginStyle] = "0 0";

            // transform := T * T_o * R * S * T_o^-1 * transform
            var final_style = "";
            // T * T_o can be combined so we do so
            final_style += "translate3d("+(evt.originX+evt.translateX)+"px,"+(evt.originY+evt.translateY)+"px,0) ";
            // next line takes care of R and S
            final_style += "rotate("+evt.rotate+"rad) scale("+evt.scale+") ";
            // T_o^-1
            final_style += "translate3d("+(-evt.originX)+"px,"+(-evt.originY)+"px,0) ";
            // all premult'd to original transform
            final_style += $.data(evt.target,"ply").trans;
            evt.target.style[TransformStyle] = final_style;
            console.log("transform set to: "+final_style);
            console.log("transform retrieved: "+$(evt.target).css(TransformStyle));
        },
        // only assign these deprecated mutation events to the document when absolutely necessary (perf reasons)
        DOMNodeInserted: Mutation_Observer ? null : function (evt) { //console.log("DOMNodeInserted: ",evt.target);
            // handle specially new elements which have the classes we're 
            // interested in
        },
        DOMNodeRemoved: Mutation_Observer ? null : function (evt) {
            // removed nodes need to clean up their pointers. Pointers must be made to point to the new thing they are 
            // over now or to be removed. 

            console.log("a node has been removed: ",evt.target);

            // I actually don't know what the consequences of using a mutation observer will be when it comes to
            // cleaning up data. Hopefully getting a ref to the removed element after-the-fact allows me to still
            // access the $.data of it. 
            // this whole step may be unnecessary and jQuery may already do auto-cleanup. But while I can't be sure I'll go do some manual clean up.
            var data = $.data(evt.target,'ply');
            if (data) {
                for (var x in data) {
                    data[x] = null; // just indiscriminately clear out references from this object to prevent it leaking anything
                }
            }
        }
    };

    // use each because we need a scoped loop
    each(handlers_for_doc, function (event_name,v) {
        if (!v) return; 
        document.addEventListener(event_name, function () {
            try {
                v.apply(this, arguments);
            } catch (e) {
                // show the error to the DOM to help out for mobile (also cool on PC)
                var html = '<div class="error">'+e.toString()+" at "+e.stack+"</div>";
                $("#debug_log").prepend(html);
                log_buffer.push(html);
                throw e; // rethrow to give it to debugging safari, rather than be silent
            }
            exposed.event_processed = true; 
        }, true); // hook to capture phase to catch in the event of stopPropagation()
    });
    console.log("UA: "+navigator.userAgent);
    console.log("window.devicePixelRatio:", window.devicePixelRatio);

    return exposed;
})(jQuery);
