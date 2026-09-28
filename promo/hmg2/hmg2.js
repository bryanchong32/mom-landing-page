/**
 * Homega sales page (/promo/hmg2/) — page behaviour.
 * Plain ES5, no dependencies. Loaded after /js/main.js (checkout tracking,
 * ad-tag passthrough, FAQ accordion, sticky bar) and /promo/promo.js
 * (campaign bar). This file never uses the [data-plan] attribute, so
 * promo.js's own picker code finds nothing to touch here.
 *
 * 1. Plan picker — every picker, buy link, box lineup and the sticky bar
 *    stay on the same plan. Buy links change pathname only, so the ad tags
 *    main.js appended to the query string survive a plan change.
 * 2. Reveal-on-view for the few animated figures.
 * 3. How-it-works animation (SVG, driven here).
 * 4. Voices feed: "show all" button.
 * 5. Small courtesies: hide the sticky bar over the bottom picker,
 *    pause the video when it scrolls away.
 */
(function () {
  'use strict';

  var reduced = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  var hasIO = 'IntersectionObserver' in window;
  function each(list, fn) { Array.prototype.forEach.call(list, fn); }

  /* -----------------------------------------------------------------
     1. Plan picker
     ----------------------------------------------------------------- */
  var PLANS = {
    '6': { path: '6hmg', checkout: '6box', value: 3000, label: '購買 6盒 · HK$3,000',
           plan: '6盒 · 180 日', price: 'HK$3,000 · 每日 HK$16.7', nudge: '' },
    '3': { path: '3hmg', checkout: '3box', value: 1650, label: '購買 3盒 · HK$1,650',
           plan: '3盒 · 90 日', price: 'HK$1,650 · 每日 HK$18.3',
           nudge: '加 HK$1,350 升級至 6盒：多出的 3盒，每盒只需 HK$450。' },
    '1': { path: '1hmg', checkout: '1box', value: 700, label: '購買 1盒 · HK$700',
           plan: '1盒 · 30 日', price: 'HK$700 · 每日 HK$23.3',
           nudge: '加 HK$2,300 升級至 6盒：多出的 5盒，每盒只需 HK$460。' }
  };

  function applyPlan(key) {
    var p = PLANS[key];
    if (!p) return;

    each(document.querySelectorAll('[data-plans] input[type="radio"]'), function (r) {
      r.checked = (r.value === key);
      var label = r.closest ? r.closest('.plan') : r.parentNode;
      if (label) label.classList.toggle('is-on', r.checked);
    });

    each(document.querySelectorAll('a[data-buy]'), function (a) {
      try {
        var url = new URL(a.href);
        url.pathname = '/hk/zh-TW/express/' + p.path;
        a.href = url.toString();
      } catch (e) { /* leave the link as it was */ }
      a.setAttribute('data-checkout', p.checkout);
      a.setAttribute('data-value', String(p.value));
      var label = a.querySelector('[data-buy-label]');
      if (label) label.textContent = p.label;
    });

    each(document.querySelectorAll('[data-boxes]'), function (b) { b.setAttribute('data-n', key); });

    var sp = document.querySelector('[data-sticky-plan]');
    var sr = document.querySelector('[data-sticky-price]');
    if (sp) sp.textContent = p.plan;
    if (sr) sr.textContent = p.price;

    each(document.querySelectorAll('[data-nudge]'), function (n) {
      n.textContent = '';
      if (!p.nudge) { n.hidden = true; return; }
      n.appendChild(document.createTextNode(p.nudge + ' '));
      var up = document.createElement('button');
      up.type = 'button';
      up.textContent = '改選 6盒';
      up.addEventListener('click', function () { applyPlan('6'); });
      n.appendChild(up);
      n.hidden = false;
    });
  }

  each(document.querySelectorAll('[data-plans]'), function (fs) {
    fs.addEventListener('change', function (e) {
      if (e.target && e.target.type === 'radio') applyPlan(e.target.value);
    });
  });
  each(document.querySelectorAll('[data-pick]'), function (a) {
    a.addEventListener('click', function () { applyPlan(a.getAttribute('data-pick')); });
  });
  // Sync the initial state (also covers a browser restoring a different radio on back/forward)
  var initial = document.querySelector('[data-plans] input[type="radio"]:checked');
  applyPlan(initial ? initial.value : '6');

  /* -----------------------------------------------------------------
     2. Reveal the animated figures when they come into view
     ----------------------------------------------------------------- */
  var reveals = document.querySelectorAll('[data-reveal]');
  if (!hasIO || reduced) {
    each(reveals, function (el) { el.classList.add('in'); });
  } else {
    var revObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('in'); revObs.unobserve(en.target); }
      });
    }, { threshold: 0.35 });
    each(reveals, function (el) { revObs.observe(el); });
  }

  /* -----------------------------------------------------------------
     3. How it works — calcium, blood flow, bone
     Logical canvas is the SVG viewBox (360 × 290).
     ----------------------------------------------------------------- */
  (function mechanism() {
    var fig = document.querySelector('.mech');
    var tabsWrap = document.querySelector('[data-modes]');
    if (!fig || !tabsWrap) return;
    var svg = fig.querySelector('svg');
    var NS = 'http://www.w3.org/2000/svg';
    var layerCa = svg.querySelector('[data-layer="ca"]');
    var layerCells = svg.querySelector('[data-layer="cells"]');
    var layerStreaks = svg.querySelector('[data-layer="streaks"]');
    var bone = svg.querySelector('[data-bone]');
    var tabs = tabsWrap.querySelectorAll('[data-mode]');
    var status = document.querySelector('[data-mode-status]');

    var MODES = {
      all:  { d3: 1, k2: 1, o3: 1, text: '三樣齊備：鈣質吸收了，也送到骨骼；Omega-3 支持血液流動。' },
      noD3: { d3: 0, k2: 1, o3: 1, text: '少了 D3：身體吸收的鈣質減少，骨骼得到的也少了。' },
      noK2: { d3: 1, k2: 0, o3: 1, text: '少了 K2：鈣質吸收了，卻沒有好去處。' },
      noO3: { d3: 1, k2: 1, o3: 0, text: '少了 Omega-3：心血管少了 EPA+DHA 的支持。' }
    };
    var ORDER = ['all', 'noD3', 'noK2', 'noO3'];
    var MODE_MS = 4800;

    var GATE = 66, VT = 100, VB = 176, D1 = 234, DC = 260;
    var mode = MODES.all, modeKey = 'all';
    var flow = 1, streakA = 0.55, boneLevel = 10, boneShown = 0.8, spawnT = 0;
    var ca = [], cells = [], streaks = [];

    function rnd(a, b) { return a + Math.random() * (b - a); }
    function mk(tag, attrs, parent) {
      var e = document.createElementNS(NS, tag);
      for (var k in attrs) e.setAttribute(k, attrs[k]);
      parent.appendChild(e);
      return e;
    }

    var i;
    for (i = 0; i < 11; i++) {
      cells.push({ x: i * 34 + rnd(0, 12), y: rnd(VT + 12, VB - 12), w: rnd(0, 6.3),
                   e: mk('ellipse', { rx: 7.5, ry: 4.5, fill: 'url(#m-cell)' }, layerCells) });
    }
    for (i = 0; i < 6; i++) {
      streaks.push({ x: rnd(0, 380), y: rnd(VT + 8, VB - 8), e: mk('line', { 'class': 'm-streak' }, layerStreaks) });
    }

    function spawn() {
      var p = { x: rnd(24, 336), y: -4, vx: rnd(-0.12, 0.12), ph: 'fall', a: 1, life: 0, sp: rnd(0.85, 1.15) };
      p.e = mk('circle', { r: 3.2, 'class': 'm-ca' }, layerCa);
      ca.push(p);
    }
    function kill(idx) {
      var p = ca[idx];
      if (p.e.parentNode) p.e.parentNode.removeChild(p.e);
      ca.splice(idx, 1);
    }

    function step(dt) {
      var k = Math.min(1, 0.05 * dt);
      flow += ((mode.o3 ? 1 : 0.38) - flow) * k;
      streakA += ((mode.o3 ? 0.55 : 0) - streakA) * k;
      spawnT += dt;
      if (spawnT >= 7) { spawnT = 0; spawn(); }
      boneLevel *= Math.pow(0.988, dt);

      for (var j = ca.length - 1; j >= 0; j--) {
        var p = ca[j];
        if (p.ph === 'fall') {
          p.y += 0.75 * dt; p.x += p.vx * dt;
          if (p.y >= GATE) {
            if (Math.random() < (mode.d3 ? 0.9 : 0.15)) { p.ph = 'pass'; }
            else { p.ph = 'stop'; p.y = GATE - 2; p.life = 45; }
          }
        } else if (p.ph === 'pass') {
          p.y += 1.0 * dt;
          if (p.y >= VT + 6) { p.ph = 'flow'; p.ty = rnd(VT + 12, VB - 12); }
        } else if (p.ph === 'flow') {
          p.x += 1.5 * flow * p.sp * dt;
          p.y += (p.ty - p.y) * Math.min(1, 0.06 * dt);
          if (mode.k2) {
            if (!p.chk && p.x > D1 - 44 && p.x < D1) {
              p.chk = true;
              if (Math.random() < 0.9) { p.ph = 'door'; p.tx = rnd(212, 304); p.tb = rnd(229, 252); }
            }
          } else if (Math.random() < 0.007 * dt) {
            p.ph = 'stick'; p.wy = p.y < (VT + VB) / 2 ? VT + 4 : VB - 4; p.life = 240;
          }
          if (p.x > 368) { kill(j); continue; }
        } else if (p.ph === 'door') {
          if (!mode.k2 && p.y < VB - 4) { p.ph = 'flow'; p.chk = true; }
          else if (p.y < VB + 4) {
            p.x += (DC - p.x) * Math.min(1, 0.12 * dt) + 0.4 * flow * dt;
            p.y += 1.3 * dt;
          } else {
            p.x += (p.tx - p.x) * Math.min(1, 0.07 * dt);
            p.y += (p.tb - p.y) * Math.min(1, 0.07 * dt);
            if (Math.abs(p.tb - p.y) < 1.2) { boneLevel += 1; p.ph = 'settle'; p.life = 30; }
          }
        } else if (p.ph === 'stick') {
          p.y += (p.wy - p.y) * Math.min(1, 0.1 * dt);
          p.x += 0.12 * flow * dt;
          p.life -= dt; p.a = Math.max(0, Math.min(1, p.life / 50));
          if (p.life <= 0) { kill(j); continue; }
        } else { // stop / settle: fade out where it is
          p.life -= dt; p.a = Math.max(0, p.life / 45);
          if (p.life <= 0) { kill(j); continue; }
        }
      }

      for (var c = 0; c < cells.length; c++) {
        var cl = cells[c];
        cl.x += 1.7 * flow * dt; cl.w += 0.05 * dt;
        if (cl.x > 372) { cl.x = -12; cl.y = rnd(VT + 12, VB - 12); }
      }
      for (var s = 0; s < streaks.length; s++) {
        var st = streaks[s];
        st.x += 2.8 * flow * dt;
        if (st.x > 400) { st.x = rnd(-60, -10); st.y = rnd(VT + 8, VB - 8); }
      }
      var target = 0.12 + 0.8 * Math.min(1, boneLevel / 8);
      boneShown += (target - boneShown) * Math.min(1, 0.08 * dt);
    }

    function render() {
      for (var j = 0; j < ca.length; j++) {
        var p = ca[j];
        p.e.setAttribute('cx', p.x.toFixed(1));
        p.e.setAttribute('cy', p.y.toFixed(1));
        if (p.a < 1) p.e.setAttribute('opacity', p.a.toFixed(2));
      }
      for (var c = 0; c < cells.length; c++) {
        var cl = cells[c];
        cl.e.setAttribute('cx', cl.x.toFixed(1));
        cl.e.setAttribute('cy', (cl.y + Math.sin(cl.w) * 1.2).toFixed(1));
      }
      for (var s = 0; s < streaks.length; s++) {
        var st = streaks[s];
        st.e.setAttribute('x1', (st.x - 24).toFixed(1));
        st.e.setAttribute('x2', st.x.toFixed(1));
        st.e.setAttribute('y1', st.y.toFixed(1));
        st.e.setAttribute('y2', st.y.toFixed(1));
        st.e.setAttribute('opacity', streakA.toFixed(2));
      }
      bone.setAttribute('opacity', boneShown.toFixed(3));
    }

    function simulate(n) { for (var q = 0; q < n; q++) step(1); render(); }

    function setMode(key) {
      if (!MODES[key]) return;
      if (modeKey === 'noK2' && key !== 'noK2') {
        // quick scene reset so leftover specks don't read as K2 "cleaning" anything
        ca.forEach(function (p) { if (p.ph === 'stick') p.life = Math.min(p.life, 30); });
      }
      modeKey = key; mode = MODES[key];
      fig.setAttribute('data-mode-view', key);
      each(tabs, function (t) { t.setAttribute('aria-selected', t.getAttribute('data-mode') === key ? 'true' : 'false'); });
      if (status) status.textContent = mode.text;
      if (reduced) simulate(420);
    }

    // Autoplay walks through the four states until the visitor taps one.
    var autoTimer = null, auto = !reduced, visible = false;
    tabsWrap.style.setProperty('--mode-ms', MODE_MS + 'ms');
    function scheduleNext() {
      clearTimeout(autoTimer);
      if (!auto || !visible) return;
      tabsWrap.classList.remove('is-auto');
      void tabsWrap.offsetWidth; // restart the progress bar
      tabsWrap.classList.add('is-auto');
      autoTimer = setTimeout(function () {
        setMode(ORDER[(ORDER.indexOf(modeKey) + 1) % ORDER.length]);
        scheduleNext();
      }, MODE_MS);
    }
    each(tabs, function (t) {
      t.addEventListener('click', function () {
        auto = false; clearTimeout(autoTimer); tabsWrap.classList.remove('is-auto');
        setMode(t.getAttribute('data-mode'));
      });
    });

    // Warm start: the scene is already populated when it first appears.
    simulate(420);
    if (reduced || !hasIO) { setMode('all'); return; }

    var raf = 0, last = 0;
    function frame(t) {
      var dt = last ? Math.min(3, (t - last) / 16.667) : 1;
      last = t;
      step(dt); render();
      raf = requestAnimationFrame(frame);
    }
    function start() { if (raf) return; last = 0; raf = requestAnimationFrame(frame); }
    function stop() { if (raf) cancelAnimationFrame(raf); raf = 0; }

    new IntersectionObserver(function (entries) {
      visible = entries[0].isIntersecting;
      if (visible && !document.hidden) { start(); scheduleNext(); }
      else { stop(); clearTimeout(autoTimer); tabsWrap.classList.remove('is-auto'); }
    }, { threshold: 0.2 }).observe(svg);
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) { stop(); clearTimeout(autoTimer); }
      else if (visible) { start(); scheduleNext(); }
    });
  })();

  /* -----------------------------------------------------------------
     4. Voices feed — the first few show; one tap opens the rest
     ----------------------------------------------------------------- */
  (function feed() {
    var f = document.querySelector('[data-feed]');
    var btn = document.querySelector('[data-more]');
    if (!f || !btn) return;
    btn.addEventListener('click', function () {
      f.classList.add('is-open');
      btn.setAttribute('aria-expanded', 'true');
      btn.hidden = true;
    });
  })();

  /* -----------------------------------------------------------------
     5. Courtesies
     ----------------------------------------------------------------- */
  var sticky = document.getElementById('sticky-mobile-cta');
  var endPicker = document.querySelector('#pricing .picker');
  if (hasIO && sticky && endPicker) {
    new IntersectionObserver(function (entries) {
      sticky.classList.toggle('is-quiet', entries[0].isIntersecting);
    }, { threshold: 0.15 }).observe(endPicker);
  }
  var video = document.querySelector('.card--video video');
  if (hasIO && video) {
    new IntersectionObserver(function (entries) {
      if (!entries[0].isIntersecting && !video.paused) video.pause();
    }, { threshold: 0.2 }).observe(video);
  }
})();
