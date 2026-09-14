/* ==========================================================
   FLESH AND BONES GYM — PREMIUM INTERACTION ENGINE
   ========================================================== */

(function () {
  'use strict';

  // Helper: throttle function for performance
  function throttle(func, limit) {
    let inThrottle;
    return function (...args) {
      const context = this;
      if (!inThrottle) {
        func.apply(context, args);
        inThrottle = true;
        setTimeout(() => (inThrottle = false), limit);
      }
    };
  }

  // ------------------------------------------------------------------
  // Theme Toggle (persisted in localStorage)
  // ------------------------------------------------------------------
  const themeToggle = document.getElementById('themeToggle');
  const savedTheme = localStorage.getItem('fb_theme');

  if (savedTheme === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
    themeToggle.innerHTML = '<i class="fas fa-sun" aria-hidden="true"></i>';
  }

  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme');
      if (current === 'dark') {
        document.documentElement.removeAttribute('data-theme');
        localStorage.setItem('fb_theme', 'light');
        themeToggle.innerHTML = '<i class="fas fa-moon" aria-hidden="true"></i>';
      } else {
        document.documentElement.setAttribute('data-theme', 'dark');
        localStorage.setItem('fb_theme', 'dark');
        themeToggle.innerHTML = '<i class="fas fa-sun" aria-hidden="true"></i>';
      }
    });
  }

  // ------------------------------------------------------------------
  // Mobile Navigation
  // ------------------------------------------------------------------
  const hamburger = document.getElementById('hamburger');
  const navLinks = document.getElementById('navLinks');

  function toggleNav(forceClose = false) {
    const isOpen = navLinks.classList.contains('open');
    const shouldOpen = forceClose ? false : !isOpen;

    hamburger.classList.toggle('active', shouldOpen);
    navLinks.classList.toggle('open', shouldOpen);
    hamburger.setAttribute('aria-expanded', shouldOpen);
    document.body.style.overflow = shouldOpen ? 'hidden' : '';
  }

  hamburger.addEventListener('click', () => toggleNav());

  // Close mobile menu when a link is clicked
  navLinks.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => toggleNav(true));
  });

  // ------------------------------------------------------------------
  // Toast Notification System
  // ------------------------------------------------------------------
  let toastTimer;
  function showToast(icon, msg, sub = '') {
    const toast = document.getElementById('toast');
    const toastIcon = document.getElementById('toastIcon');
    const toastMsg = document.getElementById('toastMsg');
    const toastSub = document.getElementById('toastSub');

    toastIcon.textContent = icon;
    toastMsg.textContent = msg;
    toastSub.textContent = sub;

    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 4500);
  }

  // ------------------------------------------------------------------
  // Accordions (FAQ & Legal)
  // ------------------------------------------------------------------
  function initAccordions(containerClass, headerClass, bodyClass, itemClass) {
    const containers = document.querySelectorAll(containerClass);
    containers.forEach((container) => {
      const headers = container.querySelectorAll(headerClass);
      headers.forEach((header) => {
        const item = header.closest(itemClass);
        const body = item.querySelector(bodyClass);
        const isOpen = item.classList.contains('open');

        if (isOpen && body) {
          body.style.maxHeight = body.scrollHeight + 'px';
        }

        header.addEventListener('click', () => {
          const currentlyOpen = item.classList.contains('open');

          // Close all siblings
          container.querySelectorAll(itemClass).forEach((sibling) => {
            if (sibling !== item) {
              sibling.classList.remove('open');
              const sibBody = sibling.querySelector(bodyClass);
              if (sibBody) sibBody.style.maxHeight = null;
              const sibHeader = sibling.querySelector(headerClass);
              if (sibHeader) sibHeader.setAttribute('aria-expanded', 'false');
            }
          });

          if (currentlyOpen) {
            item.classList.remove('open');
            header.setAttribute('aria-expanded', 'false');
            if (body) body.style.maxHeight = null;
          } else {
            item.classList.add('open');
            header.setAttribute('aria-expanded', 'true');
            if (body) body.style.maxHeight = body.scrollHeight + 'px';
          }
        });
      });
    });
  }

  initAccordions('.faq-grid', '.faq-question', '.faq-answer', '.faq-item');
  initAccordions('.legal-grid', '.legal-header', '.legal-body', '.legal-card');

  // ------------------------------------------------------------------
  // Contact Form → WhatsApp (Streamlined)
  // ------------------------------------------------------------------
  const contactForm = document.getElementById('contactForm');
  if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();

      if (!contactForm.checkValidity()) {
        showToast('⚠️', 'Form Incomplete', 'Please provide your name, phone, and message.');
        return;
      }

      const name = document.getElementById('contactName').value.trim();
      const phone = document.getElementById('contactPhone').value.trim();
      const msg = document.getElementById('contactMessage').value.trim();

      showToast('📩', 'Opening WhatsApp...', 'Redirecting with your message pre-filled.');

      const text =
        `Hi Flesh & Bones Gym! My name is ${name} (${phone}).\n\n${msg}`;

      setTimeout(() => {
        window.open(`https://wa.me/254702555093?text=${encodeURIComponent(text)}`, '_blank');
      }, 800);

      contactForm.reset();
    });
  }

  // ------------------------------------------------------------------
  // Scroll Effects: Navbar & Back-to-Top
  // ------------------------------------------------------------------
  const navbar = document.getElementById('navbar');
  const backToTop = document.getElementById('backToTop');

  const onScroll = throttle(() => {
    const y = window.scrollY;
    navbar.classList.toggle('scrolled', y > 40);
    backToTop.classList.toggle('visible', y > 400);
  }, 100);

  window.addEventListener('scroll', onScroll, { passive: true });

  backToTop.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  // ------------------------------------------------------------------
  // Reveal Animations via IntersectionObserver
  // ------------------------------------------------------------------
  const revealElements = document.querySelectorAll(
    '.plan-card, .trainer-card, .program-card, .amenity-card, .testimonial-card, .gallery-item'
  );

  if ('IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('revealed');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );

    revealElements.forEach((el) => {
      el.classList.add('reveal-init');
      revealObserver.observe(el);
    });
  } else {
    // Fallback: show everything
    revealElements.forEach((el) => el.classList.add('revealed'));
  }

  // ------------------------------------------------------------------
  // Active Nav Link Highlight
  // ------------------------------------------------------------------
  const sections = document.querySelectorAll('section[id]');
  const navAnchors = document.querySelectorAll('.nav-links a');

  if ('IntersectionObserver' in window) {
    const sectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const id = entry.target.id;
            navAnchors.forEach((a) => {
              const isActive = a.getAttribute('href') === `#${id}`;
              a.classList.toggle('active', isActive);
              if (isActive) {
                a.setAttribute('aria-current', 'page');
              } else {
                a.removeAttribute('aria-current');
              }
            });
          }
        });
      },
      { rootMargin: '-30% 0px -60% 0px' }
    );

    sections.forEach((section) => sectionObserver.observe(section));
  }

  // ------------------------------------------------------------------
  // Hero Stat Counter Animation
  // ------------------------------------------------------------------
  const stats = document.querySelectorAll('.hero-stats .stat h3');
  let statsAnimated = false;

  const statsObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && !statsAnimated) {
          statsAnimated = true;
          stats.forEach((stat) => {
            const text = stat.innerText;
            // Skip if the text contains a colon (time format)
            if (text.includes(':')) return;
            const target = parseInt(text.replace(/[^0-9]/g, ''), 10);
            const suffix = text.replace(/[0-9]/g, '');

            if (isNaN(target)) return;

            let current = 0;
            const step = Math.max(1, Math.ceil(target / 40));
            const timer = setInterval(() => {
              current += step;
              if (current >= target) {
                stat.innerText = target + suffix;
                clearInterval(timer);
              } else {
                stat.innerText = current + suffix;
              }
            }, 30);
          });
        }
      });
    },
    { threshold: 0.5 }
  );

  const heroStats = document.querySelector('.hero-stats');
  if (heroStats) statsObserver.observe(heroStats);
})();