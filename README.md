taction
===========

taction is a small (3kb when minified) standalone javascript library built to handle cross-device event listeners for touch interaction. 

It provides a selection of callbacks that will let you easily define your own custom touch behaviour.

It can be used as either a standard javascript function, or as a jQuery plugin (if jQuery is present on the page). All you have to do is specify the element(s), and the options, and taction will handle all the cross-device events, including for windows phones, and touch-screen windows tablets and laptops.

Why taction?
-----------
There are a lot of other touch libraries out there, and I experimented with using quite a few of them. Most don't handle touch events on windows devices, and almost all of them encounter problems when multiple touches are used. I wrote taction so that I had a touch library that catered for those issues.

Usage:
-----------
To use taction, simply call the taction function and pass it the desired element(s), and an object with your defined options:

    taction(document.getElementById('foo'), {
        // options
    });

or with jQuery:

    $('#foo').taction({
        // options
    });
    
Options
-----------
The available options and their defaults are:

    // distance needed (in pixels) to fire the directional functions
    threshold: 20,

    // the direction to enable custom swipe gestures: 'vertical', 'horizontal', or 'all'
    // directional and notReached functions will not fire if "all" is used
    swipeDirection: 'horizontal',

    // callbacks that fire in all cases
    start: function (d) { }, // fires on first touch
    reset: function (d) { }, // fires when touch is removed or cancelled by the browser - will always be last callback to fire

    // callbacks that fire only when some swipe movement has occurred
    moving: function (d) { }, // fires during swipe movement
    beforeEnd: function(d) { }, // fires in all cases, before any other end callbacks
    end: function (d) { }, // fires on touchend in all cases after all other callbacks (except reset)

    // threshold dependent callbacks
    right: function (d) { }, // move finger left to right
    left: function (d) { }, // move finger right to left
    up: function (d) { }, // move finger down to up
    down: function (d) { }, // move finger up to down
    notReached: function (d) { } // fires if the threshold isn't reached

Each callback exposes an object containing the x and y positions of the current touch event in relation to the starting touch (which is treated as 0 0). The `start` function is the only exception, which instead returns the element being interacted with, and the event object for the initial touch.

####Overiding taction
For whatever reason, you may want to prevent taction from working its magic. In any callback, you can force the touch events on that element to reset. This will unbind the movement and end events, allowing normal scroll behaviour again. It will also bypass all other callbacks that would normally fire, automatically firing the reset callback instead. This can be done simply by including a `return false;` statement in any given callback.

Cross-device handling:
-----------
Android and iOS handle touch interactions with the `touchstart`, `touchmove` and `touchend` events - the same events most other touch libraries exclusively rely on. Windows devices however use the `pointerdown`, `pointermove` and `pointerup` events (which include handling for mouse, pen, and touch inputs). And for anyone still clinging to IE10, they use the `MSPointerDown`, `MSPointerMove` and `MSPointerUp` events instead.

taction detects support for all of these event listeners, so will work for touch interactions on all of the latest touch devices.

Multi-touch handling:
-----------
The multi-touch handling in taction is simple - just ignore it. When browsing the web, users typically don't expect any complex touch interactions, so multi-touch handling doesn't need to be anything special, we just need to make sure that a second touch on the element doesn't break anything. So with taction, all custom touch interactions are based completely on the first touch that's registered on the element; any additional touches will just be ignored.

taction's multi-touch handling is done on a per-element basis. The impact of this is that, if custom touch interactions are defined on multiple elements, then the user will be able to interact with those elements at the same time. But this does mean that if you are passing multiple elements to taction in a single call e.g. `$('#foo, #bar').taction({ ... })`, then each element will be treated as a separate call.

What taction won't do
-----------
In short, anything other than the touch interactions. In the interest of keeping taction as small and simple as possible, it will only handle the touch events, including for windows touch devices. If for instance you want to include custom drag events using a mouse on your content, you'll have to handle the mouse interactions separately.

Known Issue
-----------
Binding to the HTML tag is not advised: 
In order to prevent any unusual behaviour, when a user is interacting with an element with custom touch events defined, taction temporarily disables all default touch interactions on the rest of the page by setting the `touch-action` and `-ms-touch-action` properties on the HTML tag to none (so that a user can't for instance, swipe an element, and scroll the page at the same time). Once the user stops interacting with that element, those properties are then removed from the HTML tag. So if custom touch interactions are defined on the HTML tag, and another element, and the user attempts to interact with both of them at the same time, this may cause conflicts - admittedly a niche case, but still worth pointing out.