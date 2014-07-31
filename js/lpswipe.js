/* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
~~                Swipe Detection Plugin               ~~
~~           Leon Slater, www.lpslater.co.uk           ~~
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ */

(function(){
    var touchNum = 0; // used for multi-touch handling
    window.lpswipe = function (element, args) {

        var options = {
            threshold: 20, // the distance the swipe needs to be to fire the function
            swipeDirection: 'horizontal', // the direction to enable swipes: 'vertical', 'horizontal', or 'all' (directional and notReached functions will not fire if "all" is used)
            start: function (d) { }, // fires on first touch
            beforeEnd: function(d) { }, // fires on touch end event, before directional events are fired
            right: function (d) { }, // move finger left to right
            left: function (d) { }, // move finger right to left
            up: function (d) { }, // move finger down to up
            down: function (d) { }, // move finger up to down
            moving: function (d) { }, // fires during swipe movement
            notReached: function (d) { }, // fires if the threshold isn't reached
            end: function (d) { }, // fires on touchend in all cases, but only when a directional swipe has occured (best used when swipeDirection is set to 'all')
            reset: function (d) { } // fires when touch events are reset (e.g. if swipe direction isn't met, on touchcancel event, or when swipe ends) - will always be last event to fire 
        };
        var eventListeners = { // define the event listeners to use for each browser
            start: { 'IEedge': 'pointerdown', 'IE10': 'MSPointerDown', 'webkit': 'touchstart' },
            move: { 'IEedge': 'pointermove', 'IE10': 'MSPointerMove', 'webkit': 'touchmove' },
            end: { 'IEedge': 'pointerup', 'IE10': 'MSPointerUp', 'webkit': 'touchend' },
            cancel: { 'IEedge': 'pointercancel', 'IE10': 'MSPointerCancel', 'webkit': 'touchcancel' }
        },
            touchEnabled = 'ontouchstart' in window || navigator.maxTouchPoints > 0 || navigator.msMaxTouchPoints > 0,
            pointerEnabled = window.navigator.pointerEnabled, // detect pointer - returns true on IE11, but not IE10
            msPointerEnabled = window.navigator.msPointerEnabled, // returns true for pointer on IE10 and IE11
            msTouchDevice = touchEnabled ? pointerEnabled || msPointerEnabled : false, // pointer detection does not equate to touch support - hence the touchenabled variable
            userBrowser = msTouchDevice ? pointerEnabled ? 'IEedge' : 'IE10' : 'webkit', // users browser to determine necessary eventlisteners
            cancelTouch = eventListeners.cancel[userBrowser],
            startTouch = eventListeners.start[userBrowser],
            moveTouch = eventListeners.move[userBrowser],
            endTouch = eventListeners.end[userBrowser];

        for (var n in args) { // swap out default options if a user defined argument has been passed in
            if (options.hasOwnProperty(n)) {
                options[n] = args[n];
            }
        }

        if (element.length === undefined) { // handling for if multiple elements are passed through (ie, an array of elements, or a jQuery object)
            lpswipeInit(element);
        } else {
            for (var i = 0; i < element.length; i++) {
                lpswipeInit(element[i]);
            }
        }

        function lpswipeInit(el) {

            var startX = 0,
                movementX = 0,
                startY = 0,
                movementY = 0,
                scrolling = true,
                startPointerId = -1,
                direction = null,
                sentData = {},
                touchProp = { 'horizontal': 'pan-y', 'vertical': 'pan-x', 'all': 'none' },
                touchPropCss = touchProp[options.swipeDirection],
                bodyElem = document.documentElement;
            
            el.style.msTouchAction = touchPropCss; // add touch-action and -ms-touch-action properties to element to prevent default swipe action on MS touch devices
            el.style.touchAction = touchPropCss;

            if (el.addEventListener) { // check for addEventListener support to prevent errors (and any of these functions attaching to the element) in old IE
                el.addEventListener(startTouch, slideStart);
                el.addEventListener(cancelTouch, swipeReset); // reset main variables and remove event listeners if the touch is cancelled
            }

            function swipeReset() { // reset main variables and remove event listeners
                touchNum--;
                startX = 0; movementX = 0; startY = 0; movementY = 0; scrolling = true; startPointerId = -1; direction = null;
                el.removeEventListener(moveTouch, slideMove); // remove move and end event listeners
                el.removeEventListener(endTouch, slideEnd);
                // reenable touch events on the html tag, only if all touch events have been removed and the specified element does not match html tag
                if (touchNum === 0 && el !== bodyElem){ 
                    bodyElem.style.msTouchAction = 'auto';
                    bodyElem.style.touchAction = 'auto';
                }
                if (msTouchDevice) { // remove move and end events from the html element
                    bodyElem.removeEventListener(moveTouch, slideMove);
                    bodyElem.removeEventListener(endTouch, slideEnd);
                }
                if (typeof options.reset == "function"){
                    options.reset(sentData);
                }
            }

            function toProceed(event, touchType){ // the conditionals that determine whether the touch event should be ignored or not
                var check = msTouchDevice ? event.pointerType === 'touch' || event.pointerType === 2 : true; // in IE, make sure the event type is touch (insted of pen or mouse)
                if (check){
                    switch(touchType){
                        case 'start':
                            check = startPointerId === -1;
                        break;
                        case 'move':
                            if (msTouchDevice){
                                check = startPointerId === event.pointerId;
                            } else { // targetTouches check on webkit to check touches on the element - allows for user to have swipe interactions on more than one element at a time
                                check = startPointerId === event.targetTouches[0].identifier;
                            }
                        break;
                        case 'end':
                            if (msTouchDevice){
                                check = startPointerId === event.pointerId;
                            } else { // need to check the changedTouches object on webkit here, as targetTouches will return empty if only one touch was present
                                check = startPointerId === event.changedTouches[0].identifier
                            }
                        break;
                    }
                }
                return check;
            }

            function slideStart(event) {
                if (toProceed(event, 'start')) {
                    var touchEvent = msTouchDevice ? event : event.targetTouches[0]; // use targetTouches on webkit to detect touches on the current element
                    startX = touchEvent.clientX;
                    startY = touchEvent.clientY;

                    el.addEventListener(moveTouch, slideMove); // bind move and end eventlisteners
                    el.addEventListener(endTouch, slideEnd);

                    if (msTouchDevice) { // bind move and end events for MSTouch to the html element as well, to support movement if touch leaves element area
                        bodyElem.addEventListener(moveTouch, slideMove);
                        bodyElem.addEventListener(endTouch, slideEnd);
                    }

                    startPointerId = msTouchDevice ? touchEvent.pointerId : touchEvent.identifier; // define initial pointerId to check against to prevent multi-touch issues
                    
                    // disable touch events on the body whilst interacting with the specified element(s) to prevent unusual interactions
                    // only set on first touch, and not set if element is the html tag
                    if (touchNum === 0 && el !== bodyElem){ 
                        bodyElem.style.msTouchAction = 'none';
                        bodyElem.style.touchAction = 'none';
                    }
                    touchNum++;
                    if (typeof options.start == "function") {
                        options.start();
                    }
                }
            }

            function slideMove(event) {
                if (toProceed(event, 'move')) {
                    var touchEvent = msTouchDevice ? event : event.targetTouches[0];
                    movementX = touchEvent.clientX - startX;
                    movementY = touchEvent.clientY - startY;

                    if (scrolling) { // important not to do this check if scrolling has already been disabled as it can cancel the swipe movement if user starts trying to scroll
                        var scrollCheck = { 'horizontal': Math.abs(movementY) > Math.abs(movementX), 'vertical': Math.abs(movementY) < Math.abs(movementX), 'all': false };
                        scrolling = scrollCheck[options.swipeDirection]; // detect if user is trying to scroll
                    }

                    if (!scrolling) {
                        event.preventDefault(); // prevent browser default behaviour if swiping in defined "swipeDirection"
                        if (typeof options.moving == "function") {
                            sentData.posX = movementX; sentData.posY = movementY;
                            options.moving(sentData);
                        }
                    } else {
                        swipeReset();
                    }
                }
            }

            function slideEnd(event) {
                if (toProceed(event, 'end')) {
                    if (!scrolling) {
                        direction = {
                            'horizontal': movementX > options.threshold ? 'right' : movementX < -options.threshold ? 'left' : 'notReached',
                            'vertical': movementY > options.threshold ? 'down' : movementY < -options.threshold ? 'up' : 'notReached',
                            'all': null
                        }[options.swipeDirection];
                        if (typeof options.beforeEnd == "function"){
                            options.beforeEnd(sentData);   
                        }
                        if (typeof options[direction] == "function"){
                            options[direction](sentData);
                        }
                    }
                    if (typeof options.end == "function") {
                        options.end(sentData);
                    }
                    swipeReset(); // reset main variables and unbind move and end events
                }
            }
        }
    }
    var jQLoaded = window.jQuery !== undefined || false;
    if (jQLoaded){ // allows the script to be used as a jQuery plugin if jQuery is present
        jQuery.fn.lpswipe = function(args){
            lpswipe(jQuery(this), args);
        }
    }
})();
