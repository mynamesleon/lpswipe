/* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
~~                Swipe Detection Plugin               ~~
~~           Leon Slater, www.lpslater.co.uk           ~~
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ */

(function(){

    // define the event listeners to use for each browser - uses 'userBrowser' variable
    // will bind 'touchstart' event on specified element by default, unless IE version can be detected
    var eventListeners = {
        start: { 'IEedge': 'pointerdown', 'IE10': 'MSPointerDown', 'webkit': 'touchstart' },
        move: { 'IEedge': 'pointermove', 'IE10': 'MSPointerMove', 'webkit': 'touchmove' },
        end: { 'IEedge': 'pointerup', 'IE10': 'MSPointerUp', 'webkit': 'touchend' },
        cancel: { 'IEedge': 'pointercancel', 'IE10': 'MSPointerCancel', 'webkit': 'touchcancel' }
    },
        browserSupportsTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0 || navigator.msMaxTouchPoints > 0,
        pointerEnabled = window.navigator.pointerEnabled, // detect pointer - returns true on IE11, but not IE10
        legacyPointerEnabled = window.navigator.msPointerEnabled, // returns true for pointer on IE10 and IE11
        msTouchDevice = browserSupportsTouch ? pointerEnabled || legacyPointerEnabled : false,
        userBrowser = msTouchDevice ? pointerEnabled ? 'IEedge' : 'IE10' : 'webkit',
        cancelTouch = eventListeners.cancel[userBrowser],
        startTouch = eventListeners.start[userBrowser],
        moveTouch = eventListeners.move[userBrowser],
        endTouch = eventListeners.end[userBrowser],
        touchNum = 0, // used for multi-touch handling - increases for each touch registered on a custom touch element
        abs = Math.abs;

    window.taction = function (element, args) {

        // prevent any events binding if the browser doesn't support touch to save memory
        // this var will return true in desktop Chrome on Windows due to the ability to enable touch emulation - so the event listeners will still bind there
        if (!browserSupportsTouch){
            return;
        }

        var options = {
            // distance needed (in pixels) to fire the directional functions
            threshold: 20,

            // the direction to enable custom swipe gestures: 'vertical', 'horizontal', or 'all'
            // threshold dependent functions will not fire if "all" is used
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
        };

        for (var n in args) { // swap out default options if a user defined argument has been passed in
            if (options.hasOwnProperty(n)) {
                options[n] = args[n];
            }
        }

        // set scrolling to false by default if all is used to avoid unnecessary directional check
        var defaultScrollingVal = options.swipeDirection !== 'all';

        if (element.length === undefined) { // handling for if multiple elements are passed through (i.e., an array of elements, or a jQuery object)
            tactionInit(element);
        } else {
            for (var i = 0; i < element.length; i++) {
                tactionInit(element[i]);
            }
        }

        function tactionInit(el) {

            var startX = 0,
                movementX = 0,
                startY = 0,
                movementY = 0,
                scrolling = defaultScrollingVal,
                startPointerId = -1,
                sentData = {},
                touchProp = { 'horizontal': 'pan-y', 'vertical': 'pan-x', 'all': 'none' },
                touchPropCss = touchProp[options.swipeDirection],
                htmlTag = document.documentElement,
                elIsHtmlTag = el === htmlTag;

            // reset main variables and remove event listeners
            function reset() {
                // reduce touch num so we can see if user is still interacting with any elements with custom touch gestures defined
                touchNum--;

                // reset the relevant variables
                startX = 0; 
                movementX = 0; 
                startY = 0; 
                movementY = 0; 
                scrolling = defaultScrollingVal; 
                startPointerId = -1;

                // remove move and end event listeners on the element
                el.removeEventListener(moveTouch, move);
                el.removeEventListener(endTouch, end);

                // actions to do, only if the current element is not the html tag
                if (!elIsHtmlTag){
                    // reenable touch events on the html tag only if no elements with custom gestures are being interacted with
                    if (touchNum === 0){
                        htmlTag.style.msTouchAction = '';
                        htmlTag.style.touchAction = '';
                    }
                    // remove move and end events from the html element
                    if (msTouchDevice){
                        htmlTag.removeEventListener(moveTouch, move);
                        htmlTag.removeEventListener(endTouch, end);
                    }
                }

                fireCallback('reset', sentData);
            }

            // determines swipe direction on swipe end - return null if 'all' is being used for swipeDirection
            function getDirection(){
                return {
                    'horizontal': movementX > options.threshold ? 'right' : movementX < -options.threshold ? 'left' : 'notReached',
                    'vertical': movementY > options.threshold ? 'down' : movementY < -options.threshold ? 'up' : 'notReached',
                    'all': null
                }[options.swipeDirection];
            }

            // the conditionals that determine whether the touch event should be ignored or not
            function toProceed(event, touchType){
                // in IE, make sure the event type is touch (insted of pen or mouse)
                var check = msTouchDevice ? event.pointerType === 'touch' || event.pointerType === 2 : true;
                if (check){
                    switch(touchType){
                        case 'start':
                            check = startPointerId === -1;
                            break;
                        case 'move':
                            if (msTouchDevice){
                                check = startPointerId === event.pointerId;
                            } else {
                                // targetTouches check on webkit to check touches on the element
                                // allows for user to have swipe interactions on more than one element at a time
                                check = startPointerId === event.targetTouches[0].identifier;
                            }
                            break;
                        case 'end':
                            if (msTouchDevice){
                                check = startPointerId === event.pointerId;
                            } else {
                                // need to check the changedTouches object on webkit here
                                // targetTouches will return empty if only one touch was present
                                check = startPointerId === event.changedTouches[0].identifier
                            }
                            break;
                    }
                }
                return check;
            }

            function fireCallback(name, data){
                var cbkRsp = true;
                if (typeof options[name] == "function"){
                    cbkRsp = options[name](data);
                    if (name !== 'reset' && cbkRsp === false){
                        reset();
                    }
                }
            }

            function start(event) {
                if (toProceed(event, 'start')) {
                    // use targetTouches on webkit to detect touches on the current element
                    var touchEvent = msTouchDevice ? event : event.targetTouches[0];
                    startX = touchEvent.clientX;
                    startY = touchEvent.clientY;

                    // bind move and end eventlisteners
                    el.addEventListener(moveTouch, move);
                    el.addEventListener(endTouch, end);

                    // define initial pointerId to check against to prevent multi-touch issues
                    startPointerId = msTouchDevice ? touchEvent.pointerId : touchEvent.identifier;

                    // bind move and end events for MSTouch to the html element as well, to support movement if touch leaves element area
                    if (msTouchDevice && !elIsHtmlTag) {
                        htmlTag.addEventListener(moveTouch, move);
                        htmlTag.addEventListener(endTouch, end);
                    }

                    // disable touch events on the body whilst interacting with the specified element(s) to prevent unusual interactions
                    // only set on first touch, and not set if element is the html tag
                    if (touchNum === 0 && !elIsHtmlTag){
                        htmlTag.style.msTouchAction = 'none';
                        htmlTag.style.touchAction = 'none';
                    }
                    touchNum++;

                    fireCallback('start', {el: el, event: event});
                }
            }

            function move(event) {
                if (toProceed(event, 'move')) {
                    var touchEvent = msTouchDevice ? event : event.targetTouches[0];
                    movementX = touchEvent.clientX - startX;
                    movementY = touchEvent.clientY - startY;

                    // detect if user is trying to scroll, or is swiping in defined swipeDirection
                    // wrapped in conditional as scrolling is disabled by default if "all" is used for swipeDirection
                    // important not to do this check if scrolling has already been disabled as it could cancel the swipe movement if user starts trying to scroll again
                    if (scrolling) {
                        scrolling = {
                            'horizontal': abs(movementY) > abs(movementX),
                            'vertical': abs(movementY) < abs(movementX),
                            'all': false
                        }[options.swipeDirection];
                    }

                    if (!scrolling) {
                        // prevent browser default behaviour if swiping in defined "swipeDirection"
                        event.preventDefault();
                        sentData.x = movementX; sentData.y = movementY;
                        fireCallback('moving', sentData);
                    } else {
                        // if user is scrolling normally, fire reset to remove the slide move and end events
                        reset();
                    }
                }
            }

            function end(event) {
                if (toProceed(event, 'end')) {
                    if (!scrolling){
                        fireCallback('beforeEnd', sentData);
                        fireCallback(getDirection(), sentData);
                        fireCallback('end', sentData);
                    }
                    reset(); // reset main variables and unbind move and end events
                }
            }

            // add touch-action and -ms-touch-action properties to element to prevent default swipe action on MS touch devices
            el.style.msTouchAction = touchPropCss;
            el.style.touchAction = touchPropCss;

            // check for addEventListener support to prevent errors (and any of these functions attaching to the element) in old IE
            if (el.addEventListener) {
                el.addEventListener(startTouch, start);
                el.addEventListener(cancelTouch, reset); // reset main variables and remove event listeners if the browser cancels the touch
            }
        }
    }
    if (window.jQuery){ // allows the script to be used as a jQuery plugin if jQuery is present
        jQuery.fn.taction = function(args){
            window.taction(this, args);
        }
    }
})();