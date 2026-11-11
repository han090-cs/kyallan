// Static quality checks for the generated GitHub Pages site. No third-party dependencies.
import fs from 'node:fs';
import crypto from 'node:crypto';
import path from 'node:path';

const ROOT = process.cwd();
const DIST = path.join(ROOT, 'dist');
const errors = [];
const warnings = [];
const exists = (p) => fs.existsSync(path.join(DIST, p));
const fail = (message) => errors.push(message);
const warn = (message) => warnings.push(message);

if (!exists('index.html')) {
  console.error('FAIL: dist/index.html is missing. Run `npm run build` first.');
  process.exit(1);
}
const html = fs.readFileSync(path.join(DIST, 'index.html'), 'utf8');
const site = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/data/site.json'), 'utf8'));

if (/\{\{[A-Z_]+\}\}/.test(html)) fail('Generated HTML still contains an unreplaced template placeholder.');
if (!/<html\s+lang="my"/i.test(html)) fail('HTML language should be declared as Myanmar (lang="my").');
if (!/<meta\s+name="viewport"/i.test(html)) fail('Viewport metadata is missing.');
if (!/<meta\s+name="description"/i.test(html)) fail('SEO description metadata is missing.');
if (!exists('sw.js')) fail('Service worker is missing from dist/.');
if (!exists('manifest.webmanifest')) fail('Web app manifest is missing from dist/.');
if (!html.includes('html[data-route=\"section\"] main>section:not(:target)') && !fs.readFileSync(path.join(DIST, 'css/style.css'), 'utf8').includes('html[data-route=\"section\"] main>section:not(:target)')) fail('Early section-route styling is missing; direct links may cause layout shift.');
if (exists('sw.js')) {
  const sw = fs.readFileSync(path.join(DIST, 'sw.js'), 'utf8');
  if (/__BUILD_HASH__/.test(sw) || !/const CACHE_NAME = 'kyallan-shell-v2-[a-f0-9]{12}'/.test(sw)) {
    fail('Service worker cache namespace was not stamped with this build’s content hash.');
  }
  if (!/new URL\('js\/app\.js', BASE\)\.href/.test(sw)) fail('Service worker does not precache the application JavaScript bundle.');
}

const ids = Array.from(html.matchAll(/\bid="([^"]+)"/g), (match) => match[1]);
const idCounts = new Map();
ids.forEach((id) => idCounts.set(id, (idCounts.get(id) || 0) + 1));
for (const [id, count] of idCounts) if (count > 1) fail(`Duplicate HTML id: ${id} (${count} times).`);

const expectedSections = site.groups.flatMap((group) => group.items.map((item) => item.id));
const actualSections = Array.from(html.matchAll(/<section\b[^>]*\bid="([^"]+)"/g), (match) => match[1]);
for (const id of expectedSections) if (!actualSections.includes(id)) fail(`Configured section "${id}" is absent from built HTML.`);
for (const id of actualSections) if (!expectedSections.includes(id)) warn(`HTML contains a section "${id}" not listed in src/data/site.json.`);
if (actualSections.length !== expectedSections.length) fail(`Expected ${expectedSections.length} sections but found ${actualSections.length}.`);

const knownIds = new Set(ids);
const localRefs = Array.from(html.matchAll(/\b(?:src|href)="([^"]+)"/g), (match) => match[1]);
for (const raw of localRefs) {
  if (raw.startsWith('#') && raw.length > 1) {
    let target;
    try { target = decodeURIComponent(raw.slice(1).split(/[?&]/)[0]); } catch { fail(`Malformed internal fragment: ${raw}`); continue; }
    if (!knownIds.has(target)) fail(`Internal link target is missing: ${raw}`);
    continue;
  }
  if (!raw || raw.startsWith('data:') || raw.startsWith('mailto:') || raw.startsWith('tel:')) continue;
  let url;
  try { url = new URL(raw, 'https://site.invalid/'); } catch { fail(`Malformed URL in HTML: ${raw}`); continue; }
  if (url.origin !== 'https://site.invalid') continue;
  const pathname = decodeURIComponent(url.pathname).replace(/^\/+/, '');
  if (!pathname) continue;
  if (!exists(pathname)) fail(`Local HTML resource is missing: ${raw}`);
}

// Ensure raster content is optimized and reserved space prevents image-induced layout shifts.
const imageRefs = Array.from(html.matchAll(/<img\b[^>]*\bsrc="([^"]+)"[^>]*>/g), (match) => ({ tag: match[0], src: match[1] }));
for (const image of imageRefs) {
  if (!/\bwidth="\d+"/.test(image.tag) || !/\bheight="\d+"/.test(image.tag)) fail(`Image dimensions are missing: ${image.src}`);
  if (image.src.startsWith('assets/img/')) {
    if (!image.src.split('?')[0].endsWith('.webp')) fail(`Local content image is not WebP: ${image.src}`);
    if (!/[?&]v=[a-f0-9]{10}/.test(image.src)) fail(`Image URL is not content-versioned: ${image.src}`);
  }
  const srcset = image.tag.match(/\bsrcset="([^"]+)"/);
  if (srcset) {
    for (const candidate of srcset[1].split(',')) {
      const raw = candidate.trim().split(/\s+/)[0];
      try {
        const url = new URL(raw, 'https://site.invalid/');
        if (url.origin === 'https://site.invalid') {
          const resource = decodeURIComponent(url.pathname).replace(/^\/+/, '');
          if (resource && !exists(resource)) fail(`Local srcset resource is missing: ${raw}`);
        }
      } catch { fail(`Malformed srcset URL: ${raw}`); }
    }
  } else if (image.src.startsWith('assets/img/')) {
    fail(`Responsive srcset is missing for local image: ${image.src}`);
  }
}

// Verify relative assets referenced from the generated stylesheet as well as HTML.
const css = fs.readFileSync(path.join(DIST, 'css/style.css'), 'utf8');
for (const match of css.matchAll(/url\(\s*(['\"]?)(.*?)\1\s*\)/g)) {
  const raw = match[2].trim();
  if (!raw || raw.startsWith('data:') || raw.startsWith('http:') || raw.startsWith('https:') || raw.startsWith('#')) continue;
  try {
    const url = new URL(raw, 'https://site.invalid/css/style.css');
    if (url.origin === 'https://site.invalid') {
      const resource = decodeURIComponent(url.pathname).replace(/^\/+/, '');
      if (resource && !exists(resource)) fail(`Local CSS resource is missing: ${raw}`);
    }
  } catch { fail(`Malformed CSS URL: ${raw}`); }
}

for (const icon of ['icon-192.png', 'icon-512.png', 'favicon.svg']) {
  if (!exists(icon)) fail(`PWA/favicon asset missing: ${icon}`);
}
try {
  const manifest = JSON.parse(fs.readFileSync(path.join(DIST, 'manifest.webmanifest'), 'utf8'));
  if (!manifest.name || !manifest.start_url || !Array.isArray(manifest.icons) || !manifest.icons.length) fail('Manifest is missing required install metadata.');
  for (const icon of manifest.icons) {
    const url = new URL(icon.src, 'https://site.invalid/');
    if (url.origin === 'https://site.invalid' && !exists(decodeURIComponent(url.pathname).replace(/^\/+/, ''))) fail(`Manifest icon is missing: ${icon.src}`);
  }
} catch (error) { fail(`Manifest JSON is invalid: ${error.message}`); }

for (const name of ['apod', 'neo', 'people', 'news', 'arxiv', 'launches', 'gallery']) {
  const file = path.join(DIST, 'data', `${name}.json`);
  if (!fs.existsSync(file)) { fail(`Data placeholder/snapshot missing: data/${name}.json`); continue; }
  try {
    const row = JSON.parse(fs.readFileSync(file, 'utf8'));
    if (row.ok === true && (!row.data || !Number.isFinite(Date.parse(row.fetchedAt)))) fail(`Snapshot ${name}.json has an invalid wrapper.`);
    if (row.ok !== true) warn(`No valid ${name} API snapshot was available at build time; widget fallback/error states will be used.`);
  } catch { fail(`Data file is not valid JSON: data/${name}.json`); }
}

if (/https:\/\/api\.nasa\.gov\/planetary\/apod/i.test(fs.readFileSync(path.join(ROOT, 'src/js/live.js'), 'utf8'))) {
  fail('Legacy NASA APOD endpoint is still present in browser code.');
}
const workflow = fs.readFileSync(path.join(ROOT, '.github/workflows/deploy.yml'), 'utf8');
if (!workflow.includes('actions/cache@v4') || !workflow.includes('path: data-cache')) fail('GitHub Actions does not persist the previous valid API snapshots.');
if (!workflow.includes('scripts/validate-site.mjs')) warn('GitHub Actions does not run the site validator.');

// Space Calendar data is hand-edited: catch typos in src/data/calendar.json before they ship.
try {
  const cal = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/data/calendar.json'), 'utf8'));
  const today = new Date().toISOString().slice(0, 10);
  let upcoming = 0;
  for (const [group, keys] of [['meteors', ['name', 'peak', 'zhr', 'note']], ['eclipses', ['date', 'type', 'visible', 'detail']], ['missions', ['date', 'event', 'status']]]) {
    if (!Array.isArray(cal[group]) || !cal[group].length) { fail(`calendar.json: "${group}" must be a non-empty list.`); continue; }
    cal[group].forEach((row, i) => {
      for (const k of keys) if (typeof row[k] !== 'string' || !row[k].trim()) fail(`calendar.json: ${group}[${i}] is missing "${k}".`);
      if (group !== 'missions') {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(row.end || '') || Number.isNaN(Date.parse(row.end))) fail(`calendar.json: ${group}[${i}] needs "end" as YYYY-MM-DD.`);
        else if (row.end >= today) upcoming++;
      }
    });
  }
  if (!upcoming) warn('calendar.json has no upcoming meteor/eclipse dates left — add new rows (the page shows an "expired" notice meanwhile).');
} catch (error) { fail(`src/data/calendar.json is not valid: ${error.message}`); }

// Content-Security-Policy must match the shipped inline scripts and every API host the live widgets call.
{
  const html = fs.readFileSync(path.join(DIST, 'index.html'), 'utf8');
  const cspMatch = html.match(/http-equiv="Content-Security-Policy" content="([^"]*)"/);
  if (!cspMatch) fail('index.html has no Content-Security-Policy meta tag.');
  else {
    const csp = cspMatch[1];
    for (const m of html.matchAll(/<script>([\s\S]*?)<\/script>/g)) {
      const h = `'sha256-${crypto.createHash('sha256').update(m[1]).digest('base64')}'`;
      if (!csp.includes(h)) fail('An inline <script> is not allowed by the Content-Security-Policy hash list.');
    }
    const connect = (csp.match(/connect-src ([^;]*)/) || [, ''])[1];
    const jsDir = path.join(ROOT, 'src/js');
    const jsSrc = fs.readdirSync(jsDir).filter((f) => f.endsWith('.js')).map((f) => fs.readFileSync(path.join(jsDir, f), 'utf8')).join('\n');
    const hosts = new Set([...jsSrc.matchAll(/(?:getJSON\(|fetch\(|\bAPI\s*=)\s*'(https:\/\/[^/']+)/g)].map((m) => m[1]));
    for (const host of hosts) if (!connect.includes(host)) fail(`the site scripts call ${host}, but the Content-Security-Policy connect-src does not allow it.`);
  }
}

if (errors.length) {
  console.error(`FAIL: ${errors.length} issue(s) found.`);
  errors.forEach((message) => console.error(` - ${message}`));
  warnings.forEach((message) => console.warn(` WARN: ${message}`));
  process.exit(1);
}
console.log(`PASS: ${actualSections.length} sections, ${ids.length} unique IDs, local HTML/CSS resources, internal links, PWA manifest/icons, data JSON wrappers and snapshot-cache workflow checked.`);
if (warnings.length) {
  console.warn(`WARN: ${warnings.length} item(s) need live-data/deployment attention.`);
  warnings.forEach((message) => console.warn(` - ${message}`));
}
