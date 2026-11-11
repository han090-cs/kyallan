/* New / full moon times for ANY date (J. Meeus, "Astronomical Algorithms" ch. 49, principal terms; accuracy ~ a few minutes).
   Lets the site list upcoming moon phases and moon brightness without any manual yearly update. */
var MOONPHASES = (function(){
  var RAD = Math.PI / 180;
  var SYNODIC = 29.530588861;
  var DELTA_T = 69; /* TT - UT in seconds, close enough for 2020s-2030s */

  function jdToDate(jd){ return new Date((jd - 2440587.5) * 86400000 - DELTA_T * 1000); }
  function dateToJd(date){ return date.getTime() / 86400000 + 2440587.5; }

  function phaseJDE(k, full){
    k = k + (full ? 0.5 : 0);
    var T = k / 1236.85;
    var jde = 2451550.09766 + SYNODIC * k + 0.00015437 * T * T - 0.000000150 * T * T * T + 0.00000000073 * T * T * T * T;
    var E = 1 - 0.002516 * T - 0.0000074 * T * T;
    var M = (2.5534 + 29.10535670 * k - 0.0000014 * T * T - 0.00000011 * T * T * T) * RAD;
    var Mp = (201.5643 + 385.81693528 * k + 0.0107582 * T * T + 0.00001238 * T * T * T - 0.000000058 * T * T * T * T) * RAD;
    var F = (160.7108 + 390.67050284 * k - 0.0016118 * T * T - 0.00000227 * T * T * T + 0.000000011 * T * T * T * T) * RAD;
    var Om = (124.7746 - 1.56375588 * k + 0.0020672 * T * T + 0.00000215 * T * T * T) * RAD;
    var c = full
      ? [-0.40614, 0.17302, 0.01614, 0.01043, 0.00734, -0.00515, 0.00209]
      : [-0.40720, 0.17241, 0.01608, 0.01039, 0.00739, -0.00514, 0.00208];
    var corr = c[0] * Math.sin(Mp) + c[1] * E * Math.sin(M) + c[2] * Math.sin(2 * Mp) + c[3] * Math.sin(2 * F) +
      c[4] * E * Math.sin(Mp - M) + c[5] * E * Math.sin(Mp + M) + c[6] * E * E * Math.sin(2 * M) -
      0.00111 * Math.sin(Mp - 2 * F) - 0.00057 * Math.sin(Mp + 2 * F) + 0.00056 * E * Math.sin(2 * Mp + M) -
      0.00042 * Math.sin(3 * Mp) + 0.00042 * E * Math.sin(M + 2 * F) + 0.00038 * E * Math.sin(M - 2 * F) -
      0.00024 * E * Math.sin(2 * Mp - M) - 0.00017 * Math.sin(Om);
    return jde + corr;
  }

  /* all new/full moons from about 2 cycles before `date` to `ahead` cycles after, sorted by time */
  function events(date, ahead){
    var k0 = Math.floor((dateToJd(date) - 2451550.09766) / SYNODIC);
    var out = [];
    for (var k = k0 - 2; k <= k0 + (ahead || 3); k++) {
      out.push({ type: 'new', date: jdToDate(phaseJDE(k, false)) });
      out.push({ type: 'full', date: jdToDate(phaseJDE(k, true)) });
    }
    out.sort(function(a, b){ return a.date - b.date; });
    return out;
  }

  function upcoming(date, count){
    var list = events(date, Math.ceil(count / 2) + 2).filter(function(e){ return e.date > date; });
    return list.slice(0, count);
  }

  /* age (days since last new moon), true cycle length, illuminated fraction, days to next full / new */
  function state(date){
    var ev = events(date, 3);
    var prevNew = null, nextNew = null, nextFull = null;
    ev.forEach(function(e){
      if (e.type === 'new') { if (e.date <= date) prevNew = e; else if (!nextNew) nextNew = e; }
      else if (e.date > date && !nextFull) nextFull = e;
    });
    var day = 86400000;
    var length = (nextNew.date - prevNew.date) / day;
    var age = (date - prevNew.date) / day;
    return {
      age: age, length: length,
      illum: (1 - Math.cos(2 * Math.PI * age / length)) / 2,
      toFull: (nextFull.date - date) / day,
      toNew: (nextNew.date - date) / day
    };
  }

  return { upcoming: upcoming, state: state, events: events };
})();
