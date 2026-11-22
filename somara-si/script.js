(function () {
  var root = document.documentElement;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  // Language: English by default, Slovenian on request; the choice is remembered in this browser only
  var titles = {
    en: 'Somara · songwriter, singer, artist',
    sl: 'Somara · kantavtorica, pevka, umetnica'
  };
  function setLang(lang, remember) {
    root.lang = lang;
    document.title = titles[lang];
    var btn = document.getElementById('langToggle');
    if (btn) btn.setAttribute('aria-label', lang === 'sl' ? 'Switch to English' : 'Preklopi v slovenščino');
    if (remember) {
      try { localStorage.setItem('somara-lang', lang); } catch (e) { /* storage blocked: fine */ }
    }
  }
  setLang(root.lang === 'sl' ? 'sl' : 'en', false);
  document.getElementById('langToggle').addEventListener('click', function () {
    setLang(root.lang === 'sl' ? 'en' : 'sl', true);
  });

  // Navigation: solid bar after scrolling, full-screen menu on phones
  var nav = document.getElementById('nav');
  var toggle = document.getElementById('navToggle');
  var menu = document.getElementById('menu');
  function closeMenu() {
    nav.classList.remove('nav--open');
    toggle.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }
  toggle.addEventListener('click', function () {
    var open = !nav.classList.contains('nav--open');
    nav.classList.toggle('nav--open', open);
    toggle.setAttribute('aria-expanded', String(open));
    document.body.style.overflow = open ? 'hidden' : '';
  });
  menu.addEventListener('click', function (e) {
    if (e.target.closest('a')) closeMenu();
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeMenu();
  });
  function onScroll() { nav.classList.toggle('nav--solid', window.scrollY > 40); }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Hero loop: plays muted on its own. iPhones in Low Power Mode and some in-app browsers
  // (Instagram, Facebook) block autoplay; then it starts on the first touch instead.
  // It stays still for people who prefer reduced motion.
  var hero = document.querySelector('.hero__video');
  if (hero && reduceMotion.matches) {
    hero.removeAttribute('autoplay');
    hero.pause();
  } else if (hero) {
    hero.muted = true;
    hero.defaultMuted = true;
    var gestures = ['touchstart', 'touchend', 'pointerdown', 'click', 'keydown'];
    var stopWaiting = function () {
      gestures.forEach(function (name) { document.removeEventListener(name, playOnGesture, true); });
    };
    var playOnGesture = function () {
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
  }

  // Only one music video plays at a time
  var videos = document.querySelectorAll('.vcard video');
  Array.prototype.forEach.call(videos, function (v) {
    v.addEventListener('play', function () {
      Array.prototype.forEach.call(videos, function (other) {
        if (other !== v) other.pause();
      });
    });
  });

  // Previous / next buttons for the card scroller
  Array.prototype.forEach.call(document.querySelectorAll('[data-scroll]'), function (btn) {
    btn.addEventListener('click', function () {
      var list = document.getElementById(btn.getAttribute('aria-controls'));
      var card = list && list.firstElementChild;
      if (!card) return;
      var step = card.getBoundingClientRect().width + 16;
      list.scrollBy({ left: step * Number(btn.getAttribute('data-scroll')), behavior: reduceMotion.matches ? 'auto' : 'smooth' });
    });
  });
})();
