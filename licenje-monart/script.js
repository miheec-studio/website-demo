(function () {
  var each = function (list, fn) { Array.prototype.forEach.call(list, fn); };
  var calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

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

  function onScroll() { nav.classList.toggle('nav--solid', window.scrollY > 24); }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // The palette: each pan is a tab that shows its kind of make-up in the mirror
  var palette = document.getElementById('paleta');
  if (palette) {
    var tabs = palette.querySelectorAll('[role="tab"]');
    var panels = palette.querySelectorAll('[role="tabpanel"]');
    var photos = palette.querySelectorAll('.palette__img');
    var pick = function (tab, focus) {
      var id = tab.getAttribute('aria-controls');
      each(tabs, function (t) {
        var on = t === tab;
        t.setAttribute('aria-selected', on ? 'true' : 'false');
        t.tabIndex = on ? 0 : -1;
      });
      each(panels, function (p) { p.hidden = p.id !== id; });
      var kind = document.getElementById(id).getAttribute('data-kind');
      each(photos, function (img) {
        var on = img.getAttribute('data-kind') === kind;
        img.classList.toggle('was-on', !on && img.classList.contains('is-on'));
        img.classList.toggle('is-on', on);
      });
      if (focus) tab.focus();
    };
    each(tabs, function (tab, i) {
      tab.addEventListener('click', function () { pick(tab, false); });
      tab.addEventListener('keydown', function (e) {
        var to = null;
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') to = tabs[(i + 1) % tabs.length];
        if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') to = tabs[(i - 1 + tabs.length) % tabs.length];
        if (e.key === 'Home') to = tabs[0];
        if (e.key === 'End') to = tabs[tabs.length - 1];
        if (to) { e.preventDefault(); pick(to, true); }
      });
    });
    pick(tabs[0], false);
  }

  // Looks: every look has two photos, closed lids and open eyes
  var looks = document.querySelectorAll('.look');
  function showView(look, view) {
    each(look.querySelectorAll('.zoom'), function (z) { z.hidden = z.getAttribute('data-view') !== view; });
    each(look.querySelectorAll('.look__switch button'), function (b) {
      b.setAttribute('aria-pressed', b.getAttribute('data-show') === view ? 'true' : 'false');
    });
  }
  each(looks, function (look) {
    each(look.querySelectorAll('.look__switch button'), function (b) {
      b.addEventListener('click', function () { showView(look, b.getAttribute('data-show')); });
    });
  });

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
    var opener = null;
    var viewWord = { veke: 'veke', pogled: 'pogled' };
    var show = function (i) {
      at = (i + group.length) % group.length;
      var btn = group[at];
      var small = btn.querySelector('img');
      var caption = btn.closest('figure').querySelector('figcaption');
      var full = btn.getAttribute('data-full');
      var view = btn.getAttribute('data-view');
      big.style.setProperty('--ratio', small.getAttribute('width') / small.getAttribute('height'));
      big.alt = small.alt;
      // The small photo shows at once, then the larger file is swapped in
      big.src = small.getAttribute('src');
      if (full) {
        var loader = new Image();
        loader.onload = function () { if (group[at] === btn && box.open) big.src = full; };
        loader.src = full;
      }
      cap.textContent = (caption ? caption.textContent : '') + (view ? ' · ' + viewWord[view] : '');
      count.textContent = group.length > 1 ? (at + 1) + ' / ' + group.length : '';
    };
    each(document.querySelectorAll('.zoom'), function (btn) {
      btn.addEventListener('click', function () {
        var home = btn.closest('.looks, .places__photos') || document;
        group = Array.prototype.slice.call(home.querySelectorAll('.zoom'));
        each(steps, function (b) { b.hidden = group.length < 2; });
        opener = btn;
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
      // Leave the look on the photo that was last seen, so focus returns to a visible button
      var last = group[at];
      var look = last && last.closest('.look');
      if (look && opener && opener.closest('.look') === look) {
        showView(look, last.getAttribute('data-view'));
        last.focus();
      }
    });
  }

  // Sections ease in as they are scrolled to; the first look blinks once to show the switch
  var reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !calm) {
    var seen = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        en.target.classList.add('is-in');
        seen.unobserve(en.target);
        if (en.target === looks[0]) {
          setTimeout(function () { showView(looks[0], 'veke'); }, 1100);
          setTimeout(function () { showView(looks[0], 'pogled'); }, 2300);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
    each(reveals, function (el) { seen.observe(el); });
  } else {
    each(reveals, function (el) { el.classList.add('is-in'); });
  }

  // Only one video plays at a time
  var videos = document.querySelectorAll('video');
  each(videos, function (v) {
    v.addEventListener('play', function () {
      each(videos, function (other) { if (other !== v) other.pause(); });
    });
  });
})();
