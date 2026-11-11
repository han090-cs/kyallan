/* ---------- weight & age calculator ---------- */
(function(){
  var BODIES = [
    {n:'Mercury — ဗုဒ္ဓဟူးဂြိုဟ်', g:0.38, period:88},
    {n:'Venus — သောကြာဂြိုဟ်', g:0.91, period:225},
    {n:'Earth — ကမ္ဘာဂြိုဟ်', g:1.00, period:365.25},
    {n:'Moon — လ', g:0.17, period:null},
    {n:'Mars — အင်္ဂါဂြိုဟ်', g:0.38, period:687},
    {n:'Jupiter — ကြာသပတေးဂြိုဟ်', g:2.34, period:4333},
    {n:'Saturn — စနေဂြိုဟ်', g:0.93, period:10759},
    {n:'Uranus — ယူရေးနပ်စ်ဂြိုဟ်', g:0.89, period:30687},
    {n:'Neptune — နပ်ကျွန်းဂြိုဟ်', g:1.12, period:60190},
    {n:'Pluto — ပလူတို (ဂြိုဟ်ပုငယ်)', g:0.06, period:90560}
  ];
  function fmtAge(y){
    if(y >= 10){ return y.toFixed(1); }
    if(y >= 1){ return y.toFixed(2); }
    return y.toFixed(3);
  }
  function calc(){
    var w = parseFloat(document.getElementById('cw').value);
    var bdVal = document.getElementById('cbd').value;
    var out = document.getElementById('calcOut');
    var hasW = isFinite(w) && w > 0;
    var days = null;
    if(bdVal){
      var bd = new Date(bdVal + 'T00:00:00');
      if(!isNaN(bd.getTime())){
        var diff = Date.now() - bd.getTime();
        if(diff >= 0){ days = diff / 86400000; }
      }
    }
    if(!hasW && days === null){
      out.innerHTML = '<p class="meta">အလေးချိန် (kg) ဒါမှမဟုတ် မွေးနေ့ — အနည်းဆုံး တစ်ခု ထည့်ပေးပါ။</p>';
      return;
    }
    var wrap = document.createElement('div'); wrap.className = 'tblwrap';
    var t = document.createElement('table'); t.className = 'tbl';
    var head = '<tr><th>ဂြိုဟ် / လ</th><th>ဆွဲငင်အား အချိုး</th>' +
      (hasW ? '<th>သင့် အလေးချိန်</th>' : '') +
      (days !== null ? '<th>တစ်နှစ် အရှည်</th><th>သင့် အသက် (အဲဒီ ဂြိုဟ်နှစ်နဲ့)</th>' : '') + '</tr>';
    t.innerHTML = head;
    BODIES.forEach(function(b){
      var tr = document.createElement('tr');
      var html = '<td>' + b.n + '</td><td>× ' + b.g.toFixed(2) + '</td>';
      if(hasW){ html += '<td><b>' + (w * b.g).toFixed(1) + ' kg</b></td>'; }
      if(days !== null){
        if(b.period){
          html += '<td>' + b.period.toLocaleString('en-US') + ' ကမ္ဘာရက်</td><td><b>' + fmtAge(days / b.period) + ' နှစ်</b></td>';
        } else {
          html += '<td>—</td><td>— (ကိုယ်ပိုင် "နှစ်" မရှိ)</td>';
        }
      }
      tr.innerHTML = html;
      t.appendChild(tr);
    });
    wrap.appendChild(t);
    out.innerHTML = '';
    if(days !== null){
      var sum = document.createElement('p');
      sum.style.cssText = 'color:var(--ink2); font-size:16px; margin-bottom:12px';
      sum.textContent = 'သင် အသက်ရှင် နေထိုင်ခဲ့တာ ကမ္ဘာရက် ' + Math.floor(days).toLocaleString('en-US') + ' ရက် (ကမ္ဘာနှစ်နဲ့ ' + (days / 365.25).toFixed(1) + ' နှစ်) ရှိပါပြီ — ဒီ ရက် အရေအတွက်က ဘယ်ဂြိုဟ်မှာမဆို အတူတူပါပဲ၊ "နှစ်" ရဲ့ အရှည်ပဲ ကွာတာပါ။';
      out.appendChild(sum);
    }
    out.appendChild(wrap);
    var note = document.createElement('p'); note.className = 'small'; note.style.marginTop = '10px';
    note.textContent = 'မှတ်ချက် — အလေးချိန်က ချိန်ခွင် ညွှန်းကိန်း (kg နဲ့ ပြတဲ့ တန်ဖိုး) ဖြစ်ပြီး သင့် mass (ဒြပ်ထု) ကတော့ ဘယ်မှာမဆို မူရင်း kg အတိုင်းပဲ ဖြစ်ပါတယ်။ ဂြိုဟ်ကြီးတွေ (Jupiter–Neptune) မှာ အမှန် ခြေချ ရပ်စရာ မျက်နှာပြင် မရှိလို့ ကိန်းတွေက "အဲဒီ ဆွဲငင်အား ရှိတဲ့ နေရာမှာ ရပ်ရင်" ဆိုတဲ့ သီအိုရီ အရ တွက်ချက်မှုပါ။';
    out.appendChild(note);
  }
  document.getElementById('calcBtn').addEventListener('click', calc);
  document.getElementById('cw').addEventListener('keydown', function(ev){ if(ev.key === 'Enter'){ ev.preventDefault(); calc(); } });
})();

/* ---------- tonight's sky ---------- */
(function(){
  var now = new Date();
  /* --- moon phase --- */
  var st = MOONPHASES.state(now);
  var synodic = st.length;
  var age = st.age;
  var illum = st.illum;
  var names = ['လဆန်း (New Moon) — လ မမြင်ရသလောက်', 'လခြမ်း တိုးပွား (Waxing Crescent)', 'လဝက် တိုးပွား (First Quarter)', 'လပြည့်နီး တိုးပွား (Waxing Gibbous)', 'လပြည့် (Full Moon)', 'လပြည့်နီး ဆုတ်ယုတ် (Waning Gibbous)', 'လဝက် ဆုတ်ယုတ် (Last Quarter)', 'လခြမ်း ဆုတ်ယုတ် (Waning Crescent)'];
  var idx = Math.floor((age / synodic) * 8 + 0.5) % 8;
  var waxing = age < synodic / 2;
  var toFull = st.toFull;
  var toNew = st.toNew;
  var moonBox = document.getElementById('tMoon');
  moonBox.innerHTML = '';
  var wrap = document.createElement('div'); wrap.className = 'moonwrap';
  var ball = document.createElement('div'); ball.className = 'moonball';
  var lit = document.createElement('div'); lit.className = 'moonlit';
  lit.style.transformOrigin = waxing ? 'left center' : 'right center';
  lit.style.transform = 'scaleX(' + Math.max(illum, 0.03).toFixed(2) + ')';
  lit.style.opacity = illum < 0.04 ? '0.12' : '1';
  ball.appendChild(lit);
  var info = document.createElement('div');
  var dateStr = now.toLocaleDateString('en-GB', {year: 'numeric', month: 'long', day: 'numeric'});
  info.innerHTML = '<p style="margin-bottom:6px"><b>' + dateStr + '</b> အတွက်</p>' +
    '<p style="margin-bottom:6px">အဆင့် — <b>' + names[idx] + '</b></p>' +
    '<p style="margin-bottom:6px">လင်းနေတဲ့ အပိုင်း — <b>' + Math.round(illum * 100) + '%</b> · လ သက်တမ်း (လဆန်းက စရေတွက်) — <b>' + age.toFixed(1) + ' ရက်</b></p>' +
    '<p style="margin:0">နောက် လပြည့်အထိ — <b>' + toFull.toFixed(1) + ' ရက်</b> · နောက် လဆန်းအထိ — <b>' + toNew.toFixed(1) + ' ရက်</b></p>';
  wrap.appendChild(ball); wrap.appendChild(info);
  moonBox.appendChild(wrap);
  var mn = document.createElement('p'); mn.className = 'livenote';
  mn.textContent = 'ပုံက အနီးစပ် သရုပ်ဖော်ပုံ ဖြစ်ပြီး (ဘယ်/ညာ လင်းတဲ့ ဘက်က တိုးပွား/ဆုတ်ယုတ် အလိုက် ပြောင်းတယ်)၊ ရာခိုင်နှုန်းတွေက လဆန်း/လပြည့် အချိန်အတိအကျ (မိနစ်အနည်းငယ် တိကျ) ကနေ တွက်ထားတာဖြစ်လို့ နှစ်တွေ ဘယ်လောက်ပဲ ကြာကြာ ပြန်မပြင်ရပါဘူး။';
  moonBox.appendChild(mn);
  /* --- planets (computed for today's date, so no monthly manual update is needed) --- */
  var pBox = document.getElementById('tPlanets');
  pBox.innerHTML = '';
  function addList(title, items, margin){
    var h = document.createElement('p'); h.style.cssText = 'margin:' + margin + ' 0 6px';
    h.innerHTML = '<b>' + title + '</b>';
    pBox.appendChild(h);
    var ul = document.createElement('ul'); ul.className = 'ppl';
    items.forEach(function(t){ var li = document.createElement('li'); li.textContent = t; ul.appendChild(li); });
    pBox.appendChild(ul);
  }
  var g = EPHEM.guide(now);
  if (g.evening.length) addList('🌆 ညနေ (နေဝင်ပြီး) —', g.evening, '0');
  if (g.morning.length) addList('🌅 မနက် (နေမထွက်ခင်) —', g.morning, g.evening.length ? '10px' : '0');
  if (g.hidden.length) {
    var ph = document.createElement('p'); ph.style.cssText = 'margin:10px 0 0;color:var(--ink2)';
    ph.textContent = 'နေနဲ့ အရမ်းနီးနေလို့ ဒီအချိန် မမြင်ရတာ — ' + g.hidden.join(', ');
    pBox.appendChild(ph);
  }
  /* optional hand-written notes for this month (see data/sky.js) — not required */
  var key = now.getFullYear() + '-' + ('0' + (now.getMonth() + 1)).slice(-2);
  var extra = (typeof SKY !== 'undefined') ? SKY[key] : null;
  if (extra) {
    var notes = (extra.e || []).concat(extra.m || []).filter(function(t){ return /opposition/.test(t); });
    if (notes.length) addList('📌 ဒီလ အထူးမှတ်ချက် —', notes, '10px');
  }
  var pn = document.createElement('p'); pn.className = 'livenote';
  pn.textContent = 'ဂြိုဟ်တွေရဲ့ တည်နေရာကို ယနေ့ရက်စွဲနဲ့ ကိုယ်တိုင် တွက်ထုတ်ထားတာ (တိကျမှု ~၁ ဒီဂရီ) ဖြစ်လို့ ရက်စွဲ ဘယ်လောက်ပဲ ကြာကြာ ပြန်မပြင်ရပါဘူး။ အတိအကျ အချိန်/အမြင့်အတွက် Stellarium app နဲ့ တိုက်စစ်ပါ။';
  pBox.appendChild(pn);
})();

/* ---------- calendar: dim events that already passed (no manual cleanup needed) ---------- */
(function(){
  var rows = document.querySelectorAll('#calendar [data-autopast] tr[data-end]');
  if(!rows.length) return;
  var today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Yangon' }).format(new Date());
  var upcoming = 0;
  rows.forEach(function(tr){
    if(tr.getAttribute('data-end') < today){
      tr.style.opacity = '0.55';
      tr.classList.add('is-past');
      var first = tr.querySelector('td');
      if(first && !first.querySelector('.past-tag')){
        var tag = document.createElement('small'); tag.className = 'past-tag'; tag.textContent = ' · ပြီးဆုံး';
        first.appendChild(tag);
      }
    } else { upcoming++; }
  });
  var note = document.getElementById('calExpired');
  if(note && !upcoming) note.hidden = false;
})();

/* ---------- upcoming new / full moons (computed) ---------- */
(function(){
  var box = document.getElementById('tPhases');
  if(!box) return;
  var months = ['ဇန်နဝါရီ','ဖေဖော်ဝါရီ','မတ်','ဧပြီ','မေ','ဇွန်','ဇူလိုင်','ဩဂုတ်','စက်တင်ဘာ','အောက်တိုဘာ','နိုဝင်ဘာ','ဒီဇင်ဘာ'];
  function bn(n){ return String(n).replace(/\d/g, function(c){ return '၀၁၂၃၄၅၆၇၈၉'[c]; }); }
  function mmt(date){ return new Date(date.getTime() + 6.5 * 3600000); } /* Myanmar time = UTC+6:30 */
  box.innerHTML = '';
  var table = document.createElement('table'); table.className = 'tbl tbl-keep';
  MOONPHASES.upcoming(new Date(), 8).forEach(function(ev){
    var t = mmt(ev.date);
    var tr = document.createElement('tr');
    var a = document.createElement('td'); a.textContent = ev.type === 'full' ? '🌕 လပြည့်' : '🌑 လဆန်း (လကွယ်)';
    var b = document.createElement('td');
    b.textContent = bn(t.getUTCFullYear()) + ' ' + months[t.getUTCMonth()] + ' ' + bn(t.getUTCDate()) + ' · ' + bn(('0' + t.getUTCHours()).slice(-2)) + ':' + bn(('0' + t.getUTCMinutes()).slice(-2)) + ' (MMT)';
    tr.appendChild(a); tr.appendChild(b); table.appendChild(tr);
  });
  var wrap = document.createElement('div'); wrap.className = 'tblwrap'; wrap.appendChild(table);
  box.appendChild(wrap);
})();

/* ---------- meteor shower rows: add computed moon brightness at the peak ---------- */
(function(){
  var rows = document.querySelectorAll('#calendar [data-moon] tr[data-end]');
  rows.forEach(function(tr){
    var cells = tr.querySelectorAll('td:not(.tbl-more)');
    var last = cells[cells.length - 1];
    if(!last || last.querySelector('.moonline')) return;
    last = last.querySelector('.v') || last;
    var st = MOONPHASES.state(new Date(tr.getAttribute('data-end') + 'T00:00:00Z'));
    var pct = Math.round(st.illum * 100);
    var verdict = pct <= 30 ? 'ကြယ်ကြွေကြည့်ဖို့ ကောင်း' : pct >= 70 ? 'လအလင်း အရမ်းများ၊ မှိန်တဲ့ ကြယ်ကြွေ ဖုံးမယ်' : 'လအလင်း အသင့်အတင့်';
    var line = document.createElement('div'); line.className = 'small moonline'; line.style.marginTop = '6px';
    line.textContent = '🌙 အထွတ်အထိပ်ည လအလင်း (တွက်ချက်) ~' + String(pct).replace(/\d/g, function(c){ return '၀၁၂၃၄၅၆၇၈၉'[c]; }) + '% — ' + verdict;
    last.appendChild(line);
  });
})();

/* ---------- tables on phones: "show more / less" for rows with many columns ---------- */
document.addEventListener('click', function(e){
  var btn = e.target.closest && e.target.closest('.tbl-toggle');
  if(!btn) return;
  var tr = btn.closest('tr');
  var open = tr.classList.toggle('open');
  btn.setAttribute('aria-expanded', open ? 'true' : 'false');
  btn.textContent = open ? 'လျှော့ပြရန် ▴' : 'ပိုကြည့်ရန် ▾';
});

/* ---------- tables on phones: show only the first rows, expand on tap (keeps long sections short) ---------- */
(function(){
  var LIMIT = 4;
  document.querySelectorAll('.tbl:not(.tbl-keep)').forEach(function(table){
    var rows = [].slice.call(table.querySelectorAll('tr:not(.thead-row)'));
    var live = rows.filter(function(r){ return !r.classList.contains('is-past'); });
    var hiddenRows = rows.filter(function(r){ return live.indexOf(r) < 0 || live.indexOf(r) >= LIMIT; });
    /* do not hide just one or two rows: not worth a button */
    if(hiddenRows.length < 2 && hiddenRows.every(function(r){ return live.indexOf(r) >= 0; })) return;
    hiddenRows.forEach(function(r){ r.classList.add('row-extra'); });
    var btn = document.createElement('button');
    btn.type = 'button'; btn.className = 'tbl-rows-toggle'; btn.setAttribute('aria-expanded', 'false');
    var more = 'ကျန် ' + String(hiddenRows.length).replace(/\d/g, function(c){ return '၀၁၂၃၄၅၆၇၈၉'[c]; }) + ' ခု ကြည့်ရန် ▾';
    btn.textContent = more;
    btn.addEventListener('click', function(){
      var open = table.classList.toggle('all-rows');
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      btn.textContent = open ? 'လျှော့ပြရန် ▴' : more;
    });
    table.parentNode.insertBefore(btn, table.nextSibling);
  });
})();

/* ---------- reader text size: 90% / 100% / 115% / 130%, remembered on this device ---------- */
(function(){
  var btn = document.getElementById('fsBtn');
  if(!btn) return;
  var steps = [0.9, 1, 1.15, 1.3];
  function current(){
    var v = parseFloat(document.documentElement.style.getPropertyValue('--fs'));
    return isFinite(v) && v > 0 ? v : 1;
  }
  function label(v){
    var pct = String(Math.round(v * 100)).replace(/\d/g, function(c){ return '၀၁၂၃၄၅၆၇၈၉'[c]; });
    btn.setAttribute('aria-label', 'စာလုံးအရွယ် ' + pct + '% — နှိပ်ရင် ပြောင်းမယ်');
    btn.title = 'စာလုံးအရွယ် ' + pct + '%';
  }
  label(current());
  btn.addEventListener('click', function(){
    var cur = current(), idx = 0, best = 9;
    steps.forEach(function(s, i){ var diff = Math.abs(s - cur); if(diff < best){ best = diff; idx = i; } });
    var next = steps[(idx + 1) % steps.length];
    document.documentElement.style.setProperty('--fs', String(next));
    try { localStorage.setItem('kyallan:fs', String(next)); } catch(e){}
    label(next);
  });
})();
