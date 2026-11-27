/* ------------------------------------------------------------------
   Main Marks — the payment plans the admin keeps (build 154).

   WHY. The plans were lines of js/config.js, so a new offer from Main
   Marks meant a change of code and a publish. Muhanad, 2026-11-05: "the
   admin can change the payment plans in the app as they might have new
   payment or offers in the future".

   HIS ANSWERS (2026-11-05, by button):
     1. A plan's NUMBERS NEVER CHANGE once it is saved. Other numbers are a
        new plan ("Copy into a new plan"), and the old one is ended. An
        ended plan stays on the list: a contract signed later on a
        reservation made during it still finds it, and a saved contract or
        offer still reads by its id. Its dates and the unit types it is
        for may change: neither changes a figure of a schedule.
     2. Maintenance and delivery are set per project, here too.
     3. Tried on a demo link first. In the demo the list lives in this
        browser (and, where a browser keeps nothing, in the demo's phone
        frame for the visit), and nothing is saved anywhere else.

   HOW THE APP SEES IT. This file runs straight after config.js on every
   page and puts the saved list in place of config's. Every reader (the
   unit card, Find a unit, the offer PDF, the WhatsApp post, the contract
   form, the manager's reports) reads CONFIG, so the next offer made uses
   it. A PDF already sent is a file: it keeps the plan it was made on.

   THE NAME IS MADE FROM THE NUMBERS ("10% down · 7 years · 5% off"),
   never typed: it is then right in both languages (MM.tx.plan reads that
   pattern into Arabic) and it can never say something the numbers do not.

   WHAT THE ADMIN CANNOT SET, ON PURPOSE. The instalments fall every 3
   months and a split down payment's second part 3 months after the
   first: the PDF, the post and the unit card say so in words, and every
   Main Marks plan is paid that way. js/plans.js offers no plan paid
   otherwise (fail closed). Another rhythm is an upgrade of its own.

   ON THE REAL APP (the store) this file does nothing yet: the plans stay
   config's until the database holds them, which is a paste of its own.
   ------------------------------------------------------------------ */
(function (root) {
  'use strict';
  if (typeof CONFIG === 'undefined') return;
  var MM = root.MM || (root.MM = {});
  var KEY = 'mm.planbook.v1';

  /* the store's own test (js/auth.js real()), here because this runs before auth.js */
  function onStore() {
    var s = CONFIG.store, f = '';
    if (!s || !s.url || !s.key || typeof root.location === 'undefined') return false;
    try { f = root.localStorage.getItem('mm.store') || ''; } catch (e) { f = ''; }
    return f !== 'demo';
  }
  var DEMO = !onStore();
  /* build 212: on the store, the list as saved (mm_plan_book) and its version; nothing saved yet: null */
  var live = { version: 0, book: null };

  /* the projects whose plans are real (h:rs carries placeholder plans and is out of scope) */
  function projects() { return (CONFIG.projects || []).filter(function (p) { return p.plans && p.plans.length && !p.plansDemo; }); }
  function project(pid) { return projects().filter(function (p) { return p.id === pid; })[0] || null; }

  /* THE SEED: config's own list, as this build wrote it. A list saved on a phone is dropped when this
     changes, so a publish that changes config's plans is never hidden behind an older list. */
  var ORIGINAL = {};
  projects().forEach(function (p) {
    ORIGINAL[p.id] = JSON.parse(JSON.stringify({ plans: p.plans, deliveryMonths: p.terms.deliveryMonths, maintenance: p.terms.maintenance }));
  });
  var SEED = (function (s) { var h = 0, i; for (i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return 'b' + (h >>> 0).toString(36); }(JSON.stringify(ORIGINAL)));

  /* where the list is kept: this browser; and the demo's phone frame (a window above this one, on the
     same address) for a browser that keeps nothing, so a list saved on the admin's page is still there
     when the sales agent's page opens in the same frame */
  function frame() {
    var w = root, top = root;
    try { while (w.parent && w.parent !== w) { void w.parent.document; w = w.parent; top = w; } } catch (e) { /* another address above: stop */ }
    return top;
  }
  function read() {
    var raw = null, s = null;
    try { raw = root.localStorage.getItem(KEY); } catch (e) { raw = null; }
    if (raw == null) { try { raw = frame().__mmPlanBook || null; } catch (e) { raw = null; } }
    try { s = raw ? JSON.parse(raw) : null; } catch (e) { s = null; }
    return s && s.seed === SEED && s.projects ? s : null;
  }
  function write(s) {
    var raw = JSON.stringify(s);
    try { root.localStorage.setItem(KEY, raw); } catch (e) { /* private mode: the frame keeps it for the visit */ }
    try { frame().__mmPlanBook = raw; } catch (e) { /* nothing above */ }
  }

  /* ---- the name, from the numbers ----------------------------------- */
  function pc(f) { return String(Math.round(f * 10000) / 100); }
  function second(pl) { return (pl.milestones || []).filter(function (m) { return m.down; })[0] || null; }
  function labelOf(pl) {
    var parts = [], s2 = second(pl);
    if (pl.cash) parts.push('Spot cash');
    else {
      parts.push(s2 ? pc(pl.down) + '% + ' + pc(s2.pct) + '% down' : pc(pl.down) + '% down');
      parts.push(pl.years + (pl.years === 1 ? ' year' : ' years'));
    }
    if (pl.discount) parts.push(pc(pl.discount) + '% off');
    return parts.join(' · ');
  }

  /* ---- dates (the phone's own day, as js/plans.js reads `until`) ---- */
  function iso(d) { return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); }
  function today() { return iso(new Date()); }
  function dayBefore(s) { var d = new Date(s + 'T12:00:00'); d.setDate(d.getDate() - 1); return iso(d); }
  function isDay(s) { return /^\d{4}-\d{2}-\d{2}$/.test(s || '') && !isNaN(new Date(s + 'T12:00:00')); }
  /* 'on' offered today · 'soon' starts later · 'ended' */
  function stateOf(pl, day) {
    day = day || today();
    if (pl.until && pl.until < day) return 'ended';
    if (pl.from && pl.from > day) return 'soon';
    return 'on';
  }

  /* ---- the state ----------------------------------------------------- */
  function current() {
    if (!DEMO && live.book) return { seed: SEED, projects: JSON.parse(JSON.stringify(live.book.projects)), log: [] };
    var s = DEMO ? read() : null;
    if (s) return s;
    s = { seed: SEED, projects: {}, log: [] };
    projects().forEach(function (p) {
      var o = ORIGINAL[p.id];
      s.projects[p.id] = { plans: JSON.parse(JSON.stringify(o.plans)), terms: { deliveryMonths: o.deliveryMonths, maintenance: o.maintenance ? { pct: o.maintenance.pct, dueMonthsBeforeDelivery: o.maintenance.dueMonthsBeforeDelivery } : null } };
    });
    return s;
  }
  function apply(s) {
    if (!s) return;
    projects().forEach(function (p) {
      var mine = s.projects[p.id];
      if (!mine || !mine.plans) return;
      p.plans = mine.plans;
      if (mine.terms) {
        p.terms.deliveryMonths = mine.terms.deliveryMonths;
        if (mine.terms.maintenance && p.terms.maintenance) {
          p.terms.maintenance = Object.assign({}, p.terms.maintenance, { pct: mine.terms.maintenance.pct, dueMonthsBeforeDelivery: mine.terms.maintenance.dueMonthsBeforeDelivery });
          delete p.terms.maintenance.months;
        }
      }
    });
  }
  function save(s, what, id, by) {
    if (!DEMO) return storeSave(s, what, id);
    s.log.push({ at: new Date().toISOString(), what: what, id: id || null, by: by || '' });
    write(s); apply(s);
    return { ok: true };
  }

  /* ---- a new plan ---------------------------------------------------- */
  /* a typed percentage: whole or one decimal (2.5, 7.5). The PDF prints one decimal, so a second one
     would print a figure the schedule did not use. */
  function onePlace(x) { return typeof x === 'number' && isFinite(x) && Math.abs(Math.round(x * 10) - x * 10) < 1e-9; }
  var TYPES = ['Admin', 'Clinic', 'Commercial'];
  /* d: { cash, down, second, years, discount, discountOn, downOn, notFor, from, until } in per cent and
     whole years. discountOn: 'list' (the original price) or 'afterDown' (what is left after the down
     payment); downOn: 'list' or 'discounted' (the price after the discount). Build 154, Muhanad: "if it
     carries discount she need to be asked". With no discount neither matters.
     Answers the reason in words (a key of the dictionary), or null when it can be a plan. */
  function problem(d) {
    if (!onePlace(d.discount) || d.discount < 0 || d.discount >= 100) return 'The discount is a number from 0 to 99.';
    if (!d.cash) {
      if (!onePlace(d.down) || d.down < 0 || d.down >= 100) return 'The down payment is a number from 0 to 99.';
      if (d.second != null && (!onePlace(d.second) || d.second <= 0)) return 'The second part is a number above 0.';
      if (d.down + (d.second || 0) >= 100) return 'The down payment, both parts, must be under 100%.';
      if (!(d.years >= 2 && d.years <= 12 && Math.round(d.years) === d.years)) return 'The years are a whole number from 2 to 12.';
      if (d.discount && d.discountOn === 'afterDown' && d.downOn === 'discounted') return 'With the discount taken after the down payment, the down payment is a share of the original price.';
    } else if (!d.discount) return 'A cash plan needs its discount.';
    if (d.notFor && d.notFor.length >= TYPES.length) return 'Choose at least one type of unit.';
    if (!isDay(d.from)) return 'Choose the day it starts.';
    if (d.until && (!isDay(d.until) || d.until < d.from)) return 'The end date must be on or after the start.';
    return null;
  }
  function toPlan(d, id) {
    var f = function (x) { return Math.round(x * 10) / 1000; };          /* 7.5 -> 0.075, exactly */
    var pl = d.cash ? { id: id, group: 'original', cash: true, discount: f(d.discount) }
      : { id: id, group: 'original', down: f(d.down), years: d.years, every: 3 };
    if (!d.cash && d.discount) {
      pl.discount = f(d.discount);
      /* build 155: unanswered, the plan follows the project's own rule (terms.downOn, 'discounted' since
         Main Marks' email of 11 Nov 2026) */
      if (d.downOn) pl.downOn = d.downOn === 'discounted' ? 'discounted' : 'list';
      if (d.discountOn === 'afterDown') pl.discountOn = 'afterDown';
    }
    if (!d.cash && d.second) pl.milestones = [{ pct: f(d.second), months: 3, label: 'Second down payment', down: true }];
    if (d.notFor && d.notFor.length) pl.notFor = d.notFor.slice();
    pl.from = d.from;
    if (d.until) pl.until = d.until;
    pl.label = labelOf(pl);
    return pl;
  }
  /* the numbers, to tell a plan already offered */
  function numbers(pl) { var s2 = second(pl); return [pl.cash ? 1 : 0, pl.cash ? 0 : pl.down, s2 ? s2.pct : 0, pl.cash ? 0 : pl.years, pl.discount || 0].join('|'); }
  /* an id is never given to another plan: the day it was made, then a count, past every id on the list */
  function newId(list) {
    var stem = 'a' + today().slice(2).replace(/-/g, ''), n = 1, ids = {};
    list.forEach(function (pl) { ids[pl.id] = 1; });
    while (ids[stem + '-' + n]) n++;
    return stem + '-' + n;
  }

  function add(pid, d, by) {
    var s = current(), mine = s.projects[pid];
    if (!mine) return { why: 'Plans cannot be changed here yet.' };
    var why = problem(d);
    if (why) return { why: why };
    var pl = toPlan(d, newId(mine.plans)), same = numbers(pl);
    if (mine.plans.some(function (x) { return stateOf(x) !== 'ended' && numbers(x) === same; })) return { why: 'A plan with these numbers is already on the list. Change its dates instead.' };
    if (!MM.plans || !MM.plans.worded(pl)) return { why: 'These numbers do not make a plan.' };
    mine.plans.push(pl);
    if (!DEMO) return storeSave(s, 'add', pl.id).then(function (r) { if (r.ok) r.plan = pl; return r; });
    save(s, 'add', pl.id, by);
    return { ok: true, plan: pl };
  }
  function find(mine, id) { return mine ? mine.plans.filter(function (x) { return x.id === id; })[0] || null : null; }
  /* its dates and the unit types it is for: nothing that changes a figure */
  function change(pid, id, o, by) {
    var s = current(), mine = s.projects[pid], pl = find(mine, id);
    if (!pl) return { why: 'This plan is no longer there. Open the page again.' };
    var from = o.from || pl.from || '', until = o.until || '';
    if (from && !isDay(from)) return { why: 'Choose the day it starts.' };
    if (until && (!isDay(until) || (from && until < from))) return { why: 'The end date must be on or after the start.' };
    if (o.notFor && o.notFor.length >= TYPES.length) return { why: 'Choose at least one type of unit.' };
    if (from) pl.from = from; else delete pl.from;
    if (until) pl.until = until; else delete pl.until;
    if (o.notFor) { if (o.notFor.length) pl.notFor = o.notFor.slice(); else delete pl.notFor; }
    return save(s, 'change', id, by);
  }
  /* ended today: offered until yesterday */
  function end(pid, id, by) {
    var s = current(), pl = find(s.projects[pid], id);
    if (!pl) return { why: 'This plan is no longer there. Open the page again.' };
    pl.until = dayBefore(today());
    if (pl.from && pl.from > pl.until) pl.from = pl.until;
    return save(s, 'end', id, by);
  }
  /* t: { deliveryMonths, maintPct (per cent), dueBefore (months) } */
  function setTerms(pid, t, by) {
    var s = current(), mine = s.projects[pid], pj = project(pid);
    if (!mine) return { why: 'Plans cannot be changed here yet.' };
    /* build 155: Main Marks gives delivery per building and no maintenance on the offer (11 Nov 2026);
       one figure for the whole project would undo that */
    if (pj && pj.terms && pj.terms.deliveryByBuilding) return { why: 'Delivery is set per building.' };
    if (!(t.deliveryMonths >= 6 && t.deliveryMonths <= 120 && Math.round(t.deliveryMonths) === t.deliveryMonths)) return { why: 'Delivery is a whole number of months, from 6 to 120.' };
    if (!onePlace(t.maintPct) || t.maintPct < 0 || t.maintPct > 20) return { why: 'Maintenance is a number from 0 to 20.' };
    if (!(t.dueBefore >= 0 && t.dueBefore < t.deliveryMonths && Math.round(t.dueBefore) === t.dueBefore)) return { why: 'Maintenance falls due before delivery: a whole number of months, under the delivery months.' };
    mine.terms = { deliveryMonths: t.deliveryMonths, maintenance: { pct: Math.round(t.maintPct * 10) / 1000, dueMonthsBeforeDelivery: t.dueBefore } };
    return save(s, 'terms', null, by);
  }
  /* the demo only: the list as this build wrote it */
  function reset() {
    try { root.localStorage.removeItem(KEY); } catch (e) { /* nothing kept */ }
    try { frame().__mmPlanBook = null; } catch (e) { /* nothing above */ }
    projects().forEach(function (p) {
      var o = JSON.parse(JSON.stringify(ORIGINAL[p.id]));
      p.plans = o.plans; p.terms.deliveryMonths = o.deliveryMonths; p.terms.maintenance = o.maintenance;
    });
  }

  if (DEMO) apply(read());

  /* ---- BUILD 212: THE PLANS ON THE REAL STORE (sql 12_plan_book.sql) --------------------------
     Muhanad, 27 Nov 2026: "Can add a payment plan ... This is not visible". The list is one row of the
     store (mm_plan_book), saved by the admin only (mm_admin_save_plans), read by every page.
     HOW A PAGE GETS IT. This file runs before the page draws anything, so it puts the list this phone
     read last time in place of config's AT ONCE (kept in this browser), then asks the store. When the
     store's list is not the one used, the new one is kept and the page opens again, once: the next
     offer is then made on the plans the admin saved. Nothing saved yet: config's plans, as before.
     The store keeps the rules of build 154 too: a saved plan's numbers never change and a plan is never
     deleted (MM_PLAN_NUMBERS, MM_PLAN_GONE), and a save on a list that changed since it was read is
     refused (MM_PLANS_CHANGED), so two admins cannot overwrite each other. */
  var CACHE = 'mm.planbook.store.v1', AGAIN = 'mm.planbook.reopened', ready = Promise.resolve();
  function cached() { try { var c = JSON.parse(root.localStorage.getItem(CACHE) || 'null'); return c && c.book && c.book.projects ? c : null; } catch (e) { return null; } }
  function keepCache(v, book) { try { if (book) root.localStorage.setItem(CACHE, JSON.stringify({ version: v, book: book })); else root.localStorage.removeItem(CACHE); } catch (e) { /* private mode: asked again next time */ } }
  if (!DEMO) {
    var had = cached();
    live.version = had ? had.version : 0; live.book = had ? had.book : null;
    if (live.book) apply({ projects: live.book.projects });
    ready = (typeof fetch === 'function' ? fetch(CONFIG.store.url + '/rest/v1/mm_plan_book?select=book,version&id=eq.1', { headers: { apikey: CONFIG.store.key, Authorization: 'Bearer ' + CONFIG.store.key }, cache: 'no-store' })
      .then(function (r) { if (!r.ok) throw new Error('plans ' + r.status); return r.json(); }) : Promise.reject(new Error('no fetch')))
      .then(function (rows) {
        var row = rows && rows[0], book = row && row.book && row.book.projects ? row.book : null, v = row ? row.version : 0;
        var same = JSON.stringify(book) === JSON.stringify(live.book);
        live.version = v;
        if (same) return;
        keepCache(v, book); live.book = book;
        /* the page was drawn on other plans: open it again, once (never in a loop) */
        var last = 0; try { last = +(root.sessionStorage.getItem(AGAIN) || 0); } catch (e) { last = 0; }
        /* the sign-in page shows no plan, and someone may be typing there: it only keeps the new list */
        var calm = /(^|[/])(login|index)[.]html$/.test(root.location.pathname || '') || /[/]$/.test(root.location.pathname || '');
        if (calm && book) apply({ projects: book.projects });
        else if (Date.now() - last > 30000) { try { root.sessionStorage.setItem(AGAIN, String(Date.now())); } catch (e) { /* nothing kept */ } root.location.reload(); }
        else if (book) apply({ projects: book.projects });
      })
      .catch(function () { /* no line: the plans this phone read last, or config's */ });
  }
  /* the admin's save: the whole list, with the version she read */
  var WHY = { MM_PLANS_CHANGED: 'The plans were changed on another device. Open the page again.', MM_PLAN_NUMBERS: 'A saved plan keeps its numbers. Copy it into a new plan instead.',
    MM_PLAN_GONE: 'A saved plan cannot be removed. End it instead.', MM_BAD_PLANS: 'These numbers do not make a plan.', MM_NOT_ALLOWED: 'Only the admin can change the payment plans.' };
  function storeSave(s, what, id) {
    var book = { projects: s.projects };
    return ready.then(function () {
      return MM.auth.call('/rest/v1/rpc/mm_admin_save_plans', { method: 'POST', body: { p_book: book, p_version: live.version, p_what: what, p_id: id || null } });
    }).then(function (r) {
      if (r.status >= 300) { var m = String((r.body && (r.body.message || r.body.hint)) || ''), k = Object.keys(WHY).filter(function (x) { return m.indexOf(x) !== -1; })[0]; return { why: k ? WHY[k] : 'The plans could not be saved. Try again.' }; }
      live.version = Number(r.body) || live.version + 1; live.book = JSON.parse(JSON.stringify(book));
      keepCache(live.version, live.book); apply({ projects: JSON.parse(JSON.stringify(book.projects)) });
      return { ok: true };
    }, function () { return { why: 'No connection. Try again when you are online.' }; });
  }

  MM.planBook = {
    on: true,                       /* build 212: the admin changes plans on the demo (this browser) and on the store (mm_plan_book) */
    store: !DEMO, ready: function () { return ready; },
    projects: projects, project: project,
    stateOf: stateOf, labelOf: labelOf, problem: problem, toPlan: toPlan, today: today,
    add: add, change: change, end: end, setTerms: setTerms, reset: reset,
    changed: function () { var s = read(); return !!(s && s.log && s.log.length); },
    types: TYPES
  };
}(typeof window !== 'undefined' ? window : globalThis));
