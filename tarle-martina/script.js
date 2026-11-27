(function () {
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  var each = function (list, fn) { Array.prototype.forEach.call(list, fn); };

  // Navigation: solid bar after scrolling, full-screen menu on phones
  var nav = document.getElementById('nav');
  var toggle = document.getElementById('navToggle');
  var menu = document.getElementById('menu');
  var behindMenu = document.querySelectorAll('main, .footer, .skip, .demo-badge');
  function setBehindMenu(hidden) {
    // While the menu is open, the page behind it can't be reached with Tab or a screen reader
    each(behindMenu, function (el) {
      if (hidden) el.setAttribute('inert', ''); else el.removeAttribute('inert');
    });
  }
  function openMenu() {
    nav.classList.add('nav--open');
    toggle.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
    setBehindMenu(true);
    var first = menu.querySelector('a');
    if (first) first.focus();
  }
  function closeMenu(returnFocus) {
    if (!nav.classList.contains('nav--open')) return;
    nav.classList.remove('nav--open');
    toggle.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
    setBehindMenu(false);
    if (returnFocus) toggle.focus();
  }
  toggle.addEventListener('click', function () {
    if (nav.classList.contains('nav--open')) closeMenu(true); else openMenu();
  });
  menu.addEventListener('click', function (e) {
    if (e.target.closest('a')) closeMenu(false);
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && nav.classList.contains('nav--open')) closeMenu(true);
  });
  // The phone menu has no place on wide screens (e.g. a tablet turned sideways while it is open)
  var wide = window.matchMedia('(min-width: 900px)');
  var onWide = function (e) { if (e.matches) closeMenu(false); };
  if (wide.addEventListener) wide.addEventListener('change', onWide);
  else if (wide.addListener) wide.addListener(onWide);

  function onScroll() { nav.classList.toggle('nav--solid', window.scrollY > 30); }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Sections come in gently as they are reached
  var reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !reduceMotion.matches) {
    var seen = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { entry.target.classList.add('is-in'); seen.unobserve(entry.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    each(reveals, function (el) { seen.observe(el); });
  } else {
    each(reveals, function (el) { el.classList.add('is-in'); });
  }

  // First-screen loop: plays muted on its own. iPhones in Low Power Mode and some in-app browsers
  // (Instagram, Facebook) block autoplay; then it starts on the first touch instead.
  // It stays still for people who prefer reduced motion.
  var hero = document.querySelector('.poster__video');
  if (hero) {
    hero.disablePictureInPicture = true;
    hero.disableRemotePlayback = true;
  }
  if (hero && reduceMotion.matches) {
    hero.removeAttribute('autoplay');
    hero.pause();
  } else if (hero) {
    hero.muted = true;
    hero.defaultMuted = true;
    // Begin at the frame the still image shows (data-start)
    var start = parseFloat(hero.getAttribute('data-start')) || 0;
    var toStart = function () { if (hero.currentTime < start) hero.currentTime = start; };
    if (hero.readyState >= 1) toStart();
    else hero.addEventListener('loadedmetadata', toStart, { once: true });
    // The still image on top fades out only once frames are really moving
    // (also covers a video that started before this script ran)
    var revealVideo = function () {
      if (!hero.paused && hero.currentTime > start) hero.parentNode.classList.add('poster__media--playing');
    };
    hero.addEventListener('playing', revealVideo);
    hero.addEventListener('timeupdate', revealVideo);
    revealVideo();
    var gestures = ['touchstart', 'touchend', 'pointerdown', 'click', 'keydown', 'scroll'];
    var stopWaiting = function () {
      gestures.forEach(function (name) { document.removeEventListener(name, playOnGesture, true); });
    };
    var playOnGesture = function () {
      if (hero.paused) hero.currentTime = start; // start from the frame the still image shows
      var attempt = hero.play();
      if (attempt && attempt.then) attempt.then(stopWaiting, function () { /* still blocked: keep waiting */ });
      else stopWaiting();
    };
    var first = hero.play();
    if (first && first.catch) {
      first.catch(function () {
        gestures.forEach(function (name) { document.addEventListener(name, playOnGesture, { capture: true, passive: true }); });
      });
    }
    // No need to keep decoding while the first screen is out of view
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        if (entries[0].isIntersecting) { var p = hero.play(); if (p && p.catch) p.catch(function () {}); }
        else hero.pause();
      }, { threshold: 0.05 }).observe(hero);
    }
  }

  // Apparatus clips: silent loops. On a phone the one in view plays, with a mouse the one under the pointer.
  // Each has its own play / pause button, and only one plays at a time.
  var cards = document.querySelectorAll('.gcard');
  var canHover = window.matchMedia('(hover: hover)').matches;
  var stopped = false;   // the visitor paused a clip by hand: nothing starts on its own any more
  function clipOf(card) { return card.querySelector('video'); }
  function setState(card, playing) {
    var btn = card.querySelector('.gcard__play');
    card.classList.toggle('gcard--playing', playing);
    btn.setAttribute('aria-label', (playing ? 'Ustavi posnetek: ' : 'Predvajaj posnetek: ') + btn.getAttribute('data-name'));
  }
  function playClip(card) {
    var v = clipOf(card);
    v.muted = true;
    var p = v.play();
    if (p && p.catch) p.catch(function () {});
  }
  each(cards, function (card) {
    var v = clipOf(card);
    v.disablePictureInPicture = true;
    v.addEventListener('play', function () {
      each(cards, function (other) { if (other !== card) clipOf(other).pause(); });
      setState(card, true);
    });
    v.addEventListener('pause', function () { setState(card, false); });
    card.querySelector('.gcard__play').addEventListener('click', function () {
      if (v.paused) { stopped = false; playClip(card); } else { stopped = true; v.pause(); }
    });
    if (canHover && !reduceMotion.matches) {
      card.addEventListener('mouseenter', function () { if (!stopped) playClip(card); });
      card.addEventListener('mouseleave', function () { if (!stopped) v.pause(); });
    }
  });
  if (!canHover && !reduceMotion.matches && 'IntersectionObserver' in window) {
    var inView = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        var card = entry.target.closest('.gcard');
        if (entry.isIntersecting && !stopped) playClip(card);
        else if (!entry.isIntersecting) clipOf(card).pause();
      });
    }, { threshold: 0.8 });
    each(cards, function (card) { inView.observe(card.querySelector('.gcard__media')); });
  }

  // Apparatus strip on phones: previous / next buttons, dimmed at the first and last card
  var strip = document.getElementById('gear');
  var arrows = document.querySelectorAll('[data-scroll]');
  function updateArrows() {
    if (!strip) return;
    var max = strip.scrollWidth - strip.clientWidth;
    each(arrows, function (btn) {
      var atEnd = Number(btn.getAttribute('data-scroll')) < 0 ? strip.scrollLeft <= 2 : strip.scrollLeft >= max - 2;
      btn.setAttribute('aria-disabled', String(atEnd));
    });
  }
  each(arrows, function (btn) {
    btn.addEventListener('click', function () {
      var card = strip && strip.firstElementChild;
      if (!card || btn.getAttribute('aria-disabled') === 'true') return;
      var step = card.getBoundingClientRect().width + 14;
      strip.scrollBy({ left: step * Number(btn.getAttribute('data-scroll')), behavior: reduceMotion.matches ? 'auto' : 'smooth' });
    });
  });
  if (strip) {
    var ticking = false;
    strip.addEventListener('scroll', function () {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(function () { ticking = false; updateArrows(); });
    }, { passive: true });
    window.addEventListener('resize', updateArrows);
    updateArrows();
  }

  // Gallery photos open enlarged in a dialog. The browser's own modal <dialog> keeps focus inside it,
  // closes on Escape and gives focus back to the photo that opened it.
  var box = document.getElementById('lightbox');
  if (box && typeof box.showModal === 'function') {
    var figure = document.getElementById('lightboxFigure');
    var cap = document.getElementById('lightboxCap');
    var count = document.getElementById('lightboxCount');
    var steps = box.querySelectorAll('[data-step]');
    var big = document.createElement('img');
    big.className = 'lightbox__img';
    figure.insertBefore(big, cap);
    var group = [];   // the photos of the gallery that was opened
    var at = 0;
    var show = function (i) {
      at = (i + group.length) % group.length;
      var btn = group[at];
      var small = btn.querySelector('img');
      var caption = btn.parentNode.querySelector('figcaption');
      var full = btn.getAttribute('data-full');
      big.style.setProperty('--ratio', small.getAttribute('width') / small.getAttribute('height'));
      big.alt = small.alt;
      // The small photo is already loaded: show it at once, then swap in the larger file
      big.src = small.currentSrc || small.src;
      if (full) {
        var loader = new Image();
        loader.onload = function () { if (group[at] === btn && box.open) big.src = full; };
        loader.src = full;
      }
      cap.textContent = caption ? caption.textContent : '';
      count.textContent = group.length > 1 ? (at + 1) + ' / ' + group.length : '';
    };
    each(document.querySelectorAll('.zoom'), function (btn) {
      btn.addEventListener('click', function () {
        var home = btn.closest('.grid, .strip') || document;
        group = Array.prototype.slice.call(home.querySelectorAll('.zoom'));
        each(steps, function (b) { b.hidden = group.length < 2; });
        show(group.indexOf(btn));
        document.documentElement.style.overflow = 'hidden';
        box.showModal();
      });
    });
    box.addEventListener('click', function (e) {
      var step = e.target.closest('[data-step]');
      if (step) { show(at + Number(step.getAttribute('data-step'))); return; }
      // Like a photo on a dark table: a click anywhere beside it puts it away
      if (e.target !== big) box.close();
    });
    box.addEventListener('keydown', function (e) {
      if (group.length < 2) return;
      if (e.key === 'ArrowRight') show(at + 1);
      if (e.key === 'ArrowLeft') show(at - 1);
    });
    // Swipe left or right on a phone
    var startX = null, startY = null;
    box.addEventListener('touchstart', function (e) {
      startX = e.changedTouches[0].clientX; startY = e.changedTouches[0].clientY;
    }, { passive: true });
    box.addEventListener('touchend', function (e) {
      if (startX === null || group.length < 2) return;
      var dx = e.changedTouches[0].clientX - startX, dy = e.changedTouches[0].clientY - startY;
      startX = null;
      if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy) * 1.5) show(at + (dx < 0 ? 1 : -1));
    }, { passive: true });
    box.addEventListener('close', function () {
      document.documentElement.style.overflow = '';
      big.removeAttribute('src');
    });
  }
})();
