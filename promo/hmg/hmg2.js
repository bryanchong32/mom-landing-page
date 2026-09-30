/**
 * Homega sales page (/promo/hmg/) — page behaviour.
 * Plain ES5, no dependencies. Loaded after /js/main.js (checkout tracking,
 * ad-tag passthrough, FAQ accordion, sticky bar) and /promo/promo.js
 * (campaign bar). This file never uses the [data-plan] attribute, so
 * promo.js's own picker code finds nothing to touch here.
 *
 * 1. Plan picker — every picker, buy link, box lineup and the sticky bar
 *    stay on the same plan. Buy links change pathname only, so the ad tags
 *    main.js appended to the query string survive a plan change.
 * 2. Reveal-on-view for the few animated figures.
 * 3. Section 2 animation: 鈣質搭地鐵，三樣逐一加上 (ported from motion-lab/m2v2).
 * 4. Endless rows: the customer messages (1b) and the health records (4b)
 *    each run as an endless, swipeable row (no buttons, owner 29 Sep): each
 *    card holds still, then the row glides on to the next (round 8).
 * 5. Certification row: pause on touch (hover is pure CSS).
 * 6. Small courtesies: hide the sticky bar over the bottom picker,
 *    one video at a time, pause a video when it scrolls away.
 * 7. Report viewer: the SGS thumbnails open the full report in a dialog.
 * (The build-up chart in section 2b runs from its own file, t1.js.)
 */
(function () {
  'use strict';

  var reduced = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  var hasIO = 'IntersectionObserver' in window;
  function each(list, fn) { Array.prototype.forEach.call(list, fn); }
  function now() { return (window.performance && performance.now) ? performance.now() : Date.now(); }

  /* -----------------------------------------------------------------
     1. Plan picker
     ----------------------------------------------------------------- */
  var PLANS = {
    '6': { path: '6hmg', checkout: '6box', value: 3000, label: '購買完整療程 · HK$3,000',
           plan: '完整療程 · 6樽', price: 'HK$3,000 · 每日 HK$16.7', nudge: '' },
    '3': { path: '3hmg', checkout: '3box', value: 1650, label: '購買試用裝 · HK$1,650',
           plan: '試用裝 · 3樽', price: 'HK$1,650 · 每日 HK$18.3',
           nudge: '90日退款保證只適用於完整療程。加 HK$1,350 升級至完整療程：多出的 3樽，每樽只需 HK$450。' },
    '1': { path: '1hmg', checkout: '1box', value: 700, label: '購買 1樽 · HK$700',
           plan: '1樽 · 30日', price: 'HK$700 · 每日 HK$23.3',
           nudge: '90日退款保證只適用於完整療程。加 HK$2,300 升級至完整療程：多出的 5樽，每樽只需 HK$460。' }
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

    // The guarantee covers the 6-bottle course only, so the line right above the buy
    // button claims it only then; 「已售出 50,000+ 瓶」 stays, so the line keeps its height
    each(document.querySelectorAll('.trustline'), function (t) {
      each(t.querySelectorAll('a, .trustline__dot'), function (el) { el.hidden = key !== '6'; });
    });

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
      up.textContent = '改選完整療程';
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
     3. Section 2 — 鈣質搭地鐵，三樣逐一加上 (the owner's pick: ported unchanged
        from promo/hmg2/motion-lab/m2v2.html; m2- prefixes, one IIFE).
     ----------------------------------------------------------------- */
  /* m2 v2 · 鈣質搭地鐵，三樣逐一加上 — one IIFE, no dependencies.
     Four beats, each adding one nutrient, then it loops. Each beat is one train
     ("trip"), a fixed choreography rather than a particle simulation, so the eye
     can follow the same four 鈣 passengers from the gate to the bone.
     + Omega-3 and + K2 change nothing at the gates, so those beats start on the
     platform (everyone already seated or already turned away); + D3 keeps its gate
     scene, because the gates are D3's moment.
     A new beat is a new scene: the scene layers fade out, reset while hidden and
     fade back in, so the bone never visibly shrinks back between beats.
     Time drives everything, so pausing (off-screen, hidden tab, the pause button)
     stops the clock. A tapped step plays that beat once and holds on the frame that
     tells its story; the play button carries on with the loop from there. */
  (function () {
    'use strict';

    var root = document.querySelector('[data-m2]');
    if (!root) return;
    var fig = root.querySelector('.m2-fig');
    var svg = fig.querySelector('svg');
    var tablist = root.querySelector('.m2-steps');
    var tabs = [].slice.call(tablist.querySelectorAll('[data-beat]'));
    var playBtn = root.querySelector('.m2-play');
    var status = root.querySelector('.m2-status');
    var reduced = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    var hasIO = 'IntersectionObserver' in window;

    // what each beat has; `add` is the one it brings in. The narration bubble shows
    // `head` in bold on its own line, then `text`; the bubble breaks lines only between
    // phrases, and the no-break spaces keep 「沒有 K2 指路」 in one piece.
    var BEATS = [
      { o3: 0, d3: 0, k2: 0, add: '',   head: '沒有補充：',    text: '行車較慢，能入閘的鈣質也不多。' },
      { o3: 1, d3: 0, k2: 0, add: 'o3', head: '加上 Omega-3：', text: '支持血液流動，行車暢順。' },
      { o3: 1, d3: 1, k2: 0, add: 'd3', head: '加上 D3：',     text: '入閘的鈣質多了，但沒有\u00a0K2\u00a0指路，有些坐過了站。' },
      { o3: 1, d3: 1, k2: 1, add: 'k2', head: '加上 K2：',     text: '有\u00a0K2\u00a0指路，鈣質都在骨骼站下車。' }
    ];
    var NUT = ['o3', 'd3', 'k2'];

    /* Geometry in viewBox units (360 × 380) */
    var LANE = [48, 110];                // centre of each gate lane
    var WIN = [22, 54, 86, 118];         // window centres, from the train's left edge
    var SEAT = [1, 2, 0, 3];             // passenger i sits in window SEAT[i] (lane 0 → windows 1,0; lane 1 → 2,3)
    var DOOR = [0, 1, 1, 0];             // windows 1 and 2 stop right by the way off at 骨骼站
    var CAR_Y = 168, R = 12;
    var Y_FROM = 36, Y_QUEUE = 36, Y_GATE = 62, Y_WAIT = 122;
    var X_IN = -160, X_BOARD = 6, X_STOP = 148, X_OUT = 372, MID = 76;
    var EXIT_X = 224, EXIT_Y = 212;
    var SLOT_X = [188, 212, 236, 260], BONE_X = 224, BONE_Y = 312, BONE_L = 62;
    var FADE = 0.3;                      // seconds a scene takes to fade out, or back in, between beats

    function q(s) { return svg.querySelector(s); }
    function qa(s) { return [].slice.call(svg.querySelectorAll(s)); }
    var riders = qa('.m2-rider');
    var riderC = riders.map(function (g) { return g.querySelector('circle'); });
    var riderT = riders.map(function (g) { return g.querySelector('text'); });
    var train = q('.m2-train'), speed = q('.m2-speed');
    var scene = qa('.m2-scene');
    var lanes = qa('.m2-lane'), lights = qa('.m2-light');
    var bone = q('.m2-bone');
    var shafts = qa('.m2-bs-shaft'), knobs = qa('.m2-bs-k');
    var strong = qa('.m2-b-edge--strong, .m2-b-body--strong');
    var pores = q('.m2-pores');
    var slots = qa('.m2-slot'), fills = qa('.m2-fill');
    var shine = q('.m2-shine'), gloss = q('.m2-gloss');
    var head = q('.m2-head');
    var flows = qa('.m2-flow');
    var exitPath = q('.m2-exit__path');
    var calls = { o3: q('.m2-call--o3'), d3: q('.m2-call--d3'), k2: q('.m2-call--k2') };
    var tagGate = q('.m2-tag--gate'), tagSlow = q('.m2-tag--slow'), tagFast = q('.m2-tag--fast'), tagPast = q('.m2-tag--past');
    var posSlow = q('.m2-tagpos--slow'), posFast = q('.m2-tagpos--fast'), posPast = q('.m2-tagpos--past');
    var TAGS = [tagGate, tagSlow, tagFast, tagPast];
    var progs = tabs.map(function (b) { return b.querySelector('.m2-prog'); });

    function clamp(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
    function lerp(a, b, u) { return a + (b - a) * u; }
    function eOut(u) { return 1 - Math.pow(1 - u, 3); }
    function eIn(u) { return u * u * u; }
    function eInOut(u) { return u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2; }

    /* Cheap DOM writes: only touch an attribute/class when its value changes */
    function attr(el, k, v) { var c = el._m2 || (el._m2 = {}); if (c[k] !== v) { c[k] = v; el.setAttribute(k, v); } }
    function cls(el, k, on) { on = !!on; if (el.classList.contains(k) !== on) el.classList.toggle(k, on); }

    // Before Omega-3 the train pulls away, slows to a crawl mid-line, then goes on: slow, never stopped
    var CRAWL = (function () {
      var n = 60, acc = 0, s = [0], i, u;
      for (i = 1; i <= n; i++) {
        u = (i - 0.5) / n;
        acc += Math.sin(Math.PI * u) * (1 - 0.78 * Math.exp(-Math.pow((u - 0.5) / 0.13, 2)));
        s.push(acc);
      }
      return s.map(function (x) { return x / acc; });
    })();
    function crawl(u) { var f = clamp(u) * 60, i = Math.min(59, Math.floor(f)); return lerp(CRAWL[i], CRAWL[i + 1], f - i); }

    function toDoor(r) { return Math.abs(X_STOP + WIN[SEAT[r]] - EXIT_X); }

    /* ---- one trip = one train: gates, board, ride, get off, leave ---- */
    function plan(b) {
      var m = BEATS[b], i;
      // Omega-3 and K2 change nothing at the gates, so their beats start on the platform:
      // the chip pops, and the train pulls away soon after
      var pre = m.add === 'o3' || m.add === 'k2';
      var p = { b: b, m: m, pre: pre, a0: m.d3 ? 0.4 : 0.45, gap: m.d3 ? 0.35 : 0.4,
                enter: pre ? 0 : m.o3 ? 0.9 : 1.3, travel: m.o3 ? 1.45 : 2.6 };
      // without D3 most gates stay shut: only the first passenger gets in
      p.pass = m.d3 ? [1, 1, 1, 1] : [1, 0, 0, 0];
      // a refused passenger waits at the gate, or queues behind one already refused there
      p.spot = [];
      for (i = 0; i < 4; i++) p.spot[i] = i > 1 && !p.pass[i] && !p.pass[i - 2] ? Y_QUEUE : Y_GATE;
      if (pre) p.depart = 0.8;
      else {
        var seated = 0;
        for (i = 0; i < 4; i++) if (p.pass[i]) seated = Math.max(seated, Math.max(p.a0 + i * p.gap + 0.95, p.enter) + 0.35);
        p.depart = seated + (m.d3 ? 0.3 : 0.55);                  // leaves once the last one in is seated
      }
      p.arrive = p.depart + p.travel;
      // who gets off at 骨骼站: with K2, everyone on board; without it, only those who happen
      // to sit by the way off find it, and the rest ride on past the station (still aboard)
      p.off = []; p.past = 0;
      for (i = 0; i < 4; i++) {
        p.off[i] = p.pass[i] && (m.k2 || DOOR[SEAT[i]]) ? 1 : 0;
        if (p.pass[i] && !p.off[i]) p.past++;
      }
      var order = [];
      for (i = 0; i < 4; i++) if (p.off[i]) order.push(i);
      // off nearest the door first, as on a real train; each takes the next free hole, left to right
      order.sort(function (a, c) { return toDoor(a) - toDoor(c); });
      p.slot = [-1, -1, -1, -1];
      order.forEach(function (r, k) { p.slot[r] = k; });
      p.n = order.length;
      p.step = m.k2 ? 0.28 : 0.3;                                  // one after another through the door
      p.alight0 = p.arrive + (m.k2 ? 0.2 : 0.35);
      var lastOut = p.alight0 + (p.n - 1) * p.step;
      p.landed = lastOut + 0.95;                                   // the last one is in the bone
      p.leave = m.k2 ? lastOut + 0.55 : Math.max(p.arrive + 1.0, lastOut + 0.5);   // pulls away once the door is clear
      p.gone = p.leave + (m.k2 ? 1.1 : p.past ? 1.7 : m.o3 ? 1.4 : 1.6);
      // a beat ends once its result has been seen; after + K2 the full bone and the
      // closing line hold for 4.5 s or more before the loop starts over
      p.end = m.k2 ? p.landed + 5.2 : Math.max(p.landed + 1.2, p.past ? p.gone + 0.3 : p.leave + 1.0);
      // the frame a tapped beat stops on, the one that tells its story best: mid-ride for
      // the slow and the brisk line, the missed stop leaving, the full bone
      p.hold = m.k2 ? p.landed + 1.2 : p.past ? p.leave + 0.9 : p.depart + 0.55 * p.travel;
      return p;
    }

    function trainX(t, p) {
      if (p.enter > 0 && t < p.enter) return lerp(X_IN, X_BOARD, eOut(clamp(t / p.enter)));
      if (t < p.depart) return X_BOARD;
      if (t < p.arrive) { var u = (t - p.depart) / p.travel; return lerp(X_BOARD, X_STOP, p.m.o3 ? eInOut(u) : crawl(u)); }
      if (t < p.leave) return X_STOP;
      return lerp(X_STOP, X_OUT, eIn(clamp((t - p.leave) / (p.gone - p.leave))));
    }

    // a lane's flaps open for each passenger who taps in, then shut again behind them
    function laneOpen(lane, t, p) {
      if (p.pre) return false;
      for (var i = lane; i < 4; i += 2) {
        if (!p.pass[i]) continue;
        var a = p.a0 + i * p.gap;
        if (t > a + 0.45 && t < a + 0.85) return true;
      }
      return false;
    }

    function alightStart(i, p) { return p.alight0 + p.slot[i] * p.step; }

    /* Where passenger i is at trip time t: {x, y, r (radius), ta (label opacity), a (opacity)} */
    function riderAt(i, t, p) {
      var a = p.a0 + i * p.gap, lx = LANE[i % 2], spot = p.spot[i];
      var o = { x: lx, y: Y_FROM, r: R, ta: 1, a: 0 }, u, e, s;
      var away = 1 - clamp((t - (p.end - 0.4)) / 0.4);     // the refused leave with the scene
      if (p.pre) {                                           // the gates part already happened
        if (!p.pass[i]) { o.y = spot; o.a = 0.45 * away; return o; }
      } else {
        if (t < a) return o;
        u = (t - a) / 0.4;                                   // walk up to the gate (or the back of the queue)
        if (u < 1) { o.y = lerp(Y_FROM, spot, eOut(u)); o.a = clamp(u * 2.5); return o; }
        o.a = 1; o.y = spot; s = t - a - 0.4;
        if (!p.pass[i]) {                                    // shut gate: a bump, then wait, greyed out
          if (spot === Y_GATE) o.y = Y_GATE + Math.sin(clamp((s - 0.15) / 0.3) * Math.PI) * 3;
          o.a = (1 - 0.55 * clamp((s - 0.45) / 0.35)) * away;
          return o;
        }
        if (s < 0.15) return o;                              // the tap, then the flaps swing open
        u = (s - 0.15) / 0.4;
        if (u < 1) { o.y = lerp(Y_GATE, Y_WAIT, eInOut(u)); return o; }
        var d0 = Math.max(a + 0.95, p.enter);                // wait on the platform for the train
        o.y = Y_WAIT;
        if (t < d0) return o;
        u = (t - d0) / 0.35;                                 // step into the carriage
        if (u < 1) { e = eInOut(u); o.x = lerp(lx, X_BOARD + WIN[SEAT[i]], e); o.y = lerp(Y_WAIT, CAR_Y, e); return o; }
      }
      o.a = 1;
      if (p.off[i] && t >= alightStart(i, p)) {              // off at 骨骼站
        u = (t - alightStart(i, p)) / 0.95;
        if (u >= 1) { o.a = 0; return o; }                   // now part of the bone (the hole shows it)
        var wx = X_STOP + WIN[SEAT[i]];
        // speed up into the door, ease out into the bone: no pile-up at the exit
        if (u < 0.35) { e = Math.pow(u / 0.35, 2); o.x = lerp(wx, EXIT_X, e); o.y = lerp(CAR_Y, EXIT_Y, e); }
        else {
          e = 1 - Math.pow(1 - (u - 0.35) / 0.65, 2);
          o.x = lerp(EXIT_X, SLOT_X[p.slot[i]], e * e); o.y = lerp(EXIT_Y, BONE_Y, e);   // down the path first, then into the hole
          o.r = lerp(R, 6, e); o.ta = 1 - clamp((e - 0.3) / 0.28);   // label gone before the circle is smaller than it
        }
        return o;
      }
      o.x = trainX(t, p) + WIN[SEAT[i]]; o.y = CAR_Y;        // aboard: rides wherever the train goes
      if (o.x > 360 + R) o.a = 0;
      return o;
    }

    // translate only (no scale): a scaled label makes the browser re-lay out its text every frame
    function putRider(i, o) {
      attr(riders[i], 'transform', 'translate(' + o.x.toFixed(1) + ' ' + o.y.toFixed(1) + ')');
      attr(riders[i], 'opacity', o.a.toFixed(2));
      attr(riderC[i], 'r', o.r.toFixed(1));
      attr(riderT[i], 'opacity', o.ta.toFixed(2));
    }

    function setGates(d3, o0, o1) {
      cls(lanes[0], 'is-open', o0); cls(lanes[1], 'is-open', o1);
      // the middle cabinet serves both lanes: it shows ↓ only when both let people in
      cls(lights[0], 'is-no', !(d3 || o0));
      cls(lights[1], 'is-no', !(d3 || (o0 && o1)));
      cls(lights[2], 'is-no', !(d3 || o1));
    }

    /* ---- the bone (示意): k = how much calcium it holds this beat, 0 → 1 ---- */
    var boneK = -1;
    function shapeBone(k) {
      if (Math.abs(k - boneK) < 0.002) return;
      boneK = k;
      var h = lerp(6, 11.5, k), r = lerp(11, 15, k), dy = lerp(7.5, 10.5, k), kx = BONE_L + r * 0.3, i;
      for (i = 0; i < shafts.length; i++) {
        shafts[i].setAttribute('y', (BONE_Y - h).toFixed(2));
        shafts[i].setAttribute('height', (2 * h).toFixed(2));
      }
      for (i = 0; i < knobs.length; i++) {
        var j = i % 4;
        knobs[i].setAttribute('cx', (BONE_X + (j < 2 ? -kx : kx)).toFixed(2));
        knobs[i].setAttribute('cy', (BONE_Y + (j % 2 ? dy : -dy)).toFixed(2));
        knobs[i].setAttribute('r', r.toFixed(2));
      }
      for (i = 0; i < 4; i++) slots[i].setAttribute('r', lerp(5, 6.5, k).toFixed(2));
      var o = k.toFixed(3);
      strong.forEach(function (el) { el.setAttribute('opacity', o); });
      pores.setAttribute('opacity', (1 - k).toFixed(3));
    }

    /* ---- state ---- */
    var beat = 0, p = plan(0), t = 0, clock = 0;
    var filled = [0, 0, 0, 0], landed = [0, 0, 0, 0], nLanded = 0;
    var fillA = [0, 0, 0, 0], popAt = [-9, -9, -9, -9];
    var boneS = 0, fullAt = -1, glossA = 0;
    var auto = !reduced && hasIO, held = false, userPaused = false;
    var playing = false, raf = 0, last = 0;
    var inView = false, seen = false;

    function selectTab(b) {
      fig.setAttribute('aria-labelledby', 'm2-tab-' + b);
      tabs.forEach(function (el, j) {
        var on = j === b;
        el.setAttribute('aria-selected', on ? 'true' : 'false');
        el.tabIndex = on ? 0 : -1;
        cls(el, 'is-done', j > 0 && j <= b);
      });
      var m = BEATS[b];
      if (status.textContent !== m.head + m.text) {                // no repeat announcements
        var h = document.createElement('b');
        h.textContent = m.head;
        status.textContent = '';
        status.appendChild(h);
        status.appendChild(document.createTextNode(m.text));
      }
      status.setAttribute('data-beat', String(b));
    }

    // a new beat is a new scene: reset all it shows at once (no transitions), while the
    // scene layers are hidden; only the chip just added gets to animate (its pop)
    function setBeat(b) {
      beat = b; p = plan(b); t = 0;
      filled = [0, 0, 0, 0]; landed = [0, 0, 0, 0]; nLanded = 0; fullAt = -1;
      boneS = 0; fillA = [0, 0, 0, 0]; glossA = 0;
      var m = BEATS[b];
      cls(fig, 'is-snap', true);
      TAGS.forEach(function (tg) { cls(tg, 'is-on', false); });
      cls(head, 'is-on', false); cls(bone, 'is-full', false);
      fills.forEach(function (el) { attr(el, 'opacity', '0'); });
      NUT.forEach(function (n) { cls(calls[n], 'is-on', m[n]); cls(calls[n], 'is-new', false); });
      fig.setAttribute('data-beat', String(b));
      selectTab(b);
      fig.getBoundingClientRect();                       // commit the reset before transitions come back
      cls(fig, 'is-snap', false);
      if (m.add && !reduced) cls(calls[m.add], 'is-new', true);
    }

    function draw(dt) {
      var m = p.m, i, k;
      // the scene fades in as a beat starts and, in the loop, out as it ends
      var sa = Math.min(clamp(t / FADE), auto ? clamp((p.end - t) / FADE) : 1);
      var sas = sa > 0.995 ? '1' : sa.toFixed(2);
      for (i = 0; i < scene.length; i++) attr(scene[i], 'opacity', sas);

      var tx = trainX(t, p);
      attr(train, 'transform', 'translate(' + tx.toFixed(1) + ' 0)');
      // with Omega-3 the train runs briskly: short streaks behind it while it moves fast
      var v = m.o3 ? Math.abs(trainX(t + 0.03, p) - trainX(t - 0.03, p)) / 0.06 : 0;
      attr(speed, 'transform', 'translate(' + tx.toFixed(1) + ' 0)');
      attr(speed, 'opacity', (0.75 * clamp((v - 80) / 160)).toFixed(2));

      for (i = 0; i < 4; i++) {
        putRider(i, riderAt(i, t, p));
        if (p.off[i] && !landed[i] && t >= alightStart(i, p) + 0.95) {
          landed[i] = 1; nLanded++; k = p.slot[i]; filled[k] = 1; popAt[k] = clock;
          if (m.k2 && nLanded === p.n) fullAt = clock;
        }
      }
      for (k = 0; k < 4; k++) {
        fillA[k] += (filled[k] - fillA[k]) * Math.min(1, dt * (filled[k] ? 18 : 6));
        attr(fills[k], 'opacity', fillA[k] < 0.01 ? '0' : fillA[k].toFixed(2));
        attr(fills[k], 'r', (6 + 2.5 * (1 - clamp((clock - popAt[k]) / 0.3))).toFixed(2));   // a small pop on arrival
      }

      // the bone fills out with each 鈣 that arrives; with all three, it is full
      var goal = nLanded / 4;
      boneS += (goal - boneS) * Math.min(1, dt * 4.5);
      shapeBone(boneS < 0.002 ? 0 : boneS > 0.998 ? 1 : boneS);
      var full = fullAt >= 0, f = full ? clock - fullAt : -1;
      glossA += ((full ? 1 : 0) - glossA) * Math.min(1, dt * 5);
      attr(gloss, 'opacity', glossA.toFixed(2));
      var sw = clamp((f - 0.2) / 0.9);                       // one sweep of light across it
      attr(shine, 'opacity', full && sw > 0 && sw < 1 ? '1' : '0');
      if (full) attr(shine, 'transform', 'translate(' + lerp(150, 330, eInOut(sw)).toFixed(1) + ' 0)');
      var pu = f / 0.6;                                      // and one soft pulse; then the holes merge into it (CSS)
      attr(bone, 'transform', full && pu < 1
        ? 'translate(' + BONE_X + ' ' + BONE_Y + ') scale(' + (1 + 0.06 * Math.sin(pu * Math.PI)).toFixed(3) + ') translate(-' + BONE_X + ' -' + BONE_Y + ')'
        : 'translate(0 0)');
      cls(bone, 'is-full', full);
      cls(head, 'is-on', full && f > 0.35);

      setGates(m.d3, laneOpen(0, t, p), laneOpen(1, t, p));

      // Omega-3: the lining along the vessel walls flows with the line
      if (m.o3) {
        var off = (-(clock * 40) % 36).toFixed(1);
        attr(flows[0], 'stroke-dashoffset', off); attr(flows[1], 'stroke-dashoffset', off);
      }

      // spotlight the added nutrient whose step is happening now
      var live = !p.pre && t > p.a0 + 0.3 && t < p.depart ? 'd3' : t >= p.depart && t < p.arrive ? 'o3' : t >= p.arrive && t < p.leave ? 'k2' : '';
      NUT.forEach(function (n) { cls(calls[n], 'is-live', live === n && m[n]); });
      attr(exitPath, 'stroke-dashoffset', live === 'k2' && m.k2 ? (-(clock * 30) % 10).toFixed(1) : '0');

      // one bubble at a time: the gates, then the ride, then the stop
      cls(tagGate, 'is-on', !m.d3 && !p.pre && t > p.a0 + p.gap + 0.55 && t < p.depart + 0.4);
      var rideX = Math.max(46, Math.min(314, tx + MID)).toFixed(1);
      var slowOn = !m.o3 && t > p.depart + 0.45 && t < p.arrive + 0.3;
      if (slowOn) attr(posSlow, 'transform', 'translate(' + rideX + ' 0)');
      cls(tagSlow, 'is-on', slowOn);
      var fastOn = m.add === 'o3' && t > p.depart - 0.2 && t < p.arrive + 0.5;   // Omega-3's own words ride along
      if (fastOn) attr(posFast, 'transform', 'translate(' + rideX + ' 0)');
      cls(tagFast, 'is-on', fastOn);
      // the missed stop: the bubble belongs to the train with the two still aboard, so it
      // leaves the picture with them and is gone once the train is
      var pastOn = p.past > 0 && t >= p.leave - 0.2 && t < p.gone;
      if (pastOn) attr(posPast, 'transform', 'translate(' + Math.max(46, tx + MID).toFixed(1) + ' 0)');
      cls(tagPast, 'is-on', pastOn);

      for (k = 0; k < tabs.length; k++) {
        var pv = k === beat ? clamp(t / (auto ? p.end : p.hold)) : 0;
        if (progs[k]._v !== pv) { progs[k]._v = pv; progs[k].style.transform = 'scaleX(' + pv.toFixed(3) + ')'; }
      }
    }

    function frame(now) {
      raf = 0;
      var dt = last ? Math.min(0.05, (now - last) / 1000) : 0.016;
      last = now; clock += dt; t += dt;
      if (auto && t >= p.end) setBeat((beat + 1) % BEATS.length);   // next beat; after + K2, start over
      else if (!auto && t >= p.hold) { t = p.hold; freeze(); return; }
      draw(dt);
      raf = requestAnimationFrame(frame);
    }
    function freeze() { held = true; draw(1); pause(); showPlay(); }
    function play() { if (playing) return; playing = true; last = 0; raf = requestAnimationFrame(frame); }
    function pause() { playing = false; if (raf) cancelAnimationFrame(raf); raf = 0; }
    function sync() { if (inView && seen && !held && !userPaused && !document.hidden) play(); else pause(); }
    function showPlay() {
      var stopped = held || userPaused;
      cls(playBtn, 'is-paused', stopped);
      playBtn.setAttribute('aria-label', stopped ? '播放動畫' : '暫停動畫');
    }

    /* ---- reduced motion (or no IntersectionObserver): one clear still per beat ---- */
    var STILL = [
      // train x · riders [x, y, opacity] × 4 · calcium in the bone · streaks · which bubble
      { train: 64,  riders: [[64 + WIN[1], CAR_Y, 1], [LANE[1], Y_GATE, 0.45], [LANE[0], Y_GATE, 0.45], [LANE[1], Y_QUEUE, 0.45]], fill: 0, tag: tagSlow },
      { train: 112, riders: [[112 + WIN[1], CAR_Y, 1], [LANE[1], Y_GATE, 0.45], [LANE[0], Y_GATE, 0.45], [LANE[1], Y_QUEUE, 0.45]], fill: 0, speed: 0.75, tag: tagFast },
      { train: 205, riders: [[0, 0, 0], [0, 0, 0], [205 + WIN[0], CAR_Y, 1], [205 + WIN[3], CAR_Y, 1]], fill: 2, tag: tagPast },
      { train: X_STOP, riders: [[0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0]], fill: 4, full: 1 }
    ];
    function still(b) {
      var s = STILL[b], m = BEATS[b], i;
      setBeat(b);
      scene.forEach(function (el) { attr(el, 'opacity', '1'); });
      attr(train, 'transform', 'translate(' + s.train + ' 0)');
      attr(speed, 'transform', 'translate(' + s.train + ' 0)');
      attr(speed, 'opacity', String(s.speed || 0));
      for (i = 0; i < 4; i++) {
        var r = s.riders[i];
        putRider(i, { x: r[0], y: r[1], r: R, ta: 1, a: r[2] });
        attr(fills[i], 'opacity', i < s.fill ? '1' : '0'); attr(fills[i], 'r', '6');
      }
      nLanded = s.fill; boneS = s.fill / 4; shapeBone(boneS);
      attr(gloss, 'opacity', s.full ? '1' : '0'); attr(shine, 'opacity', '0');
      attr(bone, 'transform', 'translate(0 0)');
      cls(bone, 'is-full', !!s.full); cls(head, 'is-on', !!s.full);
      setGates(m.d3, false, false);
      var pos = s.tag === tagSlow ? posSlow : s.tag === tagFast ? posFast : s.tag === tagPast ? posPast : null;
      if (pos) attr(pos, 'transform', 'translate(' + Math.min(314, s.train + MID) + ' 0)');
      TAGS.forEach(function (tg) { cls(tg, 'is-on', tg === s.tag); });
      NUT.forEach(function (n) { cls(calls[n], 'is-live', false); });
      progs.forEach(function (pr) { pr.style.transform = 'scaleX(0)'; });
    }

    /* ---- steps (a vertical stack beside the bubble): tap one to stop the loop and
       watch that beat once; the arrow keys move along the stack either way ---- */
    function choose(b) {
      auto = false; userPaused = false; held = false; seen = true;
      status.setAttribute('aria-live', 'polite');
      if (reduced || !hasIO) { still(b); return; }
      setBeat(b);                                        // straight to the new scene, which fades in
      draw(0.016);
      showPlay(); sync();
    }
    tabs.forEach(function (el, j) {
      el.addEventListener('click', function () { choose(j); });
      el.addEventListener('keydown', function (e) {
        var n = tabs.length;
        var k = e.key;
        var to = k === 'ArrowDown' || k === 'ArrowRight' ? (j + 1) % n
          : k === 'ArrowUp' || k === 'ArrowLeft' ? (j + n - 1) % n
          : k === 'Home' ? 0 : k === 'End' ? n - 1 : -1;
        if (to < 0) return;
        e.preventDefault();
        tabs[to].focus();
        choose(to);
      });
    });
    // a keyboard user on the steps keeps the selection: the loop stops (this beat finishes, then holds)
    tablist.addEventListener('focusin', function () {
      if (!auto) return;
      auto = false; p.hold = Math.max(p.hold, t);
    });

    // pause / play: pause freezes the frame; play carries on (after a held beat, with the next one)
    playBtn.addEventListener('click', function () {
      status.setAttribute('aria-live', 'polite');
      if (held) { held = false; userPaused = false; auto = true; seen = true; setBeat((beat + 1) % BEATS.length); }
      else if (userPaused) { userPaused = false; seen = true; }
      else userPaused = true;
      showPlay(); sync();
    });

    /* Chips fit their text once the real fonts are in */
    function fitChips() {
      NUT.forEach(function (n) {
        var g = calls[n];
        var txt = g.querySelector('.m2-chip__t'), chip = g.querySelector('.m2-chip'), ring = g.querySelector('.m2-ring');
        var w = Math.ceil(txt.getComputedTextLength()) + 24;
        var x0 = +g.getAttribute('data-x');
        var left = g.getAttribute('data-anchor') === 'end' ? x0 - w : x0;
        chip.setAttribute('x', left); chip.setAttribute('width', w);
        ring.setAttribute('x', left - 3); ring.setAttribute('width', w + 6);
        txt.setAttribute('x', left + w / 2);
      });
    }
    fitChips();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitChips);

    if (reduced || !hasIO) { playBtn.hidden = true; still(BEATS.length - 1); return; }   // the finished picture: all three in

    // Warm start: beat 1, the first passenger already at the gate, the train pulling in
    setBeat(0); t = 0.7; draw(1);
    showPlay();

    // Play only once the reader is really looking (60% of the graphic on screen);
    // keep playing while any of it shows; start over that rule once it has left the screen.
    new IntersectionObserver(function (entries) {
      var e = entries[entries.length - 1];
      inView = e.isIntersecting;
      if (!inView) seen = false;
      else {
        var vh = e.rootBounds ? e.rootBounds.height : window.innerHeight;
        if (e.intersectionRatio >= 0.6 || e.intersectionRect.height >= 0.6 * vh) seen = true;
      }
      sync();
    }, { threshold: [0, 0.2, 0.4, 0.6, 0.8, 1] }).observe(svg);
    document.addEventListener('visibilitychange', sync);
  })();

  /* -----------------------------------------------------------------
     4. Endless rows — every [data-reel]: the customer messages (section 1b,
        right under the plans) and the health-record slips (4b). Hold, then
        glide (round 8): each card sits still for 6 s, then the row glides
        in 0.45 s (the page's --ease curve, no bounce) until the next card's
        left edge is where this one's was, and holds again. Cards may differ
        in width, so every glide is measured to land on a card edge. The row
        starts on its first card (for the messages, a 已購用家 one) and only
        starts counting once half of it is on screen, so the reader meets
        that card first.
        Layout: [copy][real cards][copy…]; the copies are aria-hidden + inert.
        A glide is a transform on the track (smooth sub-pixel motion). When
        it ends, or the moment a visitor touches, hovers, focuses or presses a
        button, it is folded into the real scroll position, so native swiping
        takes over from exactly where it was. Crossing a copy boundary shifts
        the scroll by one set width, which shows identical content: no
        visible jump. After a swipe the row may rest between two cards; the
        next glide goes on to the nearest card edge ahead.
        prefers-reduced-motion (or no IntersectionObserver): no copies,
        no motion — a plain row that snaps card by card.
     ----------------------------------------------------------------- */
  // The page's --ease curve, cubic-bezier(0.2, 0.75, 0.2, 1), for the glide (the
  // same maths browsers use for CSS: Newton's method, bisection as the fallback)
  function bezier(x1, y1, x2, y2) {
    var cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx;
    var cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
    function sx(t) { return ((ax * t + bx) * t + cx) * t; }
    function sy(t) { return ((ay * t + by) * t + cy) * t; }
    function dsx(t) { return (3 * ax * t + 2 * bx) * t + cx; }
    return function (x) {
      if (x <= 0) return 0;
      if (x >= 1) return 1;
      var t = x, i, e, d;
      for (i = 0; i < 8; i++) {
        e = sx(t) - x;
        if (Math.abs(e) < 1e-6) return sy(t);
        d = dsx(t);
        if (Math.abs(d) < 1e-6) break;
        t -= e / d;
      }
      var lo = 0, hi = 1;
      t = x;
      for (i = 0; i < 30; i++) {
        e = sx(t) - x;
        if (Math.abs(e) < 1e-6) break;
        if (e < 0) lo = t; else hi = t;
        t = (lo + hi) / 2;
      }
      return sy(t);
    };
  }
  var glideEase = bezier(0.2, 0.75, 0.2, 1);

  each(document.querySelectorAll('[data-reel]'), function reel(root) {
    var view = root.querySelector('[data-reel-view]');
    var track = root.querySelector('[data-reel-track]');
    var originals = Array.prototype.slice.call(track.children);
    var n = originals.length;
    if (!n) return;

    var HOLD = 6000;         // ms each card stays still: long enough to read it
    var GLIDE = 450;         // ms to glide on to the next card
    var AFTER_SWIPE = 2500;  // ms of rest after a swipe, before the usual hold
    var AFTER_TAP = 7000;    // ms of rest after a tap: someone is reading that card

    var loop = !reduced && hasIO && !!window.requestAnimationFrame;
    var setW = 0, tx = 0, holdUntil = 0, glide = null;
    var hovering = false, focused = false, touching = false, visible = false;

    // No glide before this rest is over and a full hold has followed it
    function rest(ms) { holdUntil = Math.max(holdUntil, now() + ms + HOLD); }

    function place(x) {
      tx = x;
      track.style.transform = x ? 'translate3d(' + (-x).toFixed(2) + 'px,0,0)' : '';
    }
    // Fold the glide into the real scroll position (native scrolling continues from here);
    // past the real set, step back one set width (identical content: no visible jump)
    function commit() {
      glide = null;
      if (!tx) return;
      var target = view.scrollLeft + tx;
      if (setW && target >= setW * 2) target -= setW;
      place(0);
      view.scrollLeft = target;
    }
    // Keep the scroll position inside the middle band; content there is identical one set away
    function recentre() {
      if (!loop || !setW) return;
      var x = view.scrollLeft;
      if (x >= setW * 2) view.scrollLeft = x - setW;
      else if (x < setW * 0.5) view.scrollLeft = x + setW;
    }

    if (!loop) return; // static row (reduced motion / old browsers)

    function copySet() {
      var frag = document.createDocumentFragment();
      originals.forEach(function (card) {
        var c = card.cloneNode(true);
        c.setAttribute('aria-hidden', 'true');
        c.setAttribute('inert', '');
        c.classList.add('is-copy');
        frag.appendChild(c);
      });
      return frag;
    }
    track.insertBefore(copySet(), originals[0]);
    track.appendChild(copySet());
    root.classList.add('is-loop');

    // Where each card sits, as the scroll position that puts its left edge where the
    // first real card starts (scrollLeft = setW). Measured, so cards may differ in width.
    function edges() {
      var kids = track.children, x0 = kids[0].getBoundingClientRect().left, out = [], i;
      for (i = 0; i < kids.length; i++) out.push(kids[i].getBoundingClientRect().left - x0);
      return out;
    }
    var widest = 0, lastW = 0;
    function measure() {
      setW = originals[0].offsetLeft - track.children[0].offsetLeft;
      widest = 0;
      for (var i = 0; i < n; i++) {
        var next = i + 1 < n ? originals[i + 1].offsetLeft : originals[0].offsetLeft + setW;
        widest = Math.max(widest, next - originals[i].offsetLeft);
      }
      lastW = view.clientWidth;
    }
    // Enough copies after the real set to fill the screen from any point in the middle
    // band, plus one card for a glide that is under way (a short set, like the four
    // record slips on a wide desktop, needs more than one copy)
    function fill() {
      var after = track.children.length / n - 2;
      while (setW && after * setW < view.clientWidth + widest) { track.appendChild(copySet()); after++; }
    }
    measure(); fill();
    view.scrollLeft = setW; // first real card where the row starts

    function running() {
      return visible && !hovering && !focused && !touching && !document.hidden;
    }

    // The next glide: from wherever the row is, on to the nearest card edge ahead
    function beginGlide() {
      var pos = view.scrollLeft + tx, e = edges(), i;
      for (i = 0; i < e.length; i++) if (e[i] > pos + 1) break;
      if (i < e.length) glide = { t0: now(), from: tx, d: e[i] - pos };
    }

    var raf = 0;
    function frame() {
      raf = requestAnimationFrame(frame);
      if (!running()) { if (glide || tx) commit(); return; }
      var t = now();
      if (!glide) {
        if (t < holdUntil) return;
        beginGlide();
        if (!glide) { holdUntil = t + HOLD; return; }
      }
      var u = (t - glide.t0) / GLIDE;
      if (u >= 1) { place(glide.from + glide.d); commit(); holdUntil = t + HOLD; return; }
      place(glide.from + glide.d * glideEase(u));
    }
    function start() { if (!raf) raf = requestAnimationFrame(frame); }
    function stop() { if (raf) cancelAnimationFrame(raf); raf = 0; commit(); }

    var met = false;
    new IntersectionObserver(function (entries) {
      var e = entries[entries.length - 1];
      if (!e.isIntersecting) { visible = false; stop(); return; }
      if (e.intersectionRatio < 0.5) return;               // keeps going while it leaves
      if (!met) { met = true; commit(); measure(); view.scrollLeft = setW; }   // first look: the first card
      if (!visible) rest(0);                               // back on screen: a full hold first
      visible = true; start();
    }, { threshold: [0, 0.5] }).observe(view);
    // Back from another tab: a full hold before the next glide
    document.addEventListener('visibilitychange', function () { if (!document.hidden) rest(0); });

    // Hover pauses, for a real mouse only: phones fire emulated mouse events on a tap
    // and would otherwise leave the row "hovered" (paused) until the next tap elsewhere.
    function isMouse(e) { return !e.pointerType || e.pointerType === 'mouse'; }
    view.addEventListener('pointerenter', function (e) { if (isMouse(e)) { hovering = true; commit(); } });
    view.addEventListener('pointerleave', function (e) { if (isMouse(e) && hovering) { hovering = false; rest(0); } });

    // Touch: pause while the finger is down; a tap (little movement) rests longer
    var tStart = null, moved = false;
    view.addEventListener('touchstart', function (e) {
      touching = true; met = true; commit();
      var p = e.touches[0]; tStart = { x: p.clientX, y: p.clientY }; moved = false;
    }, { passive: true });
    view.addEventListener('touchmove', function (e) {
      if (!tStart) return;
      var p = e.touches[0];
      if (Math.abs(p.clientX - tStart.x) > 8 || Math.abs(p.clientY - tStart.y) > 8) moved = true;
    }, { passive: true });
    function touchEnd() { touching = false; tStart = null; rest(moved ? AFTER_SWIPE : AFTER_TAP); }
    view.addEventListener('touchend', touchEnd, { passive: true });
    view.addEventListener('touchcancel', touchEnd, { passive: true });

    // Mouse click on a card = reading it
    view.addEventListener('pointerdown', function (e) { met = true; if (isMouse(e)) { commit(); rest(AFTER_TAP); } });
    // Keyboard focus pauses until focus leaves the row. Focus from a tap or click
    // (the row is focusable) is not :focus-visible and must not pause it for good.
    function keyboardFocus(el) { try { return el.matches(':focus-visible'); } catch (err) { return true; } }
    view.addEventListener('focusin', function (e) { if (keyboardFocus(e.target)) { focused = true; commit(); } });
    view.addEventListener('focusout', function () { if (focused) { focused = false; rest(AFTER_SWIPE); } });
    // Trackpad / wheel scrolling
    view.addEventListener('wheel', function () { met = true; commit(); rest(AFTER_SWIPE); }, { passive: true });

    // After any scroll settles (swipe momentum, a glide folded in), keep inside the middle band
    var settle = 0;
    view.addEventListener('scroll', function () {
      clearTimeout(settle);
      settle = setTimeout(function () { if (!touching && !tx) recentre(); }, 160);
    }, { passive: true });

    // Card widths change at breakpoints: keep the same card in view. Height-only resizes
    // (a phone's toolbar showing or hiding) change nothing here.
    var rt = 0;
    window.addEventListener('resize', function () {
      clearTimeout(rt);
      rt = setTimeout(function () {
        if (view.clientWidth === lastW) return;
        commit();
        var e = edges(), pos = view.scrollLeft, k = 0, i;
        for (i = 1; i < e.length; i++) if (Math.abs(e[i] - pos) < Math.abs(e[k] - pos)) k = i;
        measure(); fill();
        view.scrollLeft = edges()[k];
        recentre();
      }, 150);
    });
  });

  /* -----------------------------------------------------------------
     5. Certification row — hover pauses in CSS; touch pauses here
     ----------------------------------------------------------------- */
  each(document.querySelectorAll('[data-loop]'), function (el) {
    var t = 0;
    el.addEventListener('touchstart', function () { clearTimeout(t); el.classList.add('is-paused'); }, { passive: true });
    function resume() { clearTimeout(t); t = setTimeout(function () { el.classList.remove('is-paused'); }, 2500); }
    el.addEventListener('touchend', resume, { passive: true });
    el.addEventListener('touchcancel', resume, { passive: true });
  });

  /* -----------------------------------------------------------------
     6. Courtesies
     ----------------------------------------------------------------- */
  var sticky = document.getElementById('sticky-mobile-cta');
  var endPicker = document.querySelector('#pricing .picker');
  if (hasIO && sticky && endPicker) {
    new IntersectionObserver(function (entries) {
      sticky.classList.toggle('is-quiet', entries[0].isIntersecting);
    }, { threshold: 0.15 }).observe(endPicker);
  }
  var videos = document.querySelectorAll('.talk video');
  each(videos, function (v) {
    // one voice at a time
    v.addEventListener('play', function () {
      each(videos, function (o) { if (o !== v && !o.paused) o.pause(); });
    });
    if (hasIO) {
      new IntersectionObserver(function (entries) {
        if (!entries[0].isIntersecting && !v.paused) v.pause();
      }, { threshold: 0.2 }).observe(v);
    }
  });

  /* -----------------------------------------------------------------
     7. Report viewer — each SGS thumbnail (section 3a) opens the full
        report in a <dialog>, fitted to the screen. Tap the report to see it
        at its real size and pan around (a pinch zooms too); ‹ ›, the arrow
        keys or a sideways swipe go to the next report. ✕, Esc or a tap
        beside the report closes it; focus goes back to the thumbnail and
        the page behind does not scroll. Without <dialog> support the link
        simply opens the image in this tab.
     ----------------------------------------------------------------- */
  (function viewer() {
    var dlg = document.getElementById('report-viewer');
    var links = Array.prototype.slice.call(document.querySelectorAll('a[data-report]'));
    if (!dlg || !links.length || typeof dlg.showModal !== 'function') return;
    var stage = dlg.querySelector('[data-rv-stage]');
    var img = dlg.querySelector('[data-rv-img]');
    var title = dlg.querySelector('#rv-title');
    var meta = dlg.querySelector('[data-rv-meta]');
    var count = dlg.querySelector('[data-rv-count]');
    var hint = dlg.querySelector('[data-rv-hint]');
    var AR = 2000 / 1616;                 // every report image has this shape (thumbnails too)
    var cur = 0, opener = null, zoomed = false, token = 0;

    function thumbSrc(a) { var t = a.querySelector('img'); return t ? (t.currentSrc || t.src) : ''; }

    // Where the report actually shows inside the image box (the box is letterboxed)
    function shown() {
      var r = img.getBoundingClientRect(), w = r.width, h = r.height;
      if (w / h > AR) w = h * AR; else h = w / AR;
      return { left: r.left + (r.width - w) / 2, top: r.top + (r.height - h) / 2, width: w, height: h };
    }

    function setZoom(on, fx, fy) {
      zoomed = on;
      dlg.classList.toggle('is-zoom', on);
      hint.textContent = on ? '再點按一下，縮回原來大小' : '點按報告可放大';
      if (on) {                           // keep the tapped spot in the middle of the screen
        stage.scrollLeft = fx * img.offsetWidth - stage.clientWidth / 2;
        stage.scrollTop = fy * img.offsetHeight - stage.clientHeight / 2;
      } else { stage.scrollLeft = 0; stage.scrollTop = 0; }
    }

    function show(i) {
      cur = (i + links.length) % links.length;
      var a = links[cur], my = ++token, full = a.href;
      setZoom(false);
      title.textContent = a.getAttribute('data-title');
      meta.textContent = '';                // each part (source · month · report number) stays whole
      a.getAttribute('data-meta').split(' · ').forEach(function (part, k) {
        if (k) meta.appendChild(document.createTextNode(' · '));
        var sp = document.createElement('span'); sp.textContent = part; meta.appendChild(sp);
      });
      count.textContent = (cur + 1) + ' / ' + links.length;
      img.alt = 'SGS 測試報告：' + a.getAttribute('data-title');
      // the thumbnail (already loaded) shows at once; the full report takes its place when ready
      img.src = thumbSrc(a) || full;
      var pre = new Image();
      pre.onload = function () {
        if (my !== token) return;
        img.src = full;
        var next = new Image(); next.src = links[(cur + 1) % links.length].href;   // warm the next one
      };
      pre.src = full;
    }

    function open(i, from) {
      opener = from;
      show(i);
      document.documentElement.classList.add('rv-lock');
      dlg.showModal();
    }

    links.forEach(function (a, i) {
      a.addEventListener('click', function (e) {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button > 0) return;   // "open in new tab" still works
        e.preventDefault();
        open(i, a);
      });
    });

    dlg.addEventListener('close', function () {
      document.documentElement.classList.remove('rv-lock');
      setZoom(false);
      if (opener) { try { opener.focus({ preventScroll: true }); } catch (err) { opener.focus(); } }
    });
    dlg.querySelector('[data-rv-close]').addEventListener('click', function () { dlg.close(); });
    dlg.querySelector('[data-rv-prev]').addEventListener('click', function () { show(cur - 1); });
    dlg.querySelector('[data-rv-next]').addEventListener('click', function () { show(cur + 1); });
    dlg.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { e.preventDefault(); show(cur + 1); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); show(cur - 1); }
    });

    // A tap on the report zooms in (or back out); a tap beside it closes the viewer
    stage.addEventListener('click', function (e) {
      if (zoomed) { setZoom(false); return; }
      var s = shown();
      var fx = (e.clientX - s.left) / s.width, fy = (e.clientY - s.top) / s.height;
      if (fx < 0 || fx > 1 || fy < 0 || fy > 1) { dlg.close(); return; }
      setZoom(true, fx, fy);
    });

    // A sideways swipe on the fitted report: next / previous. Not while zoomed (the finger
    // is panning then), not with two fingers (a pinch), not while the page is pinched in.
    var sx = 0, sy = 0, st = 0, multi = false;
    stage.addEventListener('touchstart', function (e) {
      multi = e.touches.length > 1;
      sx = e.touches[0].clientX; sy = e.touches[0].clientY; st = now();
    }, { passive: true });
    stage.addEventListener('touchmove', function (e) { if (e.touches.length > 1) multi = true; }, { passive: true });
    stage.addEventListener('touchend', function (e) {
      if (multi || zoomed || e.touches.length) return;
      if (window.visualViewport && window.visualViewport.scale > 1.05) return;
      var t = e.changedTouches[0], dx = t.clientX - sx, dy = t.clientY - sy;
      if (Math.abs(dx) > 50 && Math.abs(dx) > 1.5 * Math.abs(dy) && now() - st < 800) show(cur + (dx < 0 ? 1 : -1));
    }, { passive: true });
  })();

})();
