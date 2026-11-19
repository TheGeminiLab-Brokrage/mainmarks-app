/* ------------------------------------------------------------------
   THE OFFER LINK, the broker's page (build 189; Muhanad 2026-11-20,
   "build let me see it" on the mock N8bn3zqds9yPCJDMBRyPD5).

   o.html?c=<code>&b=<building>. The code was made by the agent's app
   when the WhatsApp post was written (js/post.js, mm_link_make). This
   page asks the store's mm-offer function (Main Marks Store,
   functions/mm-offer) for that link: the unit, its plan, and ONLY that
   unit's row from the live sheet (and, if it is gone, three available
   ones of its type). It reads the row with the app's own reader
   (js/inventory.js: fail closed on status and price) and words the
   figures with the post's own function (js/post.js caption), so the
   broker sees exactly what the agent sent, live.

   Two things for the broker, each asking name, mobile and company ONCE
   on this phone (consent shown): "Send to my client with my name" (a
   second link; the client sees the broker as the advisor, no Main Marks
   agent) and "Hold it for 24 hours" (a request the agent answers).

   The phone is a random id kept in this browser (localStorage mm.dev):
   no cookie of anyone else's, no number read from the phone.
   ------------------------------------------------------------------ */
(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  var view = $('view');
  var Q = new URLSearchParams(location.search);
  var CODE = Q.get('c') || '', BLD = (Q.get('b') || '').replace(/[^A-Za-z0-9 -]/g, '').slice(0, 12);

  function store(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } return null; }
  var DEV = store('mm.dev');
  if (!DEV || !/^[A-Za-z0-9_-]{16,64}$/.test(DEV)) {
    var a = new Uint8Array(18); (crypto.getRandomValues ? crypto.getRandomValues(a) : a);
    DEV = Array.prototype.map.call(a, function (x) { return 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-_'[x % 64]; }).join('');
    store('mm.dev', DEV);
  }
  var ME = null; try { ME = JSON.parse(store('mm.me') || 'null'); } catch (e) { ME = null; }

  var LANG = store('mm.olang') || (/^ar/i.test(navigator.language || '') ? 'ar' : 'en');
  var W = {
    en: { other: 'العربية', loading: 'Loading the unit…', bad: 'This offer link is not valid. Ask your Main Marks agent for a new one.',
      fail: 'The unit could not be checked right now. Try again in a minute.', avail: 'Available', checked: 'checked {t}',
      gone: 'Not available', goneText: 'This unit is no longer available.', alt: 'Still available, of the same kind:', askAlt: 'Ask {a} for any of these.',
      price: 'Price', after: 'Price after {p}% off', down: 'Down payment', noDown: 'No down payment', down2: 'Then, after 3 months', every: 'Every 3 months',
      years: 'Years to pay', month: 'About a month', cash: 'One payment, in cash', noPlan: 'Ask your agent for today’s payment plan.',
      client: 'Send to my client with my name', clientSub: 'no Main Marks agent on it', hold: 'Hold it for 24 hours', held: 'Hold asked ✓',
      formClient: 'A version for your client', formClientSub: 'Your name and number on it, so your client comes back to you.',
      formHold: 'Hold this unit for 24 hours', formHoldSub: '{a} confirms the hold within minutes.',
      name: 'Your name', mobile: 'Your mobile', company: 'Your company', consent: 'Asked once on this phone. Main Marks’ sales team will see your name and number, to follow up with you.',
      makeClient: 'Make my client version', askHold: 'Ask to hold it', back: 'Back', bad_name: 'Write your name.', bad_mobile: 'Write your mobile number, digits only.', bad_company: 'Write your company’s name.',
      ready: 'Ready for your client. Check it, then send.', send: 'Send on WhatsApp', copied: 'The text is copied too.', holdOk: 'Asked. {a} will confirm the hold.',
      sentBy: 'Sent by {a} · Main Marks Development', advisor: 'Your advisor', callAdv: 'Call {n}', waAdv: 'WhatsApp {n}', mmDev: 'Main Marks Development',
      linkLine: 'Live price and availability:', m2: 'm²', building: 'Building {b}' },
    ar: { other: 'English', loading: 'جاري تحميل الوحدة…', bad: 'الرابط ده مش شغال. اطلب رابط جديد من مندوب مين ماركس.',
      fail: 'مش قادرين نتأكد من الوحدة دلوقتي. جرب كمان دقيقة.', avail: 'متاحة', checked: 'اتأكدنا الساعة {t}',
      gone: 'مش متاحة', goneText: 'الوحدة دي مبقتش متاحة.', alt: 'لسه متاح من نفس النوع:', askAlt: 'اسأل {a} عن أي واحدة منهم.',
      price: 'السعر', after: 'السعر بعد خصم {p}%', down: 'المقدم', noDown: 'بدون مقدم', down2: 'وبعد 3 شهور', every: 'قسط كل 3 شهور',
      years: 'سنين التقسيط', month: 'حوالي في الشهر', cash: 'الدفع كاش مرة واحدة', noPlan: 'اسأل المندوب عن نظام السداد النهارده.',
      client: 'ابعتها لعميلي باسمي', clientSub: 'من غير اسم مندوب مين ماركس', hold: 'احجزها 24 ساعة', held: 'طلب الحجز اتبعت ✓',
      formClient: 'نسخة لعميلك', formClientSub: 'باسمك ورقمك، علشان عميلك يرجعلك انت.',
      formHold: 'احجز الوحدة 24 ساعة', formHoldSub: '{a} هيأكد الحجز خلال دقايق.',
      name: 'اسمك', mobile: 'رقم موبايلك', company: 'اسم شركتك', consent: 'بنسأل مرة واحدة على الموبايل ده. فريق مبيعات مين ماركس هيشوف اسمك ورقمك علشان يتابع معاك.',
      makeClient: 'اعمل نسخة عميلي', askHold: 'اطلب الحجز', back: 'رجوع', bad_name: 'اكتب اسمك.', bad_mobile: 'اكتب رقم موبايلك أرقام بس.', bad_company: 'اكتب اسم شركتك.',
      ready: 'جاهزة لعميلك. راجعها وابعتها.', send: 'ابعت على واتساب', copied: 'النص اتنسخ كمان.', holdOk: 'اتبعت. {a} هيأكد الحجز.',
      sentBy: 'من {a} · مين ماركس للتطوير', advisor: 'مستشارك', callAdv: 'كلم {n}', waAdv: 'واتساب {n}', mmDev: 'مين ماركس للتطوير',
      linkLine: 'السعر والحالة لحظة بلحظة:', m2: 'متر', building: 'مبنى {b}' }
  };
  function t(k, v) { var s = (W[LANG] || W.en)[k] || W.en[k] || k; Object.keys(v || {}).forEach(function (x) { s = s.split('{' + x + '}').join(v[x]); }); return s; }
  function money(v) { return Math.round(v).toLocaleString('en-US'); }
  function hhmm(d) { return (d.getHours() < 10 ? '0' : '') + d.getHours() + ':' + (d.getMinutes() < 10 ? '0' : '') + d.getMinutes(); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function setLang() {
    document.documentElement.lang = LANG; document.documentElement.dir = LANG === 'ar' ? 'rtl' : 'ltr';
    $('lang').textContent = t('other');
  }
  $('lang').addEventListener('click', function () { LANG = LANG === 'ar' ? 'en' : 'ar'; store('mm.olang', LANG); setLang(); paint(); });
  setLang();

  function call(body) {
    var s = CONFIG.store;
    return fetch(s.url + '/functions/v1/mm-offer', { method: 'POST', cache: 'no-store',
      headers: { apikey: s.key, Authorization: 'Bearer ' + s.key, 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      .then(function (r) { return r.json().catch(function () { return { error: 'error' }; }); });
  }
  /* the app's own reader, on the one row the store handed back (fail closed on status and price) */
  function readRows(p, csv) {
    if (!csv) return Promise.resolve({ all: [] });
    var real = window.fetch;
    window.fetch = function () { return Promise.resolve(new Response(csv)); };
    var pr;
    try { pr = MM.inventory.load(Object.assign({}, p.inventory, { url: 'offer-row.csv', live: null })); }
    finally { window.fetch = real; }
    return pr.then(function (res) { res.all.forEach(function (u) { u.fid = MM.inventory.floorId(u.floor); }); return res; }, function () { return { all: [] }; });
  }

  var S = null;       /* { d: the store's answer, p, l, u, alt, pl, at, mode } */
  function paint() {
    if (!S) return;
    if (S.mode === 'form') return form(S.want);
    if (S.mode === 'client') return client();
    page();
  }

  function figures() {
    var u = S.u, p = S.p, pl = S.pl, rows = [];
    var s = null;
    try {
      if (pl && MM.plans.applicable(p.plans, u.type, new Date()).some(function (x) { return x.id === pl.id; })) {
        s = MM.plans.schedule({ listPrice: u.listPrice, discount: pl.discount || 0, plan: pl, terms: p.terms || {}, from: new Date() });
        if (s && s.broken) s = null;
      }
    } catch (e) { s = null; }
    if (!s) {
      rows.push([t('price'), money(u.listPrice), true]);
      return '<div class="o-figs">' + rows.map(fig).join('') + '</div><p class="o-note">' + t('noPlan') + '</p>';
    }
    rows.push([s.discount ? t('after', { p: Math.round(s.discountPct * 1000) / 10 }) : t('price'), money(s.payable), true]);
    if (s.cash) rows.push([t('cash'), '']);
    else {
      rows.push([t('down'), s.down ? money(s.down) : t('noDown')]);
      (s.milestones || []).filter(function (m) { return m.down; }).forEach(function (m) { rows.push([t('down2'), money(m.amount)]); });
      rows.push([t('every'), money(s.each)]);
      rows.push([t('years'), String(pl.years)]);
      rows.push([t('month'), money(Math.ceil(Math.max(s.each, s.lastInstalment || 0) / (s.everyMonths || 3)))]);
    }
    return '<div class="o-figs">' + rows.map(fig).join('') + '</div>';
  }
  function fig(r) { return '<div class="o-fig' + (r[2] ? ' big' : '') + '"><span>' + esc(r[0]) + '</span><b>' + esc(r[1]) + '</b></div>'; }
  function lineName() { var n = S.l ? S.l.name : ''; try { if (LANG === 'ar' && MM.post && MM.post.caption) { /* the post's Arabic name of the line */ } } catch (e) {} return n; }
  function head() {
    var u = S.u;
    return '<p class="o-k">' + esc(lineName()) + '</p><h1 class="o-h">' + esc(u ? (u.type + ' ' + u.code) : S.d.unit) + '</h1>' +
      (u ? '<p class="o-sub">' + esc([u.floor, BLD ? t('building', { b: BLD }) : '', money(u.area) + ' ' + t('m2')].filter(Boolean).join(' · ')) + '</p>' : '');
  }

  function page() {
    var d = S.d, u = S.u, html = head();
    if (!u || !u.sellable) {
      html += '<span class="o-live off"><i></i>' + t('gone') + ' · ' + t('checked', { t: hhmm(S.at) }) + '</span>' +
        '<div class="o-sold">' + t('goneText') + '</div>';
      if (S.alt.length) {
        html += '<p class="o-k">' + t('alt') + '</p><div class="o-figs">' + S.alt.map(function (x) {
          return fig([x.code + ' · ' + x.floor + ' · ' + money(x.area) + ' ' + t('m2'), money(x.listPrice)]);
        }).join('') + '</div><p class="o-note">' + t('askAlt', { a: d.agent || 'Main Marks' }) + '</p>';
      }
      view.innerHTML = html + foot();
      return;
    }
    html += '<span class="o-live"><i></i>' + t('avail') + ' · ' + t('checked', { t: hhmm(S.at) }) + '</span>' + figures();
    if (d.kind === 'client' && d.advisor) {
      var intl = String(d.advisor.mobile).replace(/^0/, '20').replace(/[^0-9]/g, '');
      html += '<p class="o-k">' + t('advisor') + '</p><h2 class="o-h" style="font-size:22px">' + esc(d.advisor.name) + '</h2>' +
        '<a class="o-cta" style="display:grid;place-items:center;text-decoration:none" href="https://wa.me/' + intl + '">' + esc(t('waAdv', { n: d.advisor.name.split(' ')[0] })) + '</a>' +
        '<a class="o-ghost" href="tel:' + esc(d.advisor.mobile) + '">' + esc(t('callAdv', { n: d.advisor.name.split(' ')[0] })) + ' · ' + esc(d.advisor.mobile) + '</a>';
    } else if (d.kind === 'post') {
      html += '<button class="o-cta" type="button" id="bClient">' + t('client') + '<small>' + t('clientSub') + '</small></button>' +
        '<button class="o-ghost" type="button" id="bHold"' + (d.hold ? ' disabled' : '') + '>' + (d.hold ? t('held') : t('hold')) + '</button>';
    }
    view.innerHTML = html + foot();
    var bc = $('bClient'), bh = $('bHold');
    if (bc) bc.onclick = function () { ME ? makeClient() : (S.mode = 'form', S.want = 'client', paint()); };
    if (bh) bh.onclick = function () { ME ? askHold() : (S.mode = 'form', S.want = 'hold', paint()); };
  }
  function foot() { return '<p class="o-foot">' + esc(S.d.kind === 'post' ? t('sentBy', { a: S.d.agent || 'Main Marks' }) : t('mmDev')) + '</p>'; }

  function form(want) {
    var hold = want === 'hold';
    view.innerHTML = head() + '<form class="o-form" id="f" novalidate>' +
      '<p class="o-k">' + t(hold ? 'formHold' : 'formClient') + '</p><p class="o-note" style="margin:0">' + t(hold ? 'formHoldSub' : 'formClientSub', { a: S.d.agent || 'Main Marks' }) + '</p>' +
      '<label>' + t('name') + '<input id="fN" autocomplete="name" maxlength="60"></label>' +
      '<label>' + t('mobile') + '<input id="fM" type="tel" inputmode="tel" autocomplete="tel" maxlength="20" dir="ltr"></label>' +
      '<label>' + t('company') + '<input id="fC" autocomplete="organization" maxlength="80"></label>' +
      '<p class="o-consent">' + t('consent') + '</p><p class="o-err" id="fE" hidden></p>' +
      '<button class="o-cta" type="submit" id="fGo">' + t(hold ? 'askHold' : 'makeClient') + '</button></form>' +
      '<button class="o-ghost" type="button" id="fBack">' + t('back') + '</button>';
    $('fBack').onclick = function () { S.mode = 'page'; paint(); };
    $('f').addEventListener('submit', function (e) {
      e.preventDefault();
      var body = { a: 'identify', d: DEV, name: $('fN').value.trim(), mobile: $('fM').value.trim(), company: $('fC').value.trim() };
      $('fGo').disabled = true;
      call(body).then(function (r) {
        $('fGo').disabled = false;
        if (!r || !r.ok) { $('fE').hidden = false; $('fE').textContent = t('bad_' + (r && r.error)) !== 'bad_' + (r && r.error) ? t('bad_' + r.error) : t('fail'); return; }
        ME = { name: body.name, mobile: body.mobile.replace(/[^0-9+]/g, '') };
        store('mm.me', JSON.stringify(ME));
        S.d.me = { name: ME.name };
        hold ? askHold() : makeClient();
      }, function () { $('fGo').disabled = false; $('fE').hidden = false; $('fE').textContent = t('fail'); });
    });
    setTimeout(function () { var n = $('fN'); if (n) n.focus(); }, 50);
  }

  function askHold() {
    call({ a: 'hold', c: CODE, d: DEV }).then(function (r) {
      if (r && r.error === 'who') { ME = null; store('mm.me', 'null'); S.mode = 'form'; S.want = 'hold'; return paint(); }
      S.d.hold = !!(r && r.ok); S.mode = 'page'; paint();
      if (r && r.ok) { var p = document.createElement('p'); p.className = 'o-ok'; p.textContent = t('holdOk', { a: S.d.agent || 'Main Marks' }); view.insertBefore(p, view.firstChild); }
    });
  }
  function makeClient() {
    call({ a: 'client', c: CODE, d: DEV }).then(function (r) {
      if (r && r.error === 'who') { ME = null; store('mm.me', 'null'); S.mode = 'form'; S.want = 'client'; return paint(); }
      if (!r || !r.code) { view.insertAdjacentHTML('afterbegin', '<p class="o-err">' + t('fail') + '</p>'); return; }
      S.clientCode = r.code; S.mode = 'client'; paint();
    });
  }
  function clientText() {
    var url = location.origin + location.pathname + '?c=' + S.clientCode + (BLD ? '&b=' + encodeURIComponent(BLD) : '');
    var txt = '';
    try {
      txt = MM.post.caption({ project: S.p, line: S.l, unit: S.u, plan: S.pl, buildingName: BLD ? 'Building ' + BLD : '', lang: LANG,
        agent: { name: ME ? ME.name : '', phone: ME ? ME.mobile : '' } });
    } catch (e) { txt = S.u.code + '\n' + money(S.u.listPrice) + ' EGP'; }
    return txt + '\n\n' + t('linkLine') + '\n' + url;
  }
  function client() {
    var txt = clientText();
    view.innerHTML = head() + '<p class="o-ok">' + t('ready') + '</p><pre class="o-text" id="ct"></pre>' +
      '<button class="o-cta" type="button" id="cSend">' + t('send') + '</button><p class="o-note" id="cNote"></p>' +
      '<button class="o-ghost" type="button" id="cBack">' + t('back') + '</button>';
    $('ct').textContent = txt;
    $('cBack').onclick = function () { S.mode = 'page'; paint(); };
    $('cSend').onclick = function () {
      try { if (navigator.clipboard) navigator.clipboard.writeText(txt).catch(function () {}); } catch (e) { /* copying is a help only */ }
      if (navigator.share) { navigator.share({ text: txt }).catch(function () {}); }
      else window.open('https://api.whatsapp.com/send?text=' + encodeURIComponent(txt), '_blank', 'noopener');
      $('cNote').textContent = t('copied');
    };
  }

  function start() {
    if (!/^[A-Za-z0-9]{6,12}$/.test(CODE) || typeof CONFIG === 'undefined' || !CONFIG.store) { view.innerHTML = '<p class="o-note">' + t('bad') + '</p>'; return; }
    view.innerHTML = '<p class="o-wait">' + t('loading') + '</p>';
    call({ a: 'open', c: CODE, d: DEV }).then(function (d) {
      if (!d || !d.found) { view.innerHTML = '<p class="o-note">' + t(d && d.found === false ? 'bad' : 'fail') + '</p>'; return; }
      var p = (CONFIG.projects || []).filter(function (x) { return x.id === d.project; })[0];
      var l = p && (p.lines || []).filter(function (x) { return x.id === d.line; })[0];
      if (!p) { view.innerHTML = '<p class="o-note">' + t('fail') + '</p>'; return; }
      if (d.me && !ME) ME = null;           /* known on the store but not on this browser: the form asks again */
      return readRows(p, d.rows).then(function (res) {
        var u = res.all.filter(function (x) { return x.code === d.unit; })[0] || null;
        S = { d: d, p: p, l: l, u: u, alt: res.all.filter(function (x) { return x.code !== d.unit && x.sellable; }),
              pl: d.plan ? (p.plans || []).filter(function (x) { return x.id === d.plan; })[0] || null : null, at: new Date(), mode: 'page' };
        paint();
      });
    }, function () { view.innerHTML = '<p class="o-note">' + t('fail') + '</p>'; });
  }
  start();
}());
