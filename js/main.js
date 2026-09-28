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
     3. Testimonials Carousel
     Infinite-loop auto-scrolling carousel with prev/next and dots.
     ----------------------------------------------------------------- */
  var carousel = document.getElementById('testimonials-carousel');
  var prevBtn = document.getElementById('testimonials-prev');
  var nextBtn = document.getElementById('testimonials-next');
  var dotsContainer = document.getElementById('testimonials-dots');

  if (carousel && prevBtn && nextBtn && dotsContainer) {
    var originalCards = Array.from(carousel.querySelectorAll('.testimonial-card'));
    var totalOriginal = originalCards.length;
    var currentIndex = 0;
    var autoplayInterval;
    var autoplayDelay = 2500;

    // Clone all cards and append for infinite loop
    originalCards.forEach(function (card) {
      var clone = card.cloneNode(true);
      clone.classList.add('is-clone');
      carousel.appendChild(clone);
    });

    var allCards = carousel.querySelectorAll('.testimonial-card');

    // Create dots (only for original cards)
    originalCards.forEach(function (_, i) {
      var dot = document.createElement('button');
      dot.className = 'testimonials__dot' + (i === 0 ? ' is-active' : '');
      dot.setAttribute('aria-label', '第' + (i + 1) + '個用家分享');
      dot.addEventListener('click', function () {
        scrollToCard(i);
        resetAutoplay();
      });
      dotsContainer.appendChild(dot);
    });

    function updateDots(index) {
      var mapped = index % totalOriginal;
      var dots = dotsContainer.querySelectorAll('.testimonials__dot');
      dots.forEach(function (d, i) {
        d.classList.toggle('is-active', i === mapped);
      });
    }

    function scrollToCard(index) {
      var cards = Array.from(allCards);
      if (index < 0 || index >= cards.length) return;
      var card = cards[index];
      carousel.scrollTo({ left: card.offsetLeft - carousel.offsetLeft, behavior: 'smooth' });
      currentIndex = index;
      updateDots(index);
    }

    // When scroll reaches cloned section, silently jump back to original
    function handleInfiniteLoop() {
      var cards = Array.from(allCards);
      var firstClone = cards[totalOriginal];
      if (!firstClone) return;
      var cloneStart = firstClone.offsetLeft - carousel.offsetLeft;
      if (carousel.scrollLeft >= cloneStart - 10) {
        carousel.style.scrollBehavior = 'auto';
        carousel.scrollLeft = 0;
        currentIndex = 0;
        updateDots(0);
        // Restore smooth after the jump
        requestAnimationFrame(function () {
          carousel.style.scrollBehavior = '';
        });
      }
    }

    prevBtn.addEventListener('click', function () {
      if (currentIndex <= 0) {
        scrollToCard(totalOriginal - 1);
      } else {
        scrollToCard(currentIndex - 1);
      }
      resetAutoplay();
    });

    nextBtn.addEventListener('click', function () {
      scrollToCard(currentIndex + 1);
      resetAutoplay();
    });

    // Update dots on manual scroll/swipe
    var scrollTimer;
    carousel.addEventListener('scroll', function () {
      clearTimeout(scrollTimer);
      scrollTimer = setTimeout(function () {
        handleInfiniteLoop();
        var scrollLeft = carousel.scrollLeft;
        var closestIndex = 0;
        var closestDist = Infinity;
        Array.from(allCards).forEach(function (card, i) {
          var dist = Math.abs(card.offsetLeft - carousel.offsetLeft - scrollLeft);
          if (dist < closestDist) {
            closestDist = dist;
            closestIndex = i;
          }
        });
        currentIndex = closestIndex;
        updateDots(closestIndex);
      }, 100);
    }, { passive: true });

    // Autoplay
    function startAutoplay() {
      autoplayInterval = setInterval(function () {
        scrollToCard(currentIndex + 1);
      }, autoplayDelay);
    }

    function resetAutoplay() {
      clearInterval(autoplayInterval);
      startAutoplay();
    }

    startAutoplay();

    // Pause on hover/touch
    carousel.addEventListener('mouseenter', function () { clearInterval(autoplayInterval); });
    carousel.addEventListener('mouseleave', function () { startAutoplay(); });
    carousel.addEventListener('touchstart', function () { clearInterval(autoplayInterval); }, { passive: true });
    carousel.addEventListener('touchend', function () { resetAutoplay(); }, { passive: true });
  }

  /* -----------------------------------------------------------------
     4. Sticky mobile CTA
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

  /* -----------------------------------------------------------------
     5. Checkout links → store: ad tags + click events
     Buy buttons carry data-checkout (e.g. "3box"), data-value (HKD)
     and data-product. Purchases happen on store.tigroxglobal.com, so the
     click is the last step these pages can see; the ad tags are copied
     onto the store link so the store can attribute the order.
     Tags are kept for the browser tab session, so a visitor who lands on
     one page and buys from another still carries them.
     ----------------------------------------------------------------- */
  var TAG_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'fbclid'];
  var adTags = {};
  var incoming = new URLSearchParams(window.location.search);
  TAG_KEYS.forEach(function (k) { if (incoming.get(k)) adTags[k] = incoming.get(k); });
  try {
    if (Object.keys(adTags).length) {
      sessionStorage.setItem('tigrox_ad_tags', JSON.stringify(adTags));
    } else {
      adTags = JSON.parse(sessionStorage.getItem('tigrox_ad_tags') || '{}') || {};
    }
  } catch (e) { /* storage blocked: tags from this page's URL still apply */ }

  var checkoutLinks = document.querySelectorAll('a[data-checkout]');
  Array.prototype.forEach.call(checkoutLinks, function (a) {
    try {
      var url = new URL(a.href);
      Object.keys(adTags).forEach(function (k) {
        if (!url.searchParams.has(k)) url.searchParams.set(k, adTags[k]);
      });
      a.href = url.toString();
    } catch (e) { /* leave the link untouched */ }

    a.addEventListener('click', function () {
      var product = a.getAttribute('data-product') || 'Homega';
      var variant = a.getAttribute('data-checkout');
      var value = Number(a.getAttribute('data-value')) || 0;
      if (window.fbq) {
        window.fbq('track', 'InitiateCheckout', { content_name: product + ' ' + variant, currency: 'HKD', value: value });
      }
      if (window.gtag) {
        window.gtag('event', 'begin_checkout', {
          currency: 'HKD', value: value,
          items: [{ item_name: product, item_variant: variant }]
        });
      }
    });
  });
})();
