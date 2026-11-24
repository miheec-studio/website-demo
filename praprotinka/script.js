(function () {
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  var each = function (list, fn) { Array.prototype.forEach.call(list, fn); };

  // ---------- Navigation: solid bar after scrolling, full-screen menu on phones ----------
  var nav = document.getElementById('nav');
  var toggle = document.getElementById('navToggle');
  var menu = document.getElementById('menu');
  var behindMenu = document.querySelectorAll('main, footer, .skip, .demo-badge, .nav__logo');
  function setBehindMenu(hidden) {
    // While the menu is open, the page behind it can't be reached with Tab or a screen reader
    each(behindMenu, function (el) {
      if (hidden) el.setAttribute('inert', ''); else el.removeAttribute('inert');
    });
  }
  function openMenu() {
    nav.classList.add('nav--open');
    toggle.setAttribute('aria-expanded', 'true');
    toggle.setAttribute('aria-label', 'Zapri meni');
    document.body.style.overflow = 'hidden';
    setBehindMenu(true);
    var first = menu.querySelector('a');
    if (first) first.focus();
  }
  function closeMenu(returnFocus) {
    if (!nav.classList.contains('nav--open')) return;
    nav.classList.remove('nav--open');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Odpri meni');
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

  // ---------- Only one video plays at a time ----------
  var allVideos = document.querySelectorAll('video');
  each(allVideos, function (v) {
    v.addEventListener('play', function () {
      each(allVideos, function (other) { if (other !== v && !other.paused) other.pause(); });
    });
  });

  // ---------- Hero loop ----------
  // Plays muted on its own. iPhones in Low Power Mode and some in-app browsers (Instagram, Facebook)
  // block autoplay; then it starts on the first touch or scroll. It stays still for reduced motion.
  var hero = document.querySelector('.hero__video');
  var heroMedia = document.getElementById('heroMedia');
  var heroWanted = false; // the hero should be playing whenever it is on screen
  if (hero) {
    hero.disablePictureInPicture = true;
    hero.disableRemotePlayback = true;
  }
  if (hero && reduceMotion.matches) {
    hero.removeAttribute('autoplay');
    hero.pause();
  } else if (hero) {
    heroWanted = true;
    hero.muted = true;
    hero.defaultMuted = true;
    // Begin at the calm frame the still image shows (data-start)
    var start = parseFloat(hero.getAttribute('data-start')) || 0;
    var toStart = function () { if (hero.currentTime < start) hero.currentTime = start; };
    if (hero.readyState >= 1) toStart();
    else hero.addEventListener('loadedmetadata', toStart, { once: true });
    // The still image on top fades out only once frames are really moving
    var revealVideo = function () {
      if (!hero.paused && hero.currentTime > start) heroMedia.classList.add('leaf--playing');
    };
    hero.addEventListener('playing', revealVideo);
    hero.addEventListener('timeupdate', revealVideo);
    revealVideo();
    var gestures = ['touchstart', 'touchend', 'pointerdown', 'click', 'keydown', 'scroll'];
    var stopWaiting = function () {
      gestures.forEach(function (name) { window.removeEventListener(name, playOnGesture, true); });
    };
    var playOnGesture = function () {
      if (!heroWanted) return;
      var attempt = hero.play();
      if (attempt && attempt.then) attempt.then(stopWaiting, function () { /* still blocked: keep waiting */ });
      else stopWaiting();
    };
    var first = hero.play();
    if (first && first.catch) {
      first.catch(function () {
        gestures.forEach(function (name) { window.addEventListener(name, playOnGesture, { capture: true, passive: true }); });
      });
    }
  }

  // ---------- Clips (moments, Antigravity): play on request, muted, in a loop ----------
  var buttons = document.querySelectorAll('.play');
  function sync(btn, video) {
    var playing = !video.paused;
    btn.setAttribute('aria-pressed', String(playing));
    btn.setAttribute('aria-label', btn.getAttribute(playing ? 'data-label-pause' : 'data-label-play'));
  }
  each(buttons, function (btn) {
    var video = btn.parentNode.querySelector('video');
    if (!video) return;
    video.muted = true;
    video.disablePictureInPicture = true;
    ['play', 'pause', 'ended'].forEach(function (name) {
      video.addEventListener(name, function () { sync(btn, video); });
    });
    btn.addEventListener('click', function () {
      if (video.paused) {
        var attempt = video.play();
        if (attempt && attempt.catch) attempt.catch(function () { sync(btn, video); });
      } else {
        video.pause();
      }
    });
  });

  // Videos that scroll out of sight pause; the hero picks up again when it comes back
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        var v = entry.target;
        if (!entry.isIntersecting) {
          if (!v.paused) v.pause();
        } else if (v === hero && heroWanted && v.paused) {
          var p = v.play();
          if (p && p.catch) p.catch(function () {});
        }
      });
    }, { threshold: 0.15 });
    each(allVideos, function (v) { io.observe(v); });
  }
})();
