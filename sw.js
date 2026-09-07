// =========================
// Service Worker
// InkBoard
// =========================

const CACHE_NAME = "inkboard-v1";

const APP_SHELL = [
  "./",
  "./index.html",
  "./style.css",
  "./manifest.webmanifest",

  "./js/app.js",
  "./js/importer.js",
  "./js/parser.js",
  "./js/storage.js",
  "./js/analyzer.js",
  "./js/battle.js",
  "./js/ui.js",

  "./assets/logo/icon-192.png",
  "./assets/logo/icon-512.png"
];


// =========================
// Install
// =========================

self.addEventListener("install", (event) => {

  event.waitUntil(

    caches
      .open(CACHE_NAME)
      .then((cache) => {

        return cache.addAll(APP_SHELL);

      })

  );

  self.skipWaiting();

});


// =========================
// Activate
// =========================

self.addEventListener("activate", (event) => {

  event.waitUntil(

    caches
      .keys()
      .then((cacheNames) => {

        return Promise.all(

          cacheNames
            .filter((name) => name !== CACHE_NAME)
            .map((name) => caches.delete(name))

        );

      })

  );

  self.clients.claim();

});


// =========================
// Fetch
// =========================

self.addEventListener("fetch", (event) => {

  const request = event.request;

  // GET以外はそのまま
  if (request.method !== "GET") {
    return;
  }

  // 外部サイトはService Workerのキャッシュ対象外
  const url = new URL(request.url);

  if (url.origin !== self.location.origin) {
    return;
  }

  event.respondWith(

    caches.match(request)
      .then((cachedResponse) => {

        if (cachedResponse) {
          return cachedResponse;
        }

        return fetch(request)
          .then((networkResponse) => {

            // 正常なレスポンスだけキャッシュ
            if (
              networkResponse &&
              networkResponse.status === 200 &&
              networkResponse.type === "basic"
            ) {

              const responseClone =
                networkResponse.clone();

              caches
                .open(CACHE_NAME)
                .then((cache) => {

                  cache.put(
                    request,
                    responseClone
                  );

                });

            }

            return networkResponse;

          });

      })

  );

});


// =========================
// Message
// =========================

self.addEventListener("message", (event) => {

  if (!event.data) {
    return;
  }

  if (event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }

});
