/**
 * service-worker.js
 * 用于离线缓存核心资源，让应用在没网时也能打开
 */
var CACHE = 'vocab-app-v4';
var CORE = [
  './',
  './index.html',
  './css/style.css',
  './js/data-app.js',
  './js/data-7a.js',
  './js/data-7b.js',
  './js/data-other.js',
  './js/flashcard.js',
  './js/dictation.js',
  './js/text-reader.js',
  './js/exam.js',
  './js/app.js',
  './manifest.webmanifest',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(CACHE).then(function (c) { return c.addAll(CORE); })
      .then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.map(function (k) {
        if (k !== CACHE) return caches.delete(k);
        return null;
      }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (e) {
  if (e.request.method !== 'GET') return;

  // HTML 走网络优先，确保拿到最新版本
  var url = new URL(e.request.url);
  var isHTML = e.request.mode === 'navigate' || (e.request.headers.get('accept') || '').indexOf('text/html') >= 0;

  if (isHTML) {
    e.respondWith(
      fetch(e.request).then(function (resp) {
        var copy = resp.clone();
        caches.open(CACHE).then(function (c) { c.put(e.request, copy); });
        return resp;
      }).catch(function () { return caches.match('./index.html'); })
    );
    return;
  }

  // 静态资源走缓存优先
  e.respondWith(
    caches.match(e.request).then(function (resp) {
      if (resp) return resp;
      return fetch(e.request).then(function (netResp) {
        if (url.origin === self.location.origin) {
          var copy = netResp.clone();
          caches.open(CACHE).then(function (c) { c.put(e.request, copy); });
        }
        return netResp;
      });
    })
  );
});
