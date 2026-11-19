/* ------------------------------------------------------------------
   OPENED (build 189): on My activity, under the sales card, who opened
   the agent's offer links this week (js/offerlink.js, mm_my_opens).
   A broker who introduced himself on the link's page shows by name, with
   his company and number, Call and WhatsApp. Any other phone shows as
   "a phone not known yet". A hold request or a client version sent shows
   as a tag. Read every minute while the page is in front.
   Independent of js/manager.js: it watches the page and puts its card
   back whenever My activity redraws.
   ------------------------------------------------------------------ */
(function () {
  'use strict';
  var scr = document.getElementById('scr');
  if (!scr || typeof MM === 'undefined' || !MM.auth || !MM.auth.real || !MM.auth.real()) return;
  var AR = function () { return document.documentElement.lang === 'ar' || document.documentElement.dir === 'rtl'; };
  var W = {
    en: { h: 'Opened', week: 'this week', opens: 'opens', known: '{n} known', none: 'When a broker opens the link in your post, it shows here.',
      phone: 'A phone not known yet', hold: 'Hold asked', client: 'Sent to a client', call: 'Call', wa: 'WhatsApp', more: '{n} more', times: '{n}×', last: 'last {t}', clientOpens: 'client opened {n}×' },
    ar: { h: 'اتفتح', week: 'الأسبوع ده', opens: 'فتحة', known: '{n} معروفين', none: 'لما بروكر يفتح الرابط اللي في البوست بتاعك، هيظهر هنا.',
      phone: 'موبايل لسه مش معروف', hold: 'طلب حجز', client: 'اتبعت لعميل', call: 'اتصل', wa: 'واتساب', more: '{n} كمان', times: '{n}×', last: 'آخر مرة {t}', clientOpens: 'العميل فتح {n}×' }
  };
  function t(k, v) { var s = W[AR() ? 'ar' : 'en'][k] || W.en[k]; Object.keys(v || {}).forEach(function (x) { s = s.split('{' + x + '}').join(v[x]); }); return s; }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function when(iso) {
    var d = new Date(iso), now = new Date(), hm = (d.getHours() < 10 ? '0' : '') + d.getHours() + ':' + (d.getMinutes() < 10 ? '0' : '') + d.getMinutes();
    return d.toDateString() === now.toDateString() ? hm : d.toLocaleDateString(AR() ? 'ar-EG' : 'en-GB', { day: 'numeric', month: 'short' }) + ' ' + hm;
  }
  var rows = null;

  function html() {
    var total = 0, seen = {}, known = 0;
    (rows || []).forEach(function (r) { total += r.opens + r.client_opens; if (r.broker && !seen[r.mobile]) { seen[r.mobile] = 1; known++; } });
    var h = '<section class="card op189" id="op189"><h2>' + t('h') + ' <em>' + t('week') + '</em></h2>';
    if (!rows) return h + '<p class="note">…</p></section>';
    h += '<div class="op189-big"><b>' + total + '</b><span>' + t('opens') + (known ? ' · ' + t('known', { n: known }) : '') + '</span></div>';
    if (!rows.length) return h + '<p class="note">' + t('none') + '</p></section>';
    h += '<div class="op189-rows">';
    rows.slice(0, 8).forEach(function (r) {
      var intl = r.mobile ? String(r.mobile).replace(/^0/, '20').replace(/[^0-9]/g, '') : '';
      var tag = r.hold === 'asked' ? '<span class="op189-tag">' + t('hold') + '</span>' : r.client_opens ? '<span class="op189-tag g">' + t('client') + '</span>' : '<em>' + t('times', { n: r.opens }) + '</em>';
      h += '<div class="op189-r' + (r.broker ? ' is-known' : '') + (r.hold === 'asked' ? ' is-hot' : '') + '"><i></i>' +
        '<span class="nm">' + (r.broker ? '<b>' + esc(r.broker) + '</b> · ' + esc(r.broker_company) : esc(t('phone')) + ' · #' + esc(r.phone)) + '</span>' + tag +
        '<small>' + esc(r.unit) + (r.company ? ' · ' + esc(r.company) : '') + ' · ' + t('times', { n: r.opens }) + (r.client_opens ? ' · ' + t('clientOpens', { n: r.client_opens }) : '') + ' · ' + t('last', { t: when(r.last_at) }) + (r.mobile ? ' · <span dir="ltr">' + esc(r.mobile) + '</span>' : '') + '</small>' +
        (r.mobile ? '<span class="op189-btns"><a class="op189-b fill" href="tel:' + esc(r.mobile) + '">' + t('call') + '</a><a class="op189-b" href="https://wa.me/' + intl + '" target="_blank" rel="noopener">' + t('wa') + '</a></span>' : '') +
        '</div>';
    });
    h += '</div>';
    if (rows.length > 8) h += '<p class="note">' + t('more', { n: rows.length - 8 }) + '</p>';
    return h + '</section>';
  }
  function place() {
    var have = document.getElementById('op189');
    var first = scr.querySelector('.card');
    if (!first) return;
    if (have) { if (have.dataset.v !== String(stamp)) { have.outerHTML = html(); mark(); } return; }
    first.insertAdjacentHTML('afterend', html()); mark();
  }
  var stamp = 0;
  function mark() { var e = document.getElementById('op189'); if (e) e.dataset.v = String(stamp); }
  function load() {
    if (document.hidden) return;
    MM.auth.call('/rest/v1/rpc/mm_my_opens', { method: 'POST', body: { p_days: 7 } }).then(function (r) {
      if (r.status !== 200 || !Array.isArray(r.body)) return;
      rows = r.body; stamp++; place();
    }, function () { /* offline: the card keeps what it had */ });
  }
  new MutationObserver(function () { if (!document.getElementById('op189')) place(); }).observe(scr, { childList: true });
  load();
  setInterval(load, 60000);
  document.addEventListener('visibilitychange', function () { if (!document.hidden) load(); });
}());
