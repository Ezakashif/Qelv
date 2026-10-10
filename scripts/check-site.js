"use strict";

/**
 * Static integrity checks for the site:
 *  1. Every local href/src/url()/manifest reference resolves to a real file.
 *  2. Every in-page #fragment link targets an existing id.
 *  3. No build hostname appears in any site file (acceptance criterion 3).
 *  4. No inline <style> blocks or style="" attributes (CSS lives in css/ only).
 */

const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");
const HTML_FILES = ["index.html", "index2.html", "index3.html", "404.html"];
const SCAN_DIRS = ["css", "js", "assets"];
const SCAN_FILES = [...HTML_FILES, "robots.txt", "site.webmanifest"];
const FORBIDDEN_HOSTS = ["advanced-datalytics.digital"];
const LOCAL_META = /^(?:assets|css|js)\//;

const errors = [];

function read(rel) {
  return fs.readFileSync(path.join(ROOT, rel), "utf8");
}

function walk(dir) {
  const out = [];
  for (const entry of fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true })) {
    const rel = path.posix.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(rel));
    else out.push(rel);
  }
  return out;
}

function isExternal(ref) {
  return /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(ref);
}

function checkLocalRef(fromFile, ref) {
  if (!ref || isExternal(ref) || ref.startsWith("#")) return;
  const clean = ref.split(/[?#]/)[0];
  if (!clean) return;
  if (clean.startsWith("/")) {
    errors.push(`${fromFile}: root-relative reference "${ref}" breaks sub-path hosting; use a relative path`);
    return;
  }
  const target = path.resolve(path.dirname(path.join(ROOT, fromFile)), clean);
  if (!fs.existsSync(target)) errors.push(`${fromFile}: missing asset "${ref}"`);
}

for (const file of HTML_FILES) {
  const html = read(file);

  for (const match of html.matchAll(/\b(href|src|content)\s*=\s*"([^"]+)"/g)) {
    const [, attr, ref] = match;
    if (attr === "content" && !LOCAL_META.test(ref)) continue;
    checkLocalRef(file, ref);
  }

  const ids = new Set([...html.matchAll(/\bid\s*=\s*"([^"]+)"/g)].map((m) => m[1]));
  for (const match of html.matchAll(/\bhref\s*=\s*"#([^"]*)"/g)) {
    if (match[1] && !ids.has(match[1])) {
      errors.push(`${file}: in-page link "#${match[1]}" has no matching id`);
    }
  }

  if (/<style[\s>]/i.test(html)) errors.push(`${file}: inline <style> block found; move rules to css/`);
  if (/\sstyle\s*=\s*"/i.test(html)) errors.push(`${file}: inline style="" attribute found`);
}

for (const file of walk("css")) {
  if (!file.endsWith(".css")) continue;
  for (const match of read(file).matchAll(/url\(\s*["']?([^"')]+)["']?\s*\)/g)) {
    if (!match[1].startsWith("data:")) checkLocalRef(file, match[1]);
  }
}

const manifest = JSON.parse(read("site.webmanifest"));
for (const icon of manifest.icons || []) checkLocalRef("site.webmanifest", icon.src);

const allFiles = [...SCAN_FILES, ...SCAN_DIRS.flatMap(walk)];
for (const file of allFiles) {
  if (/\.(?:png|jpe?g|gif|webp|ico|woff2?)$/i.test(file)) continue;
  const text = read(file).toLowerCase();
  for (const host of FORBIDDEN_HOSTS) {
    if (text.includes(host)) errors.push(`${file}: forbidden build hostname "${host}"`);
  }
}

if (errors.length) {
  console.error(`check-site: ${errors.length} problem(s)\n  - ${errors.join("\n  - ")}`);
  process.exit(1);
}

console.log(`check-site: OK (${HTML_FILES.length} pages, ${allFiles.length} files scanned)`);
