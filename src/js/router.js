/* router.js — one section at a time, prev/next pager, home search */
(function(){
  var d = document;
  var secs = [].slice.call(d.querySelectorAll('main>section'));
  var homeEls = [d.getElementById('hero'), d.querySelector('.explore')];
  var links = [].slice.call(d.querySelectorAll('#menu a[data-spy]'));
  var order = links.map(function(a){ return { id: a.getAttribute('data-spy'), icon: a.firstChild.textContent, title: a.lastChild.textContent }; });
  var siteTitle = d.title, current = null;

  /* back link + pager inside every section */
  secs.forEach(function(s){
    var i = order.map(function(o){ return o.id; }).indexOf(s.id), w = s.querySelector('.wrap');
    if(i < 0 || !w){ return; }
    var back = d.createElement('a'); back.className = 'back'; back.href = '#top'; back.textContent = '‹ အပိုင်းအားလုံး';
    w.insertBefore(back, w.firstChild);
    var nav = d.createElement('nav'); nav.className = 'pager'; nav.setAttribute('aria-label', 'အပိုင်း ရွှေ့ရန်');
    function cell(o, label, cls){
      var a = d.createElement('a'); a.href = '#' + o.id; a.className = cls;
      a.innerHTML = '<small></small><b></b>';
      a.firstChild.textContent = label; a.lastChild.textContent = o.icon + ' ' + o.title; return a;
    }
    if(order[i - 1]){ nav.appendChild(cell(order[i - 1], '‹ ရှေ့အပိုင်း', 'prev')); }
    if(order[i + 1]){ nav.appendChild(cell(order[i + 1], 'နောက်အပိုင်း ›', 'next')); }
    var r = w.querySelector('.rule'); w.insertBefore(nav, r || null);
  });

  function route(){
    var id = ''; try{ id = decodeURIComponent(location.hash.slice(1)); }catch(e){}
    var el = id && d.getElementById(id), sec = el && el.closest ? el.closest('main>section') : null;
    var changed = sec !== current;
    current = sec;
    secs.forEach(function(s){ s.hidden = s !== sec; });
    homeEls.forEach(function(h){ if(h){ h.hidden = !!sec; } });
    links.forEach(function(a){ a.classList.toggle('on', !!sec && a.getAttribute('data-spy') === sec.id); });
    var o = sec && order.filter(function(x){ return x.id === sec.id; })[0];
    d.title = o ? o.title + ' · Kyallan' : siteTitle;
    d.body.setAttribute('data-view', sec ? 'section' : 'home');
    d.documentElement.dataset.route = sec ? 'section' : 'home';
    if(sec && el !== sec){ el.scrollIntoView(); }
    else if(changed){ window.scrollTo(0, 0); }
  }
  window.addEventListener('hashchange', route); route();

  /* home: search */
  var ex = d.querySelector('.explore'), title = ex && ex.querySelector('.ex-title');
  if(title){
    var box = d.createElement('div'); box.className = 'search';
    box.innerHTML = '<input id="q" type="search" autocomplete="off" aria-label="အပိုင်း ရှာရန်" placeholder="အပိုင်း ရှာရန် — ဥပမာ ISS၊ Mars၊ black hole" /><p class="small" id="qn" hidden>ဒီစကားလုံးနဲ့ ကိုက်တဲ့ အပိုင်း မတွေ့ပါ။ တခြား စကားလုံး စမ်းကြည့်ပါ။</p>';
    title.after(box);
    var q = box.querySelector('#q'), qn = box.querySelector('#qn');
    q.addEventListener('input', function(){
      var t = q.value.trim().toLowerCase(), total = 0;
      [].slice.call(ex.querySelectorAll('.egrid')).forEach(function(g){
        var n = 0;
        [].slice.call(g.children).forEach(function(a){ var ok = !t || a.textContent.toLowerCase().indexOf(t) > -1; a.hidden = !ok; if(ok){ n++; } });
        g.hidden = !n; g.previousElementSibling.hidden = !n; total += n;
      });
      qn.hidden = !!total;
    });
  }
})();
