/* ------------------------------------------------------------------
   Main Marks — the sales manager view (manager.html).

   THE SPECIFICATION is section 7c of the Moray App Brief, agreed with
   Muhanad over six rounds of a phone mock (2026-10-05 and 06). In short:

   - THE FIRST LOOK IS ONE HEADLINE, WHAT IT COMPARES TO, AND THE NAMES
     THAT NEED HIM. A number alone leads to no action.
   - HOME HAS TWO MODES. One day is about the TEAM ("is my team working,
     who needs me now"). A week or more is about the COMPANIES ("which do
     I call, visit or leave, and is it turning into sales").
   - THE HEADLINE IS SPECIAL REQUESTS, never "offers sent": count offers
     and the team sends broadcasts to nobody. Broadcasts sit beside it.
   - HOME STAYS SHORT: the gauge, four tiles, two short lists. Every tile
     opens its list in a sheet, with a download.
   - THE PAGE NEVER PRESCRIBES. It shows the situation; deciding what to
     do about a company is the manager's job.
   - HIS TEAM ONLY. Nothing here can show another team's activity with a
     company, because the book holds no other team's rows.
   - A CANCELLED RESERVATION IS KEPT: struck through, with its date and
     reason, and counted apart.

   THE FIGURES ARE A DEMO BOOK (js/manager-book.js): real people, real
   companies, real units and prices; invented activity. Every screen says
   "demo figures" and every download says DEMO.

   STATES, the working rule: asked in the last 2 weeks = active, in the
   last 4 = gone quiet, earlier = inactive. "Inactive after a month" is
   Muhanad's; the 2-week early warning is ours and is not confirmed.
   ------------------------------------------------------------------ */
(function () {
  'use strict';

  var MM = window.MM, t = MM.t, AR = MM.isArabic;
  /* TWO PAGES, ONE SCRIPT (build 121). manager.html is the sales manager's Team Pulse. my.html is a
     salesperson's "My activity": the same book, the same rules and the same pieces, narrowed to that one
     person's rows. One script on purpose: a salesperson's figures and the manager's figures for that
     salesperson are worked out by the same lines, so the two pages cannot disagree. `MY` is true on
     my.html; `ME` (set in start) is the salesperson's place in the team. */
  var MY = document.documentElement.getAttribute('data-view') === 'my';
  /* ---- THE PULSE (build 132) -----------------------------------------------------------------
     Muhanad, 2026-10-09, "Look 1" of the mock he tapped: when a sales agent taps the heartbeat to see
     his activity, the manager start page's dial sweeps in and the orange heartbeat draws through it,
     alone on the screen, and then My activity comes up exactly as it was. His reason for this look
     and not a dial ON the page: a sales agent's first look stays his own total sales; active, gone
     quiet and inactive are the manager's to work with.

     The drawing is in my.html and is on the glass from the first frame; css/manager.css moves it.
     This decides WHEN, by the rules js/markbuild.js was measured into (build 130), and measured again
     here (Main Marks Store\tests\measure-pulse.js, a processor slowed six times):
       - IT STARTS WHEN THE SCREEN CAN KEEP UP (steady): the page loaded and three frames in a row
         on time, never held longer than CAP. Until then the empty dial stands still.
       - NOTHING ELSE WORKS WHILE THE LINES ARE BEING DRAWN. His figures and the price file arrive
         when the line gives them, and reading them is real work: measured, it landed in the middle
         of the sweep and held a frame for a third of a second. So this page offers what a product
         page's logo build offers (MM.entry: hold, calm, after), and js/inventory.js, js/auth.js and
         js/manager-book.js use it without knowing which animation it is:
           calm(fn)   now, unless the lines are moving; then the moment they have come to rest
           after(fn)  once the dial has gone (is he still signed in, an offer waiting on the phone)
       - THE PAGE IS BUILT AT REST, UNDER THE DIAL, AND THE DIAL LIFTS WHEN THE SCREEN CAN KEEP UP
         AGAIN (build, below).
       - IF HIS FIGURES ARE NOT HERE YET the heartbeat keeps beating until they are (.wait): on a
         slow line the wait is the pulse, not an empty screen.
     Not for Profile, not for the plus, not for a person who asked for less motion: then `then` runs
     what it is given at once and all of this is no more than a function call.
     It stands before the sign-in check on purpose: that check asks the store whether he is still
     switched on, and it must find `after` here to wait behind. */
  var pulse = (function () {
    var el = MY ? document.getElementById('pulseIn') : null;
    var MIN = 1380, CAP = 1200;
    /* a person who asked for less motion has no pulse (the stylesheet removes the dial as well). Asked of
       the setting itself, not of the dial: on Profile the dial is hidden and the pulse must still be
       there for the tap on the heartbeat. */
    var can = !!el && !!window.requestAnimationFrame && !(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    var on = can && !el.hidden, began = 0, due = null, timer = 0, replay = false, waiting = false, lifting = false;
    var rest = [], gone = [];
    var api;
    function each(list) { list.forEach(function (fn) { try { fn(); } catch (e) { /* one must not stop the next */ } }); }
    function moving() { return on && !!began && Date.now() - began < MIN; }
    function begin() {
      if (!on || began) return;
      began = Date.now();
      el.classList.add('play');
      /* the heartbeat on the bar draws itself again with it */
      var b = document.querySelector('#tab [data-t="my"]');
      if (b) { if (b.classList.contains('beat')) { b.classList.remove('beat'); void b.offsetWidth; } b.classList.add('beat'); }
      timer = setTimeout(rested, MIN);
    }
    /* the lines have been drawn. What waited for that (calm) runs now; it is usually his figures, and
       reading them ends in `then`, which goes on to build the page. */
    function rested() {
      if (!on) return;
      var list = rest;
      rest = [];
      each(list);
      /* build 133: asked again whether or not `then` has spoken. It used to ask only when nothing was due,
         and so a `then` that came WHILE the lines were being drawn was never acted on if anything at all
         had waited for them: the store not answering (it fails at once, and the price file waits here) and
         the tap from Profile (due from the first moment) both left the dial standing for good. If what
         waited has just called `then` itself, the page is already being built and `on` is down. */
      if (list.length) setTimeout(function () { if (on && !waiting) ripe(); }, 0);
      else ripe();
    }
    function ripe() {
      if (!on) return;
      if (!due) { waiting = true; el.classList.add('wait'); return; }      /* his figures are not here yet: it keeps beating */
      if (!waiting) { build(); return; }
      /* they came while the heartbeat was drawing itself again: build when the line is whole (the end of
         a beat, 1.3 s at most), so the page's work never freezes a half-drawn line */
      waiting = false;
      var beat = el.querySelector('.g-beat'), done = false;
      var whole = function () {
        if (done) return;
        done = true;
        beat.removeEventListener('animationiteration', whole);
        if (!on) return;
        el.classList.add('rest');
        build();
      };
      beat.addEventListener('animationiteration', whole);
      setTimeout(whole, 1400);
    }
    /* BUILD THE PAGE NOW, STILL, UNDER THE DIAL; THEN LIFT WHEN THE SCREEN CAN KEEP UP AGAIN. Measured:
       building My activity holds the page for well over a second on the slowed processor, and its first
       drawing for a few frames more. Lifting on the heels of that made every frame of the lift late. So
       draw() builds the page without its rise while `building` is up and leaves the rise in `enter`; the
       dial lifts, and the cards rise under it, only once two frames in a row have come on time (half a
       second at most). */
    function build() {
      var fn = due;
      due = null; on = false; replay = false; lifting = true;
      api.building = true;
      try { fn(); } finally {
        api.building = false;
        steady(function () {
          var enter = api.enter;
          api.enter = null;
          if (enter) enter();
          el.classList.add('leave');
          setTimeout(function () {
            el.hidden = true; el.className = 'pulse-in';
            lifting = false;
            var list = gone;
            gone = [];
            each(list);
          }, 460);
        }, 500, 2);
      }
    }
    /* `go` once the page has loaded and `need` frames in a row have come on time (under 40 ms, which
       also passes a phone in low-power mode); past `cap` one frame on time is enough, and half a second
       after that it goes anyway. The rule of whenSteady in js/markbuild.js, which this page does not load. */
    function steady(go, cap, need) {
      var t0 = Date.now(), last = 0, good = 0, went = false;
      var start = function () { if (!went) { went = true; go(); } };
      var frame = function (ts) {
        if (went) return;
        var gap = last ? ts - last : 0, waited = Date.now() - t0;
        last = ts;
        good = (gap && gap < 40 && document.readyState === 'complete') ? good + 1 : 0;
        if (good >= need || (waited > cap && gap && gap < 40) || waited > cap + 500) { start(); return; }
        requestAnimationFrame(frame);
      };
      requestAnimationFrame(frame);
      /* frames never came (a background tab): go anyway rather than hold the dial */
      setTimeout(start, cap + 2500);
    }
    if (on) steady(begin, CAP, 3);
    api = {
      building: false,       /* true while `fn` runs under the dial: draw() then builds without the rise */
      enter: null,           /* the rise draw() left for the lift */
      /* `fn` builds the page: now if there is no pulse, otherwise when it has played */
      then: function (fn) {
        if (!on) { fn(); return; }
        due = fn;
        if (began && Date.now() - began >= MIN) ripe();
      },
      /* now, unless the lines are being drawn; then the moment they are at rest */
      calm: function (fn) { if (moving()) rest.push(fn); else fn(); },
      /* once the dial has gone; now if there is none. Never forgotten: after eight seconds it runs anyway. */
      after: function (fn) {
        if (!on && !lifting) { fn(); return; }
        var ran = false, once = function () { if (!ran) { ran = true; fn(); } };
        gone.push(once);
        setTimeout(once, 8000);
      },
      /* the heartbeat tapped from another tab of this page: play it over the page, then `fn`.
         Answers false when there is no pulse to play, and the caller goes straight on. */
      again: function (fn) {
        if (!can || on || lifting) return false;
        clearTimeout(timer);
        el.className = 'pulse-in again'; el.hidden = false;
        on = true; replay = true; waiting = false; began = 0; due = fn;
        requestAnimationFrame(begin);
        return true;
      },
      /* he tapped somewhere else while it was coming in: drop it */
      cancel: function () {
        if (!on || !replay) return;
        clearTimeout(timer);
        on = false; replay = false; due = null;
        el.hidden = true; el.className = 'pulse-in';
        each(rest); rest = [];
      }
    };
    return api;
  }());
  /* the price file needs no hold here: the pulse does not wait for it, its reading does (calm) */
  if (MY) MM.entry = { hold: function () { return function () {}; }, calm: pulse.calm, after: pulse.after };

  var session = MM.auth.require(MY ? 'my.html' : 'manager.html');
  if (!session) return;
  /* build 127: on the store My activity reads the store (js/manager-book.js). Team Pulse still draws the
     DEMO book, so on the store it stays closed until it reads the store too (build 128). */
  if (MM.auth.real() && !MY) { location.replace('index.html'); return; }
  /* Fail closed: Team Pulse is the sales manager's, My activity is a salesperson's who is on the team.
     The director and CCO views are not built. */
  if (MY ? MM.auth.member() === -1 : session.role !== 'sales_manager') { location.replace('index.html'); return; }

  var $ = function (id) { return document.getElementById(id); };
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  /* a name inside a sentence keeps its own direction: brokerage names are Latin or Arabic */
  var nm = function (s) { return '<bdi>' + esc(s) + '</bdi>'; };

  /* ---- words ---------------------------------------------------------
     A count needs a form for exactly one, and Arabic needs four: one,
     two, 3 to 10, and 11 up. [en one, en many, ar 1, ar 2, ar 3-10, ar 11+] */
  var NOUN = {
    company: ['company', 'companies', 'شركة واحدة', 'شركتان', 'شركات', 'شركة'],
    salesperson: ['sales agent', 'sales agents', 'مندوب واحد', 'مندوبان', 'مندوبين', 'مندوباً'],
    meeting: ['meeting', 'meetings', 'اجتماع واحد', 'اجتماعان', 'اجتماعات', 'اجتماعاً'],
    deal: ['deal', 'deals', 'صفقة واحدة', 'صفقتان', 'صفقات', 'صفقة'],
    offer: ['offer', 'offers', 'عرض واحد', 'عرضان', 'عروض', 'عرضاً'],
    request: ['request', 'requests', 'طلب واحد', 'طلبان', 'طلبات', 'طلباً'],
    broadcast: ['broadcast', 'broadcasts', 'منشور عام واحد', 'منشوران عامان', 'منشورات عامة', 'منشوراً عاماً'],
    contract: ['contract', 'contracts', 'عقد واحد', 'عقدان', 'عقود', 'عقداً'],
    reservation: ['reservation', 'reservations', 'حجز واحد', 'حجزان', 'حجوزات', 'حجزاً'],
    cancellation: ['cancellation', 'cancellations', 'إلغاء واحد', 'إلغاءان', 'إلغاءات', 'إلغاءً'],
    post: ['WhatsApp post', 'WhatsApp posts', 'بوست واتساب واحد', 'بوستان على واتساب', 'بوستات واتساب', 'بوست واتساب'],
    pdf: ['offer PDF', 'offer PDFs', 'ملف PDF واحد', 'ملفان PDF', 'ملفات PDF', 'ملف PDF']
  };
  NOUN.orientation = ['orientation', 'orientations', 'جلسة تعريفية واحدة', 'جلستان تعريفيتان', 'جلسات تعريفية', 'جلسة تعريفية'];
  NOUN.workshop = ['workshop', 'workshops', 'ورشة عمل واحدة', 'ورشتا عمل', 'ورش عمل', 'ورشة عمل'];
  NOUN.day = ['day', 'days', 'يوم واحد', 'يومين', 'أيام', 'يوماً'];
  NOUN.special = ['special request', 'special requests', 'طلب خاص واحد', 'طلبان خاصان', 'طلبات خاصة', 'طلباً خاصاً'];
  NOUN.entry = ['entry', 'entries', 'إدخال واحد', 'إدخالان', 'إدخالات', 'إدخالاً'];
  function count(n, k) {
    var N = NOUN[k];
    if (!AR) return n + ' ' + (n === 1 ? N[0] : N[1]);
    if (n === 1) return N[2];
    if (n === 2) return N[3];
    var r = n % 100;
    return MM.iso(n) + ' ' + (n === 0 || (r >= 3 && r <= 10) ? N[4] : N[5]);
  }
  var STATE = { active: t('Active'), quiet: t('Gone quiet'), inactive: t('Inactive'), never: t('Never asked') };
  var ORDER = ['active', 'quiet', 'inactive', 'never'];
  var KIND = { special: t('Special request'), broadcast: t('Broadcast'), meeting: t('Meeting'), reservation: t('Reservation'), contract: t('Contract'), cancel: t('Cancelled reservation'), orientation: t('Orientation'), workshop: t('Workshop') };
  var PROD = { 'Commercial': t('Commercial'), 'Offices': t('Offices'), 'The Fourth': 'The Fourth', 'Clinics': t('Clinics'), 'Serviced apartments': t('Serviced apartments') };
  var CH = { post: t('WhatsApp post'), pdf: t('Offer PDF') };
  var WHYL = { 'Client withdrew': t('Client withdrew'), 'Payment not made': t('Payment not made'), 'Moved to another unit': t('Moved to another unit'), 'Other': t('Other') };
  var TITLE = { 'Sales Manager': t('Sales Manager'), 'Sales Director': t('Sales Director'), 'Assistant Sales Manager': t('Assistant Sales Manager'), 'Sales Supervisor': t('Sales Supervisor'), 'Senior Property Consultant': t('Senior Property Consultant'), 'Property Consultant': t('Property Consultant') };
  var MON = AR ? ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر']
               : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  var prod = function (p) { return PROD[p] || p; };
  var title = function (s) { return TITLE[s] || s; };

  var ICON = {
    home: '<path d="M4 11l8-7 8 7v8a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1z"/>',
    companies: '<path d="M4 20V6l7-2v16M11 20V9l9 2v9M3 20h18M7 9v0M7 13v0M15 14v0"/>',
    team: '<circle cx="9" cy="8" r="3.2"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6M16 5.2a3.2 3.2 0 0 1 0 5.6M17.5 14.3c2.1.8 3.5 2.9 3.5 5.7"/>',
    analysis: '<path d="M4 20V10M10 20V4M16 20v-7M21 20H3"/>',
    profile: '<circle cx="12" cy="8.5" r="3.6"/><path d="M4.5 20c0-4 3.4-6.5 7.5-6.5s7.5 2.5 7.5 6.5"/>',
    dl: '<path d="M12 4v11M7 11l5 5 5-5M5 20h14"/>',
    cal: '<rect x="4" y="5.5" width="16" height="15" rx="2.5"/><path d="M4 10h16M8.5 3v4M15.5 3v4"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    send: '<path d="M21 3L10 14M21 3l-6.5 18-4.5-7-7-4.5z"/>'
  };
  ICON.offer = ICON.send;
  ICON.my = '<path d="M3 12h4l2.5-7 4 14 2.5-7h5"/>';
  var svg = function (k) { return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + ICON[k] + '</svg>'; };

  /* a salesperson's bar is three: the sales app (another page), his own activity, his profile */
  var TABS = MY ? [['offer', t('Quick Offer')], ['my', t('My activity')], ['profile', t('Profile')]]
                : [['home', t('Home')], ['companies', t('Companies')], ['team', t('Team')], ['analysis', t('Analysis')], ['profile', t('Profile')]];

  function fail() {
    $('scr').innerHTML = '<section class="card"><h2>' + (MY ? t('My activity') : t('Manager view')) + '</h2><p class="note">' + t('The figures could not be loaded. Check the connection and open the page again.') + '</p>' +
      '<a class="btn ghost" href="index.html">' + t('Open the sales app') + '</a></section>';
  }

  /* build 132: a sales agent's bar is drawn as soon as the page's words are in place, not when his
     figures arrive, so the bar he tapped on the page before is still there under his thumb while the
     pulse plays. Only "Quick Offer" answers until the page is built. (After DOMContentLoaded on
     purpose: js/i18n.js rewrites every [data-t] in the page then, and these buttons carry one.) */
  var started = false;
  function barFirst() {
    if (started || !MY) return;
    var asked = (location.hash || '').slice(1);
    $('tab').innerHTML = TABS.map(function (x) { return '<button type="button" data-t="' + x[0] + '"' + (x[0] === (asked === 'profile' ? 'profile' : 'my') ? ' aria-current="page"' : '') + '>' + svg(x[0]) + '<span>' + x[1] + '</span></button>'; }).join('');
    $('tab').classList.add('three');
    $('tab').hidden = false;
  }
  if (MY) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', barFirst); else barFirst();
    $('tab').addEventListener('click', function (e) { var b = e.target.closest('button'); if (!started && b && b.dataset.t === 'offer') location.href = 'index.html'; });
  }

  MM.managerBook.load().then(function (B) { pulse.then(function () { start(B); }); }, function () { pulse.then(fail); });

  function start(B) {
    started = true;
    var TEAM = B.team, MGR = B.manager, SPAN = B.span, NOW = B.now;
    /* `all` is the team's rows. `events` is what this page shows: the team's for the manager, and for a
       salesperson only the rows that carry his name (his own, a deal split with him, a visit he joined). */
    var ME = MY ? (B.me !== undefined ? B.me : MM.auth.member()) : -1, WHO = MY ? TEAM[ME] : MGR, all, events;
    function load() { all = B.events(); events = MY ? all.filter(function (e) { return e.m === ME || e.m2 === ME; }) : all; }
    load();
    /* a company an agent proposed and the admin has not ruled on yet says so beside its name */
    var book = B.companies.map(function (name, id) { return { id: id, name: B.waiting && B.waiting(id) ? name + ' · ' + t('waiting for approval') : name }; });
    var count4 = {};

    /* ---- the state of each company with this team ---------------------
       On a given day (days ago): asked in the last 2 weeks = active, in the
       last 4 = gone quiet, earlier = inactive, never = never asked. */
    function stateAt(c, at) {
      var ds = c.asked.filter(function (d) { return d >= at; });
      if (!ds.length) return 'never';
      var age = Math.min.apply(null, ds) - at;
      return age < 14 ? 'active' : age < 28 ? 'quiet' : 'inactive';
    }
    function refresh() {
      count4 = { active: 0, quiet: 0, inactive: 0, never: 0 };
      book.forEach(function (c) {
        var mine = events.filter(function (e) { return e.c === c.id && e.k === 'offer'; });
        c.asked = mine.map(function (e) { return e.d; });
        c.w = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        c.asked.forEach(function (d) { c.w[11 - Math.min(11, Math.floor(d / 7))]++; });
        c.total = mine.length;
        c.days = mine.length ? Math.min.apply(null, c.asked) : null;
        c.first = mine.length ? Math.max.apply(null, c.asked) : null;
        c.state = stateAt(c, 0);
        count4[c.state]++;
        c.noMeet = c.asked.filter(function (d) { return d < 30; }).length >= 6 && !events.some(function (e) { return e.c === c.id && e.k === 'meeting'; });
        c.req30 = c.asked.filter(function (d) { return d < 30; }).length;
        c.ev = events.filter(function (e) { return e.c === c.id; });
        c.reqs = mine.slice().sort(function (a, b) { return b.d - a.d || a.t - b.t; });          /* oldest first */
        /* what followed a visit is judged on the TEAM's rows on both pages, so a salesperson reads the
           same outcome for his orientation as his manager does */
        c.evT = MY ? all.filter(function (e) { return e.c === c.id; }) : c.ev;
        c.reqsT = MY ? c.evT.filter(function (e) { return e.k === 'offer'; }).sort(function (a, b) { return b.d - a.d || a.t - b.t; }) : c.reqs;
        c.step = stepAt(c, 0);
        var by = {}; mine.forEach(function (e) { by[e.m] = (by[e.m] || 0) + 1; });
        c.who12 = Object.keys(by).sort(function (a, b) { return by[b] - by[a]; }).map(function (m) { return { m: +m, n: by[m] }; });
      });
    }

    /* ---- THE LADDER (build 119) ------------------------------------------
       How far a company has EVER got with this team; the gauge is whether it is talking to the team
       NOW. A company stands on one step, the highest it has reached, so a company can be on
       "Reserved" here and "Inactive" on the gauge. Muhanad asked what it meant, so the card says
       it in words and every step opens its companies. */
    var STEP = [[t('Never asked'), t('Never asked'), t('Has not sent your team a request yet.')], [t('Asked'), t('Asked, no meeting yet'), t('Has sent your team requests, and has not brought a client to a meeting.')],
      [t('Meeting'), t('Brought a meeting'), t('Has brought a client to a meeting. No reservation yet.')], [t('Reserved'), t('Reserved'), t('Has made a reservation. No contract yet.')], [t('Contract'), t('Contract'), t('Has signed a contract.')]];
    function stepAt(c, at) {
      var has = function (k) { return c.ev.some(function (e) { return e.k === k && e.d >= at; }); };
      return has('contract') ? 4 : has('reservation') ? 3 : has('meeting') ? 2 : has('offer') ? 1 : 0;
    }
    function handled(c) { return c.who12.slice(0, 2).map(function (x) { return TEAM[x.m].name; }).join(AR ? '، ' : ', '); }

    /* ---- ORIENTATIONS AND WORKSHOPS (build 119) -----------------------------
       A visit is shown beside what followed it, never as a bare count: a visit is easy to log.
       THE RULES ARE MUHANAD'S (2026-10-06), in BUSINESS days: an orientation "led to a request" when
       the company's next request came within 7 business days; a workshop "led to a meeting" when a
       meeting followed within 14 business days. Friday is the day off, so it is never counted, and
       neither is the day of the visit itself. STILL OURS, to confirm: an orientation at a company
       that asked in the 14 days before it reads "was already asking". */
    var LED_REQUEST = 7, LED_MEETING = 14;
    var isVisit = function (e) { return e.k === 'orientation' || e.k === 'workshop'; };
    /* business days from a visit (days ago) to what followed it (days ago, the smaller number) */
    function businessDays(visit, next) { var n = 0, d; for (d = visit - 1; d >= next; d--) if (B.dateOf(d).getDay() !== 5) n++; return n; }
    function later(n) { return n === 0 ? t('the same day') : t('{n} later', { n: count(n, 'day') }); }
    function followed(v) {
      var c = book[v.c], was, next;
      if (v.k === 'orientation') {
        was = c.reqsT.filter(function (e) { return e.d > v.d; });
        next = c.reqsT.filter(function (e) { return e.d <= v.d; })[0];
        if (was.length && was[was.length - 1].d - v.d < 14) return { ok: false, text: t('was already asking') };
        if (next && businessDays(v.d, next.d) <= LED_REQUEST) return { ok: true, text: was.length ? t('asking again {when}', { when: later(v.d - next.d) }) : t('first request {when}', { when: later(v.d - next.d) }) };
        /* "yet" only while the 7 days are still running: after them a late request does not count, and the row must not say none came */
        return { ok: false, text: businessDays(v.d, 0) <= LED_REQUEST ? t('no request yet') : t('no request within 7 business days') };
      }
      var meets = c.evT.filter(function (e) { return e.k === 'meeting'; }).sort(function (a, b) { return b.d - a.d; });
      was = meets.filter(function (e) { return e.d > v.d; });
      next = meets.filter(function (e) { return e.d <= v.d; })[0];
      if (next && businessDays(v.d, next.d) <= LED_MEETING) return { ok: true, text: was.length ? t('a meeting {when}', { when: later(v.d - next.d) }) : t('first meeting {when}', { when: later(v.d - next.d) }) };
      return { ok: false, text: businessDays(v.d, 0) <= LED_MEETING ? t('no meeting yet') : t('no meeting within 14 business days') };
    }

    /* ---- the dates ----------------------------------------------------- */
    var PERIODS = [['today', t('Today'), 0, 0], ['yest', t('Yesterday'), 1, 1], ['week', t('This week'), 6, 0], ['month', t('Last 30 days'), 29, 0], ['all', t('Last 12 weeks'), SPAN, 0], ['c', t('Custom dates')]];
    /* the manager opens on today (is my team working); a salesperson on the last 30 days (his sales and his companies) */
    var period = MY ? { key: 'month', from: 29, to: 0 } : { key: 'today', from: 0, to: 0 }, menuOpen = false;
    function inP(e) { return e.d <= period.from && e.d >= period.to; }
    function fmt(ago) { var d = B.dateOf(ago); return d.getDate() + ' ' + MON[d.getMonth()]; }
    function hhmm(m) { return String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0'); }
    function iso(ago) { return B.iso(B.dateOf(ago)); }
    function agoOf(s) { var d = B.fromIso(s); return d ? Math.max(0, Math.min(SPAN, B.agoOf(d))) : null; }
    function periodName() { var P = PERIODS.filter(function (x) { return x[0] === period.key; })[0]; return period.key === 'c' ? fmt(period.from) + ' – ' + fmt(period.to) : P[1]; }
    function rangeText() { var y = B.dateOf(period.to).getFullYear(); return period.from === period.to ? fmt(period.from) + ' ' + y : fmt(period.from) + ' – ' + fmt(period.to) + ' ' + y; }
    function tally(list) {
      var o = { special: 0, broadcast: 0, meeting: 0, reservation: 0, contract: 0, cancel: 0, orientation: 0, workshop: 0, value: 0 };
      list.forEach(function (e) { if (e.k === 'offer') o[e.c === null ? 'broadcast' : 'special']++; else o[e.k]++; if (e.k === 'contract') o.value += e.v; });
      o.offers = o.special + o.broadcast;
      return o;
    }
    function distinct(list, key) { var s = {}; list.forEach(function (e) { if (e[key] !== null && e[key] !== undefined) s[e[key]] = 1; }); return Object.keys(s).map(Number); }
    function newest(a, b) { return a.d - b.d || b.t - a.t; }
    var workday = function (ago) { return B.dateOf(ago).getDay() !== 5; };

    var A = {};
    function compute() {
      var inPer = events.filter(inP);
      A.list = inPer;
      A.tot = tally(inPer);
      A.byC = {}; book.forEach(function (c) { A.byC[c.id] = tally(inPer.filter(function (e) { return e.c === c.id; })); });
      A.effective = book.filter(function (c) { return A.byC[c.id].meeting > 0; }).length;
      A.fresh = book.filter(function (c) { return c.first !== null && c.first <= period.from && c.first >= period.to; });
      A.people = TEAM.map(function (p, i) {
        var mine = inPer.filter(function (e) { return e.m === i || e.m2 === i; });
        return { id: i, name: p.name, title: p.title, code: p.code, n: tally(mine), companies: distinct(mine.filter(function (e) { return e.k === 'offer'; }), 'c').length, last: mine.slice().sort(newest)[0] || null };
      }).sort(function (a, b) { return b.n.special - a.n.special || b.n.offers - a.n.offers || a.name.localeCompare(b.name); });
      A.maxOffers = Math.max.apply(null, A.people.map(function (p) { return p.n.offers; })) || 1;
      A.sending = A.people.filter(function (p) { return p.n.offers > 0; }).length;
      A.deals = inPer.filter(function (e) { return e.k === 'reservation' || e.k === 'contract' || e.k === 'cancel'; }).sort(newest);
      A.single = period.from === period.to;                       /* one day: the page is about the TEAM; longer: about the COMPANIES */
      A.asked = distinct(inPer.filter(function (e) { return e.k === 'offer'; }), 'c');
      A.reached = distinct(inPer, 'c').length;
      /* compared to what: a normal day by this hour (the working days of the 28 before), or the same length of time just before */
      var len = period.from - period.to + 1, upTo = period.to === 0 ? NOW : 24 * 60, days = 0, d;
      var before = events.filter(function (e) { return e.d > period.from && e.d <= period.from + (A.single ? 28 : len); });
      for (d = period.from + 1; d <= period.from + 28; d++) if (workday(d)) days++;
      A.normal = A.single && period.from + 28 <= SPAN ? Math.round(before.filter(function (e) { return e.k === 'offer' && e.c !== null && e.t <= upTo; }).length / days) : null;
      A.prev = (!A.single && period.from + len <= SPAN) ? tally(before) : null;
      /* who changed: each company's state the day before these dates, against today */
      A.delta = null; A.changed = [];
      if (!A.single && period.from + 1 <= SPAN - 14) {
        A.delta = { active: 0, quiet: 0, inactive: 0, never: 0 };
        book.forEach(function (c) { c.was = stateAt(c, period.from + 1); A.delta[c.state]++; A.delta[c.was]--; if (c.was !== c.state) A.changed.push(c); });
        var RANK = { quiet: 0, inactive: 1, active: 2, never: 3 };
        A.changed.sort(function (a, b) { return RANK[a.state] - RANK[b.state] || b.total - a.total; });
      }
      A.visits = inPer.filter(isVisit).sort(newest).map(function (e) { return { e: e, f: followed(e) }; });
      A.led = { orientation: 0, workshop: 0 };
      A.visits.forEach(function (x) { if (x.f.ok) A.led[x.e.k]++; });
      A.move = A.delta && !MY ? movement() : null;
      /* a salesperson's page: his reservations still open today, and what he entered in the dates (an
         offer is never entered, it is counted when it is sent; a cancellation is the manager's) */
      A.open = MY ? events.filter(function (e) { return e.k === 'reservation' && !e.end; }).sort(newest) : [];
      /* newest first; two entries made in the same minute keep the later one on top, so what he just saved is the first row */
      A.entered = MY ? inPer.filter(function (e) { return e.k !== 'offer' && e.k !== 'cancel'; }).sort(function (a, b) { return newest(a, b) || (b.mine ? 1 : 0) - (a.mine ? 1 : 0) || String(b.id).localeCompare(String(a.id)); }) : [];
      A.salesByC =book.map(function (c) { return { c: c, v: A.byC[c.id].value, n: A.byC[c.id].contract }; }).filter(function (x) { return x.n; }).sort(function (a, b) { return b.v - a.v; });
    }

    /* ---- small pieces --------------------------------------------------- */
    var look = { tab: MY ? 'my' : 'home', filter: 'all', query: '', deck: 0, mv: 0, grp: {}, all: {} };
    function weekLabel(i) { return t('Week of {date}', { date: fmt((11 - i) * 7 + 6) }); }
    function strip(c) { return '<span class="strip" role="img" aria-label="' + esc(t('Requests in each of the last 12 weeks')) + '">' + c.w.map(function (n, i) { return '<i class="' + (n ? 'on' + Math.min(3, n) : '') + '" title="' + esc(weekLabel(i)) + ': ' + n + '"></i>'; }).join('') + '</span>'; }
    function pill(state, beat) { return '<span class="pill ' + (beat && state === 'quiet' ? 'q' : '') + '"><i class="s-' + state + '"></i>' + STATE[state] + '</span>'; }
    function ago(c) { return c.days === null ? t('No request yet') : c.days === 0 ? t('Asked today') : c.days === 1 ? t('Last asked yesterday') : t('Last asked {n} days ago', { n: c.days }); }
    function num(n) { return '<b data-n="' + n + '">' + n + '</b>'; }
    function mil(v) { return String(Math.round(v / 1e5) / 10); }
    function money(v) { return t('EGP {n}M', { n: mil(v) }); }
    function when(e) { return e.d === 0 ? hhmm(e.t) : fmt(e.d); }
    /* THE WEEK BARS (build 118; Muhanad: the bars "do not give me details, how many requests, what this
       date means"). Every column now prints its own number, the dates run under the chart, and a column
       says its week in words when the pointer, the keyboard or a finger reaches it.
       weeks: [{ n, info }], oldest first. */
    var barInfo = [];
    function bars(weeks, cls) {
      var max = Math.max.apply(null, weeks.map(function (w) { return w.n; })) || 1, pick = 11, i;
      for (i = 11; i >= 0; i--) if (weeks[i].n) { pick = i; break; }
      barInfo = weeks.map(function (w) { return w.info; });
      return '<div class="chart"><div class="big ' + (cls || '') + '">' + weeks.map(function (w, k) {
        return '<button type="button" class="col' + (k === pick ? ' on' : '') + '" data-w="' + k + '" style="--d:' + k + '" aria-label="' + esc(w.info) + '">' + (w.mark ? '<em>' + esc(w.mark) + '</em>' : '') + '<b>' + (w.n || '') + '</b><i class="' + (w.n ? '' : 'z') + '" style="--h:' + (w.n ? Math.max(.1, w.n / max).toFixed(3) : '.05') + '"></i></button>';
      }).join('') + '</div><div class="wk">' + [0, 3, 6, 9].map(function (k) { return '<span>' + fmt((11 - k) * 7 + 6) + '</span>'; }).join('') + '</div>' +
        '<p class="barinfo" id="barinfo" aria-live="polite">' + esc(weeks[pick].info) + '</p></div>';
    }
    function barPick(col) {
      var box = col.closest('.chart'), info = barInfo[+col.dataset.w];
      if (!box || info === undefined) return;
      [].forEach.call(box.querySelectorAll('.col'), function (c) { c.classList.toggle('on', c === col); });
      box.querySelector('.barinfo').textContent = info;
    }
    function weekRange(i) { return fmt((11 - i) * 7 + 6) + ' – ' + fmt((11 - i) * 7); }
    /* 12 weeks of one list of events, each described by `describe(events of that week) -> { n, text }` */
    function weeksOf(list, describe) {
      var w = [], i;
      for (i = 0; i < 12; i++) w.push([]);
      list.forEach(function (e) { w[11 - Math.min(11, Math.floor(e.d / 7))].push(e); });
      return w.map(function (ev, k) { var d = describe(ev); return { n: d.n, mark: d.mark || '', from: (11 - k) * 7 + 6, to: (11 - k) * 7, info: weekRange(k) + ': ' + d.text }; });
    }
    function extras(n) {
      var out = [];
      if (n.meeting) out.push(count(n.meeting, 'meeting'));
      if (n.reservation) out.push(count(n.reservation, 'reservation'));
      if (n.contract) out.push(count(n.contract, 'contract'));
      if (n.cancel) out.push(count(n.cancel, 'cancellation'));
      if (n.orientation) out.push(count(n.orientation, 'orientation'));
      if (n.workshop) out.push(count(n.workshop, 'workshop'));
      return out;
    }
    function companyWeeks(id) {
      return weeksOf(events.filter(function (e) { return e.c === id; }), function (ev) {
        var n = tally(ev), who = {};
        ev.forEach(function (e) { if (e.k === 'offer') who[e.m] = (who[e.m] || 0) + 1; });
        var by = MY ? '' : Object.keys(who).sort(function (a, b) { return who[b] - who[a]; }).map(function (m) { return TEAM[m].name + ' ' + who[m]; }).join(AR ? '، ' : ', ');
        return { n: n.special, mark: ev.filter(isVisit).map(function (e) { return KIND[e.k].charAt(0); })[0], text: [n.special ? count(n.special, 'request') : t('no requests')].concat(extras(n), by ? [by] : []).join(' · ') };
      });
    }
    function personWeeks(id) {
      return weeksOf(events.filter(function (e) { return e.m === id || e.m2 === id; }), function (ev) {
        var n = tally(ev), comps = distinct(ev.filter(function (e) { return e.k === 'offer'; }), 'c').length;
        return { n: n.offers, text: (n.offers ? [count(n.special, 'request'), count(n.broadcast, 'broadcast'), count(comps, 'company')] : [t('nothing sent')]).concat(extras(n)).join(' · ') };
      });
    }
    function teamWeeks() {
      return weeksOf(events, function (ev) { var n = tally(ev); return { n: n.special, text: '' }; });
    }
    function kindOf(e) { return e.k === 'offer' ? (e.c === null ? 'broadcast' : 'special') : e.k; }
    function people(e) { return isVisit(e) ? nm(TEAM[e.m].name) + (e.m2 !== undefined ? ' + ' + nm(TEAM[e.m2].name) : '') : e.m2 !== undefined ? t('{a} + {b} (split)', { a: nm(TEAM[e.m].name), b: nm(TEAM[e.m2].name) }) : nm(TEAM[e.m].name); }
    function what(e) { return KIND[kindOf(e)] + (e.c !== null ? ' · ' + nm(book[e.c].name) : ''); }
    /* build 129: HOW MANY TIMES A BROADCAST WENT, and what that means in plain words (Muhanad: "if the
       user hovers on it he gets an explanation ... in very simple words"). A laptop shows it on hover,
       a phone on a tap (the click handler at the foot of this file); the words sit in the page, so a
       screen reader has them too. Only on a row the store gave a count for. */
    function sentTimes(e) {
      if (e.k !== 'offer' || e.c !== null || !e.n) return '';
      var tip = e.n === 1
        ? t('This offer was sent once. WhatsApp takes only a few chats each time, so sending it again to more chats still counts as one broadcast.')
        : t('This offer was sent {n} times. WhatsApp takes only a few chats each time, so one offer needs many sends. It counts as one broadcast.', { n: e.n });
      return ' · <button class="why" type="button" aria-expanded="false">' + (e.n === 1 ? t('sent once') : t('sent {n} times', { n: e.n })) + '</button><span class="why-tip" role="note">' + esc(tip) + '</span>';
    }
    function unitText(e) { return nm(prod(e.p) + ' ' + e.u) + (e.area ? ' · ' + t('{n} m²', { n: e.area }) : '') + (e.v ? ' · ' + money(e.v) : ''); }
    function detail(e) { return isVisit(e) ? followed(e).text : e.u ? unitText(e) : prod(e.p) + (e.ch ? ' · ' + CH[e.ch] : ''); }
    function feed(list, withName) {
      return '<div class="feed">' + list.map(function (e) { return '<div><time>' + when(e) + '</time><span>' + what(e) + sentTimes(e) + '<small>' + (withName ? people(e) + ' · ' : '') + detail(e) + (e.k === 'cancel' ? ' · ' + WHYL[e.why] : '') + '</small></span></div>'; }).join('') + '</div>';
    }
    function kv(list) { return '<div class="kv">' + list.map(function (x) { return '<div><b>' + x[0] + '</b><span>' + x[1] + '</span></div>'; }).join('') + '</div>'; }

    /* ---- the half-dial gauge -------------------------------------------- */
    function legend(segs) {
      return '<div class="legend">' + segs.map(function (g) {
        var d = g.delta ? ' <small><bdi>' + (g.delta > 0 ? '+' : '−') + Math.abs(g.delta) + '</bdi></small>' : '';
        return '<div class="lg"><i class="s-' + g.k + '"></i><b><span data-n="' + g.n + '">' + g.n + '</span>' + d + '</b><span>' + g.label + '</span></div>';
      }).join('') + '</div>';
    }
    /* segs: [{ k: colour, n, label, delta }] */
    function gauge(segs, big, small) {
      var N = segs.reduce(function (a, g) { return a + g.n; }, 0) || 1, half = Math.PI * 100, off = 0, path = 'M 20 116 A 100 100 0 0 1 220 116';
      var arcs = segs.map(function (g, i) {
        var len = half * g.n / N;
        var a = '<path class="arc c-' + g.k + '" style="--k:' + i + ';--c:' + (half * 2).toFixed(1) + '" d="' + path + '" stroke-dasharray="' + Math.max(0, len - 4).toFixed(1) + ' ' + (half * 2).toFixed(1) + '" stroke-dashoffset="' + (-off).toFixed(1) + '"/>';
        off += len;
        return g.n ? a : '';
      }).join('');
      return '<svg class="gauge" viewBox="0 0 240 128" role="img" aria-label="' + esc(segs.map(function (g) { return g.n + ' ' + g.label; }).join(', ')) + '">' + arcs +
        '<text x="120" y="98" text-anchor="middle" font-size="46" font-weight="800" data-n="' + big + '">' + big + '</text><text x="120" y="118" text-anchor="middle" font-size="11" opacity=".6">' + small + '</text></svg>' + legend(segs);
    }

    /* ---- the cards ------------------------------------------------------- */
    function head(heading) {
      return '<div class="hd' + (MY ? ' my' : '') + '"><p class="eyebrow">' + nm(WHO.name) + ' · ' + title(WHO.title) + '</p>' + (MY ? '' : swap()) + '<h1>' + heading + '</h1><button class="when" id="when" type="button" aria-expanded="' + menuOpen + '">' + svg('cal') + periodName() + '</button></div>' +
        (menuOpen ? '<div class="menu"><div class="chips">' + PERIODS.map(function (p) { return '<button class="chip" type="button" data-r="' + p[0] + '" aria-pressed="' + (period.key === p[0]) + '">' + p[1] + '</button>'; }).join('') + '</div>' +
          (period.key === 'c' ? '<div class="range"><label class="fld">' + t('From') + '<input type="date" id="dFrom" min="' + iso(SPAN) + '" max="' + iso(0) + '" value="' + iso(period.from) + '"></label><label class="fld">' + t('To') + '<input type="date" id="dTo" min="' + iso(SPAN) + '" max="' + iso(0) + '" value="' + iso(period.to) + '"></label></div>' : '') + '</div>' : '') +
        '<p class="showing">' + (MY ? t(B.demo ? 'Showing {dates} · your own activity · demo figures' : 'Showing {dates} · your own activity', { dates: '<b>' + rangeText() + '</b>' }) : t('Showing {dates} · your team only · demo figures', { dates: '<b>' + rangeText() + '</b>' })) + '</p>';
    }
    /* the way across to the sales app, on every tab: he is a seller too */
    function swap() { return '<a class="swap" href="index.html">' + svg('send') + t('Quick Offer') + '</a>'; }
    function vs(now, was, base) {
      if (was === null || was === undefined) return '';
      var d = now - was, n = Math.abs(d);
      if (base === 'normal') return d === 0 ? t('the same as a normal day') : d > 0 ? t('{n} more than a normal day', { n: n }) : t('{n} fewer than a normal day', { n: n });
      return d === 0 ? t('the same as the time before') : d > 0 ? t('{n} more than the time before', { n: n }) : t('{n} fewer than the time before', { n: n });
    }
    function personRow(p) {
      var unit = 100 / A.maxOffers, sub;
      if (!p.n.offers) sub = '<span class="idle">' + t('No offers yet') + '</span>';
      else if (A.single) sub = t('{a} special · {b} broadcast', { a: p.n.special, b: p.n.broadcast }) + (p.last ? ' · ' + t('last {time}', { time: when(p.last) }) : '');
      else sub = t('{a} special', { a: p.n.special }) + ' · ' + count(p.companies, 'company') + (p.n.value ? ' · ' + money(p.n.value) : '');
      return '<button class="row" type="button" data-m="' + p.id + '"><span class="nm">' + esc(p.name) + '</span><span class="val">' + p.n.offers + '<small>' + t('Offers') + '</small></span>' +
        '<span class="sub">' + sub + '</span><span class="mini"><i style="width:' + (p.n.special * unit).toFixed(1) + '%"></i><i style="width:' + (p.n.broadcast * unit).toFixed(1) + '%"></i><u></u></span></button>';
    }
    /* ONE DAY: the gauge is the TEAM. Who took a company's request, who only broadcast, who sent nothing. */
    function cardHeroDay() {
      var a = A.people.filter(function (p) { return p.n.special > 0; }).length, b = A.people.filter(function (p) { return !p.n.special && p.n.broadcast > 0; }).length;
      var segs = [{ k: 'active', n: a, label: t('Sent a special request') }, { k: 'quiet', n: b, label: t('Broadcast only') }, { k: 'never', n: TEAM.length - a - b, label: t('Nothing sent yet') }];
      var n = '<b>' + A.normal + '</b>';
      var line = A.normal === null ? '' : '<p class="eff">' + (period.to === 0 ? t('A normal day by {time}: {n} special requests', { time: hhmm(NOW), n: n }) : t('A normal full day: {n} special requests', { n: n })) + ' · <b>' + vs(A.tot.special, A.normal, 'normal') + '</b></p>';
      return '<section class="card"><h2>' + t('Your team') + ' <em>' + periodName() + ' · ' + count(TEAM.length, 'salesperson') + '</em></h2>' + gauge(segs, A.tot.special, t('special requests')) + line + '</section>';
    }
    /* A WEEK OR MORE: the gauge is the COMPANIES, with how each count moved since the day before these dates. */
    function cardHeroBook() {
      var segs = ORDER.map(function (k) { return { k: k, n: count4[k], label: STATE[k], delta: A.delta ? A.delta[k] : 0 }; });
      return '<section class="card"><h2>' + t('Brokerage health') + ' <em>' + t('as of today') + ' · ' + count(book.length, 'company') + '</em></h2>' + gauge(segs, count4.active, t('active of {n}', { n: book.length })) +
        '<p class="eff">' + t('Your team worked with {x} companies', { x: '<b>' + t('{a} of {b}', { a: A.reached, b: book.length }) + '</b>' }) + ' · ' + t('{n} effective', { n: '<b>' + A.effective + '</b>' }) +
        (A.delta ? ' · ' + t('changes since {date}', { date: fmt(period.from + 1) }) : '') + '</p></section>';
    }
    function tiles() {
      var n = A.tot, beside = t('{x} beside them', { x: count(n.broadcast, 'broadcast') }), list;
      if (A.single && !MY) list = [['offers', t('Special requests'), n.special, beside], ['asked', t('Companies asked'), A.asked.length, ''], ['meeting', t('Meetings'), n.meeting, ''],
        ['deals', t('Reservations and contracts'), n.reservation + n.contract, [n.cancel ? count(n.cancel, 'cancellation') : '', n.value ? t('{v} contracted', { v: money(n.value) }) : ''].filter(Boolean).join(' · ')]];
      /* a week or more: the six tiles follow the work (Muhanad, 2026-10-06): an orientation gets a company
         asking, a workshop gets an asking company to a meeting, then reservations and contracts */
      else list = [['orientation', t('Orientations'), n.orientation, n.orientation ? t('{n} led to a request', { n: A.led.orientation }) : ''],
        ['offers', t('Special requests'), n.special, A.prev ? vs(n.special, A.prev.special, 'before') : beside],
        ['workshop', t('Workshops'), n.workshop, n.workshop ? t('{n} led to a meeting', { n: A.led.workshop }) : ''],
        ['meeting', t('Meetings'), n.meeting, n.meeting ? t('1 for every {n} requests', { n: Math.max(1, Math.round(n.special / n.meeting)) }) : ''],
        ['reservation', t('Reservations'), n.reservation, n.cancel ? t('{n} cancelled in these dates', { n: n.cancel }) : t('none cancelled')],
        ['contract', t('Contracts'), n.contract, n.value ? t('{v} total sales', { v: money(n.value) }) : '']];
      return '<div class="stats">' + list.map(function (x) { return '<button class="stat" type="button" data-s="' + x[0] + '">' + num(x[2]) + '<span>' + x[1] + '</span>' + (x[3] ? '<small>' + x[3] + '</small>' : '') + '</button>'; }).join('') + '</div>';
    }
    function cardIdle() {
      var idle = A.people.filter(function (p) { return !p.n.offers; });
      return '<section class="card"><h2>' + t('Nothing sent yet') + ' <em>' + t('{a} of {b}', { a: idle.length, b: TEAM.length }) + '</em></h2>' + (idle.length ? '<div class="rows">' + idle.map(personRow).join('') + '</div>' : '<p class="note">' + t('Everyone has sent an offer.') + '</p>') + '</section>';
    }

    function changeRow(c) { return '<button class="row" type="button" data-c="' + c.id + '"><span class="nm">' + esc(c.name) + '</span><span class="val">' + A.byC[c.id].special + '<small>' + t('Requests') + '</small></span><span class="sub">' + pill(c.was) + '<span class="to"></span>' + pill(c.state, true) + '</span></button>'; }
    /* THE COMPANIES DECK (build 118; Muhanad: Home "straightly shows the gone quiet companies ... allow the
       user to swipe this card and then it shows him the active, the effective, the inactive"). One card,
       one ranked list per state; swipe it, or tap a name on top. Each list is the top five with the way
       to the whole list. The slide he is on is remembered while he moves about the page. */
    var DECK = [['quiet', STATE.quiet], ['active', STATE.active], ['effective', t('Effective')], ['inactive', STATE.inactive], ['changed', t('Changed')]];
    function deckSlides() { return DECK.filter(function (d) { return d[0] !== 'changed'; }); }      /* build 119: what changed is the Movement card */
    function cardDeck() {
      var S = deckSlides();
      if (look.deck >= S.length) look.deck = 0;
      return '<section class="card"><h2>' + (MY ? t('My companies') : t('Your companies, ranked')) + ' <em>' + t('swipe, or tap a list') + '</em></h2>' +
        '<div class="chips slide" id="deckTabs">' + S.map(function (d, i) { return '<button class="chip" type="button" data-dk="deck" data-d="' + i + '" aria-pressed="' + (i === look.deck) + '">' + d[1] + ' ' + companyMatches(d[0]).length + '</button>'; }).join('') + '</div>' +
        /* a salesperson's lists are short and uneven (2 gone quiet, 9 active): the strip follows the one on
           screen, and "the whole list" is offered only when there is more than the five shown */
        '<div class="deck' + (MY ? ' fit' : '') + '" id="deck">' + S.map(function (d) {
          var list = companyMatches(d[0]);
          return '<div class="dslide">' + (list.length ? rankHead(d[0]) + '<div class="rows">' + list.slice(0, 5).map(rankRow(d[0])).join('') + '</div>' + (MY && list.length <= 5 ? '' : '<button class="go" type="button" data-go="' + d[0] + '"><span>' + t('See the whole list') + '</span><b>' + list.length + '</b></button>') : '<p class="note">' + t('No company here in these dates.') + '</p>') + '</div>';
        }).join('') + '</div>' +
        '<div class="dots" id="deckDots" aria-hidden="true">' + S.map(function (d, i) { return '<i class="' + (i === look.deck ? 'on' : '') + '"></i>'; }).join('') + '</div></section>';
    }
    /* which slide is showing: the one whose start is nearest the strip's scroll position (works mirrored too) */
    function deckAt(k) {
      var first = k.firstElementChild.offsetLeft, best = 0, gap = 1e9;
      [].forEach.call(k.children, function (s, i) { var g = Math.abs(s.offsetLeft - first - k.scrollLeft); if (g < gap) { gap = g; best = i; } });
      return best;
    }
    /* key: 'deck' (the ranked lists) or 'mv' (Movement); the strip, its chips and its dots are key, keyTabs, keyDots */
    function deckMark(key, i) {
      look[key] = i;
      [].forEach.call($(key + 'Tabs').children, function (b, n) { b.setAttribute('aria-pressed', String(n === i)); });
      [].forEach.call($(key + 'Dots').children, function (b, n) { b.className = n === i ? 'on' : ''; });
      /* Movement's lists differ a lot in length: the strip is as tall as the one on screen, not the tallest */
      if ((key === 'mv' || MY) && $(key).children[i]) $(key).style.height = $(key).children[i].offsetHeight + 'px';
    }
    function deckTo(key, i, smooth) {
      var k = $(key);
      if (!k || !k.children[i]) return;
      k.scrollTo({ left: k.children[i].offsetLeft - k.firstElementChild.offsetLeft, behavior: smooth ? 'smooth' : 'auto' });
      deckMark(key, i);
    }
    function deckInit(key) {
      var k = $(key), timer;
      if (!k || !k.children.length) return;
      deckTo(key, look[key], false);
      k.addEventListener('scroll', function () { clearTimeout(timer); timer = setTimeout(function () { if ($(key) === k) deckMark(key, deckAt(k)); }, 90); });
    }
    function cardTeamShort() {
      var top = A.people.filter(function (p) { return !A.single || p.n.offers; }).slice(0, 3);
      return '<section class="card"><h2>' + (A.single ? t('Most active') : t('Your sales agents')) + ' <em>' + t('tap a name') + '</em></h2>' + (top.length ? '<div class="rows">' + top.map(personRow).join('') + '</div>' : '') + '<button class="go' + (top.length ? '' : ' first') + '" type="button" data-tab="team"><span>' + t('See all sales agents') + '</span><b>' + TEAM.length + '</b></button></section>';
    }
    function cardTeam() { return '<section class="card"><h2>' + t('Your sales agents') + ' <em>' + t('tap a name') + '</em></h2><div class="rows">' + A.people.map(personRow).join('') + '</div></section>'; }
    function cardSalesByCompany() {
      if (!A.salesByC.length) return '';
      return '<section class="card"><h2>' + t('Sales by company') + ' <em>' + periodName() + '</em></h2><div class="rows">' + A.salesByC.slice(0, 5).map(function (x) { return '<button class="row" type="button" data-c="' + x.c.id + '"><span class="nm">' + esc(x.c.name) + '</span><span class="val">' + mil(x.v) + '<small>' + t('EGP M') + '</small></span><span class="sub">' + count(x.n, 'contract') + '</span></button>'; }).join('') + '</div></section>';
    }
    function noMeetCount() { return book.filter(function (c) { return c.noMeet; }).length; }
    function cardLook() {
      return '<section class="card"><h2>' + t('Worth a look') + ' <em>' + t('as of today') + '</em></h2><div>' +
        [['quiet', t('Gone quiet'), count4.quiet], ['nomeet', t('Many requests, no meeting'), noMeetCount()], ['never', t('Never asked'), count4.never], ['fresh', t('New in these dates'), A.fresh.length]].map(function (g, i) { return '<button class="go' + (i ? '' : ' first') + '" type="button" data-go="' + g[0] + '"><span>' + g[1] + '</span><b>' + g[2] + '</b></button>'; }).join('') + '</div></section>';
    }
    function fate(e) { return e.k === 'cancel' ? ' · ' + WHYL[e.why] : e.k !== 'reservation' ? '' : e.end === 'cancel' ? ' · ' + t('later cancelled, {date}', { date: fmt(e.endD) }) : e.end === 'contract' ? ' · ' + t('became a contract') : ' · ' + t('still open'); }
    function dealRow(e) { return '<div class="row flat' + (e.k === 'cancel' ? ' gone' : '') + '"><span class="nm">' + KIND[e.k] + ' · ' + nm(prod(e.p) + ' ' + e.u) + '</span><span class="val">' + mil(e.v) + '<small>' + t('EGP M') + '</small></span><span class="sub">' + nm(book[e.c].name) + ' · ' + people(e) + ' · ' + when(e) + fate(e) + '</span></div>'; }
    function more(n) { return '<p class="note">' + t('{n} more in the download.', { n: n }) + '</p>'; }
    function cardDeals() { return '<section class="card wide last"><h2>' + t('Reservations, contracts, cancellations') + ' <em>' + A.deals.length + '</em></h2>' + (A.deals.length ? '<div class="rows">' + A.deals.slice(0, 5).map(dealRow).join('') + '</div>' + (A.deals.length > 5 ? more(A.deals.length - 5) : '') : '<p class="note">' + t('None recorded in these dates.') + '</p>') + '</section>'; }
    function cardFeed() { var l = A.list.slice().sort(newest).slice(0, 7); return '<section class="card"><h2>' + t('Latest activity') + ' <em>' + t('newest first') + '</em></h2>' + (l.length ? feed(l, true) : '<p class="note">' + t('No activity in these dates.') + '</p>') + '</section>'; }
    /* EVERY COMPANY LIST IS A RANKING TABLE (build 118; Muhanad: "who's the first one, the second one").
       What it is ranked by follows the list: meetings for Effective; requests over the 12 weeks for Gone
       quiet and Inactive (they have none lately, that is the point); requests in the dates otherwise. */
    function metric(f) {
      if (f === 'effective') return { get: function (c) { return A.byC[c.id].meeting; }, lab: t('Meetings') };
      if (f === 'quiet' || f === 'inactive') return { get: function (c) { return c.total; }, lab: t('Requests, 12 weeks') };
      return { get: function (c) { return A.byC[c.id].special; }, lab: t('Requests') };
    }
    function companyMatches(f, q) {
      var m = metric(f);
      q = String(q || '').trim().toLowerCase();
      return book.filter(function (c) {
        if (q && c.name.toLowerCase().indexOf(q) === -1) return false;
        return f === 'all' || c.state === f || (f === 'effective' && A.byC[c.id].meeting > 0) || (f === 'nomeet' && c.noMeet) || (f === 'fresh' && A.fresh.indexOf(c) !== -1) || (f === 'changed' && A.changed.indexOf(c) !== -1);
      }).sort(function (a, b) { return m.get(b) - m.get(a) || b.total - a.total || a.name.localeCompare(b.name); });
    }
    function rankHead(f) { return '<div class="rkhead"><span>#</span><span>' + t('Company') + '</span><span>' + metric(f).lab + '</span></div>'; }
    function rankRow(f) {
      var m = metric(f);
      return function (c, i) {
        var sub = f === 'changed' && c.was ? pill(c.was) + '<span class="to"></span>' + pill(c.state, true) : pill(c.state, true) + ' · ' + ago(c);
        return '<button class="row rk" type="button" data-c="' + c.id + '"><span class="no">' + (i + 1) + '</span><span class="nm">' + esc(c.name) + '</span><span class="val">' + m.get(c) + '</span>' + strip(c) + '<span class="sub">' + sub + '</span></button>';
      };
    }
    function companyList() {
      var list = companyMatches(look.filter, look.query);
      return '<h2>' + t('History with your team') + ' <em>' + t('{n} shown', { n: list.length }) + '</em></h2>' + (list.length ? rankHead(look.filter) + '<div class="rows">' + list.map(rankRow(look.filter)).join('') + '</div>' : '<p class="note">' + t('No company matches.') + '</p>');
    }

    /* ---- MOVEMENT (build 119) ---------------------------------------------
       Muhanad's idea: track the company that was not interacting and starts to, the active one that
       becomes effective, "and so on". The gauge's "+/-" is a NET: "Active -5" was 7 companies in and
       12 out, and it named neither. This card names them, with who in the team, and what the team
       did before the move. Each company is counted once, at the furthest step it reached.
       Like the gauge's change, it runs from the day before the dates to today. */
    function firstIn(c, k) { return c.ev.filter(function (e) { return e.k === k && e.d <= period.from; }).sort(function (a, b) { return b.d - a.d || a.t - b.t; })[0]; }
    /* the nearest visit of that kind on or before day d, no more than `reach` days earlier */
    function visitBefore(c, k, d, reach) { return c.ev.filter(function (e) { return e.k === k && e.d >= d && e.d - d <= reach; }).sort(function (a, b) { return a.d - b.d; })[0] || null; }
    function movement() {
      var G = {}, plus = [0, 0, 0, 0, 0];
      [['asked', t('Started asking')], ['back', t('Came back')], ['met', t('Brought a first meeting')], ['res', t('Reached a reservation')], ['con', t('Signed a contract')], ['nomeet', t('Asking, no meeting yet')],
        ['oriented', t('Orientation done, no request yet')], ['quiet', t('Went quiet')], ['inactive', t('Became inactive')]].forEach(function (x) { G[x[0]] = { key: x[0], label: x[1], rows: [] }; });
      book.forEach(function (c) {
        var l0 = stepAt(c, period.from + 1), l1 = c.step, e, i;
        c.l0 = l0;
        if (l1 > l0) plus[l1]++;
        if (l1 > l0 && l1 === 4) G.con.rows.push({ c: c, e: firstIn(c, 'contract') });
        else if (l1 > l0 && l1 === 3) G.res.rows.push({ c: c, e: firstIn(c, 'reservation'), meet: l0 < 2 ? firstIn(c, 'meeting') : null });
        else if (l1 > l0 && l1 === 2) G.met.rows.push({ c: c, e: firstIn(c, 'meeting') });
        else if (l1 > l0) G.asked.rows.push({ c: c, e: firstIn(c, 'offer') });
        else if ((c.was === 'quiet' || c.was === 'inactive') && c.state === 'active') {
          e = firstIn(c, 'offer'); i = c.reqs.indexOf(e);
          if (e && i > 0) G.back.rows.push({ c: c, e: e, gap: c.reqs[i - 1].d - e.d });
        }
        if (c.was === 'active' && c.state === 'quiet') G.quiet.rows.push({ c: c });
        else if (c.state === 'inactive' && (c.was === 'active' || c.was === 'quiet')) G.inactive.rows.push({ c: c });
        if (c.noMeet) G.nomeet.rows.push({ c: c });
        if (c.state === 'never') { e = visitBefore(c, 'orientation', 0, SPAN); if (e) G.oriented.rows.push({ c: c, e: e }); }
      });
      var byName = function (a, b) { return a.c.name.localeCompare(b.c.name); };
      G.asked.rows.sort(function (a, b) { return A.byC[b.c.id].special - A.byC[a.c.id].special || byName(a, b); });
      G.back.rows.sort(function (a, b) { return b.gap - a.gap || byName(a, b); });
      G.met.rows.sort(function (a, b) { return a.e.d - b.e.d || byName(a, b); });
      [G.res, G.con].forEach(function (g) { g.rows.sort(function (a, b) { return b.e.v - a.e.v || byName(a, b); }); });
      G.nomeet.rows.sort(function (a, b) { return b.c.req30 - a.c.req30 || b.c.total - a.c.total || byName(a, b); });
      [G.quiet, G.inactive].forEach(function (g) { g.rows.sort(function (a, b) { return b.c.total - a.c.total || byName(a, b); }); });
      return { plus: plus, G: G, up: [G.asked, G.back, G.met, G.res, G.con], still: [G.nomeet, G.oriented], down: [G.quiet, G.inactive] };
    }
    function moveCount(list) { return list.reduce(function (a, g) { return a + g.rows.length; }, 0); }
    /* what the team did before the move, and what followed; or, where it matters, that nothing is recorded */
    function touchOf(c, kinds, d) { var v = null; kinds.forEach(function (k) { v = v || visitBefore(c, k, d, 45); }); return v; }
    function touchBox(c, kinds, d, none) {
      var v = touchOf(c, kinds, d), f;
      if (!v) return none ? '<span class="mv-touch none"><span>' + none + '</span></span>' : '';
      f = followed(v);
      return '<span class="mv-touch"><span><b>' + KIND[v.k] + '</b> ' + fmt(v.d) + ' · ' + esc(TEAM[v.m].name) + '</span><span class="res' + (f.ok ? ' ok' : '') + '">' + f.text + '</span></span>';
    }
    function moveRow(key) {
      return function (r) {
        var c = r.c, e = r.e, big, small, sub, box = '', who = function (x) { return esc(TEAM[x.m].name); };
        var path = pill(c.was) + '<span class="to"></span>' + pill(c.state, true) + '<br>', now = c.state !== 'active' ? ' · ' + pill(c.state, true) : '';
        var by = t('handled by {names}', { names: esc(handled(c)) });
        if (key === 'asked') { big = A.byC[c.id].special; small = t('Requests'); sub = path + t('First request {date}', { date: fmt(e.d) }) + ' · ' + who(e); box = touchBox(c, ['orientation'], e.d, t('No orientation recorded')); }
        else if (key === 'back') { big = A.byC[c.id].special; small = t('Requests'); sub = path + t('Back on {date} after {n}', { date: fmt(e.d), n: count(r.gap, 'day') }) + ' · ' + t('{name} took the request', { name: who(e) }); box = touchBox(c, ['orientation', 'workshop'], e.d, t('No orientation or workshop recorded')); }
        else if (key === 'met') { big = fmt(e.d); small = t('First meeting'); sub = who(e) + ' · ' + prod(e.p) + now; box = touchBox(c, ['workshop', 'orientation'], e.d, t('No workshop recorded')); }
        else if (key === 'res' || key === 'con') { big = mil(e.v); small = t('EGP M'); sub = nm(prod(e.p) + ' ' + e.u) + ' · ' + who(e) + ' · ' + fmt(e.d) + (r.meet ? ' · ' + t('first meeting {date}', { date: fmt(r.meet.d) }) : '') + now; box = r.meet ? touchBox(c, ['workshop'], r.meet.d) : ''; }
        else if (key === 'nomeet') { big = c.req30; small = t('Requests, 30 days'); sub = pill(c.state, true) + ' · ' + by; box = touchBox(c, ['workshop'], 0, t('No workshop recorded')); }
        else if (key === 'oriented') { big = e.d; small = t('Days since'); sub = pill('never') + ' · ' + t('no request to your team yet'); box = touchBox(c, ['orientation'], 0); }
        else { big = c.total; small = t('Requests, 12 weeks'); sub = path + ago(c) + ' · ' + by; }
        return '<button class="row" type="button" data-c="' + c.id + '"><span class="nm">' + esc(c.name) + '</span><span class="val' + (key === 'met' ? ' d' : '') + '">' + big + '<small>' + small + '</small></span><span class="sub">' + sub + '</span>' + box + '</button>';
      };
    }
    /* one line per kind of move, with its names; a tap opens it to the companies */
    function moveGroup(g) {
      var on = !!look.grp[g.key], rows = g.rows, cut = !look.all[g.key] && rows.length > 5 ? rows.slice(0, 5) : rows;
      if (!rows.length) return '';
      return '<button class="mv-grp" type="button" data-g="' + g.key + '" aria-expanded="' + on + '"><span class="t">' + g.label + '</span><span class="n">' + rows.length + '</span><span class="names">' + rows.map(function (r) { return nm(r.c.name); }).join(AR ? '، ' : ', ') + '</span></button>' +
        (on ? '<div class="mv-list">' + cut.map(moveRow(g.key)).join('') + (cut.length < rows.length ? '<button class="mv-more" type="button" data-all="' + g.key + '">' + t('Show all {n}', { n: rows.length }) + '</button>' : '') + '</div>' : '');
    }
    function ladder() {
      var n = [0, 0, 0, 0, 0]; book.forEach(function (c) { n[c.step]++; });
      return '<div class="mv-ladder">' + STEP.map(function (st, i) {
        var p = A.move && A.move.plus[i];
        return '<button class="mv-step" type="button" data-step="' + i + '" style="--s:' + i + '" aria-label="' + esc(n[i] + ' · ' + st[1]) + '"><b data-n="' + n[i] + '">' + n[i] + '</b><u><bdi>' + (p ? '+' + p : '') + '</bdi></u><span>' + st[0] + '</span></button>';
      }).join('') + '</div><p class="mv-cap"><b>' + t('How far each of your {n} companies has ever got with your team.', { n: book.length }) + '</b> ' + t('Each company stands on one step, the highest it has reached.') + ' ' +
        (A.move ? t('{green} is how many climbed onto that step in these dates.', { green: '<span class="g">' + t('Green') + '</span>' }) + ' ' : '') + t('Tap a step for its companies.') + '</p>';
    }
    function cardMovement() {
      var M = A.move, S = M ? [[t('Moved up'), M.up], [t('Not moving'), M.still], [t('Moved down'), M.down]] : [];
      if (look.mv >= S.length) look.mv = 0;
      return '<section class="card"><h2>' + t('Movement') + ' <em>' + (M ? t('since {date}', { date: fmt(period.from + 1) }) : t('as of today')) + '</em></h2>' +
        (M ? '<p class="note">' + t('{a} moved up and {b} moved down. {c} not moving.', { a: '<b>' + count(moveCount(M.up), 'company') + '</b>', b: '<b>' + moveCount(M.down) + '</b>', c: moveCount(M.still) }) + '</p>' : '') + ladder() +
        (M ? '<div class="chips slide" id="mvTabs">' + S.map(function (x, i) { return '<button class="chip" type="button" data-dk="mv" data-d="' + i + '" aria-pressed="' + (i === look.mv) + '">' + x[0] + ' ' + moveCount(x[1]) + '</button>'; }).join('') + '</div>' +
          '<div class="deck mv" id="mv">' + S.map(function (x) { return '<div class="dslide">' + (moveCount(x[1]) ? x[1].map(moveGroup).join('') : '<p class="note">' + t('No company here in these dates.') + '</p>') + '</div>'; }).join('') + '</div>' +
          '<div class="dots" id="mvDots" aria-hidden="true">' + S.map(function (x, i) { return '<i class="' + (i === look.mv ? 'on' : '') + '"></i>'; }).join('') + '</div>' : '') + '</section>';
    }
    /* a step of the ladder: what it means, who climbed onto it in the dates, who was already there */
    function openStep(i) {
      var st = STEP[i], rows = book.filter(function (c) { return c.step === i; }).sort(function (a, b) { return b.total - a.total || a.name.localeCompare(b.name); });
      var fresh = A.move ? rows.filter(function (c) { return c.step > c.l0; }) : [], rest = rows.filter(function (c) { return fresh.indexOf(c) === -1; });
      var line = function (c) { return '<button class="row" type="button" data-c="' + c.id + '"><span class="nm">' + esc(c.name) + '</span><span class="val">' + c.total + '<small>' + t('Requests, 12 weeks') + '</small></span><span class="sub">' + pill(c.state, true) + (c.who12.length ? ' · ' + t('handled by {names}', { names: esc(handled(c)) }) : '') + '</span></button>'; };
      showSheet('<div><h3>' + st[1] + '</h3><p class="role">' + st[2] + ' ' + t('{a} of {b} companies stand here today.', { a: rows.length, b: book.length }) + '</p></div>' +
        (fresh.length ? '<p class="sec">' + t('Climbed onto this step in these dates') + ' · ' + fresh.length + '</p><div class="rows">' + fresh.map(line).join('') + '</div>' : '') +
        (rest.length ? '<p class="sec">' + (fresh.length ? t('Already here') : t('Here today')) + ' · ' + rest.length + '</p><div class="rows">' + rest.map(line).join('') + '</div>' : ''));
    }
    /* a company's own movement: when it first asked, went quiet, came back and who took that request,
       its meetings and deals, and every visit with what followed. Newest first. */
    function storyOf(c) {
      var S = [], i, gap, last = c.reqs.length ? c.reqs[c.reqs.length - 1].d : null, who = function (e) { return esc(TEAM[e.m].name); };
      var quiet = function (d) { S.push([d - 14, 'warn', t('Went quiet'), t('No request for 14 days')]); }, gone = function (d) { S.push([d - 28, 'neut', t('Became inactive'), t('No request for 28 days')]); };
      if (c.reqs.length) S.push([c.reqs[0].d, 'good', t('First request'), who(c.reqs[0])]);
      for (i = 1; i < c.reqs.length; i++) {
        gap = c.reqs[i - 1].d - c.reqs[i].d;
        if (gap < 14) continue;
        quiet(c.reqs[i - 1].d); if (gap >= 28) gone(c.reqs[i - 1].d);
        S.push([c.reqs[i].d, 'good', t('Asking again'), t('After {n}', { n: count(gap, 'day') }) + ' · ' + t('{name} took the request', { name: who(c.reqs[i]) })]);
      }
      if (last !== null && last >= 14) quiet(last);
      if (last !== null && last >= 28) gone(last);
      c.ev.forEach(function (e) {
        if (e.k === 'meeting') S.push([e.d, 'ink', KIND.meeting, who(e) + ' · ' + prod(e.p)]);
        else if (e.k === 'reservation' || e.k === 'contract') S.push([e.d, 'ink', KIND[e.k] + ' · ' + nm(prod(e.p) + ' ' + e.u), who(e) + ' · ' + money(e.v)]);
        else if (e.k === 'cancel') S.push([e.d, 'ink', KIND.cancel + ' · ' + nm(e.u), who(e) + ' · ' + WHYL[e.why]]);
        else if (isVisit(e)) S.push([e.d + .5, 'acc', KIND[e.k], people(e) + ' · ' + followed(e).text]);
      });
      S.sort(function (a, b) { return a[0] - b[0]; });
      return S.length ? '<p class="sec">' + (MY ? t('How it moved with you') : t('How it moved with your team')) + ' · ' + t('newest first') + '</p><div class="story">' + S.map(function (x) { return '<div><time>' + fmt(Math.floor(x[0])) + '</time><i class="k-' + x[1] + '"></i><span>' + x[2] + '<small>' + x[3] + '</small></span></div>'; }).join('') + '</div>' : '';
    }
    function visitRow(x) {
      var e = x.e;
      return '<button class="row" type="button" data-c="' + e.c + '"><span class="nm">' + esc(book[e.c].name) + '</span><span class="val d">' + when(e) + '</span><span class="sub">' + people(e) + '</span><span class="mv-out' + (x.f.ok ? ' ok' : '') + '">' + x.f.text + '</span></button>';
    }

    /* ---- A SALESPERSON'S PAGE (build 121; mocked first, round 1 of 2026-10-06) ----------------
       Muhanad: the salesperson's side "must collect the data accurately and match the manager view",
       with a tab of his own activity: his total sales, the companies that interacted with him, and
       the details he entered. So: My sales (the figure, the time before, what is reserved and not
       signed, the path from request to contract), the manager's six tiles on his own rows, his
       companies as the same swipe deck, and what he entered. An offer is never entered: it is counted
       when it is sent. */
    function cardSales() {
      var n = A.tot, held = A.open.reduce(function (a, e) { return a + e.v; }, 0), max = Math.max(n.special, 1);
      var bar = function (cls, label, v) { return '<div class="' + cls + '"><span>' + label + '</span><i style="--w:' + (v / max).toFixed(3) + '"></i><b>' + v + '</b></div>'; };
      var fig = '<span data-n="' + mil(n.value) + '" data-dec="1">' + mil(n.value) + '</span>';
      return '<section class="card"><h2>' + t('My sales') + ' <em>' + periodName() + '</em></h2>' +
        '<div class="sales"><b>' + (AR ? fig + ' <small>' + t('million EGP') + '</small>' : '<small>EGP</small>' + fig + 'M') + '</b>' +
        '<span>' + (n.contract ? t('{x} signed in these dates', { x: '<b>' + count(n.contract, 'contract') + '</b>' }) : t('No contract signed in these dates')) +
          (A.prev ? ' · ' + t('the time before: {v}', { v: '<b>' + money(A.prev.value) + '</b>' }) : '') + '</span>' +
        (A.open.length ? '<span>' + t('{v} reserved and not signed yet · {x} open today', { v: '<b>' + money(held) + '</b>', x: count(A.open.length, 'reservation') }) + '</span>' : '') + '</div>' +
        '<div class="fun" role="img" aria-label="' + esc(t('From request to contract')) + '">' + bar('f1', t('Special requests'), n.special) + bar('f2', t('Meetings'), n.meeting) + bar('f3', t('Reservations'), n.reservation) + bar('f4', t('Contracts'), n.contract) + '</div></section>';
    }
    function fateOf(e) { return e.end === 'cancel' ? t('later cancelled, {date}', { date: fmt(e.endD) }) : e.end === 'contract' ? t('became a contract') : t('still open'); }
    /* the other name on a row of his: who also went, or who the deal is split with */
    function other(e) { return e.m2 === undefined ? null : TEAM[e.m === ME ? e.m2 : e.m].name; }
    function entryRow(e) {
      var o = other(e), withWho = !o ? '' : isVisit(e) ? t('went with {name}', { name: nm(o) }) : t('split with {name}', { name: nm(o) });
      var sub = isVisit(e) ? withWho : e.k === 'meeting' ? prod(e.p) : unitText(e) + (withWho ? ' · ' + withWho : '');
      var out = isVisit(e) ? followed(e) : e.k === 'reservation' ? { ok: e.end === 'contract', text: fateOf(e) } : null;
      return '<button class="row" type="button" data-e="' + esc(e.id) + '"><span class="nm"><span class="k">' + KIND[e.k] + '</span> · ' + esc(book[e.c].name) + (B.removable(e) ? '<span class="new">' + t('new') + '</span>' : '') + '</span><span class="val d">' + when(e) + '</span>' +
        (sub ? '<span class="sub">' + sub + '</span>' : '') + (out ? '<span class="mv-out' + (out.ok ? ' ok' : '') + '">' + out.text + '</span>' : '') + '</button>';
    }
    function cardEntered() {
      var l = A.entered;
      return '<section class="card"><h2>' + t('What I entered') + ' <em>' + count(l.length, 'entry') + '</em></h2>' +
        (l.length ? '<div class="rows">' + l.slice(0, 5).map(entryRow).join('') + '</div>' + (l.length > 5 ? '<button class="go" type="button" data-go="entered"><span>' + t('See everything I entered') + '</span><b>' + l.length + '</b></button>' : '')
          : '<p class="note">' + t('Nothing entered in these dates. Use the plus button to record an orientation, a workshop, a meeting, a reservation or a contract.') + '</p>') + '</section>';
    }
    /* a salesperson has no Companies tab: a whole list opens in a sheet */
    function openMyList(key) {
      if (key === 'entered') return showSheet('<div><h3>' + t('What I entered') + '</h3><p class="role">' + rangeText() + ' · ' + A.entered.length + '</p></div><div class="rows">' + A.entered.map(entryRow).join('') + '</div>');
      var list = companyMatches(key);
      showSheet('<div><h3>' + (key === 'effective' ? t('Effective') : STATE[key]) + '</h3><p class="role">' + count(list.length, 'company') + ' · ' + t('as of today') + '</p></div>' + rankHead(key) + '<div class="rows">' + list.map(rankRow(key)).join('') + '</div>');
    }
    function openEntry(id) {
      var e = events.filter(function (x) { return x.id === id; })[0]; if (!e) return;
      var rows = [[t('Brokerage company'), nm(book[e.c].name)], [t('Date'), fmt(e.d) + ' ' + B.dateOf(e.d).getFullYear()]];
      if (e.u) rows.push([t('Unit'), nm(prod(e.p) + ' ' + e.u) + (e.area ? ' · ' + t('{n} m²', { n: e.area }) : '')]); else if (e.p) rows.push([t('Unit type'), prod(e.p)]);
      if (e.v) rows.push([e.k === 'contract' ? t('Contract price') : t('Reservation price'), t('EGP {n}', { n: Math.round(e.v).toLocaleString('en-US') })]);
      if (other(e)) rows.push([isVisit(e) ? t('Also went') : t('Split with'), nm(other(e))]);
      if (isVisit(e)) rows.push([t('What followed'), followed(e).text]);
      if (e.k === 'reservation') rows.push([t('Today'), fateOf(e)]);
      showSheet('<div><h3>' + KIND[e.k] + '</h3><p class="role">' + nm(book[e.c].name) + ' · ' + fmt(e.d) + '</p></div><div class="facts">' + rows.map(function (r) { return '<div><span>' + r[0] + '</span><b>' + r[1] + '</b></div>'; }).join('') + '</div>' +
        (B.removable(e) ? '<button class="btn ghost" type="button" data-rm="' + esc(e.id) + '">' + t('Remove this entry') + '</button>' : '') +
        '<p class="note">' + t('You can correct an entry on the day you made it. After that, your manager corrects it.') + '</p>');
    }
    function removeEntry(id) {
      var e = events.filter(function (x) { return x.id === id; })[0]; if (!e) return;
      var what = KIND[e.k] + ' · ' + book[e.c].name;
      var gone = function (ok) {
        if (!ok) return;
        load(); refresh(); compute(); closeSheet(); draw(true);
        toast(t('Removed: {what}', { what: what }));
      };
      var out = B.remove(id);
      if (out && typeof out.then === 'function') { out.then(gone, function (err) { toast(refused(err, e.u || '', e.c, e.d)); }); return; }
      gone(out);
    }

    /* ---- a salesperson records (build 121) -------------------------------------------------------
       WHAT KEEPS IT ACCURATE. There is no "who": the entry carries the name of whoever is signed in.
       The company is picked, never typed, his recent ones first. A unit code is looked up as it is
       typed: its type, size and list price show, the price is filled in, and a code no unit has is
       refused. A contract is made from one of his open reservations, so unit and price are not typed
       twice. The same visit to the same company on the same day is refused, and so is a second
       reservation or contract on one unit. A unit shown as not available is a WARNING, not a refusal:
       this reservation may be the reason. A cancellation is not here: it is the manager's. */
    var myRec = { kind: 'orientation', company: -1 };
    var SAVE = { orientation: t('Save orientation'), workshop: t('Save workshop'), meeting: t('Save meeting'), reservation: t('Save reservation'), contract: t('Save contract') };
    function recentCompanies() { var seen = {}, out = []; events.filter(function (e) { return e.k === 'offer' && e.c !== null; }).sort(newest).forEach(function (e) { if (!seen[e.c]) { seen[e.c] = 1; out.push(e.c); } }); return out.slice(0, 6); }
    function openMyRecord() {
      var k = myRec.kind, went = k === 'orientation' || k === 'workshop', recent = recentCompanies(), mates = [];
      /* a company that is switched off, or still waiting for the admin, takes no new entry */
      if (B.pickable) recent = recent.filter(function (i) { return B.pickable(i); });
      /* on the store: his own team first, then the sales agents of the other teams (a deal shared across teams shows to both managers) */
      var others = [];
      TEAM.forEach(function (p, i) { if (i !== ME && (B.mates === undefined || i < B.mates)) (B.own !== undefined && i >= B.own ? others : mates).push('<option value="' + i + '">' + esc(p.name) + '</option>'); });
      if (others.length) mates = ['<optgroup label="' + esc(t('Your team')) + '">' + mates.join('') + '</optgroup><optgroup label="' + esc(t('Other teams')) + '">' + others.join('') + '</optgroup>'];
      var one = function (i, pick) { return '<option value="' + i + '"' + (pick && i === myRec.company ? ' selected' : '') + '>' + esc(B.companies[i]) + '</option>'; };
      var company = '<label class="fld">' + t('Brokerage company') + '<select id="rC"><option value="">' + t('Choose a company') + '</option>' +
        (recent.length ? '<optgroup label="' + esc(t('Your recent companies')) + '">' + recent.map(function (i) { return one(i, true); }).join('') + '</optgroup>' : '') +
        '<optgroup label="' + esc(t('All companies')) + '">' + B.companies.map(function (n, i) { return B.pickable && !B.pickable(i) && i !== myRec.company ? '' : one(i, recent.indexOf(i) === -1); }).join('') + '</optgroup></select></label>';
      var date = '<label class="fld">' + t('Date') + '<input type="date" id="rD" min="' + iso(SPAN) + '" max="' + iso(0) + '" value="' + iso(0) + '"></label>';
      var mate = function (label) { return '<label class="fld">' + label + '<select id="rS"><option value="">' + t('No one') + '</option>' + mates.join('') + '</select></label>'; };
      var unit = '<label class="fld">' + t('Unit code') + '<input id="rU" type="text" autocomplete="off" autocapitalize="characters" spellcheck="false"></label><p class="chk wait" id="rChk">' + t('Type the unit code to see the unit.') + '</p>';
      var price = function (label) { return '<label class="fld">' + label + '<input id="rV" type="text" inputmode="numeric" autocomplete="off"></label>'; };
      var body;
      if (went) body = company + '<div class="range">' + date + mate(t('Also went')) + '</div>';
      else if (k === 'meeting') body = company + '<div class="range"><label class="fld">' + t('Unit type') + '<select id="rP">' + B.products.map(function (p, i) { return '<option value="' + i + '">' + esc(prod(p)) + '</option>'; }).join('') + '</select></label>' + date + '</div>';
      else if (k === 'reservation') body = company + unit + '<div class="range">' + price(t('Reservation price, EGP')) + date + '</div>' + mate(t('Split the deal with'));
      else body = '<label class="fld">' + t('Which reservation was signed') + '<select id="rR">' + A.open.map(function (e) { return '<option value="' + esc(e.id) + '">' + esc(e.u + ' · ' + book[e.c].name + ' · ' + fmt(e.d)) + '</option>'; }).join('') + '<option value="">' + t('A unit with no reservation recorded') + '</option></select></label>' +
        '<div class="form" id="rFree"' + (A.open.length ? ' hidden' : '') + '>' + company + unit + mate(t('Split the deal with')) + '</div><div class="range">' + price(t('Contract price, EGP')) + date + '</div>';
      showSheet('<div><h3>' + t('Record') + '</h3><p class="role">' + t('Entered under your name: {name}', { name: nm(WHO.name) }) + '</p></div><div class="form">' +
        '<div class="chips">' + ['orientation', 'workshop', 'meeting', 'reservation', 'contract'].map(function (x) { return '<button class="chip" type="button" data-k="' + x + '" aria-pressed="' + (k === x) + '">' + KIND[x] + '</button>'; }).join('') + '</div>' + body +
        '<p class="note bad" id="rErr" hidden></p><button class="btn" type="button" id="rSave">' + SAVE[k] + '</button></div>');
      if (k === 'contract') fromReservation();
    }
    function grouped(v) { return Math.round(v).toLocaleString('en-US'); }
    function fromReservation() {
      var rs = A.open.filter(function (e) { return e.id === $('rR').value; })[0], v = $('rV');
      $('rFree').hidden = !!rs;
      if (rs) { v.value = grouped(rs.v); v.dataset.auto = '1'; } else if (v.dataset.auto) v.value = '';
    }
    function checkUnit() {
      var box = $('rChk'), code = $('rU').value.trim().toUpperCase(), u = B.unit(code), v = $('rV'), listed, free;
      if (!code) { box.className = 'chk wait'; box.textContent = t('Type the unit code to see the unit.'); return; }
      if (!u) { box.className = 'chk bad'; box.textContent = t('No unit has this code. Check it and type it again.'); return; }
      listed = u.listPrice || u.finalPrice; free = B.available(code);
      box.className = 'chk' + (free ? '' : ' warn');
      box.textContent = [prod(B.productOf(u)), u.area ? t('{n} m²', { n: u.area }) : '', listed ? t('list price EGP {n}', { n: grouped(listed) }) : '', free ? '' : t('shown as not available today')].filter(Boolean).join(' · ');
      if (listed && (!v.value || v.dataset.auto)) { v.value = grouped(listed); v.dataset.auto = '1'; }
    }
    function saveMyRecord() {
      var k = myRec.kind, bad = function (msg) { var n = $('rErr'); n.textContent = msg; n.hidden = false; };
      var date = B.fromIso($('rD').value), rs = null, r, u, code, v, e, d;
      if (!date || agoOf($('rD').value) !== B.agoOf(date)) return bad(t('Choose a date in the last 12 weeks.'));
      d = B.agoOf(date);
      r = { k: k, m: ME, date: date };
      if (k === 'contract' && $('rR').value) {
        rs = A.open.filter(function (x) { return x.id === $('rR').value; })[0];
        if (!rs) return bad(t('That reservation is no longer open.'));
        /* the contract keeps the reservation's company, unit and names: a split deal stays split */
        r.c = rs.c; r.u = rs.u; r.p = rs.p; r.of = rs.id; r.m = rs.m; if (rs.m2 !== undefined) r.m2 = rs.m2;
      } else {
        if ($('rC').value === '') return bad(t('Choose the brokerage company.'));
        r.c = +$('rC').value;
      }
      if (k === 'meeting') r.p = B.products[+$('rP').value];
      if (k === 'reservation' || (k === 'contract' && !rs)) {
        code = $('rU').value.trim().toUpperCase(); u = B.unit(code);
        if (!code) return bad(t('Enter the unit code.'));
        if (!u) return bad(t('No unit has this code. Check it and type it again.'));
        /* one unit, one open reservation, one contract: judged on the team's rows, his own or a colleague's */
        if (all.some(function (x) { return x.k === 'contract' && String(x.u).toUpperCase() === code; })) return bad(t('A contract is already recorded on {code}.', { code: code }));
        if (all.some(function (x) { return x.k === 'reservation' && !x.end && String(x.u).toUpperCase() === code; })) return bad(t('There is already an open reservation on {code}.', { code: code }));
        r.u = u.code; r.p = B.productOf(u);
      }
      if (k === 'reservation' || k === 'contract') {
        /* the price as typed, in pounds: digits only, in either script (js/inventory.js reads both) */
        v = MM.inventory.num($('rV').value);
        if (!(v > 0)) return bad(t('Enter the price in EGP.'));
        r.v = v;
      }
      if (!rs && $('rS') && $('rS').value !== '') r.m2 = +$('rS').value;
      if ((k === 'orientation' || k === 'workshop') && events.some(function (x) { return x.k === k && x.c === r.c && x.d === d; }))
        return bad(k === 'orientation' ? t('You already recorded an orientation at {name} on {date}.', { name: B.companies[r.c], date: fmt(d) }) : t('You already recorded a workshop at {name} on {date}.', { name: B.companies[r.c], date: fmt(d) }));
      var saved = function (e) {
        if (!e) return bad(t('This could not be saved. Try again.'));
        myRec.company = -1;
        load(); refresh(); compute(); closeSheet(); draw(true);
        toast(t(B.demo ? 'Saved in this demo: {what}' : 'Saved: {what}', { what: KIND[e.k] + ' · ' + book[e.c].name }));
      };
      e = B.add(r);
      /* the store answers later, and may refuse (build 127): the button waits, and a refusal is said in words */
      if (e && typeof e.then === 'function') {
        var btn = $('rSave'); btn.disabled = true; btn.classList.add('busy');
        e.then(saved, function (err) { if ($('rSave')) { $('rSave').disabled = false; $('rSave').classList.remove('busy'); bad(refused(err, code || (rs && rs.u) || '', r.c, d)); } });
        return;
      }
      saved(e);
    }
    /* the store's refusal, in words. The codes are sql/02_functions.sql's. */
    function refused(err, code, c, d) {
      var m = String((err && err.message) || ''), k = myRec.kind;
      if (m === 'offline') return t('No connection. This was not saved. Try again when you are online.');
      if (m === 'MM_UNIT_RESERVED') return t('There is already an open reservation on {code}.', { code: code });
      if (m === 'MM_UNIT_CONTRACTED') return t('A contract is already recorded on {code}.', { code: code });
      if (m === 'MM_RESERVATION_NOT_OPEN') return t('That reservation is no longer open.');
      if (m === 'MM_VISIT_ALREADY_RECORDED' && B.companies[c] !== undefined) return k === 'workshop' ? t('You already recorded a workshop at {name} on {date}.', { name: B.companies[c], date: fmt(d) }) : t('You already recorded an orientation at {name} on {date}.', { name: B.companies[c], date: fmt(d) });
      if (m === 'MM_BAD_DATE') return t('Choose a date in the last 12 weeks.');
      if (m === 'MM_NO_TEAM') return t('Your account is not in a team yet. Ask the admin to add you to one.');
      if (m === 'MM_NO_COMPANY') return t('This company is no longer on the list. Choose another.');
      if (m === 'MM_TOO_LATE') return t('You can correct an entry on the day you made it. After that, your manager corrects it.');
      if (m === 'MM_NOT_SIGNED_IN') return t('You are signed out. Sign in again.');
      return t('This could not be saved. Try again.');
    }
    function profileMy() {
      var ini = WHO.name.split(/\s+/).map(function (w) { return w.charAt(0); }).join('').slice(0, 2).toUpperCase();
      var fact = function (f) { return '<div><span>' + f[0] + '</span><b>' + f[1] + '</b></div>'; };
      return '<section class="card wide"><div class="me"><div class="av">' + esc(ini) + '</div><div><h1>' + esc(WHO.name) + '</h1><p>' + title(WHO.title) + (WHO.code ? ' · ' + nm(WHO.code) : '') + '</p></div></div></section>' +
        '<section class="card"><h2>' + t('Your account') + '</h2><div class="facts">' +
          [[t('Developer'), 'Main Marks Development'], [t('Project'), 'Moray'], MGR ? [t('Reports to'), nm(MGR.name) + (AR ? '، ' : ', ') + title(MGR.title)] : null, [t('What you see'), t('Your own activity only')], [t('What your manager sees'), t('Everything you record here')]].filter(Boolean).map(fact).join('') + '</div></section>' +
        '<section class="card"><h2>' + t('What the words mean') + '</h2><dl class="defs">' +
          [['ink', t('Special request'), t('An offer a company asked you for. It is counted when you send the offer: there is nothing to type. A broadcast is an offer sent to no one in particular.')],
            ['ink', t('Orientation'), t('A visit to a brokerage company to present the project. It led to a request when the company asked within 7 business days.')],
            ['ink', t('Workshop'), t('A working session at a company that asks a lot and has brought no meeting. It led to a meeting when one followed within 14 business days.')],
            ['active', STATE.active, t('Asked you for an offer in the last two weeks.')], ['quiet', STATE.quiet, t('Was asking you, then nothing for two weeks.')], ['inactive', STATE.inactive, t('No request to you for a month.')],
            ['ink', t('Effective'), t('Brought at least one meeting in the dates shown.')]].map(function (d) { return '<div><i class="s-' + d[0] + '"></i><dt>' + d[1] + '</dt><dd>' + d[2] + '</dd></div>'; }).join('') + '</dl></section>' +
        '<section class="card"><h2>' + t('Settings') + '</h2><div class="facts"><div><span>' + t('Language') + '</span><b><span class="chips"><button class="chip" type="button" data-lang="en" lang="en" aria-pressed="' + !AR + '">English</button><button class="chip" type="button" data-lang="ar" lang="ar" aria-pressed="' + AR + '">العربية</button></span></b></div>' + fact([t('Opens on'), t('Last 30 days')]) + '</div>' +
          (B.recorded() ? '<button class="btn ghost" type="button" id="wipe">' + t('Clear what was recorded in this demo') + '</button>' : '') +
          (B.demo ? '' : '<a class="btn ghost" href="login.html?change=1">' + t('Change password') + '</a>') +
          '<button class="btn ghost" type="button" id="out">' + t('Sign out') + '</button></section>' +
        '<p class="note center">' + t(B.demo ? 'Main Marks · My activity · demo figures' : 'Main Marks · My activity') + '</p>';
    }

    var SCREENS = {
      /* a salesperson's one page of figures: sales, the six tiles, his companies, what he entered */
      my: function () { return head(t('My activity')) + cardSales() + tiles() + cardDeck() + cardEntered(); },
      /* SHORT ON PURPOSE: the gauge first, four tiles, two short lists. Everything else is one tap away. */
      home: function () {
        return A.single ? head(t('Your team')) + cardHeroDay() + tiles() + cardIdle() + cardTeamShort()
                        : head(t('Your companies')) + cardHeroBook() + tiles() + cardMovement() + cardDeck() + cardTeamShort();
      },
      companies: function () {
        var fs = [['all', t('All'), book.length]].concat(ORDER.map(function (k) { return [k, STATE[k], count4[k]]; })).concat([['effective', t('Effective'), A.effective], ['nomeet', t('No meeting yet'), noMeetCount()], ['fresh', t('New'), A.fresh.length]]).concat(A.changed.length ? [['changed', t('Changed'), A.changed.length]] : []);
        return head(t('Companies')) + cardLook() + cardSalesByCompany() + '<input class="search" id="q" type="search" placeholder="' + esc(t('Search a company')) + '" value="' + esc(look.query) + '" aria-label="' + esc(t('Search a company')) + '">' +
          '<div class="chips slide">' + fs.map(function (f) { return '<button class="chip" type="button" data-f="' + f[0] + '" aria-pressed="' + (look.filter === f[0]) + '">' + f[1] + ' ' + f[2] + '</button>'; }).join('') + '</div>' +
          '<section class="card" id="clist">' + companyList() + '</section>';
      },
      team: function () {
        var n = A.tot;
        return head(t('Team')) + '<section class="card wide"><h2>' + t('The team together') + ' <em>' + periodName() + '</em></h2>' + kv([[num(n.offers), t('Offers sent')], [num(n.meeting), t('Meetings')], [num(n.reservation + n.contract), t('Deals')]]) + '</section>' + cardTeam() + cardDeals() + cardFeed();
      },
      analysis: function () {
        var n = A.tot;
        var files = [['state:active', t('Active companies'), count(count4.active, 'company')], ['state:quiet', t('Gone quiet'), count(count4.quiet, 'company')], ['state:inactive', t('Inactive'), count(count4.inactive, 'company')], ['state:never', t('Never asked'), count(count4.never, 'company')],
          ['effective', t('Effective'), t('{x} with a meeting', { x: count(A.effective, 'company') })], ['nomeet', t('Many requests, no meeting'), count(noMeetCount(), 'company')],
          ['deals', t('Reservations and contracts'), t('{n} recorded', { n: n.reservation + n.contract })], ['cancels', t('Cancelled reservations'), t('{n} in these dates, with the reason', { n: n.cancel })], ['movement', t('Movement'), A.move ? t('{a} up, {b} down', { a: moveCount(A.move.up), b: moveCount(A.move.down) }) : t('Choose a week or more')], ['visits', t('Orientations and workshops'), count(n.orientation, 'orientation') + ' · ' + count(n.workshop, 'workshop')], ['fresh', t('New companies'), count(A.fresh.length, 'company')],
          ['team', t('Whole team'), t('Every list in one report')]];
        return head(t('Quick analysis')) +
          '<section class="card"><h2>' + t('Download') + ' <em>' + periodName() + '</em></h2>' + files.map(function (f) { return dlRow(f[0], f[1], f[2]); }).join('') + '</section>' +
          '<section class="card"><h2>' + t('Each sales agent') + ' <em>' + t('one file each') + '</em></h2>' + A.people.map(function (p) { return dlRow('person:' + p.id, esc(p.name), count(p.n.offers, 'offer') + ' · ' + count(p.n.meeting, 'meeting') + ' · ' + count(p.n.reservation + p.n.contract, 'deal')); }).join('') + '</section>';
      },
      profile: function () {
        if (MY) return profileMy();
        var ini = MGR.name.split(/\s+/).map(function (w) { return w.charAt(0); }).join('').slice(0, 2).toUpperCase();
        var fact = function (f) { return '<div><span>' + f[0] + '</span><b>' + f[1] + '</b></div>'; };
        return '<section class="card wide">' + swap() + '<div class="me"><div class="av">' + esc(ini) + '</div><div><h1>' + esc(MGR.name) + '</h1><p>' + title(MGR.title) + ' · ' + nm(MGR.code) + '</p></div></div></section>' +
          '<section class="card"><h2>' + t('Your account') + '</h2><div class="facts">' +
            [[t('Developer'), 'Main Marks Development'], [t('Project'), 'Moray'], [t('Reports to'), nm(MGR.reportsTo) + (AR ? '، ' : ', ') + title(MGR.reportsTitle)], [t('Your team'), count(TEAM.length, 'salesperson')], [t('Brokerage companies'), t('{n}, open to every team', { n: book.length })], [t('What you see'), t('Your team’s activity only')]].map(fact).join('') + '</div></section>' +
          '<section class="card"><h2>' + t('Your team') + '</h2><div class="rows">' + TEAM.map(function (p, i) { return '<button class="row" type="button" data-m="' + i + '"><span class="nm">' + esc(p.name) + '</span><span class="val code">' + esc(p.code) + '</span><span class="sub">' + title(p.title) + '</span></button>'; }).join('') + '</div></section>' +
          '<section class="card"><h2>' + t('What the words mean') + '</h2><dl class="defs">' +
            [['active', STATE.active, t('Asked your team for an offer in the last two weeks.')], ['quiet', STATE.quiet, t('Was asking, then nothing for two weeks. The early warning.')], ['inactive', STATE.inactive, t('No request to your team for a month.')], ['never', STATE.never, t('Has not asked your team for an offer yet.')],
              ['ink', t('Effective'), t('Brought at least one meeting in the dates shown.')], ['ink', t('Special request'), t('An offer a company asked for. A broadcast is an offer sent to no one in particular.')],
              ['ink', t('Cancelled reservation'), t('A reservation that was withdrawn. It is kept in the history with its date and reason, and counted apart.')],
              ['ink', t('Orientation'), t('A visit to a brokerage company to present the project. It led to a request when the company asked within 7 business days.')], ['ink', t('Workshop'), t('A working session at a company that asks a lot and has brought no meeting. It led to a meeting when one followed within 14 business days.')],
              ['ink', t('The ladder'), t('How far a company has ever got with your team: asked, brought a meeting, reserved, signed. A company stands on the highest step it has reached.')]].map(function (d) { return '<div><i class="s-' + d[0] + '"></i><dt>' + d[1] + '</dt><dd>' + d[2] + '</dd></div>'; }).join('') + '</dl></section>' +
          '<section class="card"><h2>' + t('Settings') + '</h2><div class="facts"><div><span>' + t('Language') + '</span><b><span class="chips"><button class="chip" type="button" data-lang="en" lang="en" aria-pressed="' + !AR + '">English</button><button class="chip" type="button" data-lang="ar" lang="ar" aria-pressed="' + AR + '">العربية</button></span></b></div>' + fact([t('Opens on'), t('Today')]) + '</div>' +
            (B.recorded() ? '<button class="btn ghost" type="button" id="wipe">' + t('Clear what was recorded in this demo') + '</button>' : '') +
            '<button class="btn ghost" type="button" id="out">' + t('Sign out') + '</button></section>' +
          '<p class="note center">' + t('Main Marks · manager view · demo figures') + '</p>';
      }
    };

    /* ---- drawing ---------------------------------------------------------- */
    function draw(keep) {
      /* build 132: under the pulse the page is built still, and rises when the dial lifts (pulse.enter) */
      var scr = $('scr'), y = window.scrollY, hush = !keep && pulse.building;
      scr.className = 'scr' + (keep || hush ? '' : ' in');
      scr.innerHTML = SCREENS[look.tab]();
      [].forEach.call(scr.children, function (el, i) { el.style.setProperty('--i', i); });
      window.scrollTo(0, keep ? y : 0);
      if (hush) pulse.enter = function () { scr.classList.add('in'); countUp(scr); };
      else if (!keep) countUp(scr);
      deckInit('deck'); deckInit('mv');
      $('fab').hidden = look.tab === 'profile';
      [].forEach.call($('tab').children, function (b) { if (b.dataset.t === look.tab) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current'); });
      try { history.replaceState(null, '', '#' + look.tab); } catch (e) { /* the tab is simply not remembered */ }
    }
    function countUp(root) {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      [].forEach.call(root.querySelectorAll('[data-n]'), function (el) {
        /* data-dec: a figure with decimals (EGP 76.7M) counts up with them */
        var to = +el.dataset.n, dec = +el.dataset.dec || 0, t0 = null;
        function step(now) { if (!t0) t0 = now; var k = Math.min(1, (now - t0) / 750), v = to * (1 - Math.pow(1 - k, 3)); el.textContent = dec ? v.toFixed(dec) : Math.round(v); if (k < 1) requestAnimationFrame(step); }
        /* the timer is the floor: a background tab runs no animation frames, and must not be left on 0 */
        el.textContent = '0'; requestAnimationFrame(step); setTimeout(function () { el.textContent = el.dataset.n; }, 900);
      });
    }
    var opener = null;
    function showSheet(html) {
      if (!$('sheet').classList.contains('on')) opener = document.activeElement;
      $('sheet').innerHTML = '<span class="grab"></span><button class="x" id="closeSheet" type="button" aria-label="' + esc(t('Close')) + '">✕</button>' + html;
      $('sheet').scrollTop = 0;
      $('sheet').classList.add('on'); $('veil').classList.add('on');
      document.documentElement.classList.add('is-locked');
      $('closeSheet').addEventListener('click', closeSheet);
    }
    function closeSheet() {
      if (!$('sheet').classList.contains('on')) return;
      $('sheet').classList.remove('on'); $('veil').classList.remove('on');
      document.documentElement.classList.remove('is-locked');
      if (opener && document.contains(opener)) opener.focus({ preventScroll: true });
    }
    var toastT;
    function toast(msg) { var n = $('toast'); n.textContent = msg; n.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(function () { n.classList.remove('on'); }, 3200); }
    /* every download comes as two files: the PDF report to read and send, the Excel file to work on */
    /* A REPORT IS A PDF (Muhanad, 2026-10-06): the PDF is the button; the Excel sheet is something to ask for. */
    function dlBtn(key, label) {
      return '<div class="dlpair"><button class="btn" type="button" data-dl="' + key + '" data-as="pdf">' + svg('dl') + label + '</button><button class="also" type="button" data-dl="' + key + '" data-as="xlsx">' + t('Also as an Excel sheet') + '</button></div>';
    }
    function dlRow(key, name, sub) {
      return '<div class="dl"><b>' + name + '</b><span>' + sub + ' · <button class="also" type="button" data-dl="' + key + '" data-as="xlsx">' + t('Excel sheet') + '</button></span><span class="dlb"><button type="button" data-dl="' + key + '" data-as="pdf">' + t('PDF report') + '</button></span></div>';
    }

    /* ---- the sheets --------------------------------------------------------- */
    function openCompany(id) {
      var c = book[id]; if (!c) return;
      var mine = events.filter(function (e) { return e.c === id && inP(e); }), n = A.byC[id];
      var who = distinct(mine, 'm').map(function (m) { return { m: m, n: mine.filter(function (e) { return e.m === m && e.k === 'offer'; }).length }; }).filter(function (x) { return x.n; }).sort(function (a, b) { return b.n - a.n; });
      var prods = {}; mine.forEach(function (e) { if (e.k === 'offer') prods[e.p] = (prods[e.p] || 0) + 1; });
      showSheet('<div><h3>' + esc(c.name) + '</h3><p class="role">' + pill(c.state, true) + ' · ' + ago(c) + (c.first !== null ? ' · ' + t('first asked {date}', { date: fmt(c.first) }) : '') + '</p></div>' +
        '<p class="sec">' + (MY ? t('Requests to you · 12 weeks') : t('Requests to your team · 12 weeks')) + '</p>' + bars(companyWeeks(id)) +
        (c.ev.some(isVisit) ? '<p class="note">' + t('{o} orientation · {w} workshop, in the week it took place.', { o: '<b>' + KIND.orientation.charAt(0) + '</b>', w: '<b>' + KIND.workshop.charAt(0) + '</b>' }) + '</p>' : '') +
        '<p class="sec">' + rangeText() + '</p>' + kv([[n.special, t('Requests')], [n.meeting, t('Meetings')], [n.reservation + n.contract, t('Deals')]]) +
        (n.cancel ? '<p class="note"><b>' + t('{x} cancelled', { x: count(n.cancel, 'reservation') }) + '</b> ' + t('in these dates.') + '</p>' : '') +
        /* on a salesperson's page every row is his own, so "who in your team" is left out */
        (mine.length ? (MY ? '' : (who.length ? '<p class="sec">' + t('Who in your team') + '</p>' : '') + '<div class="who">' + who.map(function (x) { return '<div><span>' + esc(TEAM[x.m].name) + '</span><b>' + x.n + '</b></div>'; }).join('') + '</div>') +
          (Object.keys(prods).length ? '<p class="sec">' + t('Asks for') + '</p><div class="tags">' + Object.keys(prods).map(function (p) { return '<span>' + prod(p) + ' · ' + prods[p] + '</span>'; }).join('') + '</div>' : '') +
          '<p class="sec">' + (MY ? t('Latest with you') : t('Latest with your team')) + '</p>' + feed(mine.slice().sort(newest).slice(0, 5), !MY)
          : '<p class="note">' + (MY ? t('No activity with you in these dates.') : t('No activity with your team in these dates.')) + '</p>' +
            /* the company that needs a call must still carry a name: whoever handled it before (playbook 01) */
            (c.who12.length && !MY ? '<p class="sec">' + t('Who in your team · 12 weeks') + '</p><div class="who">' + c.who12.map(function (x) { return '<div><span>' + esc(TEAM[x.m].name) + '</span><b>' + x.n + '</b></div>'; }).join('') + '</div>' : '')) +
        storyOf(c) +
        (MY ? '<button class="btn ghost" type="button" data-rec="' + id + '">' + t('Record something with this company') + '</button>' : dlBtn('company:' + id, t('Download this company’s history'))));
    }
    function openPerson(id) {
      var p = A.people.filter(function (x) { return x.id === id; })[0]; if (!p) return;
      var all = events.filter(function (e) { return e.m === id || e.m2 === id; }), mine = all.filter(inP);
      var w = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
      all.forEach(function (e) { if (e.k === 'offer') w[11 - Math.min(11, Math.floor(e.d / 7))]++; });
      var comps = distinct(mine.filter(function (e) { return e.k === 'offer'; }), 'c').map(function (c) { return { c: book[c], n: mine.filter(function (e) { return e.c === c && e.k === 'offer'; }).length, m: mine.filter(function (e) { return e.c === c && e.k === 'meeting'; }).length }; }).sort(function (a, b) { return b.n - a.n; });
      var post = mine.filter(function (e) { return e.ch === 'post'; }).length, pdf = mine.filter(function (e) { return e.ch === 'pdf'; }).length;
      showSheet('<div><h3>' + esc(p.name) + '</h3><p class="role">' + title(p.title) + ' · ' + nm(p.code) + '</p></div>' +
        '<p class="sec">' + rangeText() + '</p>' +
        kv([[p.n.offers, t('Offers sent')], [p.n.special, t('Special requests')], [p.n.broadcast, t('Broadcasts')]]) +
        kv([[p.companies, t('Companies')], [p.n.meeting, t('Meetings')], [p.n.reservation + p.n.contract, t('Deals')]]) +
        (p.n.cancel ? '<p class="note"><b>' + t('{x} cancelled', { x: count(p.n.cancel, 'reservation') }) + '</b> ' + t('in these dates.') + '</p>' : '') +
        (p.n.offers ? '<p class="note">' + t('Sent as {a} and {b}', { a: count(post, 'post'), b: count(pdf, 'pdf') }) + (p.last ? ' · ' + t('last activity {time}', { time: when(p.last) }) : '') + '</p>' : '<p class="note">' + t('No activity in these dates.') + '</p>') +
        '<p class="sec">' + t('Offers each week · 12 weeks') + '</p>' + bars(personWeeks(id), 'ink') +
        (comps.length ? '<p class="sec">' + t('Companies in these dates') + '</p><div class="who">' + comps.slice(0, 6).map(function (x) { return '<div><span>' + esc(x.c.name) + ' <small>' + (x.m ? '· ' + count(x.m, 'meeting') : '') + '</small></span><b>' + x.n + '</b></div>'; }).join('') + (comps.length > 6 ? '<div><small>' + t('{n} more in the download.', { n: comps.length - 6 }) + '</small></div>' : '') + '</div>' : '') +
        (mine.length ? '<p class="sec">' + t('Latest activity') + '</p>' + feed(mine.slice().sort(newest).slice(0, 6), false) : '') +
        dlBtn('person:' + id, t('Download {name}’s activity', { name: esc(p.name.split(' ')[0]) })));
    }
    var TILE = { orientation: t('Orientations'), workshop: t('Workshops'), offers: t('Offers sent'), asked: t('Companies that asked'), deals: t('Reservations and contracts'), meeting: t('Meetings'), reservation: t('Reservations'), contract: t('Contracts') };
    function tileList(k) {
      if (k === 'orientation' || k === 'workshop') return A.visits.filter(function (x) { return x.e.k === k; });
      if (k === 'offers') return A.list.filter(function (e) { return e.k === 'offer'; }).sort(newest);
      if (k === 'asked') return A.asked.map(function (id) { return book[id]; }).sort(function (a, b) { return A.byC[b.id].special - A.byC[a.id].special; });
      if (k === 'deals') return A.deals;
      if (k === 'meeting') return A.list.filter(function (e) { return e.k === 'meeting'; }).sort(newest);
      return A.deals.filter(function (e) { return e.k === k || (k === 'reservation' && e.k === 'cancel'); });
    }
    function openTile(k) {
      var n = A.tot, list = tileList(k), body, none = '<p class="note">' + t('None recorded in these dates.') + '</p>';
      if (k === 'offers') {
        body = kv([[n.special, t('Special requests')], [n.broadcast, t('Broadcasts')], [distinct(list, 'c').length, t('Companies asked')]]) +
          '<p class="note">' + (MY ? t('These are counted by themselves when you send an offer. There is nothing to type. A broadcast is counted once, however many times you send it.') : t('{x} sales agents sent an offer.', { x: t('{a} of {b}', { a: A.sending, b: TEAM.length }) })) + '</p>' + (list.length ? '<p class="sec">' + t('Newest first') + '</p>' + feed(list.slice(0, 12), !MY) + (list.length > 12 ? (MY ? '<p class="note">' + t('{n} more in these dates.', { n: list.length - 12 }) + '</p>' : more(list.length - 12)) : '') : '');
      } else if (k === 'asked') {
        body = list.length ? '<div class="rows">' + list.map(function (c) {
          var who = distinct(A.list.filter(function (e) { return e.c === c.id && e.k === 'offer'; }), 'm').map(function (m) { return esc(TEAM[m].name); }).join(AR ? '، ' : ', ');
          return '<button class="row" type="button" data-c="' + c.id + '"><span class="nm">' + esc(c.name) + '</span><span class="val">' + A.byC[c.id].special + '<small>' + t('Requests') + '</small></span><span class="sub">' + who + '</span></button>';
        }).join('') + '</div>' : '<p class="note">' + t('No company asked in these dates.') + '</p>';
      } else if (k === 'orientation' || k === 'workshop') {
        var okN = list.filter(function (x) { return x.f.ok; }).length;
        body = kv([[okN, k === 'orientation' ? t('Led to a request') : t('Led to a meeting')], [list.length - okN, t('Nothing followed yet')], [distinct(list.map(function (x) { return x.e; }), 'c').length, t('Companies')]]) +
          /* on his own page the row does not repeat his name: only who went with him */
          (list.length ? '<p class="sec">' + t('Newest first') + '</p><div class="rows">' + list.map(MY ? function (x) { return entryRow(x.e); } : visitRow).join('') + '</div>' : none);
      } else if (k === 'meeting') {
        body = list.length ? (MY ? '<div class="rows">' + list.map(entryRow).join('') + '</div>' : feed(list.slice(0, 14), true) + (list.length > 14 ? more(list.length - 14) : '')) : none;
      } else {
        body = (k !== 'reservation' && n.value ? '<p class="note">' + t('{v} contracted', { v: money(n.value) }) + '</p>' : '') + (list.length ? '<div class="rows">' + list.map(dealRow).join('') + '</div>' : none);
      }
      /* a salesperson's page has no downloads at launch: reports are the manager's (held as an upgrade) */
      showSheet('<div><h3>' + TILE[k] + '</h3><p class="role">' + rangeText() + ' · ' + list.length + '</p></div>' + body + (MY ? '' : dlBtn('tile:' + k, t('Download this list'))));
    }

    /* ---- recording: a meeting, a reservation, a contract, a cancellation ----
       For anyone under him. Saved on this phone only, until the real store exists. */
    var recKind = 'orientation';
    function openRecord() {
      var opt = function (list, pick) { return list.map(function (x, i) { return '<option value="' + i + '"' + (i === pick ? ' selected' : '') + '>' + esc(x) + '</option>'; }).join(''); };
      var went = recKind === 'orientation' || recKind === 'workshop', deal = !went && recKind !== 'meeting', names = TEAM.map(function (p) { return p.name; });
      var date = '<label class="fld">' + (recKind === 'cancel' ? t('Cancelled on') : t('Date')) + '<input type="date" id="rD" min="' + iso(SPAN) + '" max="' + iso(0) + '" value="' + iso(0) + '"></label>';
      var body;
      if (recKind === 'cancel') {
        var open = events.filter(function (e) { return e.k === 'reservation' && !e.end; }).sort(newest);
        body = open.length ? '<label class="fld">' + t('Which reservation') + '<select id="rR">' + open.map(function (e) { return '<option value="' + esc(e.id) + '">' + esc(prod(e.p) + ' ' + e.u + ' · ' + book[e.c].name + ' · ' + TEAM[e.m].name + ' · ' + fmt(e.d)) + '</option>'; }).join('') + '</select></label>' +
          '<div class="range">' + date + '<label class="fld">' + t('Reason') + '<select id="rW">' + opt(B.why.map(function (w) { return WHYL[w]; }), 0) + '</select></label></div>' +
          '<p class="note bad" id="rErr" hidden></p><button class="btn" type="button" id="rSave">' + t('Save cancellation') + '</button>'
          : '<p class="note">' + t('Your team has no open reservation to cancel.') + '</p>';
      } else {
        body = '<label class="fld">' + (went ? t('Who went') : t('Sales agent')) + '<select id="rM">' + opt(names, 0) + '</select></label>' +
          '<label class="fld">' + t('Brokerage company') + '<select id="rC"><option value="">' + t('Choose a company') + '</option>' + opt(B.companies, -1) + '</select></label>' +
          (deal ? '<div class="range"><label class="fld">' + t('Unit code') + '<input id="rU" type="text" autocomplete="off" autocapitalize="characters" spellcheck="false"></label>' + date + '</div>' +
              '<label class="fld">' + (recKind === 'contract' ? t('Contract price, EGP') : t('Reservation price, EGP')) + '<input id="rV" type="text" inputmode="numeric" autocomplete="off"></label>' +
              '<label class="fld">' + t('Split the deal with') + '<select id="rS"><option value="">' + t('No one') + '</option>' + opt(names, -1) + '</select></label>'
            : went ? '<div class="range">' + date + '<label class="fld">' + t('Also went') + '<select id="rS"><option value="">' + t('No one') + '</option>' + opt(names, -1) + '</select></label></div>'
            : '<div class="range"><label class="fld">' + t('Unit type') + '<select id="rP">' + opt(B.products.map(prod), 0) + '</select></label>' + date + '</div>') +
          '<p class="note bad" id="rErr" hidden></p><button class="btn" type="button" id="rSave">' + (recKind === 'orientation' ? t('Save orientation') : recKind === 'workshop' ? t('Save workshop') : recKind === 'meeting' ? t('Save meeting') : recKind === 'contract' ? t('Save contract') : t('Save reservation')) + '</button>';
      }
      showSheet('<div><h3>' + t('Record for your team') + '</h3><p class="role">' + t('For any sales agent under you') + '</p></div><div class="form">' +
        '<div class="chips">' + [['orientation', t('Orientation')], ['workshop', t('Workshop')], ['meeting', t('Meeting')], ['reservation', t('Reservation')], ['contract', t('Contract')], ['cancel', t('Cancellation')]].map(function (k) { return '<button class="chip" type="button" data-k="' + k[0] + '" aria-pressed="' + (recKind === k[0]) + '">' + k[1] + '</button>'; }).join('') + '</div>' + body + '</div>');
    }
    function saveRecord() {
      var bad = function (msg) { var n = $('rErr'); n.textContent = msg; n.hidden = false; };
      var date = B.fromIso($('rD').value);
      if (!date || agoOf($('rD').value) !== B.agoOf(date)) return bad(t('Choose a date in the last 12 weeks.'));
      var e;
      if (recKind === 'cancel') {
        e = B.cancel($('rR').value, date, B.why[+$('rW').value]);
        if (!e) return bad(t('That reservation is no longer open.'));
      } else {
        if ($('rC').value === '') return bad(t('Choose the brokerage company.'));
        var r = { k: recKind, c: +$('rC').value, m: +$('rM').value, date: date };
        if (recKind === 'orientation' || recKind === 'workshop') { if ($('rS').value !== '' && +$('rS').value !== r.m) r.m2 = +$('rS').value; }
        else if (recKind === 'meeting') r.p = B.products[+$('rP').value];
        else {
          /* the price as typed, in pounds: digits only, in either script (js/inventory.js reads both) */
          var v = MM.inventory.num($('rV').value), code = $('rU').value.trim().toUpperCase();
          if (!code) return bad(t('Enter the unit code.'));
          if (!(v > 0)) return bad(t('Enter the price in EGP.'));
          r.u = code; r.v = v; r.p = B.unit(code) ? B.productOf(B.unit(code)) : B.products[0];
          if ($('rS').value !== '' && +$('rS').value !== r.m) r.m2 = +$('rS').value;
        }
        e = B.add(r);
        if (!e) return bad(t('This could not be saved. Try again.'));
      }
      load();
      refresh(); compute(); closeSheet(); draw(true);
      toast(t('Saved in this demo: {what}', { what: KIND[e.k] + ' · ' + book[e.c].name }));
    }

    /* ---- downloads (build 118) --------------------------------------------------
       Muhanad: "whatever is downloaded as an analysis, we need it to be a very detailed PDF with
       infographics, with charts", its tables as clean as the payment plan sheet, in Main Marks'
       branding, carrying the name of the manager who downloaded it.

       ONE DESCRIPTION, TWO FILES. A report is a cover (what it is, ONE sentence saying what it found,
       tiles, one picture) and SECTIONS; each section is a reading in plain sentences, a chart and a
       table. js/report.js draws it as a PDF; js/xlsx.js writes the same tables as sheets. Neither works
       a figure out, so the two cannot disagree.

       SECTIONS ARE WRITTEN ONCE and shared: a card's download holds only its own sections, "Whole team"
       holds them all, in the page's order.

       THE SENTENCES DESCRIBE, THEY NEVER PRESCRIBE. "Six companies went quiet" is the report's to say;
       what to do about them is the manager's. */
    var PAL = { green: '#1E9E78', yellow: '#E0A800', slate: '#7C8794', light: '#CFC8C0', orange: '#F7951E', black: '#0C0907', red: '#C4472F' };
    var SCOL = { active: PAL.green, quiet: PAL.yellow, inactive: PAL.slate, never: PAL.light };
    var CAP = 40;                                   /* rows of a long table the PDF prints; the Excel file has them all */
    function when2(e) { var d = B.dateOf(e.d); d.setHours(Math.floor(e.t / 60), e.t % 60, 0, 0); return d; }
    function outcome(e) { return isVisit(e) ? followed(e).text : e.k === 'cancel' ? WHYL[e.why] : e.k !== 'reservation' ? '' : e.end === 'cancel' ? t('later cancelled, {date}', { date: fmt(e.endD) }) : e.end === 'contract' ? t('became a contract') : t('still open'); }
    function sum(list, get) { return list.reduce(function (a, x) { return a + (get(x) || 0); }, 0); }
    function capped(tb) {
      if (tb.rows.length > CAP) { tb.pdfRows = tb.rows.slice(0, CAP); tb.more = t('{n} more rows are in the Excel file.', { n: tb.rows.length - CAP }); }
      return tb;
    }
    function eventTable(name, list, deals) {
      var rows = list.slice().sort(newest);
      var cols = [{ h: t('When'), w: 22, type: 'datetime' }, { h: t('What'), w: 20 }, { h: t('Brokerage company'), w: 23 }, { h: t('Sales agent'), w: 22 }, { h: t('Split with'), w: 14 }, { h: t('Unit type'), w: 15 }, { h: t('Unit code'), w: 11 }, { h: t('Area, m²'), w: 8, type: 'int' }, { h: t('Price, EGP'), w: 19, type: 'money' }]
        .concat(deals ? [] : [{ h: t('Sent as'), w: 17 }]).concat([{ h: t('Outcome or reason'), w: 22 }]);
      var tb = { title: name, cols: cols, rows: rows.map(function (e) {
        var r = [when2(e), KIND[kindOf(e)], e.c === null ? '' : book[e.c].name, TEAM[e.m].name, e.m2 !== undefined ? TEAM[e.m2].name : '', e.p ? prod(e.p) : '', e.u || '', e.area || '', e.v || ''];
        if (!deals) r.push(e.ch ? CH[e.ch] : '');
        r.push(outcome(e));
        return r;
      }) };
      var signed = rows.filter(function (e) { return e.k === 'contract'; });
      if (deals && signed.length) {
        tb.total = ['', t('Contracts signed'), signed.length, '', '', '', '', '', sum(signed, function (e) { return e.v; }), ''];
      }
      return capped(tb);
    }
    /* who in the team; when nobody dealt with it in the dates, whoever handled it BEFORE, and it says so */
    function whoOn(c) {
      var now = distinct(A.list.filter(function (e) { return e.c === c.id; }), 'm').map(function (m) { return TEAM[m].name; }).join(', ');
      return now || (c.who12.length ? c.who12.slice(0, 2).map(function (x) { return TEAM[x.m].name; }).join(', ') + ' ' + t('(before)') : '');
    }
    /* the lists a manager ACTS on (gone quiet, inactive, never asked) have no figures in the dates by
       definition: their table says what he needs for the call instead of seven columns of zero */
    function leanTable(name, list) {
      return capped({ title: name, cols: [{ h: '#', w: 5, type: 'int' }, { h: t('Brokerage company'), w: 26 }, { h: t('State today'), w: 13 }, { h: t('Last request'), w: 14, type: 'date' }, { h: t('Days silent'), w: 10, type: 'int' }, { h: t('Requests, 12 weeks'), w: 11, type: 'int' }, { h: t('Furthest step'), w: 18 }, { h: t('Last orientation or workshop'), w: 24 }, { h: t('Who in your team'), w: 32 }],
        rows: list.map(function (c, i) { var v = c.ev.filter(isVisit).sort(function (a, b) { return a.d - b.d; })[0]; return [i + 1, c.name, STATE[c.state], c.days === null ? '' : B.dateOf(c.days), c.days === null ? '' : c.days, c.total, STEP[c.step][1], v ? KIND[v.k] + ' · ' + fmt(v.d) : t('None recorded'), whoOn(c)]; }),
        total: list.length ? ['', count(list.length, 'company'), '', '', '', sum(list, function (c) { return c.total; }), '', '', ''] : null });
    }
    function companyTable(name, list) {
      var n = function (c) { return A.byC[c.id]; };
      return capped({ title: name, cols: [{ h: '#', w: 5, type: 'int' }, { h: t('Brokerage company'), w: 24 }, { h: t('State today'), w: 12 }, { h: t('Last request'), w: 12, type: 'date' }, { h: t('Special requests'), w: 10, type: 'int' }, { h: t('Requests, 12 weeks'), w: 10, type: 'int' }, { h: t('Meetings'), w: 10, type: 'int' }, { h: t('Reservations'), w: 11, type: 'int' }, { h: t('Cancelled reservations'), w: 11, type: 'int' }, { h: t('Contracts'), w: 10, type: 'int' }, { h: t('Sales, EGP'), w: 16, type: 'money' }, { h: t('Who in your team'), w: 28 }],
        rows: list.map(function (c, i) { return [i + 1, c.name, STATE[c.state], c.days === null ? '' : B.dateOf(c.days), n(c).special, c.total, n(c).meeting, n(c).reservation, n(c).cancel, n(c).contract, n(c).value, whoOn(c)]; }),
        total: list.length ? ['', count(list.length, 'company'), '', '', sum(list, function (c) { return n(c).special; }), sum(list, function (c) { return c.total; }), sum(list, function (c) { return n(c).meeting; }), sum(list, function (c) { return n(c).reservation; }), sum(list, function (c) { return n(c).cancel; }), sum(list, function (c) { return n(c).contract; }), sum(list, function (c) { return n(c).value; }), ''] : null });
    }
    function peopleTable() {
      var n = A.tot;
      return { title: t('Sales agents'), cols: [{ h: '#', w: 5, type: 'int' }, { h: t('Sales agent'), w: 22 }, { h: t('Title'), w: 24 }, { h: t('Code'), w: 10 }, { h: t('Offers sent'), w: 10, type: 'int' }, { h: t('Special requests'), w: 10, type: 'int' }, { h: t('Broadcasts'), w: 10, type: 'int' }, { h: t('Companies'), w: 10, type: 'int' }, { h: t('Meetings'), w: 10, type: 'int' }, { h: t('Reservations'), w: 11, type: 'int' }, { h: t('Cancelled reservations'), w: 11, type: 'int' }, { h: t('Contracts'), w: 10, type: 'int' }, { h: t('Sales, EGP'), w: 16, type: 'money' }],
        rows: A.people.map(function (p, i) { return [i + 1, p.name, title(p.title), p.code, p.n.offers, p.n.special, p.n.broadcast, p.companies, p.n.meeting, p.n.reservation, p.n.cancel, p.n.contract, p.n.value]; }),
        total: ['', t('The team together'), '', '', n.offers, n.special, n.broadcast, A.asked.length, n.meeting, n.reservation, n.cancel, n.contract, n.value] };
    }
    function tilesOf(n, first) {
      return (first || []).concat([[t('Special requests'), n.special], [t('Meetings'), n.meeting], [t('Reservations'), n.reservation], [t('Contracts'), n.contract], [t('Sales, EGP'), n.value, 'money'], [t('Broadcasts'), n.broadcast], [t('Cancelled reservations'), n.cancel]]);
    }
    function stateDonut() { return { type: 'donut', title: t('Companies by state, today'), centre: t('companies'), rows: ORDER.map(function (k) { return [STATE[k], count4[k], SCOL[k]]; }) }; }

    /* ---- the sections ---- */
    function secHealth() {
      var d = A.delta, sign = function (v) { return (v > 0 ? '+' : v < 0 ? '−' : '') + Math.abs(v); };
      var notes = [t('{a} active, {b} gone quiet, {c} inactive and {d} never asked.', { a: count4.active, b: count4.quiet, c: count4.inactive, d: count4.never })];
      if (d) notes.push(t('Since {date}: active {a}, gone quiet {b}, inactive {c}, never asked {d}.', { date: fmt(period.from + 1), a: sign(d.active), b: sign(d.quiet), c: sign(d.inactive), d: sign(d.never) }));
      notes.push(t('Your team worked with {a} of {b} companies in these dates, and {c} of them brought a meeting.', { a: A.reached, b: book.length, c: A.effective }));
      return { kicker: t('Brokerage health'), title: t('Where the {n} companies stand today', { n: book.length }),
        text: [t('A company is active when it asked your team for an offer in the last two weeks, gone quiet after two weeks of silence, and inactive after a month.')], notes: notes,
        charts: [stateDonut()],
        tables: [{ title: t('Brokerage health'), cols: [{ h: t('State today'), w: 30 }, { h: t('Companies'), w: 14, type: 'int' }, { h: t('Change in these dates'), w: 20 }],
          rows: ORDER.map(function (k) { return [STATE[k], count4[k], d ? sign(d[k]) : '']; }), total: [t('All companies'), book.length, ''] }] };
    }
    function secTrend(weeks, heading, what, notes) {
      var best = weeks.reduce(function (a, w) { return w.n > a.n ? w : a; }, weeks[0]);
      notes = (notes || []).slice();
      if (best.n) notes.push(t('The busiest week started {date}, with {n}.', { date: fmt(best.from), n: best.n }));
      notes.push(t('{n} in the 12 weeks together.', { n: sum(weeks, function (w) { return w.n; }) }));
      return { kicker: t('Over time'), title: heading,
        text: [t('Each column is one week, the oldest on the left. The weeks inside the dates of this report are in orange.')], notes: notes,
        charts: [{ type: 'columns', title: what, rows: weeks.map(function (w) { return [fmt(w.from), w.n, (w.to <= period.from && w.from >= period.to) ? PAL.orange : PAL.black]; }) }],
        tables: [{ excelOnly: true, title: what, cols: [{ h: t('Week'), w: 30 }, { h: what, w: 16, type: 'int' }, { h: t('In these dates'), w: 14 }], rows: weeks.map(function (w) { return [fmt(w.from) + ' – ' + fmt(w.to), w.n, (w.to <= period.from && w.from >= period.to) ? t('Yes') : '']; }) }] };
    }
    function secRank(f, heading, text, list, notes) {
      var m = metric(f), top = list.slice(0, 10), lean = f === 'quiet' || f === 'inactive' || f === 'never';
      return { kicker: t('Ranking'), title: heading, text: [text], notes: notes || [],
        charts: top.length && top.some(function (c) { return m.get(c) > 0; }) ? [{ type: 'hbar', keepZero: true, title: t('The first {n}, by {what}', { n: top.length, what: m.lab }), rows: top.map(function (c) { return [c.name, m.get(c), STATE[c.state] + ' · ' + ago(c), c.state === 'never' ? PAL.slate : SCOL[c.state]]; }) }] : [],
        tables: [lean ? leanTable(heading, list) : companyTable(heading, list)] };
    }
    /* MOVEMENT, as a page: the ladder as a picture, how many moved each way, and every company that moved */
    var TOUCH = { asked: ['orientation'], back: ['orientation', 'workshop'], met: ['workshop', 'orientation'], res: ['workshop'], nomeet: ['workshop'], oriented: ['orientation'] };
    function touchText(key, r) {
      var d = key === 'nomeet' || key === 'oriented' ? 0 : key === 'res' ? (r.meet ? r.meet.d : null) : r.e ? r.e.d : null, v;
      if (!TOUCH[key] || d === null) return '';
      v = touchOf(r.c, TOUCH[key], d);
      return v ? KIND[v.k] + ' ' + fmt(v.d) + ' · ' + TEAM[v.m].name + ': ' + followed(v).text : t('None recorded');
    }
    function secMovement() {
      var M = A.move, n = [0, 0, 0, 0, 0], rows = [], groups = M.up.concat(M.still, M.down);
      book.forEach(function (c) { n[c.step]++; });
      groups.forEach(function (g) { g.rows.forEach(function (r) { rows.push([g.label, r.c.name, r.c.step > r.c.l0 ? STEP[r.c.l0][0] + ' → ' + STEP[r.c.step][0] : r.c.was !== r.c.state ? STATE[r.c.was] + ' → ' + STATE[r.c.state] : STATE[r.c.state], r.e ? B.dateOf(r.e.d) : (r.c.days === null ? '' : B.dateOf(r.c.days)), r.e && r.e.m !== undefined ? TEAM[r.e.m].name : whoOn(r.c), touchText(g.key, r)]); }); });
      var gcol = function (g) { return M.up.indexOf(g) !== -1 ? PAL.green : M.down.indexOf(g) !== -1 ? (g.key === 'quiet' ? PAL.yellow : PAL.slate) : PAL.light; };
      return { kicker: t('Movement'), title: t('Who moved up, who moved down'),
        text: [t('The ladder is how far each company has ever got with your team: asked, brought a meeting, reserved, signed. A company stands on the highest step it has reached. This page compares the day before these dates with today, and counts each company once.')],
        notes: [t('{a} moved up, {b} moved down, {c} not moving.', { a: count(moveCount(M.up), 'company'), b: moveCount(M.down), c: moveCount(M.still) }),
          t('On the ladder today: {a} never asked, {b} asked and brought no meeting, {c} brought a meeting, {d} reserved, {e} signed.', { a: n[0], b: n[1], c: n[2], d: n[3], e: n[4] }),
          t('{a} companies climbed a step in these dates.', { a: M.plus.reduce(function (x, y) { return x + y; }, 0) })],
        charts: [{ type: 'hbar', keepZero: true, title: t('The ladder today, and who climbed onto each step in these dates'), rows: STEP.map(function (st, i) { return [st[1], n[i], M.plus[i] ? '+' + M.plus[i] + ' ' + t('in these dates') : '', i ? PAL.black : PAL.light]; }) },
          { type: 'hbar', title: t('What happened, by number of companies'), rows: groups.filter(function (g) { return g.rows.length; }).map(function (g) { return [g.label, g.rows.length, '', gcol(g)]; }) }],
        tables: [({ title: t('Every company that moved, or is not moving'), cols: [{ h: t('What happened'), w: 22 }, { h: t('Brokerage company'), w: 22 }, { h: t('From, to'), w: 22 }, { h: t('When'), w: 13, type: 'date' }, { h: t('Who in your team'), w: 24 }, { h: t('What the team did before'), w: 40 }], rows: rows })] };
    }
    /* ORIENTATIONS AND WORKSHOPS, as a page: each visit beside what followed it */
    function secVisits(list, heading) {
      var per = {}, ok = list.filter(function (x) { return x.f.ok; }).length;
      list.forEach(function (x) { var p = per[x.e.m] || (per[x.e.m] = [0, 0]); p[x.f.ok ? 0 : 1]++; });
      var o = list.filter(function (x) { return x.e.k === 'orientation'; }), w = list.filter(function (x) { return x.e.k === 'workshop'; });
      return { kicker: t('What the team did'), title: heading,
        text: [t('An orientation is a visit to a company to present the project. A workshop is a working session at a company that asks a lot and has brought no meeting. Each one is shown beside what followed it: a request within 7 business days of an orientation, a meeting within 14 business days of a workshop. Friday is not counted.')],
        notes: [t('{a} and {b} in these dates.', { a: count(o.length, 'orientation'), b: count(w.length, 'workshop') }), t('{a} of {b} were followed by a request or a meeting.', { a: ok, b: list.length })],
        charts: list.length ? [{ type: 'stacked', title: t('Visits, by who went'), series: [{ name: t('Followed by a request or a meeting'), color: PAL.green }, { name: t('Nothing followed yet'), color: PAL.light, ink: '#141210' }], rows: Object.keys(per).sort(function (a, b) { return per[b][0] + per[b][1] - per[a][0] - per[a][1]; }).map(function (m) { return [TEAM[m].name, per[m]]; }) }] : [],
        tables: [capped({ title: heading, cols: [{ h: t('When'), w: 14, type: 'date' }, { h: t('What'), w: 16 }, { h: t('Brokerage company'), w: 26 }, { h: t('Who went'), w: 22 }, { h: t('Also went'), w: 20 }, { h: t('What followed'), w: 34 }],
          rows: list.map(function (x) { var e = x.e; return [B.dateOf(e.d), KIND[e.k], book[e.c].name, TEAM[e.m].name, e.m2 !== undefined ? TEAM[e.m2].name : '', x.f.text]; }) })] };
    }
    function funnelChart(own) {
      var n = own || A.tot;
      return { type: 'hbar', keepZero: true, title: t('From request to contract'), rows: [[t('Special requests'), n.special, '', PAL.black], [t('Meetings'), n.meeting, '', PAL.slate], [t('Reservations'), n.reservation, '', PAL.yellow], [t('Contracts'), n.contract, '', PAL.green]] };
    }
    function secFunnel() {
      var n = A.tot, res = A.list.filter(function (e) { return e.k === 'reservation'; }), notes = [];
      var became = res.filter(function (e) { return e.end === 'contract'; }).length, gone = res.filter(function (e) { return e.end === 'cancel'; }).length;
      if (n.meeting && n.special >= 5) notes.push(t('One meeting for every {n} special requests.', { n: Math.max(1, Math.round(n.special / n.meeting)) }));
      if (res.length) notes.push(t('Of {n} reservations made in these dates, {a} became a contract, {b} were cancelled and {c} are still open.', { n: res.length, a: became, b: gone, c: res.length - became - gone }));
      if (n.contract) notes.push(t('{x} signed in these dates, worth {v}.', { x: count(n.contract, 'contract'), v: money(n.value) }));
      if (n.cancel) notes.push(t('{x} recorded in these dates.', { x: count(n.cancel, 'cancellation') }));
      return { kicker: t('Results'), title: t('From request to contract'),
        text: [t('A special request is a company asking for an offer: a sign it has a client. This is how far those requests travelled in these dates.')], notes: notes,
        charts: [funnelChart()],
        tables: [{ title: t('From request to contract'), cols: [{ h: t('Step'), w: 30 }, { h: t('Count'), w: 14, type: 'int' }],
          rows: [[t('Special requests'), n.special], [t('Broadcasts'), n.broadcast], [t('Companies that asked'), A.asked.length], [t('Meetings'), n.meeting], [t('Reservations'), n.reservation], [t('Cancelled reservations'), n.cancel], [t('Contracts'), n.contract]], total: [t('Sales, EGP'), n.value] }] };
    }
    function secTeam() {
      var idle = A.people.filter(function (p) { return !p.n.offers; }).map(function (p) { return p.name; });
      var notes = [t('{x} sales agents sent an offer.', { x: t('{a} of {b}', { a: A.sending, b: TEAM.length }) })];
      if (idle.length) notes.push(t('Nothing sent in these dates: {names}.', { names: idle.join(', ') }));
      notes.push(t('Special requests are counted apart from broadcasts: a broadcast goes to no company in particular.'));
      return { kicker: t('The team'), title: t('Who did what'), text: [t('Each sales agent’s offers in these dates, split into special requests and broadcasts.')], notes: notes,
        charts: [{ type: 'stacked', title: t('Offers sent, by sales agent'), series: [{ name: t('Special requests'), color: PAL.black }, { name: t('Broadcasts'), color: PAL.light, ink: '#141210' }], rows: A.people.map(function (p) { return [p.name, [p.n.special, p.n.broadcast]]; }) }],
        tables: [peopleTable()] };
    }
    function secDeals(list, heading, chartless) {
      return { kicker: t('Results'), title: heading,
        text: [t('Every reservation, contract and cancellation recorded in these dates. A cancelled reservation stays in the list, with its reason.')], notes: [],
        charts: chartless || !A.salesByC.length ? [] : [{ type: 'hbar', title: t('Sales by company'), fmt: money, rows: A.salesByC.slice(0, 10).map(function (x) { return [x.c.name, x.v, count(x.n, 'contract'), PAL.green]; }) }],
        tables: [eventTable(heading, list, true)] };
    }
    function secCancel(list) {
      var by = {}; list.forEach(function (e) { by[e.why] = (by[e.why] || 0) + 1; });
      var cols = [PAL.red, PAL.yellow, PAL.slate, PAL.light];
      return { kicker: t('Results'), title: t('Cancelled reservations'),
        text: [t('A reservation that was withdrawn. It is kept in the history with its date and reason, and counted apart.')], notes: [],
        charts: [{ type: 'donut', title: t('Cancellations by reason'), centre: t('cancelled'), rows: B.why.filter(function (w) { return by[w]; }).map(function (w, i) { return [WHYL[w], by[w], cols[i % cols.length]]; }) }],
        tables: [eventTable(t('Cancelled reservations'), list, true)] };
    }
    function secLog(list, heading) {
      return { kicker: t('The record'), title: heading, text: [t('Every row, the newest first.')], notes: [], charts: [], tables: [eventTable(heading, list)] };
    }

    function makeReport(name, kind, answer, tiles, sections, coverChart) {
      var made = new Date(), year = B.dateOf(0).getFullYear();
      var rep = { title: name, kind: t('Team Pulse') + ' · ' + kind, range: rangeText(),
        subtitle: t('{name}’s team · {n} · {dates}', { name: MGR.name, n: count(TEAM.length, 'salesperson'), dates: rangeText() }),
        by: t('Prepared by {name}, {title} · {date}', { name: MGR.name, title: title(MGR.title), date: fmt(0) + ' ' + year }),
        demo: t('DEMO FIGURES. The activity in this file is invented for the demonstration.'), rtl: AR,
        answer: answer, summary: tiles, coverChart: coverChart, sections: sections,
        meta: [[t('Dates'), rangeText()], [t('Made on'), made, 'datetime'], [t('Prepared by'), MGR.name + ' (' + MGR.code + ')'], [t('What it covers'), t('Your team’s activity only')]],
        labels: { summary: t('In these dates'), summarySheet: t('Summary'), analysis: t('What it shows'), demoFoot: t('DEMO FIGURES'), page: t('Page {n} of {m}'), continued: t('continued'), none: t('Nothing in these dates.') },
        tables: [], notes: answer ? [answer] : [] };
      sections.forEach(function (s) { (s.notes || []).forEach(function (n) { rep.notes.push(n); }); (s.tables || []).forEach(function (tb) { rep.tables.push(tb); }); });
      return rep;
    }
    var STATE_TEXT = { active: t('Asked your team for an offer in the last two weeks.'), quiet: t('Was asking, then nothing for two weeks. The early warning.'), inactive: t('No request to your team for a month.'), never: t('Has not asked your team for an offer yet.') };
    function listTiles(name, list, f) {
      var n = function (c) { return A.byC[c.id]; };
      if (f === 'never') return [[name, list.length], [t('Had an orientation'), list.filter(function (c) { return c.ev.some(isVisit); }).length]];
      if (f === 'quiet' || f === 'inactive') return [[name, list.length], [t('Requests, 12 weeks'), sum(list, function (c) { return c.total; })], [t('Brought a meeting before'), list.filter(function (c) { return c.step >= 2; }).length], [t('Longest silence, days'), list.reduce(function (a, c) { return Math.max(a, c.days || 0); }, 0)]];
      return [[name, list.length], [t('Special requests'), sum(list, function (c) { return n(c).special; })], [t('Meetings'), sum(list, function (c) { return n(c).meeting; })], [t('Contracts'), sum(list, function (c) { return n(c).contract; })], [t('Sales, EGP'), sum(list, function (c) { return n(c).value; }), 'money']];
    }
    function inList(list) { return t('{a} of {b} companies are in this list today.', { a: list.length, b: book.length }); }
    function describe(key) {
      var at = key.indexOf(':'), kind = at === -1 ? key : key.slice(0, at), arg = at === -1 ? '' : key.slice(at + 1);
      var n = A.tot, name, list, p, c, mine, w;
      if (kind === 'state' && STATE[arg]) {
        name = arg === 'active' ? t('Active companies') : STATE[arg]; list = companyMatches(arg);
        return makeReport(name, t('Companies'), inList(list), listTiles(name, list, arg), [secRank(arg, name, STATE_TEXT[arg], list)], stateDonut());
      }
      if (kind === 'effective') {
        name = t('Effective companies'); list = companyMatches('effective');
        return makeReport(name, t('Companies'), inList(list), listTiles(name, list), [secRank('effective', name, t('Brought at least one meeting in the dates shown.'), list)], stateDonut());
      }
      if (kind === 'nomeet') {
        name = t('Many requests, no meeting'); list = companyMatches('nomeet');
        return makeReport(name, t('Companies'), inList(list), listTiles(name, list), [secRank('nomeet', name, t('Six or more requests in the last 30 days, and no meeting recorded yet.'), list)], stateDonut());
      }
      if (kind === 'deals') {
        name = t('Reservations and contracts');
        return makeReport(name, t('Results'), t('{a}, {b} and {c} in these dates.', { a: count(n.reservation, 'reservation'), b: count(n.contract, 'contract'), c: count(n.cancel, 'cancellation') }), tilesOf(n).slice(2).concat(tilesOf(n).slice(0, 2)),
          [secFunnel(), secDeals(A.deals, name)].concat(n.cancel ? [secCancel(A.deals.filter(function (e) { return e.k === 'cancel'; }))] : []), funnelChart());
      }
      if (kind === 'cancels') {
        name = t('Cancelled reservations'); list = A.deals.filter(function (e) { return e.k === 'cancel'; });
        return makeReport(name, t('Results'), t('{x} recorded in these dates.', { x: count(list.length, 'cancellation') }), [[name, list.length], [t('Reservations'), n.reservation], [t('Contracts'), n.contract]], [secCancel(list)]);
      }
      if (kind === 'team') {
        return makeReport(t('Whole team'), t('Full analysis'),
          t('{a} from {b} in these dates: {c}, {d} and {e}.', { a: count(n.special, 'special'), b: count(A.asked.length, 'company'), c: count(n.meeting, 'meeting'), d: count(n.reservation, 'reservation'), e: count(n.contract, 'contract') }), tilesOf(n),
          [secHealth()].concat(A.move ? [secMovement()] : [], A.visits.length ? [secVisits(A.visits, t('Orientations and workshops'))] : [], [secTrend(teamWeeks(), t('Special requests, week by week'), t('Special requests each week'), A.prev ? [t('In these dates: {x}.', { x: vs(n.special, A.prev.special, 'before') })] : []),
            secRank('active', t('Active companies'), STATE_TEXT.active, companyMatches('active')), secRank('quiet', STATE.quiet, STATE_TEXT.quiet, companyMatches('quiet')),
            secRank('inactive', STATE.inactive, STATE_TEXT.inactive, companyMatches('inactive')), secRank('never', STATE.never, STATE_TEXT.never, companyMatches('never')),
            secRank('effective', t('Effective companies'), t('Brought at least one meeting in the dates shown.'), companyMatches('effective')),
            secRank('nomeet', t('Many requests, no meeting'), t('Six or more requests in the last 30 days, and no meeting recorded yet.'), companyMatches('nomeet')),
            secFunnel(), secTeam(), secDeals(A.deals, t('Reservations and contracts'))])
            .concat(n.cancel ? [secCancel(A.deals.filter(function (e) { return e.k === 'cancel'; }))] : []).concat([secLog(A.list, t('All activity'))]), funnelChart());
      }
      if (kind === 'person') {
        p = A.people.filter(function (x) { return x.id === +arg; })[0]; if (!p) return null;
        mine = A.list.filter(function (e) { return e.m === p.id || e.m2 === p.id; });
        var comps = distinct(mine.filter(function (e) { return e.k === 'offer'; }), 'c').map(function (i) { var ev = mine.filter(function (e) { return e.c === i; }), tn = tally(ev); return { c: book[i], n: tn }; }).sort(function (a, b) { return b.n.special - a.n.special; });
        var post = mine.filter(function (e) { return e.ch === 'post'; }).length, pdf = mine.filter(function (e) { return e.ch === 'pdf'; }).length;
        var mineDeals = mine.filter(function (e) { return e.k === 'reservation' || e.k === 'contract' || e.k === 'cancel'; });
        var secs = [secTrend(personWeeks(p.id), t('Offers, week by week'), t('Offers sent each week')),
          { kicker: t('Companies'), title: t('The companies {name} worked with', { name: p.name.split(' ')[0] }), text: [t('Ranked by special requests in these dates. Figures are this sales agent’s own.')], notes: [t('Sent as {a} and {b}', { a: count(post, 'post'), b: count(pdf, 'pdf') }) + '.'],
            charts: comps.length ? [{ type: 'hbar', title: t('Special requests, by company'), rows: comps.slice(0, 10).map(function (x) { return [x.c.name, x.n.special, x.n.meeting ? count(x.n.meeting, 'meeting') : '', SCOL[x.c.state] === PAL.light ? PAL.slate : SCOL[x.c.state]]; }) }] : [],
            tables: [{ title: t('Companies'), cols: [{ h: '#', w: 5, type: 'int' }, { h: t('Brokerage company'), w: 30 }, { h: t('State today'), w: 14 }, { h: t('Special requests'), w: 12, type: 'int' }, { h: t('Meetings'), w: 12, type: 'int' }, { h: t('Reservations'), w: 12, type: 'int' }, { h: t('Contracts'), w: 12, type: 'int' }, { h: t('Sales, EGP'), w: 18, type: 'money' }],
              rows: comps.map(function (x, i) { return [i + 1, x.c.name, STATE[x.c.state], x.n.special, x.n.meeting, x.n.reservation, x.n.contract, x.n.value]; }) }] }];
        if (mineDeals.length) secs.push(secDeals(mineDeals, t('Reservations and contracts'), true));
        var lost = book.filter(function (c) { return c.who12.length && c.who12[0].m === p.id && (c.state === 'quiet' || c.state === 'inactive'); }).sort(function (a, b) { return b.total - a.total; });
        if (lost.length) secs.push({ kicker: t('Companies'), title: t('Gone quiet or inactive with {name}', { name: p.name.split(' ')[0] }), text: [t('Companies this sales agent handled most, with no request for two weeks or more. They are not in the list above, because they did not ask in these dates.')], notes: [], charts: [], tables: [leanTable(t('Gone quiet or inactive'), lost)] });
        secs.push(secLog(mine, t('Activity')));
        return makeReport(p.name, t('Sales agent'), t('{name} sent {a} special requests to {b} companies and {c} broadcasts in these dates.', { name: p.name, a: p.n.special, b: p.companies, c: p.n.broadcast }),
          [[t('Offers sent'), p.n.offers], [t('Special requests'), p.n.special], [t('Companies'), p.companies], [t('Meetings'), p.n.meeting], [t('Deals'), p.n.reservation + p.n.contract], [t('Broadcasts'), p.n.broadcast], [t('Cancelled reservations'), p.n.cancel], [t('Sales, EGP'), p.n.value, 'money']], secs, funnelChart(p.n));
      }
      if (kind === 'company') {
        c = book[+arg]; if (!c) return null;
        var all = events.filter(function (e) { return e.c === c.id; }), who = {}, asks = {};
        all.forEach(function (e) { if (e.k === 'offer') { who[e.m] = (who[e.m] || 0) + 1; asks[e.p] = (asks[e.p] || 0) + 1; } });
        var cn = A.byC[c.id], pc = [PAL.black, PAL.orange, PAL.slate, PAL.green, PAL.yellow];
        return makeReport(c.name, t('Company'), t('{state} with your team · {ago}', { state: STATE[c.state], ago: ago(c) }),
          [[t('State today'), STATE[c.state], 'text'], [t('Special requests'), cn.special], [t('Meetings'), cn.meeting], [t('Deals'), cn.reservation + cn.contract], [t('Sales, EGP'), cn.value, 'money'], [t('Requests, 12 weeks'), c.total], [t('Cancelled reservations'), cn.cancel]],
          [secTrend(companyWeeks(c.id), t('Requests to your team, week by week'), t('Special requests each week')),
            { kicker: t('The team'), title: t('Who in your team, and what it asks for'), text: [t('The 12 weeks to today, your team only.')], notes: [],
              charts: [{ type: 'hbar', title: t('Special requests, by sales agent'), rows: Object.keys(who).sort(function (a, b) { return who[b] - who[a]; }).map(function (m) { return [TEAM[m].name, who[m], '', PAL.black]; }) },
                { type: 'donut', title: t('Asks for'), centre: t('requests'), rows: Object.keys(asks).sort(function (a, b) { return asks[b] - asks[a]; }).map(function (k, i) { return [prod(k), asks[k], pc[i % pc.length]]; }) }], tables: [] },
            secLog(all, t('History · 12 weeks'))], funnelChart(cn));
      }
      if (kind === 'movement' && A.move) return makeReport(t('Movement'), t('Companies'), t('{a} moved up, {b} moved down, {c} not moving.', { a: count(moveCount(A.move.up), 'company'), b: moveCount(A.move.down), c: moveCount(A.move.still) }),
        [[t('Moved up'), moveCount(A.move.up)], [t('Moved down'), moveCount(A.move.down)], [t('Not moving'), moveCount(A.move.still)], [t('Orientations'), n.orientation], [t('Workshops'), n.workshop]], [secMovement()].concat(A.visits.length ? [secVisits(A.visits, t('Orientations and workshops'))] : []), secMovement().charts[0]);
      if (kind === 'visits') return makeReport(t('Orientations and workshops'), t('What the team did'), t('{a} and {b} in these dates.', { a: count(n.orientation, 'orientation'), b: count(n.workshop, 'workshop') }),
        [[t('Orientations'), n.orientation], [t('Led to a request'), A.led.orientation], [t('Workshops'), n.workshop], [t('Led to a meeting'), A.led.workshop]], [secVisits(A.visits, t('Orientations and workshops'))]);
      if (kind === 'fresh') { name = t('New companies'); list = companyMatches('fresh'); return makeReport(name, t('Companies'), t('{x} asked your team for the first time in these dates.', { x: count(list.length, 'company') }), listTiles(name, list), [secRank('fresh', name, t('The first request to your team falls in these dates.'), list)]); }
      if (kind === 'tile' && TILE[arg]) {
        name = TILE[arg]; list = tileList(arg);
        if (arg === 'orientation' || arg === 'workshop') return makeReport(name, t('What the team did'), t('{a} of {b} were followed by a request or a meeting.', { a: list.filter(function (x) { return x.f.ok; }).length, b: list.length }),
          [[name, list.length], [arg === 'orientation' ? t('Led to a request') : t('Led to a meeting'), A.led[arg]]], [secVisits(list, name)]);
        if (arg === 'asked') return makeReport(name, t('Companies'), t('{x} asked your team in these dates.', { x: count(list.length, 'company') }), listTiles(name, list), [secRank('all', name, t('Ranked by special requests in these dates.'), list)]);
        if (arg === 'offers') return makeReport(name, t('Activity'), t('{a} special requests and {b} broadcasts in these dates.', { a: n.special, b: n.broadcast }), tilesOf(n), [secTrend(teamWeeks(), t('Special requests, week by week'), t('Special requests each week')), secTeam(), secLog(list, name)], funnelChart());
        if (arg === 'meeting') return makeReport(name, t('Activity'), t('{x} recorded in these dates.', { x: count(list.length, 'meeting') }), tilesOf(n).slice(1).concat(tilesOf(n).slice(0, 1)), [secFunnel(), secLog(list, name)]);
        return makeReport(name, t('Results'), arg === 'reservation' ? t('{a} and {b} in these dates.', { a: count(n.reservation, 'reservation'), b: count(n.cancel, 'cancellation') }) : t('{x} in this list.', { x: list.length }), tilesOf(n).slice(2).concat(tilesOf(n).slice(0, 2)), [secDeals(list, name, arg !== 'contract' && arg !== 'deals')]);
      }
      return null;
    }

    /* ---- handing the file over ----
       jsPDF and the fonts are fetched on the first PDF, not with the page, in one parallel batch. The
       Arabic faces, the shaper and jsPDF's disarm are fetched only when the report holds an Arabic letter
       (a brokerage's name is enough). The test is built from code points: an escape typed into an editing
       tool can land in the file as the raw character. */
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
      return Promise.all([script('vendor/jspdf.umd.min.js'), script('js/report.js'), arabic ? script('js/arabic.js') : null, arabic ? script('js/pdf.js') : null,
        Promise.all(files.map(function (f) { return bytes('vendor/fonts/' + f[2]); })), bytes('img/mainmarks-wordmark.png').catch(function () { return null; })]).then(function (r) {
        var fonts = files.map(function (f, i) { return { lang: f[0], weight: f[1], file: f[2], family: f[3], base64: b64(r[4][i]) }; });
        var png = r[5], logo = null;
        if (png && png[1] === 0x50) { var dv = new DataView(png.buffer, png.byteOffset, png.byteLength); logo = { data: 'data:image/png;base64,' + b64(png), w: dv.getUint32(16), h: dv.getUint32(20) }; }
        return MM.report.build({ jsPDF: window.jspdf.jsPDF, arabic: MM.arabic, disarm: MM.pdf && MM.pdf.disarm, fonts: fonts, report: rep, hasArabicText: arabic, logo: logo }).output('blob');
      });
    }
    function save(blob, file) {
      var a = document.createElement('a'), url = URL.createObjectURL(blob);
      a.href = url; a.download = file; document.body.appendChild(a); a.click(); a.remove();
      setTimeout(function () { URL.revokeObjectURL(url); }, 60000);
    }
    function download(key, as, btn) {
      var rep = describe(key);
      if (!rep) return;
      var file = 'Main Marks - Team Pulse - ' + String(rep.title).replace(/[\\\/:*?"<>|]/g, ' ').trim() + ' - ' + iso(period.from) + (period.from === period.to ? '' : ' to ' + iso(period.to)) + ' - DEMO.';
      var failed = function () { toast(t('The file could not be made. Try again.')); };
      if (as === 'xlsx') {
        try { save(new Blob([MM.xlsx.workbook(rep)], { type: MM.xlsx.type }), file + 'xlsx'); toast(t('Downloaded as Excel: {name}', { name: rep.title })); } catch (e) { failed(); }
        return;
      }
      if (btn) { if (btn.disabled) return; btn.disabled = true; btn.classList.add('busy'); }
      toast(t('Preparing the PDF…'));
      pdfBlob(rep).then(function (blob) { save(blob, file + 'pdf'); toast(t('Downloaded as PDF: {name}', { name: rep.title })); }, function (e) { if (window.console) console.error(e); failed(); })
        .then(function () { if (btn) { btn.disabled = false; btn.classList.remove('busy'); } });
    }
    /* for checks: the description and the file, without a click */
    MM.managerReports = { describe: describe, pdfBlob: pdfBlob };

    function setPeriod(key) {
      var P = PERIODS.filter(function (x) { return x[0] === key; })[0];
      period.key = key;
      if (key !== 'c') { period.from = P[2]; period.to = P[3]; menuOpen = false; }
      compute(); draw(key === 'c');
    }

    /* ---- wiring ----------------------------------------------------------- */
    $('tab').innerHTML = TABS.map(function (x) { return '<button type="button" data-t="' + x[0] + '">' + svg(x[0]) + '<span>' + x[1] + '</span></button>'; }).join('');
    $('fab').innerHTML = svg('plus');
    $('tab').hidden = false;
    if (MY) $('tab').classList.add('three');
    /* a salesperson's first tab is the sales app itself, which is another page */
    $('tab').addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return;
      if (b.dataset.t === 'offer') { location.href = 'index.html'; return; }
      var go = function () { look.tab = b.dataset.t; menuOpen = false; closeSheet(); draw(); };
      /* build 132: the heartbeat tapped from Profile plays the pulse too, and the page comes up after it */
      if (MY && b.dataset.t === 'my' && look.tab !== 'my') {
        [].forEach.call($('tab').children, function (x) { if (x === b) x.setAttribute('aria-current', 'page'); else x.removeAttribute('aria-current'); });
        if (pulse.again(go)) return;
      } else pulse.cancel();
      go();
    });
    $('veil').addEventListener('click', closeSheet);
    $('fab').addEventListener('click', function () { if (MY) { myRec.company = -1; openMyRecord(); } else openRecord(); });
    /* the record form checks a unit code as it is typed, and a corrected field clears the last refusal */
    $('sheet').addEventListener('input', function (e) {
      if (!MY) return;
      if ($('rErr')) $('rErr').hidden = true;
      if (e.target.id === 'rU') checkUnit();
      else if (e.target.id === 'rV') delete e.target.dataset.auto;
    });
    $('sheet').addEventListener('change', function (e) { if (!MY) return; if ($('rErr')) $('rErr').hidden = true; if (e.target.id === 'rR') fromReservation(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeSheet(); });
    /* a week's bar says what it holds when the pointer or the keyboard reaches it; a tap does the same */
    ['mouseover', 'focusin'].forEach(function (ev) { document.addEventListener(ev, function (e) { var c = e.target.closest && e.target.closest('[data-w]'); if (c) barPick(c); }); });
    document.addEventListener('click', function (e) {
      var hit = function (a) { return e.target.closest('[' + a + ']'); };
      /* build 129: "sent 16 times" explains itself: a tap opens the words under it, a tap anywhere else closes them */
      var why = e.target.closest('.why');
      [].forEach.call(document.querySelectorAll('.why[aria-expanded="true"]'), function (b) { if (b !== why) b.setAttribute('aria-expanded', 'false'); });
      if (why) { why.setAttribute('aria-expanded', why.getAttribute('aria-expanded') === 'true' ? 'false' : 'true'); return; }
      var d = hit('data-dl'), c = hit('data-c'), m = hit('data-m'), f = hit('data-f'), r = hit('data-r'), g = hit('data-go'), k = hit('data-k'), l = hit('data-lang');
      if (e.target.closest('#when')) { menuOpen = !menuOpen; draw(true); }
      else if (e.target.closest('#rSave')) { if (MY) saveMyRecord(); else saveRecord(); }
      else if (e.target.closest('#out')) { MM.auth.signOut(); location.replace(MY ? 'login.html' : 'login.html?next=manager.html'); }
      else if (hit('data-rm')) removeEntry(hit('data-rm').dataset.rm);
      else if (hit('data-rec')) { myRec.company = +hit('data-rec').dataset.rec; openMyRecord(); }
      else if (hit('data-e')) openEntry(hit('data-e').dataset.e);
      else if (e.target.closest('#wipe')) { B.reset(); location.reload(); }
      else if (l) { if (l.dataset.lang !== MM.lang) MM.setLang(l.dataset.lang); }
      else if (d) download(d.dataset.dl, d.dataset.as || 'pdf', d);
      else if (hit('data-d')) deckTo(hit('data-d').dataset.dk || 'deck', +hit('data-d').dataset.d, true);
      else if (hit('data-step')) openStep(+hit('data-step').dataset.step);
      else if (hit('data-all')) { look.all[hit('data-all').dataset.all] = true; draw(true); }
      else if (hit('data-g')) { look.grp[hit('data-g').dataset.g] = !look.grp[hit('data-g').dataset.g]; draw(true); }
      else if (hit('data-w')) barPick(hit('data-w'));
      else if (k && MY) { if ($('rC') && $('rC').value !== '') myRec.company = +$('rC').value; myRec.kind = k.dataset.k; openMyRecord(); }
      else if (k) { recKind = k.dataset.k; openRecord(); }
      else if (c) openCompany(+c.dataset.c);
      else if (m) openPerson(+m.dataset.m);
      else if (g && MY) openMyList(g.dataset.go);
      else if (g) { look.filter = g.dataset.go; look.query = ''; look.tab = 'companies'; menuOpen = false; closeSheet(); draw(); }
      else if (hit('data-tab')) { look.tab = hit('data-tab').dataset.tab; menuOpen = false; draw(); }
      else if (hit('data-s')) openTile(hit('data-s').dataset.s);
      else if (f) { look.filter = f.dataset.f; draw(true); }
      else if (r) setPeriod(r.dataset.r);
    });
    $('scr').addEventListener('change', function (e) {
      if (e.target.id !== 'dFrom' && e.target.id !== 'dTo') return;
      var a = agoOf($('dFrom').value), b = agoOf($('dTo').value);
      if (a === null || b === null) return;
      period.from = Math.max(a, b); period.to = Math.min(a, b);
      compute(); draw(true);
    });
    $('scr').addEventListener('input', function (e) { if (e.target.id === 'q') { look.query = e.target.value; $('clist').innerHTML = companyList(); } });

    var asked = (location.hash || '').slice(1);
    if (SCREENS[asked] && (MY ? asked === 'my' || asked === 'profile' : asked !== 'my')) look.tab = asked;
    refresh(); compute(); draw();
    /* the plus button on the sales app's home lands here with the record form open */
    if (MY && asked === 'record') openMyRecord();
  }
}());
