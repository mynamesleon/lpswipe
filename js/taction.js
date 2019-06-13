/*
 * Swipe plugin for cross-browser touch events
 * Leon Slater
 * http://mynamesleon.com
 */

window.taction = window.taction || (function ($) {
    'use strict';

    var touchNum = 0,
        abs = Math.abs,
        docElem = document.documentElement,
        pointer = window.navigator.pointerEnabled,
        msTouchDevice = pointer || window.navigator.msPointerEnabled,
        userBrowser = msTouchDevice ? pointer ? 'IEedge' : 'IE10' : 'webkit',

        /*
         * default options used in the module
         */
        defaults = {
            // distance needed (in pixels) to fire the directional functions
            threshold: 20,

            // the direction to enable custom swipe gestures: 'vertical', 'horizontal', or 'all'
            // threshold dependent functions will not fire if "all" is used
            swipeDirection: 'horizontal',

            // callbacks that fire in all cases
            start: undefined, // fires on first touch
            reset: undefined, // fires when touch is removed or cancelled - will always be last to fire

            // callbacks that fire only when some swipe movement has occurred
            moving: undefined, // fires during swipe movement
            beforeEnd: undefined, // fires in all cases, before any other end callbacks
            end: undefined, // fires on touchend in all cases after all other callbacks (except reset)

            // threshold dependent callbacks
            right: undefined, // move finger left to right
            left: undefined, // move finger right to left
            up: undefined, // move finger down to up
            down: undefined, // move finger up to down
            notReached: undefined // fires if the threshold isn't reached
        },

        /*
         * object for cancel, start, move, and end events
         */
        events = {
            cancel: {
                IEedge: 'pointercancel',
                IE10: 'MSPointerCancel',
                webkit: 'touchcancel'
            }[userBrowser],
            start: {
                IEedge: 'pointerdown',
                IE10: 'MSPointerDown',
                webkit: 'touchstart'
            }[userBrowser],
            move: {
                IEedge: 'pointermove',
                IE10: 'MSPointerMove',
                webkit: 'touchmove'
            }[userBrowser],
            end: {
                IEedge: 'pointerup',
                IE10: 'MSPointerUp',
                webkit: 'touchend'
            }[userBrowser]
        },

        helpers = {

            /*
             * handle elements for consistent response
             * @param elem {element(s)}: HTMLElement or HTMLCollection or jQuery object
             * @return {array}: elements array
             */
            makeArray: function (elem) {
                var result = [],
                    i = 0;

                if (typeof elem !== 'undefined' && elem !== null) {
                    if (typeof elem.length === 'undefined') { // handle single element
                        result.push(elem);
                    } else if (elem.length) { // handle multiple
                        for (i = 0; i < elem.length; i += 1) {
                            result.push(elem[i]);
                        }
                    }
                }
                return result;
            },

            /*
             * Merge objects
             * @param {object(s)}: objects to merge together
             * @return {object}: new object from merge
             */
            merge: function () {
                var a = arguments,
                    n = {},
                    i = 0,
                    o,
                    p;

                for (i = 0; i < a.length; i += 1) {
                    o = a[i];
                    for (p in o) {
                        if (o.hasOwnProperty(p)) {
                            n[p] = o[p];
                        }
                    }
                }
                return n;
            }

        };

    function Taction(el, options) {
        this.touchPropCss = { horizontal: 'pan-y', vertical: 'pan-x', all: 'none' }[options.swipeDirection];
        this.defaultScrollingVal = options.swipeDirection !== 'all';
        this.scrolling = this.defaultScrollingVal;
        this.startPointerId = -1;
        this.resetFired = false;
        this.options = options;
        this.movementX = 0;
        this.movementY = 0;
        this.sentData = {};
        this.startX = 0;
        this.startY = 0;
        this.el = el;

        // add touch-action and -ms-touch-action properties to element to prevent default swipe action on MS touch devices
        el.style.msTouchAction = this.touchPropCss;
        el.style.touchAction = this.touchPropCss;

        // check for addEventListener support to prevent errors (and any of these functions attaching to the element) in old IE
        if (el.addEventListener) {
            el.addEventListener(events.start, this.start);
            el.addEventListener(events.cancel, this.reset); // reset main variables and remove event listeners if the browser cancels the touch
        }
    }

    // reset main variables and remove event listeners
    Taction.prototype.reset = function () {
        // reduce touch num to see if user is still using custom touch areas
        touchNum -= 1;

        // remove move and end event listeners
        if (msTouchDevice) {
            docElem.removeEventListener(events.move, this.move);
            docElem.removeEventListener(events.end, this.end);
        } else {
            this.el.removeEventListener(events.move, this.move);
            this.el.removeEventListener(events.end, this.end);
        }

        // reenable touch events on the html tag if all touches have ended
        if (touchNum === 0) {
            docElem.style.msTouchAction = '';
            docElem.style.touchAction = '';
        }

        this.trigger('reset');

        // reset the relevant variables
        this.startX = 0;
        this.startY = 0;
        this.movementX = 0;
        this.movementY = 0;
        this.resetFired = true;
        this.startPointerId = -1;
        this.scrolling = this.defaultScrollingVal;
    };

    // determines swipe direction on swipe end - return null if 'all' is being used for swipeDirection
    Taction.prototype.getDirection = function () {
        return {
            'horizontal': this.movementX > this.options.threshold
                ? 'right' : this.movementX < -this.options.threshold
                ? 'left' : 'notReached',
            'vertical': this.movementY > this.options.threshold
                ? 'down' : this.movementY < -this.options.threshold
                ? 'up' : 'notReached',
            'all': null
        }[this.options.direction];
    };

    Taction.prototype.toProceed = function (event, touchType) {
        // in IE, make sure the event type is touch (insted of pen or mouse)
        var check = msTouchDevice ? event.pointerType === 'touch' || event.pointerType === 2 : true;
        if (check) {
            switch (touchType) {
            case 'start':
                check = this.startPointerId === -1;
                break;
            case 'move':
                if (msTouchDevice) {
                    check = this.startPointerId === event.pointerId;
                } else {
                    // targetTouches check on webkit to check touches on the element
                    // allows for user to have swipe interactions on more than one element at a time
                    check = this.startPointerId === event.targetTouches[0].identifier;
                }
                break;
            case 'end':
                if (msTouchDevice) {
                    check = this.startPointerId === event.pointerId;
                } else {
                    // need to check the changedTouches object on webkit here
                    // targetTouches will return empty if only one touch was present
                    check = this.startPointerId === event.changedTouches[0].identifier;
                }
                break;
            }
        }
        return check;
    };

    Taction.prototype.trigger = function (name, data) {
        var response = true;
        data = data || this.sentData;

        if (typeof this.options[name] !== 'function' || this.resetFired) {
            return;
        }

        // check for a return false
        response = this.options[name](data);

        // if callback includes a return false, fire reset immediately to remove move and end events
        if (response === false) {
            this.reset();
        }
    };

    Taction.prototype.start = function (event) {
        if (!this.toProceed(event, 'start')) {
            return;
        }

        // use targetTouches on webkit to detect touches on the current element
        var touchEvent = msTouchDevice ? event : event.targetTouches[0];

        this.startX = touchEvent.clientX;
        this.startY = touchEvent.clientY;
        this.resetFired = false;

        // define initial pointerId to check against to prevent multi-touch issues
        this.startPointerId = msTouchDevice ? touchEvent.pointerId : touchEvent.identifier;

        // bind move and end events
        if (msTouchDevice) {
            docElem.addEventListener(events.move, this.move);
            docElem.addEventListener(events.end, this.end);
        } else {
            this.el.addEventListener(events.move, this.move);
            this.el.addEventListener(events.end, this.end);
        }

        // disable touch events on the body whilst interacting with the specified element(s) to prevent unusual interactions
        // only set on first touch, and not set if element is the html tag
        if (touchNum === 0) {
            docElem.style.msTouchAction = 'none';
            docElem.style.touchAction = 'none';
        }

        touchNum += 1;

        this.trigger('start', {
            el: this.el,
            event: event
        });
    };

    Taction.prototype.move = function (event) {
        if (!this.toProceed(event, 'move')) {
            return;
        }

        var touchEvent = msTouchDevice ? event : event.targetTouches[0];

        this.movementX = touchEvent.clientX - this.startX;
        this.movementY = touchEvent.clientY - this.startY;

        // detect if user is trying to scroll, or is swiping in defined swipeDirection
        // wrapped in conditional as scrolling is disabled by default if "all" is used for swipeDirection
        // important not to do this check if scrolling has already been disabled as it could cancel the swipe movement if user starts trying to scroll again
        if (this.scrolling) {
            this.scrolling = {
                'horizontal': abs(this.movementY) > abs(this.movementX),
                'vertical': abs(this.movementY) < abs(this.movementX),
                'all': false
            }[this.options.swipeDirection];
        }

        if (!this.scrolling) {
            // prevent browser default behaviour if swiping in defined "swipeDirection"
            event.preventDefault();
            this.sentData.x = this.movementX;
            this.sentData.y = this.movementY;
            this.trigger('moving');
        } else {
            // if user is scrolling normally, fire reset to remove the slide move and end events
            this.reset();
        }
    };

    Taction.prototype.end = function (event) {
        if (!this.toProceed(event, 'end')) {
            return;
        }

        if (!this.scrolling) {
            this.trigger('beforeEnd');
            this.trigger(this.getDirection());
            this.trigger('end');
        }

        // reset main variables and unbind move and end events
        this.reset();
    };

    function init(elems, options) {
        var i = 0;

        options = helpers.merge(defaults, options);
        elems = helpers.makeArray(elems);

        for (i = 0; i < elems.length; i += 1) {
            new Taction(elems[i], options);
        }
    }

    return init;

}(window.jQuery));

//(function () {
//
//    // define the event listeners to use for each browser - uses 'userBrowser' variable
//    // will bind 'touchstart' event on specified element by default, unless IE version can be detected
//    var eventListeners = {
//            start: {
//                'IEedge': 'pointerdown',
//                'IE10': 'MSPointerDown',
//                'webkit': 'touchstart'
//            },
//            move: {
//                'IEedge': 'pointermove',
//                'IE10': 'MSPointerMove',
//                'webkit': 'touchmove'
//            },
//            end: {
//                'IEedge': 'pointerup',
//                'IE10': 'MSPointerUp',
//                'webkit': 'touchend'
//            },
//            cancel: {
//                'IEedge': 'pointercancel',
//                'IE10': 'MSPointerCancel',
//                'webkit': 'touchcancel'
//            }
//        },
//        browserSupportsTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0 || navigator.msMaxTouchPoints > 0,
//        pointerEnabled = window.navigator.pointerEnabled, // detect pointer - returns true on IE11, but not IE10
//        legacyPointerEnabled = window.navigator.msPointerEnabled, // returns true for pointer on IE10 and IE11
//        msTouchDevice = browserSupportsTouch ? pointerEnabled || legacyPointerEnabled : false,
//        userBrowser = msTouchDevice ? pointerEnabled ? 'IEedge' : 'IE10' : 'webkit',
//        cancelTouch = eventListeners.cancel[userBrowser],
//        startTouch = eventListeners.start[userBrowser],
//        moveTouch = eventListeners.move[userBrowser],
//        endTouch = eventListeners.end[userBrowser],
//        touchNum = 0, // used for multi-touch handling - increases for each touch registered on a custom touch element
//        abs = Math.abs;
//
//    window.taction = function (element, args) {
//
//        // prevent any events binding if the browser doesn't support touch to save memory
//        // this var will return true in desktop Chrome on Windows due to the ability to enable touch emulation - so the event listeners will still bind there
//        if (!browserSupportsTouch) {
//            return;
//        }
//
//        var options = {
//            // distance needed (in pixels) to fire the directional functions
//            threshold: 20,
//
//            // the direction to enable custom swipe gestures: 'vertical', 'horizontal', or 'all'
//            // threshold dependent functions will not fire if "all" is used
//            swipeDirection: 'horizontal',
//
//            // callbacks that fire in all cases
//            start: function () {}, // fires on first touch
//            reset: function () {}, // fires when touch is removed or cancelled by the browser - will always be last callback to fire
//
//            // callbacks that fire only when some swipe movement has occurred
//            moving: function () {}, // fires during swipe movement
//            beforeEnd: function () {}, // fires in all cases, before any other end callbacks
//            end: function () {}, // fires on touchend in all cases after all other callbacks (except reset)
//
//            // threshold dependent callbacks
//            right: function () {}, // move finger left to right
//            left: function () {}, // move finger right to left
//            up: function () {}, // move finger down to up
//            down: function () {}, // move finger up to down
//            notReached: function () {} // fires if the threshold isn't reached
//        };
//
//        // swap out default options if a user defined argument has been passed in
//        for (var n in args) {
//            if (options.hasOwnProperty(n)) {
//                options[n] = args[n];
//            }
//        }
//
//        // set scrolling to false by default if all is used to avoid unnecessary directional check
//        var defaultScrollingVal = options.swipeDirection !== 'all';
//
//        function tactionInit(el) {
//
//            var startX = 0,
//                movementX = 0,
//                startY = 0,
//                movementY = 0,
//                scrolling = defaultScrollingVal,
//                startPointerId = -1,
//                sentData = {},
//                touchPropCss = {
//                    'horizontal': 'pan-y',
//                    'vertical': 'pan-x',
//                    'all': 'none'
//                }[options.swipeDirection],
//                htmlTag = document.documentElement,
//                resetFired = false;
//
//            // reset main variables and remove event listeners
//            function reset() {
//                // reduce touch num so we can see if user is still interacting with any elements with custom touch gestures defined
//                touchNum--;
//
//                // reset the relevant variables
//                startX = 0;
//                movementX = 0;
//                startY = 0;
//                movementY = 0;
//                scrolling = defaultScrollingVal;
//                startPointerId = -1;
//
//                // remove move and end event listeners
//                if (msTouchDevice) {
//                    htmlTag.removeEventListener(moveTouch, move);
//                    htmlTag.removeEventListener(endTouch, end);
//                } else {
//                    el.removeEventListener(moveTouch, move);
//                    el.removeEventListener(endTouch, end);
//                }
//
//                // reenable touch events on the html tag only if no elements with custom gestures are being interacted with
//                if (touchNum === 0) {
//                    htmlTag.style.msTouchAction = '';
//                    htmlTag.style.touchAction = '';
//                }
//
//                fireCallback('reset', sentData);
//                resetFired = true;
//            }
//
//            // determines swipe direction on swipe end - return null if 'all' is being used for swipeDirection
//            function getDirection() {
//                return {
//                    'horizontal': movementX > options.threshold ? 'right' : movementX < -options.threshold ? 'left' : 'notReached',
//                    'vertical': movementY > options.threshold ? 'down' : movementY < -options.threshold ? 'up' : 'notReached',
//                    'all': null
//                }[options.swipeDirection];
//            }
//
//            // the conditionals that determine whether the touch event should be ignored or not
//            function toProceed(event, touchType) {
//                // in IE, make sure the event type is touch (insted of pen or mouse)
//                var check = msTouchDevice ? event.pointerType === 'touch' || event.pointerType === 2 : true;
//                if (check) {
//                    switch (touchType) {
//                    case 'start':
//                        check = startPointerId === -1;
//                        break;
//                    case 'move':
//                        if (msTouchDevice) {
//                            check = startPointerId === event.pointerId;
//                        } else {
//                            // targetTouches check on webkit to check touches on the element
//                            // allows for user to have swipe interactions on more than one element at a time
//                            check = startPointerId === event.targetTouches[0].identifier;
//                        }
//                        break;
//                    case 'end':
//                        if (msTouchDevice) {
//                            check = startPointerId === event.pointerId;
//                        } else {
//                            // need to check the changedTouches object on webkit here
//                            // targetTouches will return empty if only one touch was present
//                            check = startPointerId === event.changedTouches[0].identifier;
//                        }
//                        break;
//                    }
//                }
//                return check;
//            }
//
//            function fireCallback(name, data) {
//                var cbkRsp = true;
//                if (typeof options[name] === 'function') {
//                    // used to prevent other callbacks from firing after a forced reset - is set to false in the start function
//                    if (resetFired) {
//                        return;
//                    }
//
//                    cbkRsp = options[name](data);
//
//                    // if callback includes a return false, fire reset immediately to remove move and end events
//                    if (cbkRsp === false) {
//                        reset();
//                    }
//                }
//            }
//
//            function start(event) {
//                if (toProceed(event, 'start')) {
//                    // use targetTouches on webkit to detect touches on the current element
//                    var touchEvent = msTouchDevice ? event : event.targetTouches[0];
//                    startX = touchEvent.clientX;
//                    startY = touchEvent.clientY;
//                    resetFired = false;
//
//                    // define initial pointerId to check against to prevent multi-touch issues
//                    startPointerId = msTouchDevice ? touchEvent.pointerId : touchEvent.identifier;
//
//                    // bind move and end events
//                    if (msTouchDevice) {
//                        htmlTag.addEventListener(moveTouch, move);
//                        htmlTag.addEventListener(endTouch, end);
//                    } else {
//                        el.addEventListener(moveTouch, move);
//                        el.addEventListener(endTouch, end);
//                    }
//
//                    // disable touch events on the body whilst interacting with the specified element(s) to prevent unusual interactions
//                    // only set on first touch, and not set if element is the html tag
//                    if (touchNum === 0) {
//                        htmlTag.style.msTouchAction = 'none';
//                        htmlTag.style.touchAction = 'none';
//                    }
//                    touchNum++;
//
//                    fireCallback('start', {
//                        el: el,
//                        event: event
//                    });
//                }
//            }
//
//            function move(event) {
//                if (toProceed(event, 'move')) {
//                    var touchEvent = msTouchDevice ? event : event.targetTouches[0];
//                    movementX = touchEvent.clientX - startX;
//                    movementY = touchEvent.clientY - startY;
//
//                    // detect if user is trying to scroll, or is swiping in defined swipeDirection
//                    // wrapped in conditional as scrolling is disabled by default if "all" is used for swipeDirection
//                    // important not to do this check if scrolling has already been disabled as it could cancel the swipe movement if user starts trying to scroll again
//                    if (scrolling) {
//                        scrolling = {
//                            'horizontal': abs(movementY) > abs(movementX),
//                            'vertical': abs(movementY) < abs(movementX),
//                            'all': false
//                        }[options.swipeDirection];
//                    }
//
//                    if (!scrolling) {
//                        // prevent browser default behaviour if swiping in defined "swipeDirection"
//                        event.preventDefault();
//                        sentData.x = movementX;
//                        sentData.y = movementY;
//                        fireCallback('moving', sentData);
//                    } else {
//                        // if user is scrolling normally, fire reset to remove the slide move and end events
//                        reset();
//                    }
//                }
//            }
//
//            function end(event) {
//                if (toProceed(event, 'end')) {
//                    if (!scrolling) {
//                        fireCallback('beforeEnd', sentData);
//                        fireCallback(getDirection(), sentData);
//                        fireCallback('end', sentData);
//                    }
//                    // reset main variables and unbind move and end events
//                    reset();
//                }
//            }
//
//            // add touch-action and -ms-touch-action properties to element to prevent default swipe action on MS touch devices
//            el.style.msTouchAction = touchPropCss;
//            el.style.touchAction = touchPropCss;
//
//            // check for addEventListener support to prevent errors (and any of these functions attaching to the element) in old IE
//            if (el.addEventListener) {
//                el.addEventListener(startTouch, start);
//                el.addEventListener(cancelTouch, reset); // reset main variables and remove event listeners if the browser cancels the touch
//            }
//        }
//
//        // handling for if multiple elements are passed through (i.e., an array of elements, or a jQuery object)
//        if (element.length === undefined) {
//            tactionInit(element);
//        } else {
//            for (var i = 0; i < element.length; i++) {
//                tactionInit(element[i]);
//            }
//        }
//
//    };
//
//    // allows the script to be used as a jQuery plugin if jQuery is present
//    if (typeof window.jQuery !== 'undefined') {
//        window.jQuery.fn.taction = function (args) {
//            window.taction(this, args);
//        };
//    }
//}());
