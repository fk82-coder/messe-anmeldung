var VERSION = 'messe-app-0.3.5';
var DATEIEN = [
  './', 'index.html', 'ok.html', 'planb.html', 'manifest.webmanifest', 'css/app.css',
  'js/konfiguration.js', 'js/texte.js', 'js/laender.js', 'js/speicher.js', 'js/versand.js', 'js/visitenkarte.js', 'js/app.js', 'js/planb.js', 'js/ok.js',
  'bilder/logo.png', 'bilder/symbol-192.png', 'bilder/symbol-512.png',
  'fonts/inter-400.woff2', 'fonts/inter-700.woff2'
];
var VK_DATEIEN = [
  'lib/tesseract-7.0.0/tesseract.min.js', 'lib/tesseract-7.0.0/worker.min.js', 'lib/tesseract-7.0.0/stumm-worker.js',
  'lib/tesseract-7.0.0/tesseract-core-simd-lstm.js', 'lib/tesseract-7.0.0/tesseract-core-simd-lstm.wasm',
  'lib/tessdata-fast-4.1.0/deu.traineddata.gz', 'lib/tessdata-fast-4.1.0/eng.traineddata.gz'
];
var window = self;
try { importScripts('js/konfiguration.js'); } catch (e) {  }
var MIT_VK = !!(self.KONFIG && self.KONFIG.visitenkarte && self.KONFIG.visitenkarte.aktiv);
self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(VERSION).then(function (c) { return c.addAll(MIT_VK ? DATEIEN.concat(VK_DATEIEN) : DATEIEN); }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (alle) {
    return Promise.all(alle.filter(function (k) { return k !== VERSION; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});
self.addEventListener('fetch', function (e) {
  var r = e.request;
  if (r.method !== 'GET' || new URL(r.url).origin !== self.location.origin) return;
  e.respondWith(caches.match(r, { ignoreSearch: true }).then(function (treffer) {
    return treffer || fetch(r);
  }));
});
