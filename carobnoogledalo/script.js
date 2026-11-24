(function () {
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  var each = function (list, fn) { Array.prototype.forEach.call(list, fn); };

  // Navigation: solid bar after scrolling, full-screen menu on phones
  var nav = document.getElementById('nav');
  var toggle = document.getElementById('navToggle');
  var menu = document.getElementById('menu');
  var behindMenu = document.querySelectorAll('main, footer, .skip, .demo-badge, .nav__logo, .nav__call');
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

  // The print slides out of the printer when it scrolls into view
  var reveals = document.querySelectorAll('[data-reveal]');
  if (reduceMotion.matches || !('IntersectionObserver' in window)) {
    each(reveals, function (el) { el.classList.add('is-in'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.35 });
    each(reveals, function (el) { io.observe(el); });
  }

  // Only one video plays at a time
  var videos = document.querySelectorAll('video');
  each(videos, function (v) {
    v.disablePictureInPicture = true;
    v.addEventListener('play', function () {
      each(videos, function (other) { if (other !== v) other.pause(); });
    });
  });
})();
