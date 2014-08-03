lpswipe
===========

lpswipe is a small (3kb when minified) standalone javascript library built to handle cross-device event listeners for touch interaction.

It can be used as either a basic javascript function, or as a jQuery plugin (if jQuery is present on the page). All you have to do is specify the element(s), and the options, and lpswipe will handle all the cross-device events, including for windows phones, and touch-screen windows tablets and laptops.

Why lpswipe?
-----------
There are a lot of other touch libraries out there, and I experimented with using quite a few of them. Most don't handle touch events on windows phones or touchscreen windows tablets and laptops, and almost all of them have serious issues when multiple touches are used. I wrote lpswipe so that I had a touch library I could use which handles those issues.

Multi-touch handling:
-----------
The multi-touch handling in lpswipe is simple - just ignore it. When browsing the web, users typically don't expect any complex touch interactions, so multi-touch handling doesn't need to be complex, we just need to make sure a second touch on the element doesn't break anything. So with lpswipe, all custom touch interactions are based completely on the first touch that is registered on the element; any additional touches will just be ignored.

Usage:
-----------
To use lpswipe, simply call the lpswipe function and pass it the desired element(s), and an object with your defined options:

`lpswipe(document.getElementById('foo'), {});`

or with jQuery:

`$('#foo').lpswipe({});`

The available options and their defaults are:

    // the distance the swipe needs to be to fire the beforeEnd and directional functions
    threshold: 20,

    // the direction to enable custom swipe gestures: 'vertical', 'horizontal', or 'all' (directional, and notReached functions will not fire if "all" is used)
    // this is needed as it will prevent the default browser behaviour when swiping in that direction on that element
    swipeDirection: 'horizontal',

    // fires on first touch
    start: function (d) { },

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

