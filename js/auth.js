/* ------------------------------------------------------------------
   Main Marks — who is signed in.

   WHY THIS EXISTS AT ALL. Not to keep anybody out: the reason is that
   every offer and every WhatsApp post this app produces is stamped with
   the salesperson who made it. That stamp is what gives the sales
   manager the picture nobody has today — who is working which brokerage,
   who has gone quiet. Without a sign-in we would be asking people to
   type their own name, and they would type it differently every time.

   WHAT IT IS TODAY. The list of people lives in js/config.js and the
   session lives on the device. That is honest attribution, and it is not
   security. When the back end is stood up, signIn() talks to it and
   nothing else in the app changes, because every screen reads the
   SESSION, never the list.

   THE RULES IT KEEPS
   - It never blocks the app from LOADING. The page boots behind the gate
     so that the moment a session is valid the projects are already there.
   - It survives no signal. The session is read from the device; a
     salesperson standing in a brokerage with no bars can still open a
     unit and make an offer.
   - A role the app does not recognise gets NOTHING. Fail closed.
   - It records nothing about a customer, here or anywhere else.

   BUILD 122: THE REAL STORE. Where CONFIG.store is in use (see real()),
   signIn() asks the database: the person signs in with the email and
   password the admin gave him, and his name, role and team come from his
   row there, never from this file. The demo accounts do not work there,
   and a store session does not work on the demo link. Everything else in
   the app still reads the SESSION, so nothing else changed.
   ------------------------------------------------------------------ */

(function (root) {
  'use strict';

  var MM = root.MM || (root.MM = {});
  var KEY = 'mm.session.v1';

  function cfg() { return typeof CONFIG !== 'undefined' ? CONFIG : {}; }

  /* ---- the real store (build 122) -----------------------------------
     IS THIS PAGE ON THE STORE? Yes wherever the config names one (build
     124): the store is the app. No, on a copy published without it, and in
     a browser switched to the demo by hand (login.html?store=demo), which
     is how the demo book is still shown on this machine. */
  function store() {
    var s = cfg().store;
    return s && s.url && s.key ? s : null;
  }
  function real() {
    var s = store(), flag = '';
    if (!s || typeof location === 'undefined') return false;      /* the check scripts load this file outside a browser */
    try { flag = localStorage.getItem('mm.store') || ''; } catch (e) { flag = ''; }
    return flag !== 'demo';
  }

  /* One call to the store. Resolves { status, body } whatever the answer;
     rejects only when there is no connection at all. `token` is the signed-in
     person's; without it the public key goes, which opens nothing. */
  function api(path, o, token) {
    var s = store();
    o = o || {};
    return fetch(s.url + path, {
      method: o.method || 'GET',
      headers: { apikey: s.key, Authorization: 'Bearer ' + (token || s.key), 'Content-Type': 'application/json' },
      body: o.body ? JSON.stringify(o.body) : undefined
    }).then(function (r) {
      return r.text().then(function (x) {
        var j = null;
        try { j = x ? JSON.parse(x) : null; } catch (e) { j = null; }
        return { status: r.status, body: j };
      });
    });
  }

  /* The person's own row: name, role, team. An account that is switched off,
     or that has no row, gets back an empty list (the database's rule), and an
     empty list is not a person. */
  function person(id, access) {
    return api('/rest/v1/mm_people?id=eq.' + encodeURIComponent(id) +
      '&select=id,name,title,staff_code,role,team_id,active,must_change_password', null, access)
      .then(function (r) { return r.status === 200 && Array.isArray(r.body) && r.body[0] && r.body[0].active ? r.body[0] : (r.status === 200 ? null : false); });
  }

  /* Every project that is released: which projects a person may sell is not
     in the store yet, so on the store everybody sells what is on sale. */
  function allProjects() { return (cfg().projects || []).map(function (p) { return p.id; }); }

  function sessionOf(p, email, tok) {
    return {
      id: p.id, name: p.name, email: email || '', role: p.role, phone: '',
      staff: p.staff_code || '', team: p.team_id || '', title: p.title || '',
      projects: allProjects(), demo: false, real: true,
      mustChange: !!p.must_change_password,
      access: tok.access_token, refresh: tok.refresh_token,
      exp: Date.now() + (Number(tok.expires_in) || 3600) * 1000,
      at: new Date().toISOString()
    };
  }

  /* o: { who, code } -> a PROMISE of { ok: true, session } | { ok: false, why } */
  function signInReal(o) {
    var who = String((o && o.who) || '').trim().toLowerCase();
    var code = String((o && o.code) || '');
    if (!who) return Promise.resolve({ ok: false, why: 'Enter your work email.' });
    if (!code) return Promise.resolve({ ok: false, why: 'Enter your password.' });
    var tok = null;
    return api('/auth/v1/token?grant_type=password', { method: 'POST', body: { email: who, password: code } })
      .then(function (r) {
        if (r.status !== 200 || !r.body || !r.body.access_token) {
          var c = (r.body && (r.body.error_code || r.body.code)) || '';
          if (c === 'user_banned') return { ok: false, why: 'This account is switched off. Ask the admin.' };
          if (r.status === 400 || r.status === 401 || r.status === 422) return { ok: false, why: 'That email and password do not match.' };
          return { ok: false, why: 'Signing in is not answering. Try again in a moment.' };
        }
        tok = r.body;
        return person(tok.user.id, tok.access_token).then(function (p) {
          if (p === false) return { ok: false, why: 'Signing in is not answering. Try again in a moment.' };
          if (!p) return { ok: false, why: 'This account is switched off. Ask the admin.' };
          if (!(cfg().roles || {})[p.role]) return { ok: false, why: 'This account has no role set. Ask for it to be fixed before using the app.' };
          var s = sessionOf(p, who, tok);
          write(s);
          live = s;
          return { ok: true, session: s };
        });
      })
      .catch(function () { return { ok: false, why: 'No connection. Signing in needs the internet.' }; });
  }

  /* ---- the session --------------------------------------------------
     Kept in localStorage, not sessionStorage: a salesperson signs in once
     on their phone and should not be asked again tomorrow. */
  function read() {
    try {
      var raw = localStorage.getItem(KEY);
      if (!raw) return null;
      var s = JSON.parse(raw);
      if (!s || !s.id || !s.role) return null;
      /* A role that is no longer configured is not a session. */
      if (!(cfg().roles || {})[s.role]) return null;
      /* a demo session is not a store session, and the other way round */
      if (!!s.real !== real()) return null;
      return s;
    } catch (e) {
      return null;            /* private mode, or a store we cannot read */
    }
  }

  function write(s) {
    try { localStorage.setItem(KEY, JSON.stringify(s)); return true; }
    catch (e) { return false; }   /* the sign-in still works for this visit */
  }

  var live = null;              /* the session for this page, once resolved */

  function current() {
    if (live) return live;
    live = read();
    return live;
  }

  /* ---- signing in ---------------------------------------------------
     o: { who, code }  ->  { ok: true, session } | { ok: false, why }

     `who` is the WORK EMAIL — what the team already has and already
     remembers. The name and the id are accepted too, because a
     salesperson handed a phone types their name. Matching ignores case
     and stray spaces. Nothing is matched against a phone number: Main
     Marks has not sent the team, and guessing a format we would have to
     change later is how you end up supporting two. */
  function signIn(o) {
    if (real()) return signInReal(o);
    var users = cfg().users || [];
    var who = String((o && o.who) || '').trim().toLowerCase().replace(/\s+/g, ' ');
    var code = String((o && o.code) || '').trim();
    if (!who) return { ok: false, why: 'Enter your work email.' };
    if (!code) return { ok: false, why: 'Enter your password.' };

    var found = null;
    for (var i = 0; i < users.length; i++) {
      var u = users[i];
      if (who === String(u.email || '').toLowerCase() ||
          who === String(u.name || '').toLowerCase() ||
          who === String(u.id || '').toLowerCase()) { found = u; break; }
    }
    /* ONE message for a wrong email and a wrong password. Two messages
       tell a stranger which half they got right. */
    if (!found || String(found.code) !== code) {
      return { ok: false, why: 'That email and password do not match.' };
    }
    if (!(cfg().roles || {})[found.role]) {
      return { ok: false, why: 'This account has no role set. Ask for it to be fixed before using the app.' };
    }

    var s = {
      id: found.id,
      name: found.name,
      email: found.email || '',
      role: found.role,
      phone: found.phone || '',
      staff: found.staff || '',
      projects: Array.isArray(found.projects) ? found.projects.slice() : [],
      demo: !!cfg().usersDemo,
      at: new Date().toISOString()
    };
    write(s);
    live = s;
    return { ok: true, session: s };
  }

  function signOut() {
    var s = current();
    /* tell the store too, so the session cannot be used again; if there is no signal the phone is still signed out */
    if (s && s.real && s.access) { try { api('/auth/v1/logout', { method: 'POST' }, s.access).catch(function () {}); } catch (e) { /* signed out here anyway */ } }
    try { localStorage.removeItem(KEY); } catch (e) { /* nothing to clear */ }
    live = null;
  }

  /* ---- the store: staying signed in ----------------------------------
     The store's pass lasts an hour and is renewed with a second one. A
     promise of a pass that works, for whatever is about to call the store.
     Rejects 'offline' with no signal (the person stays signed in: he can
     still make an offer), and 'out' when the store will not renew it (the
     account was switched off, or signed out elsewhere): then he is signed
     out here too. */
  var renewing = null;
  function token() {
    var s = current();
    if (!s || !s.real) return Promise.reject(new Error('out'));
    if (s.exp - Date.now() > 60000) return Promise.resolve(s.access);
    if (renewing) return renewing;
    renewing = api('/auth/v1/token?grant_type=refresh_token', { method: 'POST', body: { refresh_token: s.refresh } })
      .then(function (r) {
        renewing = null;
        if (r.status === 200 && r.body && r.body.access_token) {
          s.access = r.body.access_token; s.refresh = r.body.refresh_token;
          s.exp = Date.now() + (Number(r.body.expires_in) || 3600) * 1000;
          write(s); live = s;
          return s.access;
        }
        if (r.status === 400 || r.status === 401 || r.status === 403) { bounce(); throw new Error('out'); }
        throw new Error('offline');
      }, function () { renewing = null; throw new Error('offline'); });
    return renewing;
  }

  /* One signed-in call to the store: { status, body }. Rejects with no signal or when signed out. */
  function call(path, o) { return token().then(function (access) { return api(path, o, access); }); }

  function bounce() {
    try { localStorage.removeItem(KEY); } catch (e) { /* nothing to clear */ }
    live = null;
    if (!/login\.html$/.test(location.pathname)) location.replace('login.html');
  }

  /* IS HE STILL WHO THE PHONE SAYS? Asked once per page, in the background,
     never in the way of the page. Switched off since he signed in: he is
     signed out. Role, name or team changed by the admin: the session takes
     the new ones, and a changed role reloads the page so the right screens
     show. No signal: nothing happens. */
  var verified = false;
  /* NOT WHILE THE ENTRY ANIMATION IS ON THE GLASS (build 130). On a page that opens through the logo
     build, these answers used to land while the letters were rising, and each one cost the animation
     a frame. Nothing here is needed under a black screen, so it waits for the black to go
     (MM.markbuild.after, which runs it at once on every other page). */
  /* build 132: My activity opens on the pulse, which offers the same `after` as MM.entry (js/manager.js) */
  function quiet(fn) { var e = MM.markbuild || MM.entry; if (e && e.after) e.after(fn); else fn(); }
  function verify() {
    if (verified) return;
    verified = true;
    quiet(verifyNow);
  }
  function verifyNow() {
    token().then(function (access) {
      var s = current();
      if (!s) return;
      return person(s.id, access).then(function (p) {
        if (p === false) return;                       /* the store did not answer: leave him be */
        if (!p || !(cfg().roles || {})[p.role]) { bounce(); return; }
        var was = s.role;
        s.name = p.name; s.role = p.role; s.staff = p.staff_code || ''; s.team = p.team_id || '';
        s.title = p.title || ''; s.mustChange = !!p.must_change_password;
        write(s); live = s;
        if (was !== p.role) { location.reload(); return; }
        flushOffers();
        marks(access);
        return companies(access);
      });
    }).catch(function () { /* offline, or already signed out */ });
  }

  /* THE BROKERAGE COMPANIES (build 125). On the store the list an agent chooses from is the admin's:
     a company she adds is offered to everyone, one she switches off is not. It is fetched once per page,
     in the background, and kept on the phone, so "Who is this offer for?" still has its list with no
     signal. On the demo the list in js/config.js is used; on the real app that file has none (build 128)
     and a phone with no list yet fetches it when the sheet opens (loadCompanies). */
  var CO_KEY = 'mm.companies.v1';
  function companies(access) {
    return api('/rest/v1/mm_companies?select=id,name&active=eq.true&order=name', null, access).then(function (r) {
      if (r.status !== 200 || !Array.isArray(r.body)) return;
      try { localStorage.setItem(CO_KEY, JSON.stringify(r.body)); } catch (e) { /* this visit only */ }
    });
  }
  /* [{ id, name }] from the store, or null when this is the demo or nothing has been fetched yet */
  function companyList() {
    if (!real()) return null;
    try {
      var a = JSON.parse(localStorage.getItem(CO_KEY) || 'null');
      return Array.isArray(a) && a.length ? a : null;
    } catch (e) { return null; }
  }
  /* The list, fetched NOW (build 128). The real app's js/config.js carries no company list any more, so
     nothing stands in for it: "Who is this offer for?" calls this when the phone has none yet. Answers
     with [{ id, name }]; rejects with no signal, or when the store does not hand the list over. */
  function loadCompanies() {
    return token().then(function (access) { return companies(access); }).then(function () {
      var a = companyList();
      if (!a) throw new Error('offline');
      return a;
    });
  }

  /* EVERY OFFER SENT IS SAVED (build 127). Called when an offer leaves the app. It never stands in the
     way of the send: the row is put on a list kept on the phone first, then sent to the store, and what
     the store has not confirmed is sent again on the next page (so an offer made with no signal is
     still counted). Each row carries its own reference, made here, so a row sent twice is saved once.
     o: { company: name | null (a general broadcast), product, channel: 'pdf' | 'post', unit, area, value, key }
     A company that is not on the admin's list cannot be counted for a company: it is saved as a
     general broadcast, and "Who is this offer for?" says so before the send. */
  var OFFERS_KEY = 'mm.offers.queue.v1';
  function queued() { try { var a = JSON.parse(localStorage.getItem(OFFERS_KEY) || '[]'); return Array.isArray(a) ? a : []; } catch (e) { return []; } }
  function setQueued(a) { try { localStorage.setItem(OFFERS_KEY, JSON.stringify(a)); } catch (e) { /* this visit only */ } }
  function companyId(name) {
    var list = companyList() || [], want = String(name || '').trim().toLowerCase(), i;
    if (!want) return null;
    for (i = 0; i < list.length; i++) if (String(list[i].name).trim().toLowerCase() === want) return list[i].id;
    return null;
  }
  /* ON A PHONE THE OFFER LEAVES THROUGH THE SHARE SHEET, and the phone may put this page to sleep, or
     throw it away, while the agent is in WhatsApp. So the row is written to the phone BEFORE the share
     sheet opens (offerLeaving, held), and released when the sheet answers (offerLeft), or removed when
     the agent closed the sheet without sending (offerNotSent). A held row found by a LATER page means
     the page died with the sheet open: a closed sheet comes straight back to a living page, so that
     row is an offer that went, and it is saved. */
  var holding = {}, heard = {};
  function offerLeaving(o) { var ref = logOffer(o, true); if (ref) holding[ref] = true; return ref; }
  /* saved (build 129): called once with the store's row when this send is saved, if this page is still
     here to hear it. A general broadcast's row says how many times it has left the app today. */
  function offerLeft(ref, saved) {
    if (!ref) return;
    delete holding[ref];
    if (typeof saved === 'function') heard[ref] = saved;
    setQueued(queued().map(function (r) { if (r.p_client_ref === ref) delete r.hold; return r; }));
    flushOffers();
  }
  function offerNotSent(ref) {
    if (!ref) return;
    delete holding[ref];
    setQueued(queued().filter(function (r) { return r.p_client_ref !== ref; }));
  }
  function logOffer(o, hold) {
    var s = current(), q, ref;
    if (!real() || !s || !s.real) return null;
    o = o || {};
    q = queued();
    ref = 'o-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 12);
    q.push({ by: s.id, hold: hold ? 1 : undefined,
      p_client_ref: ref,
      propose: o.propose && o.company ? String(o.company).trim() : undefined,
      p_company: o.propose ? null : companyId(o.company), p_product: o.product || null, p_channel: o.channel === 'post' ? 'post' : 'pdf',
      p_unit: o.unit || null, p_area: o.area || null, p_value: o.value || null, p_sent_at: new Date().toISOString(),
      /* build 129: what the offer is (js/lineflow.js offerKey). The store joins the sends of one general
         broadcast on it; left out when the page did not say, and then nothing is joined. */
      p_offer_key: o.key ? String(o.key).slice(0, 200) : undefined });
    setQueued(q.slice(-200));
    if (!hold) flushOffers();
    return ref;
  }
  var flushing = false, tried = {};
  function flushOffers() {
    var s = current(), mine;
    if (flushing || !real() || !s || !s.real) return;
    /* each row is tried once per page: one the store will not take now waits for the next page */
    mine = queued().filter(function (r) { return r.by === s.id && !tried[r.p_client_ref] && !(r.hold && holding[r.p_client_ref]); });
    if (!mine.length) return;
    flushing = true;
    var done = function (ref) { setQueued(queued().filter(function (r) { return r.p_client_ref !== ref; })); };
    var next = function (i) {
      if (i >= mine.length) { flushing = false; flushOffers(); return; }   /* an offer sent meanwhile */
      var r = mine[i], body = {};
      tried[r.p_client_ref] = true;
      Object.keys(r).forEach(function (k) { if (k !== 'by' && k !== 'hold' && k !== 'propose') body[k] = r[k]; });
      var refusedForGood = function (x) { return !!(x.body && /MM_/.test(String(x.body.message || ''))); };
      var save = function () {
        return call('/rest/v1/rpc/mm_log_offer', { method: 'POST', body: body }).then(function (x) {
          /* saved, or refused for good (the store's own code): either way it does not wait any longer */
          if (x.status === 200 || refusedForGood(x)) done(r.p_client_ref);
          var h = heard[r.p_client_ref];
          if (x.status === 200 || refusedForGood(x)) delete heard[r.p_client_ref];
          if (h && x.status === 200) { try { h(x.body); } catch (e) { /* the page's own business */ } }
          next(i + 1);
        });
      };
      /* a company not on the list: the store names it first (the same name always gets the same company) */
      (r.propose ? call('/rest/v1/rpc/mm_propose_company', { method: 'POST', body: { p_name: r.propose } }).then(function (x) {
        if (x.status === 200 && typeof x.body === 'string') { body.p_company = x.body; return save(); }
        if (refusedForGood(x)) done(r.p_client_ref);
        next(i + 1);
      }) : save()).catch(function () { flushing = false; });
    };
    next(0);
  }

  /* A COMPANY THAT IS NOT ON THE LIST (build 127). An agent may send to a company the admin has not
     listed: it is saved for that company, which waits for the admin. She approves it, or rules it a
     listed company spelled differently, and that counts against him. Three, and he can no longer
     propose a company (the store refuses; this is only so the screen says so first). */
  function marks(access) {
    return api('/rest/v1/rpc/mm_my_wrong_names', { method: 'POST', body: {} }, access).then(function (r) {
      var s = current();
      if (r.status !== 200 || !s || typeof r.body !== 'number') return;
      s.wrong = r.body; write(s); live = s;
    }, function () { /* no signal: the last answer stands */ });
  }
  function wrongNames() { var s = current(); return (s && s.real && Number(s.wrong)) || 0; }
  function mayPropose() { return wrongNames() < 3; }

  /* A PERSON CHOOSES HIS OWN PASSWORD. Resolves { ok } | { ok: false, why }. */
  function changePassword(pw) {
    pw = String(pw || '');
    if (pw.length < 8) return Promise.resolve({ ok: false, why: 'Use at least 8 characters.' });
    return token().then(function (access) {
      return api('/auth/v1/user', { method: 'PUT', body: { password: pw } }, access).then(function (r) {
        if (r.status !== 200) {
          var c = (r.body && (r.body.error_code || r.body.code)) || '';
          if (c === 'same_password') return { ok: false, why: 'Choose a password that is not the one you were given.' };
          return { ok: false, why: 'The password could not be changed. Try again.' };
        }
        var s = current();
        if (s) { s.mustChange = false; write(s); live = s; }
        /* clears the "choose your own password" notice in the store; the password itself is already changed */
        return api('/rest/v1/rpc/mm_password_changed', { method: 'POST', body: {} }, access).then(function () { return { ok: true }; }, function () { return { ok: true }; });
      });
    }).catch(function (e) {
      return { ok: false, why: e && e.message === 'offline' ? 'No connection. Signing in needs the internet.' : 'The password could not be changed. Try again.' };
    });
  }


  /* ---- the guard ----------------------------------------------------
     Called at the top of every page that needs a person. Returns the
     session, or sends the browser to the sign-in page and returns null.
     Carries where we were going, so signing in lands on the page that was
     asked for rather than dumping everyone on the project list. */
  function require(returnTo) {
    var s = current();
    if (s) {
      /* build 123: the admin has one page. Anywhere else he is taken to it; and it is nobody else's. */
      var page = location.pathname.split('/').pop() || 'index.html';
      if (s.role === 'admin' && page !== 'admin.html') { location.replace('admin.html'); return null; }
      if (s.real) verify();
      return s;
    }
    var here = returnTo || (location.pathname.split('/').pop() + location.search);
    location.replace('login.html?next=' + encodeURIComponent(here));
    return null;
  }

  /* What this person may do. A role the config does not know returns a
     permission set with everything off. */
  function can(what) {
    var s = current();
    if (!s) return false;
    var r = (cfg().roles || {})[s.role];
    return !!(r && r[what]);
  }

  /* The projects this person may sell, in config order, plus the ones
     that are not released — those are shown to everybody, because they
     are part of the story, and opened by nobody. */
  function visibleProjects() {
    var s = current();
    var all = cfg().projects || [];
    if (!s) return [];
    var mine = s.projects || [];
    return all.filter(function (p) {
      return p.ready !== true || mine.indexOf(p.id) !== -1;
    });
  }

  function maySell(id) {
    var s = current();
    if (!s) return false;
    return (s.projects || []).indexOf(id) !== -1 && !!MM.sellableProject(id);
  }

  /* WHICH MEMBER OF THE SALES TEAM IS SIGNED IN (build 121): the place of
     this salesperson in CONFIG.salesTeam.members, found by staff code, or -1.
     -1 is the answer for a manager, for an account with no staff code, and
     on a copy published without the team: there the salesperson has no
     "My activity", and nothing links to it. A session saved before build 121
     carries no staff code, so the account is looked up by its id. */
  function member() {
    var s = current(), team = cfg().salesTeam, staff = '', i;
    /* build 127: on the store My activity reads the store, so every sales agent has it. His place in
       his team is the book's to say (js/manager-book.js `me`); here the answer is only yes or no. */
    if (real()) return s && s.real && s.role === 'sales' ? 0 : -1;
    if (!s || s.role !== 'sales' || !team || !Array.isArray(team.members)) return -1;
    staff = s.staff || '';
    if (!staff) (cfg().users || []).forEach(function (u) { if (u.id === s.id) staff = u.staff || ''; });
    if (!staff) return -1;
    for (i = 0; i < team.members.length; i++) if (team.members[i].code === staff) return i;
    return -1;
  }

  /* back from WhatsApp, or back online: send what is waiting */
  if (typeof document !== 'undefined' && document.addEventListener) {
    document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'visible') { tried = {}; flushOffers(); } });
    root.addEventListener('online', function () { tried = {}; flushOffers(); });
    root.addEventListener('pageshow', function () { quiet(flushOffers); });
  }

  MM.auth = {
    real: real,
    token: token,
    call: call,
    companyList: companyList,
    loadCompanies: loadCompanies,
    logOffer: logOffer,
    wrongNames: wrongNames,
    mayPropose: mayPropose,
    offerLeaving: offerLeaving,
    offerLeft: offerLeft,
    offerNotSent: offerNotSent,
    changePassword: changePassword,
    member: member,
    current: current,
    signIn: signIn,
    signOut: signOut,
    require: require,
    can: can,
    visibleProjects: visibleProjects,
    maySell: maySell
  };

  if (typeof module === 'object' && module.exports) module.exports = MM.auth;
}(typeof window !== 'undefined' ? window : globalThis));
