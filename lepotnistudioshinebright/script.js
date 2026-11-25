(function () {
  var root = document.documentElement;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  var each = function (list, fn) { Array.prototype.forEach.call(list, fn); };

  // Language: the visitor's own choice (remembered in this browser only); the first pick is made in <head>
  var titles = {
    sl: 'Shine Bright · lepotni studio, Murska Sobota',
    en: 'Shine Bright · beauty studio, Murska Sobota'
  };
  // Keep each photo's Slovenian description so the English one can be swapped in and back
  each(document.querySelectorAll('img[data-alt-en]'), function (img) {
    img.setAttribute('data-alt-sl', img.getAttribute('alt'));
  });
  function setLang(lang, remember) {
    root.lang = lang;
    document.title = titles[lang];
    // Screen-reader labels and photo descriptions follow the language too
    each(document.querySelectorAll('[data-label-' + lang + ']'), function (el) {
      el.setAttribute('aria-label', el.getAttribute('data-label-' + lang));
    });
    each(document.querySelectorAll('img[data-alt-' + lang + ']'), function (img) {
      img.setAttribute('alt', img.getAttribute('data-alt-' + lang));
    });
    if (remember) {
      try { localStorage.setItem('lepotnistudioshinebright-lang', lang); } catch (e) { /* storage blocked: fine */ }
    }
  }
  setLang(root.lang === 'en' ? 'en' : 'sl', false);
  document.getElementById('langToggle').addEventListener('click', function () {
    setLang(root.lang === 'sl' ? 'en' : 'sl', true);
  });

  // Navigation: solid bar after scrolling, full-screen menu on phones
  var nav = document.getElementById('nav');
  var toggle = document.getElementById('navToggle');
  var menu = document.getElementById('menu');
  var behindMenu = document.querySelectorAll('main, footer, .skip, .demo-badge');
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

  function onScroll() { nav.classList.toggle('nav--solid', window.scrollY > 40); }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Hero: the round swatches change the photo. Only the first photo is in the page;
  // the others are fetched when someone reaches for a swatch (or a little after the page has loaded).
  var stage = document.getElementById('stage');
  var picker = document.getElementById('picker');
  var nameEl = document.getElementById('lookName');
  var currentCat = 'chrome';
  if (stage && picker && nameEl) {
    var swatches = picker.querySelectorAll('.swatch');
    var photos = {};
    var firstPhoto = stage.querySelector('.stage__img');
    photos[firstPhoto.getAttribute('data-look')] = firstPhoto;

    var photoFor = function (btn) {
      var look = btn.getAttribute('data-look');
      if (photos[look]) return photos[look];
      var img = new Image();
      img.className = 'stage__img';
      img.width = Number(btn.getAttribute('data-w'));
      img.height = Number(btn.getAttribute('data-h'));
      img.decoding = 'async';
      img.setAttribute('data-look', look);
      img.setAttribute('data-alt-sl', btn.getAttribute('data-alt-sl'));
      img.setAttribute('data-alt-en', btn.getAttribute('data-alt-en'));
      img.alt = btn.getAttribute('data-alt-' + (root.lang === 'en' ? 'en' : 'sl'));
      img.setAttribute('aria-hidden', 'true');
      img.style.objectPosition = btn.getAttribute('data-pos');
      img.src = btn.getAttribute('data-src');
      stage.insertBefore(img, nameEl);
      photos[look] = img;
      return img;
    };
    var fetchAll = function () { each(swatches, photoFor); };

    var wanted = null;
    var showLook = function (btn, index) {
      var img = photoFor(btn);
      wanted = btn;
      var reveal = function () {
        if (wanted !== btn) return; // a newer choice was made while this photo was loading
        each(stage.querySelectorAll('.stage__img'), function (el) {
          var on = el === img;
          el.classList.toggle('is-on', on);
          if (on) el.removeAttribute('aria-hidden'); else el.setAttribute('aria-hidden', 'true');
        });
        while (nameEl.firstChild) nameEl.removeChild(nameEl.firstChild);
        var no = document.createElement('span');
        no.className = 'stage__no';
        no.textContent = 'N° ' + (index + 1);
        nameEl.appendChild(no);
        ['sl', 'en'].forEach(function (lang) {
          var s = document.createElement('span');
          s.setAttribute('data-lang', lang);
          s.textContent = btn.getAttribute('data-name-' + lang);
          nameEl.appendChild(s);
        });
        currentCat = btn.getAttribute('data-cat');
        if (!reduceMotion.matches) {
          stage.classList.remove('stage--shine');
          void stage.offsetWidth; // restart the sweep of light
          stage.classList.add('stage--shine');
        }
      };
      each(swatches, function (b) { b.setAttribute('aria-pressed', String(b === btn)); });
      if (img.complete && img.naturalWidth) reveal();
      else img.addEventListener('load', reveal, { once: true });
    };
    each(swatches, function (btn, index) {
      btn.addEventListener('click', function () { showLook(btn, index); });
    });
    ['pointerenter', 'touchstart', 'focusin'].forEach(function (name) {
      picker.addEventListener(name, fetchAll, { once: true, passive: true });
    });
    var saveData = navigator.connection && navigator.connection.saveData;
    if (!saveData) {
      window.addEventListener('load', function () { window.setTimeout(fetchAll, 2500); });
    }
  }

  // Gallery: one row of photos per style; the swatches choose the row
  var chips = document.querySelectorAll('.chip');
  var panels = document.querySelectorAll('.panel');
  var arrows = document.querySelectorAll('[data-scroll]');
  var activeTrack = null;
  function updateArrows() {
    if (!activeTrack) return;
    var max = activeTrack.scrollWidth - activeTrack.clientWidth;
    each(arrows, function (btn) {
      var atEnd = Number(btn.getAttribute('data-scroll')) < 0 ? activeTrack.scrollLeft <= 2 : activeTrack.scrollLeft >= max - 2;
      btn.setAttribute('aria-disabled', String(atEnd));
    });
  }
  function showCat(cat) {
    each(panels, function (panel) {
      var on = panel.getAttribute('data-cat') === cat;
      panel.hidden = !on;
      if (on) activeTrack = panel.querySelector('.track');
    });
    each(chips, function (chip) {
      chip.setAttribute('aria-pressed', String(chip.getAttribute('data-cat') === cat));
    });
    if (activeTrack) activeTrack.scrollLeft = 0;
    updateArrows();
  }
  if (panels.length) {
    each(chips, function (chip) {
      chip.addEventListener('click', function () { showCat(chip.getAttribute('data-cat')); });
    });
    each(panels, function (panel) {
      var track = panel.querySelector('.track');
      var ticking = false;
      track.addEventListener('scroll', function () {
        if (ticking) return;
        ticking = true;
        window.requestAnimationFrame(function () { ticking = false; updateArrows(); });
      }, { passive: true });
    });
    each(arrows, function (btn) {
      btn.addEventListener('click', function () {
        var card = activeTrack && activeTrack.firstElementChild;
        if (!card || btn.getAttribute('aria-disabled') === 'true') return;
        var step = card.getBoundingClientRect().width + 16;
        activeTrack.scrollBy({ left: step * Number(btn.getAttribute('data-scroll')), behavior: reduceMotion.matches ? 'auto' : 'smooth' });
      });
    });
    window.addEventListener('resize', updateArrows);
    showCat('french');
    // "See the gallery" opens it on the look that is showing in the hero
    var toGallery = document.getElementById('toGallery');
    if (toGallery) toGallery.addEventListener('click', function () { showCat(currentCat); });
  }

  // Only one video plays at a time
  var videos = document.querySelectorAll('video');
  each(videos, function (v) {
    v.addEventListener('play', function () {
      each(videos, function (other) { if (other !== v) other.pause(); });
    });
  });
})();
