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

### Classes

ply defines a set of HTML5 classes, which prompt the library to change the interaction behavior of the element. 

- `ply-noscroll`: This applies the property that touching this element prevents browser default scrolling on touch devices. On a PC, scrolling the mousewheel (or gesture-scrolling with a touchpad) with the cursor over this element also prevents the default browser behavior of scrolling the page. 
- `ply-translate`: 

### Events

ply defines an extended set of JavaScript events. Some of these events define and provide high-level transform information such as translation and scale, which conveniently correspond to input that is incident on those elements. Other events define (and are triggered by) useful user input actions which can be used to drive UI in a way that is identical to the built-in events (such as `click` or `touchstart`).

The real power of ply comes from the intuitive JS events it generates: A vast space of UI interaction possibilities opens up as prototyping and implementation time is reduced from hours to minutes. 


#### Notes

When using the library, please be careful about stopPropagation(). It can prevent things from functioning. Be aware that whenever any element in the DOM has a event handler which returns false or calls stopPropagation(), this library's default behavior will cease to function for those elements. 


Disclaimer: No relation to [PLY](http://www.dabeaz.com/ply/)  
Note to self: No feature-creep is tolerated! the only things you may add to the scope of this library are the list of classes and the list of events (and their associated handlers)