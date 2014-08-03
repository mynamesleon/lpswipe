lpswipe
===========

lpswipe is a small (3kb when minified) standalone javascript library built to handle cross-device event listeners for touch interaction.

It can be used as either a basic javascript function, or as a jQuery plugin (if jQuery is present on the page). All you have to do is specify the element(s), and the options, and lpswipe will handle all the cross-device events, including for windows phones, and touch-screen windows tablets and laptops.

Why lpswipe?
-----------
There are a lot of other touch libraries out there, and I experimented with using quite a few of them. Most don't handle touch events on windows phones or other touchscreen windows devices, and almost all of them encounter problems when multiple touches are used. I wrote lpswipe so that I had a touch library I could use which handles those issues.

Usage:
-----------
To use lpswipe, simply call the lpswipe function and pass it the desired element(s), and an object with your defined options:

    lpswipe(document.getElementById('foo'), {
        // options
    });

or with jQuery:

    $('#foo').lpswipe({
        // options
    });

Cross-device handling:
-----------
Android and iOS handle touch interactions with the `touchstart`, `touchmove` and `touchend` events - the same events most other touch libraries exclusively rely on. Windows devices however use pointerevents, which include handling for mouse, pen, and touch inputs.

lpswipe detects support for both types of events, so will work for touch interactions on all the latest mobile devices, including windows phones and touch screen windows devices.

Multi-touch handling:
-----------
The multi-touch handling in lpswipe is simple - just ignore it. When browsing the web, users typically don't expect any complex touch interactions, so multi-touch handling doesn't need to be complex, we just need to make sure a second touch on the element doesn't break anything. So with lpswipe, all custom touch interactions are based completely on the first touch that is registered on the element; any additional touches will just be ignored.

lpswipe's multi-touch handling is done on a per-element basis. The impact of this is that, if custom touch interactions are defined on multiple elements, then the user will be able to interact with those elements at the same time. But this does mean that if you are passing multiple elements to lpswipe in a single call e.g. `$('#foo').add($('#bar')).lpswipe({ ... })`, then each element will be treated as a separate call.

Options
-----------
The available options and their defaults are:

    // the distance the swipe needs to be in pixels to fire the directional functions
    threshold: 20,

    // the direction to enable custom swipe gestures: 'vertical', 'horizontal', or 'all' (directional, and notReached functions will not fire if "all" is used)
    // this is needed as it will prevent the default browser behaviour when swiping in that direction on that element
    swipeDirection: 'horizontal',

    // fires on first touch
    start: function () { },

    // fires on touch end event, before directional events are fired, only if threshold is reached
    beforeEnd: function(d) { },

    // move finger left to right - fires only if threshold is reached
    right: function (d) { },

    // move finger right to left - fires only if threshold is reached
    left: function (d) { },

    // move finger down to up - only if threshold is reached
    up: function (d) { },

    // move finger up to down - only if threshold is reached
    down: function (d) { },

    // fires during swipe movement
    moving: function (d) { },

    // fires if the threshold isn't reached - won't fire if all is used for the swipeDirection
    notReached: function (d) { },

    // fires on touchend in all cases, but only when user has swiped in specified direction (will fire in all cases if 'all' is used for swipeDirection)
    end: function (d) { },

    // fires when touch events are reset (e.g. on touchcancel event, or when touch interaction ends) - will always be last event to fire
    reset: function (d) { }

Each callback (other than the `start` function) exposes an object containing the x (posX) and y (posY) positions of the current touch event, in relation to the starting touch (which is treated as 0 0).

What lpswipe won't do
-----------
In short, anything other than the touch interactions. In the interest of keeping lpswipe as small and simple as possible, it will only handle the touch events. If for instance you want to include custom drag events using a mouse on your content, you'll have to handle the mouse interactions separately.
