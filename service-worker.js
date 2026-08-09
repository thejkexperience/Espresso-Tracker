/* ===========================================================
   Espresso Tracker — Service Worker
   Makes the app installable and gives it an offline app-shell.
   Strategy: network-first for our own pages/scripts (so you
   always get the latest version when online), with a cache
   fallback so the app still opens with no signal. Anything
   cross-origin (Supabase, Overpass, the Supabase JS library)
   is left alone — never cached, never intercepted — so auth,
   data, and "near me" search always hit the real network.
   Bump CACHE_NAME whenever the app shell changes meaningfully;
   old caches are cleaned up automatically on activate.
   =========================================================== */

const CACHE_NAME = "espresso-tracker-v1";

const APP_SHELL = [
    "./",
    "index.html",
    "beans.html",
    "brew-log.html",
    "discover.html",
    "gear.html",
    "learn.html",
    "login.html",
    "recipes.html",
    "setup.html",
    "css/style.css",
    "js/app.js",
    "js/data.js",
    "js/auth.js",
    "js/cloud-data.js",
    "js/supabase-config.js",
    "js/supabase-client.js",
    "js/dashboard.js",
    "js/beans.js",
    "js/brew-log.js",
    "js/recipes.js",
    "js/gear.js",
    "js/discover.js",
    "js/learn.js",
    "js/login.js",
    "js/pwa.js",
    "manifest.json"
  ];

self.addEventListener("install", (event) => {
    event.waitUntil(
          caches.open(CACHE_NAME).then((cache) =>
                  // Don't let one missing/renamed file block install.
                                             Promise.allSettled(APP_SHELL.map((url) => cache.add(url)))
                                           ).then(() => self.skipWaiting())
        );
});

self.addEventListener("activate", (event) => {
    event.waitUntil(
          caches.keys().then((names) =>
                  Promise.all(names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n)))
                                 ).then(() => self.clients.claim())
        );
});

self.addEventListener("fetch", (event) => {
    const req = event.request;

                        // Only handle our own GET requests. Everything else (Supabase API,
                        // Supabase auth, Overpass, the supabase-js CDN script, any POST/PUT)
                        // passes straight through untouched.
                        if (req.method !== "GET") return;
    const url = new URL(req.url);
    if (url.origin !== self.location.origin) return;

                        event.respondWith(
                              fetch(req)
                                .then((res) => {
                                          const copy = res.clone();
                                          caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
                                          return res;
                                })
                                .catch(() => caches.match(req).then((cached) => cached || caches.match("index.html")))
                            );
});
