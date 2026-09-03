/**
 * Promo pages — campaign bar + checkout tracking.
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
     2. Checkout click tracking (Meta Pixel + GA4)
     Links carry data-checkout="1box|3box|6box" and data-value (HKD).
     ----------------------------------------------------------------- */
  var checkoutLinks = document.querySelectorAll('a[data-checkout]');
  Array.prototype.forEach.call(checkoutLinks, function (a) {
    a.addEventListener('click', function () {
      var variant = a.getAttribute('data-checkout');
      var value = Number(a.getAttribute('data-value')) || 0;
      if (window.fbq) {
        window.fbq('track', 'InitiateCheckout', { content_name: 'Homega ' + variant, currency: 'HKD', value: value });
      }
      if (window.gtag) {
        window.gtag('event', 'begin_checkout', {
          currency: 'HKD', value: value,
          items: [{ item_name: 'Homega', item_variant: variant }]
        });
      }
    });
  });
})();
