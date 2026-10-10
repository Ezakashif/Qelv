# Site audit — Satellite Data Labs (D3)

Scope: the whole repository (three HTML directions, CSS, assets, config and delivery).
Status key: **Fixed** = resolved in this branch · **Open** = needs a decision or input.

## Critical / high

| # | Finding | Impact | Status |
|---|---------|--------|--------|
| 1 | `css/main.css` contained the index.html stylesheet pasted ~3×, plus a 4th copy inline in `index.html`, with contradictory `.btn`, `.hero__grid` and `.approach__list` rules | Unpredictable layout, last-write-wins styling, 973 lines of dead weight | **Fixed** — rewritten from scratch, single source, inline styles banned by lint |
| 2 | Global `* { transition: all … }` | Jank on every repaint, animated layout shifts, ignores reduced-motion | **Fixed** — scoped transitions, `prefers-reduced-motion` honoured |
| 3 | No CI/CD at all | Regressions shipped silently; no repeatable deploy | **Fixed** — `ci.yml`, `deploy-pages.yml`, `deploy-ftp.yml` |
| 4 | Content register (deployed alongside the site) names the build host | Violates acceptance criterion 3 if uploaded "as the folder" | **Fixed** — build ships only publishable files and fails if the host appears in `dist/`; public links to the register removed |
| 5 | Brand links used `href="/"` | Broken when hosted under a sub-path (e.g. GitHub Pages project site) | **Fixed** — relative links; check-site rejects root-relative paths |
| 6 | `npm start` used `$PORT` | Fails on Windows | **Fixed** — `serve .` |

## Medium

| # | Finding | Status |
|---|---------|--------|
| 7 | Census section was a hidden, empty `div` (unaccounted project) | **Fixed** — visible "Planned" card/section on all three directions |
| 8 | Missing favicon, touch icon, OG image, web manifest, 404 page; `robots.txt` empty | **Fixed** — placeholder SVG set, manifest, 404, `robots.txt` disallows during review |
| 9 | No skip link, weak focus styles, nav not keyboard/mobile friendly, no landmarks on index2/3 | **Fixed** — skip links, `:focus-visible` ring, accessible mobile nav (Esc closes), `<main id>` everywhere |
| 10 | Text-heavy hero and approach list; no way to "see" the product | **Fixed** — interactive compset demo, animated stats, tabbed stepper, FAQ accordion, scroll-spy nav |
| 11 | Low contrast accent in Direction B; hard blue hero strip in C | **Fixed** — tokens adjusted |
| 12 | index2/index3 duplicated reset & chooser CSS | **Fixed** — shared `css/base.css` |
| 13 | Theme choice lost on reload | **Fixed** — persisted in `localStorage` |

## Open — needs a decision

| # | Concern | Recommendation |
|---|---------|----------------|
| 14 | **Third-party portal domain** (`portal.hotelcompete.com`) is the only primary CTA on a rebranded site | Confirm ownership/continuity; plan a `portal.satellitedatalabs.com` alias before DNS cutover (D5) |
| 15 | **Google Fonts**: index.html loads 6 families to power the A/B/C switcher | Privacy (IP sent to Google, GDPR) and ~150 KB+ font cost. Once a direction is chosen, self-host only its 2 families |
| 16 | Every page is `noindex` and `robots.txt` disallows all | Correct for review; **must** be flipped at launch or the site will not be indexed |
| 17 | Placeholder wordmark, logo, contact details, sales/support routes | Client to supply (see Outstanding_Content_Register.txt) |
| 18 | SVG-only favicon / OG image | Some social scrapers (Facebook, LinkedIn) and old iOS ignore SVG — add PNG exports when final artwork arrives |
| 19 | Three parallel directions ship together | After selection, delete the unused pages/CSS to cut maintenance |
| 20 | No analytics, CSP or security headers | Static host: add `Content-Security-Policy`, `Referrer-Policy`, HSTS at the server/CDN at launch |
| 21 | Deploy secrets | Pages: set Source = GitHub Actions. FTP: add `FTP_SERVER`, `FTP_USERNAME`, `FTP_PASSWORD` (job skips cleanly until set) |

## Guard-rails now enforced in CI

- stylelint, ESLint, html-validate (inline styles are errors)
- `scripts/check-site.js`: missing local files, broken `#anchors`, root-relative paths, inline styles, build hostname
- `scripts/build.js`: allow-list of publishable files; fails if the build host leaks into `dist/`
