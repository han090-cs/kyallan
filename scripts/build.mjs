// Build: src/ -> dist/   (no dependencies, Node 18+)
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const SRC = 'src', OUT = 'dist';
const read = (p) => fs.readFileSync(path.join(SRC, p), 'utf8');
const site = JSON.parse(read('data/site.json'));
const bn = (n) => String(n).replace(/\d/g, (d) => '၀၁၂၃၄၅၆၇၈၉'[d]);
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
const hash = (s) => crypto.createHash('md5').update(s).digest('hex').slice(0, 8);
const fileHash = (p) => crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex').slice(0, 10);

// ---- image size (JPEG/PNG) -> width/height attrs (prevents layout shift)
function imgSize(file) {
  try {
    const b = fs.readFileSync(path.join(SRC, file));
    if (b[0] === 0x89 && b[1] === 0x50) return [b.readUInt32BE(16), b.readUInt32BE(20)];
    if (b.toString('ascii', 0, 4) === 'RIFF' && b.toString('ascii', 8, 12) === 'WEBP') {
      const chunk = b.toString('ascii', 12, 16);
      if (chunk === 'VP8X' && b.length >= 30) {
        const width = 1 + b[24] + (b[25] << 8) + (b[26] << 16);
        const height = 1 + b[27] + (b[28] << 8) + (b[29] << 16);
        return [width, height];
      }
      if (chunk === 'VP8L' && b.length >= 25 && b[20] === 0x2f) {
        const width = 1 + (((b[22] & 0x3f) << 8) | b[21]);
        const height = 1 + (((b[22] & 0xc0) >> 6) | (b[23] << 2) | ((b[24] & 0x0f) << 10));
        return [width, height];
      }
      if (chunk === 'VP8 ' && b.length >= 30 && b[23] === 0x9d && b[24] === 0x01 && b[25] === 0x2a) {
        return [b.readUInt16LE(26) & 0x3fff, b.readUInt16LE(28) & 0x3fff];
      }
    }
    let i = 2;
    while (i < b.length) {
      if (b[i] !== 0xff) { i++; continue; }
      const m = b[i + 1];
      if (m >= 0xc0 && m <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(m)) return [b.readUInt16BE(i + 7), b.readUInt16BE(i + 5)];
      i += 2 + b.readUInt16BE(i + 2);
    }
  } catch {}
  return null;
}
const fixImgs = (html) => html.replace(/<img\b([^>]*?)\bsrc="(assets\/[^"]+)"([^>]*?)\/?>/g, (m, a, src, c, offset) => {
  const s = imgSize(src);
  const wh = s && !/\bwidth=/.test(m) ? ` width="${s[0]}" height="${s[1]}"` : '';
  const dec = /decoding=/.test(m) ? '' : ' decoding="async"';
  const versionedSrc = `${src}?v=${fileHash(path.join(SRC, src))}`;
  let responsive = '';
  if (/\.webp$/i.test(src) && s) {
    const before = html.slice(0, offset);
    const isBg = /\bclass="[^"]*\bbg\b[^"]*"/.test(m);
    const isWide = before.lastIndexOf('class="wide-fig"') > before.lastIndexOf('<figure');
    const sizes = isBg ? '100vw' : isWide ? '(max-width: 1200px) 92vw, 1120px' : '(max-width: 600px) 92vw, (max-width: 900px) 45vw, 33vw';
    const stem = src.slice(0, -5);
    const candidates = [];
    for (const width of [480, 800]) {
      const candidate = `${stem}-${width}.webp`;
      const fullPath = path.join(SRC, candidate);
      if (s[0] > width && fs.existsSync(fullPath)) {
        const dimensions = imgSize(candidate);
        if (dimensions) candidates.push(`${candidate}?v=${fileHash(fullPath)} ${dimensions[0]}w`);
      }
    }
    candidates.push(`${versionedSrc} ${s[0]}w`);
    responsive = ` srcset="${candidates.join(', ')}" sizes="${sizes}"`;
  }
  return `<img${a}src="${versionedSrc}"${c.replace(/\s*\/$/, '')}${responsive}${wh}${dec}>`;
});

// ---- space calendar rows come from src/data/calendar.json (edit that file, not the HTML)
const cal = JSON.parse(read('data/calendar.json'));
const tr = (cells, end) => `<tr${end ? ` data-end="${end}"` : ''}>${cells.map((c) => `<td>${c}</td>`).join('')}</tr>`;
const calHtml = {
  CAL_METEORS: cal.meteors.map((r) => tr([r.name, r.peak, r.zhr, r.note], r.end)).join('\n      '),
  CAL_ECLIPSES: cal.eclipses.map((r) => tr([r.date, r.type, r.visible, r.detail], r.end)).join('\n      '),
  CAL_MISSIONS: cal.missions.map((r) => tr([r.date, r.event, r.status], r.end)).join('\n      '),
};

// ---- sections (auto-numbered in the order of site.json)
const items = site.groups.flatMap((g) => g.items);
const sections = items.map((it, i) => {
  let h = read(`sections/${it.id}.html`);
  h = h.replace(/(<span class="tag">)အပိုင်း [၀-၉]+ ·/, `$1အပိုင်း ${bn(i + 1)} ·`);
  for (const [k, v] of Object.entries(calHtml)) h = h.replace(`{{${k}}}`, v);
  return fixImgs(h);
}).join('\n');

// ---- menu (drawer) + explore grid, both generated from site.json
const menu = site.groups.map((g) => `<div class="mgroup"><h3>${g.group}</h3>` +
  g.items.map((i) => `<a href="#${i.id}" data-spy="${i.id}"><span aria-hidden="true">${i.icon}</span>${i.title}</a>`).join('') + '</div>').join('');
const explore = site.groups.map((g) => `<h3 class="egroup">${g.group}</h3><div class="egrid">` +
  g.items.map((i) => `<a href="#${i.id}"><b><span aria-hidden="true">${i.icon}</span> ${i.title}</b><span>${i.desc}</span></a>`).join('') + '</div>').join('');

// ---- assets with cache-busting hash
fs.rmSync(OUT, { recursive: true, force: true });
fs.cpSync(SRC + '/assets', OUT + '/assets', { recursive: true });
fs.cpSync('public', OUT, { recursive: true });
fs.mkdirSync(OUT + '/css', { recursive: true });
fs.mkdirSync(OUT + '/js', { recursive: true });
const cssFiles = ['base.css', 'ui.css'];
// Every px font-size is multiplied by --fs (the reader's text-size setting, default 1), so the "Aa" button can scale all text.
const scaleFonts = (text) => text
  .replace(/font-size:\s*([\d.]+)px/g, 'font-size:calc($1px * var(--fs,1))')
  .replace(/font-size:\s*(clamp\([^;{}]*\))/g, 'font-size:calc($1 * var(--fs,1))');
const css = scaleFonts(cssFiles.map((f) => read('css/' + f)).join('\n'))
  .replaceAll('../assets/fonts/padauk-400.woff2', `../assets/fonts/padauk-400.woff2?v=${fileHash(path.join(SRC, 'assets/fonts/padauk-400.woff2'))}`)
  .replaceAll('../assets/fonts/padauk-700.woff2', `../assets/fonts/padauk-700.woff2?v=${fileHash(path.join(SRC, 'assets/fonts/padauk-700.woff2'))}`);
const jsFiles = ['data/planets.js', 'data/ephem.js', 'data/moonphases.js', 'data/sky.js', 'ui.js', 'router.js', 'explorer.js', 'api.js', 'live.js', 'gallery.js', 'tools.js'];
const js = jsFiles.map((f) => `/* ${f} */\n` + read('js/' + f)).join('\n');
fs.writeFileSync(OUT + '/css/style.css', css);
fs.writeFileSync(OUT + '/js/app.js', js);
// data/*.json (written by scripts/fetch-data.mjs before build; fall back to empty placeholders)
fs.mkdirSync(OUT + '/data', { recursive: true });
for (const n of ['apod', 'neo', 'people', 'news', 'arxiv', 'launches', 'gallery']) {
  const dst = `${OUT}/data/${n}.json`;
  if (fs.existsSync(`data-cache/${n}.json`)) fs.copyFileSync(`data-cache/${n}.json`, dst);
  else fs.writeFileSync(dst, '{"ok":false}');
}

// ---- page
const S = site.site;
const built = new Date();
// SITE_URL wins; otherwise inside GitHub Actions derive the default Pages URL from the repository name
// (a custom domain still needs the SITE_URL variable).
function defaultPagesUrl() {
  // Vercel production builds expose the production hostname (no protocol).
  if (process.env.VERCEL_ENV === 'production' && process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}/`;
  }
  const repo = process.env.GITHUB_REPOSITORY;
  if (process.env.GITHUB_ACTIONS !== 'true' || !repo || !repo.includes('/')) return '';
  const [owner, name] = repo.split('/');
  const host = `${owner.toLowerCase()}.github.io`;
  return name.toLowerCase() === host ? `https://${host}/` : `https://${host}/${name}/`;
}
let canonical = String(process.env.SITE_URL || S.url || defaultPagesUrl() || '').trim();
if (canonical) {
  let parsed;
  try { parsed = new URL(canonical); } catch { throw new Error('SITE_URL must be a valid HTTPS URL to the deployed site root.'); }
  if (parsed.protocol !== 'https:') throw new Error('SITE_URL must use HTTPS.');
  parsed.hash = '';
  parsed.search = '';
  if (!parsed.pathname.endsWith('/')) parsed.pathname += '/';
  canonical = parsed.href;
}
const canonicalLink = canonical ? `<link rel="canonical" href="${esc(canonical)}" />` : '';
const ogUrl = canonical ? `<meta property="og:url" content="${esc(canonical)}" />` : '';
const ogUrl_ = canonical ? new URL(`assets/img/og-share.jpg?v=${fileHash(path.join(SRC, 'assets/img/og-share.jpg'))}`, canonical).href : '';
const ogImage = canonical ? [
  `<meta property="og:image" content="${esc(ogUrl_)}" />`,
  `<meta property="og:image:type" content="image/jpeg" />`,
  `<meta property="og:image:width" content="1200" />`,
  `<meta property="og:image:height" content="630" />`,
  `<meta property="og:image:alt" content="${esc('SLS ဒုံးပျံ Artemis လွှတ်တင်စဉ် — ' + S.name + ' (' + S.latin + ')')}" />`,
  `<meta name="twitter:card" content="summary_large_image" />`,
  `<meta name="twitter:title" content="${esc(S.name + ' · ' + S.latin + ' — ' + S.tagline)}" />`,
  `<meta name="twitter:description" content="${esc(S.description)}" />`,
  `<meta name="twitter:image" content="${esc(ogUrl_)}" />`,
].join('\n') : '';
// ---- phone-friendly tables: copy each header label onto its cells (data-label) so the CSS can stack rows as cards
function labelTables(html) {
  const strip = (t) => t.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim().replace(/"/g, '&quot;');
  return html.replace(/<table class="tbl">([\s\S]*?)<\/table>/g, (whole, inner) => {
    const head = inner.match(/<tr[^>]*>\s*(<th[\s\S]*?)<\/tr>/);
    if (!head) return whole;
    const labels = [...head[1].matchAll(/<th[^>]*>([\s\S]*?)<\/th>/g)].map((m) => strip(m[1]));
    const rows = inner.replace(/<tr([^>]*)>([\s\S]*?)<\/tr>/g, (row, attrs, cells) => {
      if (/<th[\s>]/.test(cells)) return `<tr${attrs} class="thead-row">${cells}</tr>`;
      let i = 0;
      const count = (cells.match(/<td>/g) || []).length;
      const body = cells.replace(/<td>([\s\S]*?)<\/td>/g, (m, content) => `<td data-label="${labels[i++] || ''}"><span class="v">${content}</span></td>`);
      // rows with more than 4 columns: phones show the first 4 and a "show more" button for the rest
      if (count > 4) return `<tr${attrs} class="has-more">${body}<td class="tbl-more"><button type="button" class="tbl-toggle" aria-expanded="false">ပိုကြည့်ရန် ▾</button></td></tr>`;
      return `<tr${attrs}>${body}</tr>`;
    });
    return `<table class="tbl">${rows}</table>`;
  });
}

let page = read('index.template.html')
  .replaceAll('{{NAME}}', S.name).replaceAll('{{LATIN}}', S.latin)
  .replaceAll('{{TAGLINE}}', S.tagline).replaceAll('{{DESC}}', esc(S.description))
  .replaceAll('{{URL}}', canonical)
  .replace('{{ROUTE_IDS}}', JSON.stringify(items.map((item) => item.id)))
  .replace('{{FAVICON}}', `favicon.svg?v=${fileHash('public/favicon.svg')}`)
  .replace('{{ICON192}}', `icon-192.png?v=${fileHash('public/icon-192.png')}`)
  .replace('{{MANIFEST}}', `manifest.webmanifest?v=${fileHash('public/manifest.webmanifest')}`)
  .replace('{{FONT400}}', `assets/fonts/padauk-400.woff2?v=${fileHash(path.join(SRC, 'assets/fonts/padauk-400.woff2'))}`)
  .replace('{{HERO}}', fixImgs(read('hero.html')).replace('<img class="bg"', '<img fetchpriority="high" class="bg"'))
  .replace('{{MENU}}', menu).replace('{{EXPLORE}}', explore)
  .replace('{{SECTIONS}}', sections).replace('{{FOOTER}}', read('footer.html'))
  .replace('{{BUILT}}', built.toISOString().slice(0, 10))
  .replace('{{CSS}}', 'css/style.css?v=' + hash(css)).replace('{{JS}}', 'js/app.js?v=' + hash(js))
  .replace('{{CANONICAL_LINK}}', canonicalLink).replace('{{OG_URL_META}}', ogUrl).replace('{{OG_IMAGE_META}}', ogImage);
page = labelTables(page);

// ---- Content-Security-Policy (GitHub Pages cannot send headers, so it ships as a <meta> tag).
// Inline scripts are allowed only by SHA-256 hash, so an injected <script> or event handler cannot run.
const inlineHashes = [...page.matchAll(/<script>([\s\S]*?)<\/script>/g)]
  .map((m) => `'sha256-${crypto.createHash('sha256').update(m[1]).digest('base64')}'`);
const csp = [
  "default-src 'self'",
  `script-src 'self' ${inlineHashes.join(' ')}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https:",
  "font-src 'self'",
  "connect-src 'self' https://api.nasa.gov https://science.nasa.gov https://images-api.nasa.gov https://epic.gsfc.nasa.gov https://api.wheretheiss.at https://api.spaceflightnewsapi.net https://corquaid.github.io",
  "frame-src https://www.youtube-nocookie.com",
  "media-src 'self' https:",
  "worker-src 'self'",
  "manifest-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'none'",
].join('; ');
page = page.replace('{{CSP}}', `<meta http-equiv="Content-Security-Policy" content="${csp}" />`);
fs.writeFileSync(OUT + '/index.html', page);
fs.copyFileSync(OUT + '/index.html', OUT + '/404.html');
if (canonical) {
  fs.writeFileSync(path.join(OUT, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${esc(canonical)}</loc></url></urlset>\n`);
  fs.writeFileSync(path.join(OUT, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${new URL('sitemap.xml', canonical).href}\n`);
}

// Change the service-worker cache namespace whenever shipped app content changes.
// This prevents cache-first JS from remaining stale after an update and lets new installs
// precache the exact version of the application shell.
function listFiles(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? listFiles(full) : [full];
  }).sort();
}
const assetHash = crypto.createHash('sha256');
for (const dir of ['src/assets', 'public']) {
  for (const file of listFiles(dir)) {
    assetHash.update(path.relative('.', file));
    assetHash.update(fs.readFileSync(file));
  }
}
const swBuildHash = crypto.createHash('sha256')
  .update(page).update(css).update(js).update(assetHash.digest()).digest('hex').slice(0, 12);
const swPath = path.join(OUT, 'sw.js');
const swSource = fs.readFileSync(swPath, 'utf8');
if (!swSource.includes('__BUILD_HASH__')) throw new Error('Service worker cache version placeholder is missing.');
fs.writeFileSync(swPath, swSource.replaceAll('__BUILD_HASH__', swBuildHash));

console.log(`built ${items.length} sections -> ${OUT}/ (${(page.length / 1024).toFixed(0)} KB html)`);
