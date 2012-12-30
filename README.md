ply.js
======

> (tr. v.) to use or wield diligently  
> -- Merriam-Webster

A cross-browser input abstraction layer and event framework implemented in JavaScript. 
ply implements a comprehensive set of responsive and accurate multitouch gestures using the standard JavaScript event paradigm. 
On top of this, ply implements intuitive auto-transform functionality by simply checking class attributes.
Collision-detection logic is outside of the scope of this library, but primitive tools for accomplishing common manipulation tasks are provided. 

## Dependencies

- [jQuery](http://jquery.com/) 
- [Modernizr](http://modernizr.com/)

## How to use

1. Include this library in your webpage.
2. Enable direct manipulation of page elements using hardware-accelerated transforms by marking those elements using `ply-` classes. 
3. Write zero lines of code. 
4. Enjoy the fresh and clean feeling. 

### Classes

ply defines a set of HTML5 classes, which prompt the library to automatically apply the indicated transformation in a hardware-accelerated fashion (when possible). 

### Events

ply defines an extended set of JavaScript events. Some of these events define and provide high-level transform information such as translation and scale, which conveniently correspond to input that is incident on those elements. Other events define (and are triggered by) useful user input actions which can be used to drive UI in a way that is identical to the built-in events (such as `click` or `touchstart`).

The real power of ply c


#### Notes

When using the library, please be careful about stopPropagation(). It can prevent things from functioning. Be aware that whenever any element in the DOM has a event handler which returns false or calls stopPropagation(), this library's default behavior will cease to function for those elements. 


Disclaimer: No relation to [PLY](http://www.dabeaz.com/ply/)  
Note to self: No feature-creep is tolerated! the only things you may add to the scope of this library are the list of classes and the list of events (and their associated handlers)