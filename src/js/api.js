/* api.js — one shared, polite fetch helper for every browser-side API call.
   - timeout (AbortController)           - one retry with back-off on network errors / HTTP 5xx
   - HTTP 429: no retry, the host is paused for a while so we never hammer a rate-limited API
   - identical requests in flight are shared (one network call, many callers)
   - offline: fail immediately instead of waiting for the timeout
   - optional caches: per-tab (sessionStorage, ttlMs) and long-lived (localStorage, opts.persistMs) */
var KyallanAPI = (function () {
  'use strict';
  var inflight = {};
  var pausedUntil = {};

  function hostOf(url) { try { return new URL(url, location.href).host; } catch (_) { return ''; } }
  function sleep(ms) { return new Promise(function (resolve) { setTimeout(resolve, ms); }); }
  function read(store, key, ttl) {
    try { var c = JSON.parse(store.getItem(key)); if (c && Date.now() - c.t < ttl) return c; } catch (_) {}
    return null;
  }
  function write(store, key, value) { try { store.setItem(key, JSON.stringify({ t: Date.now(), v: value })); } catch (_) {} }

  function attempt(url, timeoutMs) {
    var controller = window.AbortController ? new AbortController() : null;
    var timer = setTimeout(function () { if (controller) controller.abort(); }, timeoutMs);
    return fetch(url, controller ? { signal: controller.signal } : {}).then(function (response) {
      if (!response.ok) {
        var error = new Error('HTTP ' + response.status);
        error.status = response.status;
        var wait = Number(response.headers && response.headers.get && response.headers.get('retry-after'));
        error.retryAfter = Number.isFinite(wait) && wait > 0 ? wait : 0;
        throw error;
      }
      return response.json();
    }).finally(function () { clearTimeout(timer); });
  }

  function request(url, timeoutMs) {
    var host = hostOf(url);
    if (pausedUntil[host] && pausedUntil[host] > Date.now()) return Promise.reject(new Error('rate-limited'));
    if (typeof navigator !== 'undefined' && navigator.onLine === false) return Promise.reject(new Error('offline'));
    return attempt(url, timeoutMs).catch(function (error) {
      if (error.status === 429) {
        pausedUntil[host] = Date.now() + Math.max(error.retryAfter * 1000, 5 * 60 * 1000);
        throw error;
      }
      var retryable = !error.status || error.status >= 500;
      if (!retryable) throw error;
      return sleep(700 + Math.floor(Math.random() * 400)).then(function () { return attempt(url, timeoutMs); });
    });
  }

  /* getJSON(url, timeoutMs, ttlMs, opts)  — opts.persistMs keeps the answer in localStorage for that long */
  function getJSON(url, timeoutMs, ttlMs, opts) {
    var persistMs = opts && opts.persistMs;
    var sKey = 'kyallan:' + url, pKey = 'kyallan:p:' + url;
    if (ttlMs) { var hit = read(sessionStorage, sKey, ttlMs); if (hit) return Promise.resolve(hit.v); }
    if (persistMs) { var kept = read(localStorage, pKey, persistMs); if (kept) return Promise.resolve(kept.v); }
    if (inflight[url]) return inflight[url];
    var job = request(url, timeoutMs || 12000).then(function (json) {
      if (ttlMs) write(sessionStorage, sKey, json);
      if (persistMs) write(localStorage, pKey, json);
      return json;
    }).finally(function () { delete inflight[url]; });
    inflight[url] = job;
    return job;
  }

  return { getJSON: getJSON };
})();
