/**
 * 雙11 (Double 11) sale treatment: the on/off switch and the price swap.
 * Plain ES5, no dependencies. Loaded in <head> (before any stylesheet paints), so the
 * html classes are in place before the first frame and hmg2.js finds window.D11.
 *
 * MOCK: on only with ?d11=1&look=1|2|3 in the address. The real build decides by the
 * server clock instead (eStore discount: 26 Oct 00:00 – 16 Nov 23:59 HKT); only the
 * `on` and `look` lines below change.
 *
 * Off = the page is untouched: every rule in css/d11.css sits under html.d11, every
 * 雙11-only element carries [hidden], and nothing below runs.
 *
 * Hooks in the HTML (leaf elements only; their text is replaced, not their children):
 *   data-d11="<text>"     the element's text while 雙11 is on (the old text moves to data-d11-was)
 *   data-d11-value="<n>"  a checkout link's data-value (HKD, the tracked basket value) while on
 *   data-d11-off="<n>"    a 3/6 pack card: css/d11.css draws its ribbon / 減$n stamp from it
 *   .d11-* [hidden]       extra pieces (bars, hero lockup, coupon, 平時 prices); d11.css shows them
 * window.D11.plans        overrides for the /promo/hmg/ plan table (hmg2.js merges them):
 *                         buy-button labels, sticky bar, upgrade note, tracked value.
 */
(function () {
  'use strict';

  var q = window.location.search;
  var on = /[?&]d11=1(&|$)/.test(q);
  if (!on) return;
  var m = /[?&]look=([123])(&|$)/.exec(q);
  var look = m ? m[1] : '1';

  document.documentElement.className += ' d11 d11-look' + look;

  // 雙11 prices: 6樽 HK$2,778 (每日 15.4), 3樽 HK$1,539 (每日 17.1); 1樽 stays HK$700
  window.D11 = {
    look: look,
    plans: {
      '6': { value: 2778, label: '購買完整療程 · HK$2,778', price: 'HK$2,778 · 每日 HK$15.4' },
      '3': { value: 1539, label: '購買基本配套 · HK$1,539', price: 'HK$1,539 · 每日 HK$17.1',
             nudge: '加 HK$1,239 多 3 樽，|6樽完整療程即享 90日退款保證。' }
    }
  };

  // The heavy display face (Noto Sans TC 900) for the gold 雙11 headlines, fetched only
  // while 雙11 is on. Google Fonts slices CJK by unicode-range: a few glyphs, a few KB.
  var font = document.createElement('link');
  font.rel = 'stylesheet';
  font.href = 'https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@900&display=swap';
  document.head.appendChild(font);

  function each(sel, fn) { Array.prototype.forEach.call(document.querySelectorAll(sel), fn); }

  function swap() {
    each('[data-d11]', function (el) {
      if (el.hasAttribute('data-d11-was')) return;
      el.setAttribute('data-d11-was', el.textContent);
      el.textContent = el.getAttribute('data-d11');
    });
    each('[data-d11-value]', function (el) {
      el.setAttribute('data-value', el.getAttribute('data-d11-value'));
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', swap);
  else swap();
})();
