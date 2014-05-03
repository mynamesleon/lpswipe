/* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
~~                Swipe Detection Plugin               ~~
~~           Leon Slater, www.lpslater.co.uk           ~~
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ */
(function ($) {
    $.fn.lpswipe = function (options) {

        var defaults = {
            threshold: 20, // the distance the swipe needs to be to fire the function
            swipeDirection: 'horizontal', // the direction to enable swipes: 'vertical', 'horizontal', or 'all' (directional and notReached functions will not fire if "all" is used
            start: function (d) { }, // function that fires on first touch
            right: function (d) { }, // swipe right function (move finger left to right)
            left: function (d) { }, // swipe left function (move finger right to left)
            up: function (d) { }, // swipe up function (move finger down to up)
            down: function (d) { }, // swipe down function (move finger up to down)
            moving: function (d) { }, // function that fires for every pixel movement whilst swiping
            notReached: function (d) { }, // function to fire on touchend if the threshold isn't reached
            end: function (d) { } // function that fires on touchend in all cases, after any directional functions (best used when swipeDirection is set to 'all')
        };

        options = $.extend({}, defaults, options);

        return this.each(function(){ 

            var eventListeners = { // define the event listeners to use for each browser
                start: { 'IEedge': 'pointerdown', 'IE10': 'MSPointerDown', 'webkit': 'touchstart' },
                move: { 'IEedge': 'pointermove', 'IE10': 'MSPointerMove', 'webkit': 'touchmove' },
                end: { 'IEedge': 'pointerup', 'IE10': 'MSPointerUp', 'webkit': 'touchend' },
                cancel: { 'IEedge': 'pointercancel', 'IE10': 'MSPointerCancel', 'webkit': 'touchcancel' }
            };

            var $el = $(this),
                startX = 0,
                movementX = 0,
                startY = 0,
                movementY = 0,
                scrolling = true,
                touchEnabled = 'ontouchstart' in window || navigator.maxTouchPoints > 0 || navigator.msMaxTouchPoints > 0,
                pointerEnabled = window.navigator.pointerEnabled,
                msPointerEnabled = window.navigator.msPointerEnabled,
                msTouchDevice = touchEnabled ? pointerEnabled || msPointerEnabled : false, // pointer detection does not equate to touch support - hence the touchenabled variable
                userBrowser = msTouchDevice ? pointerEnabled ? 'IEedge' : 'IE10' : 'webkit', // browser detection to determine necessary eventlisteners
                cancelTouch = eventListeners.cancel[userBrowser],
                startTouch = eventListeners.start[userBrowser],
                moveTouch = eventListeners.move[userBrowser],
                endTouch = eventListeners.end[userBrowser],
                startPointerId = -1,
                direction = null,
                d = { $el: $el };

            var touchProp = { 'horizontal': 'pan-y', 'vertical': 'pan-x', 'all': 'none' },
                touchPropCss = touchProp[options.swipeDirection];

            // add touch-action and -ms-touch-action properties to element to prevent default swipe action on MS touch devices
            $el.css({ '-ms-touch-action': touchPropCss, 'touch-action': touchPropCss })
                .on(startTouch, slideStart).on(cancelTouch, reset); // attach start and cancel events
            

            function reset() {
                startX = 0; movementX = 0; startY = 0; movementY = 0; scrolling = true; startPointerId = -1; direction = null;
                $('html').css({ '-ms-touch-action': 'auto', 'touch-action': 'auto' }); // reenable touch events on html
                $el.off(moveTouch, slideMove).off(endTouch, slideEnd); // unbind move and end events from element
                if (msTouchDevice) { // remove move and end events from the html element
                    $('html').off(moveTouch, slideMove).off(endTouch, slideEnd);
                }
            }

            function slideStart(event) {
                if (msTouchDevice ? startPointerId === -1 && (event.originalEvent.pointerType === 'touch' || event.originalEvent.pointerType === 2) : !event.originalEvent.targetTouches[1]) { // pointerType is 'touch' in IE11, 2 in IE10 for touch
                    var touchEvent = msTouchDevice ? event.originalEvent : event.originalEvent.targetTouches[0]; // using target touches for webkit
                    startX = touchEvent.clientX;
                    startY = touchEvent.clientY;

                    $el.on(moveTouch, slideMove).on(endTouch, slideEnd); // attach move and end events

                    if (msTouchDevice) { // bind move and end events for MSTouch to the html element as well, to support movement if touch leaves element area
                        $('html').on(moveTouch, slideMove).on(endTouch, slideEnd);
                    }

                    startPointerId = msTouchDevice ? event.originalEvent.pointerId : event.originalEvent.targetTouches[0].identifier; // define initial pointerId to check against to prevent multi-touch issues

                    // disable any touch events on the documentElement whilst interacting with the element
                    $('html').css({ '-ms-touch-action': 'none', 'touch-action': 'none' });

                    if (typeof options.start == "function") {
                        options.start(d);
                    }
                }
            }

            function slideMove(event) {
                if (msTouchDevice ? startPointerId === event.originalEvent.pointerId && (event.originalEvent.pointerType === 'touch' || event.originalEvent.pointerType === 2) : startPointerId === event.originalEvent.targetTouches[0].identifier) {
                    var touchEvent = msTouchDevice ? event.originalEvent : event.originalEvent.targetTouches[0];
                    movementX = touchEvent.clientX - startX;
                    movementY = touchEvent.clientY - startY;

                    if (scrolling) { // important not to do this check if scrolling has already been disabled as it can cancel the swipe movement if user starts trying to scroll
                        var scrollCheck = { 'horizontal': Math.abs(movementY) > Math.abs(movementX), 'vertical': Math.abs(movementY) < Math.abs(movementX), 'all': false };
                        scrolling = scrollCheck[options.swipeDirection]; // detect if user is trying to scroll, so prevent defined touch action from firing in this case
                    }

                    if (!scrolling) {
                        event.preventDefault();
                        if (typeof options.moving == "function") {
                            d.posX = movementX; d.posY = movementY;
                            options.moving(d);
                        }
                    } else {
                        reset();
                    }
                }
            }

            function slideEnd(event) {
                if (msTouchDevice ? startPointerId === event.originalEvent.pointerId && (event.originalEvent.pointerType === 'touch' || event.originalEvent.pointerType === 2) : !event.originalEvent.targetTouches.length) {
                    if (!scrolling) {
                        if (options.swipeDirection === 'horizontal') {
                            direction = movementX > options.threshold ? 'right' : movementX < -options.threshold ? 'left' : 'notReached';
                        } else if (options.swipeDirection === 'vertical') {
                            direction = movementY > options.threshold ? 'down' : movementY < -options.threshold ? 'up' : 'notReached';
                        } else {
                            direction = null;
                        }
                        d.posX = movementX; d.posY = movementY;
                        switch (direction) {
                            case 'left':
                                if (typeof options.left == "function") {
                                    options.left(d);
                                }
                                break;
                            case 'right':
                                if (typeof options.right == "function") {
                                    options.right(d);
                                }
                                break;
                            case 'up':
                                if (typeof options.up == "function") {
                                    options.up(d);
                                }
                                break;
                            case 'down':
                                if (typeof options.down == "function") {
                                    options.down(d);
                                }
                                break;
                            case 'notReached':
                                if (typeof options.notReached == "function") {
                                    options.notReached(d);
                                }
                                break;
                        }
                        if (typeof options.end == "function") {
                            options.end(d);
                        }
                    }
                    reset(); // reset main variables and unbind move and end events
                }
            }
        });
    }
}(jQuery));