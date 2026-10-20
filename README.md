# Flesh and Bones Gym — Portfolio Demo

A mobile-first single-page site for a fictional Nairobi gym, built as a **portfolio demonstration** of a full audit → diagnose → remediate loop.

> **Portfolio demo** — business details, testimonials, coach bios, and before/after imagery are illustrative. Replace with verified information before any commercial launch.

---

## Quick start

The site is a **static HTML page** — no build step, no npm install, no framework.

```bash
# Option 1 — Python
python3 -m http.server 3000

# Option 2 — Node
npx serve -l 3000 .

# Option 3 — PHP
php -S localhost:3000
```

Then open <http://localhost:3000>.

> **Note:** the service worker only registers over HTTP(S). Open via `localhost` or HTTPS to test PWA behaviour.

---

## What's included

- **WhatsApp-first conversion** — every CTA opens WhatsApp with a contextual message.
- **Booking widget** — native date/time pickers, structured message, draft persistence.
- **Interactive timetable** with per-class `.ics` calendar download.
- **Bilingual EN ⇄ Kiswahili** toggle (core journey only).
- **Before/after slider** — keyboard, touch, and screen-reader accessible.
- **Savings calculator** — interactive range comparison.
- **Click-to-load Google Map** — no third-party iframe until the user opts in.
- **Per-coach booking** — each trainer card links to a dedicated WhatsApp CTA.
- **Contact form** — per-field validation, `aria-invalid`, draft persistence.
- **Dark/light theme** with persisted preference.
- **PWA** — installable, offline app shell.
- **Scroll progress bar** and reveal-on-scroll animations.
- **Full no-JS fallbacks** — navigation, FAQ, and legal all work without JavaScript.

---

## Stack

- **HTML5** — semantic landmarks, skip link, structured data (ExerciseGym, FAQPage, OfferCatalog).
- **CSS3** — variables, `clamp()`, `prefers-reduced-motion`, `@supports`.
- **Vanilla JavaScript** — deferred, IIFE-scoped, no framework.

---

## File structure

```
.
├── index.html
├── styles.css
├── scripts.js
├── manifest.webmanifest
├── sw.js
└── README.md
```

---

## Technical decisions

### Native `<details>` for FAQ & legal
FAQ and legal sections use native `<details>`/`<summary>` so they work **without JavaScript**. Answers remain keyboard and screen-reader accessible by default.

### Progressive enhancement of mobile nav
`<html class="no-js">` is swapped to `class="js"` in `<head>` before render. Without JS, the nav is a **visible wrapped list**. With JS, it becomes a drawer.

### No framework, by choice
The site is a single page with ~600 lines of behaviour. A framework would add hundreds of KB of JS, a build step, and state bugs that don't exist here.

### i18n scope is deliberate
The EN ⇄ SW toggle translates the **core journey** (nav, hero, CTAs, form labels, section headers, footer). Testimonial copy, plan features, and legal text stay in English. Real bilingual sites are pragmatic about coverage.

**Note:** Swahili copy is best-effort and should be reviewed by a native speaker before production.

### ICS uses floating local time
Calendar downloads use floating local time (`DTSTART:20260412T060000`, no `Z`). This is the correct format for a Nairobi gym: "06:00 in the user's local calendar." Full UTC conversion was rejected as over-engineering for a single-timezone business.

### Service worker is honest
- **HTML** — network-first (updates ship immediately)
- **Static assets** — cache-first
- **Cross-origin** — network only

A portfolio piece should demonstrate the pattern without pretending to be a production CDN strategy.

---

## Accessibility

Verified in code:

- Semantic landmarks, skip link, logical heading structure
- Keyboard-operable mobile drawer (Escape closes, focus returns to hamburger)
- Focus trap within open drawer
- Native `<details>`/`<summary>` FAQ
- Visible focus indicators (`:focus-visible`)
- `aria-invalid` + `aria-describedby` + `role="alert"` on validation errors
- Before/after slider implemented as native range input
- `prefers-reduced-motion` respected (CSS + JS counter + slider)
- 16px minimum body text on mobile
- Touch targets ≥ 44×44 for interactive controls

**Manual verification still required:**
- Colour contrast of small `--primary` labels
- Full screen-reader walk-through (VoiceOver / NVDA)
- 200% browser zoom
- Physical device test on a mid-range Android phone

---

## Deployment

Works on any static host: GitHub Pages, Netlify, Vercel, Cloudflare Pages.

The service worker uses relative paths, so it works on subpaths (e.g. `user.github.io/repo/`).

### Optional production build

```bash
npx lightningcss --minify styles.css -o styles.min.css
npx esbuild scripts.js --minify --outfile=scripts.min.js
```

Then update the two references in `index.html` to the `.min` files.

For further performance gains, self-host the two font families and swap Font Awesome for inline SVGs.

---

## Limitations

- **No backend.** All flows open WhatsApp with a pre-filled message. No data is stored server-side.
- **Illustrative content.** Business details and images are demo content.
- **Swahili copy** is best-effort.
- **Analytics** hooks (`data-track` attributes, `trackEvent()`) are present but no analytics script is loaded. Add your tool of choice when deploying.

---

## License

MIT — free to use as a reference.