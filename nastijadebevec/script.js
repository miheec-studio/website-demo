(function () {
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  var each = function (list, fn) { Array.prototype.forEach.call(list, fn); };

  // Navigation: a hairline under the bar after scrolling, full-screen menu on phones
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

  function onScroll() { nav.classList.toggle('nav--solid', window.scrollY > 12); }
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

  // Clips: each starts with its own button and only one plays at a time.
  // The exercise clips are silent loops; the invitation to the groups has sound, so once it has
  // been started it gets the browser's own controls (volume, seeking).
  var clips = document.querySelectorAll('[data-clip]');
  function videoOf(clip) { return clip.querySelector('video'); }
  function setState(clip, playing) {
    var btn = clip.querySelector('.clip__btn');
    var withSound = clip.hasAttribute('data-sound');
    clip.classList.toggle('clip--playing', playing);
    btn.setAttribute('aria-label',
      (playing ? 'Ustavi posnetek: ' : (withSound ? 'Predvajaj posnetek z zvokom: ' : 'Predvajaj posnetek: ')) +
      btn.getAttribute('data-name'));
  }
  each(clips, function (clip) {
    var v = videoOf(clip);
    var btn = clip.querySelector('.clip__btn');
    var withSound = clip.hasAttribute('data-sound');
    v.disablePictureInPicture = true;
    v.addEventListener('play', function () {
      each(clips, function (other) { if (other !== clip) videoOf(other).pause(); });
      setState(clip, true);
    });
    v.addEventListener('pause', function () { setState(clip, false); });
    v.addEventListener('ended', function () { setState(clip, false); });
    btn.addEventListener('click', function () {
      if (!v.paused) { v.pause(); return; }
      if (withSound) {
        v.controls = true;
        clip.classList.add('clip--native');
      } else {
        v.muted = true;
      }
      var attempt = v.play();
      if (attempt && attempt.catch) attempt.catch(function () {});
      if (withSound) v.focus();
    });
  });
  // A clip that has left the screen does not keep playing
  if ('IntersectionObserver' in window) {
    var away = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) entry.target.pause();
      });
    }, { threshold: 0 });
    each(clips, function (clip) { away.observe(videoOf(clip)); });
  }
})();
