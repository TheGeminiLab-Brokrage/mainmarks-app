/* ------------------------------------------------------------------
   Main Marks — the admin's page (build 123). admin.html.

   WHO IT IS FOR. The one person at Main Marks who looks after the
   accounts (Muhanad, 2026-10-06: Nehal). She adds a person, hands him
   his email and first password, switches an account off when someone
   leaves and on again, moves a person to another team, resets a
   password, and keeps the list of brokerage companies.

   WHAT IT IS NOT. It is not security. Every button here calls a function
   in the store that asks "is this an admin?" itself; a person who opened
   this page without being one would see an empty page and be refused by
   every button (C:\Butterfly project\Main Marks Store, 02_functions.sql).

   NOTHING IS DELETED HERE, and there is no delete button on purpose: a
   person and a company are switched off, and everything they did stays.

   THE EMAIL IS SUGGESTED, NOT TYPED. It is built from the name and the
   role in the agreed pattern (first two names, then the role's ending).
   She can correct the spelling; the store refuses one whose ending does
   not match the role.

   THE PASSWORD IS SHOWN ONCE. The store makes it and keeps only a hash,
   so this page is the only moment anyone can read it.
   ------------------------------------------------------------------ */
(function () {
  'use strict';

  var MM = window.MM, t = MM.t, AR = MM.isArabic;
  var session = MM.auth.require('admin.html');
  if (!session) return;
  if (session.role !== 'admin') { location.replace('index.html'); return; }
  /* BUILD 154, THE PAYMENT PLANS (js/planbook.js). On the demo link the admin has no store: her page is
     the Plans tab and her account. On the real app the plans come with the database (a paste of its
     own); until then the page is as it was. */
  var DEMO = !MM.auth.real(), PB = MM.planBook && MM.planBook.on && MM.planBook.projects().length ? MM.planBook : null;
  /* build 154 (Muhanad: "see all features we talked about that the admin should have"): on a demo link
     js/admin-demo.js answers in the store's place with practice data, so the whole page is there. BOOK
     also opens what the real store does not do yet (directors and the CCO, a long company list, the undo
     of a block); on the real app those wait for their database step. */
  var BOOK = DEMO && MM.adminBook ? MM.adminBook : null;

  var $ = function (id) { return document.getElementById(id); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var nm = function (s) { return '<bdi>' + esc(s) + '</bdi>'; };

  var ENDING = { sales: 'sales', sales_manager: 'manager', director: 'director', cco: 'cco', admin: 'admin' };
  /* build 198: every role on the real store too. Its tables, sign-up rule (mm_make_person) and team rule
     (mm_admin_set_team, mm_my_teams) have taken directors and the CCO since build 141. */
  var ROLES = ['sales', 'sales_manager', 'director', 'cco', 'admin'];
  /* the roles that are in no team: a director leads teams, the CCO and the admin see all */
  var NO_TEAM = { admin: 1, director: 1, cco: 1 };
  function roleName(r) { return t(((CONFIG.roles || {})[r] || {}).label || r); }

  /* what the store says when it refuses, in words */
  var WHY = {
    MM_EMAIL_PATTERN: 'This email does not fit the role. Check the part after the @.',
    MM_BAD_EMAIL: 'This email does not fit the role. Check the part after the @.',
    MM_EMAIL_TAKEN: 'Someone already has this email. Change the part before the @.',
    MM_STAFF_CODE_TAKEN: 'Someone already has this staff code.',
    MM_NO_TEAM: 'Choose the team.',
    MM_NO_NAME: 'Enter the name.',
    MM_NAME_TAKEN: 'This name is already on the list.',
    MM_NOT_YOURSELF: 'You cannot do this to your own account.',
    MM_NOT_ALLOWED: 'This account is not an admin account.',
    MM_NOT_SIGNED_IN: 'This account is not an admin account.',
    /* build 136: removing an entry */
    MM_NO_REASON: 'Write why it is being removed.',
    MM_NO_SUCH_ENTRY: 'This entry is no longer there. Open the page again.',
    MM_RESERVATION_NOT_OPEN: 'This reservation has been signed or cancelled since. Open the page again.',
    MM_UNIT_RESERVED: 'The unit has been reserved again since, so this cancellation can no longer be removed.',
    /* build 141: adding the plan to a contract */
    MM_NO_PLAN: 'Pick the payment plan the customer signed.',
    MM_BAD_PLAN: 'Type the down payment, from 0 to 100, and the years, up to 30.',
    MM_PLAN_ALREADY_SET: 'This contract already has its payment plan. Open the page again.',
    MM_ADMIN_ONLY: 'This account is not an admin account.',
    /* build 149: who serves a company */
    MM_NO_SUCH_PERSON: 'One of the chosen sales agents is no longer active. Open the page again.',
    MM_NO_ASK: 'This request is no longer there. Open the page again.',
    MM_NO_COMPANY: 'This company is no longer there. Open the page again.'
  };
  function why(r) {
    var code = r && r.body && r.body.message;
    return t(WHY[code] || 'This could not be saved. Try again.');
  }

  /* ---- the store ------------------------------------------------------ */
  var people = [], teams = [], companies = [];
  /* build 149: who serves a company (circle: company id -> person ids) and who asked to (asks) */
  var circle = {}, asks = [];
  function rpc(fn, body) { return MM.auth.call('/rest/v1/rpc/' + fn, { method: 'POST', body: body || {} }); }
  function load() {
    return Promise.all([
      rpc('mm_admin_people'),
      MM.auth.call('/rest/v1/mm_teams?select=id,name,manager_id,director_id&order=name'),
      /* build 137: page by page (getAll, below). About two thousand companies are coming, and one
         question would have handed her the first thousand and said nothing. */
      getAll('/rest/v1/mm_companies?select=id,name,active,pending,proposed_by,merged_into&order=name.asc,id.asc'),
      /* build 149. A store without these two tables (before that paste) answers with an error: the page
         then simply has nobody named on any company and no requests, as before. */
      getAll('/rest/v1/mm_company_agents?select=company_id,person_id&order=company_id.asc,person_id.asc').catch(function () { return []; }),
      getAll('/rest/v1/mm_company_asks?select=company_id,person_id,status,asked_at&order=asked_at.desc,company_id.asc,person_id.asc').catch(function () { return []; })
    ]).then(function (r) {
      if (r[0].status !== 200 || r[1].status !== 200) throw new Error('store');
      people = r[0].body; teams = r[1].body; companies = r[2];
      circle = {}; r[3].forEach(function (x) { (circle[x.company_id] = circle[x.company_id] || []).push(x.person_id); });
      asks = r[4];
    });
  }
  function person(id) { return people.filter(function (p) { return p.id === id; })[0] || null; }
  function team(id) { return teams.filter(function (x) { return x.id === id; })[0] || null; }
  /* build 198 (Muhanad, 25 Nov 2026: "the name of the team would be the name of the manager, for example
     <manager>'s team"): read from whoever manages it now, so it is right the day the manager changes.
     A team with no manager keeps the name it was made with. */
  function teamLabel(tm) {
    if (!tm) return '';
    var m = person(tm.manager_id);
    return m ? t('{name}’s team', { name: m.name }) : tm.name;
  }

  /* ---- THE HISTORY (build 136) -----------------------------------------
     Muhanad, 2026-10-09: a wrong entry is corrected by the manager for his team and by the admin for
     everybody, a contract by the admin only, and every such change "should reads in a place ... in
     nehal account and the director account and the cco to make sure there is no minpulation". Agreed
     on a mock (2026-10-10): the place is this tab. It is the store's own record (mm_audit), which the
     store writes in the same step as the change and which nobody can write to, the admin included.
     One line for each entry recorded, cancelled, taken back the same day by the person who made it,
     or removed with a reason. An offer is not in it: an offer is never removed.
     It is also where she removes a wrong entry: a line whose entry still stands opens with the
     reason field and the button. The store asks "is this the admin?" itself (mm_remove).
     The lines come 200 at a time, the newest first. Which entries still stand is read whole, page by
     page: the store hands over one page of rows per question and says nothing when it stops. */
  var HPAGE = 200;
  var hist = { rows: null, standing: {}, more: false, filter: 'all', busy: false, failed: false, plans: false };
  function getAll(path) {
    var out = [];
    var next = function (from) {
      return MM.auth.call(path + '&limit=1000&offset=' + from).then(function (r) {
        if (r.status !== 200 || !Array.isArray(r.body)) throw new Error('store');
        out = out.concat(r.body);
        return r.body.length ? next(from + r.body.length) : out;
      });
    };
    return next(0);
  }
  function loadHistory(older) {
    var from = older && hist.rows ? hist.rows.length : 0;
    hist.busy = true;
    return Promise.all([
      MM.auth.call('/rest/v1/mm_audit?select=id,at,by_id,action,detail&action=in.(record,cancel,take_back,remove,hand_over,set_plan)&order=id.desc&limit=' + HPAGE + '&offset=' + from),
      /* build 141: with each standing entry, the plan a contract was signed on and its unit type. A
         store that has not had the build 141 file pasted yet has no such column and refuses the
         question: it is then asked the way it was before, and no contract is offered a plan to add. */
      older ? Promise.resolve(null) : getAll('/rest/v1/mm_events?select=id,kind,ended,product,plan,plan_down,plan_years&kind=neq.offer&order=id.asc').then(function (rows) { hist.plans = true; return rows; }, function () {
        hist.plans = false;
        return getAll('/rest/v1/mm_events?select=id,kind,ended&kind=neq.offer&order=id.asc');
      })
    ]).then(function (r) {
      if (r[0].status !== 200 || !Array.isArray(r[0].body)) throw new Error('store');
      hist.rows = (older && hist.rows ? hist.rows : []).concat(r[0].body);
      hist.more = r[0].body.length === HPAGE;
      if (r[1]) { hist.standing = {}; r[1].forEach(function (e) { hist.standing[e.id] = e; }); }
      hist.busy = false; hist.failed = false;
    }).catch(function () { hist.busy = false; hist.failed = true; });
  }
  var KINDL = { offer: t('Special request'), orientation: t('Orientation'), workshop: t('Workshop'), meeting: t('Meeting'), reservation: t('Reservation'), contract: t('Contract'), cancel: t('Cancelled reservation') };
  var ACT = { record: ['rec', t('Recorded')], cancel: ['', t('Cancelled')], take_back: ['tb', t('Taken back the same day')], remove: ['rm', t('Removed')], hand_over: ['ho', t('Handed over')], set_plan: ['rec', t('Plan added')] };
  var PRODL = { 'Commercial': t('Commercial'), 'Offices': t('Offices'), 'The Fourth': 'The Fourth', 'Clinics': t('Clinics'), 'Serviced apartments': t('Serviced apartments') };
  var WHYL = { 'Client withdrew': t('Client withdrew'), 'Payment not made': t('Payment not made'), 'Moved to another unit': t('Moved to another unit'), 'Other': t('Other') };
  var LOCALE = AR ? 'ar-EG-u-nu-latn' : 'en-GB';
  function companyName(id) { var c = companies.filter(function (x) { return x.id === id; })[0]; return c ? c.name : t('a company no longer listed'); }
  function money(v) { return t('EGP {n}', { n: Math.round(Number(v)).toLocaleString('en-US') }); }
  /* a moment the store gives, as the day and the time in Cairo; a day the store gives, as it is */
  function whenAt(stamp) { try { return new Intl.DateTimeFormat(LOCALE, { timeZone: 'Africa/Cairo', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(new Date(stamp)); } catch (e) { return ''; } }
  function dayText(iso) { var p = String(iso || '').split('-'); try { return p.length === 3 ? new Intl.DateTimeFormat(LOCALE, { timeZone: 'UTC', day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(Date.UTC(+p[0], +p[1] - 1, +p[2]))) : ''; } catch (e) { return String(iso || ''); } }
  function histTitle(d) { return [KINDL[d.kind] || d.kind, d.unit_code, d.company_id ? companyName(d.company_id) : '', d.value && d.kind !== 'offer' ? money(d.value) : ''].filter(Boolean).join(' · '); }
  function histIs(h, f) { return f === 'all' || (f === 'contract' ? !!h.detail && h.detail.kind === 'contract' : h.action === f); }
  /* build 140, A HAND-OVER (Muhanad, 2026-10-10): an offer a sales manager sent himself and then handed to
     the sales agent it was for, "highlited in the audit history". The line says who sent it and to whom
     it went; on a change, from whom, and the reason the manager wrote. */
  function handed(h) {
    var d = h.detail || {}, sent = person(d.sent_by || h.by_id), to = person(d.person_id), from = person(d.from_person_id);
    return [sent ? t('Sent by {name}', { name: nm(sent.name) }) : '',
      to ? (from ? t('From {a} to {b}', { a: nm(from.name), b: nm(to.name) }) : t('Handed to {name}', { name: nm(to.name) })) : ''].filter(Boolean);
  }
  /* build 214: a line under its day, the time on the right; "Recorded" is most lines, so only the other kinds are named;
     "by" is said only when somebody else did it */
  function partAt(stamp, o) { try { o.timeZone = 'Africa/Cairo'; return new Intl.DateTimeFormat(LOCALE, o).format(new Date(stamp)); } catch (e) { return ''; } }
  function histLine(h) {
    var d = h.detail || {}, a = ACT[h.action] || ['', h.action], by = person(h.by_id), who = person(d.person_id), who2 = person(d.person2_id);
    var bits = [who ? nm(who.name) + (who2 ? ' + ' + nm(who2.name) : '') : '', by && (!who || by.id !== who.id) ? t('by {name}', { name: nm(by.name) }) : ''].filter(Boolean);
    if (h.action === 'hand_over') bits = handed(h);
    return '<button class="hl" type="button" data-h="' + esc(h.id) + '">' + (h.action === 'record' ? '' : '<span class="k ' + a[0] + '">' + a[1] + '</span>') + '<b><span>' + esc(histTitle(d)) + '</span><bdi class="hl-t">' + esc(partAt(h.at, { hour: '2-digit', minute: '2-digit', hour12: false })) + '</bdi></b><small>' + bits.join(' · ') + '</small>' +
      ((h.action === 'remove' || h.action === 'hand_over') && d.reason ? '<q>' + esc(d.reason) + '</q>' : (h.action === 'cancel' && d.why ? '<small>' + (WHYL[d.why] || esc(d.why)) + '</small>' : (h.action === 'set_plan' && d.plan ? '<small>' + nm(MM.contractPlan.text(d.plan, d.plan_down, d.plan_years)) + '</small>' : ''))) + '</button>';
  }
  function screenHistory() {
    var html = head(t('History'), t('Every entry, the newest first. Tap one to correct it.'));
    if (hist.rows === null) return html + '<p class="note center">' + (hist.failed ? t('The history could not be opened. Check the connection and open the page again.') : t('Opening the history…')) + '</p>';
    var shown = hist.rows.filter(function (h) { return histIs(h, hist.filter); });
    html += '<div class="chips">' + [['all', t('All')], ['remove', t('Removed')], ['take_back', t('Taken back')], ['cancel', t('Cancelled')], ['hand_over', t('Handed over')], ['contract', t('Contracts')]].map(function (c) {
      /* a count is shown only when every line is on the page: a count of the first 200 would be a wrong number */
      return '<button class="chip" type="button" data-hf="' + c[0] + '" aria-pressed="' + (hist.filter === c[0]) + '">' + c[1] + (hist.more ? '' : ' ' + hist.rows.filter(function (h) { return histIs(h, c[0]); }).length) + '</button>';
    }).join('') + '</div>';
    var days = [];
    shown.forEach(function (h) { var k = partAt(h.at, { day: 'numeric', month: 'long', year: 'numeric' }); if (!days.length || days[days.length - 1].k !== k) days.push({ k: k, rows: [] }); days[days.length - 1].rows.push(h); });
    html += shown.length ? '<section class="card adm-days">' + days.map(function (g) { return '<p class="hist-day"><bdi>' + esc(g.k) + '</bdi></p><div class="hist">' + g.rows.map(histLine).join('') + '</div>'; }).join('') + '</section>' : '<p class="note center">' + t('Nothing here yet.') + '</p>';
    if (hist.more) html += '<button class="btn ghost" type="button" id="hMore">' + t('Show older lines') + '</button>';
    return html;
  }
  function openHistory(id) {
    var h = (hist.rows || []).filter(function (x) { return String(x.id) === String(id); })[0]; if (!h) return;
    var d = h.detail || {}, a = ACT[h.action] || ['', h.action], by = person(h.by_id), who = person(d.person_id), who2 = person(d.person2_id), live = hist.standing[d.id], act = '';
    var rows = [[t('Brokerage company'), nm(d.company_id ? companyName(d.company_id) : '')], [t('Date'), '<bdi>' + esc(dayText(d.on_date)) + '</bdi>']];
    if (d.unit_code) rows.push([t('Unit'), nm((d.product ? (PRODL[d.product] || d.product) + ' ' : '') + d.unit_code) + (d.area ? ' · ' + t('{n} m²', { n: Number(d.area) }) : '')]);
    else if (d.product) rows.push([t('Unit type'), PRODL[d.product] || esc(d.product)]);
    /* an offer carries the unit's list price, which is no deal: it is not shown as one (build 140) */
    if (d.value && d.kind !== 'offer') rows.push([d.kind === 'contract' ? t('Contract price') : t('Reservation price'), money(d.value)]);
    /* build 141: the plan a contract was signed on. A line keeps the contract as it was when the line
       was written; a plan the admin added since is read from the contract as it stands today. */
    var plan = d.plan ? d : (live && live.plan ? live : null);
    if (d.kind === 'contract') rows.push([t('Payment plan'), plan ? nm(MM.contractPlan.text(plan.plan, plan.plan_down, plan.plan_years)) : t('Not recorded')]);
    if (who) rows.push([t('Sales agent'), nm(who.name) + (who2 ? ' + ' + nm(who2.name) : '')]);
    if (d.why) rows.push([t('Reason'), WHYL[d.why] || esc(d.why)]);
    if (h.action === 'hand_over') {
      var sent = person(d.sent_by || h.by_id), from = person(d.from_person_id);
      if (sent) rows.push([t('Sent by'), nm(sent.name)]);
      if (from) rows.push([t('Taken from'), nm(from.name)]);
    }
    rows.push([a[1], (by ? nm(by.name) + ' · ' : '') + '<bdi>' + esc(whenAt(h.at)) + '</bdi>']);
    if (h.action === 'hand_over' && d.reason) rows.push([t('Why it was changed'), esc(d.reason)]);
    if (h.action === 'remove') rows.push([t('Why it was removed'), esc(d.reason || '')]);
    if (h.action === 'record' || h.action === 'cancel') {
      if (!live) act = '<p class="note">' + t('This entry has since been removed or taken back. It is no longer counted.') + '</p>';
      else if (live.kind === 'reservation' && live.ended) act = '<p class="note">' + (live.ended === 'contract' ? t('This reservation was signed. Remove its contract first.') : t('This reservation was cancelled. Remove the cancellation first.')) + '</p>';
      else act = addPlan(live) + '<label class="fld">' + t('Why is it being removed') + '<input id="hWhy" type="text" maxlength="200" autocomplete="off"></label><p class="note bad" id="aErr" hidden></p>' +
        '<button class="btn' + (addPlan(live) ? ' ghost' : '') + '" type="button" id="hGo" data-id="' + esc(d.id) + '">' + t('Remove this entry') + '</button>' +
        '<p class="note">' + t('A reason is required. The removal and its reason stay in this history. To correct the entry, the sales agent or their manager records it again.') + '</p>';
    }
    var facts = '<div class="facts">' + rows.map(function (r) { return '<div><span>' + r[0] + '</span><b>' + r[1] + '</b></div>'; }).join('') + '</div>';
    var title = KINDL[d.kind] || esc(d.kind || ''), sub = a[1] + (d.company_id ? ' · ' + nm(companyName(d.company_id)) : '');
    /* build 214: an entry she can correct opens as two steps: what it is, then how to correct it */
    if (live && /id="hGo"/.test(act)) return flow(title, sub, [
      { label: t('The entry'), q: t('Is this the entry to correct?'), html: facts },
      { label: t('Correct'), last: true, q: t('How do you correct it?'), html: act.split('<p class="note bad" id="aErr" hidden></p>').join('') }]);
    showSheet('<div><h3>' + title + '</h3><p class="role">' + sub + '</p></div>' + facts + '<div class="form">' + act + '</div>');
  }
  /* build 141, A CONTRACT RECORDED BEFORE THE PLAN WAS ASKED FOR (Muhanad, 2026-10-11: such a contract
     stays as it is, shown with no plan, and the admin can add the plan). The line of a contract that
     still stands and has no plan opens with the plan line of the Record form (MM.contractPlan,
     js/auth.js) and its own button, above the way to remove it. The store asks "is this the admin?"
     itself, saves the plan and writes the line of the history in one step (mm_set_plan). A plan that
     is saved is not changed here: a wrong one is corrected like anything else on a contract, removed
     with a reason and recorded again. */
  function addPlan(live) {
    if (!hist.plans || !live || live.kind !== 'contract' || live.plan) return '';
    return MM.contractPlan.field(live.product || undefined, '') + '<p class="note bad" id="pErr" hidden></p>' +
      '<button class="btn" type="button" id="hPlan" data-id="' + esc(live.id) + '" data-product="' + esc(live.product || '') + '">' + t('Save the payment plan') + '</button>' +
      '<p class="note">' + t('This contract was recorded with no payment plan. Once saved, the plan is in the history and is not changed here.') + '</p>';
  }
  function savePlan(btn) {
    var no = function (msg) { var n = $('pErr'); if (n) { n.textContent = msg; n.hidden = false; } };
    var pl = MM.contractPlan.read($('rPl').value, btn.dataset.product || undefined, $('rPd').value, $('rPy').value);
    if (pl.missing) return no(pl.missing === 'plan' ? t('Pick the payment plan the customer signed.') : t('Type the down payment, from 0 to 100, and the years, up to 30.'));
    btn.disabled = true; $('pErr').hidden = true;
    rpc('mm_set_plan', { p_contract: btn.dataset.id, p_plan: pl.id, p_plan_down: pl.down, p_plan_years: pl.years }).then(function (r) {
      btn.disabled = false;
      if (r.status >= 300) return no(why(r));
      closeSheet();
      loadHistory().then(function () { draw(); toast(t('Saved. The plan is in the history.')); });
    }, function () { btn.disabled = false; no(t('No connection. Try again when you are online.')); });
  }
  function removeEntry(btn) {
    var why = ($('hWhy') ? $('hWhy').value : '').replace(/\s+/g, ' ').trim();
    if (why.length < 3) return bad(t('Write why it is being removed.'));
    send(btn, rpc('mm_remove', { p_id: btn.dataset.id, p_reason: why }), function () {
      closeSheet();
      loadHistory().then(function () { draw(); toast(t('Removed. It is in the history with your reason.')); });
    });
  }

  /* ---- the email, from the name and the role -------------------------
     First two names, small letters, a dot between. "Abd el-Rahman Saleh"
     is abdelrahman.saleh: a particle joins the name it belongs to. */
  var PARTICLE = { abd: 1, abdel: 1, abdul: 1, el: 1, al: 1, abu: 1, abo: 1 };
  function suggestEmail(name, role) {
    var words = String(name || '').toLowerCase().replace(/[^a-z\s-]/g, ' ').split(/\s+/).map(function (w) { return w.replace(/-/g, ''); }).filter(Boolean);
    var out = [], i = 0, w;
    while (i < words.length && out.length < 2) {
      w = words[i++];
      while (PARTICLE[w] && i < words.length) w += words[i++];
      out.push(w);
    }
    if (!out.length || !ENDING[role]) return '';
    return out.join('.') + '@mainmarks-' + ENDING[role] + '.com';
  }

  /* build 211 (Muhanad, 27 Nov 2026): her Analysis tab and Companies > Activity (js/admin-analysis.js) */
  var AN0 = null;
  function an() {
    return AN0 || (AN0 = MM.adminAnalysis({ esc: esc, nm: nm, dayText: dayText, getAll: getAll, session: session, demo: !!BOOK, head: head, draw: function () { draw(); },
      people: function () { return people; }, teams: function () { return teams; }, companies: function () { return companies; },
      person: person, team: team, teamLabel: teamLabel, initials: initials, bySeniority: bySeniority, showSheet: showSheet, toast: toast,
      tab: function () { return tab; }, go: function (k) { tab = k; find = ''; draw(); window.scrollTo(0, 0); } }));
  }

  /* ---- the screen ----------------------------------------------------- */
  /* build 214 (Muhanad, 28 Nov 2026: "why the analysis tab is the first one ... her experience in the app should be the
     best"; he chose Home first and five tabs). Her day is decisions, so Home opens with what waits for her. History opens
     from Home (Correct an entry), her account from her initials at the top of every screen. */
  var tab = DEMO && !BOOK ? 'plans' : 'home', filter = 'all', find = '', opener = null;
  var TABS = (DEMO && !BOOK ? [] : [['home', 'Home'], ['companies', 'Companies'], ['people', 'People'], ['analysis', 'Analysis']]).concat(PB ? [['plans', 'Plans']] : []);
  var ICON = {
    home: '<path d="M4 10.5 12 4l8 6.5V20H4z"/><path d="M10 20v-5h4v5"/>',
    dl: '<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>',
    fix: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13.5 6.5l4 4"/>',
    people: '<path d="M16 19v-1a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v1"/><circle cx="9.5" cy="7" r="3.5"/><path d="M21 19v-1a4 4 0 0 0-3-3.8M16 3.6a3.5 3.5 0 0 1 0 6.8"/>',
    companies: '<path d="M4 20V6l8-3v17M12 9h8v11M2 20h20M7 9v0M7 13v0M7 17v0M16 13v0M16 17v0"/>',
    analysis: '<path d="M4 4v16h16"/><path d="M9 16v-4M13.5 16V8.5M18 16V6"/>',
    me: '<circle cx="12" cy="8" r="4"/><path d="M4 20a8 8 0 0 1 16 0"/>',
    history: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
    plans: '<rect x="4" y="3.5" width="16" height="17" rx="2.5"/><path d="M8 8.5h8M8 12.5h8M8 16.5h4.5"/>',
    plus: '<path d="M12 5v14M5 12h14"/>'
  };
  function svg(k) { return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + ICON[k] + '</svg>'; }

  /* build 214: the line "Name · Admin" is gone (her initials say who she is); the + sits at the top beside them
     instead of floating over the page, and History and Account have a way back to Home */
  function head(h, sub) {
    var add = tab === 'people' ? t('Add a person') : tab === 'plans' && PB ? t('Add a payment plan') : tab === 'companies' && !an().activity() ? t('Add a company') : '';
    var back = tab === 'history' || tab === 'me';
    return '<div class="hd my adm-hd">' + (back ? '<button class="adm-back" type="button" data-go-tab="home">' + (AR ? '› ' : '‹ ') + t('Home') + '</button>' : '') + '<h1>' + h + '</h1><div class="adm-acts">' +
      (add ? '<button class="adm-act plus" type="button" id="topAdd" aria-label="' + esc(add) + '">' + svg('plus') + '</button>' : '') +
      (tab === 'me' ? '' : '<button class="adm-act me" type="button" id="toMe" aria-label="' + esc(t('Account')) + '">' + esc(initials(session.name)) + '</button>') +
      '</div></div>' + (sub ? '<p class="showing">' + sub + '</p>' : '');
  }
  function matches(text) { return !find || String(text).toLowerCase().indexOf(find.toLowerCase()) !== -1; }

  function flags(p) {
    var flag = !p.active ? '<span class="adm-flag off">' + t('Switched off') + '</span>' : (p.must_change_password ? '<span class="adm-flag">' + t('First password') + '</span>' : '');
    /* build 127: how many company names he sent that turned out to be listed companies spelled differently */
    if (p.wrong_names > 0) flag += '<span class="adm-flag off">' + t('Wrong spellings: {n} of 3', { n: p.wrong_names }) + '</span>';
    return flag;
  }
  /* build 198: a row is the name and the job; the email is in his sheet */
  function personRow(p, tag) {
    return '<button class="row adm-person' + (p.active ? '' : ' gone') + (tag ? ' adm-lead-row' : '') + '" type="button" data-p="' + esc(p.id) + '"><span class="nm">' + nm(p.name) + '</span>' +
      '<span class="sub">' + (tag ? '<b class="adm-tag">' + tag + '</b>' : '') + (p.title ? esc(p.title) : roleName(p.role)) + '</span><span class="val code">' + flags(p) + '</span></button>';
  }
  var LEAD = { director: 1, cco: 1 };
  /* who is shown under the chosen chip and what is typed in the find box */
  function showsUp(p) {
    if (filter === 'lead') { if (!LEAD[p.role] || !p.active) return false; }
    else if (filter === 'off') { if (p.active) return false; }
    else if (filter !== 'all' && (p.role !== filter || !p.active)) return false;
    return matches(p.name + ' ' + p.email + ' ' + (p.staff_code || '') + ' ' + (p.title || ''));
  }
  var byName = function (a, b) { return a.name.localeCompare(b.name); };
  /* build 198 (Muhanad: "check the last Excel sheet that shows the hierarchy"): the order of the company's sheet
     (New Sales Structure, 05 Nov 2026). Directors and teams by the staff code of the director and of the
     manager, the oldest first (the lowest staff code number first, as the sheet lists them); a team's people
     by rank as the sheet lists them, then by name. No staff name or code here: this file is published. */
  var codeNo = function (p) { var m = p && /(\d+)/.exec(p.staff_code || ''); return m ? +m[1] : 1e9; };
  var bySeniority = function (a, b) { return codeNo(a) - codeNo(b) || byName(a, b); };
  var RANK = [/assistant\s+sales\s+manager/i, /supervisor/i, /senior\s+property\s+consultant/i, /property\s+consultant/i];
  var rankOf = function (p) { for (var i = 0; i < RANK.length; i++) if (RANK[i].test(p.title || '')) return i; return RANK.length; };
  var byTeamOrder = function (x, y) { return bySeniority(person(x.manager_id), person(y.manager_id)) || x.name.localeCompare(y.name); };
  /* one team: its name (its manager's), how many are in it, the manager first, his sales agents under him */
  function teamCard(tm) {
    var mgr = person(tm.manager_id);
    var members = people.filter(function (p) { return p.team_id === tm.id && p.id !== tm.manager_id; });
    var on = members.filter(function (p) { return p.active; }).length + (mgr && mgr.active ? 1 : 0);
    var agents = members.filter(showsUp).sort(function (a, b) { return (b.active - a.active) || (b.role === 'sales_manager') - (a.role === 'sales_manager') || rankOf(a) - rankOf(b) || byName(a, b); });
    var mgrShown = mgr && showsUp(mgr);
    var quiet = find || filter !== 'all';
    if (quiet && !mgrShown && !agents.length) return '';
    return '<section class="card adm-team"><div class="adm-team-hd"><h2>' + nm(teamLabel(tm)) + '</h2><span class="adm-count" title="' + esc(t('Active accounts')) + '">' + on + '</span></div>' +
      (!mgr ? '<p class="note">' + t('No manager yet') + '</p>' : '') +
      (mgrShown || agents.length ? '<div class="rows">' + (mgrShown ? personRow(mgr, t('Manager')) : '') + agents.map(function (p) { return personRow(p); }).join('') + '</div>'
        : '<p class="note">' + t('Nobody is in this team yet.') + '</p>') +
      '<button class="also adm-link" type="button" data-team="' + esc(tm.id) + '">' + t('Change the manager or director') + '</button></section>';
  }
  /* ---- BUILD 209, THE PEOPLE TAB AS THE COMPANY'S TREE (Muhanad, 26 Nov 2026: "showing the cco name in a
     card and under it to other tabs for each director then pressing on the director the manager names
     appear and when the manager is clicked a glassy pop up with the team agents"). Only when nothing is
     typed in the find box and the chip is Everyone; a search or another chip shows the full list as before. */
  var dirPick = null, glassTeam = null, backTo = null;
  var activeIn = function (tm) { return people.filter(function (p) { return p.active && (p.team_id === tm.id || p.id === tm.manager_id); }).filter(function (p, i, a) { return a.indexOf(p) === i; }).length; };
  var initials = function (s) { return String(s || '').trim().split(/\s+/).slice(0, 2).map(function (w) { return w.charAt(0); }).join('').toUpperCase(); };
  /* who in a team needs her: a first password not yet changed, or wrong company spellings */
  var needsHer = function (p) { return p.active && (p.must_change_password || p.wrong_names > 0); };
  function teamPeople(tm) {
    var mgr = person(tm.manager_id);
    var agents = people.filter(function (p) { return p.team_id === tm.id && p.id !== tm.manager_id; })
      .sort(function (a, b) { return (b.active - a.active) || (b.role === 'sales_manager') - (a.role === 'sales_manager') || rankOf(a) - rankOf(b) || byName(a, b); });
    return { mgr: mgr, agents: agents, all: (mgr ? [mgr] : []).concat(agents) };
  }
  function mgrCard(tm) {
    var tp = teamPeople(tm), n = activeIn(tm), alert = tp.all.filter(needsHer).length, off = tp.all.filter(function (p) { return !p.active; }).length;
    var who = tp.mgr ? tp.mgr.name : tm.name;
    return '<button class="adm-mgr' + (tp.mgr && !tp.mgr.active ? ' gone' : '') + '" type="button" data-mt="' + esc(tm.id) + '">' +
      '<span class="adm-av" aria-hidden="true">' + esc(initials(who)) + '</span>' +
      '<span class="adm-mgr-nm">' + nm(who) + '</span>' +
      '<span class="adm-mgr-sub">' + (tp.mgr ? t('Manager') : t('No manager yet')) + (alert ? '<span class="adm-dot">' + t('{n} to check', { n: alert }) + '</span>' : '') + '</span>' +
      '<span class="adm-mgr-n"><b>' + n + '</b> ' + t('active') + (off ? ' · ' + off + ' ' + t('off') : '') + '</span></button>';
  }
  function treePeople() {
    var html = '';
    var all = people.filter(function (p) { return p.active && p.role !== 'admin'; }).length;
    var dirs = people.filter(function (p) { return p.role === 'director' && (p.active || teams.some(function (x) { return x.director_id === p.id; })); }).sort(bySeniority);
    var free = teams.filter(function (x) { return !x.director_id || !person(x.director_id) || person(x.director_id).role !== 'director'; }).sort(byTeamOrder);
    /* the CCO: the top card, with the size of the whole company */
    var ccos = people.filter(function (p) { return p.role === 'cco' && p.active; }).sort(byName);
    var stats = '<div class="adm-stats"><div><b>' + dirs.filter(function (d) { return d.active; }).length + '</b><span>' + t('Directors') + '</span></div><div><b>' + teams.length + '</b><span>' + t('Teams') + '</span></div><div><b>' + all + '</b><span>' + t('Active') + '</span></div></div>';
    html += ccos.length ? ccos.map(function (c, i) {
      return '<section class="adm-top"><button class="adm-top-hd" type="button" data-p="' + esc(c.id) + '"><span class="adm-av big" aria-hidden="true">' + esc(initials(c.name)) + '</span><span class="adm-top-tx"><span class="adm-k">' + t('CCO') + '</span><span class="adm-top-nm">' + nm(c.name) + '</span>' +
        (c.title && c.title.toLowerCase() !== t('CCO').toLowerCase() && c.title.toLowerCase() !== 'cco' ? '<span class="adm-top-sub">' + esc(c.title) + '</span>' : '') + '</span></button>' + (i === ccos.length - 1 ? stats : '') + '</section>';
    }).join('') : '<section class="adm-top">' + stats + '</section>';
    /* a tab for each director, and one for the teams no director leads yet */
    var tabs = dirs.map(function (d) { return { id: d.id, name: d.name, d: d, teams: teams.filter(function (x) { return x.director_id === d.id; }).sort(byTeamOrder) }; });
    if (free.length) tabs.push({ id: 'free', name: t('No director yet'), d: null, teams: free });
    if (!tabs.some(function (x) { return x.id === dirPick; })) dirPick = tabs.length ? tabs[0].id : null;
    if (tabs.length) {
      html += '<div class="adm-dtabs" role="tablist" aria-label="' + esc(t('Sales director')) + '">' + tabs.map(function (x) {
        var n = x.teams.reduce(function (s, tm) { return s + activeIn(tm); }, 0);
        return '<button type="button" role="tab" data-dir="' + esc(x.id) + '" aria-selected="' + (x.id === dirPick) + '"' + (x.d && !x.d.active ? ' class="gone"' : '') + '><span>' + nm(x.name) + '</span><small>' + t(x.teams.length === 1 ? '1 team · {n} people' : '{t} teams · {n} people', { t: x.teams.length, n: n }) + '</small></button>';
      }).join('') + '</div>';
      var cur = tabs.filter(function (x) { return x.id === dirPick; })[0];
      html += '<section class="adm-dpane" role="tabpanel">';
      if (cur.d) html += '<button class="adm-dline' + (cur.d.active ? '' : ' gone') + '" type="button" data-p="' + esc(cur.d.id) + '"><span class="adm-k">' + t('Sales director') + '</span><span class="adm-dline-nm">' + nm(cur.d.name) + '</span>' + (cur.d.active ? '' : '<span class="adm-flag off">' + t('Switched off') + '</span>') + '</button>';
      html += cur.teams.length ? '<p class="adm-k adm-k-pad">' + t('Managers') + '</p><div class="adm-mgrs">' + cur.teams.map(mgrCard).join('') + '</div>'
        : '<p class="note adm-dir-none">' + t('No team under this director yet. Open a team and choose its director.') + '</p>';
      html += '</section>';
    }
    var loose = people.filter(function (p) { return p.active && !LEAD[p.role] && p.role !== 'admin' && (!p.team_id || !team(p.team_id)) && !teams.some(function (x) { return x.manager_id === p.id; }); }).sort(byName);
    if (loose.length) html += '<section class="card"><h2>' + t('Not in a team') + '</h2><div class="rows">' + loose.map(function (p) { return personRow(p); }).join('') + '</div></section>';
    var admins = people.filter(function (p) { return p.role === 'admin' && p.active; }).sort(byName);
    if (admins.length) html += '<section class="card"><h2>' + t('Admins') + '</h2><div class="rows">' + admins.map(function (p) { return personRow(p); }).join('') + '</div></section>';
    return html + '<button class="btn ghost" type="button" id="addTeam">' + t('Add a team') + '</button>';
  }
  /* the team, in a pane of glass over the blurred page */
  function openTeamGlass(id) {
    var tm = team(id); if (!tm) return;
    var tp = teamPeople(tm), d = person(tm.director_id);
    var cnt = function (f) { return tp.all.filter(f).length; };
    var box = $('tw');
    if (!box) { box = document.createElement('div'); box.id = 'tw'; box.setAttribute('role', 'dialog'); box.setAttribute('aria-modal', 'true'); document.body.appendChild(box); }
    if (!glassTeam) opener = document.activeElement;
    glassTeam = id;
    box.setAttribute('aria-label', teamLabel(tm));
    box.innerHTML = '<div class="adm-win"><button class="adm-wx" type="button" id="twX" aria-label="' + esc(t('Close')) + '">✕</button>' +
      '<p class="eyebrow">' + (d ? nm(d.name) + ' · ' + t('Sales director') : t('No director yet')) + '</p><h3>' + nm(teamLabel(tm)) + '</h3>' +
      '<div class="adm-stats small"><div><b>' + cnt(function (p) { return p.active; }) + '</b><span>' + t('active') + '</span></div><div><b>' + cnt(needsHer) + '</b><span>' + t('Needs a look') + '</span></div><div><b>' + cnt(function (p) { return !p.active; }) + '</b><span>' + t('Switched off') + '</span></div></div>' +
      (tp.all.length ? '<div class="rows">' + (tp.mgr ? personRow(tp.mgr, t('Manager')) : '') + tp.agents.map(function (p) { return personRow(p); }).join('') + '</div>' : '<p class="note">' + t('Nobody is in this team yet.') + '</p>') +
      '<button class="btn ghost" type="button" data-team="' + esc(tm.id) + '">' + t('Change the manager or director') + '</button></div>';
    document.documentElement.classList.add('is-locked');
    requestAnimationFrame(function () { box.classList.add('on'); var x = $('twX'); if (x) x.focus({ preventScroll: true }); });
  }
  function closeTeamGlass(keepLock) {
    var box = $('tw'); if (!box || !glassTeam) return;
    glassTeam = null; box.classList.remove('on');
    if (!keepLock) { document.documentElement.classList.remove('is-locked'); if (opener && document.contains(opener)) opener.focus({ preventScroll: true }); }
  }
  function screenPeople() {
    if (!find && filter === 'all') {
      var on0 = people.filter(function (p) { return p.active; }).length;
      return head(t('People'), t('{n} accounts, {off} switched off', { n: '<b>' + people.length + '</b>', off: '<b>' + (people.length - on0) + '</b>' })) +
        '<label class="fld adm-find"><input id="find" type="search" autocomplete="off" placeholder="' + esc(t('Find a name or an email')) + '" value=""></label>' +
        '<div class="chips">' + [['all', t('Everyone')], ['sales', t('Sales agents')], ['sales_manager', t('Managers')], ['lead', t('Directors and CCO')], ['off', t('Switched off')]].map(function (c) { return '<button class="chip" type="button" data-f="' + c[0] + '" aria-pressed="' + (filter === c[0]) + '">' + c[1] + '</button>'; }).join('') + '</div>' +
        treePeople();
    }
    var on = people.filter(function (p) { return p.active; }).length;
    var html = head(t('People'), t('{n} accounts, {off} switched off', { n: '<b>' + people.length + '</b>', off: '<b>' + (people.length - on) + '</b>' })) +
      '<label class="fld adm-find"><input id="find" type="search" autocomplete="off" placeholder="' + esc(t('Find a name or an email')) + '" value="' + esc(find) + '"></label>' +
      '<div class="chips">' + [['all', t('Everyone')], ['sales', t('Sales agents')], ['sales_manager', t('Managers')], ['lead', t('Directors and CCO')], ['off', t('Switched off')]].map(function (c) { return '<button class="chip" type="button" data-f="' + c[0] + '" aria-pressed="' + (filter === c[0]) + '">' + c[1] + '</button>'; }).join('') + '</div>';
    var quiet = find || filter !== 'all', any = false;
    /* switched off: one plain list, whoever they were */
    if (filter === 'off') {
      var off = people.filter(showsUp).sort(byName);
      if (off.length) html += '<section class="card"><div class="rows">' + off.map(function (p) { return personRow(p); }).join('') + '</div></section>';
      return html + (off.length ? '' : '<p class="note center">' + t('Nobody matches.') + '</p>');
    }
    /* the CCO sees every team: first */
    var ccos = people.filter(function (p) { return p.role === 'cco' && p.active && showsUp(p); }).sort(byName);
    if (ccos.length) { any = true; html += '<section class="card"><h2>' + t('CCO') + '</h2><div class="rows">' + ccos.map(function (p) { return personRow(p); }).join('') + '</div></section>'; }
    /* each director, and the teams he leads under him */
    var dirs = people.filter(function (p) { return p.role === 'director' && (p.active || teams.some(function (x) { return x.director_id === p.id; })); }).sort(bySeniority);
    dirs.forEach(function (d) {
      var mine = teams.filter(function (x) { return x.director_id === d.id; }).sort(byTeamOrder);
      var cards = filter === 'lead' ? '' : mine.map(teamCard).join('');
      var dShown = showsUp(d);
      if (quiet && !dShown && !cards) return;
      any = true;
      var size = mine.reduce(function (n, x) { return n + people.filter(function (p) { return p.team_id === x.id && p.active; }).length; }, 0);
      html += '<section class="adm-dir"><button class="adm-dir-hd' + (d.active ? '' : ' gone') + '" type="button" data-p="' + esc(d.id) + '"><span class="adm-k">' + t('Sales director') + '</span>' +
        '<span class="adm-dir-nm">' + nm(d.name) + '</span><span class="adm-dir-sub">' + t('Teams: {n}', { n: mine.length }) + ' · ' + t('People: {n}', { n: size }) + (d.active ? '' : ' · ' + t('Switched off')) + '</span></button>' +
        (cards ? '<div class="adm-dir-teams">' + cards + '</div>' : (mine.length || filter === 'lead' ? '' : '<p class="note adm-dir-none">' + t('No team under this director yet. Open a team and choose its director.') + '</p>')) + '</section>';
    });
    /* teams no director leads yet */
    if (filter !== 'lead') {
      var free = teams.filter(function (x) { return !x.director_id || !person(x.director_id) || person(x.director_id).role !== 'director'; });
      var freeCards = free.sort(byTeamOrder).map(teamCard).join('');
      if (freeCards) {
        any = true;
        html += '<section class="adm-dir"><div class="adm-dir-hd flat"><span class="adm-k">' + (dirs.length ? t('No director yet') : t('Teams')) + '</span></div><div class="adm-dir-teams">' + freeCards + '</div></section>';
      }
      /* sales agents and managers in no team */
      var loose = people.filter(function (p) { return !LEAD[p.role] && p.role !== 'admin' && (!p.team_id || !team(p.team_id)) && !teams.some(function (x) { return x.manager_id === p.id; }) && showsUp(p); }).sort(byName);
      if (loose.length) { any = true; html += '<section class="card"><h2>' + t('Not in a team') + '</h2><div class="rows">' + loose.map(function (p) { return personRow(p); }).join('') + '</div></section>'; }
      var admins = people.filter(function (p) { return p.role === 'admin' && p.active && showsUp(p); }).sort(byName);
      if (admins.length) { any = true; html += '<section class="card"><h2>' + t('Admins') + '</h2><div class="rows">' + admins.map(function (p) { return personRow(p); }).join('') + '</div></section>'; }
    }
    if (!any) html += '<p class="note center">' + t('Nobody matches.') + '</p>';
    if (!quiet) html += '<button class="btn ghost" type="button" id="addTeam">' + t('Add a team') + '</button>';
    return html;
  }
  function screenCompanies() {
    /* build 127: names sales agents sent that are not on the list wait here for her; a spelling she
       moved onto a listed company is not a company and is not listed */
    var waiting = companies.filter(function (c) { return c.pending; });
    var real = companies.filter(function (c) { return !c.pending && !c.merged_into; });
    /* build 139: found as the Record form finds a company (MM.nameFind, js/auth.js): the names that
       begin with what she typed first; letters inside a word only from the third letter */
    var found = MM.nameFind(real, find, function (c) { return c.name; });
    var shown = found ? found.map(function (x) { return x.item; }) : real;
    var on = real.filter(function (c) { return c.active; }).length;
    /* build 149: sales agents who sent offers to a company she gave to others, waiting for her word */
    var asking = asks.filter(function (a) { return a.status === 'waiting' && company(a.company_id) && person(a.person_id); });
    return head(t('Companies'), t('{n} companies, {off} switched off', { n: '<b>' + real.length + '</b>', off: '<b>' + (real.length - on) + '</b>' })) +
      /* build 211: Manage | Activity */
      an().cswitch() +
      /* build 214: the two ways to add are in the + at the top */
      (asking.length ? '<section class="card"><h2>' + t('Asking to serve a company') + ' <em>' + asking.length + '</em></h2><p class="note">' + t('Offers sent to a company given to someone else.') + '</p><div class="rows an">' + asking.map(function (a) {
        return '<button class="row" type="button" data-ask="' + esc(a.company_id + '|' + a.person_id) + '"><span class="nm">' + nm(person(a.person_id).name) + '</span><span class="sub">' + t('{company} · given to {names}', { company: nm(company(a.company_id).name), names: servedText(a.company_id) }) + '</span><span class="val code"><span class="adm-flag">' + t('Decide') + '</span></span></button>';
      }).join('') + '</div></section>' : '') +
      (waiting.length ? '<section class="card"><h2>' + t('Waiting for your approval') + ' <em>' + waiting.length + '</em></h2><p class="note">' + t('Names that are not on the list yet.') + '</p><div class="rows an">' + waiting.map(function (c) {
        var by = person(c.proposed_by);
        return '<button class="row" type="button" data-c="' + esc(c.id) + '"><span class="nm">' + nm(c.name) + '</span><span class="sub">' + (by ? t('Sent by {name}', { name: nm(by.name) }) : '') + '</span><span class="val code"><span class="adm-flag">' + t('Decide') + '</span></span></button>';
      }).join('') + '</div></section>' : '') +
      /* build 198 (Muhanad: "the admin can add brokerage companies, not only by adding a list, but also adding individual companies") */
      '<label class="fld adm-find"><input id="find" type="search" autocomplete="off" placeholder="' + esc(t('Find a company')) + '" value="' + esc(find) + '"></label>' +
      /* build 214: one list in the page's own scroll (a list scrolling inside a scrolling page is hard to steer with a
         thumb), drawn a part at a time: about two thousand companies are coming (Muhanad, 2026-10-10) */
      (shown.length ? '<section class="card"><div class="rows an" id="cbox">' + (listRows = shown).slice(0, listShown).map(companyRow).join('') + '</div>' +
          (shown.length > listShown ? '<button class="btn ghost" type="button" id="cMore">' + t('Show {n} more', { n: Math.min(LIST_PART, shown.length - listShown) }) + '</button>' : '') + '</section>'
        : '<p class="note center">' + (companies.length ? t('No company matches.') : t('No company is on the list yet. Add the first one with the plus.')) + '</p>');
  }
  var LIST_FIRST = 6, LIST_PART = 40, listRows = [], listShown = LIST_PART;
  function companyRow(c) {
    var given = (circle[c.id] || []).length;
    return '<button class="row' + (c.active ? '' : ' gone') + '" type="button" data-c="' + esc(c.id) + '"><span class="nm">' + nm(c.name) + '</span><span class="val code">' + (c.active ? '' : '<span class="adm-flag off">' + t('Switched off') + '</span>') +
      (given ? '<span class="adm-flag">' + (given === 1 && person(circle[c.id][0]) ? t('Given to {name}', { name: nm(person(circle[c.id][0]).name) }) : t('Given to {n}', { n: given })) + '</span>' : '') + '</span></button>';
  }
  /* ---- WHO SERVES A COMPANY (build 149; Muhanad, 2026-10-30) ---------------------------------------
     She may give a company to some sales agents: "in case the admin wants the company to be only visible
     for a specific sales only she can do that and therefore the manager and the director above this
     specific sales will see this company". Nobody named = open to all, as before. Another sales agent may
     still send it an offer: it is saved, and he waits here for her word. She lets him serve it too, or
     keeps it with the ones it was given to; then his offers stay saved and say she blocked him. */
  function company(id) { return companies.filter(function (x) { return x.id === id; })[0] || null; }
  function servedText(id) {
    var names = (circle[id] || []).map(person).filter(Boolean).map(function (p) { return nm(p.name); });
    return names.length ? names.join(AR ? '، ' : ', ') : t('Everyone');
  }
  /* the names of the chosen, as one line: "Ahmed Samir, Sara Adel" */
  function whoNames(ids) { return ids.map(person).filter(Boolean).map(function (p) { return p.name; }).join(AR ? '، ' : ', '); }
  function askOf(cid, pid) { return asks.filter(function (a) { return a.company_id === cid && a.person_id === pid; })[0] || null; }
  /* the sales agents she can choose, by team, each a row that is ticked or not */
  function agentPicker(chosen) {
    var on = {}; (chosen || []).forEach(function (id) { on[id] = 1; });
    var agents = people.filter(function (p) { return p.active && p.role === 'sales'; });
    var html = '<label class="fld adm-find"><input id="aPickFind" type="search" autocomplete="off" placeholder="' + esc(t('Find a sales agent')) + '"></label><div class="adm-pickbox" id="aPick">';
    teams.concat([{ id: null, name: t('Not in a team') }]).forEach(function (tm) {
      var rows = agents.filter(function (p) { return tm.id ? p.team_id === tm.id : !team(p.team_id); }).sort(function (a, b) { return a.name.localeCompare(b.name); });
      if (!rows.length) return;
      html += '<p class="sec">' + nm(tm.id ? teamLabel(tm) : tm.name) + '</p><div class="rows">' + rows.map(function (p) {
        return '<button class="row adm-pick" type="button" data-pick="' + esc(p.id) + '" data-name="' + esc(p.name.toLowerCase()) + '" aria-pressed="' + !!on[p.id] + '"><span class="nm">' + nm(p.name) + '</span><span class="val code"><span class="adm-tick" aria-hidden="true"></span></span></button>';
      }).join('') + '</div>';
    });
    return html + '</div>';
  }
  function picked() { return [].map.call(document.querySelectorAll('#aPick [data-pick][aria-pressed="true"]'), function (b) { return b.dataset.pick; }); }
  function pickWords() {
    var n = picked().length, go = $('aServe');
    if (go) go.textContent = n ? t('Save · chosen: {n}', { n: n }) : t('Open it to everyone');
  }
  function openServe(c) {
    showSheet('<div><h3>' + nm(c.name) + '</h3><p class="role">' + t('Who serves this company') + '</p></div><div class="form">' +
      '<p class="note">' + t('Choose the sales agents. Their managers and directors see the company too. Choose nobody to open it to everyone.') + '</p>' +
      agentPicker(circle[c.id]) +
      '<p class="note">' + t('Another sales agent can still send it an offer. The offer is saved, and you are asked to let him serve it.') + '</p>' +
      '<p class="note bad" id="aErr" hidden></p><button class="btn" type="button" id="aServe"></button></div>');
    pickWords();
    $('aServe').addEventListener('click', function () {
      var list = picked();
      send($('aServe'), rpc('mm_admin_set_company_agents', { p_company: c.id, p_agents: list }), function () {
        closeSheet(); again(list.length ? t('{name} is given to {who}.', { name: c.name, who: whoNames(list) }) : t('{name} is open to everyone.', { name: c.name }));
      });
    });
  }
  /* what every sales agent did at this company, read when her sheet opens: the company's record */
  function portfolio(c) {
    var box = $('aPort'); if (!box) return;
    getAll('/rest/v1/mm_events?select=person_id,kind,on_date&company_id=eq.' + c.id + '&order=on_date.desc,id.asc').then(function (rows) {
      if (!$('aPort')) return;
      if (!rows.length) { box.innerHTML = '<p class="note">' + t('Nothing sent or recorded at this company yet.') + '</p>'; return; }
      var by = {}, order = [];
      rows.forEach(function (e) {
        if (!by[e.person_id]) { by[e.person_id] = { offer: 0, other: 0, last: e.on_date }; order.push(e.person_id); }
        by[e.person_id][e.kind === 'offer' ? 'offer' : 'other']++;
      });
      box.innerHTML = '<div class="rows">' + order.map(function (id) {
        var p = person(id), x = by[id], a = askOf(c.id, id), mine = (circle[c.id] || []).indexOf(id) >= 0;
        var flag = mine ? '<span class="adm-flag">' + t('Serves it') + '</span>'
          : a && a.status === 'blocked' ? '<span class="adm-flag off">' + t('Blocked by you') + '</span>'
          : a && a.status === 'waiting' ? '<span class="adm-flag">' + t('Waiting for you') + '</span>' : '';
        var bits = [x.offer ? t('Special requests: {n}', { n: x.offer }) : '', x.other ? t('Other entries: {n}', { n: x.other }) : '', t('last {date}', { date: dayText(x.last) })].filter(Boolean);
        return '<div class="row flat"><span class="nm">' + nm(p ? p.name : t('a person no longer listed')) + '</span><span class="sub">' + bits.join(' · ') + '</span><span class="val code">' + flag + '</span></div>';
      }).join('') + '</div>';
    }, function () { if ($('aPort')) box.innerHTML = '<p class="note">' + t('No connection. Try again when you are online.') + '</p>'; });
  }
  function openAsk(cid, pid) {
    var c = company(cid), p = person(pid), a = askOf(cid, pid);
    if (!c || !p || !a) return;
    var tm = team(p.team_id), keepers = servedText(cid);
    showSheet('<div><h3>' + nm(p.name) + '</h3><p class="role">' + (tm ? nm(teamLabel(tm)) + ' · ' : '') + t('Asks to serve {company}', { company: nm(c.name) }) + '</p></div><div class="form">' +
      '<div class="facts"><div><span>' + t('Company') + '</span><b>' + nm(c.name) + '</b></div><div><span>' + t('Given to') + '</span><b>' + keepers + '</b></div><div><span>' + t('Asked on') + '</span><b><bdi>' + esc(whenAt(a.asked_at)) + '</bdi></b></div></div>' +
      '<p class="sec">' + t('At this company') + '</p><div id="aPort"><p class="note">' + t('Reading…') + '</p></div>' +
      '<button class="btn" type="button" id="aAllow">' + t('Let {name} serve it too', { name: esc(p.name) }) + '</button>' +
      '<button class="btn ghost adm-danger" type="button" id="aBlock">' + t('Keep it with {names}', { names: esc(whoNames(circle[cid] || [])) || t('Everyone') }) + '</button>' +
      '<p class="note">' + t('If you keep it, the offers {name} sent stay saved under {name}’s name, marked as blocked by you.', { name: nm(p.name) }) + '</p>' +
      '<p class="note bad" id="aErr" hidden></p></div>');
    portfolio(c);
    $('aAllow').addEventListener('click', function () {
      send($('aAllow'), rpc('mm_admin_rule_ask', { p_company: cid, p_person: pid, p_allow: true }), function () { closeSheet(); again(t('{name} now serves {company} too.', { name: p.name, company: c.name })); });
    });
    $('aBlock').addEventListener('click', function () {
      send($('aBlock'), rpc('mm_admin_rule_ask', { p_company: cid, p_person: pid, p_allow: false }), function () { closeSheet(); again(t('{company} stays with the sales agents it was given to.', { company: c.name })); });
    });
  }
  /* ---- A LONG LIST OF COMPANIES AT ONCE (build 154, his pick; the demo until the database step) ------
     About 2,000 names are coming (Muhanad, 2026-10-10). She pastes the column from the sheet, or chooses
     a CSV file; js/namecheck.js sorts the names, and she sees the new ones, the ones already listed, the
     ones typed twice, and the ones that look like another company, which she decides one by one, before
     anything is added. Nothing is merged without her. */
  /* build 198: on the real store too (sql MAIN-MARKS-PASTE-BUILD-198.sql, mm_admin_add_companies); the button is at the top of the page */
  function openLoad() {
    showSheet('<div><h3>' + t('Load a list of companies') + '</h3><p class="role">' + t('Nothing is added until you have checked the list.') + '</p></div><div class="form">' +
      '<label class="fld">' + t('Paste the names, one on each line') + '<textarea id="cText" rows="7" autocomplete="off" spellcheck="false" placeholder="' + esc(t('Copy the column of names from the sheet and paste it here')) + '"></textarea></label>' +
      '<label class="fld">' + t('Or choose a CSV file') + '<input id="cFile" type="file" accept=".csv,.txt,text/csv,text/plain"></label>' +
      '<p class="note bad" id="aErr" hidden></p><button class="btn" type="button" id="cCheck">' + t('Check the list') + '</button></div>');
    $('cFile').addEventListener('change', function () {
      var f = $('cFile').files && $('cFile').files[0]; if (!f) return;
      var rd = new FileReader();
      rd.onload = function () { $('cText').value = MM.nameCheck.namesIn(String(rd.result || '')).join('\n'); $('aErr').hidden = true; };
      rd.onerror = function () { bad(t('This file could not be read. Paste the names instead.')); };
      rd.readAsText(f);
    });
    $('cCheck').addEventListener('click', function () {
      var names = MM.nameCheck.namesIn($('cText').value);
      if (!names.length) return bad(t('Paste at least one name.'));
      $('cCheck').disabled = true; $('cCheck').textContent = t('Checking…');
      /* the phone draws "Checking…" first */
      setTimeout(function () { openLoaded(MM.nameCheck.check(names, companies.filter(function (c) { return !c.merged_into; }))); }, 30);
    });
  }
  function openLoaded(r) {
    var few = function (list, fn) { return list.slice(0, 6).map(fn).join('') + (list.length > 6 ? '<p class="inbox-hint">' + t('{n} more', { n: list.length - 6 }) + '</p>' : ''); };
    var plainRow = function (n) { return '<div class="row flat"><span class="nm">' + nm(n) + '</span></div>'; };
    showSheet('<div><h3>' + t('Check the list') + '</h3><p class="role">' + t('{n} names read', { n: r.fresh.length + r.already.length + r.twice.length + r.alike.length }) + '</p></div><div class="form">' +
      '<div class="facts"><div><span>' + t('New') + '</span><b>' + r.fresh.length + '</b></div><div><span>' + t('Already on the list') + '</span><b>' + r.already.length + '</b></div>' +
        '<div><span>' + t('Twice in what you pasted') + '</span><b>' + r.twice.length + '</b></div><div><span>' + t('Look like another company') + '</span><b>' + r.alike.length + '</b></div></div>' +
      (r.alike.length ? '<p class="sec">' + t('Look like another company') + '</p><p class="note">' + t('Choose for each one. Left as it is, it is not added.') + '</p><div class="rows">' + r.alike.map(function (x, i) {
        return '<div class="row flat adm-alike"><span class="nm">' + nm(x.name) + '</span><span class="sub">' + t(x.listed ? 'Looks like {name}, already on the list' : 'Looks like {name}, also in what you pasted', { name: nm(x.like) }) + '</span>' +
          '<span class="chips"><button class="chip" type="button" data-alike="' + i + '" data-v="skip" aria-pressed="true">' + t('The same company') + '</button><button class="chip" type="button" data-alike="' + i + '" data-v="add" aria-pressed="false">' + t('A different company') + '</button></span></div>';
      }).join('') + '</div>' : '') +
      (r.fresh.length ? '<p class="sec">' + t('New') + '</p><div class="rows">' + few(r.fresh, plainRow) + '</div>' : '') +
      (r.already.length ? '<p class="sec">' + t('Already on the list, passed over') + '</p><div class="rows">' + few(r.already, function (x) { return '<div class="row flat"><span class="nm">' + nm(x.name) + '</span>' + (x.as !== x.name ? '<span class="sub">' + t('Listed as {name}', { name: nm(x.as) }) + '</span>' : '') + '</div>'; }) + '</div>' : '') +
      '<p class="note bad" id="aErr" hidden></p><button class="btn" type="button" id="cAdd"></button><button class="btn ghost" type="button" id="cBack">' + t('Back to the list') + '</button></div>');
    var chosen = function () { return r.fresh.concat(r.alike.filter(function (x, i) { var b = document.querySelector('[data-alike="' + i + '"][data-v="add"]'); return b && b.getAttribute('aria-pressed') === 'true'; }).map(function (x) { return x.name; })); };
    var words = function () { var n = chosen().length; $('cAdd').textContent = n ? t('Add {n} companies', { n: n }) : t('Nothing to add'); $('cAdd').disabled = !n; };
    words();
    $('sheet').querySelector('.form').addEventListener('click', function (e) {
      var b = e.target.closest('[data-alike]'); if (!b) return;
      [].forEach.call(document.querySelectorAll('[data-alike="' + b.dataset.alike + '"]'), function (x) { x.setAttribute('aria-pressed', String(x === b)); });
      words();
    });
    $('cBack').addEventListener('click', openLoad);
    $('cAdd').addEventListener('click', function () {
      var list = chosen();
      /* build 198: the whole list in one step (sql MAIN-MARKS-PASTE-BUILD-198.sql). A store without that file
         answers 404: the names then go one by one through mm_admin_add_company, which every store has; a name
         already listed is passed over, as the one-step way does. */
      var one = function () {
        var added = 0, i = 0, btn = $('cAdd');
        var next = function () {
          if (i >= list.length) return Promise.resolve({ status: 200, body: added });
          btn.textContent = t('Adding {n} of {total}…', { n: i + 1, total: list.length });
          return rpc('mm_admin_add_company', { p_name: list[i++] }).then(function (r) {
            if (r.status < 300) added++;
            else if (!/MM_NAME_TAKEN/.test(JSON.stringify(r.body || ''))) return r;
            return next();
          });
        };
        return next();
      };
      send($('cAdd'), rpc('mm_admin_add_companies', { p_names: list }).then(function (r) { return r.status === 404 ? one() : r; }), function (n) { closeSheet(); again(t('{n} companies added. Every sales agent can choose them now.', { n: n })); });
    });
  }

  /* the box ends exactly where the seventh row starts; more rows are drawn as she scrolls inside it */
  function listFit() {
    var box = $('cbox'), r = box && box.classList.contains('inbox') ? box.children[LIST_FIRST] : null;
    if (!r) return;
    box.style.maxHeight = '';
    box.style.maxHeight = Math.round(r.getBoundingClientRect().top - box.getBoundingClientRect().top + box.scrollTop) + 'px';
  }
  function listInit() {
    var box = $('cbox');
    if (!box || !box.classList.contains('inbox')) return;
    listFit();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(listFit);
    box.addEventListener('scroll', function () {
      var from = box.children.length;
      if (from >= listRows.length || box.scrollTop + box.clientHeight < box.scrollHeight - 240) return;
      box.insertAdjacentHTML('beforeend', listRows.slice(from, from + LIST_PART).map(companyRow).join(''));
    });
  }
  window.addEventListener('resize', listFit);
  function screenMe() {
    return head(t('Account')) +
      '<section class="card"><div class="facts"><div><span>' + t('Name') + '</span><b>' + nm(session.name) + '</b></div><div><span>' + t('Email') + '</span><b><bdi>' + esc(session.email) + '</bdi></b></div>' +
      '<div><span>' + t('Language') + '</span><b><span class="chips"><button class="chip" type="button" data-lang="en" lang="en" aria-pressed="' + !AR + '">English</button><button class="chip" type="button" data-lang="ar" lang="ar" aria-pressed="' + AR + '">العربية</button></span></b></div></div>' +
      (DEMO ? '' : '<a class="btn ghost" href="login.html?change=1">' + t('Change password') + '</a>') + '</section>' +
      /* build 214: the inventory download is on Home (Quick actions) and in Analysis › Reports */
      (BOOK ? '<section class="card"><h2>' + t('Practice data') + '</h2><p class="note">' + t('This demo keeps what you change on this phone only. Nothing is sent anywhere.') + '</p><button class="btn ghost" type="button" id="aPractice">' + t('Start the practice again') + '</button></section>' : '') +
      '<section class="card"><h2>' + t('How this page works') + '</h2>' +
      (DEMO ? '' : '<p class="note">' + t('Nothing is ever deleted. A person who leaves is switched off: they can no longer sign in, and everything they recorded stays with their team. A company that is switched off leaves the lists and keeps its history.') + '</p>' +
      '<p class="note">' + t('A password is shown once, when the account is made or reset. Nobody can read it afterwards, not even here.') + '</p>') +
      /* build 214: since build 213 a plan's numbers can be changed and a plan removed */
      (PB ? '<p class="note">' + t('A payment plan can be changed or removed. Offers and contracts already made keep the numbers they were made on.') + '</p>' : '') + '</section>' +
      '<button class="btn ghost adm-out" type="button" id="out">' + t('Sign out') + '</button>';
  }

  /* ---- BUILD 214, HOME: what waits for her, this month at a glance, the jobs she does most ---- */
  function qa(k, icon, label) { return '<button class="adm-qa" type="button" data-qa="' + k + '">' + svg(icon) + '<span>' + label + '</span></button>'; }
  function screenHome() {
    var waiting = companies.filter(function (c) { return c.pending; });
    var asking = asks.filter(function (a) { return a.status === 'waiting' && company(a.company_id) && person(a.person_id); });
    var blocked = people.filter(function (p) { return p.active && p.wrong_names >= 3; });
    var decide = '<span class="val code"><span class="adm-flag">' + t('Decide') + '</span></span>';
    var rows = waiting.map(function (c) { var by = person(c.proposed_by); return '<button class="row" type="button" data-c="' + esc(c.id) + '"><span class="nm">' + nm(c.name) + '</span><span class="sub">' + t('A name not on the list') + (by ? ' · ' + nm(by.name) : '') + '</span>' + decide + '</button>'; })
      .concat(asking.map(function (a) { return '<button class="row" type="button" data-ask="' + esc(a.company_id + '|' + a.person_id) + '"><span class="nm">' + nm(person(a.person_id).name) + '</span><span class="sub">' + t('Asks to serve {company}', { company: nm(company(a.company_id).name) }) + '</span>' + decide + '</button>'; }))
      .concat(blocked.map(function (p) { return '<button class="row" type="button" data-p="' + esc(p.id) + '"><span class="nm">' + nm(p.name) + '</span><span class="sub">' + t('Blocked after 3 wrong spellings') + '</span>' + decide + '</button>'; }));
    var n = rows.length, today = '';
    try { today = new Intl.DateTimeFormat(LOCALE, { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'Africa/Cairo' }).format(new Date()); } catch (e) { /* no date line */ }
    return head(t('Home'), today ? '<bdi>' + esc(today) + '</bdi>' : '') +
      '<section class="adm-top adm-wait"><p class="adm-k">' + t('Waiting for you') + '</p>' +
      (n ? '<p class="adm-big">' + n + ' <small>' + (n === 1 ? t('decision') : t('decisions')) + '</small></p><div class="rows an">' + rows.join('') + '</div>'
        : '<p class="adm-big adm-clear">' + t('All clear') + '</p><p class="note">' + t('Nothing is waiting for your decision.') + '</p>') + '</section>' +
      an().glance() +
      '<section class="card adm-quickcard"><h2>' + t('Quick actions') + '</h2><div class="adm-quick">' +
        qa('person', 'people', t('Add a person')) + qa('company', 'companies', t('Add a company')) + qa('history', 'fix', t('Correct an entry')) +
        (MM.invExport && MM.invExport.projects().length ? qa('inventory', 'dl', t('Download the inventory')) : '') + '</div></section>';
  }
  function draw() {
    var keep = document.activeElement && document.activeElement.id === 'find';
    $('scr').innerHTML = tab === 'home' ? screenHome() : tab === 'analysis' ? an().screen() : tab === 'people' ? screenPeople() : tab === 'companies' ? (an().activity() ? an().companies() : screenCompanies()) : tab === 'history' ? screenHistory() : tab === 'plans' ? screenPlans() : screenMe();
    /* the history is read the first time its tab is opened, not with the accounts */
    if (tab === 'history' && hist.rows === null && !hist.busy && !hist.failed) loadHistory().then(function () { if (tab === 'history') draw(); });
    $('tab').innerHTML = TABS.map(function (x) {
      return '<button type="button" data-tab="' + x[0] + '"' + ((tab === 'history' ? 'home' : tab) === x[0] ? ' aria-current="page"' : '') + '>' + svg(x[0]) + '<span>' + t(x[1]) + '</span></button>';
    }).join('');
    $('tab').className = 'tab ' + ['', '', 'two', 'three', 'four', 'five', 'six'][TABS.length];
    $('tab').hidden = false;
    $('fab').hidden = true;                    /* build 214: the + is at the top of the screen */
    $('fab').innerHTML = svg('plus');
    $('fab').setAttribute('aria-label', tab === 'companies' ? t('Add a company') : tab === 'plans' ? t('Add a payment plan') : t('Add a person'));
    var f = keep && $('find');                 /* History and Account have no find box */
    if (f) { f.focus(); f.setSelectionRange(f.value.length, f.value.length); }
    /* build 209: an open team pane shows the numbers just saved */
    if (glassTeam && tab === 'people') openTeamGlass(glassTeam);
  }

  /* ---- sheets ---------------------------------------------------------- */
  function showSheet(html) {
    FL = null;
    if (!$('sheet').classList.contains('on')) opener = document.activeElement;
    $('sheet').innerHTML = '<span class="grab"></span><button class="x" id="closeSheet" type="button" aria-label="' + esc(t('Close')) + '">✕</button>' + html;
    $('sheet').scrollTop = 0;
    $('sheet').classList.add('on'); $('veil').classList.add('on');
    document.documentElement.classList.add('is-locked');
    $('closeSheet').addEventListener('click', closeSheet);
  }
  function closeSheet() {
    FL = null;
    $('sheet').classList.remove('on'); $('veil').classList.remove('on');
    /* build 209: a person opened from a team's pane of glass goes back to that pane */
    if (backTo) { var b = backTo; backTo = null; if (team(b)) { openTeamGlass(b); return; } }
    document.documentElement.classList.remove('is-locked');
    if (opener && document.contains(opener)) opener.focus({ preventScroll: true });
  }
  var toastT;
  /* ---- BUILD 214, THE STEPS (Muhanad, 28 Nov 2026: "glassy pop ups easy to understand and easy to walk through"; he
     chose one step at a time). A job opens in the glass sheet with its steps named on a line at the top, as the sales
     side's PROJECT, BUILDING & UNIT, OFFER: one question a step, Back and Next under it, the job's own button on the last.
     Every step is in the sheet from the start and only one shows, so what she typed stays when she goes back.
     A step: { label, q (the question), html, check() -> words or null, next() -> step, skip() -> true, choose (a tap on a
     choice moves on), pick(button), show(), last (its own button), dot (which name on the line) }. */
  var FL = null;
  function choice(attr, val, title, sub, on) {
    return '<button class="fl-choice" type="button" ' + attr + '="' + esc(val) + '" aria-pressed="' + !!on + '"><span class="nm">' + title + '</span>' + (sub ? '<span class="sub">' + sub + '</span>' : '') + '</button>';
  }
  function flow(title, sub, steps, dots) {
    dots = dots || steps.map(function (x) { return x.label; });
    showSheet('<div class="fl-top"><ol class="fl-line">' + dots.map(function (d, i) { return '<li data-fl-dot="' + i + '"><span>' + d + '</span></li>'; }).join('') + '</ol>' +
      '<h3>' + title + '</h3>' + (sub ? '<p class="role">' + sub + '</p>' : '') + '</div><div class="form">' +
      steps.map(function (x, i) { return '<div class="fl-step" data-fl="' + i + '"' + (i ? ' hidden' : '') + '>' + (x.q ? '<p class="fl-q">' + x.q + '</p>' : '') + x.html + '</div>'; }).join('') +
      '<p class="note bad" id="aErr" hidden></p><div class="fl-nav"><button class="btn ghost" type="button" id="flBack">' + t('Back') + '</button><button class="btn" type="button" id="flNext">' + t('Next') + '</button></div></div>');
    FL = { at: 0, steps: steps, path: [0] };
    flowShow(0);
  }
  function flowShow(i) {
    if (!FL) return;
    FL.at = i;
    var st = FL.steps[i], dot = st.dot != null ? st.dot : i;
    [].forEach.call(document.querySelectorAll('#sheet [data-fl]'), function (x) { x.hidden = +x.dataset.fl !== i; });
    [].forEach.call(document.querySelectorAll('#sheet [data-fl-dot]'), function (x) {
      var k = +x.dataset.flDot; x.className = k < dot ? 'done' : k === dot ? 'now' : '';
      if (k === dot) x.setAttribute('aria-current', 'step'); else x.removeAttribute('aria-current');
    });
    $('flBack').hidden = FL.path.length < 2;
    $('flNext').hidden = !!st.last || !!st.choose;
    $('flNext').parentNode.hidden = $('flBack').hidden && $('flNext').hidden;
    $('aErr').hidden = true; $('sheet').scrollTop = 0;
    if (st.show) st.show();
    var f = !st.choose && document.querySelector('#sheet [data-fl="' + i + '"] input[type="text"], #sheet [data-fl="' + i + '"] input[type="email"]');
    if (f && !f.value) setTimeout(function () { try { f.focus({ preventScroll: true }); } catch (e) { /* no focus */ } }, 350);
  }
  function flowNext(to) {
    if (!FL) return;
    var st = FL.steps[FL.at], err = st.check ? st.check() : null;
    if (err) return bad(err);
    var nx = to != null ? to : st.next ? st.next() : FL.at + 1;
    while (FL.steps[nx] && FL.steps[nx].skip && FL.steps[nx].skip()) nx++;
    if (!FL.steps[nx]) return;
    FL.path.push(nx); flowShow(nx);
  }
  function flowBack() { if (!FL || FL.path.length < 2) return; FL.path.pop(); flowShow(FL.path[FL.path.length - 1]); }
  /* a question before something that cannot be taken back, in the sheet itself (it was the browser's own box) */
  function confirmIn(title, text, label, danger, go, back) {
    showSheet('<div><h3>' + title + '</h3></div><div class="form"><p class="note">' + text + '</p><p class="note bad" id="aErr" hidden></p>' +
      '<button class="btn' + (danger ? ' adm-danger-solid' : '') + '" type="button" id="cfYes">' + label + '</button><button class="btn ghost" type="button" id="cfNo">' + t('Cancel') + '</button></div>');
    $('cfYes').addEventListener('click', function () { go($('cfYes')); });
    $('cfNo').addEventListener('click', back);
  }

  function toast(msg) { var n = $('toast'); n.textContent = msg; n.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(function () { n.classList.remove('on'); }, 3200); }
  function bad(msg) { var n = $('aErr'); n.textContent = msg; n.hidden = false; }
  /* one save at a time: the button waits for the store's answer */
  function send(btn, call, then) {
    btn.disabled = true; $('aErr').hidden = true;
    call.then(function (r) {
      btn.disabled = false;
      if (r.status >= 300) return bad(why(r));
      then(r.body);
    }, function () { btn.disabled = false; bad(t('No connection. Try again when you are online.')); });
  }
  function again(msg) { return load().then(function () { draw(); if (msg) toast(msg); }); }

  function teamOptions(chosen, none) {
    return (none ? '<option value="">' + none + '</option>' : '') + teams.map(function (x) { return '<option value="' + esc(x.id) + '"' + (x.id === chosen ? ' selected' : '') + '>' + esc(teamLabel(x)) + '</option>'; }).join('');
  }
  function roleChips(chosen) {
    return '<div class="chips" id="aRole">' + ROLES.map(function (r) { return '<button class="chip" type="button" data-role="' + r + '" aria-pressed="' + (r === chosen) + '">' + roleName(r) + '</button>'; }).join('') + '</div>';
  }

  /* THE PASSWORD, ONCE. With the message to pass on, ready to copy. */
  function showPassword(heading, p, password) {
    var msg = (AR ? ['تطبيق Main Marks', 'البريد الإلكتروني: ' + p.email, 'كلمة المرور: ' + password, 'يمكنك تغيير كلمة المرور بعد تسجيل الدخول.'] : ['Main Marks app', 'Email: ' + p.email, 'Password: ' + password, 'You can change the password after you sign in.']).join('\n');
    showSheet('<div><h3>' + heading + '</h3><p class="role">' + nm(p.name) + '</p></div><div class="form">' +
      '<div class="adm-pass"><span>' + t('Email') + '</span><b><bdi>' + esc(p.email) + '</bdi></b><span>' + t('Password') + '</span><b class="pw"><bdi id="aPw">' + esc(password) + '</bdi></b></div>' +
      '<p class="note bad">' + t('Copy it now. This password is shown once and cannot be read again.') + '</p>' +
      '<button class="btn" type="button" id="aCopy">' + t('Copy the message to send') + '</button><button class="btn ghost" type="button" id="aDone">' + t('Done') + '</button></div>');
    $('aCopy').addEventListener('click', function () {
      var ok = function () { toast(t('Copied. Paste it in a message to {name}.', { name: p.name })); };
      var old = function () { var x = document.createElement('textarea'); x.value = msg; document.body.appendChild(x); x.select(); try { document.execCommand('copy'); ok(); } catch (e) { toast(t('Copy it by hand: select the password.')); } x.remove(); };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(msg).then(ok, old); else old();
    });
    $('aDone').addEventListener('click', closeSheet);
  }

  /* build 214: four steps. The role first (what they will see), then the name, the team, and the account to check. */
  /* the keys, for the Arabic check: t('Sees their own activity only.') t('Sees their own team only.') t('Sees the teams they lead.') t('Sees every team.') t('Sees everything and can change every account.') */
  var ROLE_WHAT = { sales: 'Sees their own activity only.', sales_manager: 'Sees their own team only.', director: 'Sees the teams they lead.', cco: 'Sees every team.', admin: 'Sees everything and can change every account.' };
  function openAddPerson() {
    var role = null, teamId = null, touched = false;
    if (!teams.length) return openTeam(null, t('Make the first team, then add its people.'));
    function suggest() { if (!touched && role) $('aEmail').value = suggestEmail($('aName').value, role); }
    flow(t('Add a person'), '', [
      { label: t('Role'), q: t('What will they do?'), choose: true, html: ROLES.map(function (r) { return choice('data-role', r, roleName(r), t(ROLE_WHAT[r]), false); }).join(''),
        pick: function (b) {
          role = b.dataset.role;
          /* the ending follows the role, even on an email she corrected by hand */
          var at = $('aEmail').value.split('@')[0];
          if (touched && at) $('aEmail').value = at + '@mainmarks-' + ENDING[role] + '.com'; else suggest();
        } },
      { label: t('Name'), q: t('Who are they?'), html: '<label class="fld">' + t('Full name, in English letters') + '<input id="aName" type="text" autocomplete="off" autocapitalize="words" spellcheck="false"></label>' +
          '<div class="range"><label class="fld">' + t('Job title') + '<input id="aTitle" type="text" autocomplete="off"></label><label class="fld">' + t('Staff code') + '<input id="aStaff" type="text" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="MMD"></label></div>',
        check: function () { return $('aName').value.trim() ? null : t('Enter the name.'); } },
      { label: t('Team'), q: t('Which team are they in?'), choose: true, skip: function () { return !!NO_TEAM[role]; },
        html: teams.slice().sort(byTeamOrder).map(function (x) { var d = person(x.director_id); return choice('data-fl-team', x.id, nm(teamLabel(x)), d ? nm(d.name) : '', false); }).join('') +
          choice('data-fl-team', '', t('No team yet'), t('For a manager whose team is not made yet.'), false),
        pick: function (b) { teamId = b.dataset.flTeam || null; },
        check: function () { return role === 'sales' && !teamId ? t('A sales agent needs a team.') : null; } },
      { label: t('Account'), last: true, q: t('Check and make the account'),
        html: '<div class="facts" id="aSum"></div><label class="fld">' + t('Sign-in email') + '<input id="aEmail" type="email" dir="ltr" autocomplete="off" autocapitalize="off" spellcheck="false"></label>' +
          '<p class="note">' + t('The password is made for you and shown once.') + '</p><button class="btn" type="button" id="aSave">' + t('Make the account') + '</button>',
        show: function () {
          var tm = NO_TEAM[role] ? null : team(teamId);
          $('aSum').innerHTML = '<div><span>' + t('Name') + '</span><b>' + nm($('aName').value.replace(/\s+/g, ' ').trim()) + '</b></div><div><span>' + t('Role') + '</span><b>' + roleName(role) + '</b></div>' +
            (NO_TEAM[role] ? '' : '<div><span>' + t('Team') + '</span><b>' + (tm ? nm(teamLabel(tm)) : t('No team yet')) + '</b></div>');
        } }
    ], [t('Role'), t('Name'), t('Team'), t('Account')]);
    $('aName').addEventListener('input', suggest);
    $('aEmail').addEventListener('input', function () { touched = !!$('aEmail').value; });
    $('aSave').addEventListener('click', function () {
      var name = $('aName').value.replace(/\s+/g, ' ').trim(), email = $('aEmail').value.trim().toLowerCase(), tId = NO_TEAM[role] ? null : teamId;
      if (!name) return bad(t('Enter the name.'));
      if (role === 'sales' && !tId) return bad(t('Choose the team.'));
      if (!email) return bad(t('This email does not fit the role. Check the part after the @.'));
      send($('aSave'), rpc('mm_admin_add_person', { p_email: email, p_name: name, p_title: $('aTitle').value.trim(), p_staff: $('aStaff').value.trim() || null, p_role: role, p_team: tId }), function (rows) {
        var made = rows[0];
        again().then(function () { showPassword(t('The account is made'), { name: name, email: email }, made.password); });
      });
    });
  }

  function openPerson(id) {
    var p = person(id); if (!p) return;
    var tm = team(p.team_id), self = p.id === session.id;
    showSheet('<div><h3>' + nm(p.name) + '</h3><p class="role">' + roleName(p.role) + (p.title && p.title.toLowerCase() !== roleName(p.role).toLowerCase() ? ' · ' + esc(p.title) : '') + '</p></div><div class="form">' +
      '<div class="facts"><div><span>' + t('Sign-in email') + '</span><b><bdi>' + esc(p.email) + '</bdi></b></div><div><span>' + t('Team') + '</span><b>' + (tm ? nm(teamLabel(tm)) : t('Not in a team')) + '</b></div>' +
      (p.staff_code ? '<div><span>' + t('Staff code') + '</span><b>' + nm(p.staff_code) + '</b></div>' : '') +
      '<div><span>' + t('Account') + '</span><b>' + (p.active ? (p.must_change_password ? t('On. Still using the first password.') : t('On')) : t('Switched off on {date}', { date: '<bdi>' + esc(p.left_on || '') + '</bdi>' })) + '</b></div>' +
      /* build 127: three company names that were listed companies spelled differently block new names */
      (p.wrong_names > 0 ? '<div><span>' + t('New company names') + '</span><b>' + (p.wrong_names >= 3 ? t('Blocked after 3 wrong spellings') : t('Wrong spellings: {n} of 3', { n: p.wrong_names })) + '</b></div>' : '') + '</div>' +
      '<p class="note bad" id="aErr" hidden></p>' +
      /* build 154, his pick: the undo of that block (the demo until the database step) */
      (p.wrong_names >= 3 ? '<button class="btn" type="button" id="aUnblock">' + t('Let {name} send new company names again', { name: esc(p.name) }) + '</button><p class="note">' + t('The count of wrong spellings goes back to 0. Everything already sent stays as it is.') + '</p>' : '') +
      '<button class="btn ghost" type="button" id="aEdit">' + t('Change the name, title, role or team') + '</button>' +
      '<button class="btn ghost" type="button" id="aReset">' + t('Reset the password') + '</button>' +
      (self ? '' : '<button class="btn' + (p.active ? ' ghost adm-danger' : '') + '" type="button" id="aOnOff">' + (p.active ? t('Switch this account off') : t('Switch this account on again')) + '</button>') +
      '<p class="note">' + (p.active ? t('Switching off stops the sign-in at once. Nothing recorded under this account is removed.') : t('Switched off: this account cannot sign in. Everything recorded under it is still with its team.')) + '</p></div>');
    $('aEdit').addEventListener('click', function () { openEdit(p); });
    if ($('aUnblock')) $('aUnblock').addEventListener('click', function () {
      send($('aUnblock'), rpc('mm_admin_unblock', { p_person: p.id }), function () { closeSheet(); again(t('{name} can send new company names again.', { name: p.name })); });
    });
    /* build 214: the question is asked in the glass sheet (it was the browser's own box) */
    $('aReset').addEventListener('click', function () {
      confirmIn(t('A new password'), t('Make a new password for {name}? The current one stops working.', { name: nm(p.name) }), t('Make a new password'), false, function (btn) {
        send(btn, rpc('mm_admin_reset_password', { p_person: p.id }), function (pw) { again().then(function () { showPassword(t('A new password'), p, pw); }); });
      }, function () { openPerson(p.id); });
    });
    if ($('aOnOff')) $('aOnOff').addEventListener('click', function () {
      /* build 209: the message follows what was asked, read before the change (the practice data changes p itself) */
      var wasOn = !!p.active;
      var go = function (btn) {
        send(btn, rpc('mm_admin_set_active', { p_person: p.id, p_active: !wasOn }), function () {
          closeSheet(); again(wasOn ? t('{name} is switched off.', { name: p.name }) : t('{name} can sign in again.', { name: p.name }));
        });
      };
      if (!wasOn) return go($('aOnOff'));
      confirmIn(t('Switch this account off'), t('Switch off {name}? This account will not be able to sign in.', { name: nm(p.name) }), t('Switch it off'), true, go, function () { openPerson(p.id); });
    });
  }

  function openEdit(p) {
    var role = p.role, self = p.id === session.id;
    showSheet('<div><h3>' + nm(p.name) + '</h3><p class="role">' + t('The sign-in email does not change. What this person sees follows the role chosen here.') + '</p></div><div class="form">' +
      (self ? '' : roleChips(role)) +
      '<label class="fld">' + t('Full name, in English letters') + '<input id="aName" type="text" autocomplete="off" value="' + esc(p.name) + '"></label>' +
      '<label class="fld">' + t('Job title') + '<input id="aTitle" type="text" autocomplete="off" value="' + esc(p.title) + '"></label>' +
      '<label class="fld" id="aTeamBox">' + t('Team') + '<select id="aTeam">' + teamOptions(p.team_id, t('Not in a team')) + '</select></label>' +
      '<p class="note">' + t('Moving a person to another team moves everything they recorded with them: the new manager sees it, the old manager no longer does.') + '</p>' +
      '<p class="note bad" id="aErr" hidden></p><button class="btn" type="button" id="aSave">' + t('Save') + '</button></div>');
    if ($('aRole')) $('aRole').addEventListener('click', function (e) {
      var b = e.target.closest('[data-role]'); if (!b) return;
      role = b.dataset.role;
      Array.prototype.forEach.call($('aRole').children, function (c) { c.setAttribute('aria-pressed', c === b); });
      $('aTeamBox').hidden = !!NO_TEAM[role];
    });
    $('aTeamBox').hidden = !!NO_TEAM[role];
    $('aSave').addEventListener('click', function () {
      var name = $('aName').value.replace(/\s+/g, ' ').trim(), teamId = NO_TEAM[role] ? null : $('aTeam').value || null;
      if (!name) return bad(t('Enter the name.'));
      if (role === 'sales' && !teamId) return bad(t('Choose the team.'));
      send($('aSave'), rpc('mm_admin_set_person', { p_person: p.id, p_name: name, p_title: $('aTitle').value.trim(), p_role: role, p_team: teamId }), function () { closeSheet(); again(t('Saved.')); });
    });
  }

  /* a team: its name and who manages it. tm null = a new team. */
  function openTeam(tm, lead) {
    var managers = people.filter(function (p) { return p.active && p.role === 'sales_manager'; });
    var directors = people.filter(function (p) { return p.active && p.role === 'director'; });
    showSheet('<div><h3>' + (tm ? nm(teamLabel(tm)) : t('Add a team')) + '</h3><p class="role">' + (lead || t('A team is one sales manager and the people under them. The manager sees their own team only.')) + '</p></div><div class="form">' +
      '<label class="fld">' + t('Its manager') + '<select id="aMgr"><option value="">' + t('No manager yet') + '</option>' + managers.map(function (p) { return '<option value="' + esc(p.id) + '"' + (tm && tm.manager_id === p.id ? ' selected' : '') + '>' + esc(p.name) + '</option>'; }).join('') + '</select></label>' +
      (managers.length ? '' : '<p class="note">' + t('There is no sales manager account yet. Make the team now and choose its manager after you add them.') + '</p>') +
      /* build 154, his pick: the director a team reports to. Build 198: on the real store too, and on a new team */
      '<label class="fld">' + t('Its director') + '<select id="aDir"><option value="">' + t('No director yet') + '</option>' + directors.map(function (p) { return '<option value="' + esc(p.id) + '"' + (tm && tm.director_id === p.id ? ' selected' : '') + '>' + esc(p.name) + '</option>'; }).join('') + '</select></label>' +
      (directors.length ? '' : '<p class="note">' + t('There is no director account yet. Add one on People, then choose them here.') + '</p>') +
      /* build 198: the team is called after its manager; a name is asked only for a team with no manager yet */
      (tm ? '' : '<label class="fld" id="aNameBox" hidden>' + t('Team name') + '<input id="aName" type="text" autocomplete="off"></label>') +
      '<p class="note bad" id="aErr" hidden></p><button class="btn" type="button" id="aSave">' + (tm ? t('Save') : t('Make the team')) + '</button></div>');
    var nameBox = function () { if ($('aNameBox')) $('aNameBox').hidden = !!$('aMgr').value; };
    $('aMgr').addEventListener('change', function () { nameBox(); $('aErr').hidden = true; });
    nameBox();
    $('aSave').addEventListener('click', function () {
      var mgr = $('aMgr').value || null, dir = $('aDir').value || null;
      if (tm) return send($('aSave'), rpc('mm_admin_set_team', { p_team: tm.id, p_manager: mgr, p_director: dir }), function () { closeSheet(); again(t('Saved.')); });
      /* stored as the real teams are named ("Team <manager>"); shown as "<manager>'s team" */
      var name = mgr ? 'Team ' + person(mgr).name : $('aName').value.replace(/\s+/g, ' ').trim();
      if (!name) return bad(t('Choose its manager, or enter a name.'));
      send($('aSave'), rpc('mm_admin_add_team', { p_name: name, p_manager: mgr, p_director: dir }), function () { closeSheet(); again(t('The team is made.')); });
    });
  }

  /* A NAME THAT IS NOT ON THE LIST (build 127). Two answers, and only hers: it is a new company (she
     may correct the name first), or it is a listed company spelled differently. The second moves every
     offer onto that company and counts against the agent who sent it: three, and he can no longer send
     to a company that is not on the list. */
  function openPending(c) {
    var by = person(c.proposed_by), who = by ? by.name : t('the sales agent');
    var listed = companies.filter(function (x) { return x.active && !x.pending; }), kind = null, into = null;
    /* build 214: two steps. What is it (a new company, or a listed one spelled differently), then the answer. The listed
       company is found by typing, as the Record form finds one (about two thousand are coming). */
    flow(nm(c.name), (by ? t('Sent by {name}', { name: nm(by.name) }) + ' · ' : '') + t('Not on the list yet'), [
      { label: t('What it is'), q: t('What is this name?'), choose: true,
        html: choice('data-fl-kind', 'new', t('A new company'), t('It is not on the list. Add it.'), false) + choice('data-fl-kind', 'same', t('A listed company, spelled differently'), t('The offers move onto that company.'), false),
        pick: function (b) { kind = b.dataset.flKind; }, next: function () { return kind === 'same' ? 2 : 1; } },
      { label: t('Decide'), dot: 1, last: true, q: t('Check the name, then add it'),
        html: '<label class="fld">' + t('Company name') + '<input id="aName" type="text" autocomplete="off" value="' + esc(c.name) + '"></label>' +
          /* build 149 (his answer: "Nehal picks each time"): for everyone, or for the sales agent who sent it */
          '<button class="btn" type="button" id="aSave">' + t('Add it for everyone') + '</button>' +
          (by && by.active && by.role === 'sales' ? '<button class="btn ghost" type="button" id="aOnly">' + t('Add it for {name} only', { name: esc(by.name) }) + '</button>' : '') },
      { label: t('Decide'), dot: 1, last: true, q: t('Which company is it?'),
        html: '<label class="fld adm-find"><input id="aIntoFind" type="search" autocomplete="off" placeholder="' + esc(t('Find a company')) + '"></label><div class="fl-list" id="aIntoList"></div>' +
          '<p class="note">' + t('The offers move onto that company. This counts as a wrong spelling for {name}: {n} of 3. After three, {name} can no longer send to a company that is not on the list.', { name: nm(who), n: ((by && by.wrong_names) || 0) + 1 }) + '</p>' +
          '<button class="btn adm-danger-solid" type="button" id="aMerge">' + t('Move it to that company') + '</button>',
        pick: function (b) { into = b.dataset.flInto; } }
    ], [t('What it is'), t('Decide')]);
    var intoList = function () {
      var q = $('aIntoFind').value, f = MM.nameFind(listed, q, function (x) { return x.name; }), list = f ? f.map(function (x) { return x.item; }) : listed;
      $('aIntoList').innerHTML = list.slice(0, 30).map(function (x) { return choice('data-fl-into', x.id, nm(x.name), '', x.id === into); }).join('') +
        (list.length > 30 ? '<p class="note">' + t('{n} more. Type to narrow the list.', { n: list.length - 30 }) + '</p>' : '') + (list.length ? '' : '<p class="note">' + t('No company matches.') + '</p>');
    };
    intoList();
    $('aIntoFind').addEventListener('input', intoList);
    /* the name as she corrected it is saved first, still waiting; then approved with who serves it */
    var approve = function (btn, only) {
      var name = $('aName').value.replace(/\s+/g, ' ').trim();
      if (!name) return bad(t('Enter the name.'));
      var rename = name === c.name ? Promise.resolve({ status: 204 }) : rpc('mm_admin_set_company', { p_company: c.id, p_name: name, p_active: false });
      send(btn, rename.then(function (r) { return r.status >= 300 ? r : rpc('mm_admin_approve_company', { p_company: c.id, p_agents: only ? [by.id] : null }); }), function () {
        closeSheet(); again(only ? t('{name} is on the list, given to {who}.', { name: name, who: by.name }) : t('{name} is on the list.', { name: name }));
      });
    };
    $('aSave').addEventListener('click', function () { approve($('aSave'), false); });
    if ($('aOnly')) $('aOnly').addEventListener('click', function () { approve($('aOnly'), true); });
    $('aMerge').addEventListener('click', function () {
      var target = companies.filter(function (x) { return x.id === into; })[0];
      if (!target) return bad(t('Choose which company it is.'));
      send($('aMerge'), rpc('mm_admin_merge_company', { p_company: c.id, p_into: into }), function (n) {
        closeSheet(); again(t('Moved to {company}. {name}: wrong spelling {n} of 3.', { company: target.name, name: who, n: n }));
      });
    });
  }

  /* build 214: the + on Companies: one company or a list */
  function openAddChoice() {
    showSheet('<div><h3>' + t('Add to the list') + '</h3></div><div class="form">' +
      choice('data-addc', 'one', t('One company'), t('Type its name.'), false) + choice('data-addc', 'list', t('A list of companies'), t('Paste a column from a sheet, or choose a CSV file.'), false) + '</div>');
  }
  /* build 214: a new company in two steps: its name, then who serves it */
  function openNewCompany() {
    flow(t('Add a company'), '', [
      { label: t('Name'), q: t('What is it called?'), html: '<label class="fld">' + t('Company name') + '<input id="aName" type="text" autocomplete="off"></label>',
        check: function () { return $('aName').value.trim() ? null : t('Enter the name.'); } },
      { label: t('Who serves it'), last: true, q: t('Who serves it?'),
        html: choice('data-who', 'all', t('Everyone'), t('It appears at once in every sales agent\'s list of companies.'), true) +
          choice('data-who', 'some', t('Only some sales agents'), t('Only the sales agents you choose, their managers and directors see it.'), false) +
          '<div id="aSome" hidden>' + agentPicker([]) + '</div><button class="btn" type="button" id="aSave">' + t('Add the company') + '</button>',
        pick: function (b) { $('aSome').hidden = b.dataset.who !== 'some'; } }
    ]);
    $('aSave').addEventListener('click', function () {
      var name = $('aName').value.replace(/\s+/g, ' ').trim();
      if (!name) return bad(t('Enter the name.'));
      var some = !$('aSome').hidden ? picked() : null;
      if (some && !some.length) return bad(t('Choose at least one sales agent, or choose Everyone.'));
      send($('aSave'), rpc('mm_admin_add_company', some ? { p_name: name, p_agents: some } : { p_name: name }), function () { closeSheet(); again(some ? t('{name} is on the list, given to {who}.', { name: name, who: whoNames(some) }) : t('{name} is on the list.', { name: name })); });
    });
  }
  function openCompany(c) {
    if (!c) return openNewCompany();
    if (c && c.pending) return openPending(c);
    var given = c ? (circle[c.id] || []).length : 0;
    showSheet('<div><h3>' + (c ? nm(c.name) : t('Add a company')) + '</h3><p class="role">' + (c ? (!c.active ? t('Switched off: it is not offered any more. Its history is kept.') : given ? t('Given to some sales agents. Their managers and directors see it too.') : t('On the lists every sales agent chooses from.')) : t('It appears at once in every sales agent\'s list of companies.')) + '</p></div><div class="form">' +
      '<label class="fld">' + t('Company name') + '<input id="aName" type="text" autocomplete="off" value="' + esc(c ? c.name : '') + '"></label>' +
      /* build 149: a new company may be given to some sales agents in the same step */
      (c ? '' : '<p class="sec">' + t('Who serves it') + '</p><div class="chips" id="aWho"><button class="chip" type="button" data-who="all" aria-pressed="true">' + t('Everyone') + '</button><button class="chip" type="button" data-who="some" aria-pressed="false">' + t('Only some sales agents') + '</button></div><div id="aSome" hidden>' + agentPicker([]) + '</div>') +
      '<p class="note bad" id="aErr" hidden></p><button class="btn" type="button" id="aSave">' + (c ? t('Save the name') : t('Add the company')) + '</button>' +
      (c ? '<p class="sec">' + t('Who serves it') + '</p><div class="facts"><div><span>' + t('Given to') + '</span><b>' + servedText(c.id) + '</b></div></div><button class="btn ghost" type="button" id="aWhoGo">' + t('Choose who serves it') + '</button>' +
        '<p class="sec">' + t('At this company') + '</p><div id="aPort"><p class="note">' + t('Reading…') + '</p></div>' : '') +
      (c ? '<button class="btn ghost' + (c.active ? ' adm-danger' : '') + '" type="button" id="aOnOff">' + (c.active ? t('Switch this company off') : t('Switch this company on again')) + '</button>' : '') + '</div>');
    if (c) { portfolio(c); $('aWhoGo').addEventListener('click', function () { openServe(c); }); }
    if ($('aWho')) $('aWho').addEventListener('click', function (e) {
      var b = e.target.closest('[data-who]'); if (!b) return;
      [].forEach.call($('aWho').children, function (x) { x.setAttribute('aria-pressed', String(x === b)); });
      $('aSome').hidden = b.dataset.who !== 'some';
      var role = document.querySelector('#sheet .role');
      if (role) role.textContent = b.dataset.who === 'some' ? t('Only the sales agents you choose, their managers and directors see it.') : t('It appears at once in every sales agent\'s list of companies.');
      $('aErr').hidden = true;
    });
    $('aSave').addEventListener('click', function () {
      var name = $('aName').value.replace(/\s+/g, ' ').trim();
      if (!name) return bad(t('Enter the name.'));
      var some = !c && $('aSome') && !$('aSome').hidden ? picked() : null;
      if (some && !some.length) return bad(t('Choose at least one sales agent, or choose Everyone.'));
      send($('aSave'), c ? rpc('mm_admin_set_company', { p_company: c.id, p_name: name, p_active: c.active }) : rpc('mm_admin_add_company', some ? { p_name: name, p_agents: some } : { p_name: name }), function () { closeSheet(); again(c ? t('Saved.') : some ? t('{name} is on the list, given to {who}.', { name: name, who: whoNames(some) }) : t('{name} is on the list.', { name: name })); });
    });
    if ($('aOnOff')) $('aOnOff').addEventListener('click', function () {
      var wasOn = !!c.active;   /* build 209: read before the change, as for a person */
      send($('aOnOff'), rpc('mm_admin_set_company', { p_company: c.id, p_name: c.name, p_active: !wasOn }), function () { closeSheet(); again(wasOn ? t('{name} is switched off.', { name: c.name }) : t('{name} is on the list.', { name: c.name })); });
    });
    if (!c) $('aName').focus();
  }

  /* ---- THE PAYMENT PLANS (build 154; the rules are js/planbook.js's) ------ */
  /* the sheet's unit types, as a plan's `notFor` names them: Offices and The Fourth are both Admin */
  var PTYPES = [['Admin', 'Offices and The Fourth'], ['Clinic', 'Clinics'], ['Commercial', 'Shops']];
  /* the example price of the plan's sheet. Her screen only: it never reaches a customer's document. */
  var EXAMPLE = 10000000;
  function pproject() { return PB.projects()[0]; }
  function planName(pl) { return MM.tx && MM.tx.plan ? MM.tx.plan(pl.label) : pl.label; }
  function second(pl) { return (pl.milestones || []).filter(function (m) { return m.down; })[0] || null; }
  function pc(f) { return String(Math.round(f * 1000) / 10); }
  /* months in words: the Arabic counted noun follows the number (3 to 10 شهور, 11 and up شهراً) */
  function monthsT(n) {
    if (!AR) return n + (n === 1 ? ' month' : ' months');
    return n === 1 ? 'شهر' : n === 2 ? 'شهرين' : MM.iso(n) + (n <= 10 ? ' أشهر' : ' شهراً');
  }
  function typesText(notFor) {
    return PTYPES.filter(function (x) { return !notFor || notFor.indexOf(x[0]) === -1; }).map(function (x) { return t(x[1]); }).join(AR ? '، ' : ', ');
  }
  function whenText(pl) {
    var st = PB.stateOf(pl);
    if (st === 'ended') return t('Offered until {date}', { date: dayText(pl.until) });
    if (st === 'soon') return t('Starts {date}', { date: dayText(pl.from) });
    return pl.until ? t('Until {date}', { date: dayText(pl.until) }) : t('No end date');
  }
  function planRow(pl) {
    /* few words: a line only when it has dates or is not on every unit */
    var bits = PB.stateOf(pl) !== 'on' || pl.until ? [whenText(pl)] : [];
    if (pl.notFor && pl.notFor.length) bits.push(typesText(pl.notFor));
    return '<button class="row' + (PB.stateOf(pl) === 'ended' ? ' gone' : '') + '" type="button" data-plan="' + esc(pl.id) + '"><span class="nm">' + nm(planName(pl)) + '</span>' + (bits.length ? '<span class="sub">' + bits.join(' · ') + '</span>' : '') + '</button>';
  }
  /* build 155: delivery by building (Main Marks, 11 Nov 2026), grouped by its months: "A1, B1: 2 years" */
  function deliveryText(terms) {
    var by = terms.deliveryByBuilding;
    if (!by) return t('{span} after the contract', { span: monthsT(terms.deliveryMonths) });
    var g = {};
    Object.keys(by).forEach(function (b) { (g[by[b]] = g[by[b]] || []).push(b); });
    return Object.keys(g).sort(function (a, c) { return a - c; }).map(function (m) {
      return g[m].join(AR ? '، ' : ', ') + ': ' + monthsT(+m);
    }).join('<br>');
  }
  function maintText(terms) {
    var m = terms.maintenance;
    if (terms.deliveryByBuilding && !m) return t('Not on the offer');
    if (!m || !m.pct) return t('None');
    return (m.on === 'discounted' ? t('{p}% of the price after discount', { p: pc(m.pct) }) : t('{p}% of the original price', { p: pc(m.pct) })) + ' · ' + t('{span} before delivery', { span: monthsT(m.dueMonthsBeforeDelivery || 0) });
  }
  function screenPlans() {
    var p = pproject(), by = { on: [], soon: [], ended: [] };
    p.plans.forEach(function (pl) { if (!pl.removed) by[PB.stateOf(pl)].push(pl); });
    var card = function (h, list) { return list.length ? '<section class="card"><h2>' + h + '</h2><div class="rows">' + list.map(planRow).join('') + '</div></section>' : ''; };
    return head(t('Plans'), t('{n} offered today', { n: '<b>' + by.on.length + '</b>' })) +
      card(t('Offered today'), by.on) + card(t('Starting later'), by.soon) +
      '<section class="card"><h2>' + t('Maintenance and delivery') + '</h2><div class="facts">' +
        '<div><span>' + t('Delivery') + '</span><b>' + deliveryText(p.terms) + '</b></div>' +
        '<div><span>' + t('Maintenance') + '</span><b>' + maintText(p.terms) + '</b></div></div>' +
        (p.terms.deliveryByBuilding ? '' : '<button class="also adm-link" type="button" id="pTerms">' + t('Change') + '</button>') + '</section>' +
      card(t('Ended'), by.ended) +
      (DEMO && PB.changed() ? '<button class="btn ghost" type="button" id="pReset">' + t('Put back the original plans') + '</button>' : '');
  }
  /* a plan's numbers, then what they come to on the example price */
  function planFacts(pl, terms) {
    var rows = [], s2 = second(pl), onList = (pl.downOn || terms.downOn) === 'list';
    if (pl.cash) rows.push([t('Paid'), t('In full, on signing')]);
    else {
      rows.push([t('Down payment'), (onList ? t('{p}% of the original price', { p: pc(pl.down) }) : t('{p}% of the price after discount', { p: pc(pl.down) }))]);
      if (s2) rows.push([t('Second part'), t('{p}% after 3 months', { p: pc(s2.pct) })]);
      rows.push([t('Instalments'), t('{n}, every 3 months', { n: Math.round(pl.years * 12 / 3) })]);
    }
    rows.push([t('Discount'), !pl.discount ? t('None') : pl.discountOn === 'afterDown' ? t('{p}% of what is left after the down payment', { p: pc(pl.discount) }) : t('{p}% of the original price', { p: pc(pl.discount) })]);
    var s = MM.plans.schedule({ listPrice: EXAMPLE, discount: pl.discount || 0, plan: pl, terms: terms }), ex = [];
    if (s && !s.broken) {
      if (s.discount) ex.push([t('Price after discount'), money(s.payable)]);
      if (s.cash) ex.push([t('Paid on signing'), money(s.payable)]);
      else {
        ex.push([t('Down payment'), money(s.rows[0].amount)]);
        if (s2) ex.push([t('Second part'), money(s.milestones.filter(function (m) { return m.down; })[0].amount)]);
        ex.push([t('Each instalment'), money(s.each)]);
      }
      if (s.maintenance) ex.push([t('Maintenance'), money(s.maintenance.amount)]);
    }
    var f = function (list) { return '<div class="facts">' + list.map(function (r) { return '<div><span>' + r[0] + '</span><b>' + r[1] + '</b></div>'; }).join('') + '</div>'; };
    return '<p class="sec">' + t('The numbers') + '</p>' + f(rows) +
      (ex.length ? '<p class="sec">' + t('On a unit at {v}', { v: money(EXAMPLE) }) + '</p>' + f(ex) : '');
  }
  function typeChips(notFor) {
    return '<div class="chips" id="pTypes">' + PTYPES.map(function (x) { return '<button class="chip" type="button" data-ptype="' + x[0] + '" aria-pressed="' + (!notFor || notFor.indexOf(x[0]) === -1) + '">' + t(x[1]) + '</button>'; }).join('') + '</div>';
  }
  function typesRead() { return [].filter.call(document.querySelectorAll('#pTypes [data-ptype]'), function (b) { return b.getAttribute('aria-pressed') !== 'true'; }).map(function (b) { return b.dataset.ptype; }); }
  function datesField(from, until) {
    return '<div class="range"><label class="fld">' + t('From') + '<input type="date" id="pFrom" value="' + esc(from || '') + '"></label>' +
      '<label class="fld">' + t('Until') + '<input type="date" id="pUntil" value="' + esc(until || '') + '"></label></div><p class="note">' + t('Leave Until empty for no end date.') + '</p>';
  }
  /* build 212: on the real app a plan is saved in the store, so the answer comes later; the sheet's button waits for it */
  function said(r, msg) {
    var btns = [].slice.call(document.querySelectorAll('#sheet .btn'));
    btns.forEach(function (b) { b.disabled = true; });
    return Promise.resolve(r).then(function (r) {
      btns.forEach(function (b) { b.disabled = false; });
      if (r.why) return bad(t(r.why));
      closeSheet(); draw(); toast(msg); return true;
    });
  }

  function openPlan(id) {
    var p = pproject(), pl = p.plans.filter(function (x) { return x.id === id; })[0];
    if (!pl) return;
    var ended = PB.stateOf(pl) === 'ended';
    showSheet('<div><h3>' + nm(planName(pl)) + '</h3><p class="role">' + whenText(pl) + '</p></div><div class="form">' + planFacts(pl, p.terms) +
      '<p class="sec">' + t('Dates') + '</p>' + datesField(pl.from, pl.until) +
      '<p class="sec">' + t('Offered on') + '</p>' + typeChips(pl.notFor) +
      '<p class="note bad" id="aErr" hidden></p><button class="btn" type="button" id="pSave">' + t('Save') + '</button>' +
      '<button class="btn ghost" type="button" id="pNums">' + t('Change the numbers') + '</button>' +
      '<button class="btn ghost" type="button" id="pCopy">' + t('Copy into a new plan') + '</button>' +
      (ended ? '' : '<button class="btn ghost adm-danger" type="button" id="pEnd">' + t('End this plan today') + '</button>') +
      '<button class="btn ghost adm-danger" type="button" id="pRemove">' + t('Remove this plan') + '</button>' +
      '<p class="note">' + t('Offers already sent keep the numbers they were sent with.') + '</p></div>');
    $('pSave').addEventListener('click', function () {
      said(PB.change(p.id, pl.id, { from: $('pFrom').value, until: $('pUntil').value, notFor: typesRead() }, session.name), t('Saved. Sales agents see it the next time they open the app.'));
    });
    $('pCopy').addEventListener('click', function () { openNewPlan(pl); });
    $('pNums').addEventListener('click', function () { openNewPlan(pl, true); });
    $('pRemove').addEventListener('click', function () { askRemove(pl); });
    if ($('pEnd')) $('pEnd').addEventListener('click', function () { said(PB.end(p.id, pl.id, session.name), t('Ended. It is not offered from today.')); });
  }

  /* A NEW PLAN, or a copy of one (`base`): the numbers, the units, the dates, and what it comes to */
  /* build 213: edit = the same form on its numbers; saving puts a new plan in its place (js/planbook.js replace) */
  function openNewPlan(base, edit) {
    var cash = !!(base && base.cash), s2 = base && second(base);
    /* build 154 (Muhanad: "if it carries discount she need to be asked"): what the discount and the down
       payment are each a share of; a copy keeps its plan's, a new plan starts from the project's */
    var dOn = base && base.discountOn === 'afterDown' ? 'afterDown' : 'list';
    var wOn = (base && base.downOn) || pproject().terms.downOn || 'list';
    var pick = function (id, attr, list, on) { return '<div class="chips adm-choice" id="' + id + '">' + list.map(function (x) { return '<button class="chip" type="button" ' + attr + '="' + x[0] + '" aria-pressed="' + (x[0] === on) + '">' + x[1] + '</button>'; }).join('') + '</div>'; };
    var num = function (id, v) { return '<input id="' + id + '" type="text" inputmode="decimal" autocomplete="off" value="' + (v == null ? '' : esc(v)) + '">'; };
    /* build 214: four steps: the kind, the numbers, the units and dates, then the plan as it will read */
    var whole = function () { var d = planDraft(), w = d.missing || PB.problem(d); return w ? t(w) : null; };
    flow(edit ? t('Change the numbers') : base ? t('Copy into a new plan') : t('New payment plan'), edit ? nm(planName(base)) : t('Its name is made from the numbers, in English and in Arabic.'), [
      { label: t('Kind'), q: t('What kind of plan?'), choose: true,
        html: '<div id="pKind">' + choice('data-kind', 'inst', t('Instalment plan'), t('A down payment, then instalments every 3 months.'), !cash) + choice('data-kind', 'cash', t('Spot cash'), t('Paid in full on signing, with a discount.'), cash) + '</div>' },
      { label: t('Numbers'), q: t('The numbers'), check: whole, html:
      '<div id="pInst"' + (cash ? ' hidden' : '') + '><div class="range"><label class="fld">' + t('Down payment, %') + num('pDown', base && !cash ? pc(base.down) : '') + '</label>' +
        '<label class="fld">' + t('Years') + num('pYears', base && !cash ? base.years : '') + '</label></div>' +
        '<div class="chips"><button class="chip" type="button" id="pSplit" aria-pressed="' + !!s2 + '">' + t('Split the down payment') + '</button></div>' +
        '<label class="fld" id="pSecondBox"' + (s2 ? '' : ' hidden') + '>' + t('Second part, %, 3 months later') + num('pSecond', s2 ? pc(s2.pct) : '') + '</label></div>' +
      '<label class="fld">' + t('Discount, %') + num('pDisc', base ? pc(base.discount || 0) : '0') + '</label>' +
      '<div id="pBases" class="adm-qs" hidden><div class="adm-q"><p class="sec">' + t('The discount is taken from') + '</p>' +
        pick('pDiscOn', 'data-don', [['list', t('The original price')], ['afterDown', t('What is left after the down payment')]], dOn) + '</div>' +
        '<div class="adm-q"><p class="sec">' + t('The down payment is a share of') + '</p>' +
        pick('pDownOn', 'data-dwn', [['list', t('The original price')], ['discounted', t('The price after discount')]], wOn) +
        '<p class="note" id="pBaseNote" hidden>' + t('With the discount taken after the down payment, the down payment is a share of the original price.') + '</p></div></div>' },
      { label: t('Units'), q: t('Which units, from when?'), check: whole, html:
      '<p class="sec">' + t('Offered on') + '</p>' + typeChips(base && base.notFor) +
      '<p class="sec">' + t('Dates') + '</p>' + (edit ? datesField(base.from && base.from > PB.today() ? base.from : PB.today(), base.until && base.until >= PB.today() ? base.until : '') : datesField(PB.today(), '')) },
      { label: t('Check'), last: true, q: t('Check the plan'), show: function () { planPreview(); }, html:
      '<div id="pPrev"></div>' +
      '<button class="btn" type="button" id="pAdd">' + (edit ? t('Save the changes') : t('Add the plan')) + '</button>' }
    ]);
    $('pKind').addEventListener('click', function (e) {
      var b = e.target.closest('[data-kind]'); if (!b) return;
      $('pInst').hidden = b.dataset.kind === 'cash'; planPreview();
    });
    $('pSplit').addEventListener('click', function () {
      var on = $('pSplit').getAttribute('aria-pressed') !== 'true';
      $('pSplit').setAttribute('aria-pressed', String(on)); $('pSecondBox').hidden = !on; $('aErr').hidden = true; planPreview();
    });
    var bases = function (e) {
      var b = e.target.closest('[data-don],[data-dwn]'); if (!b || b.disabled) return;
      [].forEach.call(b.parentNode.children, function (x) { x.setAttribute('aria-pressed', String(x === b)); });
      $('aErr').hidden = true; planPreview();
    };
    $('pDiscOn').addEventListener('click', bases); $('pDownOn').addEventListener('click', bases);
    planPreview();
    $('pAdd').addEventListener('click', function () {
      var d = planDraft();
      if (d.missing) return bad(t(d.missing));
      var btn = $('pAdd');
      if (edit) return said(PB.replace(pproject().id, base.id, d, session.name), t('Changed. Sales agents see the new numbers the next time they open the app.'));
      btn.disabled = true;
      Promise.resolve(PB.add(pproject().id, d, session.name)).then(function (r) {
        btn.disabled = false;
        if (r.why) return bad(t(r.why));
        /* a copy: the plan it came from is ended now, or kept, her choice */
        if (base && PB.stateOf(base) !== 'ended') return askEnd(base, r.plan);
        said(r, t('Added. Sales agents see it the next time they open the app.'));
      });
    });
  }
  /* what the new-plan sheet holds, as js/planbook.js reads it; { missing } when a number is not one */
  function planDraft() {
    var n = MM.contractPlan.number, cash = $('pKind').querySelector('[data-kind="cash"]').getAttribute('aria-pressed') === 'true';
    var split = !cash && $('pSplit').getAttribute('aria-pressed') === 'true';
    var on = function (id) { var b = $(id).querySelector('[aria-pressed="true"]'); return b ? b.dataset.don || b.dataset.dwn : null; };
    var d = { cash: cash, discount: n($('pDisc').value === '' ? '0' : $('pDisc').value), discountOn: on('pDiscOn'), downOn: on('pDownOn'), notFor: typesRead(), from: $('pFrom').value, until: $('pUntil').value || '' };
    if (!cash) { d.down = n($('pDown').value); d.years = n($('pYears').value); d.second = split ? n($('pSecond').value) : null; }
    if (split && d.second === null) d.missing = 'Type the second part of the down payment.';
    return d;
  }
  function planPreview() {
    var box = $('pPrev'); if (!box || !$('pKind')) return;
    var d0 = planDraft();
    $('pBases').hidden = d0.cash || !(d0.discount > 0);
    var after = d0.discountOn === 'afterDown', dis = $('pDownOn').querySelector('[data-dwn="discounted"]');
    dis.disabled = after;
    if (after && dis.getAttribute('aria-pressed') === 'true') { dis.setAttribute('aria-pressed', 'false'); $('pDownOn').querySelector('[data-dwn="list"]').setAttribute('aria-pressed', 'true'); }
    $('pBaseNote').hidden = !after;
    var d = planDraft(), why = d.missing || PB.problem(d);
    if (why) { box.innerHTML = ''; return; }
    var pl = PB.toPlan(d, 'preview');
    box.innerHTML = '<div class="adm-prev"><p class="sec">' + t('The plan') + '</p><h3 class="adm-plan-name">' + nm(planName(pl)) + '</h3>' + planFacts(pl, pproject().terms) + '</div>';
  }
  function askEnd(old, made) {
    showSheet('<div><h3>' + t('The new plan is added') + '</h3><p class="role">' + nm(planName(made)) + '</p></div><div class="form">' +
      '<p class="note">' + t('End the plan it was copied from? Offers and contracts already made on it keep it.') + '</p>' +
      '<button class="btn" type="button" id="pEndOld">' + t('End {name} today', { name: planName(old) }) + '</button>' +
      '<button class="btn ghost" type="button" id="pKeep">' + t('Keep both') + '</button></div>');
    $('pEndOld').addEventListener('click', function () { said(PB.end(pproject().id, old.id, session.name), t('Added, and {name} is ended.', { name: planName(old) })); });
    $('pKeep').addEventListener('click', function () { closeSheet(); draw(); toast(t('Added. Sales agents see it the next time they open the app.')); });
  }

  function askRemove(pl) {
    showSheet('<div><h3>' + t('Remove {name}?', { name: planName(pl) }) + '</h3></div><div class="form">' +
      '<p class="note">' + t('It is not offered from today and leaves this list. Offers already sent keep it.') + '</p>' +
      '<p class="note bad" id="aErr" hidden></p><button class="btn adm-danger" type="button" id="pRemoveYes">' + t('Yes, remove it') + '</button>' +
      '<button class="btn ghost" type="button" id="pRemoveNo">' + t('Cancel') + '</button></div>');
    $('pRemoveYes').addEventListener('click', function () { said(PB.remove(pproject().id, pl.id, session.name), t('Removed. It is not offered from today.')); });
    $('pRemoveNo').addEventListener('click', function () { openPlan(pl.id); });
  }

  function openTerms() {
    var p = pproject(), m = p.terms.maintenance || {};
    var num = function (id, v) { return '<input id="' + id + '" type="text" inputmode="numeric" autocomplete="off" value="' + esc(v) + '">'; };
    showSheet('<div><h3>' + t('Maintenance and delivery') + '</h3><p class="role">' + t('For every offer made from now on. Offers already sent keep theirs.') + '</p></div><div class="form">' +
      '<label class="fld">' + t('Delivery, months after the contract') + num('pDel', p.terms.deliveryMonths) + '</label>' +
      '<label class="fld">' + (m.on === 'discounted' ? t('Maintenance, % of the price after discount') : t('Maintenance, % of the original price')) + num('pMp', m.pct ? pc(m.pct) : '0') + '</label>' +
      '<label class="fld">' + t('Maintenance due, months before delivery') + num('pMb', m.dueMonthsBeforeDelivery || 0) + '</label>' +
      '<p class="note bad" id="aErr" hidden></p><button class="btn" type="button" id="pSaveT">' + t('Save') + '</button></div>');
    $('pSaveT').addEventListener('click', function () {
      var n = MM.contractPlan.number, o = { deliveryMonths: n($('pDel').value), maintPct: n($('pMp').value), dueBefore: n($('pMb').value) };
      if (o.deliveryMonths === null || o.maintPct === null || o.dueBefore === null) return bad(t('Type each one as a number.'));
      said(PB.setTerms(p.id, o, session.name), t('Saved. Sales agents see it the next time they open the app.'));
    });
  }

  /* ---- taps ------------------------------------------------------------ */
  document.addEventListener('click', function (e) {
    /* build 211: the analysis answers its own taps */
    if (an().click(e)) return;
    var hit = function (a) { return e.target.closest('[' + a + ']'); };
    var p = hit('data-p'), c = hit('data-c'), f = hit('data-f'), tb = e.target.closest('#tab [data-tab]'), l = hit('data-lang'), tm = hit('data-team');
    /* build 209: the team's pane of glass. A tap outside the pane or on ✕ closes it; a person or "Change the
       manager or director" closes it and opens the sheet in its place. */
    if (glassTeam) {
      if (e.target.closest('#twX') || (e.target.id === 'tw')) { closeTeamGlass(); return; }
      if (e.target.closest('#tw') && (p || tm)) { backTo = glassTeam; closeTeamGlass(true); }
      else if (e.target.closest('#tw')) return;
    }
    /* build 214: the steps, the header's buttons, Home */
    if (e.target.closest('#flNext')) { flowNext(); return; }
    if (e.target.closest('#flBack')) { flowBack(); return; }
    var ch = FL && e.target.closest('#sheet .fl-choice');
    if (ch) {
      [].forEach.call(ch.parentNode.querySelectorAll('.fl-choice'), function (x) { x.setAttribute('aria-pressed', String(x === ch)); });
      var st = FL.steps[FL.at]; $('aErr').hidden = true;
      if (st.pick) st.pick(ch);
      if (st.choose) setTimeout(function () { if (FL && FL.steps[FL.at] === st) flowNext(); }, 180);
      return;
    }
    if (hit('data-addc')) { if (hit('data-addc').dataset.addc === 'list') openLoad(); else openNewCompany(); return; }
    if (e.target.closest('#toMe')) { tab = 'me'; find = ''; draw(); window.scrollTo(0, 0); return; }
    if (hit('data-go-tab')) { tab = hit('data-go-tab').dataset.goTab; find = ''; if (tab === 'history') hist.failed = false; draw(); window.scrollTo(0, 0); return; }
    if (e.target.closest('#topAdd')) { if (tab === 'companies') openAddChoice(); else if (tab === 'plans') openNewPlan(null); else openAddPerson(); return; }
    if (e.target.closest('#cMore')) {
      var mb = e.target.closest('#cMore'), box = $('cbox'), from = listShown;
      listShown += LIST_PART;
      if (box) box.insertAdjacentHTML('beforeend', listRows.slice(from, listShown).map(companyRow).join(''));
      if (listShown >= listRows.length) mb.remove(); else mb.textContent = t('Show {n} more', { n: Math.min(LIST_PART, listRows.length - listShown) });
      return;
    }
    if (hit('data-qa')) {
      var q = hit('data-qa').dataset.qa;
      if (q === 'person') openAddPerson();
      else if (q === 'company') openNewCompany();
      else if (q === 'history') { tab = 'history'; hist.failed = false; draw(); window.scrollTo(0, 0); }
      else if (q === 'inventory') {
        var qb = hit('data-qa'); if (qb.disabled) return;
        qb.disabled = true; toast(t('Preparing the inventory…'));
        MM.invExport.download().then(function (file) { toast(t('Downloaded as Excel: {name}', { name: file })); }, function () { toast(t('The inventory could not be read. Try again.')); }).then(function () { qb.disabled = false; });
      }
      return;
    }
    if (hit('data-dir')) { dirPick = hit('data-dir').dataset.dir; $('scr').classList.remove('in'); draw(); var dt = document.querySelector('.adm-dtabs [aria-selected="true"]'); if (dt) { dt.focus({ preventScroll: true }); dt.scrollIntoView({ block: 'nearest', inline: 'nearest' }); } return; }
    if (hit('data-mt')) { openTeamGlass(hit('data-mt').dataset.mt); return; }
    if (e.target.closest('#veil')) closeSheet();
    else if (tb) { tab = tb.dataset.tab; find = ''; if (tab === 'history') hist.failed = false; draw(); window.scrollTo(0, 0); }
    else if (hit('data-hf')) { hist.filter = hit('data-hf').dataset.hf; draw(); }
    else if (e.target.closest('#hGo')) removeEntry(e.target.closest('#hGo'));
    else if (e.target.closest('#hPlan')) savePlan(e.target.closest('#hPlan'));
    else if (e.target.closest('#hMore')) { e.target.closest('#hMore').disabled = true; loadHistory(true).then(draw); }
    else if (hit('data-h')) openHistory(hit('data-h').dataset.h);
    /* build 149: a sales agent ticked or not; a request to serve a company */
    else if (hit('data-pick')) { var pk = hit('data-pick'); pk.setAttribute('aria-pressed', String(pk.getAttribute('aria-pressed') !== 'true')); pickWords(); if ($('aErr')) $('aErr').hidden = true; }
    else if (hit('data-ask')) { var ak = hit('data-ask').dataset.ask.split('|'); openAsk(ak[0], ak[1]); }
    else if (p) openPerson(p.dataset.p);
    else if (c) openCompany(companies.filter(function (x) { return x.id === c.dataset.c; })[0]);
    else if (tm) openTeam(team(tm.dataset.team));
    else if (f) { filter = f.dataset.f; draw(); }
    else if (l) { if (l.dataset.lang !== MM.lang) MM.setLang(l.dataset.lang); }
    else if (e.target.closest('#addTeam')) openTeam(null);
    /* build 154: the payment plans */
    else if (hit('data-plan')) openPlan(hit('data-plan').dataset.plan);
    else if (hit('data-ptype')) { var pt = hit('data-ptype'); pt.setAttribute('aria-pressed', String(pt.getAttribute('aria-pressed') !== 'true')); if ($('aErr')) $('aErr').hidden = true; planPreview(); }
    else if (e.target.closest('#pTerms')) openTerms();
    else if (e.target.closest('#cLoad')) openLoad();
    else if (e.target.closest('#cOne')) openCompany(null);
    else if (e.target.closest('#aPractice')) { BOOK.reset(); if (PB) PB.reset(); hist.rows = null; again(t('The practice data is back as it was.')); }
    else if (e.target.closest('#pReset')) { PB.reset(); draw(); toast(t('The original plans are back.')); }
    else if (e.target.closest('#fab')) { if (tab === 'companies') openCompany(null); else if (tab === 'plans') openNewPlan(null); else openAddPerson(); }
    else if (e.target.closest('#invDl')) {
      var ib = e.target.closest('#invDl'); if (ib.disabled) return;
      ib.disabled = true; $('invErr').hidden = true;
      MM.invExport.download().then(function (file) { toast(t('Downloaded as Excel: {name}', { name: file })); }, function () { if ($('invErr')) $('invErr').hidden = false; }).then(function () { ib.disabled = false; });
    }
    else if (e.target.closest('#out')) { MM.auth.signOut(); location.replace('login.html'); }
  });
  document.addEventListener('input', function (e) { if (e.target.id === 'find') { find = e.target.value; listShown = LIST_PART; draw(); } });
  /* build 154: the new plan's name and example follow what she types */
  document.addEventListener('input', function (e) { if ($('pPrev') && $('sheet').contains(e.target)) { if ($('aErr')) $('aErr').hidden = true; planPreview(); } });
  /* build 149: finding a sales agent in the list of ticks hides the others; it never draws the page again */
  document.addEventListener('input', function (e) {
    if (e.target.id !== 'aPickFind') return;
    var q = e.target.value.trim().toLowerCase();
    [].forEach.call(document.querySelectorAll('#aPick [data-pick]'), function (b) { b.hidden = !!q && b.dataset.name.indexOf(q) === -1; });
    /* a team none of whose people match is hidden with its heading */
    [].forEach.call(document.querySelectorAll('#aPick .rows'), function (r) { var none = ![].some.call(r.children, function (b) { return !b.hidden; }); r.hidden = none; if (r.previousElementSibling) r.previousElementSibling.hidden = none; });
  });
  /* build 141: "Another plan" shows the two numbers it asks for */
  document.addEventListener('change', function (e) { if (e.target.id === 'rPl' && $('rPlO')) { $('rPlO').hidden = e.target.value !== 'other'; if ($('pErr')) $('pErr').hidden = true; } });
  document.addEventListener('input', function (e) { if ((e.target.id === 'rPd' || e.target.id === 'rPy') && $('pErr')) $('pErr').hidden = true; });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') { if (an().closePane()) return; if (glassTeam) closeTeamGlass(); else closeSheet(); } });
  /* build 214: Enter on a step's field is Next */
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Enter' || !FL || !e.target.closest || !e.target.closest('#sheet .fl-step') || e.target.tagName === 'TEXTAREA') return;
    var st = FL.steps[FL.at]; if (st.last || st.choose) return;
    e.preventDefault(); flowNext();
  });

  /* for the check script: the email rule, without a browser tap */
  MM.adminSuggestEmail = suggestEmail;

  $('scr').innerHTML = '<p class="note center">' + t('Opening the accounts…') + '</p>';
  /* the demo has no accounts to read: its page is the plans */
  if (DEMO && !BOOK) { $('scr').classList.add('in'); draw(); return; }
  load().then(function () { $('scr').classList.add('in'); draw(); }, function () {
    $('scr').innerHTML = '<p class="note center">' + t('The accounts could not be opened. Check the connection and open the page again.') + '</p><button class="btn ghost" type="button" id="out">' + t('Sign out') + '</button>';
  });
}());
