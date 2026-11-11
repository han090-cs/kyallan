// Fetch public space-data APIs into data-cache/*.json for the static GitHub Pages build.
// Old snapshots are deliberately retained when a source is down or its response schema changes.
import fs from 'node:fs';
import path from 'node:path';

const OUT = 'data-cache';
const NASA_KEY = process.env.NASA_API_KEY || 'DEMO_KEY';
fs.mkdirSync(OUT, { recursive: true });

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const validTimestamp = (value) => Number.isFinite(Date.parse(value));

function readSnapshot(name) {
  try {
    const row = JSON.parse(fs.readFileSync(path.join(OUT, `${name}.json`), 'utf8'));
    if (row?.ok && row.data != null && validTimestamp(row.fetchedAt)) return row;
  } catch {}
  return null;
}

async function request(url, { asText = false, timeoutMs = 25000 } = {}) {
  let lastError;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const response = await fetch(url, {
        signal: AbortSignal.timeout(timeoutMs),
        headers: {
          'user-agent': 'KyallanSpaceEducation/2.2 (+https://github.com/; public educational project)',
          accept: asText ? 'application/atom+xml, application/xml, text/xml;q=0.9, */*;q=0.8' : 'application/json, */*;q=0.8',
        },
      });
      if (!response.ok) {
        const error = new Error(`HTTP ${response.status}`);
        if (attempt === 0 && (response.status === 429 || response.status >= 500)) {
          const retryAfter = Number(response.headers.get('retry-after'));
          await sleep(Number.isFinite(retryAfter) && retryAfter > 0 ? Math.min(retryAfter * 1000, 5000) : 1200);
          lastError = error;
          continue;
        }
        throw error;
      }
      return asText ? await response.text() : await response.json();
    } catch (error) {
      lastError = error;
      if (attempt === 0 && !(error instanceof SyntaxError) && !/^HTTP 4\d\d$/.test(error?.message || '')) {
        await sleep(800);
        continue;
      }
      throw error;
    }
  }
  throw lastError || new Error('request failed');
}

function parseAPOD(raw) {
  const item = Array.isArray(raw) ? raw[0] : raw;
  if (!item || typeof item !== 'object' || !item.title || !(item.url || item.hdurl || item.permalink)) {
    throw new Error('unexpected APOD response schema');
  }
  return item;
}
function parsePeople(raw) {
  if (!raw || !Array.isArray(raw.people)) throw new Error('unexpected people-in-space response schema');
  return raw;
}
function parseNews(raw) {
  const results = Array.isArray(raw) ? raw : raw?.results;
  if (!Array.isArray(results)) throw new Error('unexpected Spaceflight News response schema');
  if (!results.length || !results.some((item) => item?.title && item?.url)) throw new Error('news response has no usable articles');
  return raw;
}
function parseNEO(raw) {
  if (!raw || typeof raw.near_earth_objects !== 'object') throw new Error('unexpected NEO response schema');
  return raw;
}
function parseLaunches(raw) {
  const rows = Array.isArray(raw?.results) ? raw.results.map((item) => ({
    name: item.name || item.mission?.name || 'Mission အမည် မသိရသေး',
    mission: item.mission?.name || '',
    datetime: item.net || '',
    precision: item.net_precision?.name || '',
    status: item.status?.name || 'အခြေအနေ မသိရသေး',
    provider: item.launch_service_provider?.name || '',
    location: item.pad?.location?.name || item.pad?.name || '',
  })) : [];
  if (!rows.length) throw new Error('no usable upcoming launches');
  return rows;
}
const xmlText = (xml, tag) => {
  const match = xml.match(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)</${tag}>`, 'i'));
  return (match?.[1] || '').replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/\s+/g, ' ').trim();
};
function parseArxiv(xml) {
  const rows = (xml.match(/<entry>[\s\S]*?<\/entry>/g) || []).map((entry) => {
    const authorBlock = (entry.match(/<author>[\s\S]*?<\/author>/) || [])[0] || '';
    const row = {
      title: xmlText(entry, 'title'),
      link: xmlText(entry, 'id'),
      published: xmlText(entry, 'published').slice(0, 10),
      author: xmlText(authorBlock, 'name'),
    };
    return row;
  }).filter((row) => row.title && /^https:\/\/arxiv\.org\/abs\//.test(row.link));
  if (!rows.length) throw new Error('no usable arXiv entries');
  return rows;
}

async function save(name, producer, validate = (value) => value != null) {
  try {
    const data = await producer();
    if (!validate(data)) throw new Error('response validation failed');
    const snapshot = { ok: true, fetchedAt: new Date().toISOString(), data };
    const dest = path.join(OUT, `${name}.json`);
    const temp = `${dest}.tmp`;
    fs.writeFileSync(temp, `${JSON.stringify(snapshot)}\n`);
    fs.renameSync(temp, dest);
    console.log(`ok       ${name}`);
    return true;
  } catch (error) {
    const previous = readSnapshot(name);
    const when = previous ? ` — keeping snapshot from ${previous.fetchedAt}` : ' — no previous snapshot available';
    console.warn(`warning  ${name}: ${error?.message || error}${when}`);
    return false;
  }
}

function dateInMyanmar(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Yangon', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}
const day = dateInMyanmar();
const url = (base, params = {}) => {
  const u = new URL(base);
  Object.entries(params).forEach(([key, value]) => u.searchParams.set(key, String(value)));
  return u.toString();
};

// ---- NASA Image Library photo strips: one snapshot for every data-q used in src/sections/*.html.
// Photos rarely change, so it is refreshed at most once a day and a failed query keeps its previous result.
function galleryQueries() {
  const dir = 'src/sections';
  const found = new Set();
  for (const file of fs.readdirSync(dir)) {
    const html = fs.readFileSync(path.join(dir, file), 'utf8');
    for (const match of html.matchAll(/class="nasa-gallery"[^>]*data-q="([^"]+)"/g)) found.add(match[1]);
  }
  return [...found];
}
function parseGallery(raw) {
  const items = raw?.collection?.items;
  if (!Array.isArray(items)) throw new Error('unexpected NASA image-library response schema');
  const seen = new Set();
  const rows = [];
  for (const item of items) {
    const meta = item?.data?.[0];
    const thumb = item?.links?.[0]?.href;
    if (!meta?.nasa_id || !meta?.title || typeof thumb !== 'string') continue;
    if (!/^https:\/\/images-assets\.nasa\.gov\/.+\.(?:jpe?g|png)$/i.test(thumb)) continue;
    const key = String(meta.title).toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    rows.push({ id: String(meta.nasa_id), title: String(meta.title), thumb, center: meta.center ? String(meta.center) : '' });
  }
  return rows;
}
async function buildGallery() {
  const queries = galleryQueries();
  if (!queries.length) throw new Error('no gallery queries found');
  const previous = readSnapshot('gallery');
  const old = previous?.data || {};
  const fresh = previous && Date.now() - Date.parse(previous.fetchedAt) < 20 * 3600 * 1000 && queries.every((q) => Array.isArray(old[q]) && old[q].length);
  if (fresh) return old; // refreshed within the last 20 hours: reuse, no API calls
  const result = {};
  let got = 0;
  for (const q of queries) {
    try {
      const rows = parseGallery(await request(url('https://images-api.nasa.gov/search', { q, media_type: 'image', page_size: 24 })));
      if (!rows.length) throw new Error('no usable images');
      result[q] = rows;
      got += 1;
    } catch (error) {
      console.warn(`warning  gallery "${q}": ${error?.message || error}${old[q] ? ' — keeping previous result' : ''}`);
      if (old[q]) result[q] = old[q];
    }
    await sleep(400); // be polite: sequential requests
  }
  if (!got) throw new Error('every gallery query failed');
  return result;
}

const jobs = [
  // NASA migrated APOD to the WordPress endpoint in September 2026.
  save('apod', async () => parseAPOD(await request(url('https://science.nasa.gov/wp-json/wp/v2/apod-basic/', { api_key: NASA_KEY }))), (value) => Boolean(value?.title && (value?.url || value?.hdurl || value?.permalink))),
  save('neo', async () => parseNEO(await request(url('https://api.nasa.gov/neo/rest/v1/feed', { start_date: day, end_date: day, api_key: NASA_KEY }))), (value) => Boolean(value?.near_earth_objects)),
  save('people', async () => parsePeople(await request('https://corquaid.github.io/international-space-station-APIs/JSON/people-in-space.json')), (value) => Array.isArray(value?.people)),
  save('news', async () => parseNews(await request('https://api.spaceflightnewsapi.net/v4/articles/?limit=6')), (value) => Array.isArray(value?.results) || Array.isArray(value)),
  // A single snapshot keeps this site under Launch Library 2's 15 unauthenticated requests/hour.
  save('launches', async () => parseLaunches(await request('https://ll.thespacedevs.com/2.3.0/launches/upcoming/?format=json&limit=5&ordering=net&hide_recent_previous=true')), (value) => Array.isArray(value) && value.length > 0),
  // arXiv Atom feeds are not a reliable browser-side CORS source; retrieve them at build time.
  save('gallery', buildGallery, (value) => value && typeof value === 'object' && Object.keys(value).length > 0),
  save('arxiv', async () => parseArxiv(await request('https://export.arxiv.org/api/query?search_query=cat:astro-ph&start=0&max_results=6&sortBy=submittedDate&sortOrder=descending', { asText: true })), (value) => Array.isArray(value) && value.length > 0),
];

const results = await Promise.all(jobs);
const successCount = results.filter(Boolean).length;
console.log(`data fetch complete: ${successCount}/${jobs.length} sources refreshed; failed sources kept their last valid snapshot when available.`);
