/**
 * Homega Landing Page — Main JS
 * Plain vanilla JS, no dependencies.
 *
 * Features:
 * 1. Site header — scroll shadow + mobile menu toggle
 * 2. FAQ accordion (single-open behavior using <details>)
 * 3. Sticky mobile CTA (Intersection Observer)
 * 4. Scroll-triggered entrance animations (Intersection Observer)
 * 5. Language switcher (handled via footer links — no JS needed)
 */

(function () {
  'use strict';

  /* -----------------------------------------------------------------
     1. Site Header — scroll shadow + mobile menu
     ----------------------------------------------------------------- */
  var header = document.querySelector('.site-header');
  var menuToggle = document.querySelector('.site-header__menu-toggle');
  var mobileMenu = document.querySelector('.site-header__mobile-menu');

  // Add shadow on scroll
  if (header) {
    window.addEventListener('scroll', function () {
      if (window.scrollY > 10) {
        header.classList.add('site-header--scrolled');
      } else {
        header.classList.remove('site-header--scrolled');
      }
    }, { passive: true });
  }

  // Mobile menu toggle
  if (menuToggle && mobileMenu) {
    function toggleMenu() {
      var isOpen = mobileMenu.classList.toggle('is-open');
      menuToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      mobileMenu.setAttribute('aria-hidden', isOpen ? 'false' : 'true');
    }

    menuToggle.addEventListener('click', toggleMenu);

    // iOS Safari: sticky headers can swallow click events — touchend as fallback
    var touchMoved = false;
    menuToggle.addEventListener('touchstart', function () { touchMoved = false; }, { passive: true });
    menuToggle.addEventListener('touchmove', function () { touchMoved = true; }, { passive: true });
    menuToggle.addEventListener('touchend', function (e) {
      if (!touchMoved) {
        e.preventDefault(); // prevent duplicate click
        toggleMenu();
      }
    });

    // Close menu when a link is clicked
    mobileMenu.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        mobileMenu.classList.remove('is-open');
        menuToggle.setAttribute('aria-expanded', 'false');
        mobileMenu.setAttribute('aria-hidden', 'true');
      });
    });
  }

  /* -----------------------------------------------------------------
     2. FAQ Accordion — Single-open behavior
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
