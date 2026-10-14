// Service worker da Bravo (loja + painel). Cacheia só arquivos estáticos; HTML é network-first; /api/* NUNCA é cacheado.
var VERSION = "bravo-v20261014";
var CORE = ["/", "/style.css", "/img/logo.jpg", "/img/logo-hero.png", "/icons/app-192.png", "/icons/adm-192.png"];
self.addEventListener("install", function (e) {
  e.waitUntil(caches.open(VERSION).then(function (c) { return c.addAll(CORE); }).catch(function () {}).then(function () { return self.skipWaiting(); }));
});
self.addEventListener("activate", function (e) {
  e.waitUntil(caches.keys().then(function (ks) {
    return Promise.all(ks.filter(function (k) { return k !== VERSION; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});
self.addEventListener("fetch", function (e) {
  var req = e.request, url = new URL(req.url);
  if (req.method !== "GET" || url.origin !== self.location.origin) return;
  if (url.pathname.indexOf("/api/") === 0 || url.pathname === "/api") return; // sempre rede, sem cache
  if (url.pathname === "/sw.js") return;
  var isHtml = req.mode === "navigate" || /\.html$/.test(url.pathname) || url.pathname === "/";
  if (isHtml) {
    e.respondWith(fetch(req).then(function (r) {
      if (r.ok && r.type === "basic") { var cp = r.clone(); caches.open(VERSION).then(function (c) { c.put(req, cp); }); }
      return r;
    }).catch(function () { return caches.match(req).then(function (m) { return m || caches.match("/"); }); }));
    return;
  }
  if (!/\.(js|css|png|jpg|jpeg|webp|svg|ico|webmanifest|woff2?)$/.test(url.pathname)) return;
  // estáticos: usa cache e atualiza em segundo plano (os ?v= mudam a cada deploy)
  e.respondWith(caches.open(VERSION).then(function (c) {
    return c.match(req).then(function (m) {
      var net = fetch(req).then(function (r) { if (r.ok && r.type === "basic") c.put(req, r.clone()); return r; });
      return m ? (net.catch(function () {}), m) : net;
    });
  }));
});
self.addEventListener("notificationclick", function (e) {
  e.notification.close();
  e.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(function (cs) {
    for (var i = 0; i < cs.length; i++) if (cs[i].url.indexOf("admin") >= 0) return cs[i].focus();
    return self.clients.openWindow("/admin.html");
  }));
});
