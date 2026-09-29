/**
 * Homega sales page (/promo/hmg2/) — section 2b, the build-up chart ("the curve").
 * Ported from promo/hmg2/motion-lab/t1.html (the owner's pick, design E).
 *
 * Plays when the plan bars are on screen (pauses when the chart leaves), stops at
 * day 90 where the 3樽 course ends, holds there long enough to read the verdict,
 * then runs on to day 180: about 5.2 s end to end. Then it holds the finished
 * frame for 5 s and plays again (owner, 29 Sep: "let the animation loop after
 * 5 secs"); the hold only counts while the chart is on screen and the tab is visible.
 * Reduced motion or no IntersectionObserver: the finished chart, no motion, no loop.
 */
(function () {
  'use strict';
  var fig = document.querySelector('[data-t1]');
  if (!fig) return;
  var chart = fig.querySelector('.t1-chart');
  var stage = fig.querySelector('.t1-body');   // the part that moves: plot, months, plans
  var plot = fig.querySelector('.t1-plot');
  var plans = fig.querySelector('[data-t1-plans]');
  var cv = fig.querySelector('[data-t1-cv]');
  var bar3 = fig.querySelector('[data-t1-bar3]');
  var bar6 = fig.querySelector('[data-t1-bar6]');
  var dot = fig.querySelector('[data-t1-dot]');
  var guide = fig.querySelector('[data-t1-guide]');
  var chip = fig.querySelector('[data-t1-chip]');
  var dayEl = fig.querySelector('[data-t1-day]');
  var xrow = fig.querySelector('.t1-x');
  var months = Array.prototype.slice.call(fig.querySelectorAll('.t1-m'));
  // Labels inside the plot that the hairline stops above instead of crossing.
  var keepClear = [fig.querySelector('.t1-bandlab b'), fig.querySelector('.t1-base')];
  var replay = fig.querySelector('[data-t1-replay]');

  var reduced = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  var hasIO = 'IntersectionObserver' in window;

  // Below 900px the page pins a buy bar (about 68px) to the bottom of the screen.
  // That strip counts as off-screen, so the run starts only once the plan bars
  // are above the bar, not hidden behind it.
  var T1_COVER = 84;
  var mqBar = window.matchMedia ? window.matchMedia('(max-width: 899px)') : null;

  // Same schematic as the static path: viewBox 600 x 200, x = days / 180.
  var T = 5.2, P = 2.2, Y0 = 186, Y1 = 32;
  function yAt(days) {
    var m = days / 30;
    var L = m >= T ? 1 : 1 - Math.pow(1 - m / T, P);
    return Y0 - L * (Y0 - Y1);
  }

  // Timeline (ms). Day 0 -> 90 eases out, so the dot moves from the first frame and
  // brakes into the stop; it holds 1.8 s so the 3樽 verdict can be read, then eases
  // in and out to day 180.
  var PRE = 150, RUN1 = 1300, HOLD = 1800, RUN2 = 1300;
  var AT3 = PRE + RUN1, GO2 = AT3 + HOLD, AT6 = GO2 + RUN2;
  var DOT_OFF = AT6 + 180;    // the dot stays under the 180-day marker while that pops in
  var CHIP_OFF = AT6 + 550;   // 「第 180 日」 stays readable, then hands the row back to 「6個月」
  var END = AT6 + 650;
  function easeOut(x) { return 1 - Math.pow(1 - x, 3); }
  function easeInOut(x) { return (1 - Math.cos(Math.PI * x)) / 2; }
  function dayAt(t) {
    if (t <= PRE) return 0;
    if (t < AT3) return 90 * easeOut((t - PRE) / RUN1);
    if (t < GO2) return 90;
    if (t < AT6) return 90 + 90 * easeInOut((t - GO2) / RUN2);
    return 180;
  }

  var elapsed = 0, raf = 0, last = 0, visible = false, done = false, lastDay = -1, g = null;
  var LOOP_HOLD = 5000, loopT = 0;   // the finished frame stays up this long before the replay

  // Layout is read here only (on start, resize, font load), never inside a frame.
  function box(el, ref) {
    var r = el.getBoundingClientRect();
    return { l: r.left - ref.left, r: r.right - ref.left, t: r.top - ref.top };
  }
  function measure() {
    var pr = plot.getBoundingClientRect(), xr = xrow.getBoundingClientRect();
    g = {
      w: pr.width, h: pr.height, chipW: chip.offsetWidth,
      m: months.map(function (m) { return box(m, xr); }),
      clear: keepClear.map(function (el) { return box(el, pr); })
    };
  }

  function render(t) {
    if (!g) measure();
    var d = dayAt(t), f = d / 180;
    var x = f * g.w, y = yAt(d) / 200 * g.h;
    var rest = ((1 - f) * 100).toFixed(2) + '%';
    cv.style.clipPath = 'inset(-6px ' + rest + ' -6px -6px)';
    bar3.style.clipPath = 'inset(0 ' + (100 - Math.min(d, 90) / 0.9).toFixed(2) + '% 0 0 round 7px)';
    bar6.style.clipPath = 'inset(0 ' + rest + ' 0 0 round 7px)';
    var at = 'translate(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px)';
    dot.style.transform = at + ' translate(-50%,-50%)';
    // The hairline runs down to the day counter, but stops above a label in its way.
    var end = g.h + 3;
    for (var k = 0; k < g.clear.length; k++) {
      var b = g.clear[k];
      if (x > b.l - 4 && x < b.r + 4) end = Math.min(end, b.t - 5);
    }
    guide.style.transform = at + ' scaleY(' + (Math.max(0, end - y) / 100).toFixed(4) + ')';
    var day = Math.max(1, Math.round(d));
    if (day !== lastDay) { dayEl.textContent = String(day); lastDay = day; }
    var cx = Math.max(0, Math.min(g.w - g.chipW, x - g.chipW / 2));
    chip.style.transform = 'translateX(' + cx.toFixed(1) + 'px)';
    // A month label the counter is passing over steps aside instead of peeking out.
    var chipOn = t < CHIP_OFF;
    for (var i = 0; i < months.length; i++) {
      var mb = g.m[i];
      months[i].classList.toggle('t1-m--under', chipOn && cx < mb.r + 3 && cx + g.chipW > mb.l - 3);
    }
    var c = chart.classList;
    c.toggle('t1-at3', t >= AT3);
    // The hairline stays off until the dot has cleared the dashed 3樽 line, so
    // the two never run side by side as a double line.
    c.toggle('t1-hold', t >= AT3 && d < 94);
    c.toggle('t1-inband', d >= 120);
    c.toggle('t1-at6', t >= AT6);
    c.toggle('t1-playing', t < DOT_OFF);
    c.toggle('t1-chipon', chipOn);
  }

  function finish() {
    raf = 0; done = true;
    chart.classList.remove('t1-playing', 't1-hold', 't1-chipon');
    chart.classList.add('t1-done');
    cv.style.clipPath = bar3.style.clipPath = bar6.style.clipPath = '';
    months.forEach(function (m) { m.classList.remove('t1-m--under'); });
    replay.classList.remove('t1-wait');
    scheduleLoop();
  }

  // Loop: hold the finished frame, then play again, only while it can be seen.
  function scheduleLoop() {
    if (loopT || !done || !visible || document.hidden) return;
    loopT = setTimeout(function () {
      loopT = 0;
      if (visible && !document.hidden) restart();
    }, LOOP_HOLD);
  }
  function cancelLoop() { clearTimeout(loopT); loopT = 0; }

  // Snap back to the start without animating backwards, then play.
  function restart() {
    stop(); cancelLoop();
    done = false; elapsed = 0; lastDay = -1;
    chart.classList.add('t1-reset');
    chart.classList.remove('t1-done', 't1-at3', 't1-hold', 't1-at6', 't1-inband');
    replay.classList.add('t1-wait');
    render(0);
    void chart.offsetWidth;
    chart.classList.remove('t1-reset');
    start();
  }

  function frame(now) {
    if (!last) last = now;
    elapsed += Math.min(64, now - last); // a dropped frame never skips a beat
    last = now;
    render(elapsed);
    if (elapsed >= END) { finish(); return; }
    raf = requestAnimationFrame(frame);
  }
  function start() {
    if (raf || done || !visible || document.hidden) return;
    last = 0;
    raf = requestAnimationFrame(frame);
  }
  function stop() {
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
  }

  var io = null, seen = null;
  function onSeen(entries) {
    entries.forEach(function (e) {
      if (e.target === plans) seen.plans = e.intersectionRatio;
      else { seen.stage = e.intersectionRatio; seen.h = e.intersectionRect.height; }
      if (e.rootBounds) seen.rootH = e.rootBounds.height;
    });
    // Play once the plan bars are on screen with the curve above them (the race
    // happens in the bars), or, on a screen shorter than the chart, once it fills
    // most of the uncovered screen. Pause once most of it has left.
    var rootH = seen.rootH || window.innerHeight;
    if ((seen.plans >= 0.9 && seen.stage >= 0.9) || seen.h >= rootH * 0.75) {
      visible = true;
      if (done) scheduleLoop(); else start();
    } else if (seen.stage < 0.3) {
      visible = false; stop(); cancelLoop();
    }
  }
  function observe() {
    if (io) io.disconnect();
    seen = { stage: 0, plans: 0, h: 0, rootH: 0 };
    var cover = mqBar && mqBar.matches ? T1_COVER : 0;
    io = new IntersectionObserver(onSeen, {
      rootMargin: '0px 0px -' + cover + 'px 0px',
      threshold: [0, 0.15, 0.3, 0.45, 0.6, 0.75, 0.9, 1]
    });
    io.observe(stage);
    io.observe(plans);
  }

  function init() {
    if (reduced || !hasIO) { chart.classList.add('t1-done'); return; }
    // Keep the replay button's place from the start, so nothing under the chart
    // moves when it appears at the end.
    replay.hidden = false;
    replay.classList.add('t1-wait');
    measure();
    render(0);

    observe();
    // Crossing 900px (a tablet turning, a window resizing) changes what the buy
    // bar covers: observe again with the new margin.
    if (mqBar) {
      if (mqBar.addEventListener) mqBar.addEventListener('change', observe);
      else if (mqBar.addListener) mqBar.addListener(observe);
    }

    document.addEventListener('visibilitychange', function () {
      if (document.hidden) { stop(); cancelLoop(); }
      else if (done) scheduleLoop();
      else start();
    });

    // Widths change on resize and when the web fonts arrive: re-measure, redraw the frame.
    function refit() { measure(); if (!done) render(elapsed); }
    var rz = 0;
    window.addEventListener('resize', function () {
      cancelAnimationFrame(rz);
      rz = requestAnimationFrame(refit);
    });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(refit);

    replay.addEventListener('click', function () {
      visible = true;
      restart();
    });
  }

  try { init(); } catch (e) { chart.classList.add('t1-done'); }
})();
