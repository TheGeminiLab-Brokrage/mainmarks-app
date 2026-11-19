/* ------------------------------------------------------------------
   SEND LATER: THE PHONE BUZZES WHEN THE OFFER IS READY (build 187,
   Muhanad 2026-11-20: "let us try it").

   On the WhatsApp post sheet (js/post.js) the salesperson picks a time.
   This file asks the phone for permission to notify, gets the phone's
   push address (Web Push: Apple, Google and Mozilla carry it for free)
   and saves the plan through mm_buzz_plan (Main Marks Store,
   sql/11_buzz.sql). At that time the store's sender (functions/mm-buzz)
   buzzes the phone; tapping the buzz opens project.html at the same
   unit with its post sheet ready (js/lineflow.js, "?buzz=").

   sw.js is the small background worker that shows the buzz and opens the
   page. It has NO fetch handler: it never stores or serves the app's
   files, so it can never hold a phone on yesterday's code.

   An iPhone only allows this from the Home Screen icon (iOS 16.4 and
   newer), not from a Safari tab: state() says 'need-home' and the sheet
   says how to add it.

   Only on the real store (the STORE block of js/config.js carries
   buzzKey, the PUBLIC key; the demo copies have no store, so no button).
   ------------------------------------------------------------------ */
(function (root) {
  'use strict';
  var MM = root.MM = root.MM || {};

  function cfg() { return typeof CONFIG !== 'undefined' ? CONFIG : {}; }
  function key() { var s = cfg().store; return s && s.buzzKey ? s.buzzKey : null; }

  function bytes(b64) {
    var s = String(b64).replace(/-/g, '+').replace(/_/g, '/');
    while (s.length % 4) s += '=';
    var bin = atob(s), out = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  }
  function ios() {
    var ua = navigator.userAgent || '';
    return /iPhone|iPad|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  }
  function standalone() {
    try { if (root.matchMedia && root.matchMedia('(display-mode: standalone)').matches) return true; } catch (e) { /* old browser */ }
    return navigator.standalone === true;
  }
  function supported() {
    return 'serviceWorker' in navigator && 'PushManager' in root && 'Notification' in root && root.isSecureContext !== false;
  }

  /* the button shows only on the real app, for a signed-in person */
  function available() { return !!(key() && MM.auth && MM.auth.real && MM.auth.real()); }

  /* 'ok' | 'need-home' (an iPhone in a Safari tab) | 'blocked' (he said no before) | 'unsupported' */
  function state() {
    if (ios() && !standalone()) return 'need-home';
    if (!supported()) return 'unsupported';
    if (Notification.permission === 'denied') return 'blocked';
    return 'ok';
  }

  var ready = null;
  function worker() {
    if (!ready) ready = navigator.serviceWorker.register('sw.js', { scope: './' }).then(function () { return navigator.serviceWorker.ready; });
    return ready;
  }
  function fail(code, detail) { var e = new Error(detail || code); e.code = code; return e; }

  /* o: { when: Date, url: 'project.html?...', title, body }. CALL IT INSIDE THE TAP: an iPhone asks
     for permission only from a tap, so the request is the first thing that happens. */
  function plan(o) {
    var st = state();
    if (st !== 'ok') return Promise.reject(fail(st));
    var asked = Notification.permission === 'granted' ? Promise.resolve('granted') : Notification.requestPermission();
    return Promise.resolve(asked).then(function (p) {
      if (p !== 'granted') throw fail('blocked');
      /* a browser with no push service can leave this waiting for ever: give it 20 seconds */
      return Promise.race([
        worker().then(function (reg) {
          return reg.pushManager.getSubscription().then(function (s) {
            return s || reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: bytes(key()) });
          });
        }),
        new Promise(function (ok, no) { setTimeout(function () { no(fail('unsupported')); }, 20000); })
      ]);
    }).then(function (sub) {
      var j = sub.toJSON();
      return MM.auth.call('/rest/v1/rpc/mm_buzz_plan', { method: 'POST', body: {
        p_endpoint: j.endpoint, p_p256dh: j.keys && j.keys.p256dh, p_auth: j.keys && j.keys.auth,
        p_due: o.when.toISOString(), p_url: o.url, p_title: o.title, p_body: o.body } });
    }).then(function (r) {
      if (r.status !== 200) throw fail('store', r.body && r.body.message);
      return r.body;
    });
  }

  MM.buzz = { available: available, state: state, plan: plan, ios: ios };
}(typeof window !== 'undefined' ? window : globalThis));
