/**
 * Promo pages — campaign bar + plan picker. (Checkout click tracking lives in js/main.js.)
 * Plain ES5, no dependencies. Loaded after js/main.js (header, FAQ, carousel, sticky CTA).
 *
 * Campaign bar contract (promo/campaign.json):
 *   active      boolean  — must be exactly true
 *   headline    string   — bar title
 *   offer_line  string   — one line describing the real offer
 *   starts_at   ISO date — optional; bar hidden before this
 *   ends_at     ISO date — required; bar hidden at/after this
 *   cta_label / cta_href — optional button
 * Failure mode is always HIDDEN — never a stale timer.
 */
(function () {
  'use strict';

  /* -----------------------------------------------------------------
     1. Campaign bar
     ----------------------------------------------------------------- */
  var bar = document.getElementById('campaign-bar');
  var note = document.getElementById('campaign-pricing-note');

  function hideAll() {
    if (bar) bar.hidden = true;
    if (note) note.hidden = true;
  }

  function pad(n) { return n < 10 ? '0' + n : '' + n; }

  function renderCampaign(c) {
    var end = new Date(c.ends_at);
    if (isNaN(end.getTime())) return hideAll();
    if (c.starts_at) {
      var start = new Date(c.starts_at);
      if (!isNaN(start.getTime()) && Date.now() < start.getTime()) return hideAll();
    }
    if (Date.now() >= end.getTime()) return hideAll();

    var headline = bar.querySelector('[data-campaign="headline"]');
    var offer = bar.querySelector('[data-campaign="offer"]');
    var timer = bar.querySelector('[data-campaign="timer"]');
    var cta = bar.querySelector('[data-campaign="cta"]');

    headline.textContent = String(c.headline);
    offer.textContent = c.offer_line ? String(c.offer_line) : '';
    if (c.cta_label && c.cta_href && /^(#|\/|https:\/\/(store\.)?tigroxglobal\.com)/.test(String(c.cta_href))) {
      cta.textContent = String(c.cta_label);
      cta.setAttribute('href', String(c.cta_href));
      cta.hidden = false;
    } else {
      cta.hidden = true;
    }

    var noteText = note ? note.querySelector('[data-campaign="note-text"]') : null;
    var noteTimer = note ? note.querySelector('[data-campaign="note-timer"]') : null;
    if (noteText) noteText.textContent = String(c.headline) + (c.offer_line ? ' — ' + String(c.offer_line) : '');

    function tick() {
      var ms = end.getTime() - Date.now();
      if (ms <= 0) { hideAll(); clearInterval(handle); return; }
      var d = Math.floor(ms / 86400000);
      var h = Math.floor((ms % 86400000) / 3600000);
      var m = Math.floor((ms % 3600000) / 60000);
      var s = Math.floor((ms % 60000) / 1000);
      var text = (d > 0 ? d + '日 ' : '') + pad(h) + ':' + pad(m) + ':' + pad(s);
      timer.textContent = text;
      if (noteTimer) noteTimer.textContent = text;
    }
    tick();
    var handle = setInterval(tick, 1000);
    bar.hidden = false;
    if (note) note.hidden = false;
  }

  if (bar && window.fetch) {
    fetch('../campaign.json', { cache: 'no-store' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (c) {
        if (!c || c.active !== true || !c.ends_at || !c.headline) return hideAll();
        renderCampaign(c);
      })
      .catch(hideAll);
  } else {
    hideAll();
  }

  /* -----------------------------------------------------------------
     2. Plan picker
     Every picker on the page stays in sync. The buy button keeps its
     query string (ad tags added by js/main.js) when its store path changes.
     Prices are the fixed programme prices; nudges state the true
     cost per extra box of upgrading to 6.
     ----------------------------------------------------------------- */
  var PLANS = {
    '6': { path: '6hmg', checkout: '6box', value: 3000, label: '選購 6盒 · HK$3,000', nudge: '' },
    '3': { path: '3hmg', checkout: '3box', value: 1650, label: '選購 3盒 · HK$1,650',
           nudge: '多付 HK$1,350 升級至 6盒：多 90 日，每盒只需 HK$450。' },
    '1': { path: '1hmg', checkout: '1box', value: 700, label: '選購 1盒 · HK$700',
           nudge: '多付 HK$2,300 升級至 6盒：多 150 日，每盒只需 HK$460。' }
  };
  var pickers = document.querySelectorAll('[data-plan]');

  function applyPlan(key) {
    var plan = PLANS[key];
    if (!plan) return;
    Array.prototype.forEach.call(pickers, function (picker) {
      var radio = picker.querySelector('input[type="radio"][value="' + key + '"]');
      if (radio) radio.checked = true;

      var cta = picker.querySelector('[data-plan-cta]');
      if (cta) {
        try {
          var url = new URL(cta.href);
          url.pathname = '/hk/zh-TW/express/' + plan.path;
          cta.href = url.toString();
        } catch (e) { /* leave the link as it was */ }
        cta.setAttribute('data-checkout', plan.checkout);
        cta.setAttribute('data-value', String(plan.value));
        cta.textContent = plan.label;
      }

      var nudge = picker.querySelector('[data-plan-nudge]');
      if (nudge) {
        nudge.textContent = '';
        if (plan.nudge) {
          nudge.appendChild(document.createTextNode(plan.nudge + ' '));
          var up = document.createElement('button');
          up.type = 'button';
          up.textContent = '改選 6盒';
          up.addEventListener('click', function () { applyPlan('6'); });
          nudge.appendChild(up);
          nudge.hidden = false;
        } else {
          nudge.hidden = true;
        }
      }
    });
  }

  Array.prototype.forEach.call(pickers, function (picker) {
    picker.addEventListener('change', function (e) {
      if (e.target && e.target.type === 'radio') applyPlan(e.target.value);
    });
  });
})();
