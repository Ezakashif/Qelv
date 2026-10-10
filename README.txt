D3 — Satellite Data Labs home page

What this folder is
A static marketing site for Satellite Data Labs (three design directions), plus tooling
that lints, integrity-checks, builds and deploys it. It does not modify hotelcompete.com
or the live portal.

Pages
- index.html     Direction 1 — editorial / split. Interactive: live compset demo, animated stats,
                 4-step "how it works" stepper, FAQ, A/B/C theme switcher (remembered per browser).
- index2.html    Direction 2 — typographic poster
- index3.html    Direction 3 — dark lab / signal (sticky login dock)
- 404.html       Not-found page (used by GitHub Pages and most hosts)

Source layout
- css/brand.css          ONLY place for wordmark, colours, fonts, logo path, spacing/motion tokens
- css/base.css           Shared reset, typography, buttons, skip link, direction chooser
- css/main.css           Layout for index.html
- css/main2.css          Layout for index2.html
- css/main3.css          Layout for index3.html
- js/main.js             Progressive-enhancement interactions (site works without JS)
- assets/                logo.svg, favicon.svg, apple-touch-icon.svg, og-image.svg (all placeholders)
- site.webmanifest, robots.txt
- scripts/check-site.js  Broken links/assets, anchors, root-relative paths, inline styles, build hostname
- scripts/build.js       Copies publishable files to dist/ (internal notes are excluded)
- Outstanding_Content_Register.txt, BRAND.md, AUDIT.md   Internal notes — never deployed

Local development (Node 20+)
  npm ci
  npm start          serve the folder at http://localhost:3000
  npm test           stylelint + eslint + html-validate + check-site
  npm run build      produce dist/

CI/CD (.github/workflows)
- ci.yml            Every push/PR: npm test + build on Node 20 and 22; dist/ uploaded as artifact.
- deploy-pages.yml  Push to main: deploy dist/ to GitHub Pages.
                    One-time: Settings -> Pages -> Source = "GitHub Actions".
- deploy-ftp.yml    Push to main: upload dist/ over FTPS. Skipped (green) until secrets exist:
                    FTP_SERVER, FTP_USERNAME, FTP_PASSWORD; optional FTP_SERVER_DIR, FTP_PROTOCOL.
                    Keep the build host in the FTP_SERVER secret, never in the repo.

Portal link (canonical client login)
https://portal.hotelcompete.com/

Do not
- Put the build hostname in any site file (enforced by check-site and build)
- Use root-relative paths ("/...") — the site must work from any sub-path
- Add inline styles; put brand values anywhere except css/brand.css
- Edit hotelcompete.com or point this page at admin login or a bare IP
