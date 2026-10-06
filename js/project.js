/* ------------------------------------------------------------------
   Main Marks — step 2, the project page: project.html?p=<id>

   The chosen project travels in the URL, so Back works and a link can be
   bookmarked. The id is checked AGAIN here, with the same rule the list
   used, because a URL can be typed. A missing, unknown, mis-cased or
   unreleased id shows the refusal, never a half-built page.

   What is on the page today is everything Main Marks' own brochure
   supports: the project, its land use, its three pillars, its three unit
   kinds, its masterplan and the floor plans that have been exported.
   Selecting a building, a unit, a payment plan and producing the offer
   are the next steps and each one is blocked on material the client has
   still to send — the page says which, rather than pretending.
   ------------------------------------------------------------------ */

(function () {
  'use strict';

  var MM = window.MM, el = MM.el, t = MM.t;
  MM.applyBrand();

  var page = document.getElementById('page');
  var id = new URLSearchParams(location.search).get('p');

  /* If we came in through the mark build, the overlay is already on
     screen — put there by the inline script at the top of the page,
     before anything painted. Let go of it, and finish the lockup if
     this is a project that has one.

     IT IS CALLED HERE, BEFORE THE GUARDS. Everything below this can
     return early — no session, a project that is not sellable, a bad
     id — and every one of those paths must still lift the black.
     Passing a project that is only LOOKED UP rather than cleared to
     sell is safe: the lockup shows a logo, it is not a way in. */
  /* Arriving on a product line that has its own build (Moray Wellness)
     plays THAT line's logo, not the project's; a line with none just
     lifts the black. Looked up by the same released-only rule as below. */
  if (MM.markbuild) {
    var ep = MM.sellableProject(id), eln = null;
    var eid = new URLSearchParams(location.search).get('line');
    if (ep && eid !== null) (ep.lines || []).forEach(function (l) { if (l.released === true && l.id === eid) eln = l; });
    MM.markbuild.run(eln || ep);
  }

  /* The guard first: this page is not public. */
  var session = MM.auth.require('project.html' + location.search);
  if (!session) return;

  /* Then the project, by the shared rule. */
  var p = MM.sellableProject(id);
  if (!p || !MM.auth.maySell(id)) {
    refuse(t(p ? 'This project is not open for your account.' : 'This project is not open yet.'));
    return;
  }

  /* ---- which product line, where the project is sold as several ------
     project.html?p=moray            the chooser: one card per line
     project.html?p=moray&line=x     that line, in its own identity
     The line is checked by the same fail-closed rule as the project: an
     unknown, mis-cased or unreleased id is refused, never guessed at. */
  var lines = (p.lines || []).filter(function (l) { return l.released === true; });
  var lineId = new URLSearchParams(location.search).get('line');
  var ln = null;
  if (lineId !== null) {
    for (var li = 0; li < lines.length; li++) if (lines[li].id === lineId) ln = lines[li];
    if (!ln) {
      refuse(t('This part of {name} is not open.', { name: p.name }), 'project.html?p=' + encodeURIComponent(p.id), t('Back to {name}', { name: p.name }));
      return;
    }
  }

  MM.applyProject(p);
  document.title = (ln ? ln.name + ' · ' : '') + p.name + ' — Main Marks';
  try { sessionStorage.setItem('mm.project', p.id); } catch (e) { /* private mode */ }

  /* Inside a line, Back goes to the chooser, not all the way out. */
  if (ln) {
    var bk = document.querySelector('.crumbs .back');
    if (bk) {
      bk.href = 'project.html?p=' + encodeURIComponent(p.id);
      var bs = bk.querySelector('span');
      if (bs) bs.textContent = p.name;
    }
  }

  /* ---- who is signed in --------------------------------------------- */
  var whoBox = document.getElementById('who');
  if (whoBox) {
    MM.whoMenu(whoBox, session, {
      role: t((CONFIG.roles[session.role] || {}).label || session.role),
      onOut: function () { MM.auth.signOut(); MM.leave('login.html', { replace: true }); }
    });
  }

  /* ---- a project sold as several lines -------------------------------
     Two views. Without a line: the project, then one card per line and
     the project's facts — nothing else, because the chooser's only job
     is to get the salesperson to the right product in one tap. With a
     line: that line's own header, then the plans, units and what is
     still needed, as a single-line project shows them. */
  if (lines.length && !ln) {
    /* compact: the cards are the point of this page, so they must be
       on screen when it opens, not under a full-height render */
    var ph = p.aerial ? aerialHero() : projectHero();
    ph.classList.add('is-compact');
    if (p.aerial) {
      /* the aerial and the cards side by side, the aerial held in view
         while the cards scroll: pointing at a card has to light a
         picture you can SEE, and stacked, the cards were below it */
      document.body.classList.add('is-chooser');   /* phone CSS trims the crumbs here */
      var ch = el('div', 'chooser');
      ch.appendChild(ph);
      ch.appendChild(lineChooser());
      page.appendChild(ch);
      scrollLights();
    } else {
      page.appendChild(ph);
      page.appendChild(lineChooser());
    }
    if (p.facts && p.facts.length) page.appendChild(factsPanel());
    return;
  }
  /* A line laid out as the CCR app's Ayyam page: its own function, and
     nothing below it — no floor-plan tabs, no "what it needs" list. */
  if (ln && ln.layout === 'plan') { linePage(ln); return; }
  if (ln) page.appendChild(lineHero(ln));
  else page.appendChild(projectHero());

  function projectHero() {
  var hero = el('section', 'p-hero');
  if (p.render) {
    var shot = el('div', 'p-shot');
    var img = new Image();
    img.src = p.render;
    img.alt = t('{name} — project render', { name: p.name });
    shot.appendChild(img);
    hero.appendChild(shot);
  }
  var lock = el('div', 'p-lock');
  if (p.logo) lock.appendChild(MM.logo(p.logo, p.name, 'p-logo'));
  var lines = el('div', 'p-lines');
  if (p.mark) lines.appendChild(el('p', 'eyebrow', p.mark));
  if (p.promise) lines.appendChild(el('p', 'p-promise', p.promise));
  lines.appendChild(el('p', 'p-place', [p.kind && t(p.kind), p.place && t(p.place)].filter(Boolean).join(' · ')));
  lock.appendChild(lines);
  hero.appendChild(lock);
  if (p.blurb) hero.appendChild(el('p', 'p-blurb', p.blurb));
  return hero;
  }

  /* ---- the chooser's hero: the whole complex, lit by line ------------
     The aerial with the lights off, and over it one layer per line that
     has a lit version, each at opacity 0. Hovering or focusing a card
     brings its layer up (lightLine below). The layers are the SAME
     picture with only that line's buildings changed, so a cross-fade
     reads as the lights coming on and nothing else moves. The project's
     lockup sits on the picture, at its foot. */
  /* Filled inside aerialHero, NOT initialised here: the chooser returns
     from this script ABOVE this line, so an initialiser here never runs
     on the one page that uses it. */
  var litLayers;
  function aerialHero() {
    litLayers = {};
    var hero = el('section', 'p-hero is-aerial');
    var stage = el('div', 'a-stage');
    var base = new Image();
    base.src = p.aerial.img;
    base.alt = t('{name} — aerial view of the complex', { name: p.name });
    base.className = 'a-img';
    stage.appendChild(base);
    lines.forEach(function (l) {
      if (!l.lit) return;
      var im = new Image();
      im.src = l.lit;                          /* loaded now: a light that arrives late is no light */
      im.alt = '';
      im.setAttribute('aria-hidden', 'true');
      im.className = 'a-img a-lit';
      stage.appendChild(im);
      litLayers[l.id] = im;
    });
    /* names what is lit, so a light on a phone is never a puzzle */
    aTag = el('span', 'a-tag');
    aTag.setAttribute('aria-live', 'polite');
    stage.appendChild(aTag);
    var lock = el('div', 'a-lock');
    if (p.logo) lock.appendChild(MM.logo(p.logo, p.name, 'p-logo'));
    var ls = el('div', 'p-lines');
    if (p.mark) ls.appendChild(el('p', 'eyebrow', p.mark));
    if (p.promise) ls.appendChild(el('p', 'p-promise', p.promise));
    ls.appendChild(el('p', 'p-place', [p.kind && t(p.kind), p.place && t(p.place)].filter(Boolean).join(' · ')));
    lock.appendChild(ls);
    hero.appendChild(stage);
    /* under the picture, not on it: its foot is the front row of
       buildings, which have to be seen when they light */
    hero.appendChild(lock);
    return hero;
  }
  var aTag;
  function lightLine(id) {
    if (!litLayers) return;
    Object.keys(litLayers).forEach(function (k) {
      litLayers[k].classList.toggle('is-on', k === id);
    });
    /* the label shows only when something actually lit: a line with no
       lit picture yet gets no label, rather than a name over nothing */
    var on = id && litLayers[id];
    if (aTag) {
      var name = '';
      lines.forEach(function (l) { if (l.id === id) name = t(l.name); });
      if (on) aTag.textContent = name;
      aTag.classList.toggle('is-on', !!on);
    }
  }

  /* ---- on a phone, SCROLLING lights the buildings --------------------
     A phone has no hover, so pointing at a card can never light anything.
     Stacked (below 1100 px) the aerial is pinned under the header and the
     cards scroll up beneath it, one at a time; whichever card crosses the
     middle of the space below the picture is the one lit. Tapping a card
     still opens it. Side by side, hover does it and this stays out. */
  /* PHONE (up to 760 px), build 41: the cards are a SWIPE row, not a
     column — the aerial, one card and the edge of the next all fit on one
     screen, so the light and the card are seen together without scrolling
     the page. The card nearest the row's centre is the one lit, and the
     dots under the row follow it (and can be tapped to jump). */
  function scrollLights() {
    var stacked = window.matchMedia('(max-width: 1099px)');
    var swipe = window.matchMedia('(max-width: 760px)');
    var stage = document.querySelector('.a-stage');
    var row = document.querySelector('.l-cards');
    var cards = Array.prototype.slice.call(document.querySelectorAll('.l-card'));
    var dots = Array.prototype.slice.call(document.querySelectorAll('.l-dot'));
    if (!stage || !row || !cards.length) return;
    var queued = false, last;

    function inRow() {
      /* the card whose centre is nearest the centre of the swipe row */
      var rr = row.getBoundingClientRect(), mid = rr.left + rr.width / 2;
      var hit = null, best = Infinity;
      cards.forEach(function (c) {
        var r = c.getBoundingClientRect();
        var d = Math.abs(r.left + r.width / 2 - mid);
        if (d < best) { best = d; hit = c.getAttribute('data-line'); }
      });
      return hit;
    }
    function onScreen() {
      /* the card that fills MOST of the screen under the picture — not
         the one crossing the middle, which lit Wellness while the eye was
         still on the foot of The Fourth's card */
      var below = stage.getBoundingClientRect().bottom;
      var hit = null, most = 90;              /* under 90 px of a card is not "looking at it" */
      cards.forEach(function (c) {
        var r = c.getBoundingClientRect();
        var seen = Math.min(r.bottom, window.innerHeight) - Math.max(r.top, below);
        if (seen > most) { most = seen; hit = c.getAttribute('data-line'); }
      });
      return hit;
    }
    /* how far each card is from the row's centre, as --f (0 centred, 1 a
       card's width away) — the CSS dulls and shrinks by it, so the card
       comes up to its own colour as it arrives in the middle */
    function dull() {
      var on = swipe.matches;
      var rr = row.getBoundingClientRect(), mid = rr.left + rr.width / 2;
      cards.forEach(function (c) {
        if (!on) { c.style.removeProperty('--f'); return; }
        var r = c.getBoundingClientRect();
        var f = Math.min(1, Math.abs(r.left + r.width / 2 - mid) / r.width);
        c.style.setProperty('--f', f.toFixed(3));
      });
    }
    function pick() {
      queued = false;
      dull();
      if (!stacked.matches) return;
      var hit = swipe.matches ? inRow() : onScreen();
      dots.forEach(function (d) { d.classList.toggle('is-on', d.getAttribute('data-line') === hit); });
      if (hit !== last) { last = hit; lightLine(hit); }
    }
    function soon() { if (!queued) { queued = true; requestAnimationFrame(pick); } }
    window.addEventListener('scroll', soon, { passive: true });
    row.addEventListener('scroll', soon, { passive: true });
    window.addEventListener('resize', soon);
    [stacked, swipe].forEach(function (m) {
      if (m.addEventListener) m.addEventListener('change', function () { last = undefined; lightLine(null); soon(); });
    });
    dots.forEach(function (d) {
      d.addEventListener('click', function () {
        var c = row.querySelector('.l-card[data-line="' + d.getAttribute('data-line') + '"]');
        if (c) row.scrollTo({ left: c.offsetLeft - (row.clientWidth - c.offsetWidth) / 2, behavior: 'smooth' });
      });
    });
    soon();
  }

  /* ---- the facts, each one quoted from the client's own page --------- */
  function factsPanel() {
    var facts = el('section', 'panel');
    facts.appendChild(head(t('The project')));
    var grid = el('div', 'facts');
    p.facts.forEach(function (f) {
      var c = el('div', 'fact');
      c.appendChild(el('span', 'f-k', f.k));
      c.appendChild(el('span', 'f-v', f.v));
      grid.appendChild(c);
    });
    facts.appendChild(grid);
    if (p.factsSource) facts.appendChild(el('p', 'src', t('Source: {s}', { s: p.factsSource })));
    return facts;
  }
  /* inside a line the project's facts give way to the line's own */
  if (!ln && p.facts && p.facts.length) page.appendChild(factsPanel());

  /* ---- the three pillars, in the project's own colours ---------------
     Colour here CODES the content. It is never behind body copy. */
  if (p.pillars && p.pillars.length) {
    var pil = el('section', 'panel');
    pil.appendChild(head(t('Our pillars'), 'Connect. Engage. Work.'));
    var row = el('div', 'pillars');
    p.pillars.forEach(function (x) {
      var c = el('div', 'pillar pillar-' + x.id);
      c.appendChild(el('span', 'p-mark'));
      c.appendChild(el('h3', null, x.name));
      c.appendChild(el('p', null, x.line));
      row.appendChild(c);
    });
    pil.appendChild(row);
    if (p.pillarsSource) pil.appendChild(el('p', 'src', t('Source: {s}', { s: p.pillarsSource })));
    page.appendChild(pil);
  }

  /* ---- unit kinds ---------------------------------------------------- */
  /* A project sold as lines has already shown them as cards. */
  if (!lines.length && p.kinds && p.kinds.length) {
    var k = el('section', 'panel');
    k.appendChild(head(t('Unit types')));
    var kr = el('div', 'kinds');
    p.kinds.forEach(function (x) {
      var c = el('div', 'kind kind-' + x.colour);
      c.appendChild(el('span', 'k-mark'));
      c.appendChild(el('h3', null, x.name));
      /* a count only where the client printed one — Moray's brochure
         gives sizes, not counts, and a blank beats a guess */
      if (x.units != null) c.appendChild(el('p', 'k-n', t('{n} units', { n: x.units })));
      c.appendChild(el('p', 'k-r', x.from.toLocaleString('en-US') + ' – ' + x.to.toLocaleString('en-US') + ' m²'));
      kr.appendChild(c);
    });
    k.appendChild(kr);
    if (p.kindsSource) k.appendChild(el('p', 'src', t('Source: {s}', { s: p.kindsSource })));
    page.appendChild(k);
  }

  /* ---- masterplan, and the units it selects ---------------------------
     The drawing IS the control. It hands a building id to the unit
     panel, which owns everything after that — the same building pick a
     tap on the chip row makes, so there is one path and not two. */
  var units = MM.units.panel(p);

  if (p.masterplan && p.masterplan.img) {
    var mp = el('section', 'panel');
    mp.appendChild(head(t('Master plan'), t('Tap a building')));

    var plan = MM.masterplan.build(p, function (id) { units.pickBuilding(id); });
    mp.appendChild(plan.node);
    units.onData(function () { plan.setCounts(units.counts()); });

    if (p.masterplan.traced === 'approximate') {
      mp.appendChild(soon(t('The building outlines are approximate.'),
        t('They are traced on a crop of the brochure page, and the render draws HB and HA as one roof, so the line between those two is placed midway between their printed labels. Main Marks’ own master plan file replaces them — and is what the unit-level pins need.')));
    }
    if (p.masterplan.source) mp.appendChild(el('p', 'src', t('Source: {s}', { s: p.masterplan.source })));

    /* The same complex in three dimensions. It sits BESIDE the drawing
       rather than replacing it: the drawing is what picks a building
       today, and the model cannot, because its blocks have not been
       matched to HA-HE. See the head of js/model.js. */
    if (p.model3d) {
      var v = el('a', 'btn-line mp-3d');
      v.href = p.model3d;
      v.appendChild(el('span', null, t('See the buildings in 3D')));
      mp.appendChild(v);
    }

    page.appendChild(mp);
  }

  /* the unit panel itself sits under the drawing */
  page.appendChild(units.node);

  /* ---- floor plans ---------------------------------------------------- */
  /* Inside a line, only the plans that line's own legend puts it on —
     plus the master plan, which is where every line is found. A line
     whose floors are not stated sees them all rather than a guess. */
  var floorList = (p.floors || []).filter(function (f) {
    return !(ln && ln.floors) || f.id === 'master' || ln.floors.indexOf(f.id) !== -1;
  });
  if (floorList.length) {
    var fp = el('section', 'panel');
    fp.appendChild(head(t(p.floorsTitle || 'Floor plans')));
    var tabs = el('div', 'tabs');
    var view = el('div', 'plan');
    var cap = el('p', 'src');
    var note = el('div', 'soonwrap');

    var current = null;
    /* open on the line's own floor, not the master plan */
    var first = (ln && ln.floors && floorList.length > 1) ? 1 : 0;
    floorList.forEach(function (f, i) {
      var b = el('button', 'tab', f.name);
      b.type = 'button';
      b.addEventListener('click', function () { show(f, b); });
      tabs.appendChild(b);
      if (i === first) setTimeout(function () { show(f, b); }, 0);
    });

    function show(f, btn) {
      Array.prototype.forEach.call(tabs.children, function (n) { n.classList.remove('is-on'); });
      btn.classList.add('is-on');
      view.textContent = '';
      note.textContent = '';
      current = f;
      if (f.img) {
        var i2 = new Image();
        i2.src = f.img;
        i2.alt = t(f.name + ' — ' + p.name);
        view.appendChild(i2);
      } else {
        note.appendChild(soon(t(f.name + ' is not exported yet'),
          t('It is drawn in the brochure and goes in with the rest of the sheets. Nothing is invented in its place.')));
      }
      var leg = el('div', 'legend');
      (f.legend || []).forEach(function (l) { leg.appendChild(el('span', 'l-chip', l)); });
      view.appendChild(leg);
      cap.textContent = t('Source: {s}', { s: f.source || '' });
    }

    fp.appendChild(tabs);
    fp.appendChild(view);
    fp.appendChild(note);
    fp.appendChild(cap);
    page.appendChild(fp);
  }

  /* ---- what comes next, and what it is waiting on --------------------
     This panel is deliberately in the app rather than in an email. It is
     the fastest way to show Main Marks exactly which of their items
     unlocks which screen. It disappears item by item as the material
     arrives, because each line is driven by the config, not typed. */
  /* The wording depends on what exists. A project with no book at all
     (Moray, today) must not be told its selection works on a demo. */
  var hasBook = !!(p.inventory && p.inventory.url);
  var next = el('section', 'panel waiting');
  next.appendChild(head(t('Next, and what it needs')));
  var ul = el('div', 'waits');
  [
    { on: !!(p.inventory && !p.inventory.demo), title: t('Real availability, live'),
      need: hasBook
        ? t('Building, floor and unit selection is working now on a DEMO book. Point it at your own sheet — a Google Sheet with a unit code and a status — and the same screens read it live, so a sold unit is never offered.')
        : t('The availability sheet: every unit with its code, building, floor, size, type, price and status. Building, floor and unit selection opens on this page the day it arrives, and reads it live so a sold unit is never offered.') },
    { on: p.masterplan && p.masterplan.traced === true, title: t('Pick the unit on the master plan'),
      need: (p.masterplan && p.masterplan.traced)
        ? t('The buildings are selectable now, on outlines traced from the brochure crop. The master plan at full resolution, with the unit numbers printed on it, is what lets us pin individual units.')
        : t('The master plan at full resolution, with building names and unit numbers printed on it. The brochure plans shown above are for looking at; that file is what makes them clickable.') },
    { on: !!(p.plans && !p.plansDemo), title: t('Your payment plans, not ours'),
      need: p.plans
        ? t('The schedule engine is built and foots to the pound; the plans in it are placeholders. Send every plan — down payment, term, how often instalments fall, milestones, maintenance and when it is due — and one real signed offer to check our arithmetic against.')
        : t('Every payment plan — down payment, term, how often instalments fall, milestones, maintenance and when it is due — and one real signed offer to check our arithmetic against. The schedule engine is built and waiting for them.') },
    { on: false, title: t('The offer PDF and the WhatsApp post'),
      need: t('The price list, and two or three real offers your team has sent on WhatsApp, so the post comes out in the format they already use.') },
    { on: !!(p.brokerages && p.brokerages.length), title: t('Record who each offer went to'),
      need: t('The list of brokerage companies, and which salesperson looks after each. This is what gives the manager the picture of which brokers are active.') }
  ].forEach(function (w) {
    var r = el('div', 'wait' + (w.on ? ' is-on' : ''));
    r.appendChild(el('span', 'w-dot'));
    var b = el('div', 'w-b');
    b.appendChild(el('h3', null, w.title));
    b.appendChild(el('p', null, w.on ? t('Ready.') : w.need));
    r.appendChild(b);
    ul.appendChild(r);
  });
  next.appendChild(ul);
  page.appendChild(next);

  /* ---- helpers -------------------------------------------------------- */
  function head(title, sub) {
    var h = el('div', 'panel-head');
    h.appendChild(el('h2', null, title));
    if (sub) h.appendChild(el('span', 'pill', sub));
    return h;
  }
  function soon(title, line) {
    var s = el('div', 'soon-note');
    s.setAttribute('role', 'note');
    s.appendChild(el('strong', null, title));
    s.appendChild(el('span', null, ' ' + line));
    return s;
  }
  /* ---- the product lines ----------------------------------------------
     Each card is the project card's frame (render, band, meta, way in)
     wearing ONE line's identity: its ground, its mark, its accent. The
     frame is shared so the four read as one family; the band is where
     each brand speaks, and nothing of one line's is lent to another. */
  function lineChooser() {
    var s = el('section', 'panel lines-panel');
    s.appendChild(head(t('What are you selling?'), t('Choose a product')));
    var grid = el('div', 'l-cards');
    lines.forEach(function (l) { grid.appendChild(lineCard(l)); });
    s.appendChild(grid);
    /* the swipe row's dots — shown on a phone only (CSS). Square, like
       every mark in this identity; the lit one takes its line's accent. */
    var dots = el('div', 'l-dots');
    lines.forEach(function (l) {
      var d = el('button', 'l-dot');
      d.type = 'button';
      d.setAttribute('data-line', l.id);
      d.setAttribute('aria-label', t('Show {name}', { name: t(l.name) }));
      d.style.setProperty('--l-accent', l.accent);
      dots.appendChild(d);
    });
    s.appendChild(dots);
    s.appendChild(el('p', 'src', t('Pictures and figures: {list}', { list: lines.map(function (l) {
      return l.name + ' — ' + l.factsSource;
    }).join('; ') })));
    return s;
  }

  function lineCard(l) {
    var a = el('a', 'l-card');
    a.href = 'project.html?p=' + encodeURIComponent(p.id) + '&line=' + encodeURIComponent(l.id);
    a.setAttribute('aria-label', t('Open {name}', { name: t(l.name) }));
    a.style.setProperty('--l-accent', l.accent);
    a.style.setProperty('--l-ground', l.ground);
    a.style.setProperty('--l-ink', l.ink);

    a.appendChild(lineVisual(l, false));

    /* its buildings light on the aerial while the card is pointed at or
       focused — a keyboard user gets it too */
    a.setAttribute('data-line', l.id);          /* read by scrollLights */
    a.addEventListener('mouseenter', function () { lightLine(l.id); });
    a.addEventListener('mouseleave', function () { lightLine(null); });
    a.addEventListener('focus', function () { lightLine(l.id); });
    a.addEventListener('blur', function () { lightLine(null); });

    /* A line with its own logo build opens through it, exactly as the
       project card does on the projects page (js/app.js): the build is
       claimed only once it has started, so anything that stops it leaves
       an ordinary link. The logo is fetched now, not on the tap. */
    if (l.markBuild && l.markBuild.src && MM.markbuild) {
      if (window.fetch) window.fetch(l.markBuild.src).catch(function () { /* the page lifts the black anyway */ });
      a.addEventListener('click', function (e) {
        if (e.defaultPrevented || e.button !== 0) return;
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        var href = a.href;
        if (!MM.markbuild.cross(function () { location.assign(href); }, l.markBuild, a)) return;
        e.preventDefault();
      });
    }

    var meta = el('div', 'l-meta');
    /* The kind of unit sits in the copy, not as a pill on the picture:
       two of these pictures are the brand's own compositions, and a
       badge on top of them would break the CI's layout. */
    meta.appendChild(el('p', 'l-kind', t(l.badge)));
    meta.appendChild(el('p', 'l-line', t(l.line)));
    var dl = el('dl', 'c-facts');
    (l.facts || []).forEach(function (f) {
      var w = el('div');
      w.appendChild(el('dt', null, t(f.k)));
      w.appendChild(el('dd', null, t(f.v)));
      dl.appendChild(w);
    });
    meta.appendChild(dl);
    var go = el('div', 'l-go');
    go.appendChild(el('span', null, t('Open {name}', { name: t(l.name) })));
    go.appendChild(arrow());
    meta.appendChild(go);
    a.appendChild(meta);
    return a;
  }

  /* The top of a card — and of a line page — as the line's OWN material
     composes it. Three kinds:
       (none)             the brochure's look: the picture, then the band
                          on the line's ground carrying its mark
       fourth-master      The Fourth CI p.20: the campaign photograph with
                          the white extended lockup across its foot
       wellness-template  Moray Wellness CI p.10: the render inside the
                          branded template (bars, logo top centre, byline)
     `wide` is the line page: The Fourth then gets the lockup at the CI's
     own line length. */
  function lineVisual(l, wide) {
    var v = l.visual || {};
    var top = el('div', 'l-top l-top-' + (v.kind || 'band'));

    function pic(src, cls) {
      var im = new Image();
      im.src = src;
      im.alt = '';
      im.setAttribute('aria-hidden', 'true');
      if (!wide) im.loading = 'lazy';
      if (cls) im.className = cls;
      return im;
    }

    if (v.kind === 'fourth' && wide) {
      /* CI p.20 as drawn: a 16:9 stage, the photograph placed where the
         page places it (it overhangs the page by a few points), the
         lockup page laid over it at the same scale */
      top.classList.add('f4-master');
      top.appendChild(pic(v.master, 'f4-master-photo'));
      top.appendChild(MM.logo(v.lockup, 'Beyond the third, into The Fourth — Level of Business', 'f4-master-lockup'));
      return top;
    }
    if (v.kind === 'fourth') {
      /* CI p.30, centered placement */
      top.style.setProperty('--f4-red', v.red);
      top.appendChild(pic(v.post, 'l-photo'));
      top.appendChild(el('span', 'f4-shade'));
      var lg = el('span', 'f4-logo');
      lg.appendChild(el('span', 'f4-sq f4-sq-l'));
      lg.appendChild(MM.logo(v.logo, 'The Fourth — Level of Business', 'f4-logo-img'));
      lg.appendChild(el('span', 'f4-sq f4-sq-r'));
      top.appendChild(lg);
      var fby = el('span', 'f4-by');
      fby.appendChild(el('span', null, 'BY/'));
      fby.appendChild(MM.logo(v.byline, 'Main Marks', 'f4-by-mm'));
      fby.appendChild(MM.logo(v.moray, 'Moray', 'f4-by-moray'));
      top.appendChild(fby);
      var fmk = el('span', 'f4-mark');
      fmk.appendChild(el('span', null, '1ST MARK /'));
      fmk.appendChild(el('span', null, 'NEW CAIRO'));
      top.appendChild(fmk);
      return top;
    }

    if (v.kind === 'wellness-template') {
      top.style.setProperty('--w-orange', v.orange);
      top.style.setProperty('--w-foot', v.foot);
      top.appendChild(pic(v.render, 'l-photo'));
      top.appendChild(el('span', 'w-bar-l'));
      var r = el('span', 'w-bar-r');
      var from = 0;
      /* the right bar is a stack, each colour ending at its own % */
      r.style.background = 'linear-gradient(to bottom,' + v.right.map(function (b) {
        var s = b[0] + ' ' + from + '%, ' + b[0] + ' ' + b[1] + '%';
        from = b[1];
        return s;
      }).join(',') + ')';
      top.appendChild(r);
      top.appendChild(MM.logo(v.logo, l.name, 'w-logo'));
      var by = el('span', 'w-by');
      by.appendChild(el('span', null, 'BY/'));
      by.appendChild(MM.logo(v.byline, 'Main Marks', 'w-by-mark'));
      top.appendChild(by);
      var mk = el('span', 'w-mark');
      mk.appendChild(el('span', null, '1ST MARK /'));
      mk.appendChild(el('span', null, 'NEW CAIRO'));
      top.appendChild(mk);
      return top;
    }

    var shot = el('div', 'l-shot');
    if (l.img) shot.appendChild(pic(l.img));
    top.appendChild(shot);
    var band = el('div', 'l-band');
    band.appendChild(lineMark(l));
    top.appendChild(band);
    return top;
  }

  /* The line's mark, the way its own material sets it. Three kinds:
       logo            its own logo file, nothing added
       moray-heading   Moray's wordmark over the brochure's section
                       heading — for the line that has no brand
       moray-endorsed  a name set over Moray's wordmark, the brochure's
                       "R- RESIDENCE by / MORAY" lockup (PDF p.39)
     The slash is the brochure's own device, in the line's accent. */
  function lineMark(l) {
    var m = l.mark || {};
    var box = el('div', 'l-mark l-mark-' + (m.kind || 'logo'));
    if (m.kind === 'moray-heading') {
      box.appendChild(MM.logo(m.logo, p.name, 'l-wordmark'));
      var h = el('span', 'l-heading');
      h.appendChild(el('span', 'l-slash', '/'));
      h.appendChild(el('span', null, m.heading));
      box.appendChild(h);
    } else if (m.kind === 'moray-endorsed') {
      box.appendChild(el('span', 'l-slash l-slash-tall', '/'));
      var stack = el('span', 'l-stack');
      var over = el('span', 'l-over');
      over.appendChild(el('span', null, m.over));
      over.appendChild(el('span', 'l-by', m.by));
      stack.appendChild(over);
      stack.appendChild(MM.logo(m.logo, p.name, 'l-wordmark'));
      box.appendChild(stack);
      box.setAttribute('aria-label', m.over + ' ' + m.by + ' ' + p.name);
    } else {
      box.appendChild(MM.logo(m.logo, l.name, 'l-logo'));
    }
    return box;
  }

  /* Inside a line: its band across the top, its picture beside it. */
  function lineHero(l) {
    var hero = el('section', 'l-hero');
    hero.style.setProperty('--l-accent', l.accent);
    hero.style.setProperty('--l-ground', l.ground);
    hero.style.setProperty('--l-ink', l.ink);
    var band = el('div', 'l-hero-band');
    /* where the brand's own composition carries the logo, the panel does
       not repeat it */
    if (!l.visual) band.appendChild(lineMark(l));
    var lines2 = el('div', 'l-hero-copy');
    lines2.appendChild(el('p', 'eyebrow', l.badge + ' · ' + p.name));
    lines2.appendChild(el('p', 'l-line', l.line));
    var dl = el('dl', 'c-facts');
    (l.facts || []).forEach(function (f) {
      var w = el('div');
      w.appendChild(el('dt', null, f.k));
      w.appendChild(el('dd', null, f.v));
      dl.appendChild(w);
    });
    lines2.appendChild(dl);
    band.appendChild(lines2);
    hero.appendChild(band);
    if (l.visual) {
      var vis = lineVisual(l, true);
      vis.classList.add('l-hero-shot');
      hero.appendChild(vis);
    } else if (l.img) {
      var shot = el('div', 'l-hero-shot');
      var im = new Image();
      im.src = l.img;
      im.alt = l.name + ' — ' + p.name;
      shot.appendChild(im);
      hero.appendChild(shot);
    }
    var src = el('p', 'src', t('Source: {a}; picture: {b}', { a: l.factsSource, b: l.imgSource }));
    var wrap = el('div');
    wrap.appendChild(hero);
    wrap.appendChild(src);
    return wrap;
  }

  /* ---- a line's own page (build 68) --------------------------------------
     Laid out exactly as the Qomor app, in the Main Marks colours: the
     building on the night aerial, then its floors, its units and the
     offer, all read from Main Marks' own sheet. js/lineflow.js. */
  function linePage(l) {
    document.body.classList.add('is-linepage', 'is-qflow');
    /* a line without a logo file of its own (Offices, R- Residence) heads
       its page with the same mark its card wears; its accent colours the
       slash, as on the card */
    page.style.setProperty('--l-accent', l.accent);
    var mark = (!(l.visual && l.visual.logo) && l.mark) ? lineMark(l) : null;
    if (mark) mark.classList.add('q-mark');
    MM.lineFlow({ page: page, project: p, line: l, session: session, mark: mark });
  }

  function arrow() {
    var s = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    s.setAttribute('viewBox', '0 0 24 24');
    s.setAttribute('width', '18');
    s.setAttribute('height', '18');
    s.setAttribute('aria-hidden', 'true');
    var d = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    d.setAttribute('d', 'M4 12h15M13 6l6 6-6 6');
    d.setAttribute('fill', 'none');
    d.setAttribute('stroke', 'currentColor');
    d.setAttribute('stroke-width', '1.6');
    d.setAttribute('stroke-linecap', 'round');
    d.setAttribute('stroke-linejoin', 'round');
    s.appendChild(d);
    return s;
  }

  function refuse(msg, backHref, backLabel) {
    var box = el('section', 'blocked');
    box.appendChild(el('p', 'eyebrow', t('Not available')));
    box.appendChild(el('h1', null, msg));             /* already in the app's language */
    box.appendChild(el('p', null, t('Only projects that have been released, and opened for your account, can be selected.')));
    var a = el('a', 'btn', backLabel || t('Back to all projects'));
    a.href = backHref || 'index.html';
    box.appendChild(a);
    page.appendChild(box);
    document.title = t('Not available — Main Marks');
  }
}());
