/* ------------------------------------------------------------------
   Main Marks — the sign-in page.

   It does four things and no more: take a work email and a password,
   say ONE clear thing when they do not match, answer "forgot password?"
   honestly, and go where the person was heading. Anyone already signed
   in never sees it.
   ------------------------------------------------------------------ */

(function () {
  'use strict';

  var MM = window.MM, el = MM.el, t = MM.t;
  MM.applyBrand();

  /* build 124: the store is the app. login.html?store=demo switches this one browser to the demo
     accounts and the demo book (for a pitch), and login.html?store=real switches it back. */
  (function () {
    var want = new URLSearchParams(location.search).get('store');
    try { if (want === 'demo') localStorage.setItem('mm.store', 'demo'); else if (want === 'real') localStorage.removeItem('mm.store'); } catch (e) { /* stays as it was */ }
  }());
  var REAL = MM.auth.real();
  var CHANGE = REAL && new URLSearchParams(location.search).get('change') === '1';

  /* ---- the entrance ---------------------------------------------------
     One class, set immediately. Every animation it starts carries
     fill-mode `both`, so it holds its own start state and cannot leave
     anything stranded — including in a background tab, where an earlier
     requestAnimationFrame version left the form invisible.

     The form is usable from the first frame: the sequence moves opacity
     and transform only, and no input is ever disabled. If this script
     fails, the class is never set and everything is simply visible. */
  document.body.classList.add('seq');

  /* Where to go after signing in. Only a page inside this app: a `next`
     that points anywhere else is ignored rather than followed. */
  function nextPage() {
    var raw = new URLSearchParams(location.search).get('next') || '';
    /* build 116: a sales manager chooses between his team and the sales app */
    var me = MM.auth.current();
    /* build 120: only where the manager view is set up (CONFIG.salesTeam). A copy published without it
       has no start.html, and a manager must land on the projects, not on a missing page. */
    if (CHANGE) raw = '';
    if (me && me.role === 'admin') return 'admin.html';
    /* build 124 sent a manager on the store straight to the sales app, because Team Pulse still drew the
       demo book. build 135: Team Pulse reads the store, so he lands on "Lead or sell?" there as well. */
    if (!raw) return me && me.role === 'sales_manager' && (REAL || CONFIG.salesTeam) ? 'start.html' : 'index.html';
    if (/^[a-z0-9\-]+\.html(\?[^#]*)?$/i.test(raw)) return raw;
    return 'index.html';
  }

  /* Already signed in? Then this page has nothing to ask. */
  if (MM.auth.current() && !CHANGE) { location.replace(nextPage()); return; }
  if (CHANGE && !MM.auth.current()) { location.replace('login.html'); return; }

  var form = document.getElementById('signin');
  var who = document.getElementById('who');
  var code = document.getElementById('code');
  var why = document.getElementById('why');
  var go = document.getElementById('go');

  /* ---- forgot password ------------------------------------------------
     There is no back end yet, so it must not pretend to send an email.
     It says who can actually reset it. */
  var forgot = document.getElementById('forgot');
  var forgotNote = document.getElementById('forgotnote');
  forgot.addEventListener('click', function () {
    forgotNote.textContent = REAL ? t('The admin resets it and gives you a new one. Nothing is emailed from this app.') : t('Your sales manager resets it. Nothing is emailed from this app.');
    forgotNote.hidden = false;
  });

  /* ---- the demo accounts ---------------------------------------------
     Only while the team list in config is the placeholder one. It
     disappears on its own the moment the real list replaces it. */
  var note = document.getElementById('demonote');
  if (note && CONFIG.usersDemo && !REAL) {
    note.hidden = false;
    var list = el('div', 'demo-accounts');
    (CONFIG.users || []).forEach(function (u) {
      var row = el('button', 'demo-acct');
      row.type = 'button';
      row.appendChild(el('span', 'da-n', u.email || u.name));
      row.appendChild(el('span', 'da-r', t((CONFIG.roles[u.role] || {}).label || u.role)));
      row.addEventListener('click', function () {
        who.value = u.email || u.name;
        code.value = u.code;
        why.hidden = true;
        go.focus();
      });
      list.appendChild(row);
    });
    note.appendChild(list);
  }

  function fail(msg) {
    why.textContent = msg;
    why.hidden = false;
    why.setAttribute('role', 'alert');    /* said once, out loud, for a screen reader too */
  }

  var sweep = document.querySelector('.gate-sweep');
  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function busy(on) {
    go.classList.toggle('is-loading', on);
    go.disabled = on;
    form.classList.toggle('is-busy', on);
    if (on && sweep) {
      sweep.classList.remove('is-lit');
      void sweep.offsetWidth;          /* restart it */
      sweep.classList.add('is-lit');
    }
  }

  /* ---- choosing your own password (build 122, the store only) --------
     Offered once, straight after the first sign-in with the password the
     admin handed over, and whenever the person asks for it from his menu
     (login.html?change=1). "Not now" is allowed: he keeps the one he has. */
  var box = document.getElementById('newpw');
  function askNewPassword(then) {
    var pw1 = document.getElementById('pw1'), pw2 = document.getElementById('pw2');
    var pwWhy = document.getElementById('pwwhy'), pwGo = document.getElementById('pwgo');
    Array.prototype.forEach.call(form.children, function (n) { if (n !== box) n.hidden = true; });
    box.hidden = false;
    busy(false);
    pw1.focus({ preventScroll: true });
    function bad(msg) { pwWhy.textContent = msg; pwWhy.hidden = false; pwWhy.setAttribute('role', 'alert'); }
    function save() {
      pwWhy.hidden = true;
      if (pw1.value.length < 8) return bad(t('Use at least 8 characters.'));
      if (pw1.value !== pw2.value) return bad(t('The two passwords are not the same.'));
      pwGo.disabled = true;
      MM.auth.changePassword(pw1.value).then(function (r) {
        pwGo.disabled = false;
        if (!r.ok) return bad(t(r.why));
        then();
      });
    }
    pwGo.addEventListener('click', save);
    pw2.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); save(); } });
    document.getElementById('pwskip').addEventListener('click', then);
  }
  if (CHANGE) askNewPassword(function () { location.replace(nextPage()); });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!box.hidden) return;
    why.hidden = true;

    /* On the demo accounts the answer is instant, and a refusal must stay
       instant: animating a rejection makes a wrong password feel like a slow
       network. On the store the answer takes a moment, so the button turns
       while it is asked, and a refusal puts it straight back. */
    var r = MM.auth.signIn({ who: who.value, code: code.value });
    if (r && typeof r.then === 'function') {
      var asked = Date.now();
      busy(true);
      r.then(function (x) {
        if (!x.ok) { busy(false); fail(t(x.why)); code.select(); return; }
        if (x.session.mustChange) return askNewPassword(function () { box.hidden = true; accepted(700); });
        accepted(Date.now() - asked);
      });
      return;
    }
    if (!r.ok) { fail(t(r.why)); code.select(); return; }
    accepted(0);
  });

  /* waited: how long the answer already took, so the "verifying" floor is not paid twice */
  function accepted(waited) {
    var next = nextPage();
    /* the crossing's second line names where it lands */
    var line = document.querySelector('.xf-select');
    if (line && /^start.html/.test(next)) line.textContent = t('Choose where to go');
    /* Reduced motion still gets the hand-over, just none of the
       theatre: a plain 250ms cross-fade, no lines and no message.
       MM.xfade.cross reads the preference itself. */
    if (reduced) { MM.xfade.cross(function () { location.replace(next); }, next); return; }

    /* Accepted. About 1.2 seconds, in four beats:

         0.0-0.1  the press (CSS :active — 2%, not a bounce)
         0.1-0.8  VERIFYING: the label goes, the spinner turns, one
                  orange sweep crosses the button, the path lights once
                  toward the figure
         0.8-1.0  CONFIRMED: the tick draws and holds
         1.0-1.2  the form steps back and the veil rises; the page is
                  handed over while the screen is fully black

       Every step is a TIMER, so a throttled or unsupported animation
       cannot strand anybody: the timers run and the page changes.

       The 700ms of "verifying" is a floor, not a fake wait. Today the
       check is instant; when the real back end is stood up this is where
       its answer lands, and the floor keeps the spinner from flickering
       on a fast connection. */
    busy(true);

    setTimeout(function () {
      go.classList.remove('is-loading');
      go.classList.add('is-done');               /* the tick */

      setTimeout(function () {
        form.classList.add('is-dimmed');
        /* The tick has landed. From here the crossing takes over from
           the old black veil: the page goes under a 90% scrim, four
           architectural lines are drawn, ACCESS GRANTED settles, and
           only then is the document handed over — with the overlay
           fully formed and completely still, which is what index.html
           repaints in its own first frame. */
        MM.xfade.cross(function () { location.replace(next); }, next);
      }, 150);
    }, Math.max(0, 700 - waited));
  }

  if (!CHANGE) who.focus({ preventScroll: true });
}());
