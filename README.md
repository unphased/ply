ply.js
======

> (tr. v.) to use or wield diligently

A cross-browser input abstraction layer and event framework for modern HTML5 implemented in JavaScript.

ply implements a comprehensive set of responsive and accurate multitouch gestures using the standard JavaScript event paradigm.

On top of this, ply implements intuitive auto-transform functionality by simply checking class attributes.

Collision-detection logic is outside of the scope of this library, but primitive tools (e.g. events to signal the completion of a manipulation, from which CSS3 transitions can be queued off of) for accomplishing common UI visual needs are provided.

ply makes use of requestAnimationFrame to efficiently schedule transform style updates, and performs these updates only when necessary.

ply attempts to be conservative about the way it overrides browser functionality with events.

ply uses DOM2 Mutation Events (the ones deprecated in DOM3 but still found in Safari 5, IE, etc.) or DOM4 Mutation Observers to ensure that if the DOM is dynamically modified, the classes managed by ply are correctly maintained, and that behavior will be consistent on newly created elements. 

## Dependencies

- [jQuery](http://jquery.com/) 
- [Modernizr](http://modernizr.com/)

## Devices Supported

None yet, the library is not yet in a functional state. 

The goal is to support any platform which does not place unreasonable requirements for platform-specific code to the library. This means that IE9 support is tentative and IE<=8 support is out of the question.

It goes without saying that browsers built with Webkit is the primary target. 

Here is an incomplete full list of platforms:

- iOS6 Mobile Safari 6
- iOS5 Mobile Safari 5
- Android Browsers pending testing (Chrome 18) this includes as many of the myriad Android devices out there as possible
- OS X Safari 5
- OS X Safari 6
- Google Chrome 10+ (OS X, Linux, Windows 32- and 64-bit)
- IE10 (32- and 64-bit Windows 8, Windows RT)
- Mozilla Firefox 6+ (OS X, Linux, Windows 32- and 64-bit)
- Opera 10+ (OS X, Linux, Windows 32- and 64-bit)
- Konqueror (and related) Linux browsers
- Safari 5 on Windows

## How to use

1. Include this library in your webpage.
2. Enable direct manipulation of page elements using hardware-accelerated transforms by simply marking those elements using `ply-` classes. 
3. Write zero lines of JavaScript for simple, straightforward interactions (such as draggable elements).

## Events

ply defines an extended set of JavaScript events. Some of these events define and provide high-level transform information such as translation and scale, which conveniently correspond to input that is incident on those elements. Other events define (and are triggered by) useful user input actions which can be used to drive UI in a similar way to the built-in events (such as `click` or `touchstart`).

The real power of ply comes from the intuitive JS events it generates. 

#### Transform Events (not yet implemented)

The three events specified encompass the full range of motion specified by up to two control points (touches). Three-finger interactions can be differentiated from two-finger interactions to enable 3-finger gestures. The third finger that interacts with an element is simply ignored for the purposes of producing transform events (as two is always sufficient).

- `ply_translate`: Event sent to any element which the user attempts to "drag" in any way. On a PC no declarative classes need to be specified for fully functional `ply_translate` events. On touch devices, a ply-class must be set on an element (or one of its ancestors) to disable default scrolling behavior in order for touchmove events to get processed. The event will contain in its `x` and `y` properties the distance in pixels of the overall translation movement. With two fingers this will be the overall translation (average). 
- `ply_rotate_scale`: Event sent to any element which the user manipulates with two fingers. 
    - `angle`: angle in degrees rotated by the interaction
    - `scale`: scale defined by distance between control points
    - `x` and `y`: The initial average point of the two control points (note that movement of this is tracked through `ply_translate`)

#### Termination Events (not yet implemented)

A common need when constructing UI interactions is a way to define behavior after the interaction ends. Termination events are fired when manipulation ends and provide information about the changes that took place. For example, when the user is moving an element around with two fingers and lifts one of them, a termination event will be issued that you can run code on to handle the (accumulated change in) rotation and scale. I will revisit this and describe in better detail what information is provided (still have to code up the rest before it becomes clear what this information will be).

## Classes

### Declarative Classes

ply recognizes a set of "declarative" HTML5 classes which prompt the library to change the default interaction behavior of the element. This is what allows for creating tactile elements in a page without any coding. 

#### General purpose 

- `ply-noscroll`: This applies the property that touching this element prevents browser default scrolling on touch devices. On a PC, *depending on the configuration* scrolling the mousewheel with the cursor over this element can prevent the default browser behavior of scrolling the page. Note that this class and its behavior is automatically applied to every element that matches any of the ply classes. This class will also be applied recursively to all children.
- `ply-collect`: This class when applied to an element with no children has no effect. The purpose of this class is to consolidate ply's events to a container element so that it is manipulated as a unit. `ply-collect` can be applied in different locations in the DOM tree to specify granularity. (not yet implemented)

To illustrate:
If you have this structure: 

    <div class="ply-noscroll">
        <p>Paragraph</p>
        <ul>
            <li>list item 1</li>
            <li>list item 2</li>
        </ul>
    </div>

This causes ply to recursively apply `ply-noscroll` to all children: 
    
    <!-- after ply applies classes --> 
    <div class="ply-noscroll">
        <p class="ply-noscroll">Paragraph</p>
        <ul class="ply-noscroll">
            <li class="ply-noscroll">list item 1</li>
            <li class="ply-noscroll">list item 2</li>
        </ul>
    </div>

If you pinch the list item element "list item 1", it will receive `ply-scale` and `ply-translate` events corresponding to your input, and none of its parents receive any ply manipulation events. 

Let's look at another example. If you had assigned a class like this instead: 
    
    <div>
        <p>Paragraph</p>
        <ul class="ply-collapse">
            <li>list item 1</li>
            <li>list item 2</li>
        </ul>
    </div>

You will find it processes to be 

    <!-- after ply applies classes --> 
    <div>
        <p>Paragraph</p>
        <ul class="ply-collapse ply-noscroll">
            <li class="ply-noscroll">list item 1</li>
            <li class="ply-noscroll">list item 2</li>
        </ul>
    </div>

The behavior will be such that manipulating the list item element "list item 1" will cause the transform events to be sent to its parent the `<ul>` element instead. 

#### Manipulation 

- `ply-translate`: The overall translation described through the ply_translate event is automatically applied using CSS3 `transform` style with requestAnimationFrame. (not yet implemented)
- `ply-scale`: The overall scale described through the ply_scale event is automatically applied using CSS3 `transform` style with requestAnimationFrame. (not yet implemented)
- `ply-rotate`: The overall rotation described through the ply_rotate event is automatically applied using CSS3 `transform` style with requestAnimationFrame. (not yet implemented)

#### PC-specific input binding configuration classes (not yet implemented, todo: revise to configure left-drag behavior also)

In all cases the primary mouse button drag will issue the `ply_translate` transform. If you do not want to move in response to drag (suppose you want primary button drag to scale only), just write your callback for the `ply_translate` event to perform scaling rather than translating. 

These following configurations can be combined in any combination to an element.

- `ply-modifierkeys-scroll`: Modifier keys in conjunction with scroll (over a noscroll element) will produce scale and rotate transforms.
- `ply-modifierkeys-drag`: Modifier keys in conjunction with dragging produces the transforms.
- `ply-scale-scroll`: Scrolling over a noscroll element produces the scale transform.
- `ply-rotate-scroll`: Scrolling over a noscroll element produces the rotate transform. 
- `ply-scale-secondary-drag`: Secondary mouse button drag produces scale transform (like resizing a window in a windowing system, but available everywhere on the element surface by default), middle mouse button produces rotate transform
- `ply-rotate-secondary-drag`: Secondary mouse button drag produces rotate transform, middle mouse button produces scale transform

### Indicative Classes (not yet implemented)

Indicative classes are assigned automatically to all page elements. 

- `ply-hover`: This only works for a cursor/mouse. 
- `ply-bound`: This is assigned to all classes that are actively being manipulated. 

## Notes

When using the library, please be careful about stopPropagation(). It can prevent things from functioning. Be aware that whenever any events are prevented from bubbling that ply's event handlers will be unable to process input: If this is done you can no longer rely on ply's features. 

When DOM4 Mutation Observer is not present, ply will be unable to automatically assign all necessary classes to dynamically inserted elements. This can be addressed in two ways: You can insert your node in its entirety (with the initial `ply-` classes assigned) and the DOMNodeInserted DOM2 Mutation event can figure out the details. But if you modify the DOM in a way that requires changing the "manipulability" of an element, simply removing classes will not work. For this purpose I have defined functions (todo: write names of dynamic management functions here) to call to control ply's behavior.  
Note that if DOM4 Mutation Observers are supported (Safari 6.0+, Chrome 18+, Firefox 14) you will not even have dynamic update functions defined, the way to do it is simply remove the class!

Disclaimer: No relation to [PLY](http://www.dabeaz.com/ply/) 