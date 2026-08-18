D3 — Satellite Data Labs home page (local build)

What this folder is
A single marketing page for Satellite Data Labs, ready to upload to the Qelv build host.
It does not modify hotelcompete.com or the live portal.

Files
- index.html                 Direction 1 — editorial / split (also A/B/C theme toggles)
- index2.html                Direction 2 — typographic poster (stacked wordmark, green band)
- index3.html                Direction 3 — dark lab / signal (sticky login dock)
- css/brand.css              ONLY place for wordmark, colours, fonts, logo path (page-2 / page-3 too)
- css/main.css               Layout for index.html
- css/main2.css              Layout for index2.html
- css/main3.css              Layout for index3.html
- assets/logo-placeholder.svg
- Outstanding_Content_Register.txt
- BRAND.md                   Short note on where brand tokens live

Portal link (canonical client login)
https://portal.hotelcompete.com/

Do not
- Put the build hostname in any file in this folder
- Edit hotelcompete.com
- Point this page at admin login or a bare IP

Upload (when Faizan confirms access)
Upload the contents of this folder to the web root of advanced-datalytics.digital so index.html is served over HTTPS.
