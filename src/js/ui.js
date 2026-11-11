/* ui.js — menu, theme, scroll-spy, progress bar, counters, click-to-load video */
(function(){
  var d = document, root = d.documentElement;
  function $(s){ return d.querySelector(s); }
  function all(s){ return Array.prototype.slice.call(d.querySelectorAll(s)); }
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* theme: follow system until the visitor picks one */
  var tb = $('#themeBtn');
  function isDark(){ var t = root.dataset.theme; return t ? t === 'dark' : (window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches); }
  function paintMeta(){ var m = $('meta[name="theme-color"]'); if(m){ m.content = isDark() ? '#04060f' : '#edf0f7'; } }
  tb.addEventListener('click', function(){
    var next = isDark() ? 'light' : 'dark';
    root.dataset.theme = next;
    try{ localStorage.setItem('kyallan-theme', next); }catch(e){}
    paintMeta();
  });
  paintMeta();

  /* menu */
  var dlg = $('#menu'), mb = $('#menuBtn');
  function openMenu(){ if(dlg.showModal){ dlg.showModal(); } else { dlg.setAttribute('open',''); } }
  function closeMenu(){ if(dlg.close){ dlg.close(); } else { dlg.removeAttribute('open'); } }
  mb.addEventListener('click', openMenu);
  $('#menuClose').addEventListener('click', closeMenu);
  dlg.addEventListener('click', function(e){ if(e.target === dlg){ closeMenu(); } });
  all('#menu a').forEach(function(a){ a.addEventListener('click', closeMenu); });

  /* scroll-spy: highlight current section in menu + show its name in the header */
  var now = $('#now'), links = {};
  all('[data-spy]').forEach(function(a){ links[a.getAttribute('data-spy')] = a; });
  if('IntersectionObserver' in window){
    var spy = new IntersectionObserver(function(es){
      es.forEach(function(e){
        if(!e.isIntersecting){ return; }
        Object.keys(links).forEach(function(k){ links[k].classList.toggle('on', k === e.target.id); });
        var a = links[e.target.id]; now.textContent = a ? a.lastChild.textContent : '';
      });
    }, { rootMargin: '-25% 0px -65% 0px' });
    all('main>section').forEach(function(s){ spy.observe(s); });
  }

  /* progress bar + back-to-top */
  var bar = $('#progress'), up = $('#toTop'), tick = false;
  function onScroll(){
    if(tick){ return; } tick = true;
    requestAnimationFrame(function(){
      var h = root.scrollHeight - root.clientHeight, y = window.pageYOffset;
      bar.style.transform = 'scaleX(' + (h > 0 ? Math.min(y / h, 1) : 0) + ')';
      up.hidden = y < 900; if(y < 300){ now.textContent = ''; }
      tick = false;
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true }); onScroll();
  up.addEventListener('click', function(){ window.scrollTo({ top: 0, behavior: (reduce || window.pageYOffset > 6000) ? 'auto' : 'smooth' }); });

  /* counters (data-count = fixed number, data-since = years since a date) */
  var bd = function(n){ return String(n).replace(/\d/g, function(c){ return '၀၁၂၃၄၅၆၇၈၉'[c]; }); };
  function target(el){
    var s = el.getAttribute('data-since');
    return s ? Math.floor((Date.now() - new Date(s).getTime()) / 31557600000) : parseInt(el.getAttribute('data-count'), 10);
  }
  function run(el){
    var to = target(el), t0 = null;
    if(reduce){ el.textContent = bd(to.toLocaleString('en-US')); return; }
    (function frame(ts){
      if(!t0){ t0 = ts; } var p = Math.min((ts - t0) / 1400, 1);
      el.textContent = bd(Math.round(to * (0.2 + 0.8 * p)).toLocaleString('en-US'));
      if(p < 1){ requestAnimationFrame(frame); }
    })(performance.now());
  }
  var cs = all('[data-count],[data-since]');
  if('IntersectionObserver' in window){
    var io = new IntersectionObserver(function(es){ es.forEach(function(e){ if(e.isIntersecting){ run(e.target); io.unobserve(e.target); } }); }, { threshold: .4 });
    cs.forEach(function(el){ el.textContent = bd(target(el).toLocaleString('en-US')); io.observe(el); });
  } else { cs.forEach(run); }

  /* video: load only after a tap (saves mobile data) */
  all('.vidframe[data-yt]').forEach(function(box){
    var b = d.createElement('button'); b.type = 'button'; b.className = 'vidbtn';
    b.innerHTML = '<i aria-hidden="true">▶</i><span></span><small>နှိပ်မှ ဖွင့်မယ် — data သုံးပါမယ် (Wi-Fi နဲ့ ကြည့်ပါ)</small>';
    b.querySelector('span').textContent = box.getAttribute('data-title');
    b.addEventListener('click', function(){
      var f = d.createElement('iframe');
      f.src = 'https://www.youtube-nocookie.com/embed/' + box.getAttribute('data-yt') + '?autoplay=1&rel=0';
      f.title = box.getAttribute('data-title'); f.allow = 'autoplay; encrypted-media; picture-in-picture'; f.allowFullscreen = true;
      f.referrerPolicy = 'strict-origin-when-cross-origin'; box.innerHTML = ''; box.appendChild(f);
    });
    box.appendChild(b);
  });
})();
