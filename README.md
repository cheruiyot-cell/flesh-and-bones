## v2 — Audit remediation notes

This release implements the P0–P3 findings from the mobile-first audit. Highlights:

### Conversion
- **`tel:` click-to-call** added to the contact block, footer, nav-actions, and booking pre-chat box.
- Hours copy unified across hero trust strip, contact section, and `ExerciseGym` JSON-LD.
- Booking widget now hides the *time* field for Monthly/Quarterly subscriptions (only a start date is required).
- **"Your First Visit"** 3-step section added before the booking section to answer "what happens when I show up?"

### Performance
- **Font Awesome CDN removed** — replaced with a ~33-icon inline SVG sprite (`<use href="#icon-…">`). Saves ~100 KB from first paint.
- Service worker rewired to **stale-while-revalidate** for same-origin assets. The manual `v1 → v2` cache bump is no longer required to ship CSS/JS updates safely; successful navigations are also cached for offline.
- `content-visibility: auto` **removed** from `.section` — the CLS risk from `contain-intrinsic-size: auto 500px` outweighed the marginal paint gain on a page this size.
- Hero `min-height` capped to `min(100svh, 720px)` to prevent excessive scroll on small phones.

### Accessibility
- Icon system now uses inline `<svg>` with `aria-hidden="true"` — no icon-font FOIT.
- **Language toggle announces** via a visually-hidden `aria-live` region (`#langAnnounce`).
- **Savings calculator** results announced via debounced `aria-live` region (`#calcAnnounce`).
- **Timetable tabpanel** now sets `aria-labelledby` dynamically to the active tab.
- **Contact form error messages** are field-specific ("Please enter your name", "Please enter a valid phone number") instead of generic.
- **Theme toggle icon** swaps via CSS `[data-theme]` selector (no `innerHTML` rewrite).
- `.tt-meta` no longer uppercased at 16px on mobile.
- WhatsApp float min-size enforced (44×44).
- Timetable tabs 4+3 wrapped at ≤480px (44×44 min).

### Trust & SEO
- **Featured testimonial** moved below the hero — social proof is now visible in the first scroll.
- Gallery moved after testimonials (supporting evidence after social proof).
- `og:url`, `og:type`, `og:image:width/height`, `og:site_name`, `twitter:card`, `twitter:title/description/image` added.
- `<meta name="keywords">` removed (obsolete).
- FAQ JSON-LD answers **synced verbatim** with the visible `<details>` copy.
- `<noscript>` fallback added to the map block (direct Google Maps link).
- "Reviews" unhidden in the mobile nav.

### Bug fixes
- Booking `min` date now uses **local** timezone (previously UTC — off-by-one near midnight for Nairobi users).
- `localStorage` access wrapped in try/catch — safe in Safari private mode.

### Self-hosting still recommended for production
The Unsplash image dependency was **not** removed in this pass, as self-hosting requires downloading and converting ~13 images to AVIF/WebP at their rendered dimensions. For a real launch:

```bash
# one-time, per image
npx @squoosh/cli --avif '{"cqLevel":30}' --webp '{"quality":75}' hero.jpg