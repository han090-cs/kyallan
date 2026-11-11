/* gallery.js — NASA Image and Video Library photo strips.
   Each <div class="nasa-gallery" data-q="search words" data-title="heading"> is filled when it scrolls near the screen.
   Source order: (1) data/gallery.json built by the site (no API call for visitors), (2) images-api.nasa.gov directly,
   cached for a week in the visitor's browser. If neither works the strip simply stays empty (zero height). */
(function () {
  'use strict';
  var d = document;
  var boxes = [].slice.call(d.querySelectorAll('.nasa-gallery'));
  if (!boxes.length) return;

  var API = 'https://images-api.nasa.gov/search?media_type=image&page_size=24&q=';
  var WEEK = 7 * 24 * 3600 * 1000;
  var snapshotPromise = null;

  function el(tag, cls, text) {
    var n = d.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = String(text);
    return n;
  }
  function bn(n) { return String(n).replace(/\d/g, function (c) { return '၀၁၂၃၄၅၆၇၈၉'[c]; }); }

  /* normalise an images-api search result into [{id,title,thumb,center}] */
  function parse(json) {
    var items = json && json.collection && json.collection.items;
    if (!Array.isArray(items)) return [];
    var seen = {}, out = [];
    items.forEach(function (item) {
      var meta = item && item.data && item.data[0];
      var thumb = item && item.links && item.links[0] && item.links[0].href;
      if (!meta || !meta.nasa_id || !meta.title || typeof thumb !== 'string') return;
      if (!/^https:\/\/images-assets\.nasa\.gov\/.+\.(?:jpe?g|png)$/i.test(thumb)) return;
      var key = meta.title.toLowerCase();
      if (seen[key]) return;
      seen[key] = true;
      out.push({ id: String(meta.nasa_id), title: String(meta.title), thumb: thumb, center: meta.center ? String(meta.center) : '' });
    });
    return out;
  }

  function fromSnapshot(q) {
    if (!snapshotPromise) {
      snapshotPromise = KyallanAPI.getJSON('data/gallery.json?h=' + Math.floor(Date.now() / 3600000), 8000)
        .then(function (row) { return row && row.ok === true && row.data ? row.data : {}; })
        .catch(function () { return {}; });
    }
    return snapshotPromise.then(function (all) {
      if (Array.isArray(all[q]) && all[q].length) return all[q];
      throw new Error('not in snapshot');
    });
  }
  function fromAPI(q) {
    return KyallanAPI.getJSON(API + encodeURIComponent(q), 15000, 0, { persistMs: WEEK }).then(function (json) {
      var list = parse(json);
      if (!list.length) throw new Error('no images');
      return list;
    });
  }

  /* a different set each day without extra API calls */
  function pick(list, n) {
    if (list.length <= n) return list;
    var day = Math.floor(Date.now() / 86400000);
    var start = (day * n) % list.length;
    var out = [];
    for (var i = 0; i < n; i++) out.push(list[(start + i) % list.length]);
    return out;
  }

  function figure(item) {
    var fig = el('figure', 'nfig');
    var a = el('a');
    a.href = 'https://images.nasa.gov/details/' + encodeURIComponent(item.id);
    a.target = '_blank'; a.rel = 'noopener noreferrer';
    var img = el('img');
    var medium = item.thumb.replace(/~thumb\.(jpe?g|png)$/i, '~medium.$1');
    var triedFallback = false;
    img.src = medium; img.alt = item.title; img.loading = 'lazy'; img.decoding = 'async';
    img.addEventListener('error', function () {
      if (!triedFallback && medium !== item.thumb) { triedFallback = true; img.src = item.thumb; return; }
      fig.remove();
    });
    a.appendChild(img);
    fig.appendChild(a);
    fig.appendChild(el('figcaption', '', item.title));
    return fig;
  }

  function render(box, list) {
    var n = Number(box.getAttribute('data-n')) || 6;
    box.replaceChildren();
    box.appendChild(el('h3', '', box.getAttribute('data-title') || '🖼️ ပုံများ'));
    var grid = el('div', 'ngrid');
    pick(list, n).forEach(function (item) { grid.appendChild(figure(item)); });
    box.appendChild(grid);
    var note = el('p', 'livenote');
    note.appendChild(d.createTextNode('ပုံတွေကို '));
    var a1 = el('a', '', 'NASA Image and Video Library'); a1.href = 'https://images.nasa.gov/'; a1.target = '_blank'; a1.rel = 'noopener noreferrer';
    note.appendChild(a1);
    note.appendChild(d.createTextNode(' ကနေ ယူထားပါတယ် (ပုံပေါ်နှိပ်ရင် မူရင်းစာမျက်နှာ ဖွင့်မယ်)။ ဓာတ်ပုံ တစ်ပုံချင်းစီရဲ့ ပိုင်ရှင်/အသုံးပြုခွင့်ကို '));
    var a2 = el('a', '', 'NASA Media Guidelines'); a2.href = 'https://www.nasa.gov/nasa-brand-center/images-and-media/'; a2.target = '_blank'; a2.rel = 'noopener noreferrer';
    note.appendChild(a2);
    note.appendChild(d.createTextNode(' မှာ စစ်ပါ။'));
    box.appendChild(note);
  }

  function load(box) {
    var q = box.getAttribute('data-q');
    if (!q || box.getAttribute('data-state') === 'loading' || box.getAttribute('data-state') === 'done') return;
    box.setAttribute('data-state', 'loading');
    fromSnapshot(q).catch(function () { return fromAPI(q); }).then(function (list) {
      render(box, list);
      box.setAttribute('data-state', 'done');
    }).catch(function () {
      box.setAttribute('data-state', 'failed'); /* decorative: stays empty, retried when the connection returns */
    });
  }

  window.addEventListener('online', function () {
    boxes.forEach(function (box) { if (box.getAttribute('data-state') === 'failed') { box.removeAttribute('data-state'); load(box); } });
  });
  if (!('IntersectionObserver' in window)) { boxes.forEach(load); return; }
  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) { observer.unobserve(entry.target); load(entry.target); }
    });
  }, { rootMargin: '300px' });
  boxes.forEach(function (box) { observer.observe(box); });
})();
