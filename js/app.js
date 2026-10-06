/* ------------------------------------------------------------------
   Main Marks — step 1, the project list.

   Its whole job: show what this person may sell, and let them into it.

   It is built in the SAME language as the sign-in page — the staged
   rise, the square outlined control with the arrow, the orange full
   stop, the four marks — so signing in and choosing a project read as
   one surface rather than two web pages. The shared pieces live in
   styles.css under one heading each; nothing here restates them.

   A project that is not released is rendered as a plain div with NO
   click handler at all — not a disabled button, not a handler that
   returns early. If the styling is ever wrong there is still no route
   into a project that has no inventory behind it. Fail closed.
   ------------------------------------------------------------------ */

(function () {
  'use strict';

  var MM = window.MM, el = MM.el, t = MM.t;
  MM.applyBrand();

  var session = MM.auth.require();
  if (!session) return;            /* the guard has already redirected */

  /* The entrance — and there are two of them, because there are two
     ways to arrive here.

     THROUGH THE SIGN-IN, the page is not entering at all: it is being
     UNCOVERED. The overlay is already on screen, carried over from
     login.html, and the last movement lifts it to reveal a page that
     is simply there. Playing the staged rise underneath would be a
     second movement fighting the first, which the motion spec rules
     out — so it is skipped.

     ANY OTHER WAY IN — a bookmark, Back, a reload — gets the staged
     rise, exactly as the sign-in page does it. Every animation it
     starts carries fill-mode `both`, so nothing can be stranded
     invisible if a frame is missed or the tab is in the background,
     and if this script never runs the page is simply there. */
  if (MM.xfade.entering()) MM.xfade.land();
  else document.body.classList.add('seq');

  /* ---- who is signed in, and the way out ---------------------------- */
  var whoBox = document.getElementById('who');
  if (whoBox) {
    MM.whoMenu(whoBox, session, {
      role: t((CONFIG.roles[session.role] || {}).label || session.role),
      onOut: function () { MM.auth.signOut(); MM.leave('login.html', { replace: true }); }
    });
  }

  /* ---- a salesperson's bar (build 121) ------------------------------
     The same floating bar as on "My activity" (my.html), so the two pages
     read as one app: Quick Offer (here), My activity, Profile, and the
     round plus that records an orientation, a workshop, a meeting, a
     reservation or a contract. Only for a salesperson who is on the team
     (MM.auth.member): a manager has Team Pulse, and a copy published
     without the team has no My activity to go to. It is on this page
     only: inside a project the picture keeps the whole screen. */
  if (MM.auth.member() !== -1) {
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
      bar.appendChild(a);
    });
    var plus = el('a', 'sp-fab');
    plus.href = 'my.html#record';
    plus.setAttribute('aria-label', t('Record an orientation, a workshop, a meeting, a reservation or a contract'));
    plus.innerHTML = icon('<path d="M12 5v14M5 12h14"/>');
    document.body.appendChild(bar);
    document.body.appendChild(plus);
    document.body.classList.add('has-sp-bar');
  }

  var live = document.getElementById('live');
  var soon = document.getElementById('soon');
  var soonHead = document.getElementById('soonhead');

  /* The staged rise. The header and the headline own 1-4; everything
     below is dealt out in the order it is read. Counted here rather
     than written into the markup, because how many projects there are
     is the config's business, not the page's. */
  var step = 4;
  function stage(node) {
    step += 1;
    node.setAttribute('data-in', String(Math.min(step, 8)));
    return node;
  }

  var projects = MM.auth.visibleProjects();
  var openList = [], soonList = [];

  projects.forEach(function (p) {
    if (MM.auth.maySell(p.id)) openList.push(p); else soonList.push(p);
  });

  /* In Mark order — "1st Mark of Distinction" before "2nd". A project
     whose mark has no number goes last rather than being guessed at. */
  function markNo(p) { var n = parseInt(p.mark, 10); return isNaN(n) ? 1e9 : n; }
  soonList.sort(function (a, b) { return markNo(a) - markNo(b); });

  openList.forEach(function (p) { live.appendChild(stage(featureCard(p))); });

  if (soonHead) {
    soonHead.hidden = !soonList.length;
    if (soonList.length) stage(soonHead);
    var c = soonHead.querySelector('.count');
    if (c) c.textContent = String(soonList.length);
  }
  soonList.forEach(function (p) { soon.appendChild(stage(soonCard(p))); });

  /* Two different reasons for an empty list, and each gets its own
     words: nothing released at all (today — Moray is still being
     prepared), or released but not on this account. */
  if (!openList.length) {
    var anyReleased = (CONFIG.projects || []).some(function (p) { return p.ready === true; });
    var none = el('div', 'blocked');
    none.appendChild(el('p', 'eyebrow', t('Nothing to sell yet')));
    if (anyReleased) {
      none.appendChild(el('h2', null, t('No project has been opened for you.')));
      none.appendChild(el('p', null, t('Ask your sales manager to add a project to your account.')));
    } else {
      none.appendChild(el('h2', null, t('No project is released yet.')));
      none.appendChild(el('p', null, t('Projects open here as soon as they are released.')));
    }
    live.appendChild(stage(none));
  }

  /* ---- the pieces every card is made of ------------------------------
     Written once and shared, because the live card and a held-back one
     are the SAME card with different dressing. Anything that differs
     between them is a class, not a second copy of the markup. */

  /* The render, cropped into its box, with a pill badge over it. */
  function shot(p, badge, badgeCls) {
    var box = el('div', 'c-shot');
    if (p.render) {
      var img = new Image();
      img.src = p.render;
      img.alt = '';                      /* decorative: the band names it */
      img.setAttribute('aria-hidden', 'true');
      img.loading = 'lazy';
      box.appendChild(img);
    }
    if (badge) box.appendChild(el('span', 'c-kind' + (badgeCls ? ' ' + badgeCls : ''), badge));
    return box;
  }

  /* The band: the PROJECT's own colour, carrying its mark. Where a
     project has no mark yet, its name is set instead — never both, and
     never neither. Where it has no colours of its own either, it falls
     back to the corporate surface rather than borrowing another
     project's. */
  function band(p, markHeight) {
    var b = el('div', 'c-band');
    b.style.background = (p.colour && p.colour.black) || 'var(--graphite)';
    if (p.logo) {
      var mark = MM.logo(p.logo, p.name, 'c-band-mark');
      mark.style.height = markHeight + 'px';
      b.appendChild(mark);
    } else {
      b.appendChild(el('span', 'c-band-name', p.full || p.name));
    }
    if (p.promise) b.appendChild(el('span', 'c-tagline', t(p.promise)));
    else if (p.mark) b.appendChild(el('span', 'c-tagline', t(p.mark)));
    return b;
  }

  /* The three pillars, as brochure p.18 sets them: a coloured mark and
     its word, three times. These colours CODE CONTENT in the h:rs
     system — red community, yellow commercial, blue administrative —
     so they are only ever used this way, attached to the thing they
     name. Never as a panel, never behind copy.

     Driven off the `pillars` list in config, so a project without them
     simply does not get the strip. Moray has none. */
  function pillarStrip(p) {
    var row = el('div', 'c-pillars');
    /* The same black as the band above it, from the project's own
       palette. The strip used to sit on a faint white wash, which read
       as a grey panel cutting the card in two. */
    row.style.background = (p.colour && p.colour.black) || 'var(--graphite)';
    (p.pillars || []).forEach(function (pl) {
      var item = el('span', 'c-pillar');
      var sq = el('span', 'c-pillar-mark');
      sq.style.background = (p.colour && p.colour[pl.id]) || 'var(--white)';
      item.appendChild(sq);
      item.appendChild(el('span', null, t(pl.name)));
      row.appendChild(item);
    });
    return row;
  }

  function placeLine(p) {
    var line = el('div', 'c-place');
    var dot = el('span', 'c-dot');
    /* The corporate accent, NOT one of the project's own colours.
       Red, yellow and blue CODE CONTENT in the h:rs system — community,
       commercial, administrative — and spending one of them on a
       decorative dot is exactly the misuse the brand analysis warns
       about. */
    dot.style.background = 'var(--orange)';
    line.appendChild(dot);
    line.appendChild(el('span', null, t(p.place || '')));
    return line;
  }

  /* Straight out of `facts` in config, which is quoted from the
     brochure page named beside it. This card cannot print a figure
     that was not supplied. */
  function factList(p) {
    var dl = el('dl', 'c-facts');
    (p.facts || []).forEach(function (f) {
      var wrap = el('div');
      wrap.appendChild(el('dt', null, t(f.k)));
      /* the short form where there is one: the card drops the feddan
         conversion and the percentage, the project page keeps them */
      wrap.appendChild(el('dd', null, t(f.s || f.v)));
      dl.appendChild(wrap);
    });
    return dl;
  }

  /* ---- the live project: one wide card -------------------------------
     A real <a>, so Back, middle-click and "copy link" all work and
     brand.js's one navigation handler picks it up like any other link. */
  function featureCard(p) {
    var a = el('a', 'mm-card feature');
    a.href = 'project.html?p=' + encodeURIComponent(p.id);
    a.setAttribute('aria-label', t('Open {name}', { name: p.full || p.name }));

    a.appendChild(shot(p, t(p.kind)));

    var side = el('div', 'c-side');
    side.appendChild(band(p, 30));
    if (p.pillars && p.pillars.length) side.appendChild(pillarStrip(p));

    var meta = el('div', 'c-meta');
    if (p.place) meta.appendChild(placeLine(p));
    if (p.blurb) meta.appendChild(el('p', 'c-blurb', t(p.blurb)));
    if (p.facts && p.facts.length) meta.appendChild(factList(p));

    var go = el('div', 'c-go');
    go.appendChild(el('span', null, t('Open {name}', { name: p.short || p.name })));
    go.appendChild(arrow());
    meta.appendChild(go);

    side.appendChild(meta);
    a.appendChild(side);

    /* THE MARK BUILDS ITSELF on the way in, where the project has one.
       See brand.js under the same heading.

       It stays an ordinary <a> and the href stays real. The handler
       runs on the card, which is BEFORE the one navigation handler in
       brand.js on the document, and preventDefault is called only once
       the build has actually started — brand.js checks defaultPrevented
       and leaves anything already claimed alone. So if the mark is
       missing, or the overlay is not in the page, or the browser will
       not play it, the click simply falls through and the card behaves
       like every other link in the app.

       The file is fetched now rather than on the tap: it is the first
       thing the transition paints, and a mark that arrives late is a
       black screen with nothing in it. */
    if (p.markBuild && p.markBuild.src && MM.markbuild) {
      (new Image()).src = p.markBuild.src;
      Object.keys(p.markBuild.pillars || {}).forEach(function (k) {
        (new Image()).src = p.markBuild.pillars[k];
      });
      a.addEventListener('click', function (e) {
        if (e.defaultPrevented || e.button !== 0) return;
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        var href = a.href;
        if (!MM.markbuild.cross(function () { location.assign(href); }, p.markBuild, a)) return;
        e.preventDefault();
      });
    }

    return a;
  }

  /* ---- a project that cannot be opened -------------------------------
     A div. No href, no handler, nothing to click — the same rule as
     before, and the picture does not change it. Everything here is
     dressing: the render is drained, the band is dimmed, the badge says
     Coming soon and the foot says so again in words. */
  function soonCard(p) {
    var d = el('div', 'mm-card soon');
    d.setAttribute('aria-disabled', 'true');

    /* Why it cannot be opened, in the words that are true for it: not
       released at all, or released but not on this account. */
    var pr = MM.project(p.id);
    var held = !(pr && pr.ready === true);

    d.appendChild(shot(p, t(held ? 'Coming soon' : 'Not your account'), 'c-badge-soon'));
    d.appendChild(band(p, 22));

    var meta = el('div', 'c-meta');
    if (p.place) meta.appendChild(placeLine(p));
    if (p.blurb) meta.appendChild(el('p', 'c-blurb', t(p.blurb)));
    meta.appendChild(el('div', 'c-go c-go-soon', t(
      held ? 'Not released yet' : 'Not open for your account'
    )));
    d.appendChild(meta);
    return d;
  }

  /* The sign-in button's arrow, so every "way forward" in the app is
     drawn the same. */
  function arrow() {
    var s = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    s.setAttribute('viewBox', '0 0 24 24');
    s.setAttribute('width', '18');
    s.setAttribute('height', '18');
    s.setAttribute('aria-hidden', 'true');
    var p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    p.setAttribute('d', 'M4 12h15M13 6l6 6-6 6');
    p.setAttribute('fill', 'none');
    p.setAttribute('stroke', 'currentColor');
    p.setAttribute('stroke-width', '1.6');
    p.setAttribute('stroke-linecap', 'round');
    p.setAttribute('stroke-linejoin', 'round');
    s.appendChild(p);
    return s;
  }
}());
