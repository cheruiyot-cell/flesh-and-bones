/* ==========================================================
   FLESH AND BONES GYM — INTERACTION ENGINE (v2)
   Vanilla JS, IIFE-scoped, progressive enhancement throughout.
   v2: SVG icon system, aria-live announcements, subscription-aware booking,
       per-field form errors, local-date fix, tabpanel a11y.
   ========================================================== */

(function () {
  'use strict';

  // ------------------------------------------------------------
  // Utilities
  // ------------------------------------------------------------
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

  function debounce(func, wait) {
    let t;
    return function (...args) {
      clearTimeout(t);
      t = setTimeout(() => func.apply(this, args), wait);
    };
  }

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function safeStorageGet(key) {
    try { return localStorage.getItem(key); } catch (e) { return null; }
  }
  function safeStorageSet(key, val) {
    try { localStorage.setItem(key, val); } catch (e) {}
  }
  function safeStorageRemove(key) {
    try { localStorage.removeItem(key); } catch (e) {}
  }

  // Local YYYY-MM-DD from a Date (not UTC)
  function localIsoDate(d) {
    const pad = (n) => String(n).padStart(2, '0');
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  }

  // ------------------------------------------------------------
  // Analytics hook (optional — activate by including GA4/Plausible)
  // ------------------------------------------------------------
  function trackEvent(label) {
    if (typeof window.gtag === 'function') {
      window.gtag('event', 'cta_click', { event_label: label });
    }
    if (typeof window.plausible === 'function') {
      window.plausible('cta_click', { props: { label } });
    }
  }
  document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-track]');
    if (el) trackEvent(el.dataset.track);
  });

  // ------------------------------------------------------------
  // Toast
  // ------------------------------------------------------------
  let toastTimer;
  function showToast(icon, msg, sub = '') {
    const toast = document.getElementById('toast');
    if (!toast) return;
    document.getElementById('toastIcon').textContent = icon;
    document.getElementById('toastMsg').textContent = msg;
    document.getElementById('toastSub').textContent = sub;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 4500);
  }

  // ------------------------------------------------------------
  // Theme — CSS-driven icon swap, no JS innerHTML
  // ------------------------------------------------------------
  const themeToggle = document.getElementById('themeToggle');
  const savedTheme = safeStorageGet('fb_theme');
  if (savedTheme === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
  }
  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme');
      if (current === 'dark') {
        document.documentElement.removeAttribute('data-theme');
        safeStorageSet('fb_theme', 'light');
      } else {
        document.documentElement.setAttribute('data-theme', 'dark');
        safeStorageSet('fb_theme', 'dark');
      }
    });
  }

  // ------------------------------------------------------------
  // Save-Data detection
  // ------------------------------------------------------------
  if (navigator.connection && navigator.connection.saveData) {
    document.documentElement.classList.add('save-data');
  }

  // ------------------------------------------------------------
  // i18n — English ⇄ Kiswahili
  // ------------------------------------------------------------
  const TRANSLATIONS = {
    en: {},
    sw: {
      'nav.home': 'Nyumbani',
      'nav.facilities': 'Vifaa',
      'nav.memberships': 'Uanachama',
      'nav.coaches': 'Makocha',
      'nav.classes': 'Madarasa',
      'nav.reviews': 'Maoni',
      'nav.faq': 'Maswali',
      'nav.contact': 'Wasiliana',
      'nav.freePass': 'Pasi ya Bure',

      'cta.chat': 'Ongea Nasi',
      'cta.quickWhatsapp': 'WhatsApp ya Haraka',
      'cta.claimPass': 'Pata Pasi ya Bure',
      'cta.viewRates': 'Tazama Bei',
      'cta.messageWhatsapp': 'Tutumie Ujumbe WhatsApp',
      'cta.continueWhatsapp': 'Endelea kwenye WhatsApp',
      'cta.claimGeneric': 'Pata Pasi ya Bure',
      'cta.joinMonthly': 'Jiunge kwa Mwezi',
      'cta.askDaily': 'Uliza kuhusu Pasi ya Siku',
      'cta.getQuarterly': 'Pata Kifurushi cha Robo Mwaka',
      'cta.bookKevin': 'Weka na Kevin',
      'cta.bookSarah': 'Weka na Sarah',
      'cta.bookLadyBoss': 'Weka na Lady Boss',
      'cta.bookMercy': 'Weka na Mercy',
      'cta.followInsta': 'Fuata @fleshandbonesgym',

      'hero.tag': 'Form Ni Gani? Acha Kupanga, Anza Kuinua',
      'hero.title1': 'Hakuna Hadithi.',
      'hero.title2': 'Faida Halisi Tu.',
      'hero.lede': 'Chuma kizito, eneo la mazoezi, chumba cha mvuke, na makocha wanaokufanya uwajibike — katikati ya Imara, Nairobi.',

      'trust.mpesa': 'M-Pesa inakubaliwa',
      'trust.hours': 'Jumatatu–Ijumaa 5–11, Jumamosi–Jumapili 7–9',
      'trust.location': 'Imara Daima, Nairobi',

      'stat.members': 'Wanachama Hai',
      'stat.coaches': 'Makocha Waliothibitishwa',
      'stat.opening': 'Kufungua Siku za Kazi',

      'amenities.tag': 'Kiwango cha Kimataifa',
      'amenities.title1': 'Imeundwa kwa Utendaji.',
      'amenities.title2': 'Imeundwa kwa Faraja.',
      'amenities.lede': 'Kila kitu unachohitaji chini ya paa moja ili kufanya mazoezi kama mtaalamu.',

      'amenity.iron.title': 'Racks za Hammer Strength &amp; Eleiko',
      'amenity.iron.body': 'Jukwaa za Olimpiki, sahani za bumper, na dumbbells hadi 50kg kwa wainuzaji wa kweli.',
      'amenity.steam.title': 'Chumba cha Mvuke &amp; Sauna',
      'amenity.steam.body': 'Pona haraka, tulia misuli, na toa sumu baada ya mazoezi mazito.',
      'amenity.fuel.title': 'Baa ya Fuel &amp; Smoothie',
      'amenity.fuel.body': 'Vinywaji vya kabla ya mazoezi, shake za protini, na milo safi ya uponyaji.',
      'amenity.showers.title': 'Maji ya Moto &amp; Makabati Salama',
      'amenity.showers.body': 'Vifaa vya kubadilishia vya kisasa, makabati ya kadi, na maji ya moto ya shinikizo.',
      'amenity.wifi.title': 'Wi-Fi ya Fibre ya Kasi',
      'amenity.wifi.body': 'Sikiliza muziki wako au uendelee kuunganishwa eneo la mazoezi.',
      'amenity.parking.title': 'Maegesho Salama',
      'amenity.parking.body': 'Maegesho yenye walinzi 24/7 karibu na Mombasa Road.',

      'plans.tag': 'Bei Wazi',
      'plans.title1': 'Hakuna Ada Zilizofichwa.',
      'plans.title2': 'Lipa kwa M-Pesa.',
      'plans.lede': 'Wekeza katika afya yako kwa mipango rahisi. M-Pesa papo hapo madawati au mtandaoni.',

      'calc.ifYouVisit': 'Ukitembelea',
      'calc.timesMonth': 'mara kwa mwezi:',
      'calc.daily': 'Pasi za siku',
      'calc.monthly': 'Mwezi wa Beast',
      'calc.quarterly': 'Robo Mwaka',

      'plan.daily.name': 'Pasi ya Siku',
      'plan.perDay': '/ siku',
      'plan.daily.f1': 'Chumba cha uzito &amp; eneo la mazoezi',
      'plan.daily.f2': 'Maji ya moto &amp; kabati',
      'plan.daily.f3': 'Wi-Fi ya kasi',
      'plan.daily.f4': 'Ufikiaji wa HIIT ya kikundi',
      'plan.popular': 'Maarufu Zaidi Imara',
      'plan.monthly.name': 'Mwezi wa Beast',
      'plan.perMonth': '/ mwezi',
      'plan.monthly.f1': 'Ufikiaji kamili (5 AM – 11 PM)',
      'plan.monthly.f2': 'Chumba cha mvuke &amp; sauna bure',
      'plan.monthly.f3': 'Madarasa ya kikundi bila kikomo',
      'plan.monthly.f4': 'Tathmini ya 1-kwa-1 &amp; mpango wa chakula',
      'plan.monthly.f5': 'Pasi 2 za wageni kwa mwezi',
      'plan.save': 'Okoa KES 1,500',
      'plan.quarterly.name': 'Robo Mwaka Champion',
      'plan.per3months': '/ miezi 3',
      'plan.quarterly.f1': 'Haki zote za Mwezi wa Beast',
      'plan.quarterly.f2': 'Vikao 3 vya mafunzo ya kibinafsi',
      'plan.quarterly.f3': 'Malipo ya M-Pesa yaliyogawanywa',
      'plan.quarterly.f4': 'Chupa ya shaker ya bure',
      'plan.quarterly.f5': 'Kipaumbele cha sauna',

      'trainers.tag': 'Matokeo Yaliyothibitishwa',
      'trainers.title1': 'Kutana na',
      'trainers.title2': 'Makocha wa Nairobi',
      'trainers.lede': 'Makocha wetu wana rekebisha mkao wako na kukusukuma mipaka yako.',

      'programs.tag': 'Ratiba ya Wiki',
      'programs.title1': 'Programu za',
      'programs.title2': 'Kikundi cha Nguvu',
      'programs.lede': 'Vikao vilivyoundwa kuvunja vizuizi. Ongeza darasa lolote kwenye kalenda yako.',

      'gallery.tag': 'Ziara ya Kituo',
      'gallery.title1': 'Ingia Ndani',
      'gallery.title2': 'Hekalu la Chuma',
      'gallery.lede': 'Pana, safi, na yenye vifaa vya hali ya juu.',

      'transform.tag': 'Mabadiliko',
      'transform.title1': 'Uthabiti',
      'transform.title2': 'Unasema kwa Sauti Kubwa',
      'transform.lede': 'Buruta kitelezi kulinganisha safari. Onyesho la mfano — sio matokeo ya mwanachama mahususi.',

      'reviews.tag': 'Hadithi Halisi',
      'reviews.title1': 'Wanachama wa',
      'reviews.title2': 'Nairobi Wanasema',
      'reviews.lede': 'Usiamini neno letu. Haya ni matokeo ya wanachama wetu.',

      'booking.tag': 'Bila Hatari',
      'booking.title1': 'Pata',
      'booking.title2': 'Pasi Yako ya Bure',
      'booking.lede': 'Jaribu vifaa, kutana na makocha. Hakuna ahadi ndefu.',
      'booking.includedTitle': 'Kilichojumuishwa:',
      'booking.inc1': 'Maelekezo ya mazoezi ya 1-kwa-1',
      'booking.inc2': 'Ufikiaji kamili wa Chuma na Cardio',
      'booking.inc3': 'Sauna ya bure na majaribio ya mvuke',
      'booking.inc4': 'Muundo wa mwili na uchambuzi wa BMI',
      'booking.preferChat': 'Unapendelea kuzungumza kwanza?',
      'booking.pickTitle': 'Chagua muda. Tutathibitisha kwenye WhatsApp.',
      'booking.passType': 'Aina ya pasi',
      'booking.pass.free': 'Pasi ya Siku ya Bure',
      'booking.date': 'Tarehe unayopendelea',
      'booking.time': 'Muda unaopendelea',
      'booking.time.placeholder': 'Chagua muda',
      'booking.widgetNote': 'Utahamishwa na ujumbe uliojazwa mapema.',
      'booking.or': 'au',

      'contact.tag': 'Tembelea Leo',
      'contact.title1': 'Tupo Katika',
      'contact.title2': 'Moyo wa Imara Daima',
      'contact.lede': 'Ufikiaji rahisi kwa wakazi wa Imara Daima, South B, Bellevue, na Mombasa Road.',
      'contact.address': 'Anwani',
      'contact.call': 'Piga / WhatsApp',
      'contact.email': 'Barua Pepe',
      'contact.hours': 'Saa za Kazi',
      'contact.loadMap': 'Bofya kupakia ramani',
      'contact.loadMapNote': 'Inafungua Google Maps · maudhui ya mtu wa tatu',

      'form.title': 'Tuma Ujumbe wa WhatsApp',
      'form.lede': 'Jaza maelezo yako na tutafungua WhatsApp na ujumbe wako.',
      'form.name': 'Jina Lako *',
      'form.phone': 'Simu / WhatsApp *',
      'form.message': 'Tunaweza kukusaidiaje? *',

      'social.tag': 'Fuata Kazi',
      'social.title1': 'Mpya kutoka',
      'social.title2': '@fleshandbonesgym',

      'faq.tag': 'Majibu Wazi',
      'faq.title1': 'Maswali',
      'faq.title2': 'Yanayoulizwa Mara kwa Mara',

      'footer.quick': 'Viungo vya Haraka',
      'footer.contact': 'Mawasiliano ya Moja kwa moja',
      'footer.connect': 'Ungana Nasi',
      'footer.bookTrial': 'Weka Jaribio la Bure'
    }
  };

  let currentLang = 'en';

  function applyLanguage(lang) {
    if (!TRANSLATIONS[lang]) return;
    currentLang = lang;
    document.documentElement.lang = lang;

    document.querySelectorAll('[data-i18n]').forEach((el) => {
      const key = el.dataset.i18n;
      const translated = TRANSLATIONS[lang][key];
      if (translated !== undefined) {
        el.innerHTML = translated;
      }
    });

    const toggle = document.getElementById('langToggle');
    if (toggle) {
      toggle.textContent = lang === 'en' ? 'SW' : 'EN';
      toggle.setAttribute(
        'aria-label',
        lang === 'en' ? 'Switch language to Kiswahili' : 'Switch language to English'
      );
    }

    // Announce change for screen readers
    const announce = document.getElementById('langAnnounce');
    if (announce) {
      announce.textContent = lang === 'sw'
        ? 'Lugha imebadilishwa kuwa Kiswahili'
        : 'Language switched to English';
    }

    safeStorageSet('fb_lang', lang);
  }

  let preferredLang = 'en';
  const stored = safeStorageGet('fb_lang');
  if (stored === 'sw' || stored === 'en') preferredLang = stored;
  else if (navigator.language && navigator.language.toLowerCase().startsWith('sw')) preferredLang = 'sw';

  const langToggle = document.getElementById('langToggle');
  if (langToggle) {
    langToggle.addEventListener('click', () => {
      applyLanguage(currentLang === 'en' ? 'sw' : 'en');
    });
  }

  if (preferredLang === 'sw') applyLanguage('sw');

  // ------------------------------------------------------------
  // Mobile Navigation + Focus trap
  // ------------------------------------------------------------
  const hamburger = document.getElementById('hamburger');
  const navLinks = document.getElementById('navLinks');
  let releaseTrap = null;

  function trapFocus(container) {
    const sel = 'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])';
    const items = Array.from(container.querySelectorAll(sel)).filter((el) => el.offsetParent !== null);
    if (!items.length) return () => {};
    const first = items[0];
    const last = items[items.length - 1];

    function onKey(e) {
      if (e.key !== 'Tab') return;
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
    document.addEventListener('keydown', onKey);
    first.focus();
    return () => document.removeEventListener('keydown', onKey);
  }

  function toggleNav(forceClose = false) {
    if (!hamburger || !navLinks) return;
    const isOpen = navLinks.classList.contains('open');
    const shouldOpen = forceClose ? false : !isOpen;

    hamburger.classList.toggle('active', shouldOpen);
    navLinks.classList.toggle('open', shouldOpen);
    hamburger.setAttribute('aria-expanded', shouldOpen ? 'true' : 'false');
    document.body.style.overflow = shouldOpen ? 'hidden' : '';

    if (shouldOpen) {
      releaseTrap = trapFocus(navLinks);
    } else if (releaseTrap) {
      releaseTrap();
      releaseTrap = null;
    }
  }

  if (hamburger) hamburger.addEventListener('click', () => toggleNav());
  if (navLinks) {
    navLinks.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => toggleNav(true));
    });
  }
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && navLinks && navLinks.classList.contains('open')) {
      toggleNav(true);
      if (hamburger) hamburger.focus();
    }
  });

  // ------------------------------------------------------------
  // Scroll progress
  // ------------------------------------------------------------
  const progressBar = document.getElementById('scrollProgress');
  function updateProgress() {
    if (!progressBar) return;
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const pct = docHeight > 0 ? Math.min(100, (scrollTop / docHeight) * 100) : 0;
    progressBar.style.width = pct + '%';
  }
  window.addEventListener('scroll', throttle(updateProgress, 30), { passive: true });
  updateProgress();

  // ------------------------------------------------------------
  // Scroll effects: navbar + back-to-top
  // ------------------------------------------------------------
  const navbar = document.getElementById('navbar');
  const backToTop = document.getElementById('backToTop');
  const onScroll = throttle(() => {
    const y = window.scrollY;
    if (navbar) navbar.classList.toggle('scrolled', y > 40);
    if (backToTop) backToTop.classList.toggle('visible', y > 400);
  }, 100);
  window.addEventListener('scroll', onScroll, { passive: true });
  if (backToTop) {
    backToTop.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // ------------------------------------------------------------
  // Reveal animations
  // ------------------------------------------------------------
  const revealElements = document.querySelectorAll(
    '.plan-card, .trainer-card, .amenity-card, .testimonial-card, .gallery-item, .tt-item, .step-card, .featured-quote'
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
    revealElements.forEach((el) => el.classList.add('revealed'));
  }

  // ------------------------------------------------------------
  // Active nav link highlight
  // ------------------------------------------------------------
  const sections = document.querySelectorAll('section[id]');
  const navAnchors = document.querySelectorAll('.nav-links a');
  if ('IntersectionObserver' in window) {
    const sectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const id = entry.target.id;
            navAnchors.forEach((a) => {
              const isActive = a.getAttribute('href') === '#' + id;
              a.classList.toggle('active', isActive);
              if (isActive) a.setAttribute('aria-current', 'page');
              else a.removeAttribute('aria-current');
            });
          }
        });
      },
      { rootMargin: '-30% 0px -60% 0px' }
    );
    sections.forEach((s) => sectionObserver.observe(s));
  }

  // ------------------------------------------------------------
  // Hero stat counter (respects reduced motion)
  // ------------------------------------------------------------
  const stats = document.querySelectorAll('.hero-stats .stat h3');
  let statsAnimated = false;
  if (!prefersReducedMotion && 'IntersectionObserver' in window) {
    const statsObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !statsAnimated) {
            statsAnimated = true;
            stats.forEach((stat) => {
              const text = stat.innerText;
              if (text.indexOf(':') !== -1) return;
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
  }

  // ------------------------------------------------------------
  // Contact form: per-field validation + draft persistence
  // ------------------------------------------------------------
  const contactForm = document.getElementById('contactForm');
  const DRAFT_KEY = 'fb_contact_draft';

  if (contactForm) {
    const fields = contactForm.querySelectorAll('input[required], textarea[required]');

    function validateField(input) {
      const errorEl = document.getElementById(input.id + 'Error');
      let message = '';
      const phoneRe = /^[0-9+\s()\-]{7,}$/;

      if (input.validity.valueMissing) {
        switch (input.id) {
          case 'contactName': message = 'Please enter your name.'; break;
          case 'contactPhone': message = 'Please enter your phone number.'; break;
          case 'contactMessage': message = 'Please tell us how we can help.'; break;
          default: message = 'Please fill in this field.';
        }
      } else if (input.validity.tooShort) {
        message = 'Please use at least ' + input.minLength + ' characters.';
      } else if (input.validity.typeMismatch) {
        message = input.type === 'tel'
          ? 'Please enter a valid phone number (e.g. 0702555093).'
          : 'Please enter a valid value.';
      } else if (input.type === 'tel' && input.value.trim() && !phoneRe.test(input.value.trim())) {
        message = 'Please enter a valid phone number (e.g. 0702555093).';
      }

      if (errorEl) errorEl.textContent = message;
      if (message) input.setAttribute('aria-invalid', 'true');
      else input.removeAttribute('aria-invalid');
      return !message;
    }

    const saveDraft = debounce(() => {
      try {
        const data = {
          name: document.getElementById('contactName').value,
          phone: document.getElementById('contactPhone').value,
          message: document.getElementById('contactMessage').value
        };
        safeStorageSet(DRAFT_KEY, JSON.stringify(data));
      } catch (e) {}
    }, 500);

    function restoreDraft() {
      try {
        const raw = safeStorageGet(DRAFT_KEY);
        if (!raw) return;
        const data = JSON.parse(raw);
        if (data.name) document.getElementById('contactName').value = data.name;
        if (data.phone) document.getElementById('contactPhone').value = data.phone;
        if (data.message) document.getElementById('contactMessage').value = data.message;
      } catch (e) {}
    }

    function clearDraft() {
      safeStorageRemove(DRAFT_KEY);
    }

    restoreDraft();
    fields.forEach((field) => {
      field.addEventListener('blur', () => validateField(field));
      field.addEventListener('input', saveDraft);
    });

    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();
      let firstInvalid = null;
      fields.forEach((field) => {
        if (!validateField(field) && !firstInvalid) firstInvalid = field;
      });
      if (firstInvalid) {
        firstInvalid.focus();
        showToast('!', 'Check the highlighted fields', 'Please correct the errors and try again.');
        return;
      }

      const name = document.getElementById('contactName').value.trim();
      const phone = document.getElementById('contactPhone').value.trim();
      const msg = document.getElementById('contactMessage').value.trim();

      showToast('OK', 'Opening WhatsApp...', 'Redirecting with your message pre-filled.');
      trackEvent('contact:submit-success');

      const text = 'Hi Flesh & Bones Gym! My name is ' + name + ' (' + phone + ').\n\n' + msg;
      setTimeout(() => {
        window.open('https://wa.me/254702555093?text=' + encodeURIComponent(text), '_blank', 'noopener');
      }, 700);

      clearDraft();
      contactForm.reset();
      fields.forEach((f) => f.removeAttribute('aria-invalid'));
      contactForm.querySelectorAll('.form-error').forEach((el) => (el.textContent = ''));
    });
  }

  // ------------------------------------------------------------
  // Booking widget — subscription-aware fields
  // ------------------------------------------------------------
  const bookingWidget = document.getElementById('bookingWidget');
  if (bookingWidget) {
    const dateInput = document.getElementById('bwDate');
    const timeInput = document.getElementById('bwTime');
    const passInput = document.getElementById('bwPass');
    const errorEl = document.getElementById('bwError');
    const timeRow = document.getElementById('bwTimeRow');
    const dateLabel = document.getElementById('bwDateLabel');

    // min date from local time, not UTC
    if (dateInput) dateInput.min = localIsoDate(new Date());

    // restore draft
    try {
      const draftRaw = safeStorageGet('fb_booking_draft');
      if (draftRaw) {
        const draft = JSON.parse(draftRaw);
        if (draft.pass && passInput) passInput.value = draft.pass;
        if (draft.date && dateInput) dateInput.value = draft.date;
        if (draft.time && timeInput) timeInput.value = draft.time;
      }
    } catch (e) {}

    function updateBookingFields() {
      if (!passInput) return;
      const isSubscription = /Monthly|Quarterly/.test(passInput.value);
      if (timeRow) timeRow.style.display = isSubscription ? 'none' : '';
      if (timeInput) timeInput.required = !isSubscription;
      if (dateInput) dateInput.required = true;
      if (dateLabel) {
        dateLabel.textContent = isSubscription ? 'Preferred start date' : 'Preferred date';
      }
      if (isSubscription && timeInput) timeInput.value = '';
      if (errorEl) errorEl.textContent = '';
    }

    if (passInput) {
      passInput.addEventListener('change', updateBookingFields);
      updateBookingFields();
    }

    bookingWidget.addEventListener('submit', (e) => {
      e.preventDefault();
      const pass = passInput.value;
      const isSubscription = /Monthly|Quarterly/.test(pass);
      const date = dateInput.value;
      const time = isSubscription ? null : timeInput.value;

      if (!pass || !date || (!isSubscription && !time)) {
        if (errorEl) {
          errorEl.textContent = isSubscription
            ? 'Please choose a membership and a start date.'
            : 'Please choose a pass, date, and time.';
        }
        const focusTarget = !date ? dateInput : (!isSubscription && !time ? timeInput : passInput);
        if (focusTarget) focusTarget.focus();
        return;
      }
      if (errorEl) errorEl.textContent = '';

      const d = new Date(date + 'T00:00:00');
      const formatted = d.toLocaleDateString('en-KE', {
        weekday: 'short', day: 'numeric', month: 'short', year: 'numeric'
      });

      const text = isSubscription
        ? 'Hi! I\'d like to start the ' + pass + ' on ' + formatted + '. Please confirm.'
        : 'Hi! I\'d like to book a ' + pass + ' for ' + formatted + ' at ' + time + '. Please confirm.';

      try {
        safeStorageSet('fb_booking_draft', JSON.stringify({ pass, date, time: time || '' }));
      } catch (e) {}

      trackEvent('booking:widget-success');
      showToast('OK', 'Opening WhatsApp...', 'Your booking details are ready to send.');
      setTimeout(() => {
        window.open('https://wa.me/254702555093?text=' + encodeURIComponent(text), '_blank', 'noopener');
      }, 700);
    });
  }

  // ------------------------------------------------------------
  // Timetable + ICS download
  // ------------------------------------------------------------
  const TIMETABLE = {
    mon: [
      { time: '06:00', title: 'Barbell & Iron', coach: 'Kevin', duration: 60, intensity: 'High' },
      { time: '18:30', title: 'Barbell & Iron', coach: 'Kevin', duration: 60, intensity: 'High' }
    ],
    tue: [
      { time: '06:30', title: 'Nairobi Burn HIIT', coach: 'Sarah', duration: 45, intensity: 'High' },
      { time: '17:30', title: 'Nairobi Burn HIIT', coach: 'Sarah', duration: 45, intensity: 'High' }
    ],
    wed: [
      { time: '06:00', title: 'Barbell & Iron', coach: 'Kevin', duration: 60, intensity: 'High' },
      { time: '19:15', title: 'BoxFit & Conditioning', coach: 'Sarah', duration: 45, intensity: 'High' }
    ],
    thu: [
      { time: '06:30', title: 'Nairobi Burn HIIT', coach: 'Sarah', duration: 45, intensity: 'High' },
      { time: '17:30', title: 'Nairobi Burn HIIT', coach: 'Sarah', duration: 45, intensity: 'High' }
    ],
    fri: [
      { time: '06:00', title: 'Barbell & Iron', coach: 'Kevin', duration: 60, intensity: 'High' },
      { time: '18:30', title: 'Barbell & Iron', coach: 'Kevin', duration: 60, intensity: 'High' }
    ],
    sat: [
      { time: '06:30', title: 'Nairobi Burn HIIT', coach: 'Sarah', duration: 45, intensity: 'High' }
    ],
    sun: [
      { time: '08:30', title: 'Steam & Stretch Recovery', coach: 'Mercy', duration: 60, intensity: 'Low' }
    ]
  };

  const DAY_INDEX = { sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6 };

  function makeICSDate(date) {
    const pad = (n) => String(n).padStart(2, '0');
    return date.getFullYear() +
      pad(date.getMonth() + 1) +
      pad(date.getDate()) +
      'T' +
      pad(date.getHours()) +
      pad(date.getMinutes()) +
      '00';
  }

  function getNextOccurrence(dayKey, hhmm) {
    const parts = hhmm.split(':');
    const h = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10);
    const targetIdx = DAY_INDEX[dayKey];
    const now = new Date();
    const diff = (targetIdx - now.getDay() + 7) % 7;
    const candidate = new Date(now);
    candidate.setDate(now.getDate() + diff);
    candidate.setHours(h, m, 0, 0);
    if (candidate <= now) candidate.setDate(candidate.getDate() + 7);
    return candidate;
  }

  function buildICS(opts) {
    const end = new Date(opts.start.getTime() + opts.durationMin * 60000);
    const uid = 'fb-' + Math.random().toString(36).slice(2) + '@fleshandbonesgym.com';
    const stamp = makeICSDate(new Date());
    return [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Flesh and Bones Gym//EN',
      'BEGIN:VEVENT',
      'UID:' + uid,
      'DTSTAMP:' + stamp,
      'DTSTART:' + makeICSDate(opts.start),
      'DTEND:' + makeICSDate(end),
      'SUMMARY:' + opts.title + ' (Flesh & Bones)',
      'LOCATION:' + opts.location,
      'DESCRIPTION:Coach ' + opts.coach + ' - ' + opts.durationMin + ' min',
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');
  }

  function downloadICS(ics, filename) {
    const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  const timetableContainer = document.querySelector('[data-timetable]');
  if (timetableContainer) {
    const tabs = timetableContainer.querySelectorAll('[role="tab"]');
    const list = timetableContainer.querySelector('#timetableList');

    function renderDay(dayKey) {
      if (!list) return;
      const classes = TIMETABLE[dayKey] || [];
      list.innerHTML = '';
      if (!classes.length) {
        const p = document.createElement('p');
        p.className = 'timetable-static';
        p.textContent = 'Rest day — recovery is training too.';
        list.appendChild(p);
        return;
      }
      classes.forEach((cls) => {
        const item = document.createElement('div');
        item.className = 'tt-item reveal-init';

        const timeEl = document.createElement('div');
        timeEl.className = 'tt-time';
        timeEl.textContent = cls.time;

        const bodyEl = document.createElement('div');
        bodyEl.className = 'tt-body';
        const h4 = document.createElement('h4');
        h4.textContent = cls.title;
        const meta = document.createElement('div');
        meta.className = 'tt-meta';
        meta.innerHTML =
          'Coach ' + cls.coach + ' &middot; ' + cls.duration + ' min &middot; ' +
          '<span class="tt-intensity">' + cls.intensity + '</span>';
        bodyEl.appendChild(h4);
        bodyEl.appendChild(meta);

        const addBtn = document.createElement('button');
        addBtn.type = 'button';
        addBtn.className = 'tt-add';
        addBtn.setAttribute('aria-label', 'Add ' + cls.title + ' to calendar');
        addBtn.innerHTML = '<svg class="icon" aria-hidden="true"><use href="#icon-calendar-plus"/></svg> Add';

        addBtn.addEventListener('click', () => {
          const start = getNextOccurrence(dayKey, cls.time);
          const ics = buildICS({
            title: cls.title,
            coach: cls.coach,
            location: 'Flesh and Bones Gym, Imara Daima Business Park, Nairobi',
            start: start,
            durationMin: cls.duration
          });
          downloadICS(ics, 'fleshandbones-' + dayKey + '-' + cls.time.replace(':', '') + '.ics');
          trackEvent('timetable:ics:' + dayKey + ':' + cls.time);
          showToast('OK', 'Calendar file downloaded', 'Open it to add this class to your calendar.');
        });

        item.appendChild(timeEl);
        item.appendChild(bodyEl);
        item.appendChild(addBtn);
        list.appendChild(item);
        requestAnimationFrame(() => item.classList.add('revealed'));
      });
    }

    function selectDay(dayKey) {
      tabs.forEach((tab) => {
        const isSel = tab.dataset.day === dayKey;
        tab.setAttribute('aria-selected', isSel ? 'true' : 'false');
      });
      // Update tabpanel aria-labelledby to active tab
      if (list) list.setAttribute('aria-labelledby', 'tab-' + dayKey);
      renderDay(dayKey);
    }

    const dayKeys = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
    const todayKey = dayKeys[new Date().getDay()];
    selectDay(TIMETABLE[todayKey] ? todayKey : 'mon');

    tabs.forEach((tab) => {
      tab.addEventListener('click', () => selectDay(tab.dataset.day));
      tab.addEventListener('keydown', (e) => {
        const idx = Array.from(tabs).indexOf(tab);
        let next = idx;
        if (e.key === 'ArrowRight') next = (idx + 1) % tabs.length;
        else if (e.key === 'ArrowLeft') next = (idx - 1 + tabs.length) % tabs.length;
        else return;
        e.preventDefault();
        tabs[next].focus();
        tabs[next].click();
      });
    });
  }

  // ------------------------------------------------------------
  // Before / After slider
  // ------------------------------------------------------------
  const baFigure = document.querySelector('[data-ba]');
  if (baFigure) {
    const input = baFigure.querySelector('[data-ba-input]');
    const setSplit = (v) => {
      baFigure.style.setProperty('--split', v + '%');
      if (input) {
        input.setAttribute('aria-valuetext', v + ' percent before, ' + (100 - v) + ' percent after');
      }
    };
    if (input) {
      input.addEventListener('input', () => setSplit(input.value));
      setSplit(input.value);
    }
  }

  // ------------------------------------------------------------
  // Savings calculator (debounced live region for screen readers)
  // ------------------------------------------------------------
  const visitsRange = document.getElementById('visitsRange');
  const visitsOut = document.getElementById('visitsOut');
  const calcDaily = document.getElementById('calcDaily');
  const calcSaveMonthly = document.getElementById('calcSaveMonthly');
  const calcSaveQuarterly = document.getElementById('calcSaveQuarterly');
  const calcAnnounce = document.getElementById('calcAnnounce');

  const announceCalc = debounce((msg) => {
    if (calcAnnounce) calcAnnounce.textContent = msg;
  }, 800);

  if (visitsRange) {
    const DAILY = 300;
    const MONTHLY = 3500;
    const QUARTERLY_MO = 3000;

    function fmt(n) { return n.toLocaleString('en-KE'); }

    function recalc() {
      const visits = parseInt(visitsRange.value, 10);
      const dailyCost = visits * DAILY;
      const saveMonthly = Math.max(0, dailyCost - MONTHLY);
      const saveQuarterly = Math.max(0, dailyCost - QUARTERLY_MO);

      if (visitsOut) visitsOut.textContent = visits;
      if (calcDaily) calcDaily.textContent = fmt(dailyCost);
      if (calcSaveMonthly) calcSaveMonthly.textContent = 'Save KES ' + fmt(saveMonthly);
      if (calcSaveQuarterly) calcSaveQuarterly.textContent = 'Save KES ' + fmt(saveQuarterly) + ' / mo';

      announceCalc(
        'Visits: ' + visits + ' per month. Daily passes total ' + fmt(dailyCost) +
        ' KES. Monthly Beast saves ' + fmt(saveMonthly) +
        ' KES. Quarterly saves ' + fmt(saveQuarterly) + ' KES per month.'
      );
    }
    visitsRange.addEventListener('input', recalc);
    recalc();
  }

  // ------------------------------------------------------------
  // Click-to-load map
  // ------------------------------------------------------------
  const mapEmbed = document.getElementById('mapEmbed');
  const mapLoadBtn = document.getElementById('mapLoadBtn');
  if (mapEmbed && mapLoadBtn) {
    mapLoadBtn.addEventListener('click', () => {
      const src = mapEmbed.dataset.mapSrc;
      const iframe = document.createElement('iframe');
      iframe.src = src;
      iframe.loading = 'lazy';
      iframe.title = 'Map showing Flesh and Bones Gym location';
      iframe.setAttribute('referrerpolicy', 'no-referrer-when-downgrade');
      mapEmbed.innerHTML = '';
      mapEmbed.appendChild(iframe);
      trackEvent('map:loaded');
    });
  }

  // ------------------------------------------------------------
  // Service Worker
  // ------------------------------------------------------------
  if ('serviceWorker' in navigator && location.protocol.indexOf('http') === 0) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('sw.js').catch(() => {
        // Service worker is enhancement only; ignore registration failures.
      });
    });
  }
})();