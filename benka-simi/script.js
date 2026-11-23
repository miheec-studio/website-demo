(function () {
  var root = document.documentElement;
  var each = function (list, fn) { Array.prototype.forEach.call(list, fn); };

  // Language: the visitor's own choice (remembered in this browser only); the first pick is made in <head>
  var titles = {
    sl: 'Simona Simi · učiteljica joge',
    en: 'Simona Simi · yoga teacher'
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
      try { localStorage.setItem('benka-simi-lang', lang); } catch (e) { /* storage blocked: fine */ }
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

  // Seasons: tabs, opening on the season it is now (without JavaScript all five are simply listed)
  var tablist = document.querySelector('.tabs');
  var tabs = tablist ? tablist.querySelectorAll('[role="tab"]') : [];
  function selectTab(tab, focus) {
    each(tabs, function (t) {
      var on = t === tab;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
      document.getElementById(t.getAttribute('aria-controls')).hidden = !on;
    });
    if (focus) tab.focus();
  }
  function currentSeason(d) {
    var md = (d.getMonth() + 1) * 100 + d.getDate();
    if (md >= 320 && md < 621) return 'spring';
    if (md >= 621 && md < 816) return 'summer';
    if (md >= 816 && md < 923) return 'late-summer';
    if (md >= 923 && md < 1221) return 'autumn';
    return 'winter';
  }
  if (tabs.length) {
    tablist.classList.add('tabs--ready');
    var now = tablist.querySelector('[data-season="' + currentSeason(new Date()) + '"]') || tabs[0];
    selectTab(now, false);
    each(tabs, function (tab, i) {
      tab.addEventListener('click', function () { selectTab(tab, false); });
      tab.addEventListener('keydown', function (e) {
        var next = null;
        if (e.key === 'ArrowRight') next = tabs[(i + 1) % tabs.length];
        else if (e.key === 'ArrowLeft') next = tabs[(i - 1 + tabs.length) % tabs.length];
        else if (e.key === 'Home') next = tabs[0];
        else if (e.key === 'End') next = tabs[tabs.length - 1];
        if (next) { e.preventDefault(); selectTab(next, true); }
      });
    });
  }
})();
