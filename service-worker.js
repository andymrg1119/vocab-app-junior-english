/**
 * service-worker.js
 * 离线缓存核心资源，让应用在没网时也能打开。
 *
 * 设计要点（v6 重写 / v7 沿用）：
 * 1. 所有同源资源统一走「网络优先」：永远拿服务器最新版本，只有断网时才回退到缓存。
 *    旧版对 JS/CSS 用「缓存优先」，一旦缓存过空文件/坏文件就永久返回，导致应用空白。
 * 2. 只缓存「有效响应」（HTTP 200 且同源 basic），防止把空响应或错误页写进缓存（缓存投毒）。
 * 3. 支持页面调用 self.skipWaiting() 立即接管，便于主动更新。
 */
var CACHE = 'vocab-app-v7';
var CORE = [
  './',
  './index.html',
  './css/style.css',
  './js/data-app.js',
  './js/data-7a.js',
  './js/data-7b.js',
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
    caches.open(CACHE).then(function (c) {
      // 单个资源失败不影响整体安装
      return Promise.all(CORE.map(function (u) {
        return c.add(u).catch(function () { return null; });
      }));
    }).then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.map(function (k) {
        if (k !== CACHE) return caches.delete(k); // 清除旧版本（含可能被污染的空缓存）
        return null;
      }));
    }).then(function () { return self.clients.claim(); })
  );
});

// 收到页面消息时立即激活新版本
self.addEventListener('message', function (e) {
  if (e && e.data && e.data.action === 'skipWaiting') {
    self.skipWaiting();
  }
});

// 只缓存有效响应，避免把空/错误内容写进缓存
function isValidResponse(resp) {
  return resp && resp.status === 200 && resp.type === 'basic';
}

self.addEventListener('fetch', function (e) {
  if (e.request.method !== 'GET') return;

  var url = new URL(e.request.url);
  // 跨域资源（如字体、CDN）不拦截
  if (url.origin !== self.location.origin) return;

  // 统一「网络优先」：先取最新，断网再回退缓存
  e.respondWith(
    fetch(e.request).then(function (resp) {
      if (isValidResponse(resp)) {
        var copy = resp.clone();
        caches.open(CACHE).then(function (c) { c.put(e.request, copy); });
      }
      return resp;
    }).catch(function () {
      // 离线：优先返回该资源的缓存，导航请求回退到首页
      return caches.match(e.request).then(function (cached) {
        if (cached) return cached;
        if (e.request.mode === 'navigate') return caches.match('./index.html');
        return Response.error();
      });
    })
  );
});
