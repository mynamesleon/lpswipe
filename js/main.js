/* 
 * ---------------------------------------- *
 * Name: Primary JavaScripts                *
 * Type: JavaScript                         *
 * Version: 1.0.0                           *
 * Author: Leon Slater | Codehouse LTD      *
 * ---------------------------------------- *
 */

$('html').removeClass('no-js').addClass('js');

$(document).ready(function(){    
    siteNav.init();
});

var requestAnimFrame = window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || 
        window.oRequestAnimationFrame || window.msRequestAnimationFrame,
    cancelAnimFrame = window.cancelAnimationFrame || window.webkitCancelAnimationFrame || window.mozCancelAnimationFrame || 
        window.oCancelAnimationFrame || window.msCancelAnimationFrame;

var siteNav = {
    
    init: function(){      
        siteNav.storeVars();
        siteNav.domEvents();
        siteNav.setNavSwipe();
        siteNav.setNavScrollOne();
    },
    
    storeVars: function(){
        siteNav.$body = $('body');
        siteNav.$mainNav = $('#main-nav');
        siteNav.$mobHeader = $('#mob-header');
        siteNav.$mobOpener = siteNav.$mobHeader.find('.mobile-opener');
        siteNav.mainNavWidth = siteNav.$mainNav.outerWidth();
        siteNav.overrideNavScroll = false;
    },
    
    setTransforms: function($elem, prop){
        $elem.css({'-webkit-transform': prop, '-moz-transform': prop, '-o-transform': prop, 'transform': prop});
    },
    
    closeNav: function(){
        siteNav.setTransforms(siteNav.$mainNav, 'translate3d('+ siteNav.mainNavWidth +'px, 0, 0)');
        siteNav.setTransforms(siteNav.$mobHeader, 'translate3d(0, 0, 0)');
    },
    
    openNav: function(){
        siteNav.setTransforms(siteNav.$mainNav, 'translate3d(0, 0, 0)');
        siteNav.setTransforms(siteNav.$mobHeader, 'translate3d(-'+ siteNav.mainNavWidth +'px, 0, 0)');
    },
    
    navMovementPrep: function(d){
        var navState = siteNav.$body.hasClass('open-nav') ? 'open' : 'closed', // if nav is open or closed
            direction = d.posX > 0 ? 'right' : 'left', // if swipe is going to the right, or left
        movementObj = {
            'open': { 
                'right': function(){ 
                    if (d.posX < siteNav.mainNavWidth){ 
                        siteNav.navClosingMovement(d.posX, d.posX + siteNav.mainNavWidth);
                    } else { // if user has swiped further to the right than the width of the nav
                        siteNav.closeNav(); // use closeNav function to ensure that nav is in correct position off screen
                    }
                },
                'left': siteNav.openNav 
            },
            'closed': { 
                'right': siteNav.closeNav, 
                'left': function(){ 
                    if (d.posX <= -siteNav.mainNavWidth){ // if at or past the navwidth, force nav to stay in final open state
                        siteNav.openNav(); // use openNav function to ensure that nav is in correct position on screen
                    } else {
                        siteNav.navOpeningMovement(d.posX, d.posX + siteNav.mainNavWidth);
                    }
                }
            },
        }[navState][direction]();
    },
    
    navOpeningMovement: function(posX, mainNavPos){
        siteNav.setTransforms(siteNav.$mobHeader, 'translate3d('+ posX +'px, 0, 0)');
        siteNav.setTransforms(siteNav.$mainNav, 'translate3d('+ mainNavPos +'px, 0, 0)');
    },
    
    navClosingMovement: function(posX, mainNavPos){
        var mobHeaderMovement = -siteNav.mainNavWidth + posX;
        siteNav.setTransforms(siteNav.$mobHeader, 'translate3d('+ mobHeaderMovement +'px, 0, 0)');
        siteNav.setTransforms(siteNav.$mainNav, 'translate3d('+ posX +'px, 0, 0)');
    },
        
    setNavSwipe: function(){
        $('html').lpswipe({
            threshold: 50,
            swipeDirection: 'horizontal',
            start: function(){
                siteNav.mainNavWidth = siteNav.$mainNav.outerWidth(); // reset when opening/closing nav to ensure width is detected correctly
                siteNav.$mobHeader.add(siteNav.$mainNav).removeClass('transition');
            },
            beforeEnd: function(){
                cancelAnimFrame(animRequestId);
                siteNav.$mobHeader.add(siteNav.$mainNav).addClass('transition'); // add classes here to ensure animation works on MS surface
            },
            left: function(){
                if (!siteNav.$body.hasClass('open-nav')){
                    siteNav.$body.addClass('open-nav');
                    siteNav.openNav();
                }
            },
            right: function(){            
                if (siteNav.$body.hasClass('open-nav')){
                    siteNav.$body.removeClass('open-nav');
                    siteNav.closeNav();
                }
            },
            moving: function(d){
                animRequestId = requestAnimFrame(function(){
                    siteNav.navMovementPrep(d);
                });
            },
            notReached: function(){
                if (siteNav.$body.hasClass('open-nav')){
                    siteNav.openNav(); // reset to open nav position
                } else {
                    siteNav.closeNav(); // reset to closed nav position
                }
            },
            reset: function(){
                siteNav.$mobHeader.add(siteNav.$mainNav).addClass('transition'); // add classes here to reenable animations if user hasn't used custom swipe action
            }
        });
    },
    
    setNavScrollOne: function(){ // option 1: use swipe library to override all touch movement in the sidenav
        var currentTop;
        siteNav.$mainNav.lpswipe({
            threshold: 0,
            swipeDirection: 'vertical',
            start: function(){
                if (siteNav.$mainNav[0].scrollHeight > siteNav.$mainNav.outerHeight()){ // detect if the nav is scrollable
                    siteNav.overrideNavScroll = true;
                    currentTop = siteNav.$mainNav.scrollTop();
                }  
            },
            moving: function(d){
                if (siteNav.overrideNavScroll){
                    siteNav.$mainNav.scrollTop(currentTop - d.posY);
                }
            },
            reset: function(){
                siteNav.overrideNavScroll = false;
            }
        });
    },

    domEvents: function(){
        var clickEvent = 'ontouchstart' in window ? 'touchend' : 'click';
        siteNav.$mobOpener.on(clickEvent, function(){ // bind click event for menu icon
            siteNav.mainNavWidth = siteNav.$mainNav.outerWidth(); // reset when opening/closing nav to ensure width is detected correctly
            siteNav.$body.toggleClass('open-nav');
            if (siteNav.$body.hasClass('open-nav')){
                siteNav.openNav();
            } else {
                siteNav.closeNav();
            }
        });

        $('#container').on('touchmove', function(e){ // prevent scrolling on the body on webkit mobile devices when nav is open
            if (siteNav.$body.hasClass('open-nav')){
                e.preventDefault();
            }
        });

        var resizeTimer,
            orientationchanged = true, 
            newOrientation,
            oldOrientation = $(window).width() > $(window).height() ? 'landscape' : 'portrait',
            isMobile = /android|webos|iphone|ipad|ipod|blackberry|windows phone/i.test(navigator.userAgent.toLowerCase());

        $(window).resize(function(){ // resize event - custom orientation change check for mobile
            if (resizeTimer){
                clearTimeout(resizeTimer);
            }
            resizeTimer = setTimeout(function(){
                if (isMobile){
                    newOrientation = $(window).width() > $(window).height() ? 'landscape' : 'portrait';
                    orientationchanged = newOrientation == oldOrientation ? false : true;
                }

                if (orientationchanged){
                    oldOrientation = newOrientation;
                    siteNav.overrideNavScroll = false;
                    siteNav.mainNavWidth = siteNav.$mainNav.outerWidth(); // reset when resizing in case any styling affects the width
                    siteNav.$body.removeClass('open-nav');	
                    siteNav.closeNav();
                }
            }, 100);
        });
    }
    
};