/**
  * tiny-slider
  * @version 1.0.0
  * @author William Lin
  * @license The MIT License (MIT)
  * @github https://github.com/ganlanyuan/tiny-slider/
  */

var tns = (function () {
  'use strict';

  var TRANSFORM = gn.getSupportedProp([
        'transform', 
        'WebkitTransform', 
        'MozTransform', 
        'OTransform'
      ]),
      transitions = {
        'transitionDuration': ['transitionDelay', 'transitionend'],
        'WebkitTransitionDuration': ['WebkitTransitionDelay', 'oTransitionEnd'],
        'MozTransitionDuration': ['MozTransitionDelay', 'transitionend'],
        'OTransitionDuration': ['OTransitionDelay', 'webkitTransitionEnd']
      },
      animations = {
        'animationDuration': ['animationDelay', 'animationend'],
        'WebkitAnimationDuration': ['WebkitAnimationDelay', 'oAnimationEnd'],
        'MozAnimationDuration': ['MozAnimationDelay', 'animationend'],
        'OAnimationDuration': ['OAnimationDelay', 'webkitAnimationEnd']
      },
      TRANSITIONDURATION = whichProperty(transitions)[0],
      TRANSITIONDELAY = whichProperty(transitions)[1],
      TRANSITIONEND = whichProperty(transitions)[2],
      ANIMATIONDURATION = whichProperty(animations)[0],
      ANIMATIONDELAY = whichProperty(animations)[1],
      ANIMATIONEND = whichProperty(animations)[2],
      KEY = {
        ENTER: 13,
        SPACE: 32,
        PAGEUP: 33,
        PAGEDOWN: 34,
        END: 35,
        HOME: 36,
        LEFT: 37,
        UP: 38,
        RIGHT: 39,
        DOWN: 40
      };
// console.log(
//   TRANSITIONDURATION,
//   TRANSITIONDELAY,
//   TRANSITIONEND,
//   ANIMATIONDURATION,
//   ANIMATIONDELAY,
//   ANIMATIONEND
//   );

  function core (options) {
    options = gn.extend({
      container: document.querySelector('.slider'),
      mode: 'carousel',
      axis: 'horizontal',
      items: 1,
      gutter: 0,
      edgePadding: 0,
      fixedWidth: false,
      slideBy: 1,
      controls: true,
      controlsText: ['prev', 'next'],
      controlsContainer: false,
      nav: true,
      navContainer: false,
      arrowKeys: false,
      speed: 300,
      autoplay: false,
      autoplayTimeout: 5000,
      autoplayDirection: 'forward',
      autoplayText: ['start', 'pause'],
      animateIn: 'tns-fadeIn',
      animateOut: 'tns-fadeOut',
      animateNormal: 'tns-normal',
      animateDelay: false,
      loop: true,
      autoHeight: false,
      responsive: false,
      lazyload: false,
      touch: true,
      rewind: false
    }, options || {});

    // make sure slide container exists
    if (typeof options.container !== 'object' || options.container === null) {
      return {
        destory: function () {},
        events: events,
      }; 
    }

    // === define and set variables ===
    var mode = options.mode,
        axis = options.axis,
        wrapper = document.createElement('div'),
        contentWrapper = document.createElement('div'),
        container = options.container,
        slideItems = container.children,
        slideCount = slideItems.length,
        items = options.items,
        slideBy = getSlideBy(),
        gutter = options.gutter,
        edgePadding = (mode === 'gallery') ? false : options.edgePadding,
        fixedWidth = options.fixedWidth,
        arrowKeys = options.arrowKeys,
        speed = options.speed,
        rewind = options.rewind,
        loop = (mode === 'gallery')? true: (options.rewind)? false : options.loop,
        autoHeight = (mode === 'gallery') ? true : options.autoHeight,
        responsive = (fixedWidth) ? false : options.responsive,
        lazyload = options.lazyload,
        slideId = container.id || getSlideId(),
        slideWidth = fixedWidth || 0,
        slideTopEdges, // collection of slide top edges
        slideItemsOut = [],
        cloneCount = (loop) ? slideCount * 2 : (edgePadding) ? 1 : 0,
        slideCountNew = (mode === 'gallery') ? slideCount + cloneCount : slideCount + cloneCount * 2,
        hasRightDeadZone = (fixedWidth && !loop && !edgePadding)? true : false,
        checkIndexBeforeTransform = (mode === 'gallery' || !loop)? true : false,
        // controls
        controls = options.controls,
        controlsText = options.controlsText,
        controlsContainer = (!options.controlsContainer) ? false : options.controlsContainer,
        prevButton,
        nextButton,
        // nav
        nav = options.nav,
        navContainer = (!options.navContainer) ? false : options.navContainer,
        navItems,
        navCountVisible,
        navCountVisibleCached = slideCount,
        navClicked = -1,
        navCurrent = 0,
        navCurrentCached = 0,
        // index
        index = (mode === 'gallery') ? 0 : cloneCount,
        indexCached = index,
        indexAdjust = (edgePadding) ? 1 : 0,
        indexMin = indexAdjust,
        indexMax,
        vw,
        // autoplay
        autoplay = options.autoplay,
        autoplayTimeout = options.autoplayTimeout,
        autoplayDirection = (options.autoplayDirection === 'forward') ? 1 : -1,
        autoplayText = options.autoplayText,
        autoplayTimer,
        autoplayButton,
        animating = false,
        // touch
        touch = options.touch,
        startX = 0,
        startY = 0,
        translateInit,
        disX,
        disY,
        touchStarted,
        // gallery
        animateIn = (ANIMATIONDURATION) ? options.animateIn : 'tns-fadeIn',
        animateOut = (ANIMATIONDURATION) ? options.animateOut : 'tns-fadeOut',
        animateNormal = (ANIMATIONDURATION) ? options.animateNormal : 'tns-normal',
        animateDelay = (ANIMATIONDURATION) ? options.animateDelay : false,
        // resize and scroll
        resizeTimer,
        ticking = false;

    // === COMMON FUNCTIONS === //
    function getSlideBy () {
      return (mode === 'gallery' || options.slideBy === 'page') ? items : options.slideBy;
    }

    var getItems = (function () {
      if (!fixedWidth) {
        return function () {
          var itemsTem = options.items,
              // ww = document.documentElement.clientWidth,
              bpKeys = (typeof responsive === 'object') ? Object.keys(responsive) : false;

          if (bpKeys) {
            for (var i = 0; i < bpKeys.length; i++) {
              if (vw >= bpKeys[i]) { itemsTem = responsive[bpKeys[i]]; }
            }
          }
          return Math.max(1, Math.min(slideCount, itemsTem));
        };

      } else {
        return function () { return Math.max(1, Math.min(slideCount, Math.floor(vw / fixedWidth))); };
      }
    })();

    var getSlideWidth = (function () {
      if (navigator.appVersion.indexOf("MSIE 8") > 0) {
        return function () { return Math.round((vw + gutter) / items); };
      } else {
        return function () { return (vw + gutter) / items; };
      }
    })();

    var getVisibleNavCount = (function () {
      if (options.navContainer) {
        return function () { return slideCount; };
      } else {
        return function () { return Math.ceil(slideCount / items); };
      }
    })();

    var getViewWidth = (function () {
      // horizantal carousel: fluid width && edge padding
      //  => inner wrapper view width
      if (axis === 'horizontal' && !fixedWidth && edgePadding) { 
        return function () { return wrapper.clientWidth - (edgePadding + gutter) * 2; };
      // horizantal carousel: fixed width || fluid width but no edge padding
      // vertical carousel
      //  => wrapper view width
      } else {
        return function () { return wrapper.clientWidth; };
      }
    })();

    // compare slide count & items
    // (items) => nav, controls, autoplay
    function checkSlideCount() {
      // a. slide count < items
      //  => disable nav, controls, autoplay
      if (slideCount <= items) { 
        arrowKeys = false;

        var indexTem;
        index = (mode === 'gallery') ? 0 : cloneCount;
        if (index !== indexTem) { events.emit('indexChanged', info()); }

        if (navContainer) { hideElement(navContainer); }
        if (controlsContainer) { hideElement(controlsContainer); }
        if (autoplayButton) { hideElement(autoplayButton); }
      // b. slide count > items
      //  => enable nav, controls, autoplay
      } else {
        arrowKeys = options.arrowKeys;
        if (nav) { showElement(navContainer); }
        if (controls) { showElement(controlsContainer); }
        if (autoplay) { showElement(autoplayButton); }
      }
    }

    // === INITIALIZATION FUNCTIONS === //
    function wrapperInit() {
      setAttrs(wrapper, {'data-tns-role': 'wrapper'});
      setAttrs(contentWrapper, {'data-tns-role': 'content-wrapper'});
      if (axis === 'vertical') { 
        setAttrs(contentWrapper, {'data-tns-hidden': 'y'}); 
      } else {
        setAttrs(wrapper, {'data-tns-hidden': 'x'}); 
      }

      if (mode === 'carousel') {
        var gap = (fixedWidth && edgePadding) ? getFixedWidthEdgePadding() : (edgePadding) ? edgePadding + gutter : 0;
        contentWrapper.style.cssText = (axis === 'horizontal') ? 'margin: 0 ' + gap + 'px;' : 'padding: ' + gap + 'px 0 ' + edgePadding + 'px; height: ' + getVerticalWrapperHeight() + 'px;'; 
      }
    }

    // vw => items => indexMax, slideWidth, navCountVisible, slideBy
    function getVariables() {
      vw = getViewWidth();
      items = getItems();
      indexMax = slideCountNew - items - indexAdjust;

      if (axis === 'horizontal' && !fixedWidth) { slideWidth = getSlideWidth(); }
      navCountVisible = getVisibleNavCount();
      slideBy = getSlideBy();
    }

    function containerInit() {
      // add id
      if (container.id === '') { container.id = slideId; }

      // add attributes
      var features = '';
      if (axis) { features += axis; }
      if (autoHeight) { features += ' autoheight'; }
      setAttrs(container, {
        'data-tns-role': 'content', 
        'data-tns-mode': mode, 
        'data-tns-features': features
      });

      // init transform
      if (mode === 'carousel') {
        if (axis === 'horizontal') {
          var size = 'width: ' + (slideWidth + 1) * slideCountNew + 'px; ',
              x = (-index * slideWidth),
              transforms = (TRANSFORM) ? TRANSFORM + ': translate3d(' + x + 'px, 0px, 0px)' : 'left: ' + x + 'px';
          container.style.cssText += size + transforms;
        } else {
          var y = -slideTopEdges[index];
          container.style.cssText += (TRANSFORM) ? TRANSFORM + ': translate3d(0px, ' + y + 'px, 0px)' : 'top: ' + y + 'px';
        }
      }
    }

    // for IE10
    function msInit() {
      if (navigator.msMaxTouchPoints) {
        wrapper.classList.add('ms-touch');
        addEvents(wrapper, ['scroll', ie10Scroll]);
      }
    }

    function slideItemsInit() {
      for (var x = 0; x < slideCount; x++) {
        var item = slideItems[x];

        // add slide id
        item.id = slideId + '-item' + x;

        // add class
        if (mode === 'gallery' && animateNormal) { item.classList.add(animateNormal); }

        // add aria-hidden attribute
        setAttrs(item, {'aria-hidden': 'true'});

        // set slide width & gutter
        var gutterPosition = (axis === 'horizontal') ? 'right' : 'bottom', 
            styles = '';
        if (mode === 'carousel') { styles = 'margin-' + gutterPosition + ': ' + gutter + 'px;'; }
        if (axis === 'horizontal') { styles = 'width: ' + (slideWidth - gutter) + 'px; ' + styles; }
        item.style.cssText += styles;
      }

      // clone slides
      if (loop || edgePadding) {
        var fragmentBefore = document.createDocumentFragment(), 
            fragmentAfter = document.createDocumentFragment();

        for (var j = cloneCount; j--;) {
          var num = j%slideCount,
              cloneFirst = slideItems[num].cloneNode(true);
          removeAttrs(cloneFirst, 'id');
          fragmentAfter.insertBefore(cloneFirst, fragmentAfter.firstChild);

          if (mode === 'carousel') {
            var cloneLast = slideItems[slideCount - 1 - num].cloneNode(true);
            removeAttrs(cloneLast, 'id');
            fragmentBefore.appendChild(cloneLast);
          }
        }

        container.insertBefore(fragmentBefore, container.firstChild);
        container.appendChild(fragmentAfter);
        slideItems = container.children;
      }
    }

    function controlsInit() {
      if (controls) {
        if (!options.controlsContainer) {
          gn.append(wrapper, '<div data-tns-role="controls" aria-label="Carousel Navigation"><button data-controls="prev" tabIndex="-1" aria-controls="' + slideId +'" type="button">' + controlsText[0] + '</button><button data-controls="next" tabIndex="0" aria-controls="' + slideId +'" type="button">' + controlsText[1] + '</button></div>');

          controlsContainer = wrapper.querySelector('[data-tns-role="controls"]');
        }

        prevButton = controlsContainer.querySelector('[data-controls="prev"]');
        nextButton = controlsContainer.querySelector('[data-controls="next"]');

        if (!hasAttr(controlsContainer, 'tabIndex')) {
          setAttrs(controlsContainer, {'aria-label': 'Carousel Navigation'});
          setAttrs(controlsContainer.children, {
            'aria-controls': slideId,
            'tabIndex': '-1',
          });
        }
      }
    }

    function navInit() {
      if (nav) {
        if (!options.navContainer) {
          var navHtml = '';
          for (var i = 0; i < slideCount; i++) {
            navHtml += '<button data-slide="' + i +'" tabIndex="-1" aria-selected="false" aria-controls="' + slideId + '-item' + i +'" type="button"></button>';
          }
          if (autoplay) {
            navHtml += '<button data-action="stop" type="button"><span hidden>Stop Animation</span>' + autoplayText[0] + '</button>';
          }
          navHtml = '<div data-tns-role="nav" aria-label="Carousel Pagination">' + navHtml + '</div>';
          gn.append(wrapper, navHtml);
          navContainer = wrapper.querySelector('[data-tns-role="nav"]');
        }
        navItems = navContainer.querySelectorAll('[data-slide]');

        // for customized nav container
        if (!hasAttr(navContainer, 'aria-label')) {
          setAttrs(navContainer, {'aria-label': 'Carousel Pagination'});
          for (var y = 0; y < slideCount; y++) {
            setAttrs(navItems[y], {
              'tabIndex': '-1',
              'aria-selected': 'false',
              'aria-controls': slideId + '-item' + y,
            });
          }
        }

        for (var j = navCountVisible; j < slideCount; j++) {
          setAttrs(navItems[j], {'hidden': ''});
        }
        navCountVisibleCached = navCountVisible;
      }
    }

    function autoplayInit() {
      if (autoplay) {
        if (!navContainer) {
          gn.append(wrapper, '<div data-tns-role="nav" aria-label="Carousel Pagination"><button data-action="stop" type="button"><span hidden>Stop Animation</span>' + autoplayText[0] + '</button></div>');
          navContainer = wrapper.querySelector('[data-tns-role="nav"]');
        }
        autoplayButton = navContainer.querySelector('[data-action]');
        startAction();
      }
    }

    function activateSlider() {
      for (var i = index; i < index + items; i++) {
        var item = slideItems[i];
        setAttrs(item, {'aria-hidden': 'false'});
        if (mode === 'gallery') { 
          item.style.marginLeft = slideWidth * (i - index) + 'px'; 
          item.classList.remove(animateNormal);
          item.classList.add(animateIn);
        }
      }
      if (controls) {
        setAttrs(nextButton, {'tabIndex': '0'});
        if (index === indexMin && !loop || rewind) {
          prevButton.disabled = true;
        }
      }
      if (nav) {
        setAttrs(navItems[0], {'tabIndex': '0', 'aria-selected': 'true'});
      }
    }

    function addSliderEvents() {
      if (mode === 'carousel') {
        if (TRANSITIONEND) {
          addEvents(container, [TRANSITIONEND, onTransitionEnd]);
        }
        if (touch) {
          addEvents(container, [
            ['touchstart', onTouchStart],
            ['touchmove', onTouchMove],
            ['touchend', onTouchEnd],
            ['touchcancel', onTouchEnd]
          ]);
        }
      }
      if (nav) {
        for (var y = 0; y < slideCount; y++) {
          addEvents(navItems[y],[
            ['click', onClickNav],
            ['keydown', onKeydownNav]
          ]);
        }
      }
      if (controls) {
        addEvents(prevButton,[
          ['click', onClickPrev],
          ['keydown', onKeydownControl]
        ]);
        addEvents(nextButton,[
          ['click', onClickNext],
          ['keydown', onKeydownControl]
        ]);
      }
      if (autoplay) {
        addEvents(autoplayButton, ['click', toggleAnimation]);

        if (controls) {
          addEvents(prevButton, ['click', stopAnimation]);
          addEvents(nextButton, ['click', stopAnimation]);
        }

        if (nav) {
          for (var b = slideCount; b--;) {
            addEvents(navItems[b], ['click', stopAnimation]);
          }
        }
      }
      if (arrowKeys) {
        addEvents(document, ['keydown', onKeydownDocument]);
      }
      addEvents(window, [
        ['resize', onResize],
        ['scroll', onScroll]
      ]);
    }

    // lazyload
    function lazyLoad() {
      if (lazyload && gn.isInViewport(container)) {
        var arr = [];
        for(var i = index - 1; i < index + items + 1; i++) {
          var imgsTem = slideItems[i].querySelectorAll('[data-tns-role="lazy-img"]');
          for(var j = imgsTem.length; j--; arr.unshift(imgsTem[j]));
          arr.unshift();
        }

        for (var h = arr.length; h--;) {
          var img = arr[h];
          if (!img.classList.contains('loaded')) {
            img.src = getAttr(img, 'data-src');
            img.classList.add('loaded');
          }
        }
      }
    }

    // check if all visible images are loaded
    // and update container height if it's done
    function runAutoHeight() {
      if (autoHeight) {
        // get all images inside visible slide items
        var images = [];

        for (var i = index; i < index + items; i++) {
          var imagesTem = slideItems[i].querySelectorAll('img');
          for (var j = imagesTem.length; j--;) {
            images.push(imagesTem[j]);
          }
        }

        if (images.length === 0) {
          updateContainerHeight(); 
        } else {
          checkImagesLoaded(images);
        }
      }
    }

    function checkImagesLoaded(images) {
      for (var i = images.length; i--;) {
        if (imageLoaded(images[i])) {
          images.splice(i, 1);
        }
      }

      if (images.length === 0) {
        updateContainerHeight();
      } else {
        setTimeout(function () { 
          checkImagesLoaded(images); 
        }, 16);
      }
    } 

    function sliderInit() {
      // First thing first, wrap container with "wrapper > contentWrapper",
      // to get the correct view width
      gn.wrap(container, contentWrapper);
      gn.wrap(contentWrapper, wrapper);

      getVariables(); // vw => items => indexMax, slideWidth, navCountVisible, slideBy
      slideItemsInit();
      if (axis === 'vertical') { getSlideTopEdges(); } // (init) => slideTopEdges

      wrapperInit();
      containerInit();
      msInit();
      controlsInit();
      navInit();
      autoplayInit();

      activateSlider();
      addSliderEvents();
      checkSlideCount(); // (items) => nav, controls, autoplay

      lazyLoad();
      runAutoHeight();
      events.emit('initialized', info());
    }
    sliderInit();

    // (vw) => edgePadding
    function getFixedWidthEdgePadding() {
      return (vw%fixedWidth + gutter) / 2;
    }

    // update container height
    // 1. get the max-height of the visible slides
    // 2. set transitionDuration to speed
    // 3. update container height to max-height
    // 4. set transitionDuration to 0s after transition done
    function updateContainerHeight() {
      var heights = [], maxHeight;
      for (var i = index; i < index + items; i++) {
        heights.push(slideItems[i].offsetHeight);
      }
      maxHeight = Math.max.apply(null, heights);

      if (container.style.height !== maxHeight) {
        if (TRANSITIONDURATION) { setDurations(1); }
        container.style.height = maxHeight + 'px';
      }
    }

    // get the distance from the top edge of the first slide to each slide
    // (init) => slideTopEdges
    function getSlideTopEdges() {
      slideTopEdges = [0];
      var topFirst = slideItems[0].getBoundingClientRect().top, top;
      for (var i = 1; i < slideCountNew; i++) {
        top = slideItems[i].getBoundingClientRect().top;
        slideTopEdges.push(top - topFirst);
      }
    }

    // get wrapper height
    // (slideTopEdges, index, items) => vertical_conentWrapper.height
    function getVerticalWrapperHeight() {
      return slideTopEdges[index + items] - slideTopEdges[index];
    }

    // set snapInterval (for IE10)
    function setSnapInterval() {
      wrapper.style.msScrollSnapPointsX = 'snapInterval(0%, ' + slideWidth + ')';
    }

    // update slide
    function updateSlideStatus() {
      var h1, h2, v1, v2;
      if (index !== indexCached) {
        if (index > indexCached) {
          h1 = indexCached;
          h2 = Math.min(indexCached + items, index);
          v1 = Math.max(indexCached + items, index);
          v2 = index + items;
        } else {
          h1 = Math.max(index + items, indexCached);
          h2 = indexCached + items;
          v1 = index;
          v2 = Math.min(index + items, indexCached);
        }
      }

      if (slideBy%1 !== 0) {
        h1 = Math.round(h1);
        h2 = Math.round(h2);
        v1 = Math.round(v1);
        v2 = Math.round(v2);
      }

      for (var i = h1; i < h2; i++) {
        setAttrs(slideItems[i], {'aria-hidden': 'true'});
      }
      for (var j = v1; j < v2; j++) {
        setAttrs(slideItems[j], {'aria-hidden': 'false'});
      }
    }

    // set tabIndex & aria-selected on Nav
    function updateNavStatus() {
      // get current nav
      if (nav) {
        if (navClicked === -1) {
          if (options.navContainer) {
            navCurrent = index%slideCount;
          } else {
            navCurrent = Math.floor(index%slideCount / items);
            // non-loop & reach the edge
            if (!loop && slideCount%items !== 0 && index === indexMax) { navCurrent += 1; }
          }
        } else {
          navCurrent = navClicked;
          navClicked = -1;
        }

        if (navCurrent !== navCurrentCached) {
          setAttrs(navItems[navCurrentCached], {
            'tabIndex': '-1',
            'aria-selected': 'false'
          });

          setAttrs(navItems[navCurrent], {
            'tabIndex': '0',
            'aria-selected': 'true'
          });
          navCurrentCached = navCurrent;
        }
      }
    }

    // set 'disabled' to true on controls when reach the edge
    function updateControlsStatus() {
      if (controls && !loop) {
        var disable = [], active = [];
        if (index === indexMin) {
          disable.push(prevButton);
          active.push(nextButton);
          changeFocus(prevButton, nextButton);
        } else if (!rewind && index === indexMax) {
          disable.push(nextButton);
          active.push(prevButton);
          changeFocus(nextButton, prevButton);
        } else {
          active.push(prevButton, nextButton);
        }

        if (disable.length > 0) {
          for (var i = disable.length; i--;) {
            var button = disable[i];
            if (!button.disabled) {
              button.disabled = true;
              setAttrs(button, {'tabIndex': '-1'});
            }
          }
        }

        if (active.length > 0) {
          for (var j = active.length; j--;) {
            var button = active[j];
            if (button.disabled) {
              button.disabled = false;
              setAttrs(button, {'tabIndex': '0'});
            }
          }
        }
      }
    }

    // set duration
    function setDurations (duration, target) {
      duration = (duration === 0)? '' : speed / 1000 + 's';
      target = target || container;
      target.style[TRANSITIONDURATION] = duration;

      if (mode === 'gallery') {
        target.style[ANIMATIONDURATION] = duration;
      }
      if (axis === 'vertical') {
        contentWrapper.style[TRANSITIONDURATION] = duration;
      }
    }

    // make transfer after click/drag:
    // 1. change 'transform' property for mordern browsers
    // 2. change 'left' property for legacy browsers
    var transformCore = (function () {
      if (mode === 'carousel') {
        return function (distance) {
          // if distance is not given, calculate the distance use index
          if (!distance) {
            distance = (axis === 'horizontal') ? -slideWidth * index : -slideTopEdges[index];
          }
          // constrain the distance when non-loop no-edgePadding fixedWidth reaches the right edge
          if (hasRightDeadZone && index === indexMax) {
            distance = Math.max(distance, -slideCountNew * slideWidth + vw + gutter);
          }

          var tran = 'translate3d(',
              map = {
                x: [TRANSFORM, tran, distance, 'px, 0px, 0px)'],
                y: [TRANSFORM, tran + '0px, ', distance, 'px, 0px)'],
                l: ['left', '', distance, 'px'],
                t: ['top', '', distance, 'px'],
              },
              attr = (axis === 'horizontal') ? (TRANSFORM) ? 'x' : 'l' : (TRANSFORM) ? 'y' : 't';
          container.style[map[attr][0]] = map[attr][1] + map[attr][2] + map[attr][3];
          if (axis === 'vertical') { contentWrapper.style.height = getVerticalWrapperHeight() + 'px'; }
        };
      } else {
        return function () {
          slideItemsOut = [];
          removeEvents(slideItems[indexCached], [
            [TRANSITIONEND, onTransitionEnd],
            [ANIMATIONEND, onTransitionEnd]
          ]);
          addEvents(slideItems[index], [
            [TRANSITIONEND, onTransitionEnd],
            [ANIMATIONEND, onTransitionEnd]
          ]);

          (function () {
            for (var i = indexCached, l = indexCached + items; i < l; i++) {
              var item = slideItems[i];
              if (TRANSITIONDURATION) { setDurations(1, item); }
              if (animateDelay && TRANSITIONDELAY) {
                var d = animateDelay * (i - indexCached) / 1000; 
                item.style[TRANSITIONDELAY] = d + 's'; 
                item.style[ANIMATIONDELAY] = d + 's'; 
              }
              item.classList.remove(animateIn);
              item.classList.add(animateOut);
              slideItemsOut.push(item);
            }
          })();

          (function () {
            for (var i = index, l = index + items; i < l; i++) {
              var item = slideItems[i];
              if (TRANSITIONDURATION) { setDurations(1, item); }
              if (animateDelay && TRANSITIONDELAY) {
                var d = animateDelay * (i - index) / 1000; 
                item.style[TRANSITIONDELAY] = d + 's'; 
                item.style[ANIMATIONDELAY] = d + 's'; 
              }
              item.classList.remove(animateNormal);
              item.classList.add(animateIn);
              if (i > index) { item.style.marginLeft = (i - index) * slideWidth + 'px'; }
            }
          })();
        };
      }
    })();

    function doTransform (duration, distance) {
      if (TRANSITIONDURATION) { setDurations(duration); }
      transformCore(distance);
    }

    // (slideBy, indexMin, indexMax) => index
    var checkIndex = (function () {
      if (loop) {
        return function () {
          var leftEdge = (mode === 'carousel')? slideBy + indexMin : indexMin, 
              rightEdge = (mode === 'carousel')? indexMax - slideBy : indexMax;

          if (index > rightEdge) {
            while(index >= leftEdge + slideCount) { index -= slideCount; }
          } else if(index < leftEdge) {
            while(index <= rightEdge - slideCount) { index += slideCount; }
          }
        };
      } else {
        return function () {
          index = Math.max(indexMin, Math.min(indexMax, index));
        };
      }
    })();

    function render() {
      setAttrs(container, {'aria-busy': 'true'});
      if (checkIndexBeforeTransform) { checkIndex(); }

      if (index !== indexCached) { events.emit('indexChanged', info()); }
      if (TRANSFORM) { events.emit('transitionStart', info()); }

      doTransform();
      if (!TRANSITIONEND) { onTransitionEnd(); }
    }

    // AFTER TRANSFORM
    // Things need to be done after a transfer:
    // 1. check index
    // 2. add classes to visible slide
    // 3. disable controls buttons when reach the first/last slide in non-loop slider
    // 4. update nav status
    // 5. lazyload images
    // 6. update container height
    function onTransitionEnd(e) {
      if (TRANSITIONEND) { events.emit('transitionEnd', info(e)); }

      if (mode === 'gallery' && slideItemsOut.length > 0) {
        for (var i = 0; i < items; i++) {
          var item = slideItemsOut[i];
          if (TRANSITIONDURATION) { setDurations(0, item); }
          if (animateDelay && TRANSITIONDELAY) { 
            item.style[TRANSITIONDELAY] = item.style[ANIMATIONDELAY] = '';
          }
          item.classList.remove(animateOut);
          item.classList.add(animateNormal);
          item.style.marginLeft = '';
        }
      }

      if (!TRANSITIONEND || e && e.propertyName !== 'height') {
        if (!checkIndexBeforeTransform) { 
          var indexTem = index;
          checkIndex(); // (slideBy, indexMin, indexMax) => index
          if (index !== indexTem) { 
            doTransform(0); 
            events.emit('indexChanged', info());
          }
        } 
        updateSlideStatus();
        updateNavStatus();
        updateControlsStatus();
        lazyLoad();
        runAutoHeight();

        removeAttrs(container, 'aria-busy');
        updateIndexCache();
      }
    }

    function updateIndexCache() {
      indexCached = index;
    }

    // # ACTIONS
    // on controls click
    function onClickControl(dir) {
      if (getAttr(container, 'aria-busy') !== 'true') {
        index = index + dir * slideBy;

        render();
      }
    }

    function onClickPrev() {
      onClickControl(-1);
    }

    function onClickNext() {
      if(rewind && index === indexMax){
        onClickControl(-(indexMax - indexMin) / slideBy);
      }else{
        onClickControl(1);
      }
    }

    // on doc click
    function onClickNav(e) {
      if (getAttr(container, 'aria-busy') !== 'true') {
        var clickTarget = e.target || e.srcElement, navIndex, indexGap;

        while (gn.indexOf(navItems, clickTarget) === -1) {
          clickTarget = clickTarget.parentNode;
        }

        navIndex = navClicked = Number(getAttr(clickTarget, 'data-slide'));
        index = (options.navContainer) ? navIndex + cloneCount : navIndex * items + cloneCount;

        if (index !== indexCached) { render(); }
      }
    }

    function startAction() {
      autoplayTimer = setInterval(function () {
        onClickControl(autoplayDirection);
      }, autoplayTimeout);
      autoplayButton.setAttribute('data-action', 'stop');
      autoplayButton.innerHTML = '<span hidden>Stop Animation</span>' + autoplayText[1];

      animating = true;
    }

    function stopAction() {
      clearInterval(autoplayTimer);
      autoplayButton.setAttribute('data-action', 'start');
      autoplayButton.innerHTML = '<span hidden>Stop Animation</span>' + autoplayText[0];

      animating = false;
    }

    function toggleAnimation() {
      if (animating) {
        stopAction();
      } else {
        startAction();
      }
    }

    function stopAnimation() {
      if (animating) { stopAction(); }
    }

    // 
    function onKeydownDocument(e) {
      e = e || window.event;
      switch(e.keyCode) {
        case KEY.LEFT:
          onClickPrev();
          break;
        case KEY.RIGHT:
          onClickNext();
      }
    }

    // change focus
    function changeFocus(blur, focus) {
      if (typeof blur === 'object' && 
          typeof focus === 'object' && 
          blur === document.activeElement) {
        blur.blur();
        focus.focus();
      }
    }

    // on key control
    function onKeydownControl(e) {
      e = e || window.event;
      var code = e.keyCode,
          curElement = document.activeElement;

      switch (code) {
        case KEY.LEFT:
        case KEY.UP:
        case KEY.HOME:
        case KEY.PAGEUP:
          if (curElement !== prevButton && prevButton.disabled !== true) {
            changeFocus(curElement, prevButton);
          }
          break;
        case KEY.RIGHT:
        case KEY.DOWN:
        case KEY.END:
        case KEY.PAGEDOWN:
          if (curElement !== nextButton && nextButton.disabled !== true) {
            changeFocus(curElement, nextButton);
          }
          break;
        case KEY.ENTER:
        case KEY.SPACE:
          if (curElement === nextButton) {
            onClickNext();
          } else {
            onClickPrev();
          }
          break;
      }
    }

    // on key nav
    function onKeydownNav(e) {
      e = e || window.event;
      var code = e.keyCode,
          curElement = document.activeElement,
          dataSlide = getAttr(curElement, 'data-slide');

      switch(code) {
        case KEY.LEFT:
        case KEY.PAGEUP:
          if (dataSlide > 0) { changeFocus(curElement, curElement.previousElementSibling); }
          break;
        case KEY.UP:
        case KEY.HOME:
          if (dataSlide !== 0) { changeFocus(curElement, navItems[0]); }
          break;
        case KEY.RIGHT:
        case KEY.PAGEDOWN:
          if (dataSlide < navCountVisible - 1) { changeFocus(curElement, curElement.nextElementSibling); }
          break;
        case KEY.DOWN:
        case KEY.END:
          if (dataSlide < navCountVisible - 1) { changeFocus(curElement, navItems[navCountVisible - 1]); }
          break;
        case KEY.ENTER:
        case KEY.SPACE:
          onClickNav(e);
          break;
      }
    }

    // IE10 scroll function
    function ie10Scroll() {
      doTransform(0, container.scrollLeft());
      updateIndexCache();
    }

    function onTouchStart(e) {
      var touchObj = e.changedTouches[0];
      startX = parseInt(touchObj.clientX);
      startY = parseInt(touchObj.clientY);
      var slicePositions = (axis === 'horizontal') ? [12, -13] : [17, -8];
      translateInit = Number(container.style[TRANSFORM].slice(slicePositions[0], slicePositions[1]));
      events.emit('touchStart', info(e));
    }

    function onTouchMove(e) {
      var touchObj = e.changedTouches[0];
      disX = parseInt(touchObj.clientX) - startX;
      disY = parseInt(touchObj.clientY) - startY;

      if (getTouchDirection(toDegree(disY, disX), 15) === axis) { 
        touchStarted = true;
        e.preventDefault();
        events.emit('touchMove', info(e));

        var x = 0, y = 0;
        if (axis === 'horizontal') {
          x = translateInit + disX;
        } else {
          y = translateInit + disY;
        }

        setDurations(0);
        container.style[TRANSFORM] = 'translate3d(' + x + 'px, ' + y + 'px, 0px';
      }
    }

    function onTouchEnd(e) {
      var touchObj = e.changedTouches[0];
      disX = parseInt(touchObj.clientX) - startX;
      disY = parseInt(touchObj.clientY) - startY;
      events.emit('touchEnd', info(e));

      if (touchStarted) {
        touchStarted = false;
        e.preventDefault();

        if (axis === 'horizontal') {
          index = - (translateInit + disX) / slideWidth;
          index = (disX > 0) ? Math.floor(index) : Math.ceil(index);
        } else {
          var moved = - (translateInit + disY);
          if (moved <= 0) {
            index = indexMin;
          } else if (moved >= slideTopEdges[slideTopEdges.length - 1]) {
            index = indexMax;
          } else {
            var i = 0;
            do {
              i++;
              index = (disY < 0) ? i + 1 : i;
            } while (i < slideCountNew && moved >= Math.round(slideTopEdges[i + 1]));
          }
        }

        render();
      }
    }

    // === RESIZE FUNCTIONS === //
    // (slideWidth) => container.width, slide.width
    function updateSlideWidth() {
      container.style.width = (slideWidth + 1) * slideCountNew + 'px'; // + 1 => fix half-pixel issue
      for (var i = slideCountNew; i--;) {
        slideItems[i].style.width = (slideWidth - gutter) + 'px';
      }
    }

    // (slideWidth, index, items) => gallery_visible_slide.marginLeft
    function updateSlidePosition() {
      for (var i = index + 1, len = index + items; i < len; i++) {
        slideItems[i].style.marginLeft = slideWidth * (i - index) + 'px';
      }
    }

    // (vw) => fixedWidth_contentWrapper.edgePadding
    function updateFixedWidthEdgePadding() {
      contentWrapper.style.cssText = 'margin: 0px ' + getFixedWidthEdgePadding() + 'px';
    }

    // (slideTopEdges, index, items) => vertical_conentWrapper.height
    function updateWrapperHeight() {
      contentWrapper.style.height = getVerticalWrapperHeight() + 'px';
    }

    // show or hide nav
    // (navCountVisible) => nav.[hidden]
    function updateNavDisplay() {
      if (navCountVisible !== navCountVisibleCached) {
        if (navCountVisible > navCountVisibleCached) {
          for (var i = navCountVisibleCached; i < navCountVisible; i++) {
            removeAttrs(navItems[i], 'hidden');
          }
        } else {
          for (var j = navCountVisible; j < navCountVisibleCached; j++) {
            setAttrs(navItems[j], {'hidden': ''});
          }
        }
      }
      navCountVisibleCached = navCountVisible;
    }

    function info(e) {
      return {
        container: container,
        slideItems: slideItems,
        navItems: navItems,
        prevButton: prevButton,
        nextButton: nextButton,
        items: items,
        index: index,
        indexCached: indexCached,
        navCurrent: navCurrent,
        navCurrentCached: navCurrentCached,
        slideCount: slideCount,
        cloneCount: cloneCount,
        slideCountNew: slideCountNew,
        event: e || {},
      };
    }

    function onResize() {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () {
        if (vw !== getViewWidth()) {
          var indexTem = index,
              itemsTem = items;
          getVariables(); // vw => items => indexMax, slideWidth, navCountVisible, slideBy
          checkSlideCount(); // (items) => nav, controls, autoplay
          checkIndex(); // (slideBy, indexMin, indexMax) => index

          if (axis === 'horizontal') {
            if (fixedWidth && edgePadding) {
              updateFixedWidthEdgePadding(); // (vw) => fixedWidth_contentWrapper.edgePadding
            } else {
              updateSlideWidth(); // (slideWidth) => container.width, slide.width
              if (mode === 'gallery') {
                updateSlidePosition(); // (slideWidth, index, items) => gallery_visible_slide.marginLeft
              }
            }
          } else {
            getSlideTopEdges(); // (init) => slideTopEdges
            updateWrapperHeight(); // (slideTopEdges, index, items) => vertical_conentWrapper.height
          }

          if (index !== indexTem) { 
            events.emit('indexChanged', info());
            updateSlideStatus();
            if (!loop) { updateControlsStatus(); }
          }

          // (navCountVisible) => nav.[hidden]
          if (items !== itemsTem && !options.navContainer) { 
            updateNavDisplay(); 
            updateNavStatus();
          } 

          if (index !== indexTem || mode === 'carousel' && !fixedWidth) { doTransform(0); }
          if (index !== indexTem || items !== itemsTem || mode === 'gallery') { 
            runAutoHeight(); 
            lazyLoad();
          }

          if (navigator.msMaxTouchPoints) { setSnapInterval(); }
        }
      }, 100); // update after stop resizing for 100 ms
    }

    function onScroll() {
      if (!ticking) {
        window.requestAnimationFrame(function() {
          lazyLoad();
          ticking = false;
        });
      }
      ticking = true;
    }

    return {
      getInfo: info,
      events: events,
      destory: function () {
        // wrapper
        gn.unwrap(wrapper);
        gn.unwrap(contentWrapper);
        wrapper = contentWrapper = null;

        // container
        removeAttrs(container, ['id', 'style', 'data-tns-role', 'data-tns-features']);

        // cloned items
        if (loop) {
          for (var j = cloneCount; j--;) {
            slideItems[0].remove();
            slideItems[slideItems.length - 1].remove();
          }
        }

        // Slide Items
        removeAttrs(slideItems, ['id', 'style', 'aria-hidden']);
        slideId = slideCount = null;

        // controls
        if (controls) {
          if (!options.controlsContainer) {
            controlsContainer.remove();
            controlsContainer = prevButton = nextButton = null;
          } else {
            removeAttrs(controlsContainer, ['aria-label']);
            removeAttrs(controlsContainer.children, ['aria-controls', 'tabIndex']);
            removeEventsByClone(controlsContainer);
          }
        }

        // nav
        if (nav) {
          if (!options.navContainer) {
            navContainer.remove();
            navContainer = null;
          } else {
            removeAttrs(navContainer, ['aria-label']);
            removeAttrs(navItems, ['aria-selected', 'aria-controls', 'tabIndex']);
            removeEventsByClone(navContainer);
          }
          navItems = null;
        }

        // auto
        if (autoplay) {
          if (!options.navContainer && navContainer !== null) {
            navContainer.remove();
            navContainer = null;
          } else {
            removeEventsByClone(autoplayButton);
          }
        }

        // remove slider container events at the end
        // because this will make container = null
        removeEventsByClone(container);

        // remove arrowKeys eventlistener
        if (arrowKeys) {
          removeEvents(document, ['keydown', onKeydownDocument]);
        }

        // remove window event listeners
        removeEvents(window, [
          ['resize', onResize],
          ['scroll', onScroll]
        ]);
      },

      // $ Private methods, for test only
      // hasAttr: hasAttr, 
      // getAttr: getAttr, 
      // setAttrs: setAttrs, 
      // removeAttrs: removeAttrs, 
      // removeEventsByClone: removeEventsByClone, 
      // getSlideId: getSlideId, 
      // toDegree: toDegree, 
      // getTouchDirection: getTouchDirection, 
      // hideElement: hideElement, 
      // showElement: showElement,
    };
  }

  // === Private helper functions === //
  function getSlideId() {
    if (window.tnsId === undefined) {
      window.tnsId = 1;
    } else {
      window.tnsId++;
    }
    return 'tns' + window.tnsId;
  }

  function toDegree (y, x) {
    return Math.atan2(y, x) * (180 / Math.PI);
  }

  function getTouchDirection(angle, range) {
    if ( Math.abs(90 - Math.abs(angle)) >= (90 - range) ) {
      return 'horizontal';
    } else if ( Math.abs(90 - Math.abs(angle)) <= range ) {
      return 'vertical';
    } else {
      return false;
    }
  }

  function hasAttr(el, attr) {
    return el.hasAttribute(attr);
  }

  function getAttr(el, attr) {
    return el.getAttribute(attr);
  }

  function setAttrs(els, attrs) {
    els = (gn.isNodeList(els) || els instanceof Array) ? els : [els];
    if (Object.prototype.toString.call(attrs) !== '[object Object]') { return; }

    for (var i = els.length; i--;) {
      for(var key in attrs) {
        els[i].setAttribute(key, attrs[key]);
      }
    }
  }

  function removeAttrs(els, attrs) {
    els = (gn.isNodeList(els) || els instanceof Array) ? els : [els];
    attrs = (attrs instanceof Array) ? attrs : [attrs];

    var attrLength = attrs.length;
    for (var i = els.length; i--;) {
      for (var j = attrLength; j--;) {
        els[i].removeAttribute(attrs[j]);
      }
    }
  }

  function removeEventsByClone(el) {
    var elClone = el.cloneNode(true), parent = el.parentNode;
    parent.insertBefore(elClone, el);
    el.remove();
    el = null;
  }

  function hideElement(el) {
    if (!hasAttr(el, 'hidden')) {
      setAttrs(el, {'hidden': ''});
    }
  }

  function showElement(el) {
    if (hasAttr(el, 'hidden')) {
      removeAttrs(el, 'hidden');
    }
  }

  // check if an image is loaded
  // 1. See if "naturalWidth" and "naturalHeight" properties are available.
  // 2. See if "complete" property is available.
  function imageLoaded(img) {
    if (typeof img.complete === 'boolean') {
      return img.complete;
    } else if (typeof img.naturalWidth === 'number') {
      return img.naturalWidth !== 0;
    }
  }

  // From Modernizr
  function whichProperty(obj){
    var t, el = document.createElement('fakeelement');
    for(t in obj){
      if( el.style[t] !== undefined ){
        return [t, obj[t][0], obj[t][1]];
      }
    }

    return false; // explicit for ie9-
  }

  function addEvents(el, events) {
    function add(arr) {
      el.addEventListener(arr[0], arr[1], false);
    }

    if (Array.isArray(events)) {
      if (Array.isArray(events[0])) {
        for (var i = events.length; i--;) {
          add(events[i]);
        }
      } else {
        add(events);
      }
    }
  }

  function removeEvents(el, events) {
    function remove(arr) {
      el.removeEventListener(arr[0], arr[1], false);
    }

    if (Array.isArray(events)) {
      if (Array.isArray(events[0])) {
        for (var i = events.length; i--;) {
          remove(events[i]);
        }
      } else {
        remove(events);
      }
    }
  }

  var events = {
    events: {},
    on: function (eventName, fn) {
      this.events[eventName] = this.events[eventName] || [];
      this.events[eventName].push(fn);
    },
    off: function(eventName, fn) {
      if (this.events[eventName]) {
        for (var i = 0; i < this.events[eventName].length; i++) {
          if (this.events[eventName][i] === fn) {
            this.events[eventName].splice(i, 1);
            break;
          }
        }
      }
    },
    emit: function (eventName, data) {
      if (this.events[eventName]) {
        this.events[eventName].forEach(function(fn) {
          fn(data);
        });
      }
    }
  };

  return core;
})();