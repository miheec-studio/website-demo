(function () {
  var root = document.documentElement;
  var each = function (list, fn) { Array.prototype.forEach.call(list, fn); };
  window.__mnr = true; // tells the fallback in <head> that this script arrived

  // Language: the visitor's own choice (remembered in this browser only); the first pick is made in <head>
  var titles = {
    sl: 'Manic Nails Room · manikura v Mariboru',
    en: 'Manic Nails Room · manicure in Maribor'
  };
  // Keep each photo's English description so the Slovenian one can be swapped in and back
  each(document.querySelectorAll('img[data-alt-sl]'), function (img) {
    img.setAttribute('data-alt-en', img.getAttribute('alt'));
  });
  function setLang(lang, remember) {
    root.lang = lang;
    document.title = titles[lang];
    // Screen-reader labels and photo descriptions follow the language too
    each(document.querySelectorAll('[data-label-' + lang + ']'), function (el) {
      el.setAttribute('aria-label', el.getAttribute('data-label-' + lang));
    });
    each(document.querySelectorAll('img[data-alt-sl]'), function (img) {
      img.setAttribute('alt', img.getAttribute('data-alt-' + lang));
    });
    if (remember) {
      try { localStorage.setItem('manic-nails-room-lang', lang); } catch (e) { /* storage blocked: fine */ }
    }
  }
  setLang(root.lang === 'en' ? 'en' : 'sl', false);
  document.getElementById('langToggle').addEventListener('click', function () {
    setLang(root.lang === 'sl' ? 'en' : 'sl', true);
  });

  // Navigation: a shadow under the bar after scrolling, full-screen menu on phones
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

  function onScroll() { nav.classList.toggle('nav--solid', window.scrollY > 16); }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Sections drift in as they are reached; the swipe behind a word is painted in with them
  var hero = document.querySelector('.hero');
  window.requestAnimationFrame(function () {
    window.requestAnimationFrame(function () { if (hero) hero.classList.add('is-in'); });
  });
  var reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    var seen = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-in');
        seen.unobserve(entry.target);
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -6% 0px' });
    each(reveals, function (el) { seen.observe(el); });
  } else {
    each(reveals, function (el) { el.classList.add('is-in'); });
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
      // The caption exists in both languages: take the one the visitor is reading
      var line = caption && (caption.querySelector('[data-lang="' + root.lang + '"]') || caption);
      cap.textContent = line ? line.textContent : '';
      count.textContent = group.length > 1 ? (at + 1) + ' / ' + group.length : '';
    };
    each(document.querySelectorAll('.zoom'), function (btn) {
      btn.addEventListener('click', function () {
        var home = btn.closest('[data-gallery]') || document;
        group = Array.prototype.slice.call(home.querySelectorAll('.zoom'));
        each(steps, function (b) { b.hidden = group.length < 2; });
        show(group.indexOf(btn));
        root.style.overflow = 'hidden';
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
      root.style.overflow = '';
      big.removeAttribute('src');
    });
  }
})();
