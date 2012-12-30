ply
===

A cross-browser input abstraction layer and event framework implemented in JavaScript. 
Designed for the web designer (but the web programmer can also have some fun with it, too).

## Dependencies

- [jQuery](http://jquery.com/) 
- [Modernizr](http://modernizr.com/)

## How to use

1. Include this library in your webpage.
2. Enable direct manipulation of page elements using hardware-accelerated transforms by marking those elements using `ply-` classes. 
3. Write zero lines of code. 
4. Enjoy the fresh and clean feeling. 

### Classes

HTML5 classes are reserved for use by ply to indicate that the library shall automatically apply the (indicated) transformation in a hardware-accelerated fashion (when possible). 

### Events

ply defines an extended set of JavaScript events. Some of these events define and provide high-level transform information, which conveniently correspond to input that is incident on those elements. Other events define useful user input actions which can be used to drive UI in a way that is identical to the built-in events (such as `click` or `touchstart`).


Note to self: No feature-creep is tolerated! the only things you can add to the scope of this library are the list of classes and the list of events (and their associated handlers)