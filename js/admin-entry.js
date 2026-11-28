/* ------------------------------------------------------------------
   Main Marks — THE ADMIN'S HISTORY AND HER CORRECTIONS (build 217).
   Muhanad, 28 Nov 2026: "when the admin try to edit an entry she should
   have full acsess on what to edit not only delete also adjust the time
   and the dates and the names what every she wants". Agreed on a preview
   the same day ("yes to all"); and "any list is should not go to the whole
   page like the payment plan it should be in a windoe".

     - History is EVERY entry, offers too (it was the audit's lines, which
       never held an offer), in one window, read a hundred at a time from
       the store, with a find box (company, sales agent, unit) and chips
     - an entry opens with every part of it as a line: tap a line to change
       it; then one tap says why
     - "Add a missing entry", remove, and bring back
     - what a change does to the figures is said before it is saved
   The rules are the store's (mm_admin_edit, mm_admin_add, mm_remove,
   mm_admin_restore): this page only does not send what it would refuse.
   The old value, the reason and her name stay in mm_audit, which nobody
   can write to; the sales agent and the manager see a "Corrected" mark
   (mm_events.corrected, MM.corrected in js/auth.js).
   ------------------------------------------------------------------ */
(function (root) {
  'use strict';
  var MM = root.MM;

  MM.adminEntry = function (X) {
    var t = MM.t, esc = X.esc, nm = X.nm, AR = MM.isArabic, $ = X.$, ARROW = AR ? ' ← ' : ' → ';
    var KIND = { offer: t('Special request'), broadcast: t('Broadcast'), orientation: t('Orientation'), workshop: t('Workshop'), meeting: t('Meeting'), reservation: t('Reservation'), contract: t('Contract'), cancel: t('Cancelled reservation') };
    var ADDT = { offer: t('Add a special request'), broadcast: t('Add a broadcast'), orientation: t('Add an orientation'), workshop: t('Add a workshop'), meeting: t('Add a meeting'), reservation: t('Add a reservation'), contract: t('Add a contract') };
    var WHYC = ['Client withdrew', 'Payment not made', 'Moved to another unit', 'Other'];
    var PAGE = 100;

    function kindOf(e) { return e.kind === 'offer' && !e.company_id ? 'broadcast' : e.kind; }
    function coName(id) { var c = X.companies().filter(function (x) { return x.id === id; })[0]; return c ? c.name : id ? t('a company no longer listed') : ''; }
    function pName(id) { var p = X.person(id); return p ? p.name : ''; }
    function teamName(id) { var p = X.person(id), tm = p && X.team(p.team_id); return tm ? X.teamLabel(tm) : ''; }
    function keyOf(e) { return e.offer_key || e.unit_code || ''; }
    function unitsOf(e) { return e.kind === 'offer' ? parts(keyOf(e)).map(function (x) { return x.c; }) : e.unit_code ? [e.unit_code] : []; }
    function parts(key) { return String(key || '').split('+').filter(Boolean).map(function (p) { var i = p.indexOf(':'); return i < 0 ? { c: p, p: '' } : { c: p.slice(0, i), p: p.slice(i + 1) }; }); }
    function joined(list) { return list.filter(function (x) { return x.c; }).map(function (x) { return x.c + (x.p ? ':' + x.p : ''); }).sort().join('+'); }
    function egp(v) { return t('EGP {n}', { n: Math.round(Number(v)).toLocaleString('en-US') }); }
    function hm(m) { return ('0' + Math.floor(m / 60)).slice(-2) + ':' + ('0' + m % 60).slice(-2); }
    function planWords(id, d, y) { return id ? MM.contractPlan.text(id, d, y) : ''; }
    function nowCairo() {
      var f = new Intl.DateTimeFormat('en-GB', { timeZone: 'Africa/Cairo', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(new Date()), o = {};
      f.forEach(function (p) { o[p.type] = p.value; });
      return { d: o.year + '-' + o.month + '-' + o.day, m: +o.hour * 60 + +o.minute };
    }
    function productOf(u) {
      var type = String(u.type || '').toLowerCase(), floor = String(u.floor || '').toLowerCase();
      return type === 'clinic' ? 'Clinics' : type === 'commercial' ? 'Commercial' : type === 'admin' ? (floor.indexOf('fourth') !== -1 ? 'The Fourth' : 'Offices') : 'Serviced apartments';
    }
    /* the units of every project a sales agent can open, read once */
    var UN = null;
    function unitsRead() {
      if (!UN) UN = Promise.all(((typeof CONFIG !== 'undefined' && CONFIG.projects) || []).filter(function (p) { return p && p.ready === true && p.inventory; }).map(function (p) {
        return MM.inventory.load(p.inventory).then(function (r) { return r.all.map(function (u) { return { c: String(u.code).toUpperCase(), u: u, p: productOf(u), project: p.id }; }); });
      })).then(function (a) { return [].concat.apply([], a); }).catch(function () { UN = null; return []; });
      return UN;
    }
    var units = [];
    function unit(c) { for (var i = 0; i < units.length; i++) if (units[i].c === c) return units[i]; return null; }
    function unitLine(x) { return [t(x.p), x.u.floor ? MM.tx.floorShort(MM.inventory.floorId(x.u.floor), x.u.floor) : '', x.u.area ? t('{n} m²', { n: x.u.area }) : ''].filter(Boolean).join(' · '); }

    /* ==== THE HISTORY ==== */
    var H = { rows: [], more: true, busy: false, failed: false, filter: 'all', find: '', seq: 0, started: false };
    var CH = [['all', t('All')], ['offer', t('Requests')], ['broadcast', t('Broadcasts')], ['visit', t('Visits')], ['meeting', t('Meetings')], ['reservation', t('Reservations')], ['contract', t('Contracts')], ['cancel', t('Cancelled')], ['corr', t('Corrected')], ['removed', t('Removed')], ['handed', t('Handed over')]];
    var AUD = { removed: 'in.(remove,take_back)', handed: 'eq.hand_over' };
    var Q = { offer: '&kind=eq.offer&company_id=not.is.null', broadcast: '&kind=eq.offer&company_id=is.null', visit: '&kind=in.(orientation,workshop)', meeting: '&kind=eq.meeting', reservation: '&kind=eq.reservation', contract: '&kind=eq.contract', cancel: '&kind=eq.cancel', corr: '&corrected=not.is.null' };
    function findQ() {
      var q = H.find.trim(); if (!q) return '';
      var or = [], cos = MM.nameFind(X.companies().filter(function (c) { return !c.merged_into; }), q, function (c) { return c.name; }).slice(0, 40).map(function (x) { return x.item.id; }),
        ppl = MM.nameFind(X.people(), q, function (p) { return p.name; }).slice(0, 40).map(function (x) { return x.item.id; });
      if (cos.length) or.push('company_id.in.(' + cos.join(',') + ')');
      if (ppl.length) or.push('person_id.in.(' + ppl.join(',') + ')', 'person2_id.in.(' + ppl.join(',') + ')');
      if (/^[A-Za-z0-9./-]{1,16}$/.test(q) && /\d/.test(q)) or.push('unit_code.ilike.' + q + '*', 'offer_key.ilike.' + q + '*', 'offer_key.ilike.*%2B' + q + '*');
      return or.length ? '&or=(' + or.join(',') + ')' : null;
    }
    function auditShown(h) {
      var q = H.find.trim().toLowerCase(), d = h.detail || {}; if (!q) return true;
      var hit = function (n) { return !!n && (n.toLowerCase().indexOf(q) === 0 || n.toLowerCase().split(/\s+/).some(function (w) { return w.indexOf(q) === 0; })); };
      return hit(coName(d.company_id)) || hit(pName(d.person_id)) || unitsOf(d).some(function (c) { return c.toLowerCase().indexOf(q) === 0; });
    }
    function load(fresh) {
      if (H.busy && !fresh) return Promise.resolve();
      var seq = ++H.seq, from = fresh ? 0 : H.rows.length, f = H.filter, fq = AUD[f] ? '' : findQ(), path;
      if (fresh) { H.rows = []; H.more = true; H.failed = false; }
      if (fq === null) { H.more = false; H.busy = false; H.started = true; return Promise.resolve(); }
      H.busy = true; H.started = true;
      path = AUD[f] ? '/rest/v1/mm_audit?select=id,at,by_id,action,detail&action=' + AUD[f] + '&order=id.desc' : '/rest/v1/mm_events?select=*' + (Q[f] || '') + fq + '&order=on_date.desc,at_min.desc,id.desc';
      return X.call(path + '&limit=' + PAGE + '&offset=' + from).then(function (r) {
        if (seq !== H.seq) return;
        if (r.status !== 200 || !Array.isArray(r.body)) throw new Error('store');
        H.rows = H.rows.concat(r.body); H.more = r.body.length === PAGE; H.busy = false;
      }).catch(function () { if (seq === H.seq) { H.busy = false; H.failed = true; } });
    }
    function corrPill(e) {
      if (!e.corrected || !e.corrected.length) return '';
      var fresh = e.corrected[0].f === 'added' && e.corrected.length === 1;
      return '<span class="pillg">' + (fresh ? t('Added') : t('Corrected')) + '</span>';
    }
    function line(e) {
      var bits = [coName(e.company_id), pName(e.person_id) + (e.person2_id ? ' + ' + pName(e.person2_id) : '')].filter(Boolean).map(nm);
      if (e.value && (e.kind === 'contract' || e.kind === 'reservation')) bits.push(esc(egp(e.value)));
      return '<button class="hl" type="button" data-ent="' + esc(e.id) + '"><b><span>' + KIND[kindOf(e)] + (unitsOf(e).length ? ' · ' + nm(unitsOf(e).join(', ')) : '') + corrPill(e) + '</span><bdi class="hl-t">' + hm(e.at_min || 0) + '</bdi></b><small>' + bits.join(' · ') + '</small></button>';
    }
    function audLine(h) {
      var d = h.detail || {}, by = X.person(h.by_id), word = h.action === 'remove' ? t('Removed') : h.action === 'take_back' ? t('Taken back the same day') : t('Handed over');
      var bits = [coName(d.company_id), pName(d.person_id)].filter(Boolean).map(nm);
      if (by) bits.push(t('by {name}', { name: nm(by.name) }));
      return '<button class="hl" type="button" data-aud="' + esc(h.id) + '"><b><span>' + (KIND[kindOf(d)] || '') + (unitsOf(d).length ? ' · ' + nm(unitsOf(d).join(', ')) : '') + '<span class="pillg' + (h.action === 'hand_over' ? '' : ' r') + '">' + word + '</span></span><bdi class="hl-t">' + esc(X.partAt(h.at, { hour: '2-digit', minute: '2-digit', hour12: false })) + '</bdi></b><small>' + bits.join(' · ') + '</small>' + (d.reason ? '<q>' + esc(t(d.reason)) + '</q>' : '') + '</button>';
    }
    function days(list, day, row) {
      var g = []; list.forEach(function (e) { var k = day(e); if (!g.length || g[g.length - 1].k !== k) g.push({ k: k, r: [] }); g[g.length - 1].r.push(e); });
      return g.map(function (d) { return '<p class="hist-day"><bdi>' + esc(d.k) + '</bdi></p><div class="hist">' + d.r.map(row).join('') + '</div>'; }).join('');
    }
    function body() {
      if (H.failed && !H.rows.length) return '<p class="note center">' + t('The history could not be opened. Check the connection and open the page again.') + '</p>';
      if (!H.started || (H.busy && !H.rows.length)) return '<p class="note center">' + t('Opening the history…') + '</p>';
      var aud = !!AUD[H.filter], list = aud ? H.rows.filter(auditShown) : H.rows;
      if (!list.length && !H.more) return '<p class="note center">' + (H.find.trim() ? t('Nothing matches.') : t('Nothing here yet.')) + '</p>';
      return '<div class="win tall" id="hWin" tabindex="0">' + (aud ? days(list, function (h) { return X.partAt(h.at, { day: 'numeric', month: 'long', year: 'numeric' }); }, audLine) : days(list, function (e) { return X.dayText(e.on_date); }, line)) + (H.more ? '<p class="note center">' + t('Reading…') + '</p>' : '') + '</div>';
    }
    function fill(keep) {
      var box = $('hBody'), w = $('hWin'), y = keep && w ? w.scrollTop : 0; if (!box) return;
      box.innerHTML = body(); w = $('hWin'); if (w) { w.scrollTop = y; w.addEventListener('scroll', near); near(); }
      X.edges();
    }
    function near() {
      var w = $('hWin'); if (!w || !H.more || H.busy || H.failed) return;
      if (w.scrollHeight - w.clientHeight - w.scrollTop < 500) load().then(function () { fill(true); });
    }
    function screen() {
      if (!H.started) load(true).then(function () { fill(); });
      setTimeout(function () { var w = $('hWin'), on = document.querySelector('[data-ehf][aria-pressed="true"]'); if (w) { w.addEventListener('scroll', near); near(); } if (on && H.filter !== 'all') on.scrollIntoView({ inline: 'center', block: 'nearest' }); }, 0);
      return X.head(t('History'), '') + '<label class="fld adm-find"><input id="hFind" type="search" autocomplete="off" placeholder="' + esc(t('Company, sales agent or unit')) + '" value="' + esc(H.find) + '"></label>' +
        '<div class="chips">' + CH.map(function (c) { return '<button class="chip" type="button" data-ehf="' + c[0] + '" aria-pressed="' + (H.filter === c[0]) + '">' + c[1] + '</button>'; }).join('') + '</div><div id="hBody">' + body() + '</div>';
    }
    function reload(keep) { var w = $('hWin'), y = keep && w ? w.scrollTop : 0; return load(true).then(function () { fill(); var n = $('hWin'); if (n && y) n.scrollTop = y; }); }
    function changed() { X.refresh(); if ($('hBody')) reload(true); }

    /* ==== ONE ENTRY ==== */
    var ED = null;                       /* { e, d, isNew, log, mate, opener } */
    var GROUP = { offer: ['offer', 'broadcast'], orientation: ['orientation', 'workshop', 'meeting'], workshop: ['orientation', 'workshop', 'meeting'], meeting: ['orientation', 'workshop', 'meeting'] };
    var LINKED = { company: 1, person: 1, person2: 1, unit: 1 };
    function draft(e) {
      return { type: kindOf(e), co: e.company_id || '', who: e.person_id || '', who2: e.person2_id || '', date: e.on_date, min: e.at_min, key: e.kind === 'offer' ? joined(parts(keyOf(e))) : '', unit: e.kind === 'offer' ? '' : e.unit_code || '', price: e.kind === 'offer' ? 0 : Number(e.value || 0),
        plan: e.plan || '', pd: e.plan_down == null ? null : Number(e.plan_down), py: e.plan_years == null ? null : Number(e.plan_years), online: !!e.online, via: e.channel || '', why: e.why || '' };
    }
    function fields(k) {
      var f = [['kind', t('What')]]; if (k !== 'broadcast') f.push(['company', t('Company')]);
      f.push(['person', t('Sales agent')]);
      if (/orient|work/.test(k)) f.push(['person2', t('Also went')]); else if (/reserv|contract|cancel/.test(k)) f.push(['person2', t('Split with')]);
      f.push(['date', t('Date')], ['time', t('Time')]);
      if (/offer|broad/.test(k)) f.push(['units', t('Units, plans')], ['channel', t('Sent as')]);
      if (/reserv|contract|cancel/.test(k)) f.push(['unit', t('Unit')]);
      if (k === 'contract') f.push(['plan', t('Payment plan')]);
      if (/reserv|contract/.test(k)) f.push(['price', t('Price')]);
      if (k === 'meeting') f.push(['online', t('Where')]);
      if (k === 'cancel') f.push(['why', t('Reason')]);
      return f;
    }
    function val(d, f) {
      switch (f) {
        case 'kind': return KIND[d.type]; case 'company': return coName(d.co); case 'person': return pName(d.who); case 'person2': return d.who2 ? pName(d.who2) : t('Nobody');
        case 'date': return d.date ? X.dayText(d.date) : ''; case 'time': return d.min == null ? '' : hm(d.min);
        /* Arabic: the line starts with a unit code, and would be laid out left to right by it: the mark says right to left */
        case 'units': return (AR && d.key ? String.fromCharCode(8207) : '') + parts(d.key).map(function (x) { return x.c + (x.p ? ' (' + planWords(x.p) + ')' : ''); }).join(AR ? '، ' : ', ');
        case 'unit': return d.unit; case 'plan': return planWords(d.plan, d.pd, d.py); case 'price': return d.price ? egp(d.price) : '';
        case 'online': return d.online ? t('Online') : t('In person'); case 'channel': return d.via === 'post' ? t('WhatsApp post') : d.via === 'pdf' ? t('Offer PDF') : ''; case 'why': return d.why ? t(d.why) : '';
      }
      return '';
    }
    var ORDER = ['kind', 'company', 'person', 'person2', 'date', 'time', 'units', 'unit', 'plan', 'price', 'online', 'channel', 'why'];
    function nothing(f) { return f === 'company' ? t('No company') : t('Nothing'); }
    function diffs() {
      var a = draft(ED.e), b = ED.d, fa = {}, fb = {}, name = {};
      fields(a.type).forEach(function (x) { fa[x[0]] = 1; name[x[0]] = x[1]; }); fields(b.type).forEach(function (x) { fb[x[0]] = 1; name[x[0]] = x[1]; });
      return ORDER.filter(function (f) { return (fa[f] || fb[f]) && (fa[f] ? val(a, f) : '') !== (fb[f] ? val(b, f) : '') && !(f === 'person2' && !fa[f] !== !fb[f] && !a.who2 && !b.who2) && !(f === 'online' && !(fa[f] && fb[f])); })
        .map(function (f) { return { f: f, n: name[f], from: (fa[f] && val(a, f)) || nothing(f), to: (fb[f] && val(b, f)) || nothing(f) }; });
    }
    function open(id) {
      X.showSheet('<div><h3>' + t('History') + '</h3></div><div class="form"><p class="note">' + t('Reading…') + '</p></div>');
      Promise.all([X.call('/rest/v1/mm_events?select=*&id=eq.' + id), unitsRead()]).then(function (r) {
        units = r[1];
        var e = r[0].status === 200 && r[0].body[0];
        if (!e) return X.sheetNote(t('This entry is no longer there. Open the page again.'));
        ED = { e: e, d: draft(e), log: null, mate: null };
        entry();
        var pair = e.of_id ? '&id=eq.' + e.of_id : e.kind === 'reservation' && e.ended ? '&of_id=eq.' + e.id : '';
        if (pair) X.call('/rest/v1/mm_events?select=*' + pair).then(function (m) { if (ED && ED.e === e && m.status === 200 && m.body[0]) { ED.mate = m.body[0]; } });
        X.call('/rest/v1/mm_audit?select=id,at,by_id,action,detail&' + encodeURIComponent('detail->>id') + '=eq.' + e.id + '&order=id.desc').then(function (a) { if (ED && ED.e === e && a.status === 200) { ED.log = a.body; if ($('eLog')) $('eLog').innerHTML = trail(); X.edges(); } });
      }).catch(function () { X.sheetNote(t('No connection. Try again when you are online.')); });
    }
    /* what happened to this entry, newest first: recorded, handed over, plan added, changed, brought back */
    var ACT = { record: t('Recorded'), cancel: t('Recorded'), hand_over: t('Handed over'), set_plan: t('Plan added'), edit: t('Changed'), restore: t('Brought back'), remove: t('Removed'), take_back: t('Taken back the same day') };
    function trail() {
      var l = ED.log || []; if (!l.length && ED.e.kind !== 'offer') return '';
      var rows = l.map(function (h) {
        var d = h.detail || {}, by = X.person(h.by_id), ch = h.action === 'edit' ? MM.corrected(d.changed || []) : [];
        if (h.action === 'hand_over') ch = [t('To {name}', { name: pName(d.person_id) })];
        return '<div><span>' + (d.added ? t('Added by the admin') : ACT[h.action] || esc(h.action)) + (by ? ' · ' + nm(by.name) : '') + ' · <bdi>' + esc(X.whenAt(h.at)) + '</bdi>' + (d.reason ? ' · ' + esc(t(d.reason)) : '') + '</span>' + ch.map(function (w) { return '<p>' + (typeof w === 'string' ? nm(w) : w.html) + '</p>'; }).join('') + '</div>';
      });
      if (ED.e.kind === 'offer' && !l.some(function (h) { return h.action === 'record'; })) rows.push('<div><span>' + t('Sent by {name}', { name: nm(pName(ED.e.created_by)) }) + ' · <bdi>' + esc(X.whenAt(ED.e.created_at)) + '</bdi></span></div>');
      return rows.length ? '<p class="adm-k">' + t('What happened to it') + '</p><div class="difs' + (rows.length > 4 ? ' win' : '') + '">' + rows.join('') + '</div>' : '';
    }
    function steps(names, at) { return '<ol class="fl-line">' + names.map(function (n, i) { return '<li class="' + (i < at ? 'done' : i === at ? 'now' : '') + '"><span>' + n + '</span></li>'; }).join('') + '</ol>'; }
    function entry(err) {
      var e = ED.e, d = ED.d, isNew = ED.isNew, df = isNew ? [] : diffs(), chg = {}; df.forEach(function (x) { chg[x.f] = x; });
      var both = ED.mate && df.some(function (x) { return LINKED[x.f]; });
      X.showSheet('<div class="fl-top">' + steps(isNew ? [t('What'), t('Details')] : [t('The entry'), t('Why')], isNew ? 1 : 0) + '<h3>' + (isNew ? ADDT[d.type] : KIND[kindOf(e)]) + '</h3><p class="role">' + (isNew ? t('Tap each line.') : t('Tap anything to change it.')) + '</p></div><div class="form"><div class="fxs">' +
        fields(d.type).map(function (f) {
          var v = val(d, f[0]), c = chg[f[0]], lock = f[0] === 'kind' && (isNew || !GROUP[e.kind]);
          return '<button class="fx' + (c ? ' ch' : '') + '" type="button" data-fx="' + f[0] + '"' + (lock ? ' disabled' : '') + '><span>' + f[1] + '</span><b>' + (c ? '<s>' + nm(c.from) + '</s>' : '') + (v ? nm(v) : '<em>' + t('Choose') + '</em>') + '</b><i aria-hidden="true">' + (AR ? '‹' : '›') + '</i></button>';
        }).join('') + '</div>' +
        (both ? '<p class="note">' + (ED.mate.kind === 'contract' ? t('Its contract changes with it.') : ED.mate.kind === 'cancel' ? t('Its cancellation changes with it.') : t('Its reservation changes with it.')) + '</p>' : '') +
        '<p class="note bad" id="aErr"' + (err ? '' : ' hidden') + '>' + (err ? esc(err) : '') + '</p>' +
        '<button class="btn" type="button" id="eGo"' + (isNew || df.length ? '' : ' disabled') + '>' + (isNew ? t('Add this entry') : df.length ? t('Next · changes: {n}', { n: df.length }) : t('No changes yet')) + '</button>' +
        (isNew ? '' : '<div id="eLog">' + trail() + '</div><button class="txtb" type="button" id="eRm">' + t('Remove this entry') + '</button>') + '</div>');
      $('eGo').onclick = function () { var b = check(); if (b) return entry(b); if (isNew) addIt(); else whyStep(); };
      if ($('eRm')) $('eRm').onclick = removeStep;
      [].forEach.call(document.querySelectorAll('#sheet [data-fx]'), function (b) { b.onclick = function () { field(b.dataset.fx); }; });
      if (err) $('aErr').scrollIntoView({ block: 'center' });
      X.edges();
    }
    function check() {
      var d = ED.d, n = nowCairo(), m = ED.mate;
      if (d.type !== 'broadcast' && !d.co) return t('Choose the company.');
      if (!d.who) return t('Choose the sales agent.');
      if (d.who2 && d.who2 === d.who) return t('The two names are the same person.');
      if (!d.date) return t('Choose the date.');
      if (d.date > n.d) return t('This date has not come yet.');
      if (d.date === n.d && d.min > n.m + 5) return t('This time has not come yet.');
      if (/offer|broad/.test(d.type) && !d.key) return t('Choose the unit.');
      if (/reserv|contract|cancel/.test(d.type) && !d.unit) return t('Choose the unit.');
      if (d.type === 'contract' && !d.plan && (ED.isNew || ED.e.plan)) return t('Pick the payment plan the customer signed.');
      if (/reserv|contract/.test(d.type) && !(d.price > 0)) return t('Type the price.');
      if (m && ED.e.of_id && d.date < m.on_date) return t('It cannot be before its reservation, {date}.', { date: X.dayText(m.on_date) });
      if (m && ED.e.kind === 'reservation' && d.date > m.on_date) return t('The reservation cannot be after what closed it, {date}.', { date: X.dayText(m.on_date) });
      return '';
    }
    /* a list to choose from, in a window, found as every list here is found (MM.nameFind); drawn a part at a time */
    function picker(title, list, chosen, back, done, o) {
      o = o || {};
      var shown = list, n = 0, long = list.length > 6;
      var row = function (x) { return '<button class="op" type="button" data-op="' + esc(x[0]) + '" aria-pressed="' + (String(x[0]) === String(chosen)) + '"><span>' + nm(x[1]) + '</span>' + (x[2] ? '<small>' + esc(x[2]) + '</small>' : '') + '</button>'; };
      X.showSheet('<div class="fl-top"><h3>' + title + '</h3></div><div class="form">' + (list.length > 8 || o.typed ? '<label class="fld adm-find"><input id="pkF" type="search" autocomplete="off" placeholder="' + esc(t('Type to find')) + '"></label>' : '') + '<div class="ops' + (long ? ' win' : '') + '" id="pkL"' + (long ? ' tabindex="0"' : '') + '></div><button class="btn ghost" type="button" id="pkB">' + t('Back') + '</button></div>');
      var box = $('pkL');
      var more = function () { var part = shown.slice(n, n + 60); n += part.length; box.insertAdjacentHTML('beforeend', part.map(row).join('')); X.edges(); };
      var show = function (q) {
        var f = MM.nameFind(list, q, function (x) { return x[1]; }); shown = f ? f.map(function (x) { return x.item; }) : list; n = 0; box.innerHTML = ''; box.scrollTop = 0; more();
        var u = o.typed && o.typed(q);
        if (u && !list.some(function (x) { return String(x[0]) === u; })) box.insertAdjacentHTML('beforeend', row([u, u, t('As typed')]));
        if (!box.children.length) box.innerHTML = '<p class="note">' + t('Nothing begins with that.') + '</p>';
      };
      show('');
      box.addEventListener('scroll', function () { if (n < shown.length && box.scrollHeight - box.clientHeight - box.scrollTop < 300) more(); });
      if ($('pkF')) $('pkF').oninput = function () { show(this.value); };
      box.onclick = function (ev) { var b = ev.target.closest('[data-op]'); if (b) done(b.dataset.op); };
      $('pkB').onclick = back;
    }
    function agents(second) {
      return X.people().filter(function (p) { return p.role === 'sales' || (second && p.role === 'sales_manager'); }).sort(function (a, b) { return (b.active - a.active) || a.name.localeCompare(b.name); })
        .map(function (p) { return [p.id, p.name, p.active ? teamName(p.id) : t('Switched off')]; });
    }
    function unitList() { return units.map(function (x) { return [x.c, x.c, unitLine(x)]; }); }
    function typedUnit(q) { var c = String(q || '').trim().toUpperCase(); return /^[A-Z0-9][A-Z0-9./-]{1,23}$/.test(c) && /\d/.test(c) ? c : ''; }
    function planList(product) { return MM.contractPlan.list(product || undefined).map(function (p) { return [p.id, planWords(p.id, p.down, p.years)]; }); }
    function back() { entry(); }
    function field(f) {
      var d = ED.d, set = function (k) { return function (v) { d[k] = v; entry(); }; };
      if (f === 'kind') return picker(t('What was it?'), GROUP[ED.e.kind].map(function (k) { return [k, KIND[k], k === 'broadcast' ? t('To all companies') : '']; }), d.type, back, function (v) {
        d.type = v; if (v === 'broadcast') d.co = ''; if (v === 'meeting') d.who2 = '';
        if (v === 'offer' && !d.co) return field('company'); entry();
      });
      if (f === 'company') return picker(t('Company'), X.companies().filter(function (c) { return !c.merged_into && (c.active || c.pending || c.id === d.co); }).sort(function (a, b) { return a.name.localeCompare(b.name); }).map(function (c) { return [c.id, c.name, c.pending ? t('Waiting for you') : '']; }), d.co, back, function (v) { d.co = v; if (d.type === 'broadcast') d.type = 'offer'; entry(); });
      if (f === 'person') return picker(t('Sales agent'), agents(), d.who, back, set('who'));
      if (f === 'person2') return picker(fields(d.type).filter(function (x) { return x[0] === 'person2'; })[0][1], [['', t('Nobody')]].concat(agents(true).filter(function (x) { return x[0] !== d.who; })), d.who2, back, set('who2'));
      if (f === 'unit') return picker(t('Unit'), unitList(), d.unit, back, function (v) { var u = unit(v); d.unit = v; if (u && ED.isNew && !d.price) d.price = Number(u.u.listPrice || 0); entry(); }, { typed: typedUnit });
      if (f === 'plan') return picker(t('Payment plan'), planList(unit(d.unit) ? unit(d.unit).p : ED.e.product).concat([['other', t('Another plan')]]), d.plan, back, function (v) {
        if (v === 'other') return otherPlan();
        var p = MM.contractPlan.list().filter(function (x) { return x.id === v; })[0]; if (p) { d.plan = v; d.pd = p.down; d.py = p.years; } entry();
      });
      if (f === 'online') return picker(t('Where'), [['0', t('In person')], ['1', t('Online')]], d.online ? '1' : '0', back, function (v) { d.online = v === '1'; entry(); });
      if (f === 'channel') return picker(t('Sent as'), [['pdf', t('Offer PDF')], ['post', t('WhatsApp post')]], d.via, back, set('via'));
      if (f === 'why') return picker(t('Reason'), WHYC.map(function (x) { return [x, t(x)]; }), d.why, back, set('why'));
      if (f === 'units') return unitsField();
      var dateF = f === 'date' || f === 'time';
      X.showSheet('<div class="fl-top"><h3>' + (dateF ? t('Date and time') : t('Price')) + '</h3></div><div class="form">' + (dateF ? '<div class="range"><label class="fld">' + t('Date') + '<input id="fD" type="date" value="' + esc(d.date || '') + '"></label><label class="fld">' + t('Time') + '<input id="fT" type="time" value="' + (d.min == null ? '' : hm(d.min)) + '"></label></div>'
        : '<label class="fld">' + t('Price, EGP') + '<input id="fP" type="text" inputmode="numeric" autocomplete="off" value="' + (d.price ? Math.round(d.price).toLocaleString('en-US') : '') + '"></label>') +
        '<div class="fl-nav"><button class="btn ghost" type="button" id="pkB">' + t('Back') + '</button><button class="btn" type="button" id="fOk">' + t('Done') + '</button></div></div>');
      $('pkB').onclick = back;
      if ($('fP')) { $('fP').oninput = function () { var v = MM.inventory.num(this.value); this.value = v == null ? '' : Math.round(v).toLocaleString('en-US'); }; $('fP').focus({ preventScroll: true }); }
      $('fOk').onclick = function () {
        if (dateF) { var p = $('fT').value.split(':'); d.date = $('fD').value; if (p.length > 1) d.min = +p[0] * 60 + +p[1]; }
        else d.price = Math.round(MM.inventory.num($('fP').value) || 0);
        entry();
      };
    }
    function otherPlan() {
      var d = ED.d;
      X.showSheet('<div class="fl-top"><h3>' + t('Another plan') + '</h3></div><div class="form"><div class="range"><label class="fld">' + t('Down payment, %') + '<input id="oD" type="text" inputmode="decimal" autocomplete="off"></label><label class="fld">' + t('Years') + '<input id="oY" type="text" inputmode="decimal" autocomplete="off"></label></div><p class="note bad" id="aErr" hidden></p><div class="fl-nav"><button class="btn ghost" type="button" id="pkB">' + t('Back') + '</button><button class="btn" type="button" id="fOk">' + t('Done') + '</button></div></div>');
      $('pkB').onclick = function () { field('plan'); };
      $('fOk').onclick = function () {
        var p = MM.contractPlan.read('other', undefined, $('oD').value, $('oY').value);
        if (p.missing) { $('aErr').textContent = t('Type the down payment, from 0 to 100, and the years, up to 30.'); $('aErr').hidden = false; return; }
        d.plan = 'other'; d.pd = p.down; d.py = p.years; entry();
      };
    }
    function unitsField() {
      var d = ED.d, list = parts(d.key);
      var put = function () { d.key = joined(list); unitsField(); };
      var pickU = function (i, bk) { picker(t('Unit'), unitList(), list[i] && list[i].c, bk || unitsField, function (v) { if (list[i]) list[i].c = v; else list.push({ c: v, p: '' }); put(); }, { typed: typedUnit }); };
      if (!list.length) return pickU(0, back);
      X.showSheet('<div class="fl-top"><h3>' + t('Units and plans') + '</h3></div><div class="form" id="uF">' + list.map(function (x, i) {
        var u = unit(x.c);
        return '<div class="unx' + (list.length < 2 ? ' one' : '') + '"><button type="button" data-u="' + i + '"><span>' + nm(x.c) + '</span><small>' + (u ? esc(unitLine(u)) : '') + '</small></button><button type="button" data-pl="' + i + '"><span>' + (x.p ? nm(planWords(x.p)) : t('No plan')) + '</span><small>' + t('Payment plan') + '</small></button><button class="x2" type="button" data-x="' + i + '" aria-label="' + esc(t('Take {unit} out', { unit: x.c })) + '"' + (list.length < 2 ? ' hidden' : '') + '>✕</button></div>';
      }).join('') + (list.length < 8 ? '<button class="txtb n" type="button" id="uMore">' + t('Add another unit') + '</button>' : '') + '<button class="btn" type="button" id="fOk">' + t('Done') + '</button></div>');
      $('uF').onclick = function (ev) {
        var b = ev.target.closest('button'); if (!b) return;
        if (b.id === 'fOk') return entry(); if (b.id === 'uMore') return pickU(list.length);
        if (b.dataset.u) return pickU(+b.dataset.u);
        if (b.dataset.x) { list.splice(+b.dataset.x, 1); return put(); }
        var i = +b.dataset.pl, u = unit(list[i].c);
        picker(t('Payment plan'), [['', t('No plan')]].concat(planList(u && u.p)), list[i].p, unitsField, function (v) { list[i].p = v; put(); });
      };
    }
    /* what the change does to the figures, said before it is saved */
    function effect(df) {
      var e = ED.e, d = ED.d, o = [], has = function (f) { return df.some(function (x) { return x.f === f; }); }, b = function (s) { return '<b>' + nm(s) + '</b>'; }, deal = ED.mate && ED.mate.kind === 'contract' ? ED.mate : e.kind === 'contract' ? e : null, v = deal ? Number(deal.value || 0) : 0;
      if (deal && has('person')) {
        var to = deal === e ? d.price : v;
        o.push(b(pName(e.person_id)) + ' <bdi>−' + esc(egp(v)) + '</bdi>', b(pName(d.who)) + ' <bdi>+' + esc(egp(to)) + '</bdi>');
        if (teamName(e.person_id) !== teamName(d.who)) o.push(nm(teamName(e.person_id)) + ARROW + nm(teamName(d.who)));
      } else if (e.kind === 'contract' && has('price')) o.push(b(pName(d.who)) + ' <bdi>' + (d.price > v ? '+' : '−') + esc(egp(Math.abs(d.price - v))) + '</bdi>');
      else if (has('person')) o.push(b(pName(e.person_id)) + ' <bdi>−1</bdi>', b(pName(d.who)) + ' <bdi>+1</bdi>');
      if (e.kind === 'offer' && (has('company') || has('kind'))) {
        if (e.company_id) o.push(b(coName(e.company_id)) + ' <bdi>−1</bdi> ' + t('request'));
        if (d.type === 'offer' && d.co) o.push(b(coName(d.co)) + ' <bdi>+1</bdi> ' + t('request'));
        if (kindOf(e) !== d.type) o.push(t('Broadcasts') + ' <bdi>' + (d.type === 'offer' ? '−1' : '+1') + '</bdi>');
      }
      return o;
    }
    function difRows(df) { return '<div class="difs">' + df.map(function (x) { return '<div><span>' + x.n + '</span><p><s>' + nm(x.from) + '</s>' + ARROW + '<b>' + nm(x.to) + '</b></p></div>'; }).join('') + '</div>'; }
    /* t('Wrong company') t('Wrong sales agent') t('Wrong date or time') t('Wrong unit or plan') t('Wrong price') t('Recorded twice') t('It never happened') t('A test') t('Missing entry') t('Brought back') */
    var WHY = ['Wrong company', 'Wrong sales agent', 'Wrong date or time', 'Wrong unit or plan', 'Wrong price'], WHYRM = ['Recorded twice', 'It never happened', 'A test'];
    function reason(title, sub, html, list, go, bk) {
      X.showSheet('<div class="fl-top">' + steps([t('The entry'), t('Why')], 1) + '<h3>' + title + '</h3>' + (sub ? '<p class="role">' + sub + '</p>' : '') + '</div><div class="form">' + html + '<div class="ops" id="wO">' + list.map(function (w) { return '<button class="op" type="button" data-why="' + esc(w) + '">' + t(w) + '</button>'; }).join('') + '</div><label class="fld">' + t('Something else') + '<input id="wT" type="text" maxlength="200" autocomplete="off"></label><p class="note bad" id="aErr" hidden></p><div class="fl-nav"><button class="btn ghost" type="button" id="pkB">' + t('Back') + '</button><button class="btn" type="button" id="wS">' + t('Save') + '</button></div></div>');
      $('pkB').onclick = bk;
      var busy = false, run = function (w) { if (busy) return; busy = true; [].forEach.call(document.querySelectorAll('#sheet button'), function (b) { b.disabled = b.id !== 'closeSheet'; }); go(w, function (msg) { busy = false; [].forEach.call(document.querySelectorAll('#sheet button'), function (b) { b.disabled = false; }); $('aErr').textContent = msg; $('aErr').hidden = false; $('aErr').scrollIntoView({ block: 'center' }); }); };
      $('wO').onclick = function (ev) { var b = ev.target.closest('[data-why]'); if (b) run(b.dataset.why); };
      $('wS').onclick = function () { var w = $('wT').value.replace(/\s+/g, ' ').trim(); if (w.length < 3) { $('aErr').textContent = t('Tap a reason, or write one.'); $('aErr').hidden = false; return; } run(w); };
      X.edges();
    }
    function post(fn, b, ok, bad) { X.rpc(fn, b).then(function (r) { if (r.status >= 300) return bad(X.why(r)); ok(Array.isArray(r.body) ? r.body[0] : r.body); }, function () { bad(t('No connection. Try again when you are online.')); }); }
    function offerExtras(key) { var l = parts(key), u = l.length === 1 && unit(l[0].c), f = unit(l[0] && l[0].c); return { product: f ? f.p : ED.e.product || null, area: u ? u.u.area || null : null, value: u ? u.u.listPrice || null : null }; }
    function payload(df) {
      var d = ED.d, c = {}, has = function (f) { return df.some(function (x) { return x.f === f; }); };
      if (has('kind') && ED.e.kind !== 'offer') c.kind = d.type;
      if (has('company') || (has('kind') && ED.e.kind === 'offer')) c.company_id = d.type === 'broadcast' ? null : d.co;
      if (has('person')) c.person_id = d.who;
      if (has('person2') && d.type !== 'meeting') c.person2_id = d.who2 || null;
      if (has('date')) c.on_date = d.date; if (has('time')) c.at_min = d.min;
      if (has('units')) { var x = offerExtras(d.key); c.offer_key = d.key; c.product = x.product; c.area = x.area; c.value = x.value; }
      if (has('channel')) c.channel = d.via;
      if (has('unit')) { var u = unit(d.unit); c.unit_code = d.unit; c.product = u ? u.p : null; c.area = u ? u.u.area || null : null; }
      if (has('price')) c.value = d.price;
      if (has('plan')) { c.plan = d.plan; c.plan_down = d.pd; c.plan_years = d.py; }
      if (has('online') || (has('kind') && d.type === 'meeting')) c.online = d.online;
      if (has('why')) c.why = d.why;
      return c;
    }
    function whyStep() {
      var df = diffs(), fx = effect(df), both = ED.mate && df.some(function (x) { return LINKED[x.f]; });
      reason(t('Why is it changed?'), '', difRows(df) + (fx.length ? '<div class="effect">' + fx.join('<br>') + '</div>' : ''), WHY, function (w, bad) {
        var id = ED.e.id;
        post('mm_admin_edit', { p_id: id, p_changes: payload(df), p_reason: w }, function () {
          changed();
          X.showSheet('<div class="fl-top"><h3>' + t('Saved') + '</h3><p class="role">' + (both ? t('And the other half of the deal.') : '') + '</p></div><div class="form">' + difRows(df) + '<p class="note">' + t('The old value stays in the history.') + '</p><button class="btn" type="button" id="eDone">' + t('Done') + '</button><button class="txtb n" type="button" id="eAgain">' + t('Open the entry') + '</button></div>');
          $('eDone').onclick = X.closeSheet; $('eAgain').onclick = function () { open(id); };
        }, bad);
      }, back);
    }
    function removeStep() {
      var e = ED.e;
      if (e.kind === 'reservation' && e.ended) return entry(e.ended === 'contract' ? t('This reservation was signed. Remove its contract first.') : t('This reservation was cancelled. Remove the cancellation first.'));
      reason(t('Why is it removed?'), t('It can be brought back.'), '', WHYRM, function (w, bad) { post('mm_remove', { p_id: e.id, p_reason: w }, function () { X.closeSheet(); changed(); X.toast(t('Removed. It is in the history with your reason.')); }, bad); }, back);
    }
    /* ==== A MISSING ENTRY ==== */
    function add() {
      X.showSheet('<div class="fl-top">' + steps([t('What'), t('Details')], 0) + '<h3>' + t('Add a missing entry') + '</h3></div><div class="form"><div class="ops" id="aK">' + ['orientation', 'workshop', 'meeting', 'offer', 'broadcast', 'reservation', 'contract'].map(function (k) { return '<button class="op" type="button" data-k="' + k + '">' + KIND[k] + '</button>'; }).join('') + '</div></div>');
      unitsRead().then(function (u) { units = u; });
      $('aK').onclick = function (ev) {
        var b = ev.target.closest('[data-k]'); if (!b) return; var k = b.dataset.k, n = nowCairo();
        ED = { isNew: true, mate: null, ref: 'adm-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10), e: { kind: k === 'broadcast' ? 'offer' : k },
          d: { type: k, co: '', who: '', who2: '', date: n.d, min: n.m, key: '', unit: '', price: 0, plan: '', pd: null, py: null, online: false, via: /offer|broad/.test(k) ? 'pdf' : '', why: '' } };
        entry();
      };
    }
    function addIt() {
      var d = ED.d, u = unit(d.unit), x = d.key ? offerExtras(d.key) : null, btn = $('eGo');
      var p = { client_ref: ED.ref, kind: d.type === 'broadcast' ? 'offer' : d.type, company_id: d.co || null, person_id: d.who, person2_id: d.who2 || null, on_date: d.date, at_min: d.min };
      if (x) { p.offer_key = d.key; p.channel = d.via; p.product = x.product; p.area = x.area; p.value = x.value; }
      if (d.unit) { p.unit_code = d.unit; p.product = u ? u.p : null; p.area = u ? u.u.area || null : null; p.value = d.price; }
      if (d.type === 'contract') { p.plan = d.plan; p.plan_down = d.pd; p.plan_years = d.py; }
      if (d.type === 'meeting') p.online = d.online;
      btn.disabled = true;
      post('mm_admin_add', { p: p, p_reason: 'Missing entry' }, function () { X.closeSheet(); changed(); X.toast(t('Added, and counted for {name}.', { name: pName(d.who) })); }, function (msg) { btn.disabled = false; $('aErr').textContent = msg; $('aErr').hidden = false; $('aErr').scrollIntoView({ block: 'center' }); });
    }
    /* ==== A LINE THAT IS NOT AN ENTRY ANY MORE: removed, taken back; or a hand-over ==== */
    function openLine(id) {
      var h = H.rows.filter(function (x) { return String(x.id) === String(id); })[0]; if (!h) return;
      var d = h.detail || {}, by = X.person(h.by_id);
      if (h.action === 'hand_over') return open(d.id);
      var dd = draft(Object.assign({ at_min: 0 }, d));
      X.showSheet('<div class="fl-top"><h3>' + (KIND[kindOf(d)] || '') + '</h3><p class="role">' + (h.action === 'remove' ? t('Removed') : t('Taken back the same day')) + (by ? ' · ' + nm(by.name) : '') + ' · <bdi>' + esc(X.whenAt(h.at)) + '</bdi></p></div><div class="form"><div class="fxs">' +
        fields(dd.type).map(function (f) { return '<div class="fx"><span>' + f[1] + '</span><b>' + nm(val(dd, f[0])) + '</b></div>'; }).join('') + (d.reason ? '<div class="fx"><span>' + t('Reason') + '</span><b>' + nm(t(d.reason)) + '</b></div>' : '') + '</div><p class="note bad" id="aErr" hidden></p><button class="btn" type="button" id="eBack">' + t('Bring it back') + '</button></div>');
      $('eBack').onclick = function () {
        $('eBack').disabled = true;
        post('mm_admin_restore', { p_audit: h.id }, function () { X.closeSheet(); changed(); X.toast(t('It is back, and counted again.')); }, function (msg) { $('eBack').disabled = false; $('aErr').textContent = msg; $('aErr').hidden = false; });
      };
    }

    function click(ev) {
      var h = function (a) { return ev.target.closest('[' + a + ']'); }, x;
      if ((x = h('data-ent'))) { open(x.dataset.ent); return true; }
      if ((x = h('data-aud'))) { openLine(x.dataset.aud); return true; }
      if ((x = h('data-ehf'))) { H.filter = x.dataset.ehf; [].forEach.call(x.parentNode.children, function (b) { b.setAttribute('aria-pressed', String(b === x)); }); load(true).then(function () { fill(); }); fill(); return true; }
      return false;
    }
    var typing = null;
    document.addEventListener('input', function (ev) {
      if (ev.target.id !== 'hFind') return;
      H.find = ev.target.value; clearTimeout(typing);
      typing = setTimeout(function () { if (AUD[H.filter]) return fill(); load(true).then(function () { fill(); }); fill(); }, 250);
    });
    return { screen: screen, click: click, open: open, add: add, opened: function () { load(true).then(function () { fill(); }); }, reset: function () { H.started = false; H.rows = []; H.find = ''; H.filter = 'all'; }, line: line, days: days };
  };
}(window));
