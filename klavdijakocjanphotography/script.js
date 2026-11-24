(function () {
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
    toggle.setAttribute('aria-label', 'Odpri meni');
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

  function onScroll() { nav.classList.toggle('nav--solid', window.scrollY > 30); }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Gallery: a photo opens large in a dialog, with previous / next and arrow keys
  var box = document.getElementById('lightbox');
  var items = document.querySelectorAll('.gitem');
  if (!box || !items.length || typeof box.showModal !== 'function') return;
  // the large photo is created here: an img without src is not valid HTML
  var img = document.createElement('img');
  img.alt = '';
  box.querySelector('.lightbox__stage').appendChild(img);
  var caption = box.querySelector('.lightbox__caption');
  var count = box.querySelector('.lightbox__count');
  var current = 0;
  var opener = null;
  function show(i) {
    current = (i + items.length) % items.length;
    var thumb = items[current].querySelector('img');
    img.src = thumb.currentSrc || thumb.src;
    img.alt = thumb.alt;
    img.setAttribute('width', thumb.getAttribute('width'));
    img.setAttribute('height', thumb.getAttribute('height'));
    caption.textContent = thumb.alt;
    count.textContent = (current + 1) + ' / ' + items.length;
  }
  each(items, function (btn, i) {
    btn.addEventListener('click', function () {
      opener = btn;
      // the photo must be loaded before it can be shown large
      var thumb = btn.querySelector('img');
      thumb.loading = 'eager';
      show(i);
      box.showModal();
      document.documentElement.style.overflow = 'hidden';
    });
  });
  box.querySelector('.lightbox__btn--prev').addEventListener('click', function () { show(current - 1); });
  box.querySelector('.lightbox__btn--next').addEventListener('click', function () { show(current + 1); });
  box.querySelector('.lightbox__btn--close').addEventListener('click', function () { box.close(); });
  box.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowLeft') { e.preventDefault(); show(current - 1); }
    if (e.key === 'ArrowRight') { e.preventDefault(); show(current + 1); }
  });
  // A click on the dark area around the photo closes it
  box.addEventListener('click', function (e) {
    if (e.target === box || e.target.classList.contains('lightbox__stage')) box.close();
  });
  box.addEventListener('close', function () {
    document.documentElement.style.overflow = '';
    img.removeAttribute('src');
    if (opener) opener.focus();
  });
  // Swipe left / right on phones
  var startX = null;
  box.addEventListener('touchstart', function (e) { startX = e.touches[0].clientX; }, { passive: true });
  box.addEventListener('touchend', function (e) {
    if (startX === null) return;
    var dx = e.changedTouches[0].clientX - startX;
    if (Math.abs(dx) > 50) show(current + (dx < 0 ? 1 : -1));
    startX = null;
  }, { passive: true });
})();

// Hero album: the plain list of pages is bound into leaves that turn around the spine.
// Wide screens: two pages per leaf (front = right page, back = the next left page), the title page sits on the left.
// Phones: one page per leaf. The last page stays underneath as the base.
(function () {
  var wrap = document.getElementById('bookPages');
  if (!wrap) return;
  var book = document.getElementById('book');
  var each = function (list, fn) { Array.prototype.forEach.call(list, fn); };
  var pages = Array.prototype.filter.call(wrap.children, function (el) { return el.classList.contains('apage'); });
  var titleParts = book.querySelectorAll('.book__head, .book__body');
  var prevBtn = book.querySelector('.book__btn--prev');
  var nextBtn = book.querySelector('.book__btn--next');
  var countEl = document.getElementById('bookCount');
  var wideMq = window.matchMedia('(min-width: 1000px)');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var leaves = [], base = null, pos = 0, mode = null, zTop = 100;

  function makeFace(cls, page) {
    var f = document.createElement('div');
    f.className = 'leaf__face ' + cls;
    if (page) f.appendChild(page);
    return f;
  }
  function settle(leaf) {
    var i = leaves.indexOf(leaf);
    var flipped = leaf.classList.contains('is-flipped');
    // turned leaves pile up on the left (last one on top), the rest on the right (first one on top)
    leaf.style.zIndex = flipped ? i + 1 : 2 * leaves.length - i;
    // on phones a turned page has nothing to show on its back: take it out of the way
    leaf.classList.toggle('is-gone', flipped && mode === 'single');
  }
  function addLeaf(front, back) {
    var leaf = document.createElement('div');
    leaf.className = 'leaf';
    leaf.appendChild(makeFace('leaf__face--front', front));
    leaf.appendChild(makeFace('leaf__face--back', back));
    leaf.addEventListener('transitionend', function (e) {
      if (e.target !== leaf || e.propertyName !== 'transform') return;
      leaf.classList.remove('is-turning');
      settle(leaf);
    });
    leaves.push(leaf);
    wrap.appendChild(leaf);
  }
  function build() {
    var newMode = wideMq.matches ? 'spread' : 'single';
    if (newMode === mode) return;
    // keep roughly the same place in the album when the screen changes (rotation)
    if (mode === 'spread') pos = pos * 2;
    else if (mode === 'single') pos = Math.ceil(pos / 2);
    mode = newMode;
    leaves = [];
    wrap.textContent = '';
    var last = pages.length - 1;
    base = document.createElement('div');
    base.className = 'leaf-base';
    base.appendChild(pages[last]);
    wrap.appendChild(base);
    if (mode === 'spread') {
      for (var i = 0; i < last; i += 2) addLeaf(pages[i], i + 1 < last ? pages[i + 1] : null);
    } else {
      for (var j = 0; j < last; j++) addLeaf(pages[j], null);
    }
    pos = Math.min(pos, leaves.length);
    wrap.classList.add('is-built');
    render(false);
  }
  function setReachable(el, on) {
    if (on) { el.removeAttribute('inert'); el.removeAttribute('aria-hidden'); }
    else { el.setAttribute('inert', ''); el.setAttribute('aria-hidden', 'true'); }
  }
  function render(animate) {
    var still = !animate || reduce.matches;
    leaves.forEach(function (leaf, i) {
      var shouldFlip = i < pos;
      if (shouldFlip !== leaf.classList.contains('is-flipped')) {
        leaf.classList.remove('is-gone');
        if (!still) {
          leaf.classList.add('is-turning');
          leaf.style.zIndex = ++zTop; // the turning leaf passes over both piles
          void leaf.offsetWidth;
        }
        leaf.classList.toggle('is-flipped', shouldFlip);
        if (still) settle(leaf);
      } else if (!leaf.classList.contains('is-turning')) {
        settle(leaf);
      }
    });
    // Only the pages that are open can be reached with Tab or a screen reader
    var open = [];
    if (mode === 'spread' && pos > 0) open.push(leaves[pos - 1].lastChild);
    open.push(pos < leaves.length ? leaves[pos].firstChild : base);
    leaves.forEach(function (leaf) {
      setReachable(leaf.firstChild, open.indexOf(leaf.firstChild) > -1);
      setReachable(leaf.lastChild, open.indexOf(leaf.lastChild) > -1);
    });
    setReachable(base, open.indexOf(base) > -1);
    // on wide screens the first turned leaf covers the title page
    each(titleParts, function (el) { setReachable(el, !(mode === 'spread' && pos > 0)); });
    countEl.textContent = (pos + 1) + ' / ' + (leaves.length + 1);
    prevBtn.disabled = pos === 0;
    nextBtn.disabled = pos === leaves.length;
  }
  function go(step) {
    var next = Math.max(0, Math.min(leaves.length, pos + step));
    if (next === pos) return;
    pos = next;
    render(true);
  }

  prevBtn.addEventListener('click', function () { go(-1); });
  nextBtn.addEventListener('click', function () { go(1); });
  book.addEventListener('keydown', function (e) {
    if (!e.target.closest('.book__pages, .book__controls')) return;
    if (e.key === 'ArrowRight') { e.preventDefault(); go(1); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); go(-1); }
  });
  // A tap on a page turns it: the right page forward, the left page back.
  // On phones the outer third of the page goes back, the rest forward.
  var swiped = false;
  wrap.addEventListener('click', function (e) {
    if (swiped) { swiped = false; return; }
    if (e.target.closest('a, button')) return;
    var face = e.target.closest('.leaf__face, .leaf-base');
    if (!face) return;
    if (mode === 'spread') {
      if (face.classList.contains('leaf__face--back')) go(-1);
      else if (face.classList.contains('leaf__face--front')) go(1);
    } else {
      var box = wrap.getBoundingClientRect();
      go(e.clientX - box.left < box.width * 0.3 ? -1 : 1);
    }
  });
  var startX = null, startY = null;
  wrap.addEventListener('touchstart', function (e) {
    startX = e.touches[0].clientX; startY = e.touches[0].clientY;
  }, { passive: true });
  wrap.addEventListener('touchend', function (e) {
    if (startX === null) return;
    var dx = e.changedTouches[0].clientX - startX;
    var dy = e.changedTouches[0].clientY - startY;
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) {
      // a swipe may be followed by a click event: that one must not turn a second page
      swiped = true;
      setTimeout(function () { swiped = false; }, 400);
      go(dx < 0 ? 1 : -1);
    }
    startX = null;
  }, { passive: true });

  if (wideMq.addEventListener) wideMq.addEventListener('change', build);
  else if (wideMq.addListener) wideMq.addListener(build);
  build();
})();
