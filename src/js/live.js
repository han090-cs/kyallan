/* live.js — API widgets with snapshot-first loading, explicit stale-data messaging, and retry states. */
(function () {
  'use strict';
  var d = document;
  var KEY_STORE = 'kyallan-nasa-key';
  var $ = function (id) { return d.getElementById(id); };

  function fmt(value, digits) {
    var n = Number(value);
    if (!Number.isFinite(n)) return '—';
    var places = digits || 0;
    return n.toLocaleString('en-US', { minimumFractionDigits: places, maximumFractionDigits: places });
  }
  function el(tag, cls, text) {
    var node = d.createElement(tag);
    if (cls) node.className = cls;
    if (text !== undefined && text !== null) node.textContent = String(text);
    return node;
  }
  function safeURL(value) {
    try {
      var url = new URL(String(value || ''), window.location.href);
      if (url.protocol !== 'https:' && url.origin !== window.location.origin) return '';
      if (url.protocol !== 'https:' && url.protocol !== 'http:') return '';
      return url.href;
    } catch (_) { return ''; }
  }
  function link(href, text) {
    var valid = safeURL(href);
    if (!valid) return el('span', '', text);
    var a = el('a', '', text);
    a.href = valid;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    return a;
  }
  function nasaKey() {
    try { return localStorage.getItem(KEY_STORE) || 'DEMO_KEY'; } catch (_) { return 'DEMO_KEY'; }
  }
  /* NASA's APOD feed returns some text fields with HTML markup; display plain text only. */
  function plainText(value) {
    return String(value == null ? '' : value)
      .replace(/<br\s*\/?\s*>/gi, ' ')
      .replace(/<\/(?:p|div|strong|b|em|i|a|li|span)>/gi, ' ')
      .replace(/<[^>]*>/g, ' ')
      .replace(/&nbsp;|&#160;/gi, ' ')
      .replace(/&amp;/gi, '&').replace(/&lt;/gi, '<').replace(/&gt;/gi, '>')
      .replace(/&quot;/gi, '"').replace(/&#39;|&apos;/gi, "'")
      .replace(/&#(\d+);/g, function (_, n) { return String.fromCodePoint(Number(n) || 32); })
      .replace(/&#x([0-9a-f]+);/gi, function (_, n) { return String.fromCodePoint(parseInt(n, 16) || 32); })
      .replace(/\s+/g, ' ').trim();
  }

  /* Shared helper (api.js): timeout, one retry, 429 pause, de-duplication, offline check, optional cache. */
  var getJSON = KyallanAPI.getJSON;

  /* A valid stale snapshot may still be preferable to an empty panel when an API is down. */
  function snapshot(name, maxHours, allowStale) {
    return getJSON('data/' + name + '.json?h=' + Math.floor(Date.now() / 3600000), 8000).then(function (row) {
      var fetchedAt = row && Date.parse(row.fetchedAt);
      if (!row || row.ok !== true || row.data === undefined || row.data === null || !Number.isFinite(fetchedAt)) {
        throw new Error('No valid snapshot');
      }
      var ageHours = Math.max(0, (Date.now() - fetchedAt) / 3600000);
      var stale = ageHours > maxHours;
      if (stale && !allowStale) throw new Error('Snapshot is old');
      return { data: row.data, at: new Date(fetchedAt), stale: stale };
    });
  }
  function grid(pairs) {
    var result = el('div', 'wstats');
    pairs.forEach(function (pair) {
      var item = el('div', 'wstat');
      item.appendChild(el('span', '', pair[0]));
      item.appendChild(el('b', '', pair[1]));
      result.appendChild(item);
    });
    return result;
  }
  function fail(box, retry, extra) {
    box.replaceChildren();
    var message = el('div', 'livefail', 'ဒေတာကို ယခုအချိန်မှာ မရယူနိုင်သေးပါ။ အင်တာနက်ကို စစ်ပြီး နောက်တစ်ကြိမ် ပြန်ကြိုးစားပါ။' + (extra ? ' ' + extra : ''));
    message.setAttribute('role', 'status');
    if (retry) {
      var button = el('button', 'retry', 'ပြန်ကြိုးစားမယ်');
      button.type = 'button';
      button.addEventListener('click', retry);
      message.appendChild(d.createElement('br'));
      message.appendChild(button);
    }
    box.appendChild(message);
  }
  function widget(id, snapshotName, maxHours, live, render, failNote, liveFirst) {
    var box = $(id);
    if (!box) return function () {};
    box.setAttribute('aria-live', 'polite');
    function run(silent) {
      silent = silent === true;
      if (!silent) {
        box.replaceChildren(el('div', 'skel'), el('div', 'skel'));
        box.lastChild.style.width = '70%';
      }
      var task;
      if (liveFirst && snapshotName) {
        /* real-time sources: ask the API directly first, fall back to the build snapshot if it is unreachable */
        task = live().then(function (data) { return { data: data, at: null, stale: false, fresh: true }; }).catch(function (liveError) {
          return snapshot(snapshotName, maxHours, true).catch(function () { throw liveError; });
        });
      } else if (!snapshotName) {
        task = live().then(function (data) { return { data: data, at: null, stale: false }; });
      } else {
        task = snapshot(snapshotName, maxHours, false).catch(function () {
          return live().then(function (data) { return { data: data, at: null, stale: false }; }).catch(function (liveError) {
            return snapshot(snapshotName, maxHours, true).catch(function () { throw liveError; });
          });
        });
      }
      task.then(function (result) {
        box.replaceChildren();
        render(box, result.data);
        if (result.fresh) {
          box.appendChild(el('p', 'livenote', 'အချိန်နဲ့တပြေးညီ — ' + new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) + ' မှာ နောက်ဆုံး စစ်ထားတယ် (၅ မိနစ်တစ်ခါ အလိုအလျောက် update)'));
        }
        if (result.at) {
          var date = result.at.toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' });
          var note = result.stale ? 'နောက်ဆုံး သိမ်းထားသော ဒေတာ (ဟောင်းနိုင်သည်) — ' : 'ဒေတာ update — ';
          box.appendChild(el('p', result.stale ? 'livenote stale' : 'livenote', note + date));
        }
      }).catch(function () { if (!silent) fail(box, run, failNote); });
    }
    window.addEventListener('online', function () { if (box.querySelector('.livefail')) run(); });
    run();
    return run;
  }

  var NOTE_KEY = '(NASA DEMO_KEY ၏ တောင်းဆိုမှုကန့်သတ်ချက် ပြည့်နေနိုင်သည် — အောက်က ကိုယ်ပိုင် NASA key ကို ထည့်စမ်းပါ။)';

  /* ISS: poll once per minute only while the widget is visible; do not overlap requests. */
  var issBox;
  var issTimer = null;
  var issBusy = false;
  function loadISS() {
    if (!issBox || issBusy) return;
    issBusy = true;
    getJSON('https://api.wheretheiss.at/v1/satellites/25544', 10000, 20000).then(function (data) {
      if (![data.latitude, data.longitude, data.altitude, data.velocity].every(function (n) { return Number.isFinite(Number(n)); })) {
        throw new Error('Invalid ISS response');
      }
      issBox.replaceChildren();
      issBox.appendChild(grid([
        ['လတ္တီကျု (Latitude)', fmt(data.latitude, 2) + '°'],
        ['လောင်ဂျီကျု (Longitude)', fmt(data.longitude, 2) + '°'],
        ['အမြင့် (Altitude)', fmt(data.altitude, 1) + ' km'],
        ['အမြန်နှုန်း (Velocity)', fmt(data.velocity, 0) + ' km/h'],
        ['မြင်ကွင်း (Visibility)', data.visibility === 'daylight' ? 'နေရောင် ကျနေတယ်' : 'ကမ္ဘာ့ အရိပ်ထဲမှာ'],
        ['Update အချိန် (UTC)', data.timestamp ? new Date(data.timestamp * 1000).toLocaleTimeString('en-GB', { timeZone: 'UTC' }) : '—']
      ]));
    }).catch(function () {
      if (issBox && !issBox.querySelector('.wstats')) fail(issBox, loadISS);
    }).finally(function () { issBusy = false; });
  }
  function watchISS() {
    issBox = $('wIss');
    if (!issBox) return;
    issBox.setAttribute('aria-live', 'off');
    function start() {
      if (!issTimer) {
        loadISS();
        issTimer = setInterval(function () { if (!d.hidden) loadISS(); }, 60000);
      }
    }
    function stop() { if (issTimer) clearInterval(issTimer); issTimer = null; }
    if (!('IntersectionObserver' in window)) { start(); return; }
    var observer = new IntersectionObserver(function (entries) {
      if (entries[0] && entries[0].isIntersecting) start(); else stop();
    }, { rootMargin: '100px' });
    observer.observe(issBox);
    d.addEventListener('visibilitychange', function () { if (d.hidden) stop(); else if (issBox.getBoundingClientRect().top < window.innerHeight && issBox.getBoundingClientRect().bottom > 0) start(); });
  }

  function init() {
    watchISS();

    widget('wPpl', 'people', 48, function () {
      return getJSON('https://corquaid.github.io/international-space-station-APIs/JSON/people-in-space.json', 12000, 600000);
    }, function (box, data) {
      var people = Array.isArray(data.people) ? data.people : [];
      var p = el('p');
      p.appendChild(d.createTextNode('အခု အာကာသထဲမှာ စုစုပေါင်း '));
      p.appendChild(el('b', '', (data.number || people.length) + ' ယောက်'));
      p.appendChild(d.createTextNode(' ရှိနေပါတယ်။'));
      box.appendChild(p);
      if (!people.length) { box.appendChild(el('p', 'small', 'လက်ရှိ လူစာရင်း မရရှိသေးပါ။')); return; }
      var list = el('ul', 'ppl');
      people.forEach(function (person) {
        list.appendChild(el('li', '', (person.name || 'အမည် မသိရသေး') + ' — ' + (person.spacecraft || person.craft || person.location || 'အာကာသယာဉ် မသိရသေး')));
      });
      box.appendChild(list);
    });

    widget('wApod', 'apod', 36, function () {
      return getJSON('https://science.nasa.gov/wp-json/wp/v2/apod-basic/?api_key=' + encodeURIComponent(nasaKey()), 15000, 600000)
        .then(function (data) { return Array.isArray(data) ? data[0] : data; });
    }, function (box, data) {
      if (!data || !data.title) throw new Error('Invalid APOD response');
      box.appendChild(el('h3', '', data.title));
      box.appendChild(el('p', 'meta', (data.date || '') + (data.copyright ? ' · © ' + plainText(data.copyright) : '')));
      if (data.media_type === 'image') {
        var imageURL = safeURL(data.hdurl || data.url);
        if (imageURL && /\.(?:jpe?g|png|webp)(?:[?#]|$)/i.test(imageURL)) {
          var image = el('img', 'apodimg');
          image.src = imageURL; image.alt = data.alt || data.title || 'NASA Astronomy Picture of the Day'; image.loading = 'lazy'; image.decoding = 'async';
          image.addEventListener('error', function () { image.remove(); });
          box.appendChild(image);
        } else {
          var linkRow = el('p'); linkRow.appendChild(link(data.permalink || data.url, 'NASA ရဲ့ ယနေ့ပုံကို ကြည့်ရန် →')); box.appendChild(linkRow);
        }
      } else {
        var videoRow = el('p'); videoRow.appendChild(link(data.url || data.permalink, 'ယနေ့ မီဒီယာကို NASA မှာ ကြည့်ရန် →')); box.appendChild(videoRow);
      }
      if (data.explanation) {
        var explanation = el('p', '', plainText(data.explanation));
        explanation.className = 'apod-explanation';
        box.appendChild(explanation);
      }
    }, NOTE_KEY);

    widget('wNeo', 'neo', 36, function () {
      var dateParts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Yangon', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date());
      var dateValues = {}; dateParts.forEach(function (part) { dateValues[part.type] = part.value; });
      var day = dateValues.year + '-' + dateValues.month + '-' + dateValues.day;
      return getJSON('https://api.nasa.gov/neo/rest/v1/feed?start_date=' + day + '&end_date=' + day + '&api_key=' + encodeURIComponent(nasaKey()), 15000, 600000);
    }, function (box, data) {
      var near = data && data.near_earth_objects;
      var objects = [];
      if (near && typeof near === 'object') Object.keys(near).forEach(function (date) { if (Array.isArray(near[date])) objects = objects.concat(near[date]); });
      if (!objects.length) { box.appendChild(el('p', '', 'ယနေ့အတွက် အချက်အလက်ရရှိတဲ့ ဖြတ်သန်းမှု မရှိပါ။')); return; }
      var closest = null, largest = 0, fastest = 0;
      objects.forEach(function (item) {
        var approach = Array.isArray(item.close_approach_data) ? item.close_approach_data[0] : null;
        if (approach && approach.miss_distance) {
          var km = Number(approach.miss_distance.kilometers);
          if (Number.isFinite(km) && (!closest || km < closest.km)) closest = { km: km, name: item.name || 'အမည် မသိရသေး' };
          var velocity = Number(approach.relative_velocity && approach.relative_velocity.kilometers_per_hour);
          if (Number.isFinite(velocity)) fastest = Math.max(fastest, velocity);
        }
        var diameter = Number(item.estimated_diameter && item.estimated_diameter.kilometers && item.estimated_diameter.kilometers.estimated_diameter_max);
        if (Number.isFinite(diameter)) largest = Math.max(largest, diameter);
      });
      if (!closest) { box.appendChild(el('p', '', 'ဒေတာရရှိသော်လည်း အကွာအဝေးတွက်ချက်ရန် မပြည့်စုံသေးပါ။')); return; }
      box.appendChild(grid([
        ['ဖြတ်သန်းမှု စာရင်း', objects.length + ' လုံး'],
        ['အနီးဆုံး အကွာအဝေး', fmt(closest.km, 0) + ' km'],
        ['အနီးဆုံး အရာဝတ္ထု', closest.name.replace(/[()]/g, '')],
        ['လ–ကမ္ဘာ ပျမ်းမျှအကွာအဝေးနှင့်', fmt(closest.km / 384400, 1) + ' ဆ'],
        ['အကြီးဆုံး အချင်း (ခန့်မှန်း)', fmt(largest * 1000, 0) + ' m'],
        ['အမြန်ဆုံး နှိုင်းယှဉ်အမြန်နှုန်း', fmt(fastest, 0) + ' km/h']
      ]));
    }, NOTE_KEY);

    widget('wEpic', null, 0, function () { return getJSON('https://epic.gsfc.nasa.gov/api/natural', 15000, 1800000); }, function (box, items) {
      if (!Array.isArray(items) || !items.length) throw new Error('No EPIC images');
      var item = items[0];
      var dateParts = String(item.date || '').slice(0, 10).split('-');
      if (dateParts.length !== 3 || !item.image) throw new Error('Invalid EPIC response');
      var image = el('img', 'apodimg');
      image.src = 'https://epic.gsfc.nasa.gov/archive/natural/' + dateParts.join('/') + '/jpg/' + encodeURIComponent(item.image) + '.jpg';
      image.alt = 'NASA EPIC ကင်မရာ ရိုက်ကူးထားသော ကမ္ဘာပုံ'; image.loading = 'lazy'; image.decoding = 'async';
      image.addEventListener('error', function () { image.remove(); });
      box.appendChild(image);
      var center = item.centroid_coordinates || {};
      box.appendChild(el('p', 'apod-explanation', 'ရိုက်ကူးချိန် (UTC): ' + item.date + ' · ဗဟို: lat ' + fmt(center.lat, 1) + '°, lon ' + fmt(center.lon, 1) + '°'));
    });

    widget('wArxiv', 'arxiv', 72, function () { return Promise.reject(new Error('arXiv data is fetched by the build workflow')); }, function (box, rows) {
      if (!Array.isArray(rows) || !rows.length) throw new Error('No arXiv articles');
      rows.forEach(function (paper) {
        var item = el('div', 'newsitem');
        item.appendChild(link(paper.link, paper.title || 'သုတေသနစာတမ်း'));
        item.appendChild(el('div', 'meta', (paper.published || '') + (paper.author ? ' · ' + paper.author + ' et al.' : '')));
        box.appendChild(item);
      });
    }, 'arXiv စာတမ်းများကို ' + 'arxiv.org/list/astro-ph/recent' + ' မှာလည်း ကြည့်နိုင်ပါတယ်။');

    var refreshNews = widget('wNews', 'news', 12, function () {
      return getJSON('https://api.spaceflightnewsapi.net/v4/articles/?limit=6', 12000, 120000);
    }, function (box, data) {
      var articles = Array.isArray(data) ? data : data && data.results;
      if (!Array.isArray(articles) || !articles.length) throw new Error('No spaceflight news');
      articles.slice(0, 6).forEach(function (article) {
        var item = el('div', 'newsitem');
        item.appendChild(link(article.url, article.title || 'အာကာသသတင်း'));
        item.appendChild(el('div', 'meta', (article.news_site || 'Spaceflight News') + ' · ' + String(article.published_at || '').slice(0, 10)));
        box.appendChild(item);
      });
    }, undefined, true);
    setInterval(function () { if (!d.hidden) refreshNews(true); }, 300000);

    widget('wLaunch', 'launches', 48, function () { return Promise.reject(new Error('Launch data is refreshed by GitHub Actions')); }, function (box, items) {
      if (!Array.isArray(items) || !items.length) throw new Error('No launch data');
      items.slice(0, 5).forEach(function (item) {
        var row = el('div', 'newsitem');
        row.appendChild(el('b', '', item.name || item.mission || 'Mission အမည် မသိရသေး'));
        var parts = [];
        if (item.datetime) {
          var date = new Date(item.datetime);
          parts.push(Number.isNaN(date.getTime()) ? item.datetime : date.toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'UTC' }) + ' UTC');
        } else parts.push('အချိန် မသတ်မှတ်ရသေး');
        if (item.precision) parts.push('အချိန်တိကျမှု: ' + item.precision);
        if (item.status) parts.push('အခြေအနေ: ' + item.status);
        if (item.provider) parts.push(item.provider);
        if (item.location) parts.push(item.location);
        row.appendChild(el('div', 'meta', parts.join(' · ')));
        box.appendChild(row);
      });
    }, 'လွှတ်တင်မှုဇယားကို GitHub Actions ကနေ သုံးနာရီတစ်ခါ update လုပ်ပါတယ်။ မူရင်းဒေတာ မရနိုင်ပါက နောက်ဆုံးသိမ်းထားသော snapshot ကို ပြသနိုင်ပါတယ်။');

    var query = $('imgQ');
    searchImages((query && query.value || 'Apollo 11').trim());
  }

  function searchImages(query) {
    var box = $('wImg');
    if (!box) return;
    var searchTerm = String(query || '').trim().slice(0, 120) || 'nebula';
    box.setAttribute('aria-live', 'polite');
    box.replaceChildren(el('div', 'skel'));
    getJSON('https://images-api.nasa.gov/search?q=' + encodeURIComponent(searchTerm) + '&media_type=image&page_size=8', 15000, 600000).then(function (data) {
      var collection = data && data.collection;
      var rows = Array.isArray(collection && collection.items) ? collection.items : [];
      box.replaceChildren();
      var grid = el('div', 'thumbgrid');
      rows.forEach(function (item) {
        var meta = Array.isArray(item.data) && item.data[0];
        var links = Array.isArray(item.links) ? item.links : [];
        var imageHref = links.length && safeURL(links[0].href);
        if (!meta || !imageHref || !meta.nasa_id) return;
        var anchor = link('https://images.nasa.gov/details/' + encodeURIComponent(meta.nasa_id), '');
        if (anchor.tagName !== 'A') return;
        var image = el('img'); image.src = imageHref; image.alt = meta.title || 'NASA ဓာတ်ပုံ'; image.loading = 'lazy'; image.decoding = 'async';
        anchor.appendChild(image); grid.appendChild(anchor);
      });
      if (!grid.childElementCount) {
        box.appendChild(el('p', '', 'ရလဒ် မတွေ့ပါ — nebula, Saturn, astronaut စတဲ့ စကားလုံးနဲ့ ထပ်ရှာကြည့်ပါ။'));
        return;
      }
      box.appendChild(grid);
      var total = collection && collection.metadata && collection.metadata.total_hits;
      box.appendChild(el('p', 'livenote', 'ပြထားသော ပုံ ' + grid.childElementCount + ' ပုံ · ရလဒ်စုစုပေါင်း ' + fmt(total, 0) + ' ခု'));
    }).catch(function () { fail(box, function () { searchImages(searchTerm); }); });
  }

  function keyBox() {
    var liveSection = $('live');
    var grid0 = liveSection && liveSection.querySelector('.grid.g2');
    if (!grid0) return;
    var details = el('details', 'keybox');
    details.appendChild(el('summary', '', 'ကိုယ်ပိုင် NASA API key ထည့်ရန် (မထည့်လည်း ရပါတယ်)'));
    var paragraph = el('p');
    paragraph.appendChild(d.createTextNode('DEMO_KEY က လူများစွာ မျှသုံးတာကြောင့် ကန့်သတ်ချက် ပြည့်နိုင်ပါတယ်။ အခမဲ့ key ကို '));
    paragraph.appendChild(link('https://api.nasa.gov/', 'api.nasa.gov'));
    paragraph.appendChild(d.createTextNode(' မှာ ရယူနိုင်ပါတယ်။ ဒီ key ကို သင့် browser ထဲမှာပဲ သိမ်းထားပါတယ်။'));
    var input = el('input'); input.type = 'password'; input.placeholder = 'NASA API key'; input.setAttribute('aria-label', 'NASA API key'); input.autocomplete = 'off'; input.spellcheck = false;
    try { input.value = localStorage.getItem(KEY_STORE) || ''; } catch (_) {}
    var button = el('button', 'retry', 'သိမ်းပြီး ပြန်ဆွဲမယ်'); button.type = 'button';
    button.addEventListener('click', function () {
      try {
        if (input.value.trim()) localStorage.setItem(KEY_STORE, input.value.trim());
        else localStorage.removeItem(KEY_STORE);
      } catch (_) {}
      window.location.reload();
    });
    details.append(paragraph, input, button);
    grid0.parentNode.insertBefore(details, grid0.nextSibling);
  }

  keyBox();
  var liveSection = $('live');
  if ('IntersectionObserver' in window && liveSection) {
    var observer = new IntersectionObserver(function (entries) {
      if (entries[0] && entries[0].isIntersecting) { observer.disconnect(); init(); }
    }, { rootMargin: '300px' });
    observer.observe(liveSection);
  } else init();

  var searchButton = $('imgBtn');
  var searchInput = $('imgQ');
  if (searchButton) searchButton.addEventListener('click', function () { searchImages(searchInput && searchInput.value || 'nebula'); });
  if (searchInput) searchInput.addEventListener('keydown', function (event) {
    if (event.key === 'Enter') { event.preventDefault(); searchImages(searchInput.value || 'nebula'); }
  });
})();
