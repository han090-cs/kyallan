/* Low-precision planet positions (P. Schlyter's formulas, accuracy ~1 degree).
   Used so the "tonight's sky" planet guide works for ANY date without manual monthly updates. */
var EPHEM = (function(){
  var RAD = Math.PI / 180;
  function rev(x){ return x - Math.floor(x / 360) * 360; }
  function norm180(x){ x = rev(x); return x > 180 ? x - 360 : x; }

  var ELEMENTS = {
    Mercury: { N:[48.3313, 3.24587e-5], i:[7.0047, 5.00e-8],   w:[29.1241, 1.01444e-5],  a:0.387098,  e:[0.205635, 5.59e-10],  M:[168.6562, 4.0923344368] },
    Venus:   { N:[76.6799, 2.46590e-5], i:[3.3946, 2.75e-8],   w:[54.8910, 1.38374e-5],  a:0.723330,  e:[0.006773, -1.302e-9], M:[48.0052, 1.6021302244] },
    Mars:    { N:[49.5574, 2.11081e-5], i:[1.8497, -1.78e-8],  w:[286.5016, 2.92961e-5], a:1.523688,  e:[0.093405, 2.516e-9],  M:[18.6021, 0.5240207766] },
    Jupiter: { N:[100.4542, 2.76854e-5],i:[1.3030, -1.557e-7], w:[273.8777, 1.64505e-5], a:5.20256,   e:[0.048498, 4.469e-9],  M:[19.8950, 0.0830853001] },
    Saturn:  { N:[113.6634, 2.38980e-5],i:[2.4886, -1.081e-7], w:[339.3939, 2.97661e-5], a:9.55475,   e:[0.055546, -9.499e-9], M:[316.9670, 0.0334442282] }
  };

  function lin(p, d){ return p[0] + p[1] * d; }

  function solve(M, e){
    var E = M + (e / RAD) * Math.sin(M * RAD) * (1 + e * Math.cos(M * RAD));
    for (var k = 0; k < 6; k++) {
      E = E - (E - (e / RAD) * Math.sin(E * RAD) - M) / (1 - e * Math.cos(E * RAD));
    }
    return E;
  }

  /* days since 2000 Jan 0.0 (Schlyter's epoch) */
  function dayNumber(date){ return date.getTime() / 86400000 - 10956; }

  function sunGeo(d){
    var w = 282.9404 + 4.70935e-5 * d;
    var e = 0.016709 - 1.151e-9 * d;
    var M = rev(356.0470 + 0.9856002585 * d);
    var E = M + (e / RAD) * Math.sin(M * RAD) * (1 + e * Math.cos(M * RAD));
    var xv = Math.cos(E * RAD) - e;
    var yv = Math.sqrt(1 - e * e) * Math.sin(E * RAD);
    var v = Math.atan2(yv, xv) / RAD;
    var r = Math.sqrt(xv * xv + yv * yv);
    var lon = rev(v + w);
    return { x: r * Math.cos(lon * RAD), y: r * Math.sin(lon * RAD), lon: lon };
  }

  function planetGeoLon(name, d, sun){
    var el = ELEMENTS[name];
    var N = lin(el.N, d), i = lin(el.i, d), w = lin(el.w, d), e = lin(el.e, d), M = rev(lin(el.M, d));
    var E = solve(M, e);
    var xv = el.a * (Math.cos(E * RAD) - e);
    var yv = el.a * Math.sqrt(1 - e * e) * Math.sin(E * RAD);
    var v = Math.atan2(yv, xv) / RAD;
    var r = Math.sqrt(xv * xv + yv * yv);
    var vw = (v + w) * RAD, Nr = N * RAD, ir = i * RAD;
    var xh = r * (Math.cos(Nr) * Math.cos(vw) - Math.sin(Nr) * Math.sin(vw) * Math.cos(ir));
    var yh = r * (Math.sin(Nr) * Math.cos(vw) + Math.cos(Nr) * Math.sin(vw) * Math.cos(ir));
    var lonH = Math.atan2(yh, xh) / RAD;
    var latH = Math.atan2(r * Math.sin(vw) * Math.sin(ir), Math.sqrt(xh * xh + yh * yh)) / RAD;
    var pert = 0;
    if (name === 'Jupiter' || name === 'Saturn') {
      var Mj = rev(lin(ELEMENTS.Jupiter.M, d)), Ms = rev(lin(ELEMENTS.Saturn.M, d));
      if (name === 'Jupiter') {
        pert = -0.332 * Math.sin((2 * Mj - 5 * Ms - 67.6) * RAD) - 0.056 * Math.sin((2 * Mj - 2 * Ms + 21) * RAD) +
               0.042 * Math.sin((3 * Mj - 5 * Ms + 21) * RAD) - 0.036 * Math.sin((Mj - 2 * Ms) * RAD) +
               0.022 * Math.cos((Mj - Ms) * RAD) + 0.023 * Math.sin((2 * Mj - 3 * Ms + 52) * RAD) -
               0.016 * Math.sin((Mj - 5 * Ms - 69) * RAD);
      } else {
        pert = 0.812 * Math.sin((2 * Mj - 5 * Ms - 67.6) * RAD) - 0.229 * Math.cos((2 * Mj - 4 * Ms - 2) * RAD) +
               0.119 * Math.sin((Mj - 2 * Ms - 3) * RAD) + 0.046 * Math.sin((2 * Mj - 6 * Ms - 69) * RAD) +
               0.014 * Math.sin((Mj - 3 * Ms + 32) * RAD);
      }
    }
    lonH += pert;
    var rh = Math.sqrt(xh * xh + yh * yh + r * r * Math.pow(Math.sin(vw) * Math.sin(ir), 2));
    var rxy = rh * Math.cos(latH * RAD);
    var xg = rxy * Math.cos(lonH * RAD) + sun.x;
    var yg = rxy * Math.sin(lonH * RAD) + sun.y;
    return rev(Math.atan2(yg, xg) / RAD);
  }

  /* elongation: + = east of the Sun (evening sky), - = west of the Sun (morning sky) */
  function elongations(date){
    var d = dayNumber(date);
    var sun = sunGeo(d);
    var out = {};
    Object.keys(ELEMENTS).forEach(function(n){
      out[n] = norm180(planetGeoLon(n, d, sun) - sun.lon);
    });
    return out;
  }

  var INNER = { Mercury: 1, Venus: 1 };

  /* returns { evening:[], morning:[], allNight:[], hidden:[] } with Burmese descriptions */
  function guide(date){
    var el = elongations(date);
    var res = { evening: [], morning: [], hidden: [], elong: el };
    Object.keys(el).forEach(function(n){
      var e = el[n], a = Math.abs(e);
      if (INNER[n]) {
        if (a < 15) { res.hidden.push(n); return; }
        var big = a >= 30 ? ' (နေနဲ့ အကွာ ကျယ်ပြီး ကြာကြာ မြင်ရတဲ့ အချိန်)' : '';
        if (e > 0) res.evening.push(n + ' — နေဝင်ပြီး အနောက်ဘက် မိုးကုပ်စက်ဝိုင်း အနိမ့်ပိုင်းမှာ မြင်ရ' + big);
        else res.morning.push(n + ' — နေမထွက်ခင် အရှေ့ဘက် မိုးကုပ်စက်ဝိုင်း အနိမ့်ပိုင်းမှာ မြင်ရ' + big);
      } else {
        if (a < 30) { res.hidden.push(n); return; }
        if (a >= 165) {
          res.evening.push(n + ' — နေနဲ့ ဆန့်ကျင်ဘက်နား (opposition ဝန်းကျင်): နေဝင်တာနဲ့ တက်လာပြီး ည လုံးနီးပါး မြင်ရ၊ တစ်နှစ်တာ အတောက်ပဆုံး ကာလ');
        } else if (e > 0) {
          if (a < 90) res.evening.push(n + ' — ညနေစောပိုင်း အနောက်ဘက်မှာ မြင်ရပြီး မကြာခင် ဝင်သွားမယ်');
          else res.evening.push(n + ' — ညနေကနေ သန်းခေါင်ခန့်အထိ မြင်ရ');
        } else {
          if (a < 90) res.morning.push(n + ' — မနက် မလင်းခင် အရှေ့ဘက်မှာ တက်လာ');
          else res.morning.push(n + ' — သန်းခေါင်ကျော်ကနေ မနက်အထိ မြင်ရ');
        }
      }
    });
    return res;
  }

  return { guide: guide, elongations: elongations };
})();
