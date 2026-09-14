/* =============================================================
   scripts.js — Redwood Restaurant
   Progressive enhancement only. No dependencies.
   ============================================================= */

(function () {
  'use strict';

  /* Shared: live reduced-motion check (users can toggle OS setting) */
  const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  const prefersReducedMotion = () => reducedMotionQuery.matches;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  function init() {
    initMobileMenu();
    initMenuFilter();
    initSpiceSelectors();
    initScrollReveal();
    initSmoothScroll();
    initSpecialDay();
  }

  /* -----------------------------------------------------------
     1. Mobile menu toggle
        - Escape closes
        - Click outside closes
        - Focus is trapped while open
        - Body scroll is locked (with scrollbar-width compensation)
        - No transitionend listener accumulation
     ----------------------------------------------------------- */
  function initMobileMenu() {
    const toggle = document.getElementById('menu-toggle');
    const menu = document.getElementById('mobile-menu');
    if (!toggle || !menu) return;

    // Ensure stable attributes regardless of HTML authoring
    if (!toggle.hasAttribute('aria-controls')) {
      toggle.setAttribute('aria-controls', 'mobile-menu');
    }
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Open menu');
    menu.classList.add('hidden');

    let isOpen = false;
    let closeTimer = null;

    const lockScroll = () => {
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      if (scrollbarWidth > 0) {
        document.body.style.paddingRight = scrollbarWidth + 'px';
      }
      document.body.style.overflow = 'hidden';
    };

    const unlockScroll = () => {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    };

    const openMenu = () => {
      if (isOpen) return;
      isOpen = true;
      clearTimeout(closeTimer);
      menu.classList.remove('hidden');
      // Force reflow so max-height transition runs from 0
      void menu.offsetWidth;
      menu.classList.add('open');
      toggle.setAttribute('aria-expanded', 'true');
      toggle.setAttribute('aria-label', 'Close menu');
      lockScroll();

      // Move focus into the menu for keyboard users
      const firstFocusable = menu.querySelector('a, button, [tabindex]:not([tabindex="-1"])');
      if (firstFocusable) firstFocusable.focus();
    };

    const closeMenu = ({ returnFocus = true } = {}) => {
      if (!isOpen) return;
      isOpen = false;
      menu.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-label', 'Open menu');
      unlockScroll();

      clearTimeout(closeTimer);
      closeTimer = setTimeout(() => {
        if (!isOpen) menu.classList.add('hidden');
      }, 400); // keep in sync with max-height transition

      if (returnFocus) toggle.focus();
    };

    toggle.addEventListener('click', () => {
      isOpen ? closeMenu() : openMenu();
    });

    // Escape to close
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && isOpen) closeMenu();
    });

    // Click outside to close
    document.addEventListener('click', (e) => {
      if (!isOpen) return;
      if (menu.contains(e.target) || toggle.contains(e.target)) return;
      closeMenu({ returnFocus: false });
    });

    // Focus trap
    menu.addEventListener('keydown', (e) => {
      if (e.key !== 'Tab' || !isOpen) return;
      const focusables = menu.querySelectorAll(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      if (!focusables.length) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    });

    // Close when a nav link is followed
    menu.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => closeMenu({ returnFocus: false }));
    });

    // Safety: if viewport grows past lg, reset state
    const mql = window.matchMedia('(min-width: 1024px)');
    const onWide = (e) => { if (e.matches && isOpen) closeMenu({ returnFocus: false }); };
    if (typeof mql.addEventListener === 'function') mql.addEventListener('change', onWide);
    else if (typeof mql.addListener === 'function') mql.addListener(onWide);
  }

  /* -----------------------------------------------------------
     2. Menu filtering — smooth fade out / fade in
        - Cancels in-flight timers so rapid clicks never flicker
        - Uses forced reflow + rAF so newly-shown cards animate in
     ----------------------------------------------------------- */
  function initMenuFilter() {
    const buttons = document.querySelectorAll('.filter-btn');
    const cards = document.querySelectorAll('.menu-card');
    if (!buttons.length || !cards.length) return;

    // Baseline: all visible
    cards.forEach(card => {
      card.classList.remove('hidden');
      card.style.opacity = '1';
      card.style.transform = 'translateY(0)';
    });

    const setActive = (activeBtn) => {
      buttons.forEach(btn => {
        btn.classList.remove('active');
        btn.setAttribute('aria-pressed', 'false');
      });
      activeBtn.classList.add('active');
      activeBtn.setAttribute('aria-pressed', 'true');
    };

    let filterTimer = null;

    const filter = (value) => {
      clearTimeout(filterTimer);

      // Step 1: fade everything out
      cards.forEach(card => {
        card.classList.remove('reveal-hidden');
        card.style.transition = 'opacity 0.25s ease, transform 0.25s ease';
        card.style.opacity = '0';
        card.style.transform = 'translateY(8px)';
      });

      filterTimer = setTimeout(() => {
        const toShow = [];
        cards.forEach(card => {
          const cat = card.getAttribute('data-category');
          const show = value === 'all' || cat === value;
          if (show) {
            card.classList.remove('hidden');
            toShow.push(card);
          } else {
            card.classList.add('hidden');
          }
        });

        // Force a style recalculation so the browser records the
        // display:none -> block change at opacity:0 before we animate in.
        void document.body.offsetHeight;

        requestAnimationFrame(() => {
          toShow.forEach(card => {
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
          });
        });
      }, 250);
    };

    buttons.forEach(btn => {
      btn.addEventListener('click', () => {
        setActive(btn);
        filter(btn.getAttribute('data-filter'));
      });
    });

    const defaultActive = document.querySelector('.filter-btn.active') || buttons[0];
    if (defaultActive) setActive(defaultActive);
  }

  /* -----------------------------------------------------------
     3. Spice selectors
        - Auto-wires <label for> ↔ <select id> if the markup
          did not already provide one
        - Rewrites the WhatsApp CTA link on change
     ----------------------------------------------------------- */
  function initSpiceSelectors() {
    document.querySelectorAll('.menu-card[data-spice="true"]').forEach(card => {
      const select = card.querySelector('.spice-select');
      const cta = card.querySelector('.order-cta');
      const label = card.querySelector('.spice-label');
      if (!select || !cta) return;

      // Ensure label association for screen readers
      if (label && !label.htmlFor && !select.id) {
        const id = 'spice-' + Math.random().toString(36).slice(2, 9);
        select.id = id;
        label.setAttribute('for', id);
      }

      const item = card.getAttribute('data-item') || 'this dish';
      const price = card.getAttribute('data-price') || '';

      const update = () => {
        const spice = select.value;
        const message = `Hi Redwood! I'd like the ${item} (${price}) — ${spice}.`;
        cta.href = `https://wa.me/254702555093?text=${encodeURIComponent(message)}`;
      };

      update();
      select.addEventListener('change', update);
    });
  }

  /* -----------------------------------------------------------
     4. Scroll reveal
        - Uses `.reveal-hidden` (visibility:hidden) so items are
          not focusable or exposed while off-screen
        - Skips entirely under reduced motion or no IO support
     ----------------------------------------------------------- */
  function initScrollReveal() {
    if (!('IntersectionObserver' in window)) return;
    if (prefersReducedMotion()) return;

    const targets = document.querySelectorAll(
      '.menu-card, .bg-dark-card .card-lift, .faq-item'
    );
    const steps = document.querySelectorAll('.step-number');
    const all = [...targets, ...steps];
    if (!all.length) return;

    all.forEach(el => {
      el.classList.add('reveal-hidden');
      el.style.transition =
        'opacity 0.6s cubic-bezier(0.22, 1, 0.36, 1), ' +
        'transform 0.6s cubic-bezier(0.22, 1, 0.36, 1)';
    });

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const el = entry.target;
          el.classList.remove('reveal-hidden');
          observer.unobserve(el);
        }
      });
    }, {
      root: null,
      rootMargin: '0px 0px -60px 0px',
      threshold: 0.15
    });

    all.forEach(el => observer.observe(el));
  }

  /* -----------------------------------------------------------
     5. Smooth anchor scroll
        - Reads header height dynamically (mobile 4rem / desktop 5rem)
        - Respects prefers-reduced-motion at click time
        - Moves focus to the target for keyboard/AT users
     ----------------------------------------------------------- */
  function initSmoothScroll() {
    const header = document.querySelector('header, .header-bg');

    const getOffset = () => {
      const h = header ? header.getBoundingClientRect().height : 80;
      return h + 8;
    };

    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', function (e) {
        const href = this.getAttribute('href');
        if (!href || href === '#' || href.length < 2) return;

        let target = null;
        try { target = document.querySelector(href); } catch (_) { /* invalid selector */ }
        if (!target) return;

        e.preventDefault();

        const top = target.getBoundingClientRect().top + window.pageYOffset - getOffset();
        const behavior = prefersReducedMotion() ? 'auto' : 'smooth';
        window.scrollTo({ top, behavior });

        // Focus target so keyboard users land in context.
        // (Makes element programmatically focusable if it isn't already.)
        if (!target.hasAttribute('tabindex')) {
          target.setAttribute('tabindex', '-1');
          target.addEventListener('blur', function once() {
            target.removeAttribute('tabindex');
            target.removeEventListener('blur', once);
          });
        }
        target.focus({ preventScroll: true });
      });
    });
  }

  /* -----------------------------------------------------------
     6. Inject current weekday into special headline
     ----------------------------------------------------------- */
  function initSpecialDay() {
    const el = document.getElementById('special-day');
    if (!el) return;
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    el.textContent = days[new Date().getDay()];
  }

})();