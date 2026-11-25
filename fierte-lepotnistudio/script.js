(function () {
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  var each = function (list, fn) { Array.prototype.forEach.call(list, fn); };

  // Top bar: solid after scrolling, full-screen menu on phones
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
    nav.classList.add('bar--open');
    toggle.setAttribute('aria-expanded', 'true');
    toggle.setAttribute('aria-label', 'Zapri meni');
    document.body.style.overflow = 'hidden';
    setBehindMenu(true);
    var first = menu.querySelector('a');
    if (first) first.focus();
  }
  function closeMenu(returnFocus) {
    if (!nav.classList.contains('bar--open')) return;
    nav.classList.remove('bar--open');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Meni');
    document.body.style.overflow = '';
    setBehindMenu(false);
    if (returnFocus) toggle.focus();
  }
  toggle.addEventListener('click', function () {
    if (nav.classList.contains('bar--open')) closeMenu(true); else openMenu();
  });
  menu.addEventListener('click', function (e) {
    if (e.target.closest('a')) closeMenu(false);
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && nav.classList.contains('bar--open')) closeMenu(true);
  });
  // The phone menu has no place on wide screens (e.g. a tablet turned sideways while it is open)
  var wide = window.matchMedia('(min-width: 900px)');
  var onWide = function (e) { if (e.matches) closeMenu(false); };
  if (wide.addEventListener) wide.addEventListener('change', onWide);
  else if (wide.addListener) wide.addListener(onWide);

  function onScroll() { nav.classList.toggle('bar--solid', window.scrollY > 24); }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Studio video: a round play button over the poster, the browser's own controls once it plays.
  // Without this script the video simply keeps its controls.
  var film = document.getElementById('film');
  var filmPlay = document.getElementById('filmPlay');
  if (film && filmPlay) {
    film.controls = false;
    filmPlay.hidden = false;
    filmPlay.addEventListener('click', function () {
      film.controls = true;
      filmPlay.hidden = true;
      var attempt = film.play();
      if (attempt && attempt.catch) attempt.catch(function () { /* the visitor can use the controls */ });
      film.focus();
    });
  }

  // Before & after: previous / next buttons and a counter, dimmed at the first and last pair
  var pairs = document.getElementById('pairs');
  var arrows = document.querySelectorAll('.results__nav [data-dir]');
  var now = document.getElementById('pairNow');
  var all = document.getElementById('pairAll');
  var pad = function (n) { return (n < 10 ? '0' : '') + n; };
  function pairStep() {
    var items = pairs.children;
    return items.length > 1 ? items[1].offsetLeft - items[0].offsetLeft : pairs.clientWidth;
  }
  function updatePairs() {
    var max = pairs.scrollWidth - pairs.clientWidth;
    var count = pairs.children.length;
    var index = pairs.scrollLeft >= max - 2 ? count : Math.min(count, Math.round(pairs.scrollLeft / pairStep()) + 1);
    now.textContent = pad(index);
    each(arrows, function (btn) {
      var atEnd = Number(btn.getAttribute('data-dir')) < 0 ? pairs.scrollLeft <= 2 : pairs.scrollLeft >= max - 2;
      btn.setAttribute('aria-disabled', String(atEnd));
    });
  }
  if (pairs) {
    all.textContent = pad(pairs.children.length);
    each(arrows, function (btn) {
      btn.addEventListener('click', function () {
        if (btn.getAttribute('aria-disabled') === 'true') return;
        pairs.scrollBy({ left: pairStep() * Number(btn.getAttribute('data-dir')), behavior: reduceMotion.matches ? 'auto' : 'smooth' });
      });
    });
    var ticking = false;
    pairs.addEventListener('scroll', function () {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(function () { ticking = false; updatePairs(); });
    }, { passive: true });
    window.addEventListener('resize', updatePairs);
    updatePairs();
  }

  // Service areas: only one open at a time (browsers without <details name> get the same behaviour)
  var areas = document.querySelectorAll('.area');
  each(areas, function (area) {
    area.addEventListener('toggle', function () {
      if (!area.open) return;
      each(areas, function (other) { if (other !== area) other.open = false; });
    });
  });
})();
