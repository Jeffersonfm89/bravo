// Service worker da Bravo (loja e painel). Só guarda arquivos estáticos; /api/* NUNCA é guardado.
var VERSION = "bravo-20261014150237";
var PRECACHE = ["/", "/style.css", "/manifest.webmanifest", "/icons/app-192.png", "/icons/app-512.png", "/img/logo.jpg", "/img/logo-hero.png"];
self.addEventListener("install", function (e) {
  self.skipWaiting();
  e.waitUntil(caches.open(VERSION).then(function (c) { return c.addAll(PRECACHE).catch(function () {}); }));
});
self.addEventListener("activate", function (e) {
  e.waitUntil(caches.keys().then(function (ks) {
    return Promise.all(ks.filter(function (k) { return k !== VERSION; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});
self.addEventListener("fetch", function (e) {
  var req = e.request, url = new URL(req.url);
  if (req.method !== "GET" || url.origin !== self.location.origin) return;
  if (url.pathname.indexOf("/api/") === 0 || url.pathname === "/api") return; // sempre ao vivo, sem cache
  var isHtml = req.mode === "navigate" || (req.headers.get("accept") || "").indexOf("text/html") >= 0;
  if (isHtml) {
    // HTML: rede primeiro; cópia local só se estiver sem internet
    e.respondWith(fetch(req).then(function (r) {
      if (r.ok && !r.redirected) { var cp = r.clone(); caches.open(VERSION).then(function (c) { c.put(req, cp); }); }
      return r;
    }).catch(function () { return caches.match(req).then(function (m) { return m || caches.match("/"); }); }));
    return;
  }
  if (!/\.(css|js|png|jpe?g|webp|svg|ico|webmanifest|woff2?)$/.test(url.pathname) || url.pathname === "/sw.js") return;
  // estáticos: rede primeiro também (arquivos têm ?v=), com cópia para uso offline
  e.respondWith(fetch(req).then(function (r) {
    if (r.ok) { var cp = r.clone(); caches.open(VERSION).then(function (c) { c.put(req, cp); }); }
    return r;
  }).catch(function () { return caches.match(req); }));
});
self.addEventListener("notificationclick", function (e) {
  e.notification.close();
  e.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(function (cs) {
    for (var i = 0; i < cs.length; i++) if (/\/adm\/|admin\.html/.test(cs[i].url)) return cs[i].focus();
    return self.clients.openWindow("/adm/");
  }));
});
