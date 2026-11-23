(function () {
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  var each = function (list, fn) { Array.prototype.forEach.call(list, fn); };

  // Navigation: solid bar after scrolling, full-screen menu on phones
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
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    setBehindMenu(true);
    var first = menu.querySelector('a');
    if (first) first.focus();
  }
  function closeMenu(returnFocus) {
    if (!nav.classList.contains('nav--open')) return;
    nav.classList.remove('nav--open');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Meni');
    document.documentElement.style.overflow = '';
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

  function onScroll() { nav.classList.toggle('nav--solid', window.scrollY > 40); }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Testimonials: previous / next buttons, dimmed at the first and last card
  var cards = document.getElementById('cards');
  var arrows = document.querySelectorAll('[data-scroll]');
  function updateArrows() {
    if (!cards) return;
    var max = cards.scrollWidth - cards.clientWidth;
    each(arrows, function (btn) {
      var atEnd = Number(btn.getAttribute('data-scroll')) < 0 ? cards.scrollLeft <= 2 : cards.scrollLeft >= max - 2;
      btn.setAttribute('aria-disabled', String(atEnd));
    });
  }
  each(arrows, function (btn) {
    btn.addEventListener('click', function () {
      var card = cards && cards.firstElementChild;
      if (!card || btn.getAttribute('aria-disabled') === 'true') return;
      var step = card.getBoundingClientRect().width + 16;
      cards.scrollBy({ left: step * Number(btn.getAttribute('data-scroll')), behavior: reduceMotion.matches ? 'auto' : 'smooth' });
    });
  });
  if (cards) {
    var ticking = false;
    cards.addEventListener('scroll', function () {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(function () { ticking = false; updateArrows(); });
    }, { passive: true });
    window.addEventListener('resize', updateArrows);
    updateArrows();
  }

  // Sideways scrolling lists (testimonials; the prayers on phones) can be reached with the keyboard
  // and scrolled with the arrow keys, but only while they really scroll
  var scrollers = document.querySelectorAll('[data-scroller]');
  function syncScrollers() {
    each(scrollers, function (el) {
      if (el.scrollWidth > el.clientWidth + 2) el.setAttribute('tabindex', '0');
      else el.removeAttribute('tabindex');
    });
  }
  window.addEventListener('resize', syncScrollers);
  window.addEventListener('load', syncScrollers);
  syncScrollers();
})();
