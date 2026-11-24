(function () {
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  var each = function (list, fn) { Array.prototype.forEach.call(list, fn); };

  // Navigation: shadow after scrolling, full-screen menu on phones
  var nav = document.getElementById('nav');
  var toggle = document.getElementById('navToggle');
  var menu = document.getElementById('menu');
  var behindMenu = document.querySelectorAll('main, footer, .skip, .demo-badge, .brand, .nav__call');
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

  function onScroll() { nav.classList.toggle('nav--scrolled', window.scrollY > 8); }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Hero loop: plays muted on its own. iPhones in Low Power Mode and some in-app browsers
  // (Instagram, Facebook) block autoplay; then it starts on the first touch instead.
  // It stays still for people who prefer reduced motion.
  var hero = document.querySelector('.hero__video');
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
    // Begin at the frame the still image shows (data-start), not where the loop repeats
    var start = parseFloat(hero.getAttribute('data-start')) || 0;
    var toStart = function () { if (hero.currentTime < start) hero.currentTime = start; };
    if (hero.readyState >= 1) toStart();
    else hero.addEventListener('loadedmetadata', toStart, { once: true });
    // The still image on top fades out only once frames are really moving from the start frame
    var revealVideo = function () {
      if (!hero.paused && hero.currentTime > start) hero.parentNode.classList.add('hero__media--playing');
    };
    hero.addEventListener('playing', revealVideo);
    hero.addEventListener('timeupdate', revealVideo);
    revealVideo();
    var gestures = ['touchstart', 'touchend', 'pointerdown', 'click', 'keydown', 'scroll'];
    var stopWaiting = function () {
      gestures.forEach(function (name) {
        (name === 'scroll' ? window : document).removeEventListener(name, playOnGesture, true);
      });
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
        gestures.forEach(function (name) {
          (name === 'scroll' ? window : document).addEventListener(name, playOnGesture, { capture: true, passive: true });
        });
      });
    }
  }

  // Videos of the forms: only one plays at a time
  var videos = document.querySelectorAll('.form video');
  each(videos, function (v) {
    v.addEventListener('play', function () {
      each(videos, function (other) { if (other !== v) other.pause(); });
    });
  });
})();
