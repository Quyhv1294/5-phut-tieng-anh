// Service Worker giÃºp app dÃ¹ng Ä‘Æ°á»£c cáº£ khi máº¥t máº¡ng (offline) sau láº§n má»Ÿ Ä‘áº§u tiÃªn.
// LÆ¯U Ã: má»—i khi cáº­p nháº­t code (Ä‘áº·c biá»‡t style.css/app.js/data), hÃ£y tÄƒng CACHE_VERSION
// lÃªn 1 sá»‘ (v1 -> v2 -> ...) Ä‘á»ƒ trÃ¬nh duyá»‡t xoÃ¡ cache cÅ© vÃ  ngÆ°á»i dÃ¹ng nháº­n báº£n má»›i.
const CACHE_VERSION = 'v215';
const CACHE_NAME = '5phut-cache-' + CACHE_VERSION;
// Giá»ng Ä‘á»c thu sáºµn (assets/tts/): tÃªn file lÃ  mÃ£ bÄƒm cá»§a cÃ¢u, Ä‘á»•i giá»ng thÃ¬ Ä‘á»•i thÆ° má»¥c â†’ file khÃ´ng bao giá»
// Ä‘á»•i ná»™i dung, nÃªn giá»¯ á»Ÿ cache RIÃŠNG, khÃ´ng xoÃ¡ khi tÄƒng CACHE_VERSION (bÃ© khá»i pháº£i táº£i láº¡i).
const TTS_CACHE = '5phut-tts-v1';

importScripts('data/emoji-icons.js');

const APP_SHELL = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './manifest.json',
  './data/topics.js',
  './data/topics_zh.js',
  './data/zh_roadmap.js',
  './data/zh_course.js',
  './data/zh_hsk1_exam.js',
  './data/zh_listening.js',
  './data/zh_reading.js',
  './data/zh_hsk1_new.js',
  './zh-course.js',
  './data/alphabet.js',
  './data/phonics.js',
  './data/stories.js',
  './data/placement.js',
  './data/phonics2.js',
  './data/vocab_choi.js',
  './data/sight_choi.js',
  './data/sentences_choi.js',
  './data/stories_choi.js',
  './data/vocab_la.js',
  './data/grammar_la.js',
  './data/phonics3.js',
  './data/stories_la.js',
  './data/sentences_la.js',
  './data/qa_la.js',
  './data/dialogues_la.js',
  './data/guide.js',
  './data/write_la.js',
  './data/simon_la.js',
  './data/phrases_la.js',
  './data/paragraph_la.js',
  './data/reading_la.js',
  './data/classes.js',
  './data/emoji-icons.js',
  './data/sheets-config.js',
  './data/tts-en.js',
  './data/tts-zh.js',
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png',
  './assets/icons/icon-512-maskable.png',
  './assets/icons/apple-touch-icon.png',
  './assets/icons/favicon.png',
  './assets/QR.jpg',
  './assets/qr/share-en.png',
  './assets/qr/share-zh.png',
  './assets/qr/cert-en.png',
  './assets/qr/cert-zh.png',
  './assets/Anh_bia.jpg',
  './assets/mascot-fox.png',
  './assets/anh_ghep.jpeg',
  './assets/outfits/scarf.png',
  './assets/outfits/tshirt.png',
  './assets/outfits/ribbon.png',
  './assets/outfits/vest.png',
  './assets/outfits/hat.png',
  './assets/outfits/jacket.png',
  './assets/outfits/glasses.png',
  './assets/outfits/labcoat.png',
  './assets/outfits/necktie.png',
  './assets/outfits/martial.png',
  './assets/outfits/crown.png',
  './assets/outfits/astronaut.png',
  './assets/outfits/combo/crown_tshirt.png',
  './assets/outfits/combo/crown_jacket.png',
  './assets/outfits/combo/crown_labcoat.png',
  './assets/outfits/combo/crown_vest.png',
  './assets/outfits/combo/crown_martial.png',
  './assets/outfits/combo/crown_astronaut.png',
  './assets/outfits/combo/hat_tshirt.png',
  './assets/outfits/combo/hat_jacket.png',
  './assets/outfits/combo/hat_labcoat.png',
  './assets/outfits/combo/hat_vest.png',
  './assets/outfits/combo/hat_martial.png',
  './assets/outfits/combo/hat_astronaut.png',
  './assets/outfits/combo/glasses_martial.png',
  './assets/outfits/combo/glasses_astronaut.png',
  './assets/outfits/combo/glasses_jacket.png',
  './assets/outfits/combo/glasses_labcoat.png',
  './assets/outfits/combo/glasses_tshirt.png',
  './assets/outfits/combo/glasses_vest.png',
  './assets/outfits/combo/ribbon_tshirt.png',
  './assets/outfits/combo/ribbon_vest.png',
  './assets/outfits/combo/ribbon_jacket.png',
  './assets/outfits/combo/ribbon_astronaut.png',
  './assets/outfits/combo/ribbon_labcoat.png',
  './assets/outfits/combo/ribbon_martial.png',
  './assets/outfits/combo/necktie_jacket.png',
  './assets/outfits/combo/necktie_astronaut.png',
  './assets/outfits/combo/necktie_vest.png',
  './assets/outfits/combo/necktie_labcoat.png',
  './assets/outfits/combo/necktie_martial.png',
  './assets/outfits/combo/necktie_tshirt.png',
  './assets/outfits/combo/scarf_labcoat.png',
  './assets/outfits/combo/scarf_vest.png',
  './assets/outfits/combo/scarf_tshirt.png',
  './assets/outfits/combo/scarf_jacket.png',
  './assets/outfits/combo/scarf_astronaut.png',
  './assets/outfits/combo/scarf_martial.png',
];
const ICON_URLS = Object.values(EMOJI_ICONS);

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_SHELL))
      .then(() => caches.open(CACHE_NAME))
      .then(cache => Promise.all(
        // Icon 3D táº£i tá»« CDN ngoÃ i: cache thÃªm nhÆ°ng khÃ´ng cháº·n cÃ i Ä‘áº·t náº¿u 1 icon lá»—i/máº¡ng cháº­m.
        ICON_URLS.map(url => fetch(url).then(res => { if (res && res.ok) cache.put(url, res); }).catch(() => {}))
      ))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME && k !== TTS_CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // Google Apps Script (gá»­i/xÃ¡c minh mÃ£ OTP email + ghi Google Sheet): luÃ´n Ä‘i tháº³ng ra máº¡ng,
  // khÃ´ng cache, khÃ´ng phá»¥c vá»¥ dá»¯ liá»‡u cÅ© â€” bá» qua service worker hoÃ n toÃ n, vÃ¬ Ä‘Ã¢y lÃ  round-trip
  // xÃ¡c thá»±c OTP thá»i gian thá»±c, khÃ´ng thá»ƒ tráº£ káº¿t quáº£ cÅ©/cache Ä‘Æ°á»£c.
  const isLeadCaptureBackend =
    url.hostname === 'script.google.com' ||
    url.hostname === 'script.googleusercontent.com';
  if (isLeadCaptureBackend) return;

  const isAppShellFile = url.origin === self.location.origin &&
    (/\.(html|js|css|json)$/.test(url.pathname) || url.pathname.endsWith('/'));

  if (url.origin === self.location.origin && url.pathname.includes('/assets/tts/')) {
    event.respondWith(
      caches.open(TTS_CACHE).then(cache => cache.match(req).then(cached => cached || fetch(req).then(res => {
        if (res && res.ok) cache.put(req, res.clone());
        return res;
      })))
    );
    return;
  }

  if (isAppShellFile) {
    // Network-first: Æ°u tiÃªn báº£n má»›i nháº¥t khi cÃ³ máº¡ng, chá»‰ dÃ¹ng cache khi máº¥t máº¡ng.
    // cache: 'no-cache' báº¯t trÃ¬nh duyá»‡t há»i láº¡i mÃ¡y chá»§ thay vÃ¬ láº¥y báº£n trong HTTP cache â€” trÃ¡nh trÆ°á»ng
    // há»£p ná»­a file má»›i ná»­a file cÅ© (vd. zh-course.js má»›i cháº¡y vá»›i app.js cÅ©). Request Ä‘iá»u hÆ°á»›ng
    // (mode 'navigate') khÃ´ng cho táº¡o láº¡i vá»›i tuá»³ chá»n nÃªn giá»¯ nguyÃªn.
    event.respondWith(
      (req.mode === 'navigate' ? fetch(req) : fetch(req, { cache: 'no-cache' })).then(res => {
        const resClone = res.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(req, resClone));
        return res;
      }).catch(() => caches.match(req))
    );
  } else {
    // Cache-first: audio, icon, font háº§u nhÆ° khÃ´ng Ä‘á»•i nÃªn Æ°u tiÃªn tá»‘c Ä‘á»™ + hoáº¡t Ä‘á»™ng offline.
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
