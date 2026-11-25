(function () {
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  var wide = window.matchMedia('(min-width: 900px)');
  var each = function (list, fn) { Array.prototype.forEach.call(list, fn); };
  var onChange = function (mq, fn) {
    if (mq.addEventListener) mq.addEventListener('change', fn);
    else if (mq.addListener) mq.addListener(fn);
  };

  // ---------- Navigation: full-screen menu on phones ----------
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
  onChange(wide, function (e) { if (e.matches) closeMenu(false); });

  // ---------- Hero photos that change like stories ----------
  var stories = document.getElementById('stories');
  if (stories) {
    var slides = stories.querySelectorAll('.stories__slides li');
    var bars = stories.querySelectorAll('.stories__bars span');
    var pauseBtn = document.getElementById('storiesPause');
    var index = 0;
    var userPaused = false;
    var inView = true;
    var show = function (i) {
      index = (i + slides.length) % slides.length;
      each(slides, function (li, n) {
        li.classList.toggle('is-active', n === index);
        li.setAttribute('aria-hidden', n === index ? 'false' : 'true');
      });
      each(bars, function (bar, n) {
        bar.classList.remove('is-active');
        bar.classList.toggle('is-done', n < index);
      });
      void bars[index].offsetWidth; // restart the progress bar of the new photo
      bars[index].classList.add('is-active');
    };
    var updatePaused = function () {
      stories.classList.toggle('is-paused', userPaused || !inView || document.hidden);
    };
    each(bars, function (bar) {
      bar.firstElementChild.addEventListener('animationend', function () { show(index + 1); });
    });
    stories.querySelector('.stories__tap--prev').addEventListener('click', function () { show(index - 1); });
    stories.querySelector('.stories__tap--next').addEventListener('click', function () { show(index + 1); });
    stories.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') show(index - 1);
      if (e.key === 'ArrowRight') show(index + 1);
    });
    pauseBtn.addEventListener('click', function () {
      userPaused = !userPaused;
      pauseBtn.setAttribute('aria-pressed', String(userPaused));
      pauseBtn.setAttribute('aria-label', userPaused ? 'Nadaljuj menjavanje fotografij' : 'Ustavi menjavanje fotografij');
      updatePaused();
    });
    // No point in running while it is off screen or the tab is in the background
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        inView = entries[0].isIntersecting;
        updatePaused();
      }, { threshold: 0.2 }).observe(stories);
    }
    document.addEventListener('visibilitychange', updatePaused);
    // People who prefer reduced motion change the photos themselves
    var applyMotion = function () { stories.classList.toggle('is-still', reduceMotion.matches); };
    onChange(reduceMotion, applyMotion);
    applyMotion();
    show(0);
  }

  // ---------- Services: one open at a time; on wide screens the big photo follows ----------
  var heads = document.querySelectorAll('.svc__head');
  var stage = document.querySelectorAll('#svcStage img');
  function setOpen(head) {
    each(heads, function (h) {
      var open = h === head;
      h.setAttribute('aria-expanded', String(open));
      h.closest('.svc').classList.toggle('is-open', open);
    });
    if (!head) return;
    var n = Number(head.getAttribute('data-photo'));
    each(stage, function (img, i) { img.classList.toggle('is-active', i === n); });
  }
  each(heads, function (head) {
    head.addEventListener('click', function () {
      var isOpen = head.getAttribute('aria-expanded') === 'true';
      // On phones a second tap closes it again; beside the big photo one always stays open
      if (isOpen && !wide.matches) { setOpen(null); return; }
      if (isOpen) return;
      setOpen(head);
      // The one above just closed, so the tapped title may have slid up under the bar: bring it back
      window.setTimeout(function () {
        var top = head.getBoundingClientRect().top;
        if (top < 76) window.scrollBy({ top: top - 92, behavior: reduceMotion.matches ? 'auto' : 'smooth' });
      }, 540);
    });
  });
  // Going wide with everything closed would leave the big photo without a text
  onChange(wide, function (e) {
    if (e.matches && !document.querySelector('.svc.is-open') && heads.length) setOpen(heads[0]);
  });

  // ---------- Things rise into place as they scroll into view ----------
  var revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !reduceMotion.matches) {
    var revealer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.remove('is-pending');
        revealer.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -6% 0px', threshold: 0.06 });
    each(revealEls, function (el) {
      el.classList.add('is-pending');
      revealer.observe(el);
    });
  }

  // ---------- Gallery: enlarged photo with previous / next ----------
  var box = document.getElementById('lightbox');
  var boxImg = document.getElementById('lightboxImg');
  var boxCap = document.getElementById('lightboxCap');
  var boxCount = document.getElementById('lightboxCount');
  var tiles = Array.prototype.slice.call(document.querySelectorAll('#gallery .tile'));
  var current = 0;
  function showPhoto(i) {
    current = (i + tiles.length) % tiles.length;
    var tile = tiles[current];
    var alt = tile.querySelector('img').getAttribute('alt');
    boxImg.setAttribute('width', tile.getAttribute('data-w'));
    boxImg.setAttribute('height', tile.getAttribute('data-h'));
    boxImg.setAttribute('alt', alt);
    boxImg.setAttribute('src', tile.getAttribute('data-full'));
    boxCap.textContent = alt;
    boxCount.textContent = (current + 1) + ' / ' + tiles.length;
  }
  if (box && typeof box.showModal === 'function') {
    tiles.forEach(function (tile, i) {
      tile.addEventListener('click', function () {
        showPhoto(i);
        box.showModal();
        document.body.style.overflow = 'hidden';
      });
    });
    document.getElementById('lightboxClose').addEventListener('click', function () { box.close(); });
    document.getElementById('lightboxPrev').addEventListener('click', function () { showPhoto(current - 1); });
    document.getElementById('lightboxNext').addEventListener('click', function () { showPhoto(current + 1); });
    box.addEventListener('close', function () { document.body.style.overflow = ''; });
    // A tap on the dark area around the photo closes it
    box.addEventListener('click', function (e) {
      if (e.target === box || e.target.classList.contains('lightbox__fig')) box.close();
    });
    box.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') showPhoto(current - 1);
      if (e.key === 'ArrowRight') showPhoto(current + 1);
    });
    // Swipe left / right on phones
    var startX = null;
    box.addEventListener('touchstart', function (e) { startX = e.touches.length === 1 ? e.touches[0].clientX : null; }, { passive: true });
    box.addEventListener('touchend', function (e) {
      if (startX === null) return;
      var dx = e.changedTouches[0].clientX - startX;
      startX = null;
      if (Math.abs(dx) > 48) showPhoto(current + (dx < 0 ? 1 : -1));
    }, { passive: true });
  } else {
    // Very old browsers: the photo simply opens on its own
    tiles.forEach(function (tile) {
      tile.addEventListener('click', function () { window.location.href = tile.getAttribute('data-full'); });
    });
  }

  // Anchor links scroll smoothly unless the visitor prefers reduced motion
  if (!reduceMotion.matches) document.documentElement.style.scrollBehavior = 'smooth';
})();
