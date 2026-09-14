// Service Worker giúp app dùng được cả khi mất mạng (offline) sau lần mở đầu tiên.
// LƯU Ý: mỗi khi cập nhật code (đặc biệt style.css/app.js/data), hãy tăng CACHE_VERSION
// lên 1 số (v1 -> v2 -> ...) để trình duyệt xoá cache cũ và người dùng nhận bản mới.
const CACHE_VERSION = 'v36';
const CACHE_NAME = '5phut-cache-' + CACHE_VERSION;

importScripts('data/emoji-icons.js');

const APP_SHELL = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './manifest.json',
  './data/topics.js',
  './data/emoji-icons.js',
  './data/sheets-config.js',
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png',
  './assets/icons/icon-512-maskable.png',
  './assets/icons/apple-touch-icon.png',
  './assets/icons/favicon.png',
  './assets/QR.jpg',
];
const ICON_URLS = Object.values(EMOJI_ICONS);

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_SHELL))
      .then(() => caches.open(CACHE_NAME))
      .then(cache => Promise.all(
        // Icon 3D tải từ CDN ngoài: cache thêm nhưng không chặn cài đặt nếu 1 icon lỗi/mạng chậm.
        ICON_URLS.map(url => fetch(url).then(res => { if (res && res.ok) cache.put(url, res); }).catch(() => {}))
      ))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // Google Apps Script (gửi/xác minh mã OTP email + ghi Google Sheet): luôn đi thẳng ra mạng,
  // không cache, không phục vụ dữ liệu cũ — bỏ qua service worker hoàn toàn, vì đây là round-trip
  // xác thực OTP thời gian thực, không thể trả kết quả cũ/cache được.
  const isLeadCaptureBackend =
    url.hostname === 'script.google.com' ||
    url.hostname === 'script.googleusercontent.com';
  if (isLeadCaptureBackend) return;

  const isAppShellFile = url.origin === self.location.origin &&
    (/\.(html|js|css|json)$/.test(url.pathname) || url.pathname.endsWith('/'));

  if (isAppShellFile) {
    // Network-first: ưu tiên bản mới nhất khi có mạng, chỉ dùng cache khi mất mạng.
    event.respondWith(
      fetch(req).then(res => {
        const resClone = res.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(req, resClone));
        return res;
      }).catch(() => caches.match(req))
    );
  } else {
    // Cache-first: audio, icon, font hầu như không đổi nên ưu tiên tốc độ + hoạt động offline.
    event.respondWith(
      caches.match(req).then(cached => {
        if (cached) return cached;
        return fetch(req).then(res => {
          if (res && (res.ok || res.type === 'opaque')) {
            const resClone = res.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(req, resClone));
          }
          return res;
        }).catch(() => cached);
      })
    );
  }
});
