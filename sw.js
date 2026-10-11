// Service worker mínimo do painel Bravo: permite notificações com a aba em segundo plano e abre o painel ao tocar.
self.addEventListener('install', function () { self.skipWaiting(); });
self.addEventListener('activate', function (e) { e.waitUntil(self.clients.claim()); });
self.addEventListener('notificationclick', function (e) {
  e.notification.close();
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (cs) {
    for (var i = 0; i < cs.length; i++) if (cs[i].url.indexOf('admin.html') >= 0) return cs[i].focus();
    return self.clients.openWindow('admin.html');
  }));
});
