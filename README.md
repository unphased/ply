ply.js
======

> (tr. v.) to use or wield diligently

A cross-browser input abstraction layer and event framework for modern HTML5 implemented in JavaScript.  
ply implements a comprehensive set of responsive and accurate multitouch gestures using the standard JavaScript event paradigm.  
On top of this, ply implements intuitive auto-transform functionality by simply checking class attributes.  
Collision-detection logic is outside of the scope of this library, but primitive tools (e.g. events to signal the completion of a manipulation, from which CSS3 transitions can be queued off of) for accomplishing common UI visual needs are provided.  
ply makes use of requestAnimationFrame to efficiently schedule transform style updates, and performs these updates only when necessary.  
ply attempts to be conservative about the way it overrides browser functionality with events.

## Dependencies

- [jQuery](http://jquery.com/) 
- [Modernizr](http://modernizr.com/)

## Devices Supported

None yet, the library is not yet in a functional state. But I have a Nexus 7 and iOS4, 5, and 6 devices to make everything work on. 

## How to use

1. Include this library in your webpage.
2. Enable direct manipulation of page elements using hardware-accelerated transforms by simply marking those elements using `ply-` classes. 
3. Write zero lines of code. 
4. Enjoy the fresh and clean feeling. 

## Events

ply defines an extended set of JavaScript events. Some of these events define and provide high-level transform information such as translation and scale, which conveniently correspond to input that is incident on those elements. Other events define (and are triggered by) useful user input actions which can be used to drive UI in a way that is identical to the built-in events (such as `click` or `touchstart`).

The real power of ply comes from the intuitive JS events it generates. 

#### Transform Events (not yet implemented)

- `ply_translate`: Event sent to any element which the user attempts to "drag" in any way. On a PC no declarative classes need to be specified for fully functional `ply_translate` events. On touch devices, a ply-class must be set on an element (or one of its ancestors) to disable default scrolling behavior in order for touchmove events to get processed. 
- `ply_scale`: Event sent to any element which the user attempts to "pinch". 
- `ply_rotate`: Event sent to any element which the user attmepts to "rotate". Realistically, on any touch device you are liable to see both `ply_scale` and `ply_rotate` events fire when two fingers are being used to manipulate an element. The reason for separating them into to events is that it makes it easier to process only the transformation type that you care about. 

#### Termination Events (not yet implemented)

A common need when constructing UI interactions is a way to define behavior after the interaction ends. Termination events are fired when manipulation ends and provide information about the changes that took place. For example, when the user is moving an element around with two fingers and lifts one of them, a termination event will be issued that you can run code on to handle the (accumulated change in) rotation and scale. I will revisit this and describe in better detail what information is provided (still have to code up the rest before it becomes clear what this information will be).

## Classes

### Declarative Classes

ply recognizes a set of "declarative" HTML5 classes which prompt the library to change the interaction behavior of the element. 

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

#### Configuration

Configuration classes should be applied in the body element of the HTML page. This is to mitigate conflict with classes assigned to the html element by Modernizr. 

#### PC-specific config classes (not yet implemented)

In all cases the primary mouse button drag will issue the `ply_translate` transform. If you never want to move anything (suppose you want left drag to scale only) just write your callback for the `ply_translate` to perform scaling rather than translating. 

These following configurations can be combined in any combination. 

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

When using the library, please be careful about stopPropagation(). It can prevent things from functioning. Be aware that whenever any element in the DOM has a event handler which returns false or calls stopPropagation(), this library's default behavior will cease to function for those elements. 

Disclaimer: No relation to [PLY](http://www.dabeaz.com/ply/) 