/* ------------------------------------------------------------------
   Main Marks — shared helpers. Everything every page needs and nothing
   that belongs to one page.

   The important one is sellableProject(). Both the project list and the
   project page call it, so "may this be opened?" has ONE answer and TWO
   enforcements: the card is not built, and the page refuses on arrival.
   ------------------------------------------------------------------ */

(function (root) {
  'use strict';

  var MM = root.MM || (root.MM = {});

  /* ---- tiny DOM helper, the same one every app in this estate uses --- */
  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text !== undefined && text !== null) n.textContent = text;
    return n;
  }

  /* ---- translation seam ---------------------------------------------
     Build 92: English or Arabic, by js/i18n.js (loaded before this file).
     Without it, the English as written. */
  function t(s, vars) {
    if (MM.i18n) return MM.i18n.t(s, vars);
    return vars ? String(s).replace(/\{(\w+)\}/g, function (m, k) { return vars[k] == null ? m : vars[k]; }) : s;
  }

  /* ---- the sellable rule --------------------------------------------
     Fail closed. No id, an unknown id, the wrong case, or a project that
     has not been released: nothing comes back, and the caller shows the
     refusal. Never a half-built page. */
  function project(id) {
    if (!id || typeof id !== 'string') return null;
    var list = (typeof CONFIG !== 'undefined' && CONFIG.projects) || [];
    for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i];
    return null;
  }
  function sellableProject(id) {
    var p = project(id);
    return p && p.ready === true ? p : null;
  }

  /* ---- palette ------------------------------------------------------
     The stylesheet holds no colour of its own: every value is a token
     written here from config, so a rebrand is one file. */
  function applyBrand() {
    var b = (typeof CONFIG !== 'undefined' && CONFIG.brand) || {};
    var ty = (typeof CONFIG !== 'undefined' && CONFIG.type) || {};
    var r = document.documentElement.style;
    r.setProperty('--ink', b.ink || '#000');
    r.setProperty('--deep', b.deep || '#001516');
    r.setProperty('--graphite', b.graphite || '#141414');
    r.setProperty('--white', b.white || '#fff');
    r.setProperty('--muted', b.muted || '#8B8989');
    r.setProperty('--muted-2', b.muted2 || '#807E7E');
    r.setProperty('--orange', b.orange || '#F7951E');
    if (ty.corporate) r.setProperty('--font-corporate', ty.corporate);
    if (ty.project) r.setProperty('--font-project', ty.project);
    if (ty.utility) r.setProperty('--font-utility', ty.utility);
    stamp();
  }

  /* A project's own colours, applied only inside its pages. The corporate
     screens never see them — the move from Main Marks to a project is
     meant to be visible. */
  function applyProject(p) {
    if (!p || !p.colour) return;
    var r = document.documentElement.style;
    r.setProperty('--p-black', p.colour.black || '#000201');
    r.setProperty('--p-connect', p.colour.connect || '#ED1C24');
    r.setProperty('--p-engage', p.colour.engage || '#F2E800');
    r.setProperty('--p-work', p.colour.work || '#3B54A3');
  }

  /* The build number, printed in the footer. It is the fastest way to
     answer "is the phone running the new code?" without a console. */
  function stamp() {
    var n = document.getElementById('buildstamp');
    if (n && typeof CONFIG !== 'undefined') n.textContent = t('build {n}', { n: CONFIG.build });
  }

  /* The logo assets Main Marks has supplied are black-background JPEGs cut
     from the brochure, not transparent vectors (see BRANDING.md). They sit
     correctly on the app's black surfaces and must not be placed on a
     light one, so the helper that draws them says so in one place. */
  function logo(src, alt, cls) {
    var img = new Image();
    img.src = src;
    img.alt = alt;
    img.className = 'logo-jpg' + (cls ? ' ' + cls : '');
    return img;
  }


  /* ---- moving between pages ------------------------------------------
     These are real, separate pages — that is what makes Back work and a
     link shareable. So the app fades the page out before it navigates
     and fades the next one in on arrival, which is what stops the app
     reading as a set of separate web pages.

     BOTH HALVES OR NEITHER. Arriving is pure CSS (styles.css animates
     the document on load, with fill-mode both), so a page always fades
     IN even if this file never runs. Leaving is the half that needs
     JavaScript, and it is capped by a timer: a transition that does not
     finish must never strand somebody on the page they are leaving.

     NOT USED HERE YET: the browser's own cross-document View
     Transitions. Chrome and Safari have them, Firefox does not, and
     running both at once double-animates. One behaviour, tested
     everywhere, beats two that fight. It is the upgrade, not the base. */

  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* The veil. A black panel that rises from the bottom, and the page is
     handed over while the screen is FULLY BLACK — which is the whole
     trick. Two documents cannot be composited together, so a cross-fade
     always shows a seam; but both of these pages are black, so a black
     screen at the moment of the swap is invisible. The next page then
     rises out of the same darkness.

     The navigation is driven by a TIMER, never by a transition event.
     If the animation is throttled, skipped or unsupported, the page
     still changes — nobody is ever stranded waiting for a curtain. */
  function veil(then, ms) {
    ms = ms || 190;
    var v = document.createElement('div');
    v.className = 'veil';
    v.setAttribute('aria-hidden', 'true');
    document.body.appendChild(v);
    /* A forced reflow registers the start state, so the rise animates.
       requestAnimationFrame would not: it does not run in a background
       tab, and the veil would then jump rather than rise. */
    void v.offsetWidth;
    v.classList.add('is-up');
    setTimeout(then, ms);
  }

  /* href, { replace, wait } */
  function leave(href, o) {
    o = o || {};
    var wait = o.wait === undefined ? 190 : o.wait;
    var go = function () {
      if (go.done) return;
      go.done = true;
      if (o.replace) location.replace(href); else location.assign(href);
    };
    if (reduced || !wait) { go(); return; }
    veil(go, wait);
  }

  /* Every internal link goes through it, so no page has to remember to.
     Anything that is not a plain left-click on a same-origin page is left
     completely alone: new tabs, downloads, anchors and external links all
     behave exactly as the browser intends. */
  function wireLinks() {
    document.addEventListener('click', function (e) {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      var a = e.target && e.target.closest ? e.target.closest('a[href]') : null;
      if (!a || a.target === '_blank' || a.hasAttribute('download')) return;
      var url;
      try { url = new URL(a.getAttribute('href'), location.href); } catch (err) { return; }
      if (url.origin !== location.origin) return;
      /* a link to a spot on this same page is not a navigation */
      if (url.pathname === location.pathname && url.search === location.search && url.hash) return;
      e.preventDefault();
      leave(url.href);
    });
  }

  /* ---- ACCESS GRANTED: the crossing ----------------------------------
     Two halves of one movement, written together so they cannot drift:
     `cross()` is played by the page that LEAVES, `land()` by the page
     that ARRIVES. The CSS is under "the crossing" in styles.css.

     The hand-over happens with the overlay fully formed and completely
     still, and the arriving page paints that same still picture in its
     first frame with transitions off. Two documents can never be
     composited together, so the trick is to give them nothing to
     interpolate: one static state both pages agree on.

     Both halves are driven by TIMERS. If a transition is throttled,
     unsupported or skipped, the timers still run and the page still
     changes — nobody is left looking at a black screen. */

  /* THESE THREE NUMBERS ARE THE PACE OF THE WHOLE THING.

     The last thing to finish forming is line 4, at 670ms (a .27s delay
     plus a .4s travel). XF_IN must be COMFORTABLY PAST THAT, for two
     separate reasons:

       1. the hand-over has to land on a still frame. At 640ms it did
          not: line 4 and the centre rule were still moving, and the
          arriving page painted them finished, so they snapped. That is
          the one seam this design exists to avoid;
       2. the message has to be readable. Measured at 640ms, ACCESS
          GRANTED and "Select a project" were fully formed and still
          for 382ms — below a comfortable read, and worse than that
          sounds, because the eye is on the button when it is tapped
          and has to travel to the middle of the screen first.

     1000ms leaves 330ms of completely still time before the hand-over.
     Measured end to end, the message is fully legible for about 830ms,
     up from 382ms. If it ever needs to feel quicker, these
     are the numbers to move — nothing else. */
  var XF_IN = 1000;     /* the overlay forms and HOLDS, then we hand over */
  var XF_HOLD = 100;    /* still on the arriving page before it lifts     */
  var XF_OUT = 420;     /* the black lifts off the project page           */

  function xfadeEl() { return document.getElementById('xfade'); }

  /* The leaving half. `then` is called when it is time to navigate;
     `href` is where it is going, which decides whether the other half
     is armed at all.

     Only index.html carries the arriving half. `?next=` can point at
     any page in the app, and a flag left set for a page that cannot
     use it would sit in sessionStorage waiting to black out whatever
     was opened next. So the flag is set only when the crossing has
     somewhere to land. */
  function cross(then, href) {
    var n = xfadeEl();
    var go = function () { if (!go.done) { go.done = true; then(); } };
    if (!n) { setTimeout(go, 0); return; }        /* no overlay: just go */

    n.classList.add('is-on');
    if (reduced) n.classList.add('is-plain');
    /* A forced reflow registers the start state, so the overlay fades
       in rather than appearing. requestAnimationFrame would not: it
       does not run in a background tab, and the overlay would jump. */
    void n.offsetWidth;
    n.classList.add('is-in');

    if (/^index\.html(\?|#|$)/.test(href || '')) {
      try { sessionStorage.setItem('mm.enter', String(Date.now())); } catch (e) {}
    }
    setTimeout(go, reduced ? 250 : XF_IN);
  }

  /* The arriving half. The overlay is ALREADY on screen and already
     settled — the inline script at the top of the body put it there
     before anything painted, which is the whole reason the seam is
     invisible. This only has to let go of it. */
  function land() {
    var root = document.documentElement;
    var n = xfadeEl();
    var done = function () {
      if (n) n.className = 'xfade';
      root.classList.remove('is-entering');
    };
    if (!n) { done(); return; }

    if (reduced) n.classList.add('is-plain');
    /* `no-anim` held the first frame still. Dropping it, with a forced
       reflow either side, is what arms the transitions — without the
       reflow the browser may collapse both changes into one style
       recalculation and the lines would jump rather than travel. */
    void n.offsetWidth;
    n.classList.remove('no-anim');
    void n.offsetWidth;

    setTimeout(function () {
      n.classList.add('is-out');
      setTimeout(done, reduced ? 260 : XF_OUT);
    }, XF_HOLD);
  }

  /* True when this page was opened through the transition. Set by the
     inline script in the head, before anything painted. */
  function entering() {
    return document.documentElement.classList.contains('is-entering');
  }

  MM.xfade = { cross: cross, land: land, entering: entering };

  /* The h:rs entry transition lives in js/markbuild.js — it is a
     whole choreography rather than a helper, and it is the one piece
     of this app built to a written client specification. */


  /* ---- who is signed in: initials in a circle, the rest behind a tap ----
     The header is a floating card (build 65, Muhanad's reference image):
     the mark on the left, a round badge with the salesperson's initials on
     the right. The name, the role and Sign out open under the badge.
       box      the header's #who element
       session  { name, role }
       o        { role: label to show, onOut: what Sign out does } */
  function whoMenu(box, session, o) {
    o = o || {};
    var name = String((session && session.name) || '').trim();
    var ini = name.split(/\s+/).filter(Boolean).map(function (w) { return w.charAt(0); })
      .join('').slice(0, 2).toUpperCase() || '·';
    var btn = el('button', 'who-av', ini);
    btn.type = 'button';
    btn.setAttribute('aria-label', t('Signed in as ') + name + t('. Open the account menu'));
    btn.setAttribute('aria-expanded', 'false');
    btn.setAttribute('aria-haspopup', 'true');
    var menu = el('div', 'who-menu');
    menu.hidden = true;
    menu.appendChild(el('p', 'who-n', name));
    if (o.role) menu.appendChild(el('p', 'who-r', o.role));
    /* build 115: a sales manager's way from the sales app to his team (manager.html) */
    if (session && session.role === 'sales_manager' && CONFIG.salesTeam && !session.real && !o.noMode && box.parentNode && !box.parentNode.querySelector('.mode-switch')) {
      var team = el('a', 'mode-switch');
      team.href = 'manager.html';
      team.setAttribute('aria-label', t('Team Pulse'));
      team.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 12h4l2.5-7 4 14 2.5-7h5"/></svg>';
      team.appendChild(el('span', null, t('Team Pulse')));
      box.parentNode.insertBefore(team, box);
      box.parentNode.classList.add('has-mode');
    }
    /* build 122: on the store, a person can choose a new password whenever he likes */
    if (session && session.real) {
      var pw = el('a', 'who-out who-pw', t('Change password'));
      pw.href = 'login.html?change=1';
      menu.appendChild(pw);
    }
    var out = el('button', 'who-out', t('Sign out'));
    out.type = 'button';
    out.addEventListener('click', function () { if (o.onOut) o.onOut(); });
    menu.appendChild(out);
    function show(on) {
      menu.hidden = !on;
      btn.setAttribute('aria-expanded', on ? 'true' : 'false');
    }
    btn.addEventListener('click', function (e) { e.stopPropagation(); show(menu.hidden); });
    document.addEventListener('click', function (e) { if (!menu.hidden && !box.contains(e.target)) show(false); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !menu.hidden) { show(false); btn.focus(); }
    });
    box.appendChild(btn);
    box.appendChild(menu);
  }

  /* ---- a sales agent's bar (build 121; on every page since build 127) ---
     The same floating bar as on "My activity" (my.html), so the pages read
     as one app: Quick Offer (the sales app), My activity, Profile, and the
     round plus that records an orientation, a workshop, a meeting, a
     reservation or a contract. Only for a sales agent who has a My activity
     (MM.auth.member): a manager has Team Pulse, and a copy published
     without the team has no My activity to go to.

     Build 121 drew it on the projects page only. Muhanad, 2026-10-07: it is
     on EVERY page, because inside a project a sales agent had to go back to
     the first page to reach My activity or the plus. Written once here and
     called by each page, so the pages cannot drift apart. */
  function salesBar() {
    if (!MM.auth || MM.auth.member() === -1 || document.querySelector('.sp-bar')) return;
    var icon = function (d) { return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + d + '</svg>'; };
    var bar = el('nav', 'sp-bar');
    bar.setAttribute('aria-label', t('Sections'));
    [['index.html', '<path d="M21 3L10 14M21 3l-6.5 18-4.5-7-7-4.5z"/>', t('Quick Offer'), true],
      ['my.html', '<path d="M3 12h4l2.5-7 4 14 2.5-7h5"/>', t('My activity')],
      ['my.html#profile', '<circle cx="12" cy="8.5" r="3.6"/><path d="M4.5 20c0-4 3.4-6.5 7.5-6.5s7.5 2.5 7.5 6.5"/>', t('Profile')]].forEach(function (x) {
      var a = el('a');
      a.href = x[0];
      if (x[3]) a.setAttribute('aria-current', 'page');
      a.innerHTML = icon(x[1]);
      a.appendChild(el('span', null, x[2]));
      /* build 132: the heartbeat draws itself again under the thumb, and My activity opens on the pulse */
      if (x[0] === 'my.html') a.addEventListener('click', function () { a.classList.remove('beat'); void a.offsetWidth; a.classList.add('beat'); });
      bar.appendChild(a);
    });
    var plus = el('a', 'sp-fab');
    plus.href = 'my.html#record';
    plus.setAttribute('aria-label', t('Record an orientation, a workshop, a meeting, a reservation or a contract'));
    plus.innerHTML = icon('<path d="M12 5v14M5 12h14"/>');
    document.body.appendChild(bar);
    document.body.appendChild(plus);
    document.body.classList.add('has-sp-bar');
    /* build 132: My activity is one tap from every page, and it opens on the pulse. With its files
       already on the phone the pulse starts at once; on a slow line it would otherwise be seconds of
       the page before. warmNext is declared below and waits for this page to be idle. */
    warmNext('my.html', []);
  }

  /* ---- the next page, in hand before the tap (build 130) ---------------
     Every page of this app is its own document, so a tap is a trip to the host for the page, its
     scripts and its pictures. On a slow line that is seconds of black before anything moves: measured
     on 2026-10-07 at about two seconds a request. The host lets a phone keep each file for ten
     minutes. So the page the person is LOOKING at asks, quietly and one file at a time, for what the
     next tap will need, and the tap then finds it all on the phone.

       href      the page the tap will open, exactly as the link writes it
       pictures  what that page shows first

     Only this app's own files, only once this page has finished loading and the browser is idle,
     never on a phone set to save data. A failure is nothing: the next page asks for itself, as before.
     It asks for the SAME addresses the page will (the ?v= stamps included), so nothing stale can be
     kept: a new build has new addresses. */
  var warmed = {};
  function warmNext(href, pictures) {
    if (typeof document === 'undefined' || !root.fetch || !href || warmed[href]) return;
    var c = root.navigator && root.navigator.connection;
    if (c && c.saveData) return;
    warmed[href] = true;
    var start = function () {
      var queue = [], seen = {};
      /* what this page itself loaded is on the phone already: asking again would only cost frames */
      Array.prototype.forEach.call(document.querySelectorAll('script[src], link[rel="stylesheet"][href]'), function (n) {
        seen[n.getAttribute('src') || n.getAttribute('href')] = true;
      });
      var one = function () {
        var u = queue.shift();
        if (!u) return;
        var next = function () { setTimeout(one, 40); };
        if (/\.(png|jpe?g|webp|svg|gif)(\?|$)/i.test(u)) {
          var im = new Image();
          im.onload = im.onerror = next;
          im.src = u;
        } else {
          root.fetch(u, { credentials: 'same-origin' }).then(function (r) { return r.text(); }).then(next, next);
        }
      };
      root.fetch(href, { credentials: 'same-origin' }).then(function (r) { return r.ok ? r.text() : ''; }).then(function (html) {
        (html.match(/(?:src|href)="(?:js|css|vendor)\/[^"]+"/g) || []).forEach(function (m) {
          var u = m.replace(/^(?:src|href)="/, '').replace(/"$/, '');
          if (!seen[u]) { seen[u] = true; queue.push(u); }
        });
        (pictures || []).forEach(function (u) {
          if (u && /^img\/[A-Za-z0-9._\/-]+$/.test(u) && !seen[u]) { seen[u] = true; queue.push(u); }
        });
        one();
      }).catch(function () { /* the next page asks for itself */ });
    };
    var idle = function () {
      if (root.requestIdleCallback) root.requestIdleCallback(start, { timeout: 3000 });
      else setTimeout(start, 1200);
    };
    var go = function () { if (document.readyState === 'complete') idle(); else root.addEventListener('load', idle); };
    /* never under the entry animation: measured, each file asked for then cost it a frame. It waits
       for the black to go (MM.markbuild.after runs it at once on a page that has no black). */
    if (MM.markbuild && MM.markbuild.after) MM.markbuild.after(go); else go();
  }

  MM.el = el;
  MM.t = t;
  MM.whoMenu = whoMenu;
  MM.salesBar = salesBar;
  MM.warmNext = warmNext;
  MM.project = project;
  MM.sellableProject = sellableProject;
  MM.applyBrand = applyBrand;
  MM.applyProject = applyProject;
  MM.logo = logo;
  MM.stamp = stamp;
  MM.leave = leave;
  MM.veil = veil;

  /* wired once, for every page that loads this file */
  if (typeof document !== 'undefined') wireLinks();

  if (typeof module === 'object' && module.exports) module.exports = MM;
}(typeof window !== 'undefined' ? window : globalThis));
