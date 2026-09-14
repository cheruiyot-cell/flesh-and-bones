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
    initExternalLinkHints();
    initYear();
  }

  /* -----------------------------------------------------------
     1. Mobile menu toggle
        - Escape closes
        - Click outside closes
        - Focus is trapped while open
        - Body scroll is locked (with scrollbar-width compensation)
        - Close animation completes via transitionend, not a magic timer
     ----------------------------------------------------------- */
  function initMobileMenu() {
    const toggle = document.getElementById('menu-toggle');
    const menu = document.getElementById('mobile-menu');
    if (!toggle || !menu) return;

    toggle.setAttribute('aria-controls', 'mobile-menu');
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

      // Use transitionend, with a fallback timeout if the transition
      // doesn't fire (e.g. reduced-motion short-circuit).
      let finished = false;
      const finish = () => {
        if (finished) return;
        finished = true;
        if (!isOpen) menu.classList.add('hidden');
        menu.removeEventListener('transitionend', onEnd);
        clearTimeout(closeTimer);
      };
      const onEnd = (e) => {
        if (e.target === menu && e.propertyName === 'max-height') finish();
      };
      menu.addEventListener('transitionend', onEnd);
      closeTimer = setTimeout(finish, 500);

      if (returnFocus) toggle.focus();
    };

    toggle.addEventListener('click', () => {
      isOpen ? closeMenu() : openMenu();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && isOpen) closeMenu();
    });

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
     2. Menu filtering
        - Toggles .hidden (display:none). The CSS animation on
          .menu-card restarts automatically on display change.
        - Announced via the #menu-status live region.
        - No inline opacity/transform → no conflict with the
          scroll-reveal system (which owns those properties).
     ----------------------------------------------------------- */
  function initMenuFilter() {
    const buttons = document.querySelectorAll('.filter-btn');
    const cards = document.querySelectorAll('.menu-card');
    const status = document.getElementById('menu-status');
    if (!buttons.length || !cards.length) return;

    const setActive = (activeBtn) => {
      buttons.forEach(btn => {
        btn.classList.remove('active');
        btn.setAttribute('aria-pressed', 'false');
      });
      activeBtn.classList.add('active');
      activeBtn.setAttribute('aria-pressed', 'true');
    };

    const filter = (value) => {
      let visible = 0;
      cards.forEach(card => {
        const cat = card.getAttribute('data-category');
        const show = value === 'all' || cat === value;
        card.classList.toggle('hidden', !show);
        if (show) visible++;
      });
      if (status) {
        status.textContent = `Showing ${visible} of ${cards.length} menu items.`;
      }
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
        The wrapping <label class="spice-field"> already provides
        the accessible name for each <select> — no JS association
        needed. This only rewrites the WhatsApp CTA link on change.
     ----------------------------------------------------------- */
  function initSpiceSelectors() {
    document.querySelectorAll('.menu-card[data-spice="true"]').forEach(card => {
      const select = card.querySelector('.spice-select');
      const cta = card.querySelector('.order-cta');
      if (!select || !cta) return;

      const item = card.getAttribute('data-item') || 'this dish';
      const price = card.getAttribute('data-price') || '';

      const update = () => {
        const message = `Hi Redwood! I'd like the ${item} (${price}) — ${select.value}.`;
        cta.href = `https://wa.me/254702555093?text=${encodeURIComponent(message)}`;
      };

      update();
      select.addEventListener('change', update);
    });
  }

  /* -----------------------------------------------------------
     4. Scroll reveal
        Menu cards are excluded — they own their own CSS animation
        and would otherwise fight the reveal system for opacity.
     ----------------------------------------------------------- */
  function initScrollReveal() {
    if (!('IntersectionObserver' in window)) return;
    if (prefersReducedMotion()) return;

    const targets = document.querySelectorAll(
      '.card-lift:not(.menu-card), .faq-item, .step-number'
    );
    if (!targets.length) return;

    targets.forEach(el => {
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

    targets.forEach(el => observer.observe(el));
  }

  /* -----------------------------------------------------------
     5. Smooth anchor scroll
        Reads header height dynamically. Respects reduced motion.
        Moves focus to the target for keyboard/AT users.
        Skips bare "#" links (the logo now points at #hero).
     ----------------------------------------------------------- */
  function initSmoothScroll() {
    const header = document.querySelector('.header-bg');

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

  /* -----------------------------------------------------------
     7. Append "(opens in a new tab)" hint to external links
        programmatically so we don't have to repeat it ~15× in HTML.
     ----------------------------------------------------------- */
  function initExternalLinkHints() {
    document.querySelectorAll('a[target="_blank"]').forEach(link => {
      if (link.querySelector('.sr-only')) return;
      const span = document.createElement('span');
      span.className = 'sr-only';
      span.textContent = ' (opens in a new tab)';
      link.appendChild(span);
    });
  }

  /* -----------------------------------------------------------
     8. Current year in footer
     ----------------------------------------------------------- */
  function initYear() {
    const el = document.getElementById('year');
    if (el) el.textContent = String(new Date().getFullYear());
  }

})();