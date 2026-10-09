/* ------------------------------------------------------------------
   Main Marks — the manager view's book of activity. A DEMO BOOK.

   WHAT IS REAL: the manager and his team (js/config.js `salesTeam`, from
   Main Marks' own sales structure), the brokerage companies (the list
   "Who is this offer for?" already uses), and every unit, size and price
   in a reservation or contract (a real available row of the inventory,
   at that row's own live price).

   WHAT IS INVENTED: that any of it happened. The app does not save a
   send yet, and nobody records a meeting anywhere, so the requests,
   broadcasts, meetings, reservations, contracts and cancellations are
   drawn from a fixed seed. The page says "demo figures" on every screen
   and DEMO on every download.

   THE SHAPE IS THE CONTRACT. One row of activity is one event:
     { id, k, c, m, m2, d, t, p, ch, u, area, v, why, end, endD, of }
     k    'offer' | 'meeting' | 'reservation' | 'contract' | 'cancel' | 'orientation' | 'workshop'
     c    company (index into `companies`); null on an offer = a broadcast
     m    salesperson (index into `team`); m2 = the one the deal is split with
     d    days ago; t = minute of that day
     p    unit type; ch = 'post' | 'pdf' (how an offer was sent)
     u    unit code; area in m2; v = price in EGP
     why  a cancellation's reason; of = the reservation it cancels, or, on a
          contract entered from a reservation, the reservation it closes
     made on an entry recorded on this phone: the day it was entered
     end  on a reservation: 'contract' | 'cancel' (never deleted, only marked)
   When the real store exists it hands js/manager.js this same object and
   nothing on the page changes.

   A MANAGER SEES HIS OWN TEAM ONLY (Muhanad, 2026-10-05). Main Marks is an
   open race: every company is open to every salesperson. This book holds
   one team's rows and nothing else, so the page cannot show another
   team's activity with a company, not even a count.

   WHEN. Everything is "days ago" from the real today, so the demo never
   goes stale. Friday is the day off: a row that lands on one moves to the
   Thursday before. Before 13:30 the demo clock reads 13:30, so the Today
   screen is not empty when the page is opened early in the morning.
   ------------------------------------------------------------------ */
(function (root) {
  'use strict';

  var MM = root.MM || (root.MM = {});
  var SPAN = 83;                                   /* the book goes back 12 weeks */
  var KEY = 'mm.manager.records.v1';               /* what was recorded on this phone */
  var WHY = ['Client withdrew', 'Payment not made', 'Moved to another unit', 'Other'];
  var PRODUCTS = ['Commercial', 'Offices', 'The Fourth', 'Clinics', 'Serviced apartments'];

  /* the sheet's Type and Floor -> the product a salesperson would name */
  function productOf(u) {
    var type = String(u.type || '').toLowerCase(), floor = String(u.floor || '').toLowerCase();
    if (type === 'clinic') return 'Clinics';
    if (type === 'commercial') return 'Commercial';
    if (type === 'admin') return floor.indexOf('fourth') !== -1 ? 'The Fourth' : 'Offices';
    return 'Serviced apartments';
  }

  function moray() {
    var list = (typeof CONFIG !== 'undefined' && CONFIG.projects) || [];
    for (var i = 0; i < list.length; i++) if (list[i].id === 'moray') return list[i];
    return null;
  }

  function build(inv) {
    var P = moray(), T = CONFIG.salesTeam;
    var companies = (P.brokerages || []).slice();
    var team = T.members.slice();
    var today = new Date(); today.setHours(0, 0, 0, 0);
    var clock = new Date();
    var now = Math.max(clock.getHours() * 60 + clock.getMinutes(), 13 * 60 + 30);

    function dateOf(ago) { var d = new Date(today); d.setDate(d.getDate() - ago); return d; }
    function agoOf(date) { return Math.round((today - new Date(date.getFullYear(), date.getMonth(), date.getDate())) / 864e5); }

    /* the units a deal can sit on: available rows only, in a fixed order */
    var pool = {}, byCode = {}, free = {};
    inv.all.forEach(function (u) { byCode[String(u.code).toUpperCase()] = u; });
    inv.units.forEach(function (u) { free[String(u.code).toUpperCase()] = true; });
    inv.units.slice().sort(function (a, b) { return a.code < b.code ? -1 : a.code > b.code ? 1 : 0; }).forEach(function (u) {
      var p = productOf(u);
      (pool[p] || (pool[p] = [])).push(u);
    });
    var sold = PRODUCTS.filter(function (p) { return pool[p] && pool[p].length; });
    if (!sold.length || !companies.length || !team.length) throw new Error('Nothing to build the book from.');

    var seed = 20261005;
    function rnd() { seed |= 0; seed = seed + 0x6D2B79F5 | 0; var t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }
    function ri(a, b) { return a + Math.floor(rnd() * (b - a + 1)); }
    function minute() { return ri(9 * 60, 20 * 60); }

    var events = [], n = 0, taken = {};
    function push(e) { e.id = 'g' + (n++); events.push(e); return e; }
    function deal(k, ci, m, d, p) {
      var list = pool[p] || pool[sold[0]], at = ri(0, list.length - 1), u = list[at], tries = 0;
      while (taken[u.code] && tries++ < list.length) u = list[(at + tries) % list.length];
      taken[u.code] = true;
      var e = { k: k, c: ci, m: m, d: d, t: minute(), p: productOf(u), u: u.code, area: u.area, v: u.listPrice || u.finalPrice };
      if (rnd() < .22) { var o = ri(0, team.length - 1); if (o !== m) e.m2 = o; }
      return push(e);
    }
    /* A RESERVATION CAN BE CANCELLED (Muhanad, 2026-10-06). The cancellation is its own row with its own
       date and reason; the reservation is kept and marked, never deleted, so the history stays true. */
    function cancelRow(rs, d, why, t) {
      rs.end = 'cancel'; rs.endD = d;
      return { k: 'cancel', of: rs.id, c: rs.c, m: rs.m, m2: rs.m2, d: d, t: t, p: rs.p, u: rs.u, area: rs.area, v: rs.v, why: why };
    }

    companies.forEach(function (name, ci) {
      var p = rnd(), w = [], i, k;
      for (i = 0; i < 12; i++) w.push(0);
      if (p < .30) { for (i = 0; i < 12; i++) w[i] = rnd() < .72 ? ri(1, 4) : 0; w[10 + ri(0, 1)] = ri(1, 4); }                          /* steady */
      else if (p < .44) { for (i = 7; i < 12; i++) w[i] = rnd() < .7 ? ri(1, 4) : 0; w[10 + ri(0, 1)] = ri(1, 3); }                      /* started asking this month */
      else if (p < .55) { for (i = 0; i < 9; i++) w[i] = rnd() < .75 ? ri(1, 4) : 0; w[8 + ri(0, 1)] = ri(1, 3); w[10] = 0; w[11] = 0; } /* gone quiet */
      else if (p < .76) { for (i = 0; i < 6; i++) w[i] = rnd() < .5 ? ri(1, 3) : 0; w[ri(0, 5)] = ri(1, 3); }                            /* inactive */
      var total = w.reduce(function (a, b) { return a + b; }, 0), last4 = w[8] + w[9] + w[10] + w[11], last2 = w[10] + w[11];
      var shape = !total ? 'never' : !last4 ? 'inactive' : !last2 ? 'quiet' : 'active';
      var members = [], count = total ? ri(1, 3) : 0;
      for (k = 0; k < count; k++) { var m = ri(0, team.length - 1); if (members.indexOf(m) === -1) members.push(m); }
      var prods = []; for (k = 0; k < ri(1, 2); k++) { var pr = sold[ri(0, sold.length - 1)]; if (prods.indexOf(pr) === -1) prods.push(pr); }
      var mine = [];
      w.forEach(function (cnt, wi) {
        for (k = 0; k < cnt; k++) {
          var d = (11 - wi) * 7 + ri(0, 6);
          mine.push(push({ k: 'offer', c: ci, m: members[rnd() < .6 ? 0 : ri(0, members.length - 1)], d: d, t: minute(), p: prods[ri(0, prods.length - 1)], ch: rnd() < .55 ? 'post' : 'pdf' }));
        }
      });
      var meets = (shape === 'active' && rnd() < .5) ? ri(1, 3) : (shape === 'quiet' && rnd() < .25 ? 1 : (shape === 'inactive' && rnd() < .12 ? 1 : 0));
      for (k = 0; k < meets && mine.length; k++) {
        var src = mine[ri(0, mine.length - 1)], md = Math.max(0, src.d - ri(1, 5));
        push({ k: 'meeting', c: ci, m: src.m, d: md, t: minute(), p: src.p });
        if (rnd() < .62) {
          var rd = Math.max(0, md - ri(1, 6)), rs = deal('reservation', ci, src.m, rd, src.p), fate = rnd();
          if (fate < .4 && rd > 1) { var ct = deal('contract', ci, src.m, Math.max(0, rd - ri(2, 9)), src.p); ct.p = rs.p; ct.u = rs.u; ct.area = rs.area; ct.v = rs.v; ct.m2 = rs.m2; rs.end = 'contract'; }
          else if (fate < .68 && rd > 1) push(cancelRow(rs, Math.max(0, rd - ri(1, 8)), WHY[ri(0, WHY.length - 2)], minute()));
        }
      }
    });
    /* general broadcasts: an offer sent to nobody in particular */
    var HABIT = [.45, .3, .25, .55, .2, .3, .35];
    team.forEach(function (tm, m) {
      for (var d = 0; d <= SPAN; d++) if (rnd() < HABIT[m % HABIT.length]) for (var k = ri(1, 2); k > 0; k--) push({ k: 'offer', c: null, m: m, d: d, t: minute(), p: sold[ri(0, sold.length - 1)], ch: 'post' });
    });
    /* so the demo always shows the case: two of this month's open reservations are cancelled */
    events.filter(function (e) { return e.k === 'reservation' && !e.end && e.d > 3 && e.d < 27; }).slice(0, 2).forEach(function (rs, i) { push(cancelRow(rs, rs.d - 2 - i, WHY[i], minute())); });

    /* ORIENTATIONS AND WORKSHOPS (Muhanad, 2026-10-06). How a salesperson works a brokerage: an
       orientation at its office to present the project, offers in its WhatsApp group after that, and a
       workshop there when it sends many requests and brings no meeting. Each is its own row:
       { k: 'orientation' | 'workshop', c, m, m2 (who also went), d, t }.
       Drawn from a SECOND seed, after everything above, so not one earlier figure moves. The demo holds
       every case on purpose: a visit that was followed by a first request, by a company coming back, by
       a first meeting, and visits that were followed by nothing. */
    var seed2 = 20261006;
    function rnd2() { seed2 |= 0; seed2 = seed2 + 0x6D2B79F5 | 0; var t = Math.imul(seed2 ^ seed2 >>> 15, 1 | seed2); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }
    function ri2(a, b) { return a + Math.floor(rnd2() * (b - a + 1)); }
    function visit(k, ci, m, d) { push({ k: k, c: ci, m: m, d: Math.max(0, Math.min(SPAN, d)), t: ri2(10 * 60, 17 * 60) }); }
    companies.forEach(function (name, ci) {
      var oldest = function (a, b) { return b.d - a.d; };
      var asks = events.filter(function (e) { return e.c === ci && e.k === 'offer'; }).sort(oldest);
      var meets = events.filter(function (e) { return e.c === ci && e.k === 'meeting'; }).sort(oldest);
      var i, lately = asks.filter(function (e) { return e.d < 30; }).length;
      if (!asks.length) { if (rnd2() < .22) visit('orientation', ci, ri2(0, team.length - 1), ri2(3, 40)); return; }
      if (asks[0].d < 70 && rnd2() < .75) visit('orientation', ci, asks[0].m, asks[0].d + ri2(2, 6));                  /* then it started asking */
      for (i = 1; i < asks.length; i++) if (asks[i - 1].d - asks[i].d >= 21 && rnd2() < .6) visit('orientation', ci, asks[i].m, asks[i].d + ri2(1, 4));   /* then it came back */
      if (meets.length) { if (asks.filter(function (e) { return e.d > meets[0].d; }).length >= 5 && rnd2() < .6) visit('workshop', ci, meets[0].m, meets[0].d + ri2(3, 8)); }   /* then its first meeting */
      else if (lately >= 6 && rnd2() < .25) visit('workshop', ci, asks[asks.length - 1].m, ri2(2, 12));               /* and no meeting yet */
    });

    /* Friday is the day off: nothing is sent or signed on one */
    events.forEach(function (e) { if (dateOf(e.d).getDay() === 5) e.d = e.d < SPAN ? e.d + 1 : e.d - 1; });
    events.forEach(function (e) { if (e.k === 'reservation' && e.end === 'cancel') { var c = events.filter(function (x) { return x.of === e.id; })[0]; if (c) { c.d = Math.min(c.d, e.d); e.endD = c.d; } } });
    /* today's later hours have not happened yet; and one salesperson has sent nothing today, so the page shows that case */
    var idle = Math.min(4, team.length - 1);
    events = events.filter(function (e) { return !(e.d === 0 && e.t > now) && !(e.m === idle && e.d === 0 && e.k === 'offer'); });
    /* a reservation whose contract or cancellation falls later today has not ended yet: it is still open */
    events.forEach(function (e) {
      if (e.k !== 'reservation' || !e.end) return;
      var ended = events.some(function (x) { return e.end === 'cancel' ? x.of === e.id : (x.k === 'contract' && x.c === e.c && x.u === e.u); });
      if (!ended) { delete e.end; delete e.endD; }
    });

    /* ---- what was recorded on this phone, kept across visits -------- */
    var book;
    function iso(d) { return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
    function fromIso(s) { var p = String(s).split('-'); return p.length === 3 ? new Date(+p[0], +p[1] - 1, +p[2]) : null; }
    function readStore() { try { var a = JSON.parse(root.localStorage.getItem(KEY) || '[]'); return Array.isArray(a) ? a : []; } catch (e) { return []; } }
    function writeStore(a) { try { root.localStorage.setItem(KEY, JSON.stringify(a)); } catch (e) { /* this visit only */ } }
    var stored = readStore();
    function codeAt(code) { for (var i = 0; i < team.length; i++) if (team[i].code === code) return i; return -1; }
    function apply(r) {
      var date = fromIso(r.date); if (!date) return null;
      var d = Math.max(0, Math.min(SPAN, agoOf(date)));
      if (r.k === 'cancel') {
        var rs = events.filter(function (e) { return e.id === r.of && e.k === 'reservation' && !e.end; })[0];
        if (!rs) return null;
        var ce = cancelRow(rs, Math.min(d, rs.d), r.why, r.t); ce.id = r.id; ce.mine = true; rs.endD = ce.d;
        events.push(ce); return ce;
      }
      var c = companies.indexOf(r.c), m = codeAt(r.m);
      if (c === -1 || m === -1) return null;
      var e = { id: r.id, mine: true, k: r.k, c: c, m: m, d: d, t: r.t, p: r.p };
      var m2 = codeAt(r.m2);
      if (r.made) e.made = r.made;                                       /* the day it was entered, which is not always its date */
      if (r.k === 'reservation' || r.k === 'contract') { e.u = r.u; e.area = r.area || null; e.v = r.v; }
      if (r.k !== 'meeting' && m2 !== -1 && m2 !== m) e.m2 = m2;       /* a deal split with, or a visit made with */
      /* build 121: a contract entered FROM a reservation closes it; the reservation is kept, marked */
      if (r.k === 'contract' && r.of) {
        var from = events.filter(function (x) { return x.id === r.of && x.k === 'reservation' && !x.end; })[0];
        if (from) { from.end = 'contract'; e.of = from.id; }
      }
      events.push(e); return e;
    }
    /* TAKING AN ENTRY BACK (build 121). Only what was entered on this phone, and only on the day it was
       entered: after that the record stands, and correcting it is the manager's. A reservation that has
       since been signed or cancelled is not taken back from under what followed it. */
    function removable(e) { return !!(e && e.mine && e.made === iso(today) && !(e.k === 'reservation' && e.end)); }
    function remove(id) {
      var e = events.filter(function (x) { return x.id === id; })[0];
      if (!removable(e)) return false;
      if (e.k === 'contract' && e.of) events.forEach(function (x) { if (x.id === e.of) { delete x.end; delete x.endD; } });
      events.splice(events.indexOf(e), 1);
      stored = stored.filter(function (r) { return r.id !== id; });
      writeStore(stored);
      return true;
    }
    stored.forEach(apply);

    var kept = 0;                                    /* never the list's length: an entry can be taken back, and an id must not come round again */
    function keep(r) { r.id = 'r' + Date.now() + '-' + (kept++); var e = apply(r); if (e) { stored.push(r); writeStore(stored); } return e; }
    book = {
      demo: true, span: SPAN, today: today, now: now,
      manager: T.manager, team: team, companies: companies, products: PRODUCTS, why: WHY,
      events: function () { return events; },
      dateOf: dateOf, agoOf: agoOf, iso: iso, fromIso: fromIso,
      unit: function (code) { return byCode[String(code || '').trim().toUpperCase()] || null; },
      /* is this unit for sale today? a code the sheet does not hold is not (fail closed) */
      available: function (code) { return !!free[String(code || '').trim().toUpperCase()]; },
      productOf: productOf,
      recorded: function () { return stored.length; },
      /* r: { k, c: company index, m: salesperson index, m2, date: Date, p, u, v } */
      add: function (r) {
        var u = r.u ? book.unit(r.u) : null, d = agoOf(r.date);
        return keep({ k: r.k, c: companies[r.c], m: team[r.m].code, m2: r.m2 == null ? null : team[r.m2].code, date: iso(r.date), t: d === 0 ? now : 12 * 60,
          p: u ? productOf(u) : r.p, u: r.u || null, area: u ? u.area : null, v: r.v || 0, of: r.of || null, made: iso(today) });
      },
      remove: remove, removable: removable,
      cancel: function (id, date, why) { return keep({ k: 'cancel', of: id, date: iso(date), t: agoOf(date) === 0 ? now : 12 * 60, why: why }); },
      reset: function () { try { root.localStorage.removeItem(KEY); } catch (e) { /* nothing to clear */ } }
    };
    return book;
  }

  /* ---- THE REAL STORE (build 127) ---------------------------------------------------------------
     The same book, read from the database instead of drawn from a seed. Nothing here is invented:
     a person who has done nothing yet has a page of zeros.

     WHAT A PERSON IS HANDED is the database's decision, not this file's (sql/02_functions.sql,
     mm_can_see): a sales agent gets the rows that carry his name and nothing else. So `events()` is
     his own rows, plus, for "what followed my visit", the day and kind of his team's requests and
     meetings at the companies he visited (mm_team_followups: no name, no unit, no price). Those
     carry m = -1, so no figure of his counts them.

     WRITING goes through the database's own functions, which refuse what must be refused; `add` and
     `remove` therefore answer with a PROMISE here, and reject with the store's code (MM_...) or
     'offline'. The page has the words. */
  function buildStore(inv, got, session) {
    var today = new Date(); today.setHours(0, 0, 0, 0);
    var clock = new Date(), now = clock.getHours() * 60 + clock.getMinutes();
    function dateOf(ago) { var d = new Date(today); d.setDate(d.getDate() - ago); return d; }
    function agoOf(date) { return Math.round((today - new Date(date.getFullYear(), date.getMonth(), date.getDate())) / 864e5); }
    function iso(d) { return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
    function fromIso(s) { var p = String(s).split('-'); return p.length === 3 ? new Date(+p[0], +p[1] - 1, +p[2]) : null; }

    var byCode = {}, free = {};
    inv.all.forEach(function (u) { byCode[String(u.code).toUpperCase()] = u; });
    inv.units.forEach(function (u) { free[String(u.code).toUpperCase()] = true; });

    var people = {}, me = null;
    got.people.forEach(function (p) { people[p.id] = p; if (p.id === session.id) me = p; });
    if (!me) throw new Error('This account is not in the store.');
    var card = function (p) { return { id: p.id, name: p.name, title: p.title || '', code: p.staff_code || '' }; };
    /* the people he can name on an entry ("also went", "split the deal with"): the sales agents of his
       own team first (`own` of them, himself among them), then the sales agents of the other teams,
       because a deal can be shared across teams and then shows to both managers. After `mates` comes
       anyone else a row of his names (a colleague since switched off). */
    var byName = function (a, b) { return a.name.localeCompare(b.name); };
    var team = got.people.filter(function (p) { return p.id === me.id || (me.team_id && p.team_id === me.team_id && p.role === 'sales' && p.active); }).sort(byName).map(card);
    var own = team.length;
    team = team.concat(got.people.filter(function (p) { return p.id !== me.id && p.role === 'sales' && p.active && p.team_id && p.team_id !== me.team_id; }).sort(byName).map(card));
    var mates = team.length, at = {};
    team.forEach(function (p, i) { at[p.id] = i; });
    function place(id) {
      if (!id) return undefined;
      if (at[id] === undefined) { at[id] = team.length; team.push(people[id] ? card(people[id]) : { id: id, name: '—', title: '', code: '' }); }
      return at[id];
    }
    var mine = (got.teams || []).filter(function (x) { return x.id === me.team_id; })[0];
    var boss = mine && mine.manager_id && people[mine.manager_id];
    var manager = boss ? { name: boss.name, title: boss.title || 'Sales Manager', code: boss.staff_code || '' } : null;

    /* every company a row can stand on: listed, switched off, or waiting for the admin. A spelling the
       admin moved onto another company holds no rows, and is left out. */
    var companies = [], ids = [], open = [], waits = [], cAt = {};
    got.companies.filter(function (c) { return !c.merged_into; }).forEach(function (c, i) { companies.push(c.name); ids.push(c.id); open.push(!!c.active); waits.push(!!c.pending); cAt[c.id] = i; });

    /* A moment the store gives (with its time zone) as the day and minute IN CAIRO, which is how every
       row's own day and minute are kept. Nothing when the browser cannot say: the page then leaves the
       time out, never shows a wrong one. */
    function cairo(stamp) {
      try {
        var at = new Date(stamp);
        if (isNaN(at)) return null;
        var p = {};
        new Intl.DateTimeFormat('en-GB', { timeZone: 'Africa/Cairo', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
          .formatToParts(at).forEach(function (x) { p[x.type] = x.value; });
        var h = Number(p.hour) % 24, m = Number(p.minute);
        if (!p.year || isNaN(h) || isNaN(m)) return null;
        return { day: p.year + '-' + p.month + '-' + p.day, min: h * 60 + m };
      } catch (x) { return null; }
    }
    function row(r) {
      var d = fromIso(r.on_date), e;
      if (!d || (r.company_id && cAt[r.company_id] === undefined)) return null;
      e = { id: r.id, k: r.kind, c: r.company_id ? cAt[r.company_id] : null, m: place(r.person_id), d: Math.max(0, Math.min(SPAN, agoOf(d))), t: r.at_min || 0, p: r.product || null };
      if (r.person2_id) e.m2 = place(r.person2_id);
      if (r.channel) e.ch = r.channel;
      /* build 129: a general broadcast is ONE row however many times it was sent; `n` is how many.
         build 134: so is a special request sent again within ten minutes, and the row says HOW its sends
         went (Muhanad: "showing one pdf one post and the time"):
           np, nq  how many went as an offer PDF, how many as a WhatsApp post; left out when the store does
                   not know (a row sent more than once before the store kept it)
           lc, lt  how it LAST went, and the minute of that day; `ch` and `t` are how and when it FIRST went */
      if (r.kind === 'offer' && Number(r.rounds) >= 1) {
        e.n = Number(r.rounds);
        if (e.n === 1 && r.channel) { e.np = r.channel === 'pdf' ? 1 : 0; e.nq = r.channel === 'post' ? 1 : 0; }
        else if (typeof r.sent_pdf === 'number' && typeof r.sent_post === 'number' && r.sent_pdf + r.sent_post === e.n) { e.np = r.sent_pdf; e.nq = r.sent_post; }
        if (e.n > 1 && r.last_channel) e.lc = r.last_channel;
        if (e.n > 1 && r.last_sent) { var last = cairo(r.last_sent); if (last && last.day === r.on_date) e.lt = last.min; }
      }
      if (r.unit_code) { e.u = r.unit_code; e.area = r.area === null ? null : Number(r.area); }
      if (r.value !== null && r.value !== undefined) e.v = Number(r.value);
      if (r.why) e.why = r.why;
      if (r.of_id) e.of = r.of_id;
      if (r.ended) { e.end = r.ended; if (r.ended_on && fromIso(r.ended_on)) e.endD = Math.max(0, agoOf(fromIso(r.ended_on))); }
      e.made = r.made_on;
      e.mine = r.created_by === me.id;
      return e;
    }
    var events = got.events.map(row).filter(Boolean);
    var follow = (got.follow || []).map(function (f, i) {
      var d = fromIso(f.on_date);
      return d && cAt[f.company_id] !== undefined ? { id: 'f' + i, k: f.kind, c: cAt[f.company_id], m: -1, d: Math.max(0, agoOf(d)), t: 0 } : null;
    }).filter(Boolean);

    function refusal(x) { var m = /MM_[A-Z_]+/.exec(String((x && x.body && x.body.message) || '')); return new Error(m ? m[0] : 'MM_FAILED'); }
    function rpc(fn, body) {
      return MM.auth.call('/rest/v1/rpc/' + fn, { method: 'POST', body: body }).then(function (x) {
        if (x.status !== 200) throw refusal(x);
        return x.body;
      }, function (e) { throw new Error(e && e.message === 'out' ? 'MM_NOT_SIGNED_IN' : 'offline'); });
    }
    function removable(e) { return !!(e && e.mine && e.k !== 'offer' && e.made === iso(today) && !(e.k === 'reservation' && e.end)); }

    return {
      demo: false, live: true, span: SPAN, today: today, now: now,
      me: at[me.id], mates: mates, own: own,
      manager: manager, team: team, companies: companies, products: PRODUCTS, why: WHY,
      events: function () { return events.concat(follow); },
      dateOf: dateOf, agoOf: agoOf, iso: iso, fromIso: fromIso,
      unit: function (code) { return byCode[String(code || '').trim().toUpperCase()] || null; },
      available: function (code) { return !!free[String(code || '').trim().toUpperCase()]; },
      /* a company the admin switched off keeps its history and is not offered for a new entry */
      pickable: function (i) { return !!open[i]; },
      /* proposed by an agent, not yet ruled on by the admin */
      waiting: function (i) { return !!waits[i]; },
      productOf: productOf,
      recorded: function () { return 0; },
      add: function (r) {
        var u = r.u ? byCode[String(r.u).toUpperCase()] : null;
        return rpc('mm_record', {
          p_kind: r.k, p_company: ids[r.c] || null, p_date: iso(r.date),
          p_product: u ? productOf(u) : (r.p || null), p_unit: r.u || null, p_area: u ? u.area : null, p_value: r.v || null,
          p_with: r.m2 === undefined || r.m2 === null || !team[r.m2] ? null : team[r.m2].id,
          p_of: r.of || null, p_for: null,
          p_client_ref: 'r-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 12)
        }).then(function (saved) {
          var e = row(saved);
          if (!e) throw new Error('MM_FAILED');
          events.push(e);
          if (e.k === 'contract' && e.of) events.forEach(function (x) { if (x.id === e.of) { x.end = 'contract'; x.endD = e.d; } });
          return e;
        });
      },
      remove: function (id) {
        var e = events.filter(function (x) { return x.id === id; })[0];
        if (!removable(e)) return Promise.reject(new Error('MM_TOO_LATE'));
        return rpc('mm_take_back', { p_id: id }).then(function () {
          if (e.of) events.forEach(function (x) { if (x.id === e.of) { delete x.end; delete x.endD; } });
          events.splice(events.indexOf(e), 1);
          return true;
        });
      },
      removable: removable,
      cancel: function () { return Promise.reject(new Error('MM_NOT_ALLOWED')); },
      reset: function () { /* nothing is kept on the phone */ }
    };
  }

  function loadStore() {
    var P = moray(), s = MM.auth.current();
    if (!P || !P.inventory || !s) return Promise.reject(new Error('My activity is not set up.'));
    var from = new Date(); from.setHours(0, 0, 0, 0); from.setDate(from.getDate() - SPAN);
    var since = from.getFullYear() + '-' + String(from.getMonth() + 1).padStart(2, '0') + '-' + String(from.getDate()).padStart(2, '0');
    var get = function (path, o) {
      return MM.auth.call(path, o).then(function (x) {
        if (x.status !== 200 || !Array.isArray(x.body)) throw new Error('The store did not answer.');
        return x.body;
      });
    };
    return Promise.all([
      MM.inventory.load(P.inventory),
      get('/rest/v1/mm_people?select=id,name,title,staff_code,role,team_id,active'),
      get('/rest/v1/mm_teams?select=id,name,manager_id'),
      get('/rest/v1/mm_companies?select=id,name,active,pending,merged_into&order=name'),
      get('/rest/v1/mm_events?select=*&on_date=gte.' + since + '&order=on_date.asc,at_min.asc&limit=20000'),
      s.role === 'sales' ? get('/rest/v1/rpc/mm_team_followups', { method: 'POST', body: {} }) : Promise.resolve([])
    ]).then(function (a) {
      var make = function () { return buildStore(a[0], { people: a[1], teams: a[2], companies: a[3], events: a[4], follow: a[5] }, s); };
      /* build 132: making the book out of the answers is real work, and on My activity they can arrive
         while the pulse is drawing its lines. Then it waits for the lines to rest (MM.entry.calm, js/manager.js). */
      var e = MM.entry;
      if (!e || !e.calm) return make();
      return new Promise(function (ok, no) { e.calm(function () { try { ok(make()); } catch (x) { no(x); } }); });
    });
  }

  /* Resolves to the book; rejects when the inventory cannot be read, because a
     deal with an invented unit and price is worse than no page. */
  function load() {
    if (MM.auth && MM.auth.real && MM.auth.real()) return loadStore();
    var P = moray();
    if (!P || !P.inventory || !CONFIG.salesTeam) return Promise.reject(new Error('The manager view is not set up.'));
    return MM.inventory.load(P.inventory).then(build);
  }

  MM.managerBook = { load: load };
}(typeof window !== 'undefined' ? window : globalThis));
