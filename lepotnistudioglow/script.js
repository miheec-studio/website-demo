(function () {
  var each = function (list, fn) { Array.prototype.forEach.call(list, fn); };
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  // Top bar: solid after scrolling, full-screen menu on phones
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
    nav.classList.add('top--open');
    toggle.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
    setBehindMenu(true);
    var first = menu.querySelector('a');
    if (first) first.focus();
  }
  function closeMenu(returnFocus) {
    if (!nav.classList.contains('top--open')) return;
    nav.classList.remove('top--open');
    toggle.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
    setBehindMenu(false);
    if (returnFocus) toggle.focus();
  }
  toggle.addEventListener('click', function () {
    if (nav.classList.contains('top--open')) closeMenu(true); else openMenu();
  });
  menu.addEventListener('click', function (e) {
    if (e.target.closest('a')) closeMenu(false);
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && nav.classList.contains('top--open')) closeMenu(true);
  });
  // The phone menu has no place on wide screens (e.g. a tablet turned sideways while it is open)
  var wide = window.matchMedia('(min-width: 900px)');
  var onWide = function (e) { if (e.matches) closeMenu(false); };
  if (wide.addEventListener) wide.addEventListener('change', onWide);
  else if (wide.addListener) wide.addListener(onWide);

  function onScroll() { nav.classList.toggle('top--solid', window.scrollY > 16); }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Hero: more of her work changes inside the frame, and the light behind it changes colour with the nails.
  // The first photo is in the page itself; the others are fetched only after everything else has loaded.
  var hero = document.getElementById('heroPhoto');
  if (hero && !reduceMotion.matches) {
    var clip = hero.querySelector('.hero__clip');
    var halos = hero.querySelectorAll('.hero__halo');
    var shots = [{ img: hero.querySelector('.hero__img'), halo: halos[0] }];
    var cur = 0;
    var heroSeen = true;
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) { heroSeen = entries[0].isIntersecting; }).observe(hero);
    }
    var nextShot = function () {
      // not while the tab is in the background or the frame is out of sight
      if (document.hidden || !heroSeen) return;
      var from = shots[cur];
      cur = (cur + 1) % shots.length;
      var to = shots[cur];
      // the old photo stays whole underneath until the new one has faded in over it
      from.img.classList.add('is-under');
      from.img.classList.remove('is-on');
      to.img.classList.remove('is-under');
      to.img.classList.add('is-on');
      window.setTimeout(function () { from.img.classList.remove('is-under'); }, 1500);
      if (from.halo !== to.halo) { from.halo.classList.remove('is-on'); to.halo.classList.add('is-on'); }
    };
    var loadShots = function () {
      var list = (hero.getAttribute('data-slides') || '').split('|').filter(Boolean);
      var left = list.length;
      var ready = [];
      each(list, function (src, i) {
        var img = new Image();
        img.className = 'hero__img';
        img.alt = '';
        img.decoding = 'async';
        var done = function (ok) {
          if (ok) ready[i] = { img: img, halo: halos[i + 1] || halos[0] };
          left -= 1;
          if (left) return;
          each(ready, function (r) { if (r) { clip.appendChild(r.img); shots.push(r); } });
          if (shots.length > 1) window.setInterval(nextShot, 4800);
        };
        img.onload = function () { done(true); };
        img.onerror = function () { done(false); };
        img.src = src;
      });
    };
    if (document.readyState === 'complete') loadShots();
    else window.addEventListener('load', loadShots);
  }

  // Gallery: one season at a time, starting with the season we are in.
  // Without this script all four simply show one under another.
  var tabs = Array.prototype.slice.call(document.querySelectorAll('.season'));
  function selectTab(tab, focus) {
    each(tabs, function (t) {
      var on = t === tab;
      t.setAttribute('aria-selected', on ? 'true' : 'false');
      t.tabIndex = on ? 0 : -1;
      document.getElementById(t.getAttribute('aria-controls')).hidden = !on;
    });
    if (focus) tab.focus();
  }
  each(tabs, function (tab, i) {
    tab.addEventListener('click', function () { selectTab(tab, false); });
    tab.addEventListener('keydown', function (e) {
      var to = null;
      if (e.key === 'ArrowRight') to = tabs[(i + 1) % tabs.length];
      if (e.key === 'ArrowLeft') to = tabs[(i - 1 + tabs.length) % tabs.length];
      if (e.key === 'Home') to = tabs[0];
      if (e.key === 'End') to = tabs[tabs.length - 1];
      if (to) { e.preventDefault(); selectTab(to, true); }
    });
  });
  if (tabs.length) {
    var month = String(new Date().getMonth() + 1);
    var now = tabs[0];
    each(tabs, function (t) {
      if ((t.getAttribute('data-months') || '').split(' ').indexOf(month) !== -1) now = t;
    });
    selectTab(now, false);
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
      cap.textContent = caption ? caption.textContent : '';
      count.textContent = group.length > 1 ? (at + 1) + ' / ' + group.length : '';
    };
    each(document.querySelectorAll('.zoom'), function (btn) {
      btn.addEventListener('click', function () {
        // one season, or the before-and-after photos, at a time
        var home = btn.closest('.group') || document;
        group = Array.prototype.slice.call(home.querySelectorAll('.zoom'));
        each(steps, function (b) { b.hidden = group.length < 2; });
        show(group.indexOf(btn));
        document.documentElement.style.overflow = 'hidden';
        box.showModal();
      });
    });
    box.addEventListener('click', function (e) {
      var step = e.target.closest('[data-step]');
      if (step) { show(at + Number(step.getAttribute('data-step'))); return; }
      // A click anywhere beside the photo puts it away
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
    });
  }

  // Videos: only one plays at a time
  var videos = document.querySelectorAll('video');
  each(videos, function (v) {
    v.addEventListener('play', function () {
      each(videos, function (other) { if (other !== v) other.pause(); });
    });
  });
  // Each video waits under our own play button. Once it is pressed, the browser's controls take over.
  // Without this script the videos simply keep the browser's controls from the start.
  each(document.querySelectorAll('.clip__frame'), function (frame) {
    var v = frame.querySelector('video');
    var btn = frame.querySelector('.clip__play');
    if (!v || !btn) return;
    v.removeAttribute('controls');
    btn.hidden = false;
    var handOver = function () {
      if (btn.hidden) return;
      var hadFocus = document.activeElement === btn;
      btn.hidden = true;
      v.setAttribute('controls', '');
      if (hadFocus) v.focus();
    };
    var start = function () {
      if (btn.hidden) return;
      handOver();
      var attempt = v.play();
      if (attempt && attempt.catch) attempt.catch(function () { /* the controls are there to try again */ });
    };
    btn.addEventListener('click', function () { btn.focus(); start(); });
    v.addEventListener('click', start);
    v.addEventListener('play', handOver);
  });

  // Sections ease in as they come into view
  if ('IntersectionObserver' in window && !reduceMotion.matches) {
    var items = document.querySelectorAll('.sec h2, .sec .lead, .about__text > p, .about__photo, .about__say, .svc__card, .lift, .seasons, .panel, .gallery__more, .clip, .prices__card, .contact h2, .contact .lead, .contact__cta, .facts');
    var seen = new IntersectionObserver(function (entries) {
      each(entries, function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-in');
        seen.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
    each(items, function (el) { el.classList.add('reveal'); seen.observe(el); });
  }
})();
