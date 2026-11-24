(function () {
  var root = document.documentElement;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  var each = function (list, fn) { Array.prototype.forEach.call(list, fn); };

  // ---------- Language: the visitor's own choice (remembered in this browser only); first pick is made in <head>
  var titles = {
    sl: 'Shakti Frequency · Nataša Percel · prebujanje Kundalini Shakti energije',
    en: 'Shakti Frequency · Nataša Percel · Kundalini Shakti awakening'
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
      try { localStorage.setItem('shakti-frequency-lang', lang); } catch (e) { /* storage blocked: fine */ }
    }
    // Text lengths change between languages, so the serpent is laid out again
    if (typeof buildSpine === 'function') buildSpine();
  }

  // ---------- Navigation: solid bar after scrolling, full-screen menu on phones
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

  // ---------- The serpent spine: on wide screens one gold line weaves down the left margin,
  // through a ring beside every section label, and draws itself as the visitor scrolls.
  var SVG_NS = 'http://www.w3.org/2000/svg';
  var main = document.getElementById('top');
  var spine = document.getElementById('spine');
  var spinePath = spine.querySelector('path');
  var hero = document.querySelector('.hero');
  var spineState = null;

  function buildSpine() {
    each(spine.querySelectorAll('circle, line'), function (c) { c.parentNode.removeChild(c); });
    spineState = null;
    var wrap = document.querySelector('.about .wrap');
    var labels = document.querySelectorAll('.label[data-node]');
    var wrapRect = wrap.getBoundingClientRect();
    var contentLeft = wrapRect.left + parseFloat(getComputedStyle(wrap).paddingLeft);
    if (window.innerWidth < 1100 || contentLeft < 90) {
      spine.classList.remove('spine--on');
      root.classList.remove('has-spine');
      return;
    }
    var mainTop = main.getBoundingClientRect().top + window.scrollY;
    var height = main.offsetHeight;
    var x = Math.round(contentLeft - 50);
    var amp = Math.min(34, contentLeft / 4);
    var ys = [hero.offsetHeight - 30];
    each(labels, function (label) {
      var r = label.getBoundingClientRect();
      ys.push(r.top + window.scrollY - mainTop + r.height / 2);
    });
    ys.push(height - 60);

    // Between two rings the body makes one S-bend per ~650 px, so it reads as a serpent, not a rule
    var d = 'M' + x + ' ' + ys[0];
    for (var i = 1; i < ys.length; i++) {
      var y0 = ys[i - 1], y1 = ys[i];
      var bends = Math.max(1, Math.round((y1 - y0) / 650));
      var h = (y1 - y0) / bends;
      for (var b = 0; b < bends; b++) {
        var a = y0 + h * b;
        d += ' C' + (x + amp) + ' ' + (a + h / 3) + ' ' + (x - amp) + ' ' + (a + 2 * h / 3) + ' ' + x + ' ' + (a + h);
      }
    }
    spine.setAttribute('height', height);
    spine.style.height = height + 'px';
    spinePath.setAttribute('d', d);
    spine.classList.add('spine--on');
    root.classList.add('has-spine');

    var len = spinePath.getTotalLength();
    // Length along the path for each height, so a scroll position maps to how much is drawn
    var samples = [];
    var steps = Math.max(60, Math.round(len / 10));
    for (var s = 0; s <= steps; s++) {
      var l = len * s / steps;
      samples.push([spinePath.getPointAtLength(l).y, l]);
    }
    var nodes = [];
    for (var n = 1; n < ys.length - 1; n++) {
      // A fine thread from the ring to its label
      var t = document.createElementNS(SVG_NS, 'line');
      t.setAttribute('x1', x + 8); t.setAttribute('x2', contentLeft - 10);
      t.setAttribute('y1', ys[n]); t.setAttribute('y2', ys[n]);
      t.setAttribute('class', 'spine__thread');
      spine.appendChild(t);
      var c = document.createElementNS(SVG_NS, 'circle');
      c.setAttribute('cx', x); c.setAttribute('cy', ys[n]); c.setAttribute('r', 5);
      c.setAttribute('class', 'spine__node');
      spine.appendChild(c);
      nodes.push({ el: c, y: ys[n] });
    }
    spinePath.style.strokeDasharray = len;
    spineState = { len: len, samples: samples, nodes: nodes, mainTop: mainTop };
    drawSpine();
  }

  function drawSpine() {
    if (!spineState) return;
    var st = spineState;
    var target = reduceMotion.matches ? Infinity : window.scrollY + window.innerHeight * 0.62 - st.mainTop;
    var drawn = 0;
    if (target >= st.samples[st.samples.length - 1][0]) drawn = st.len;
    else {
      var lo = 0, hi = st.samples.length - 1;
      while (lo < hi) {
        var mid = (lo + hi) >> 1;
        if (st.samples[mid][0] < target) lo = mid + 1; else hi = mid;
      }
      drawn = st.samples[lo][1];
    }
    spinePath.style.strokeDashoffset = st.len - drawn;
    st.nodes.forEach(function (node) {
      node.el.classList.toggle('spine__node--lit', node.y <= target);
    });
  }

  var ticking = false;
  function onScroll() {
    nav.classList.toggle('nav--solid', window.scrollY > 30);
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(function () { ticking = false; drawSpine(); });
  }
  window.addEventListener('scroll', onScroll, { passive: true });

  var resizeTimer = null;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(buildSpine, 150);
  });
  window.addEventListener('load', buildSpine);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(buildSpine);

  setLang(root.lang === 'sl' ? 'sl' : 'en', false);
  document.getElementById('langToggle').addEventListener('click', function () {
    setLang(root.lang === 'sl' ? 'en' : 'sl', true);
  });
  onScroll();

  // ---------- Videos: only one plays at a time.
  // The session loop is silent decoration: it plays only while on screen and never for reduced motion.
  var loop = document.querySelector('.session__video');
  var videos = document.querySelectorAll('video');
  var loopVisible = false;
  function playLoop() {
    if (!loop || reduceMotion.matches || !loopVisible) return;
    for (var i = 0; i < videos.length; i++) {
      if (videos[i] !== loop && !videos[i].paused) return;
    }
    var attempt = loop.play();
    if (attempt && attempt.catch) attempt.catch(function () { /* autoplay blocked: the poster stays */ });
  }
  each(videos, function (v) {
    v.addEventListener('play', function () {
      each(videos, function (other) { if (other !== v) other.pause(); });
    });
    if (v !== loop) {
      v.addEventListener('pause', playLoop);
      v.addEventListener('ended', playLoop);
    }
  });
  if (loop) {
    loop.muted = true;
    loop.defaultMuted = true;
    loop.disablePictureInPicture = true;
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        loopVisible = entries[0].isIntersecting;
        if (loopVisible) playLoop(); else loop.pause();
      }, { threshold: 0.25 }).observe(loop);
    }
  }
})();
