/* Main Marks background worker (build 187): ONLY the "your offer is ready" buzz.
   It shows the notification the store's sender pushes (js/buzz.js, Main Marks Store
   functions/mm-buzz) and, when it is tapped, opens that page of the app.
   ON PURPOSE IT HAS NO FETCH HANDLER: it never stores or serves the app's files, so a
   phone can never be held on old code by it (the trap seen on the offer apps). */
self.addEventListener('install', function () { self.skipWaiting(); });
self.addEventListener('activate', function (e) { e.waitUntil(self.clients.claim()); });

self.addEventListener('push', function (e) {
  var d = {};
  try { d = e.data ? e.data.json() : {}; } catch (x) { d = { body: e.data ? e.data.text() : '' }; }
  e.waitUntil(self.registration.showNotification(d.title || 'Main Marks', {
    body: d.body || '',
    tag: d.tag || 'mm-buzz',
    renotify: true,
    requireInteraction: true,
    icon: 'img/icon-180.png',
    data: { url: d.url || 'index.html' }
  }));
});

self.addEventListener('notificationclick', function (e) {
  e.notification.close();
  var want = (e.notification.data && e.notification.data.url) || 'index.html';
  /* only a page of this app */
  if (!/^(project|index)\.html(\?|$)/.test(want)) want = 'index.html';
  var url = new URL(want, self.registration.scope).href;
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (list) {
    for (var i = 0; i < list.length; i++) {
      var c = list[i];
      if (c.url.indexOf(self.registration.scope) === 0 && 'navigate' in c) {
        return c.navigate(url).then(function (w) { return (w || c).focus(); }, function () { return self.clients.openWindow(url); });
      }
    }
    return self.clients.openWindow(url);
  }));
});
