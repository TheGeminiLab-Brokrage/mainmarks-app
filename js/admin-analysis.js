/* ------------------------------------------------------------------
   Main Marks — THE ADMIN'S ANALYSIS (build 211).
   Muhanad, 27 Nov 2026: "she should be having an analysis tab. She can
   print reports and she should be having the whole brokerage company
   history ... visibility on all the teams, the directors ... in the
   companies, two tabs inside the company tab where she's able to make any
   actions, and also have a list of the active companies, the inactive, the
   gone quiet companies ... and it should be looking with the UI experience
   we already gained". He chose a dashboard of her own (not the CCO's Team
   Pulse), Companies as Manage | Activity, and every report she needs.

   WHAT IS ON IT, in the look of her People tab (the CCO card, the director
   tabs, the manager cards, the team's pane of glass) and My activity's date
   switch:
     - the headline: sales in the dates, against the time before
     - the companies: active of all listed, gone quiet, inactive, never asked
     - the activity: special requests, broadcasts, orientations, meetings
     - every director, his teams, each team's sales agents (the glass pane)
     - what needs her: gone-quiet companies, sales agents with nothing sent
     - the reports: team activity, companies, sales, inventory (PDF, Excel)
   Companies › Activity: the four groups across every team; a company opens
   with its whole history, newest first.

   THE RULES ARE TEAM PULSE'S (js/manager.js), so her figures and a
   manager's never disagree:
     special request = an offer to a company; broadcast = an offer to none
     active    = a special request in the dates
     gone quiet = none in them, one in the days just before (as many days, at least 14)
     inactive  = asked before that, not since
     never     = no special request up to the last day
     sales     = contracts signed in the dates; a split contract is half each
   It reads mm_events as the History does (the store lets the admin read
   every row), and on the demo link admin-demo.js answers the same question.
   ------------------------------------------------------------------ */
(function (root) {
  'use strict';
  var MM = root.MM;

  MM.adminAnalysis = function (X) {
    var t = MM.t, esc = X.esc, nm = X.nm, AR = MM.isArabic;
    var ev = null, busy = false, failed = false;
    var lastP = null, lastV = null, lastF = null, repAs = 'pdf', period = 'month', cview = 'manage', cstate = 'active', dirPick = null, paneTeam = null, opener = null;
    var PERIODS = [['today', t('Today'), 0], ['week', t('7 days'), 6], ['month', t('30 days'), 29], ['all', t('All time'), null]];

    /* ---- the rows ---- */
    function load() {
      busy = true;
      return X.getAll('/rest/v1/mm_events?select=id,kind,company_id,person_id,team_id,person2_id,team2_id,on_date,unit_code,value,product,ended,why,area,plan&order=on_date.asc,id.asc')
        .then(function (rows) { ev = rows.slice().sort(function (a, b) { return a.on_date < b.on_date ? -1 : a.on_date > b.on_date ? 1 : 0; }); busy = false; failed = false; }, function () { busy = false; failed = true; });
    }
    function ready(then) {
      if (ev || busy) return;
      load().then(then);
    }

    /* ---- the days ---- */
    function iso(d) { return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); }
    function back(n) { var d = new Date(); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() - n); return iso(d); }
    function shift(s, n) { var d = new Date(s + 'T12:00:00'); d.setDate(d.getDate() + n); return iso(d); }
    function span(a, b) { return Math.round((new Date(b + 'T12:00:00') - new Date(a + 'T12:00:00')) / 864e5) + 1; }
    function range() {
      var p = PERIODS.filter(function (x) { return x[0] === period; })[0], to = back(0);
      if (p[2] === null) return { from: ev && ev.length ? ev[0].on_date : to, to: to, all: true };
      return { from: back(p[2]), to: to };
    }
    function before(r) { var n = span(r.from, r.to); return { from: shift(r.from, -n), to: shift(r.from, -1) }; }
    function inR(e, r) { return e.on_date >= r.from && e.on_date <= r.to; }
    function rangeText(r) { return r.from === r.to ? X.dayText(r.to) : X.dayText(r.from) + ' – ' + X.dayText(r.to); }

    /* ---- the figures ---- */
    function kindOf(e) { return e.kind === 'offer' ? (e.company_id ? 'special' : 'broadcast') : e.kind; }
    function blank() { return { special: 0, broadcast: 0, orientation: 0, workshop: 0, meeting: 0, reservation: 0, contract: 0, cancel: 0, value: 0 }; }
    /* who: a person id (his half of a split), a team id (its half), or nothing (the whole company) */
    function tally(list, who, tid) {
      var o = blank();
      list.forEach(function (e) {
        var mine = who ? (e.person_id === who || e.person2_id === who) : tid ? (e.team_id === tid || e.team2_id === tid) : true;
        if (!mine) return;
        o[kindOf(e)]++;
        if (e.kind === 'contract') {
          var split = who ? !!e.person2_id : tid ? (!!e.team2_id && e.team2_id !== e.team_id) : false;
          o.value += Number(e.value || 0) / (split ? 2 : 1);
        }
      });
      return o;
    }
    function listed() { return X.companies().filter(function (c) { return c.active && !c.pending && !c.merged_into; }); }
    /* each listed company: its special requests, the last one, its state in the dates */
    function states(r) {
      var backN = Math.max(span(r.from, r.to), 14), qFrom = shift(r.from, -backN), by = {};
      ev.forEach(function (e) {
        if (e.kind !== 'offer' || !e.company_id || e.on_date > r.to) return;
        var b = by[e.company_id] || (by[e.company_id] = { n: 0, inR: 0, quiet: 0, last: '', agents: {} });
        b.n++; if (e.on_date > b.last) b.last = e.on_date;
        if (e.on_date >= r.from) { b.inR++; b.agents[e.person_id] = 1; }
        else if (e.on_date >= qFrom) b.quiet++;
      });
      var out = { active: [], quiet: [], inactive: [], never: [] };
      listed().forEach(function (c) {
        var b = by[c.id], s = !b ? 'never' : b.inR ? 'active' : b.quiet ? 'quiet' : 'inactive';
        out[s].push({ c: c, b: b || { n: 0, inR: 0, last: '', agents: {} } });
      });
      out.active.sort(function (a, b) { return b.b.inR - a.b.inR || a.c.name.localeCompare(b.c.name); });
      ['quiet', 'inactive'].forEach(function (k) { out[k].sort(function (a, b) { return a.b.last < b.b.last ? 1 : a.b.last > b.b.last ? -1 : 0; }); });
      out.never.sort(function (a, b) { return a.c.name.localeCompare(b.c.name); });
      return out;
    }
    var STATE = { active: t('Active'), quiet: t('Gone quiet'), inactive: t('Inactive'), never: t('Never asked') };
    var SDOT = { active: '#2FBF8F', quiet: '#F2C037', inactive: '#7C8794', never: 'rgba(255,255,255,.3)' };
    var STATE_NOTE = { active: t('Asked for an offer in these dates.'), quiet: t('Was asking, then nothing for at least two weeks before these dates.'), inactive: t('Asked once, long ago, and not since.'), never: t('Has never asked for an offer.') };

    /* the people of the company's sales side */
    var SELLS = { sales: 1, sales_manager: 1 };
    function sellers() { return X.people().filter(function (p) { return SELLS[p.role]; }); }
    function teamsOf(dirId) { return X.teams().filter(function (tm) { return dirId === 'free' ? !tm.director_id : tm.director_id === dirId; }); }
    function directors() { return X.people().filter(function (p) { return p.role === 'director' && p.active; }).sort(X.bySeniority); }
    function members(tm) { return sellers().filter(function (p) { return p.team_id === tm.id; }).sort(function (a, b) { return (b.role === 'sales_manager') - (a.role === 'sales_manager') || (b.active - a.active) || a.name.localeCompare(b.name); }); }

    /* ---- money and numbers ---- */
    function short(v) {
      v = Number(v) || 0;
      if (v >= 1e9) return (Math.round(v / 1e8) / 10) + 'B';
      if (v >= 1e6) return (Math.round(v / 1e5) / 10) + 'M';
      if (v >= 1e3) return Math.round(v / 1e3) + 'K';
      return String(Math.round(v));
    }
    /* one and many, in both languages (the Arabic keys carry the number after the word) */
    /* the keys, for the Arabic check: t('{n} meetings') t('{n} reservations') t('{n} requests') */
    /* t('{n} sales agents') t('{n} sent nothing') */
    var MANY = { meeting: [t('1 meeting'), '{n} meetings'], reservation: [t('1 reservation'), '{n} reservations'], request: [t('1 request'), '{n} requests'], agent: [t('1 sales agent'), '{n} sales agents'], idle: [t('1 sent nothing'), '{n} sent nothing'] };
    function many(n, w) { return n === 1 ? MANY[w][0] : t(MANY[w][1], { n: n }); }
    function egp(v) { return t('EGP {n}', { n: short(v) }); }
    function versus(now, was, money) {
      if (period === 'all') return '';
      var d = now - was;
      if (!d) return '<p class="adm-vs">' + t('The same as the time before') + '</p>';
      var n = money ? egp(Math.abs(d)) : Math.abs(d);
      return '<p class="adm-vs ' + (d > 0 ? 'up' : 'down') + '">' + (d > 0 ? '▲ ' : '▼ ') + t(d > 0 ? '{n} more than the time before' : '{n} less than the time before', { n: n }) + '</p>';
    }

    /* ---- the date switch (My activity's) ---- */
    function dateSwitch() {
      var at = PERIODS.map(function (p) { return p[0]; }).indexOf(period), was = lastP === null ? at : lastP; lastP = at;
      return '<div class="seg186 adm-seg" role="group" aria-label="' + esc(t('Dates')) + '"><span class="pill186" style="--a:' + was + ';--b:' + at + '"></span>' + PERIODS.map(function (p) {
        return '<button type="button" data-an-p="' + p[0] + '" aria-pressed="' + (period === p[0]) + '">' + p[1] + '</button>';
      }).join('') + '</div>';
    }
    function waitBox() {
      if (failed) return '<section class="card"><p class="note bad">' + t('The figures could not be read. Check the connection and open the tab again.') + '</p><button class="btn ghost" type="button" data-an-retry="1">' + t('Try again') + '</button></section>';
      return '<section class="card"><p class="note">' + t('Reading the figures…') + '</p></section>';
    }
    function stat(n, label, attr) {
      return attr ? '<button type="button" class="adm-st" ' + attr + '><b>' + n + '</b><span>' + label + '</span></button>' : '<div><b>' + n + '</b><span>' + label + '</span></div>';
    }

    /* ==== THE ANALYSIS TAB ==== */
    function screen() {
      if (!ev) { ready(X.draw); return X.head(t('Analysis')) + dateSwitch() + waitBox(); }
      var r = range(), b = before(r), now = ev.filter(function (e) { return inR(e, r); }), was = ev.filter(function (e) { return inR(e, b); });
      var n = tally(now), w = tally(was), st = states(r), all = listed().length, sw = states(b);
      var idle = sellers().filter(function (p) { return p.active && p.team_id && !tally(now, p.id).special && !tally(now, p.id).broadcast; });
      var html = X.head(t('Analysis'), t('Showing {dates} · every team', { dates: '<b>' + rangeText(r) + '</b>' })) + dateSwitch() +
        /* 1. the headline: sales */
        '<section class="adm-top adm-hl"><p class="adm-k">' + t('Sales') + '</p><p class="adm-big"><small>' + (AR ? 'جنيه' : 'EGP') + '</small> ' + short(n.value) + '</p>' + versus(n.value, w.value, true) +
        '<div class="adm-stats">' + stat(n.contract, t('Contracts')) + stat(n.reservation, t('Reservations')) + stat(n.cancel, t('Cancelled')) + '</div></section>' +
        /* 2. the companies */
        '<section class="adm-top"><p class="adm-k">' + t('Brokerage companies') + '</p><p class="adm-big">' + st.active.length + ' <small>' + t('of {n} active', { n: all }) + '</small></p>' + versus(st.active.length, sw.active.length) +
        '<div class="adm-bar" aria-hidden="true">' + ['active', 'quiet', 'inactive', 'never'].map(function (k) { return st[k].length ? '<i style="flex:' + st[k].length + ';background:' + SDOT[k] + '"></i>' : ''; }).join('') + '</div>' +
        '<div class="adm-groups">' + ['active', 'quiet', 'inactive', 'never'].map(function (k) {
          return '<button type="button" class="adm-grp" data-an-state="' + k + '"><i style="background:' + SDOT[k] + '"></i><span>' + STATE[k] + '</span><b>' + st[k].length + '</b></button>';
        }).join('') + '</div></section>' +
        /* 3. the activity */
        '<section class="card"><h2>' + t('Activity') + '</h2><div class="adm-stats four">' + stat(n.special, t('Special requests')) + stat(n.broadcast, t('Broadcasts')) + stat(n.orientation + n.workshop, t('Orientations and workshops')) + stat(n.meeting, t('Meetings')) + '</div></section>' +
        /* 4. needs her */
        (st.quiet.length || idle.length ? '<section class="card"><h2>' + t('Needs a look') + '</h2><div class="rows an">' +
          (st.quiet.length ? '<button class="row" type="button" data-an-state="quiet"><span class="nm">' + t('Gone quiet companies') + '</span><span class="sub">' + esc(st.quiet.slice(0, 3).map(function (x) { return x.c.name; }).join(' · ')) + '</span><span class="val">' + st.quiet.length + '</span></button>' : '') +
          (idle.length ? '<div class="row flat"><span class="nm">' + t('Sales agents with nothing sent') + '</span><span class="sub">' + esc(idle.slice(0, 6).map(function (p) { return p.name; }).join(' · ')) + (idle.length > 6 ? ' ' + t('and {n} more', { n: idle.length - 6 }) : '') + '</span><span class="val">' + idle.length + '</span></div>' : '') +
          '</div></section>' : '') +
        /* 5. every director, his teams */
        directorsBlock(now) +
        /* 6. the reports */
        reportsCard();
      return html;
    }
    function directorsBlock(now) {
      var dirs = directors(), free = teamsOf('free');
      if (!dirs.length && !free.length) return '';
      var keys = dirs.map(function (d) { return d.id; }).concat(free.length ? ['free'] : []);
      if (keys.indexOf(dirPick) === -1) dirPick = keys[0];
      var tabs = '<div class="adm-dtabs" role="tablist">' + keys.map(function (k) {
        var tms = teamsOf(k), v = tms.reduce(function (s, tm) { return s + tally(now, null, tm.id).value; }, 0), d = X.person(k);
        return '<button type="button" role="tab" data-an-dir="' + esc(k) + '" aria-selected="' + (dirPick === k) + '"><span>' + (d ? nm(d.name) : t('No director yet')) + '</span><small>' + egp(v) + '</small></button>';
      }).join('') + '</div>';
      var tms = teamsOf(dirPick);
      var cards = tms.map(function (tm) {
        var n = tally(now, null, tm.id), mg = X.person(tm.manager_id), ppl = members(tm).filter(function (p) { return p.active; });
        var quiet = ppl.filter(function (p) { var x = tally(now, p.id); return !x.special && !x.broadcast; }).length;
        /* build 214: a row of one list; the badge says what it counts (it was a bare number with a hover title) */
        return '<button class="adm-mgr" type="button" data-an-team="' + esc(tm.id) + '">' +
          '<span class="adm-av">' + esc(X.initials(mg ? mg.name : tm.name)) + '</span><span class="adm-mgr-nm">' + nm(X.teamLabel(tm)) + '</span>' +
          '<span class="adm-mgr-sub">' + many(n.special, 'request') + ' · ' + many(n.meeting, 'meeting') + (quiet ? '<span class="adm-dot">' + many(quiet, 'idle') + '</span>' : '') + '</span>' +
          '<span class="adm-mgr-n"><b>' + short(n.value) + '</b> ' + t('EGP sales') + '</span></button>';
      }).join('');
      return '<p class="adm-k adm-k-pad">' + t('By director') + '</p>' + tabs + '<div class="adm-dpane"><p class="adm-k adm-k-pad">' + t('Teams') + '</p><div class="adm-mgrs">' + (cards || '<p class="note">' + t('No team yet.') + '</p>') + '</div></div>';
    }
    function formatSwitch() {
      var at = repAs === 'xlsx' ? 1 : 0, was = lastF === null ? at : lastF; lastF = at;
      return '<div class="seg186 adm-seg two" role="group" aria-label="' + esc(t('Format')) + '"><span class="pill186" style="--a:' + was + ';--b:' + at + '"></span><button type="button" data-an-fmt="pdf" aria-pressed="' + (repAs === 'pdf') + '">PDF</button><button type="button" data-an-fmt="xlsx" aria-pressed="' + (repAs === 'xlsx') + '">Excel</button></div>';
    }
    var DL = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 4v11M7 10l5 5 5-5M5 20h14"/></svg>';
    function reportsCard() {
      var R = [['team', t('Team activity'), t('Every director, team and sales agent')], ['companies', t('Companies'), t('Active, gone quiet, inactive, never asked')],
        ['sales', t('Sales'), t('Reservations and contracts, by team and agent')], ['inventory', t('Inventory'), t('Available and on hold, by line and building')]];
      /* build 214: choose PDF or Excel once; one button a report (eight small buttons were 36 px) */
      return '<section class="card" id="anReports"><h2>' + t('Reports') + '</h2><p class="note">' + t('For the dates chosen above.') + '</p>' + formatSwitch() + '<div class="rows an adm-reps">' + R.map(function (x) {
        return '<div class="row flat"><span class="nm">' + x[1] + '</span><span class="sub">' + x[2] + '</span><span class="val adm-repbtns">' +
          '<button class="adm-dl" type="button" data-an-rep="' + x[0] + '" data-an-as="' + repAs + '" aria-label="' + esc(t('Download {name}', { name: x[1] })) + '">' + DL + '</button></span></div>';
      }).join('') + '</div></section>';
    }

    /* ---- a team's pane of glass ---- */
    function openTeam(id) {
      var tm = X.team(id); if (!tm) return;
      var r = range(), now = ev.filter(function (e) { return inR(e, r); }), n = tally(now, null, id), d = X.person(tm.director_id);
      var rows = members(tm).map(function (p) {
        var x = tally(now, p.id);
        var bits = [many(x.meeting, 'meeting'), many(x.reservation, 'reservation')];
        if (x.contract) bits.push(egp(x.value));
        return '<div class="row flat' + (p.active ? '' : ' gone') + '"><span class="nm">' + nm(p.name) + (p.role === 'sales_manager' ? ' <b class="adm-tag">' + t('Manager') + '</b>' : '') + '</span><span class="sub">' + bits.join(' · ') + '</span><span class="val">' + x.special + '<small>' + t('requests') + '</small></span></div>';
      }).join('');
      var w = document.getElementById('aw');
      if (!w) { w = document.createElement('div'); w.id = 'aw'; w.setAttribute('role', 'dialog'); w.setAttribute('aria-modal', 'true'); document.body.appendChild(w); }
      if (!paneTeam) opener = document.activeElement;
      paneTeam = id;
      w.innerHTML = '<div class="adm-win"><button class="adm-wx" type="button" data-an-x="1" aria-label="' + esc(t('Close')) + '">✕</button>' +
        '<p class="eyebrow">' + (d ? nm(d.name) + ' · ' : '') + rangeText(r) + '</p><h3>' + nm(X.teamLabel(tm)) + '</h3>' +
        '<div class="adm-stats small">' + stat(short(n.value), t('EGP sales')) + stat(n.special, t('Special requests')) + stat(n.meeting, t('Meetings')) + '</div>' +
        '<div class="rows an">' + rows + '</div>' +
        '<button class="btn ghost" type="button" data-an-rep="team:' + esc(id) + '" data-an-as="pdf">' + t('This team’s report (PDF)') + '</button></div>';
      document.documentElement.classList.add('is-locked');
      requestAnimationFrame(function () { w.classList.add('on'); var x = w.querySelector('.adm-wx'); if (x) x.focus({ preventScroll: true }); });
    }
    function closeTeam() {
      var w = document.getElementById('aw'); if (!w || !paneTeam) return false;
      w.classList.remove('on'); paneTeam = null;
      document.documentElement.classList.remove('is-locked');
      if (opener && document.contains(opener)) opener.focus({ preventScroll: true });
      return true;
    }

    /* ==== COMPANIES › ACTIVITY ==== */
    function companiesSwitch() {
      var at = cview === 'activity' ? 1 : 0, was = lastV === null ? at : lastV; lastV = at;
      return '<div class="seg186 adm-seg two" role="group" aria-label="' + esc(t('Brokerage companies')) + '"><span class="pill186" style="--a:' + was + ';--b:' + at + '"></span><button type="button" data-an-cv="manage" aria-pressed="' + (cview === 'manage') + '">' + t('Manage') + '</button><button type="button" data-an-cv="activity" aria-pressed="' + (cview === 'activity') + '">' + t('Activity') + '</button></div>';
    }
    function companies() {
      if (!ev) { ready(X.draw); return X.head(t('Companies')) + companiesSwitch() + waitBox(); }
      var r = range(), st = states(r), list = st[cstate], CAPN = 300;
      return X.head(t('Companies'), t('Showing {dates} · every team', { dates: '<b>' + rangeText(r) + '</b>' })) + companiesSwitch() + dateSwitch() +
        '<div class="adm-groups wide">' + ['active', 'quiet', 'inactive', 'never'].map(function (k) {
          return '<button type="button" class="adm-grp" data-an-state="' + k + '" aria-pressed="' + (cstate === k) + '"><i style="background:' + SDOT[k] + '"></i><span>' + STATE[k] + '</span><b>' + st[k].length + '</b></button>';
        }).join('') + '</div>' +
        '<section class="card"><h2>' + STATE[cstate] + ' <em>' + list.length + '</em></h2><p class="note">' + STATE_NOTE[cstate] + '</p><div class="rows an">' +
        (list.length ? list.slice(0, CAPN).map(function (x) {
          var sub = cstate === 'never' ? t('No request yet') : cstate === 'active' ? many(Object.keys(x.b.agents).length, 'agent') : t('Last request {date}', { date: X.dayText(x.b.last) });
          return '<button class="row" type="button" data-an-co="' + esc(x.c.id) + '"><span class="nm">' + nm(x.c.name) + '</span><span class="sub">' + sub + '</span><span class="val">' + (cstate === 'active' ? x.b.inR : x.b.n) + '<small>' + t('requests') + '</small></span></button>';
        }).join('') + (list.length > CAPN ? '<p class="note">' + t('{n} more. The Companies report holds them all.', { n: list.length - CAPN }) + '</p>' : '') : '<p class="note">' + t('No company in this group.') + '</p>') +
        '</div></section>';
    }
    var KIND = { special: t('Special request'), broadcast: t('Broadcast'), orientation: t('Orientation'), workshop: t('Workshop'), meeting: t('Meeting'), reservation: t('Reservation'), contract: t('Contract'), cancel: t('Cancelled reservation') };
    function openCompany(id) {
      var c = X.companies().filter(function (x) { return x.id === id; })[0]; if (!c) return;
      var mine = ev.filter(function (e) { return e.company_id === id; }).slice().reverse(), n = tally(mine);
      var who = {}; mine.forEach(function (e) { who[e.person_id] = 1; });
      X.showSheet('<div><h3>' + nm(c.name) + '</h3><p class="role">' + t('The whole history, newest first') + '</p></div><div class="form">' +
        '<div class="adm-stats">' + stat(n.special, t('Special requests')) + stat(n.meeting + n.orientation + n.workshop, t('Meetings and orientations')) + stat(short(n.value), t('EGP sales')) + '</div>' +
        '<p class="note">' + t('Sales agents who worked with this company: {n}', { n: Object.keys(who).length }) + '</p>' +
        '<div class="rows an adm-hist">' + (mine.length ? mine.map(function (e) {
          var p = X.person(e.person_id), tm = X.team(e.team_id), bits = [X.dayText(e.on_date), p ? p.name : '', tm ? X.teamLabel(tm) : ''];
          if (e.unit_code) bits.push(e.unit_code);
          return '<div class="row flat"><span class="nm">' + esc(KIND[kindOf(e)] || e.kind) + '</span><span class="sub">' + esc(bits.filter(Boolean).join(' · ')) + '</span><span class="val code">' + (e.value && e.kind !== 'offer' ? esc(egp(e.value)) : '') + '</span></div>';
        }).join('') : '<p class="note">' + t('Nothing recorded with this company yet.') + '</p>') + '</div></div>');
    }

    /* ==== THE REPORTS (js/report.js, Team Pulse's own pages) ==== */
    var PAL = { green: '#1E9E78', yellow: '#E0A800', slate: '#7C8794', light: '#CFC8C0', orange: '#F7951E', black: '#0C0907', red: '#C4472F' };
    var CAP = 40;
    function cap(tb) { if (tb.rows.length > CAP) { tb.more = tb.rows.length - CAP; } return tb; }
    function teamOfP(p) { var tm = p && X.team(p.team_id); return tm ? X.teamLabel(tm) : ''; }
    function dirOfT(tm) { var d = tm && X.person(tm.director_id); return d ? d.name : t('No director yet'); }
    function base(title, kind, r, tiles, sections, answer) {
      var made = new Date(), me = X.session;
      var rep = { title: title, kind: t('Admin') + ' · ' + kind, range: rangeText(r),
        subtitle: t('Every team · {dates}', { dates: rangeText(r) }),
        by: t('Prepared by {name}, {title} · {date}', { name: me.name, title: t('Admin'), date: X.dayText(back(0)) }),
        demo: X.demo ? t('DEMO FIGURES. The activity in this file is invented for the demonstration.') : '', rtl: AR,
        answer: answer, summary: tiles, sections: sections,
        meta: [[t('Dates'), rangeText(r)], [t('Made on'), made, 'datetime'], [t('Prepared by'), me.name], [t('What it covers'), t('Every team')]],
        labels: { summary: t('In these dates'), summarySheet: t('Summary'), analysis: t('What it shows'), demoFoot: t('DEMO FIGURES'), page: t('Page {n} of {m}'), continued: t('continued'), none: t('Nothing in these dates.'),
          where: t('Where it is in the app'), how: t('How it is counted'), sentence: t('In one sentence'), contents: t('In this report'), andMore: t('{n} more inside') },
        tables: [], notes: answer ? [answer] : [] };
      sections.forEach(function (s) { s.where = s.where || [t('Admin'), t('Analysis')]; (s.notes || []).forEach(function (x) { rep.notes.push(x); }); (s.tables || []).forEach(function (tb) { rep.tables.push(tb); }); });
      return rep;
    }
    function agentCols() {
      return [{ h: t('Sales agent'), w: 24 }, { h: t('Team'), w: 22 }, { h: t('Special requests'), w: 11, type: 'int' }, { h: t('Broadcasts'), w: 10, type: 'int' }, { h: t('Orientations'), w: 10, type: 'int' },
        { h: t('Meetings'), w: 9, type: 'int' }, { h: t('Reservations'), w: 10, type: 'int' }, { h: t('Contracts'), w: 9, type: 'int' }, { h: t('Sales, EGP'), w: 16, type: 'money' }];
    }
    function tilesOf(n) { return [[t('Sales, EGP'), n.value, 'money'], [t('Contracts'), n.contract], [t('Reservations'), n.reservation], [t('Special requests'), n.special], [t('Broadcasts'), n.broadcast], [t('Meetings'), n.meeting]]; }
    function describe(key) {
      var r = range(), now = ev.filter(function (e) { return inR(e, r); }), n = tally(now), at = key.indexOf(':'), kind = at === -1 ? key : key.slice(0, at), arg = at === -1 ? '' : key.slice(at + 1);
      var tms = X.teams(), people = sellers().filter(function (p) { return p.team_id && (p.active || tally(now, p.id).special); });
      if (kind === 'team') {
        if (arg) { tms = tms.filter(function (x) { return x.id === arg; }); people = people.filter(function (p) { return p.team_id === arg; }); n = tally(now, null, arg); }
        var dirs = {}; tms.forEach(function (tm) { var k = dirOfT(tm); dirs[k] = (dirs[k] || 0) + tally(now, null, tm.id).value; });
        var teamRows = tms.map(function (tm) { var x = tally(now, null, tm.id); return [X.teamLabel(tm), dirOfT(tm), x.special, x.broadcast, x.orientation + x.workshop, x.meeting, x.reservation, x.contract, x.value]; });
        var agentRows = people.map(function (p) { var x = tally(now, p.id); return [p.name, teamOfP(p), x.special, x.broadcast, x.orientation + x.workshop, x.meeting, x.reservation, x.contract, x.value]; })
          .sort(function (a, b) { return b[8] - a[8] || b[2] - a[2]; });
        var idle = agentRows.filter(function (x) { return !x[2] && !x[3]; }).map(function (x) { return x[0]; });
        var title = arg ? X.teamLabel(tms[0]) : t('Team activity');
        var secs = [];
        if (!arg) secs.push({ kicker: t('Directors'), title: t('Sales by director'), text: [t('Contracts signed in the dates. A split contract counts half for each side.')], notes: [], charts: [{ type: 'hbar', title: t('Sales, EGP'), rows: Object.keys(dirs).map(function (k) { return [k, dirs[k], '', PAL.orange]; }) }], tables: [] });
        secs.push({ kicker: t('Teams'), title: t('Every team'), text: [t('Special requests are offers sent to a company; broadcasts go to no company in particular.')], notes: [],
          charts: [{ type: 'stacked', title: t('Offers sent, by team'), series: [{ name: t('Special requests'), color: PAL.black }, { name: t('Broadcasts'), color: PAL.light, ink: '#141210' }], rows: tms.map(function (tm) { var x = tally(now, null, tm.id); return [X.teamLabel(tm), [x.special, x.broadcast]]; }) }],
          tables: [cap({ title: t('Teams'), cols: [{ h: t('Team'), w: 24 }, { h: t('Director'), w: 22 }].concat(agentCols().slice(2)), rows: teamRows })] });
        secs.push({ kicker: t('Sales agents'), title: t('Every sales agent'), text: [t('Ranked by sales, then by special requests.')], notes: idle.length ? [t('Nothing sent in these dates: {names}.', { names: idle.join(', ') })] : [], charts: [], tables: [cap({ title: t('Sales agents'), cols: agentCols(), rows: agentRows })] });
        return base(title, t('Team activity'), r, tilesOf(n), secs, t('{a} special requests and {b} contracts in these dates.', { a: n.special, b: n.contract }));
      }
      if (kind === 'companies') {
        var st = states(r), row = function (x) { return [x.c.name, x.b.inR, x.b.n, x.b.last ? X.dayText(x.b.last) : '', Object.keys(x.b.agents).map(function (id) { var p = X.person(id); return p ? p.name : ''; }).join(', ')]; };
        var cols = [{ h: t('Brokerage company'), w: 30 }, { h: t('Requests in the dates'), w: 12, type: 'int' }, { h: t('Requests, all'), w: 10, type: 'int' }, { h: t('Last request'), w: 14 }, { h: t('Sales agents'), w: 34 }];
        var secsC = ['active', 'quiet', 'inactive', 'never'].map(function (k) {
          return { kicker: t('Companies'), title: STATE[k] + ' · ' + st[k].length, text: [STATE_NOTE[k]], notes: [], charts: [], tables: [cap({ title: STATE[k], cols: cols, rows: st[k].map(row) })] };
        });
        secsC[0].charts = [{ type: 'donut', title: t('Every listed company'), centre: t('companies'), rows: ['active', 'quiet', 'inactive', 'never'].map(function (k) { return [STATE[k], st[k].length, { active: PAL.green, quiet: PAL.yellow, inactive: PAL.slate, never: PAL.light }[k]]; }) }];
        return base(t('Brokerage companies'), t('Companies'), r, [[t('Listed companies'), listed().length]].concat(['active', 'quiet', 'inactive', 'never'].map(function (k) { return [STATE[k], st[k].length]; })), secsC,
          t('{a} of {b} companies asked for an offer in these dates.', { a: st.active.length, b: listed().length }));
      }
      if (kind === 'sales') {
        var deals = now.filter(function (e) { return e.kind === 'reservation' || e.kind === 'contract' || e.kind === 'cancel'; }).slice().reverse();
        var co = function (id) { var c = X.companies().filter(function (x) { return x.id === id; })[0]; return c ? c.name : ''; };
        var dealRows = deals.map(function (e) { var p = X.person(e.person_id), p2 = X.person(e.person2_id); return [X.dayText(e.on_date), KIND[kindOf(e)], co(e.company_id), p ? p.name : '', p2 ? p2.name : '', teamOfP(p), e.unit_code || '', e.value ? Number(e.value) : '']; });
        var dcols = [{ h: t('Date'), w: 14 }, { h: t('What'), w: 16 }, { h: t('Brokerage company'), w: 22 }, { h: t('Sales agent'), w: 18 }, { h: t('Split with'), w: 14 }, { h: t('Team'), w: 18 }, { h: t('Unit code'), w: 10 }, { h: t('Price, EGP'), w: 16, type: 'money' }];
        var byTeam = X.teams().map(function (tm) { var x = tally(now, null, tm.id); return [X.teamLabel(tm), x.value, '', PAL.orange]; }).filter(function (x) { return x[1]; });
        var tb = cap({ title: t('Reservations and contracts'), cols: dcols, rows: dealRows });
        var signed = deals.filter(function (e) { return e.kind === 'contract'; });
        if (signed.length) tb.total = ['', t('Contracts signed'), signed.length, '', '', '', '', signed.reduce(function (s, e) { return s + Number(e.value || 0); }, 0)];
        return base(t('Sales'), t('Sales'), r, tilesOf(n).slice(0, 3).concat([[t('Cancelled'), n.cancel]]), [
          { kicker: t('Results'), title: t('Sales by team'), text: [t('Contracts signed in the dates. A split contract counts half for each side.')], notes: [], charts: byTeam.length ? [{ type: 'hbar', title: t('Sales, EGP'), rows: byTeam }] : [], tables: [] },
          { kicker: t('The record'), title: t('Reservations and contracts'), text: [t('Every reservation, contract and cancellation, the newest first.')], notes: [], charts: [], tables: [tb] }],
          t('{a} contracts worth {b} in these dates.', { a: n.contract, b: egp(n.value) }));
      }
      return null;
    }
    function inventoryReport() {
      if (!MM.invExport || !MM.invExport.read) return Promise.reject(new Error('no inventory'));
      return MM.invExport.read().then(function (all) {
        var r = { from: back(0), to: back(0) }, secs = [], tiles = [];
        all.forEach(function (a) {
          var byLine = {};
          a.rows.forEach(function (x) { var k = x[5] || x[4] || '-'; var b = byLine[k] || (byLine[k] = [0, 0]); b[x[10] === t('Yes') ? 0 : 1]++; });
          var cols = [{ h: t('Unit'), w: 10 }, { h: t('Building (inventory)'), w: 13 }, { h: t('Floor'), w: 11 }, { h: t('Type'), w: 12 }, { h: t('Line'), w: 20 }, { h: t('Area m²'), w: 9, type: 'int' }, { h: t('Price'), w: 15, type: 'money' }, { h: t('Status'), w: 12 }];
          secs.push({ kicker: a.project.name, title: t('Available and on hold, by line'), text: [t('Every available unit and every unit on hold, as the app reads it now.')], notes: [],
            charts: [{ type: 'stacked', title: t('Units by line'), series: [{ name: t('Available'), color: PAL.green }, { name: t('On hold'), color: PAL.yellow, ink: '#141210' }], rows: Object.keys(byLine).map(function (k) { return [k, byLine[k]]; }) }],
            tables: [cap({ title: t('Units'), cols: cols, rows: a.rows.map(function (x) { return [x[0], x[1], x[3], x[4], x[5], x[6], x[8], x[9]]; }) })] });
          a.summary.slice(0, 3).forEach(function (s) { tiles.push([all.length > 1 ? a.project.name + ' · ' + s[0] : s[0], s[1]]); });
        });
        return base(t('Inventory'), t('Inventory'), r, tiles, secs, t('The inventory as the app reads it now.'));
      });
    }

    /* the PDF: jsPDF and the fonts fetched on the first one (as js/manager.js does) */
    var ARABIC = new RegExp('[' + String.fromCharCode(0x0600) + '-' + String.fromCharCode(0x06FF) + ']');
    var V = '?v=' + ((typeof CONFIG !== 'undefined' && CONFIG.build) || 0), got = {};
    function once(key, make) { if (!got[key]) got[key] = make().catch(function (e) { delete got[key]; throw e; }); return got[key]; }
    function script(src) { return once('s:' + src, function () { return new Promise(function (ok, no) { var s = document.createElement('script'); s.src = src + V; s.onload = ok; s.onerror = function () { no(new Error('Could not load ' + src)); }; document.head.appendChild(s); }); }); }
    function b64(u8) { var s = '', CH = 0x8000; for (var i = 0; i < u8.length; i += CH) s += String.fromCharCode.apply(null, u8.subarray(i, i + CH)); return btoa(s); }
    function bytes(src) { return once('b:' + src, function () { return fetch(src + V).then(function (r) { if (!r.ok) throw new Error(src + ' answered ' + r.status); return r.arrayBuffer(); }).then(function (b) { return new Uint8Array(b); }); }); }
    var FACES = { en: [['normal', 'Manrope-Regular.ttf', 'Manrope'], ['medium', 'Manrope-Medium.ttf', 'ManropeMedium'], ['semi', 'Manrope-SemiBold.ttf', 'ManropeSemi']],
      ar: [['normal', 'IBMPlexSansArabic-Regular.ttf', 'PlexArabic'], ['medium', 'IBMPlexSansArabic-Medium.ttf', 'PlexArabicMedium'], ['semi', 'IBMPlexSansArabic-SemiBold.ttf', 'PlexArabicSemi']] };
    function pdfBlob(rep) {
      var arabic = AR || ARABIC.test(JSON.stringify(rep)), files = [];
      (arabic ? ['en', 'ar'] : ['en']).forEach(function (lang) { FACES[lang].forEach(function (f) { files.push([lang].concat(f)); }); });
      return Promise.all([script('vendor/jspdf.umd.min.js'), script('js/report.js'), arabic ? script('js/arabic.js') : null, arabic && !MM.pdf ? script('js/pdf.js') : null,
        Promise.all(files.map(function (f) { return bytes('vendor/fonts/' + f[2]); })), bytes('img/mainmarks-wordmark.png').catch(function () { return null; })]).then(function (r) {
        var fonts = files.map(function (f, i) { return { lang: f[0], weight: f[1], file: f[2], family: f[3], base64: b64(r[4][i]) }; });
        var png = r[5], logo = null;
        if (png && png[1] === 0x50) { var dv = new DataView(png.buffer, png.byteOffset, png.byteLength); logo = { data: 'data:image/png;base64,' + b64(png), w: dv.getUint32(16), h: dv.getUint32(20) }; }
        return MM.report.build({ jsPDF: root.jspdf.jsPDF, arabic: MM.arabic, disarm: MM.pdf && MM.pdf.disarm, fonts: fonts, report: rep, hasArabicText: arabic, logo: logo }).output('blob');
      });
    }
    function viaFrame(blob, file) {
      try { var w = root.parent, hook = w && w !== root && w[/\.pdf$/i.test(file) ? 'MMview' : 'MMsave']; return typeof hook === 'function' && hook(blob, file) === true; } catch (e) { return false; }
    }
    function save(blob, file) {
      if (viaFrame(blob, file)) return true;
      var a = document.createElement('a'), url = URL.createObjectURL(blob);
      a.href = url; a.download = file; document.body.appendChild(a); a.click(); a.remove();
      setTimeout(function () { URL.revokeObjectURL(url); }, 60000);
      return false;
    }
    function download(key, as, btn) {
      if (!ev && key !== 'inventory') return;
      var failedNow = function (e) { if (root.console) console.error(e); X.toast(t('The file could not be made. Try again.')); };
      if (btn) { if (btn.disabled) return; btn.disabled = true; }
      var done = function () { if (btn) btn.disabled = false; };
      var made = key === 'inventory' ? inventoryReport() : Promise.resolve(describe(key));
      if (as === 'pdf') X.toast(t('Preparing the PDF…'));
      made.then(function (rep) {
        if (!rep) return done();
        var r = range(), file = 'Main Marks - Admin - ' + String(rep.title).replace(/[\\\/:*?"<>|]/g, ' ').trim() + ' - ' + (key === 'inventory' ? back(0) : r.from + (r.from === r.to ? '' : ' to ' + r.to)) + (X.demo ? ' - DEMO.' : '.');
        if (as === 'xlsx') {
          if (!save(new Blob([MM.xlsx.workbook(rep)], { type: MM.xlsx.type }), file + 'xlsx')) X.toast(t('Downloaded as Excel: {name}', { name: rep.title }));
          return done();
        }
        return pdfBlob(rep).then(function (blob) { if (!save(blob, file + 'pdf')) X.toast(t('Downloaded as PDF: {name}', { name: rep.title })); done(); });
      }).catch(function (e) { failedNow(e); done(); });
    }

    /* ---- taps ---- */
    function click(e) {
      var h = function (a) { return e.target.closest('[' + a + ']'); }, x;
      if (paneTeam) {
        if (h('data-an-x') || e.target.id === 'aw') { closeTeam(); return true; }
        if ((x = h('data-an-rep'))) { download(x.dataset.anRep, x.dataset.anAs, x); return true; }
        if (e.target.closest('#aw')) return true;
      }
      if ((x = h('data-an-p'))) { period = x.dataset.anP; X.draw(); return true; }
      if ((x = h('data-an-cv'))) { cview = x.dataset.anCv; X.draw(); return true; }
      if ((x = h('data-an-fmt'))) { repAs = x.dataset.anFmt; var card = document.getElementById('anReports'); if (card) card.outerHTML = reportsCard(); else X.draw(); return true; }
      if ((x = h('data-an-state'))) { cstate = x.dataset.anState; if (X.tab() !== 'companies') { cview = 'activity'; X.go('companies'); } else X.draw(); return true; }
      if ((x = h('data-an-dir'))) { dirPick = x.dataset.anDir; X.draw(); return true; }
      if ((x = h('data-an-team'))) { openTeam(x.dataset.anTeam); return true; }
      if ((x = h('data-an-co'))) { openCompany(x.dataset.anCo); return true; }
      if ((x = h('data-an-rep'))) { download(x.dataset.anRep, x.dataset.anAs, x); return true; }
      if (h('data-an-retry')) { failed = false; X.draw(); return true; }
      return false;
    }

    /* ==== HOME (build 214): this month at a glance, whatever dates the Analysis tab shows ==== */
    function glance() {
      if (!ev) { ready(X.draw); return waitBox(); }
      var keep = period; period = 'month';
      var r = range(), b = before(r), n = tally(ev.filter(function (e) { return inR(e, r); })), w = tally(ev.filter(function (e) { return inR(e, b); })), st = states(r), sw = states(b), all = listed().length;
      var html = '<section class="adm-top adm-hl adm-glance"><p class="adm-k">' + t('The last 30 days') + '</p>' +
        '<div class="adm-two"><div><p class="adm-big"><small>' + (AR ? 'جنيه' : 'EGP') + '</small> ' + short(n.value) + '</p><p class="adm-cap">' + t('Sales') + '</p>' + versus(n.value, w.value, true) + '</div>' +
        '<div><p class="adm-big">' + st.active.length + ' <small>' + t('of {n}', { n: all }) + '</small></p><p class="adm-cap">' + t('Active companies') + '</p>' + versus(st.active.length, sw.active.length) + '</div></div>' +
        '<button class="also adm-link" type="button" data-go-tab="analysis">' + t('Open Analysis') + '</button></section>';
      period = keep;
      return html;
    }

    return {
      screen: screen, glance: glance, companies: companies, cswitch: companiesSwitch, activity: function () { return cview === 'activity'; }, click: click, closePane: closeTeam,
      refresh: function () { ev = null; failed = false; },
      /* for checks */
      _describe: function (k) { return ev ? describe(k) : null; }, _states: function () { return ev ? states(range()) : null; }, _set: function (p) { period = p; }
    };
  };
}(window));
