/* =========================================================
   Benson Idahosa University — campus guide
   Motion: transform-only parallax, gated by IntersectionObserver,
   fully disabled under prefers-reduced-motion.
   ========================================================= */
(function () {
  'use strict';

  var root = document.documentElement;
  root.classList.add('js');

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  var mqMobile = window.matchMedia('(max-width: 820px)');

  /* ---------------------------------------------------------
     1. Hero film — pick a rendition, load it lazily, keep the
        poster on screen until the first frame is decodable.
     --------------------------------------------------------- */
  (function heroFilm() {
    var v = document.getElementById('heroVideo');
    if (!v) return;

    var reveal = function () { v.classList.add('is-ready'); };

    if (reduceMotion.matches) {
      // hold on the poster frame; no motion requested
      reveal();
      return;
    }

    var conn = navigator.connection || {};
    var saveData = conn.saveData === true || /(^|-)2g$/.test(conn.effectiveType || '');
    if (saveData) { reveal(); return; }

    var src = (mqMobile.matches || (conn.effectiveType === 'slow-2g')) ? v.dataset.srcMobile : v.dataset.srcDesktop;
    if (!src) { reveal(); return; }

    v.addEventListener('canplay', function () {
      reveal();
      var p = v.play();
      if (p && typeof p.catch === 'function') p.catch(function () { /* poster stays */ });
    }, { once: true });
    v.addEventListener('error', reveal, { once: true });

    // start the download after first paint so it never competes with the LCP
    var kick = function () {
      v.preload = 'auto';
      v.src = src;
      v.load();
    };
    if ('requestIdleCallback' in window) requestIdleCallback(kick, { timeout: 1200 });
    else setTimeout(kick, 320);

    document.addEventListener('visibilitychange', function () {
      if (document.hidden) v.pause();
      else if (v.src) { var p = v.play(); if (p && p.catch) p.catch(function () {}); }
    });
  })();

  /* ---------------------------------------------------------
     2. Reveal on scroll
     --------------------------------------------------------- */
  (function reveals() {
    var nodes = document.querySelectorAll('[data-reveal]');
    if (!nodes.length) return;
    if (reduceMotion.matches || !('IntersectionObserver' in window)) {
      nodes.forEach(function (n) { n.classList.add('is-in'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.08 });
    nodes.forEach(function (n) { io.observe(n); });
  })();

  /* ---------------------------------------------------------
     3. Layered scroll parallax — translate3d only, three depths,
        amplitude trimmed on small screens, off for reduced motion.
     --------------------------------------------------------- */
  (function parallax() {
    var nodes = Array.prototype.slice.call(document.querySelectorAll('[data-parallax]'));
    if (!nodes.length) return;

    var startScroll = window.scrollY || document.documentElement.scrollTop || 0;
    var vh0 = window.innerHeight || 1;
    var items = nodes.map(function (el) {
      var r = el.getBoundingClientRect();
      return {
        el: el,
        depth: parseFloat(el.dataset.parallax) || 0,
        live: false,
        // layers already on screen at rest must start at zero, so they drift
        // with the scroll delta instead of the viewport centre
        atRest: r.top < vh0 * 1.2
      };
    });
    var queue = new Set();
    var scheduled = false;

    function paint() {
      scheduled = false;
      var vh = window.innerHeight || 1;
      var amp = mqMobile.matches ? 0.55 : 1;
      var scrolled = window.scrollY || document.documentElement.scrollTop || 0;
      for (var i = 0; i < items.length; i++) {
        var it = items[i];
        if (!it.live) continue;
        var r = it.el.getBoundingClientRect();
        if (r.bottom < -240 || r.top > vh + 240) continue;
        var y;
        if (it.atRest) {
          y = Math.min(700, Math.max(0, scrolled - startScroll)) * it.depth * amp;
        } else {
          var mid = (r.top + r.height / 2 - vh / 2) / vh;    // -1 … 1
          y = mid * it.depth * vh * amp;
        }
        it.el.style.transform = 'translate3d(0,' + (Math.round(y * 10) / 10) + 'px,0)';
      }
      if (queue.size) schedule();
    }

    function schedule() {
      if (scheduled) return;
      scheduled = true;
      requestAnimationFrame(paint);
    }

    function onScroll() {
      if (reduceMotion.matches) return;
      if (!queue.size) return;
      schedule();
    }

    if (reduceMotion.matches || !('IntersectionObserver' in window)) return;

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        var it = items.find(function (x) { return x.el === e.target; });
        if (!it) return;
        it.live = e.isIntersecting;
        if (it.live) { queue.add(it); it.el.style.willChange = 'transform'; schedule(); }
        else { queue.delete(it); it.el.style.willChange = ''; it.el.style.transform = 'translate3d(0,0,0)'; }
      });
    }, { rootMargin: '25% 0px 25% 0px' });

    items.forEach(function (it) { io.observe(it.el); });
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', schedule, { passive: true });
    window.addEventListener('orientationchange', schedule);

    // if the user turns reduced-motion on mid-session, settle everything flat
    var onMq = function () {
      if (reduceMotion.matches) {
        items.forEach(function (it) { it.el.style.transform = ''; it.el.style.willChange = ''; it.live = false; });
        queue.clear();
      }
    };
    if (reduceMotion.addEventListener) reduceMotion.addEventListener('change', onMq);
  })();

  /* ---------------------------------------------------------
     4. Header: stuck state + reading progress
     --------------------------------------------------------- */
  (function header() {
    var head = document.getElementById('siteHead');
    var bar = document.getElementById('progressBar');
    if (!head) return;
    var ticking = false;

    function update() {
      ticking = false;
      var y = window.scrollY || document.documentElement.scrollTop;
      head.classList.toggle('is-stuck', y > 24);
      var max = document.documentElement.scrollHeight - window.innerHeight;
      var p = max > 0 ? Math.min(1, Math.max(0, y / max)) : 0;
      if (bar) bar.style.transform = 'scaleX(' + p.toFixed(4) + ')';
    }
    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    }
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
  })();

  /* ---------------------------------------------------------
     5. Navigation: mobile drawer, active section, escape to close
     --------------------------------------------------------- */
  (function nav() {
    var burger = document.getElementById('burger');
    var navEl = document.getElementById('nav');
    if (!burger || !navEl) return;

    function setOpen(open) {
      navEl.classList.toggle('is-open', open);
      burger.setAttribute('aria-expanded', String(open));
      burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    }
    burger.addEventListener('click', function () {
      setOpen(burger.getAttribute('aria-expanded') !== 'true');
    });
    navEl.addEventListener('click', function (e) {
      if (e.target.closest('a')) setOpen(false);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && burger.getAttribute('aria-expanded') === 'true') { setOpen(false); burger.focus(); }
    });
    window.addEventListener('resize', function () {
      if (!mqMobile.matches) setOpen(false);
    });

    var links = Array.prototype.slice.call(navEl.querySelectorAll('a[href^="#"]'));
    var map = links.map(function (a) {
      return { a: a, sec: document.querySelector(a.getAttribute('href')) };
    }).filter(function (x) { return x.sec; });

    if (!map.length || !('IntersectionObserver' in window)) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        map.forEach(function (x) { x.a.classList.toggle('is-active', x.sec === e.target); });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    map.forEach(function (x) { io.observe(x.sec); });
  })();

  /* ---------------------------------------------------------
     6. Plus code copy
     --------------------------------------------------------- */
  (function copyCode() {
    var buttons = document.querySelectorAll('[data-code]');
    if (!buttons.length) return;

    function flash(btn) {
      var label = btn.querySelector('span');
      if (!label) return;
      var was = label.textContent;
      label.textContent = 'copied';
      btn.classList.add('is-done');
      setTimeout(function () { label.textContent = was; btn.classList.remove('is-done'); }, 1600);
    }

    buttons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var text = btn.dataset.code;
        var done = function () { flash(btn); };
        if (navigator.clipboard && window.isSecureContext) {
          navigator.clipboard.writeText(text).then(done, function () { legacy(text, done); });
        } else legacy(text, done);
      });
    });

    function legacy(text, cb) {
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.cssText = 'position:absolute;left:-9999px;top:0';
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); cb(); } catch (err) { /* nothing else to try */ }
      document.body.removeChild(ta);
    }
  })();

  /* ---------------------------------------------------------
     7. Google Maps embed, loaded only when asked for
     --------------------------------------------------------- */
  (function mapEmbed() {
    var btn = document.getElementById('loadMap');
    var holder = document.getElementById('map');
    if (!btn || !holder) return;

    btn.addEventListener('click', function () {
      var q = encodeURIComponent('Benson Idahosa University, 15 Agboma St, Ogogugbo, Benin City 300102, Edo, Nigeria');
      var frame = document.createElement('iframe');
      frame.title = 'Map showing Benson Idahosa University, 15 Agboma St, Ogogugbo, Benin City';
      frame.loading = 'lazy';
      frame.referrerPolicy = 'no-referrer-when-downgrade';
      frame.src = 'https://www.google.com/maps?q=' + q + '&z=16&output=embed';
      holder.innerHTML = '';
      holder.appendChild(frame);
    }, { once: true });
  })();

  /* ---------------------------------------------------------
     8. Hero intro
     --------------------------------------------------------- */
  requestAnimationFrame(function () {
    requestAnimationFrame(function () { root.classList.add('is-booted'); });
  });
})();
