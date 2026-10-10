"use strict";

/**
 * Copies only publishable site files into dist/.
 * Keeps tooling, configs, node_modules and internal notes out of the deployed web root.
 */

const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");
const DIST = path.join(ROOT, "dist");

const INCLUDE = [
  "index.html",
  "index2.html",
  "index3.html",
  "404.html",
  "robots.txt",
  "site.webmanifest",
  "css",
  "js",
  "assets"
];

fs.rmSync(DIST, { recursive: true, force: true });
fs.mkdirSync(DIST, { recursive: true });

for (const entry of INCLUDE) {
  const src = path.join(ROOT, entry);
  if (!fs.existsSync(src)) {
    console.error(`build: missing required entry "${entry}"`);
    process.exit(1);
  }
  fs.cpSync(src, path.join(DIST, entry), { recursive: true });
}

/* Disable Jekyll on GitHub Pages so every file is served as-is. */
fs.writeFileSync(path.join(DIST, ".nojekyll"), "");

/* Internal notes (e.g. the content register) name the build host; they must never ship. */
const FORBIDDEN_HOSTS = ["advanced-datalytics.digital"];
const walk = (dir) =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)]
  );
for (const file of walk(DIST)) {
  const text = fs.readFileSync(file, "utf8");
  for (const host of FORBIDDEN_HOSTS) {
    if (text.includes(host)) {
      console.error(`build: forbidden host "${host}" found in ${path.relative(ROOT, file)}`);
      process.exit(1);
    }
  }
}

console.log(`build: wrote ${INCLUDE.length} entries to dist/`);
