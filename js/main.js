/**
 * Homega Landing Page — Main JS
 * Plain vanilla JS, no dependencies.
 *
 * Features:
 * 1. FAQ accordion (single-open behavior using <details>)
 * 2. Sticky mobile CTA (Intersection Observer)
 * 3. Scroll-triggered entrance animations (Intersection Observer)
 * 4. Language switcher (handled via footer links — no JS needed)
 */

(function () {
  'use strict';

  /* -----------------------------------------------------------------
     1. FAQ Accordion — Single-open behavior
     When one <details> opens, close all others in the same list.
     ----------------------------------------------------------------- */
  var faqList = document.querySelector('.faq__list');
  if (faqList) {
    faqList.addEventListener('toggle', function (e) {
      if (!e.target.open) return;
      var items = faqList.querySelectorAll('details');
      items.forEach(function (item) {
        if (item !== e.target && item.open) {
          item.open = false;
        }
      });
    }, true);
  }

  /* -----------------------------------------------------------------
     2. Scroll-triggered entrance animations
     Elements with .animate-on-scroll fade in when they enter viewport.
     ----------------------------------------------------------------- */
  var animEls = document.querySelectorAll('.animate-on-scroll');
  if ('IntersectionObserver' in window && animEls.length) {
    var animObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          animObs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });
    animEls.forEach(function (el) { animObs.observe(el); });
  }

  /* -----------------------------------------------------------------
     3. Sticky mobile CTA
     Show when hero CTA button scrolls out of viewport.
     Hidden on tablet+ via CSS (display: none !important above 768px).
     ----------------------------------------------------------------- */
  var heroCta = document.querySelector('.hero__cta');
  var stickyCta = document.getElementById('sticky-mobile-cta');
  if (heroCta && stickyCta && 'IntersectionObserver' in window) {
    var stickyObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          stickyCta.setAttribute('aria-hidden', 'true');
          stickyCta.style.display = 'none';
          document.body.style.paddingBottom = '0';
        } else {
          stickyCta.setAttribute('aria-hidden', 'false');
          stickyCta.style.display = 'flex';
          document.body.style.paddingBottom = '68px';
        }
      });
    }, { threshold: 0 });
    stickyObs.observe(heroCta);
  }
})();
