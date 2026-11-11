(function(){
  var picks = document.getElementById('planetPicks');
  var keys = Object.keys(PLANETS);
  keys.forEach(function(k){
    var b = document.createElement('button');
    b.className = 'pick'; b.type = 'button';
    b.textContent = PLANETS[k].name.split('—')[0].trim() + ' ' + (PLANETS[k].name.split('—')[1] ? PLANETS[k].name.split('—')[1].trim().split(' (')[0] : '');
    b.setAttribute('data-k', k);
    b.addEventListener('click', function(){ show(k); });
    picks.appendChild(b);
  });
  function show(k){
    var p = PLANETS[k];
    document.querySelectorAll('#planetPicks .pick').forEach(function(x){ var on = x.getAttribute('data-k')===k; x.classList.toggle('on', on); x.setAttribute('aria-pressed', on); });
    document.getElementById('pOrb').style.background = 'radial-gradient(circle at 34% 32%, ' + p.color + ', #1a2138 88%)';
    document.getElementById('pName').textContent = p.name;
    document.getElementById('pEn').textContent = p.en;
    document.getElementById('pDesc').textContent = p.desc;
    var st = document.getElementById('pStats'); st.innerHTML = '';
    p.stats.forEach(function(s){
      var d = document.createElement('div'); d.className = 'pstat';
      var sp = document.createElement('span'); sp.textContent = s[0];
      var bb = document.createElement('b'); bb.textContent = s[1];
      d.appendChild(sp); d.appendChild(bb); st.appendChild(d);
    });
  }
  show('earth');
})();

(function(){
  var box = document.getElementById('lifeSteps');
  LIFE.forEach(function(s, i){
    if(i>0){ var a = document.createElement('span'); a.className='steparrow'; a.textContent='→'; box.appendChild(a); }
    var b = document.createElement('button'); b.className='stepdot'; b.type='button';
    b.textContent = s.t.split('—')[0].trim();
    b.setAttribute('data-i', i);
    b.addEventListener('click', function(){ show(i); });
    box.appendChild(b);
  });
  function show(i){
    document.querySelectorAll('#lifeSteps .stepdot').forEach(function(x){ var on = +x.getAttribute('data-i')===i; x.classList.toggle('on', on); x.setAttribute('aria-pressed', on); });
    document.getElementById('lifeTitle').textContent = LIFE[i].t;
    document.getElementById('lifeDesc').textContent = LIFE[i].d;
  }
  show(2);
})();
