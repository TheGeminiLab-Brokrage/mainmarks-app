/* ------------------------------------------------------------------
   Main Marks — a product line's page, laid out EXACTLY as the Qomor app
   (build 68; Muhanad: "make it exactly how the Qomor app is designed",
   in the Main Marks app's own colours).

     sync bar   the inventory, when it was read, Refresh, the counts
     1 Building the night aerial is the picker (traced roofs, lights on
                for the chosen one); under it Qomor's bar: a chip, a
                select naming every building with its count, a note.
                No zoom and no "Open full size" (Muhanad, 2026-10-01).
     2 Floor    Qomor's floor cards: code, "N available", name, use.
     3 Unit     the units on that floor, with price, sorted.
     4 Unit details  the unit card, the payment plan, the figures, the
                year-grouped quarterly schedule, and the offer to send.

   EVERYTHING IS READ FROM THE SHEET (js/inventory.js). The line is the
   rows whose Type the config names (`line.match.type`); its buildings
   are the ones those rows name; a building's floors are the line's
   `stepFloors` plus any floor the rows name. So a unit added to the
   sheet appears here with no code change — in its floor, in its
   building, even in a building nobody has traced yet (it is then
   picked from the select).

   One path to a unit: the roofs, the chip select, the floor cards and
   the unit rows all end in the same select*() functions.
   ------------------------------------------------------------------ */
(function (root) {
  'use strict';
  var MM = root.MM || (root.MM = {});

  var ORDER = ['street', 'ground', 'first', 'second', 'third', 'fourth', 'fifth'];
  var CODE = { street: 'S', ground: 'G', first: '1st', second: '2nd', third: '3rd', fourth: '4th', fifth: '5th' };
  var USE = { Clinic: 'Clinics', Admin: 'Offices', Commercial: 'Shops', Serviced: 'Serviced apartments' };

  /* the sheet's floor words -> one id ("S.Level", "Street level", "1st", "First") */
  /* one rule for the sheet's floor word, shared with the offer PDF */
  function floorId(raw) { return MM.inventory.floorId(raw); }
  /* ---- sending a file from a phone (build 88; Qomor's proven pieces) ----
     Ask "is this a phone?", not "can the browser share?": Chrome on a Windows
     laptop answers yes to canShare and then opens a flyout that never settles,
     leaving a dead button (playbook 01, 4). userAgentData is definitive where
     it exists; (pointer: coarse) covers the iPhone, which has none. */
  function handheld() {
    try {
      if (navigator.userAgentData && typeof navigator.userAgentData.mobile === 'boolean') return navigator.userAgentData.mobile;
      return typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches;
    } catch (e) { return false; }
  }
  function canShare(payload) {
    try { return typeof navigator.share === 'function' && typeof navigator.canShare === 'function' && navigator.canShare(payload); }
    catch (e) { return false; }
  }
  /* navigator.share, but it always settles: a promise that never resolves is
     an error nowhere, so give it a minute and then call it one */
  function shareOrTimeOut(payload) {
    return Promise.race([
      navigator.share(payload),
      new Promise(function (ok, no) {
        setTimeout(function () { var e = new Error('share timed out'); e.name = 'TimeoutError'; no(e); }, 60000);
      })
    ]);
  }
  function saveFile(file) {
    var url = URL.createObjectURL(file), a = document.createElement('a');
    a.href = url; a.download = file.name; a.style.display = 'none';
    document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(url); if (a.parentNode) a.parentNode.removeChild(a); }, 30000);
  }

  /* the demo page around the app (demo.html), if there is one */
  function demoPhone() {
    try { var d = root.parent !== root && root.parent.MMDemo; return d && typeof d.share === 'function' ? d : null; }
    catch (e) { return null; }             /* another origin's frame: not the demo */
  }
  function money(v) { return Math.round(v).toLocaleString('en-US'); }
  /* the schedule's date column: Arabic month names are long, so the Arabic table
     uses day/month/year in figures and stays inside a phone's width */
  function tday(d) {
    if (!MM.isArabic) return day(d);
    var p2 = function (n) { return (n < 10 ? '0' : '') + n; };
    return p2(d.getDate()) + '/' + p2(d.getMonth() + 1) + '/' + d.getFullYear();
  }
  function day(d) {
    if (MM.isArabic && MM.tx) return MM.tx.date(d);
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  }
  function pct(f, dp) { return (Math.round(f * Math.pow(10, 2 + (dp || 0))) / Math.pow(10, dp || 0)) + '%'; }

  function lineFlow(o) {
    var el = MM.el, t = MM.t;
    var page = o.page, p = o.project, l = o.line, session = o.session || {};
    var W = p.aerial.w || 1672, H = p.aerial.h || 941;
    var types = (l.match && l.match.type) || [];
    /* WHICH ROWS ARE THIS LINE: Type (case-blind, the sheet is typed by
       hand) and, where the line is a floor of a type, the floor — The
       Fourth is Admin on the Fourth floor, Offices are Admin on 1st-3rd. */
    var typesLC = types.map(function (x) { return String(x).trim().toLowerCase(); });
    var onFloors = (l.match && l.match.floors) || null;
    function inLine(u) {
      if (typesLC.indexOf(String(u.type || '').trim().toLowerCase()) === -1) return false;
      return !onFloors || onFloors.indexOf(floorId(u.floor)) !== -1;
    }

    var wrap = el('div', 'q');
    page.appendChild(wrap);

    /* ---- which line this is (Qomor names its project in its header) --- */
    var title = el('div', 'q-title');
    /* a line with no logo file of its own wears the mark its card wears
       (Offices: Moray + the brochure heading; R- Residence: the brochure
       lockup), built by the page and handed in as `o.mark` */
    var logoSrc = (l.visual && l.visual.logo) || (!o.mark && l.markBuild && l.markBuild.src) || null;
    if (o.mark) title.appendChild(o.mark);
    else if (logoSrc) {
      var lg = new Image();
      lg.className = 'q-logo';
      lg.src = logoSrc;
      lg.alt = t(l.name);
      title.appendChild(lg);
    } else title.appendChild(el('h1', 'q-name', t(l.name)));
    title.appendChild(el('p', 'q-sub', useMany(types[0]) + ' · ' + p.name + (l.place ? ' · ' + t(l.place) : '')));
    wrap.appendChild(title);

    /* ---- the sync bar (Qomor #sync) ------------------------------------ */
    var sync = el('div', 'q-sync');
    var dot = el('span', 'q-dot');
    var syncText = el('span', 'q-synctext', t('Loading units…'));
    var refresh = el('button', 'q-ghost q-tiny', t('Refresh'));
    refresh.type = 'button';
    var counts = el('span', 'q-counts');
    sync.appendChild(dot); sync.appendChild(syncText); sync.appendChild(refresh);
    sync.appendChild(el('span', 'q-spacer')); sync.appendChild(counts);
    wrap.appendChild(sync);
    var warn = el('div', 'q-warn');
    warn.hidden = true;
    wrap.appendChild(warn);

    /* ---- Find a unit (build 69): Qomor's "Customer has a budget in
       mind?" place, Ayyam's filter. It owns nothing: every tap in it ends
       in the select*() functions below. js/finder.js ------------------- */
    var finder = MM.finder ? MM.finder({
      project: p,
      useWord: useMany(types[0]),
      filters: l.filters,             /* this product's own questions (build 112) */
      nameOf: function (key) { var b = byKey(key); return b ? b.label : t('Building {b}', { b: key }); }
    }) : null;
    if (finder) wrap.appendChild(finder.node);
    var search = { active: false, match: null, byBuilding: {} };
    var lightAll = false;            /* after a pick, the other matches go dark until asked */

    function step(n, title, hint) {
      var s = el('section', 'q-step');
      var h = el('h2', 'q-h');
      h.appendChild(el('i', null, String(n)));
      h.appendChild(el('span', null, t(title)));
      var sm = el('small', null, hint ? t(hint) : '');
      h.appendChild(sm);
      s.appendChild(h);
      s.hint = sm;
      wrap.appendChild(s);
      return s;
    }

    /* ---- 1 · Building ---------------------------------------------------- */
    var s1 = step(1, 'Building', 'Tap a building on the view, or choose it below');
    var hero = el('div', 'q-hero');
    var canvas = el('div', 'q-canvas');
    var base = new Image();
    base.className = 'q-img q-base';
    base.alt = t('{p} at night — {l}', { p: p.name, l: l.name });
    base.draggable = false;
    base.src = p.aerial.img;
    canvas.appendChild(base);
    hero.appendChild(canvas);
    s1.appendChild(hero);
    var bar = el('div', 'q-bbar');
    var chip = el('span', 'q-chip', '—');
    var sel = el('select', 'q-select');
    sel.setAttribute('aria-label', t('Choose a building'));
    var bmeta = el('span', 'q-bmeta');
    var relight = el('button', 'q-link');
    relight.type = 'button';
    relight.hidden = true;
    relight.addEventListener('click', function () { lightAll = true; paint(); });
    bar.appendChild(chip); bar.appendChild(sel); bar.appendChild(bmeta); bar.appendChild(relight);
    s1.appendChild(bar);
    var none = el('p', 'q-none');
    none.hidden = true;
    s1.appendChild(none);

    var s2 = step(2, 'Floor');
    var floorsGrid = el('div', 'q-grid');
    s2.appendChild(floorsGrid);
    s2.hidden = true;

    var s3 = step(3, 'Unit');
    var unitPanel = el('div', 'q-panel');
    s3.appendChild(unitPanel);
    s3.hidden = true;

    var s4 = step(4, 'Unit details', 'Price, payment plan and the offer');
    var detail = el('div', 'q-detail');
    s4.appendChild(detail);
    s4.hidden = true;

    /* build 114 (Muhanad): the line naming our inventory file, the plans' date and how the picture was made is
       off the screen. Those sources stay in config (inventory.source, aerial.source). No on-screen message
       names the sheet or how the app works. */

    /* ---- the aerial's lights and roofs (traced by Muhanad, config) ------ */
    var cfgB = (l.buildings || []).filter(function (b) { return b && b.id; });
    /* THE ROOFS (build 107): the project's buildings that hold this product (config `buildings`, traced by
       Muhanad). A roof is a real building; the lists below stay keyed by the sheet's building name, so one
       roof can stand for two sheet names (D1-D2) and one sheet name for two roofs (B = B1 and B2, told
       apart by unit number). Without project buildings, the line's own traced roofs are used as before. */
    var PH = (p.buildings && p.buildings.length)
      ? p.buildings.filter(function (x) { return x.roof && x.roof.length >= 3 && (l.roofs === 'all' || (x.holds || []).indexOf(l.id) !== -1); })
      : cfgB.filter(function (b) { return b.roof && b.roof.length >= 3; })
          .map(function (b) { return { id: b.id, name: b.name, sheet: [b.inventory || b.id], roof: b.roof }; });
    function unitNo(code) { var m = /(\d{2})\D*$/.exec(String(code)); return m ? +m[1] : -1; }
    /* a roof answers to the sheet's names for it; one the sheet has no name for yet answers to its own id */
    function isOf(x, key) { return (x.sheet || []).indexOf(key) !== -1 || (!(x.sheet || []).length && x.id === key); }
    function physFor(u) {
      var c = PH.filter(function (x) { return isOf(x, u.building); });
      if (c.length < 2) return c[0] || null;
      var n = unitNo(u.code);
      return c.filter(function (x) { return (x.units || []).some(function (r) { return n >= r[0] && n <= r[1]; }); })[0] || null;
    }
    function physOfBuilding(key) {
      return PH.filter(function (x) { return isOf(x, key); }).map(function (x) { return x.id; });
    }
    /* a tap on a roof opens the sheet building under it with the most to sell */
    var unplaced = false;          /* the sheet does not say which building this line's units are in */
    function pick(P) {
      if (unplaced) { if (buildings[0]) selectBuilding(buildings[0].id, true); return; }
      var c = buildings.map(function (b) {
        var mine = b.rows.filter(function (u) { return physFor(u) === P; });
        return { b: b, n: mine.length, a: mine.filter(function (u) { return u.sellable; }).length };
      }).filter(function (x) { return x.n; }).sort(function (x, y) { return y.a - x.a || y.n - x.n; });
      if (c[0]) selectBuilding(c[0].b.id, true);
    }
    var lights = {}, roofs = {}, glows = {};
    function litLayer(box) {
      var im = new Image();
      im.className = 'q-img q-lit is-off';
      im.alt = ''; im.draggable = false;
      im.setAttribute('aria-hidden', 'true');
      im.src = l.lit;
      var pc = function (v, of) { return (v / of * 100).toFixed(3) + '%'; };
      im.style.clipPath = 'inset(' + pc(box[1], H) + ' ' + pc(W - box[2], W) + ' ' + pc(H - box[3], H) + ' ' + pc(box[0], W) + ')';
      canvas.appendChild(im);
      return im;
    }
    if (l.lit) cfgB.forEach(function (b) { if (b.light && b.light.length === 4) lights[b.id] = litLayer(b.light); });
    /* A line whose buildings are not traced yet (Offices, The Fourth,
       R- Residence) has no per-building lights to switch, so the WHOLE
       line's lit picture stays on — the same picture its card lights on
       the Moray page — and the building is chosen from the select. Its
       roofs join the moment they are traced into config. */
    if (l.lit && !Object.keys(lights).length) {
      var whole = litLayer([0, 0, W, H]);
      whole.classList.remove('is-off');
    }
    if (!PH.length) s1.hint.textContent = t('Choose a building below');
    var NS = 'http://www.w3.org/2000/svg';
    var svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
    svg.setAttribute('preserveAspectRatio', 'none');
    svg.setAttribute('class', 'lp-roofs is-idle');
    svg.innerHTML = '<defs><filter id="lp-glow" x="-15%" y="-15%" width="130%" height="130%">' +
      '<feGaussianBlur in="SourceGraphic" stdDeviation="4" result="b"/>' +
      '<feMerge><feMergeNode in="b"/><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>';
    PH.forEach(function (b) {
      var pts = b.roof.map(function (q) { return q[0] + ',' + q[1]; }).join(' ');
      var glow = document.createElementNS(NS, 'polygon');
      glow.setAttribute('points', pts);
      glow.setAttribute('class', 'lp-roof-glow');
      glow.setAttribute('filter', 'url(#lp-glow)');
      svg.appendChild(glow);
      glows[b.id] = glow;
      var g = document.createElementNS(NS, 'polygon');
      g.setAttribute('points', pts);
      g.setAttribute('class', 'lp-roof');
      g.setAttribute('tabindex', '0');
      g.setAttribute('role', 'button');
      g.setAttribute('aria-label', bLabel(b.name));
      g.addEventListener('click', function () { pick(b); });
      g.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(b); } });
      svg.appendChild(g);
      roofs[b.id] = g;
    });
    canvas.appendChild(svg);

    /* The count badge on each traced roof while a search is on. A REAL
       button, not an ::after: on Ayyam the drawn badge swallowed the tap,
       and the number is exactly what people tap (playbook 01, round 2).
       It sits ON the roof's top edge, centred on it, in % of the picture so
       it rides any resize — on a phone a roof is ~45 px wide, and a badge
       on its centre hid the very roof it was lighting (build 69). */
    var badges = {};
    PH.forEach(function (b) {
      var sx = 0, top = Infinity;
      b.roof.forEach(function (q) { sx += q[0]; top = Math.min(top, q[1]); });
      var bd = el('button', 'q-badge');
      bd.type = 'button';
      bd.hidden = true;
      bd.style.left = (sx / b.roof.length / W * 100).toFixed(2) + '%';
      bd.style.top = (top / H * 100).toFixed(2) + '%';
      bd.addEventListener('click', function () { pick(b); });
      canvas.appendChild(bd);
      badges[b.id] = bd;
    });

    /* ---- the data -------------------------------------------------------- */
    var rows = [], buildings = [], cur = { b: null, f: null, u: null };

    function build(res) {
      rows = res.all.filter(inLine);
      rows.forEach(function (u) { u.fid = floorId(u.floor); });
      /* THE STREET-LEVEL SHOPS (build 111): the sheet's Bldg "ST" names no building, so each shop joins the
         building above it (config `buildings`, `street`, by the start of its code). From here on it is a unit
         of that building like any other: its roof glows, and the building's floor cards show the street level
         beside the ground floor. A shop no building claims keeps the sheet's own name (fail closed). */
      var above = {};
      rows.forEach(function (u) {
        if (PH.some(function (x) { return isOf(x, u.building); })) return;
        var code = String(u.code).toUpperCase();
        var P = PH.filter(function (x) { return (x.street || []).some(function (s) { return code.indexOf(s) === 0; }); })[0];
        if (!P) return;
        u.building = (P.sheet || [])[0] || P.id;
        above[u.building] = P.name;
      });
      /* the buildings: the traced ones first, in the picture's order, then
         any building the sheet names that nobody has traced yet */
      var SIDE = { left: 0, right: 1 };
      buildings = cfgB.slice().sort(function (a, c) { return (SIDE[a.side] || 0) - (SIDE[c.side] || 0); })
        .map(function (b) { return { id: b.id, name: b.name, label: bLabel(b.name), key: b.inventory || b.id, traced: !!roofs[b.id] }; });
      rows.forEach(function (u) {
        if (!buildings.some(function (b) { return b.key === u.building; })) {
          var nm = above[u.building];
          buildings.push({ id: u.building, name: nm || 'Building ' + u.building, label: nm ? bLabel(nm) : t('Building {b}', { b: u.building }), key: u.building, traced: false, short: nm ? nm.replace(/^Building /, '') : '' });
        }
      });
      buildings.forEach(function (b) {
        b.rows = rows.filter(function (u) { return u.building === b.key; });
        b.avail = b.rows.filter(function (u) { return u.sellable; }).length;
        b.hold = b.rows.filter(function (u) { return u.status === 'On hold'; }).length;
      });
      /* once its shops have joined their buildings, an empty "Street level" is not offered */
      if (Object.keys(above).length) buildings = buildings.filter(function (b) { return b.rows.length; });
      /* each roof shows ONLY when the sheet has an available unit of this product there (Muhanad, 2026-10-05,
         build 108: "what glows is what is available"; the grey outline of build 107 is gone). On hold only =
         not available. A unit added to the sheet lights its building by itself.
         UNPLACED (the shops: Bldg "ST" names no building): every roof stands for the whole line, glows while
         the line has anything available, and a tap opens the line's one list. */
      var placed = rows.some(function (u) { return physFor(u); });
      unplaced = !!rows.length && !placed;
      var lineAvail = rows.filter(function (u) { return u.sellable; }).length;
      PH.forEach(function (P) {
        var mine = rows.filter(function (u) { return physFor(u) === P; });
        var a = unplaced ? lineAvail : mine.filter(function (u) { return u.sellable; }).length, g = roofs[P.id];
        g.classList.toggle('is-none', !a);
        if (a) g.setAttribute('tabindex', '0'); else g.removeAttribute('tabindex');
        g.setAttribute('aria-label', bLabel(P.name) + (unplaced ? '' : ' · ' + t('{n} available', { n: a })));
      });
      var avail = rows.filter(function (u) { return u.sellable; }).length;
      counts.textContent = t('{n} {use} · {a} available', { n: rows.length, use: useMany(types[0]).toLowerCase(), a: avail });
      sel.textContent = '';
      var ph = el('option', null, t('Choose a building'));
      ph.value = ''; ph.disabled = true; ph.selected = true;
      sel.appendChild(ph);
      buildings.forEach(function (b) {
        var op = el('option', null, b.label + ' — ' + (b.avail ? t('{n} available', { n: b.avail }) : t('none available')));
        op.value = b.id;
        sel.appendChild(op);
      });
      if (res.problems && res.problems.length) {
        warn.hidden = false;
        warn.textContent = '';
        res.problems.forEach(function (m) { warn.appendChild(el('p', null, m)); });
      }
      if (finder) finder.setUnits(rows);
      /* NOTHING IN THE SHEET YET (R- Residence today): say so, plainly,
         and offer nothing — no building select, no search over nothing.
         The page fills by itself the moment such rows are added. */
      var empty = !rows.length;
      bar.hidden = empty;
      if (finder) finder.node.hidden = empty;
      none.hidden = !empty;
      if (empty) s1.hint.textContent = '';
      none.textContent = empty ? t('No {use} are available right now. They will appear here as soon as they are released.',
        { use: useMany(types[0]).toLowerCase() }) : '';
    }
    function useWord(type) { return USE[type] || type || ''; }
    /* build 92: the same words in the app's language (js/i18n.js) */
    function useMany(type) { return MM.tx ? MM.tx.useMany(type, useWord(type)) : useWord(type); }
    function useOne(type) { var en = useWord(type).replace(/s$/, ''); return MM.tx ? MM.tx.useOne(type, en) : en; }
    /* "Building E" is put into the app's language by its letter; any other name ("Street level") is a phrase */
    function bLabel(name) { var n = /^Building\s/i.test(String(name)) ? name : t(name); return MM.tx ? MM.tx.building(n) : n; }
    function planName(label) { return MM.tx ? MM.tx.plan(label) : label; }
    function egp(v) { return MM.isArabic && MM.tx ? MM.tx.egp(v) : money(v) + ' EGP'; }
    function byKey(key) { return buildings.filter(function (b) { return b.key === key; })[0]; }

    /* ---- what the search lights ------------------------------------------
       Before a pick: every matching building's roof breathes, its lights
       come on and it carries its count; the picture dims. After a pick:
       only the chosen one, with one link to light the rest again (Ayyam,
       round 2). Inside the building the floors and units follow it. */
    if (finder) {
      finder.onChange(function (out) { search = out; paint(); });
      finder.onPickBuilding(function (key) { var b = byKey(key); if (b) selectBuilding(b.id, false); });
      finder.onShowUnit(function (u, plan) {
        var b = byKey(u.building);
        if (!b || !u.sellable) return;               /* fail closed: only a sellable unit is opened */
        selectBuilding(b.id, false);
        selectFloor(u.fid);
        if (plan) planId = plan;
        selectUnit(u.code);
        go(s3);                                      /* the drawing first: the unit glows there */
      });
      /* build 96: "Send these options". The finder's cards leave as ONE
         WhatsApp post (js/post.js), after the same question as every offer:
         who is it for. Fail closed: every unit is checked again here. */
      finder.onSendOptions(function (list) {
        if (!MM.post || !MM.post.captionOptions) return;
        var opts = list.map(function (x) {
          var b = byKey(x.u.building);
          return { unit: x.u, role: x.role, buildingName: b && b.name,
                   plan: x.plan ? (p.plans || []).filter(function (q) { return q.id === x.plan; })[0] || null : null };
        });
        if (opts.length < 2 || opts.some(function (x) { return !x.unit.sellable; })) return;
        var demo = demoPhone();
        askAudience(function (who) {
          MM.post.open({
            project: p, line: l, options: opts, all: rows, who: who, session: session, demo: demo,
            onSent: sent(who, 'post', null, offerKey(opts.map(function (x) { return { code: x.unit.code, plan: x.plan && x.plan.id }; }))),
            kit: { handheld: handheld, canShare: canShare, shareOrTimeOut: shareOrTimeOut, saveFile: saveFile, sentWords: sentWords }
          });
        }, { postOnly: true });
      });
    }
    function paint() {
      var on = search.active;
      canvas.classList.toggle('is-searching', on);
      svg.classList.toggle('is-searching', on);
      var others = 0;
      var bestRow = search.best ? rows.filter(function (x) { return x.code === search.best; })[0] : null;
      var curB = buildings.filter(function (x) { return x.id === cur.b; })[0];
      var curPh = curB ? physOfBuilding(curB.key) : [];
      PH.forEach(function (P) {
        var n = on ? rows.filter(function (u) { return physFor(u) === P && search.match(u); }).length : 0;
        var isBest = !!(bestRow && physFor(bestRow) === P);
        var shown = n > 0 && (!cur.b || lightAll || curPh.indexOf(P.id) !== -1);
        roofs[P.id].classList.toggle('is-best', isBest);
        glows[P.id].classList.toggle('is-best', isBest);
        roofs[P.id].classList.toggle('is-match', shown);
        badges[P.id].classList.toggle('is-best', isBest);
        badges[P.id].hidden = !shown;
        badges[P.id].textContent = String(n);
        badges[P.id].setAttribute('aria-label', t('{name}, {n} matching units', { name: bLabel(P.name), n: n }));
      });
      buildings.forEach(function (b) {
        var n = on ? (search.byBuilding[b.key] || 0) : 0;
        var shown = n > 0 && (!cur.b || lightAll || b.id === cur.b);
        if (n > 0 && cur.b && b.id !== cur.b) others += n;
        if (lights[b.id]) lights[b.id].classList.toggle('is-off', !(b.id === cur.b || (on && shown)));
      });
      relight.hidden = !(on && cur.b && others && !lightAll);
      relight.textContent = t(others === 1 ? 'Light the other {n} match' : 'Light the other {n} matches', { n: others });
      var b = buildings.filter(function (x) { return x.id === cur.b; })[0];
      if (b && !s2.hidden) renderFloors(b);
      if (b && cur.f && !s3.hidden) { selectFloor(cur.f, true); return; }   /* rows, drawing and step 4 follow the budget */
      [].forEach.call(unitPanel.querySelectorAll('.q-unit, .q-u'), function (r) {
        var u = rows.filter(function (x) { return x.code === r.dataset.code; })[0];
        r.classList.toggle('is-nomatch', !!(on && u && !search.match(u)));
      });
    }

    function load() {
      dot.className = 'q-dot';
      syncText.textContent = t('Loading units…');
      return MM.inventory.load(p.inventory).then(function (res) {
        build(res);
        dot.className = 'q-dot is-live';
        var now = new Date();
        syncText.textContent = '';
        syncText.appendChild(el('b', null, t('Updated')));
        syncText.appendChild(document.createTextNode(' ' + t('{time}', {
          time: String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0') })));
        if (cur.b) selectBuilding(cur.b, false, true);
      }).catch(function (err) {
        /* fail closed: nothing is offered from a sheet we could not read */
        dot.className = 'q-dot is-bad';
        syncText.textContent = t('Units could not be loaded. Please try again.');
        warn.hidden = false;
        warn.textContent = String(err && err.message || err);
        s2.hidden = s3.hidden = s4.hidden = true;
      });
    }
    refresh.addEventListener('click', load);
    sel.addEventListener('change', function () { selectBuilding(sel.value, false); });

    /* build 126 (Muhanad, 2026-10-07): a tap moves the page to the next step at EVERY width. It used to
       happen on a phone only, and on a laptop the next step opened below the fold and had to be found. */
    function go(section) {
      section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    /* ---- 1 → 2 ------------------------------------------------------------ */
    function selectBuilding(id, fromPicture, keep) {
      var b = buildings.filter(function (x) { return x.id === id; })[0];
      if (!b) return;
      cur.b = id;
      if (!keep) { cur.f = null; cur.u = null; }
      sel.value = id;
      chip.textContent = b.short || id;
      chip.classList.add('is-on');
      bmeta.textContent = b.hold ? t('{n} on hold', { n: b.hold }) : '';
      var onPh = physOfBuilding(b.key);
      Object.keys(roofs).forEach(function (k) { roofs[k].classList.toggle('is-on', onPh.indexOf(k) !== -1); });
      Object.keys(glows).forEach(function (k) { glows[k].classList.toggle('is-on', onPh.indexOf(k) !== -1); });
      svg.classList.remove('is-idle');
      lightAll = false;
      s2.hidden = false;
      paint();                       /* lights, badges, and the floors with their matches */
      if (!keep) { s3.hidden = true; s4.hidden = true; go(s2); }
      else if (cur.f) selectFloor(cur.f, true);
    }

    function floorName(fid) {
      var f = (p.floors || []).filter(function (x) { return x.id === fid; })[0];
      if (fid === 'street') return t('Street level');
      return f ? (MM.tx ? MM.tx.floor(fid, f.name + ' Floor') : f.name + ' Floor') : fid;
    }

    function renderFloors(b) {
      floorsGrid.textContent = '';
      var ids = (l.stepFloors || []).slice();
      /* Commercial (build 112): the floor cards are the levels THIS building holds shops on in the finished
         project (config `buildings`): the ground floor in all 14, the street level where shops sit under it
         (`street`), the first floor where it has showrooms (`showrooms`). */
      if (l.floorsByBuilding) {
        ids = [];
        PH.filter(function (x) { return isOf(x, b.key); }).forEach(function (P) {
          [(P.street || []).length ? 'street' : '', 'ground', P.showrooms ? 'first' : ''].forEach(function (f) {
            if (f && ids.indexOf(f) === -1) ids.push(f);
          });
        });
      }
      b.rows.forEach(function (u) { if (ids.indexOf(u.fid) === -1) ids.push(u.fid); });
      ids.sort(function (a, c) { return ORDER.indexOf(a) - ORDER.indexOf(c); });
      ids.forEach(function (fid) {
        var on = b.rows.filter(function (u) { return u.fid === fid; });
        var av = on.filter(function (u) { return u.sellable; }).length;
        var hold = on.filter(function (u) { return u.status === 'On hold'; }).length;
        /* while a search is on, the floor says how many of ITS units match,
           and a floor with none steps back (still openable) */
        var hits = search.active ? on.filter(search.match).length : null;
        var card = el('button', 'q-card' + (hits === 0 ? ' is-nomatch' : ''));
        card.type = 'button';
        card.disabled = !av;
        var r = el('div', 'q-row');
        r.appendChild(el('span', 'q-id', CODE[fid] || fid));
        r.appendChild(el('span', 'q-pill' + (av ? '' : ' none'),
          hits ? t(hits === 1 ? '{n} match' : '{n} matches', { n: hits }) : (av ? t('{n} available', { n: av }) : t('none available'))));
        card.appendChild(r);
        card.appendChild(el('span', 'q-val', floorName(fid)));
        card.appendChild(el('span', 'q-lab', useMany(types[0]) + (hold ? ' · ' + t('{n} on hold', { n: hold }) : '')));
        /* the floor that holds the answer carries it, in green */
        var here = on.filter(isAnswer)[0];
        if (here) {
          card.classList.add('is-best');
          card.appendChild(el('span', 'q-cbest', t(TAG[search.kind] || 'Best fit') + ' · ' + here.code));
        }
        card.dataset.floor = fid;
        card.classList.toggle('is-on', cur.f === fid);
        card.addEventListener('click', function () { selectFloor(fid); });
        floorsGrid.appendChild(card);
      });
    }

    /* ---- the floor drawing in step 3 (build 71) ----------------------------
       The brochure's whole-floor drawing sits at the back, dimmed and pushed
       back; the chosen building's part of the SAME drawing is lifted to the
       front at full brightness. No second picture: the lifted piece is the
       drawing itself, cut by the building's box in config (`plans`), so it
       can never disagree with the floor behind it.
       Muhanad chose "Front and centre" (2026-10-01) over "In its place": the
       building comes to the middle, grown, over the WHOLE blurred floor (never
       zoomed). As numbers: `fill` = how much of the frame it takes, `lift` =
       how much closer it comes, `back` / `dim` / `blur` = how far back the
       floor sits. */
    var VIEW = { fill: 0.72, lift: 1.12, back: 0.97, dim: 0.5, blur: 1.1 };

    /* ---- the units on the lifted building (build 72) ------------------------
       Each unit Muhanad traced (config `unitShapes`, corners in the floor
       drawing's own px, the same space as `plates`) is drawn over the lifted
       piece. A sellable unit is a real button: a tap opens it exactly as the
       list does, and picking it in the list lights it here. On hold shows,
       dimmed, and cannot be opened (fail closed). A unit with no outline yet
       is simply not drawn: it is still in the list. */
    /* the other units that fit the budget (build 75): marked on every draw,
       but only lit while "Show other options" is on. Off by default; the
       choice is kept here so a re-draw (paint → selectFloor) keeps it. */
    var showOthers = false;
    var glowSeq = 0;
    function unitLayer(box, rows) {
      var shapesCfg = p.unitShapes || {};
      var drawn = rows.filter(function (u) { var s = shapesCfg[u.code]; return s && s.length >= 3; });
      if (!drawn.length) return null;
      var NSu = 'http://www.w3.org/2000/svg';
      var s = document.createElementNS(NSu, 'svg');
      s.setAttribute('class', 'q-ulayer' + (showOthers ? ' show-alt' : ''));
      s.setAttribute('viewBox', box[0] + ' ' + box[1] + ' ' + (box[2] - box[0]) + ' ' + (box[3] - box[1]));
      s.setAttribute('preserveAspectRatio', 'none');
      var bestCode = search.best;
      var alts = drawn.filter(isOption);
      var lit = alts.slice();
      if (bestCode && drawn.some(function (u) { return u.code === bestCode; })) lit.unshift({ code: bestCode, best: true });
      if (lit.length) {
        var fid = 'q-bestglow-' + (++glowSeq);
        s.innerHTML = '<defs><filter id="' + fid + '" x="-40%" y="-40%" width="180%" height="180%">' +
          '<feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="b"/></feMerge></filter></defs>';
        lit.forEach(function (x) {
          var glow = document.createElementNS(NSu, 'polygon');
          glow.setAttribute('points', shapesCfg[x.code].map(function (q) { return q[0] + ',' + q[1]; }).join(' '));
          glow.setAttribute('class', 'q-u-glow' + (x.best ? '' : ' is-alt'));
          glow.setAttribute('filter', 'url(#' + fid + ')');
          s.appendChild(glow);
        });
      }
      s.altCount = alts.length;
      drawn.forEach(function (u) {
        var g = document.createElementNS(NSu, 'polygon');
        g.setAttribute('points', shapesCfg[u.code].map(function (q) { return q[0] + ',' + q[1]; }).join(' '));
        g.setAttribute('class', 'q-u ' + (u.sellable ? 'is-avail' : 'is-held') + (cur.u === u.code ? ' is-on' : '') +
          (search.best === u.code ? ' is-best' : '') +
          (alts.indexOf(u) !== -1 ? ' is-alt' : ''));
        g.dataset.code = u.code;
        if (u.sellable) {
          g.setAttribute('tabindex', '0');
          g.setAttribute('role', 'button');
          g.setAttribute('aria-label', u.code + ' · ' + money(u.area) + ' m² · ' + money(u.listPrice));
          g.addEventListener('click', function () { selectUnit(u.code); });
          g.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); selectUnit(u.code); } });
        } else g.setAttribute('aria-label', u.code + ' · ' + u.status);
        if (search.active && !search.match(u)) g.classList.add('is-nomatch');
        s.appendChild(g);
      });
      return s;
    }

    function floorPlate(b, fid, quiet, rows) {
      /* the cut Muhanad drew in tools/cut-buildings.html (config `plates`, by the
         sheet's building name). No cut, no drawing: a guessed box took part of
         the next building, so nothing is guessed */
      var box = p.plates && p.plates[b.key] && p.plates[b.key][fid];
      var f = (p.floors || []).filter(function (x) { return x.id === fid; })[0];
      if (!box || !f || !f.img) return null;
      var bw = box[2] - box[0], bh = box[3] - box[1];

      var holder = el('div', 'q-plate-wrap');
      var plate = el('div', 'q-plate');
      var back = new Image();
      back.className = 'q-plate-back';
      back.alt = '';
      back.setAttribute('aria-hidden', 'true');
      back.draggable = false;
      back.src = f.img;
      var lift = el('div', 'q-plate-lift');
      lift.setAttribute('role', 'img');
      lift.setAttribute('aria-label', b.label + ' · ' + floorName(fid) + ' · ' + t('layout'));
      /* a sharp picture of exactly this cut, when there is one (config `plateImgs`) */
      var sharp = p.plateImgs && p.plateImgs[b.key] && p.plateImgs[b.key][fid];
      lift.style.backgroundImage = 'url("' + (sharp || f.img) + '")';
      if (sharp) { lift.style.backgroundSize = '100% 100%'; lift.style.backgroundPosition = '0 0'; }
      plate.appendChild(back);
      plate.appendChild(lift);
      var units = unitLayer(box, rows || []);
      if (units) lift.appendChild(units);
      holder.appendChild(plate);
      /* the answer is named under the drawing, so it is never lost: glowing
         when its outline is traced, otherwise the first row of the list */
      var ansU = (rows || []).filter(isAnswer)[0];
      if (ansU) {
        var traced = !!(units && units.querySelector('.q-u.is-best'));
        holder.appendChild(el('p', 'q-plate-ans', ansU.code + ' · ' + t(TAG[search.kind] || 'Best fit') + '. ' +
          (traced ? t('Glowing on the drawing.') : t('First in the list below.'))));
      }
      /* Muhanad, 2026-10-02: the best fit alone by default; one button lights
         the rest that fit, in their own colour. Only while a budget is typed
         and some other fitting unit on this floor has an outline. */
      if (units && units.altCount) {
        var n = units.altCount;
        var more = el('button', 'q-altbtn');
        more.type = 'button';
        var label = function () {
          more.setAttribute('aria-pressed', String(showOthers));
          more.textContent = showOthers ? t('Hide other options') :
            t('Show other options ({n} on this floor)', { n: n });
        };
        label();
        more.addEventListener('click', function () {
          showOthers = !showOthers;
          units.classList.toggle('show-alt', showOthers);
          label();
        });
        holder.appendChild(more);
      }
      /* a unit on hold has its own colour on the drawing (build 99); the line under it says which and why */
      var heldU = (rows || []).filter(function (u) { return !u.sellable && units && units.querySelector('.q-u.is-held[data-code="' + u.code + '"]'); });
      if (heldU.length) holder.appendChild(el('p', 'q-plate-key', heldU.map(function (u) { return u.code + ' · ' + (MM.tx ? MM.tx.status(u.status) : u.status); }).join(' , ')));
      holder.appendChild(el('p', 'q-plate-src', t('Drawing: {src}', { src: f.source || p.name }) + (sharp ? ' · ' + t('sharpened copy') : '')));

      var shown = false;
      function lay() {
        var iw = back.naturalWidth, ih = back.naturalHeight;
        var pw = plate.clientWidth, ph = plate.clientHeight;
        if (!iw || !pw || !ph) return;
        if (!sharp) {
          lift.style.backgroundSize = (iw / bw * 100) + '% ' + (ih / bh * 100) + '%';
          lift.style.backgroundPosition = (box[0] / (iw - bw) * 100) + '% ' + (box[1] / (ih - bh) * 100) + '%';
        }
        /* the whole floor fitted in the frame (object-fit: contain), and the
           building's spot and size on it — where the lift starts */
        var s = Math.min(pw / iw, ph / ih);
        var c00 = { x: (pw - iw * s) / 2 + (box[0] + bw / 2) * s, y: (ph - ih * s) / 2 + (box[1] + bh / 2) * s };
        var start = { x: c00.x - bw * s / 2, y: c00.y - bh * s / 2, w: bw * s, h: bh * s };
        var V = VIEW;
        /* the WHOLE floor stays in view behind, never zoomed (Muhanad,
           2026-10-01), only set back a little */
        var k = V.back;
        var cam = 'translate(' + (pw / 2 * (1 - k)) + 'px,' + (ph / 2 * (1 - k)) + 'px) scale(' + k + ')';
        var bw0 = bw * s * k, bh0 = bh * s * k;
        /* the building alone is brought close: grown until it fills `fill` of the frame */
        var Z = Math.max(1, Math.min(pw * V.fill / bw0, ph * V.fill / bh0));
        var gw = bw0 * Z * V.lift, gh = bh0 * Z * V.lift;
        back.style.transformOrigin = '0 0';
        back.style.transform = cam;
        back.style.filter = 'brightness(' + V.dim + ') saturate(.45) blur(' + V.blur + 'px)';
        /* the piece: in the middle of the frame, grown */
        var to = { x: (pw - gw) / 2, y: (ph - gh) / 2, w: gw, h: gh };
        lift.style.left = to.x + 'px'; lift.style.top = to.y + 'px';
        lift.style.width = to.w + 'px'; lift.style.height = to.h + 'px';
        lift.style.transformOrigin = '0 0';
        if (shown) return;
        shown = true;
        plate.classList.add('is-ready');
        if (quiet || !lift.animate || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
        /* the whole floor, then it settles back while the building lifts off it */
        var ease = { duration: 1000, easing: 'cubic-bezier(.25,.7,.15,1)', fill: 'backwards' };
        back.animate([{ transform: 'none' }, { transform: cam }], ease);
        lift.animate([
          { transform: 'translate(' + (start.x - to.x) + 'px,' + (start.y - to.y) + 'px) scale(' + (start.w / to.w) + ')', boxShadow: '0 0 0 0 rgba(0,0,0,0)', filter: 'brightness(.45)' },
          { filter: 'brightness(1)', offset: 0.4 },
          { transform: 'none' }
        ], ease);
      }
      if (back.complete && back.naturalWidth) requestAnimationFrame(lay);
      else back.addEventListener('load', lay);
      if (window.ResizeObserver) new ResizeObserver(function () { lay(); }).observe(plate);
      return holder;
    }

    /* ---- 2 → 3 ------------------------------------------------------------ */
    var sortBy = 'code';
    function selectFloor(fid, keep) {
      var b = buildings.filter(function (x) { return x.id === cur.b; })[0];
      if (!b) return;
      cur.f = fid;
      if (!keep) cur.u = null;
      [].forEach.call(floorsGrid.children, function (c) { c.classList.toggle('is-on', c.dataset.floor === fid); });
      var on = b.rows.filter(function (u) { return u.fid === fid; });
      var av = on.filter(function (u) { return u.sellable; });
      s3.hint.textContent = '— ' + t('{n} available on this floor', { n: av.length });
      unitPanel.textContent = '';
      var head = el('div', 'q-phead');
      head.appendChild(el('p', 'q-pcount', b.label + ' · ' + floorName(fid)));
      var sort = el('select', 'q-select q-sort');
      sort.setAttribute('aria-label', t('Sort the units'));
      [['code', 'Sort: unit number'], ['price', 'Sort: price, low to high'], ['priceD', 'Sort: price, high to low'], ['area', 'Sort: size, small to large']]
        .forEach(function (x) { var op = el('option', null, t(x[1])); op.value = x[0]; sort.appendChild(op); });
      sort.value = sortBy;
      sort.addEventListener('change', function () { sortBy = sort.value; selectFloor(fid, true); });
      head.appendChild(sort);
      unitPanel.appendChild(head);
      var plateNode = floorPlate(b, fid, keep, on);
      if (plateNode) unitPanel.appendChild(plateNode);
      var list = el('div', 'q-units');
      var cmp = {
        code: function (a, c) { return a.code.localeCompare(c.code, 'en', { numeric: true }); },
        price: function (a, c) { return a.listPrice - c.listPrice; },
        priceD: function (a, c) { return c.listPrice - a.listPrice; },
        area: function (a, c) { return a.area - c.area; }
      }[sortBy];
      /* on hold is shown, after the rest, with no price — the salesperson
         needs to know it exists and is held; a customer beside them does
         not need its price */
      /* while a budget is typed, what fits comes first, the best fit on top
         (the same order as the options in Find a unit); the rest keep the sort */
      var sorted = av.slice().sort(cmp);
      if (search.offer) sorted.sort(function (x, y) {
        var fx = fitOf(x), fy = fitOf(y);
        if (!!fx !== !!fy) return fx ? -1 : 1;
        return fx ? (y.listPrice - x.listPrice || y.area - x.area) : 0;
      });
      /* the answer always heads the list, whatever the sort */
      if (search.best) sorted.sort(function (x, y) { return (isAnswer(y) ? 1 : 0) - (isAnswer(x) ? 1 : 0); });
      sorted.concat(on.filter(function (u) { return !u.sellable; })).forEach(function (u) {
        var row = el(u.sellable ? 'button' : 'div', 'q-unit' + (u.sellable ? '' : ' is-held'));
        if (u.sellable) row.type = 'button';
        row.appendChild(el('span', 'q-ucode', u.code));
        row.appendChild(el('span', 'q-umeta', t('{a} m²', { a: money(u.area) }) + ' · ' + useOne(u.type)));
        row.appendChild(el('span', 'q-uprice', u.sellable ? money(u.listPrice) : (MM.tx ? MM.tx.status(u.status) : u.status)));
        var fo = fitOf(u), ans = isAnswer(u);
        var plan = fo ? planName(fo.label) + ' · ' +
          (fo.cash ? t('{v} cash', { v: money(fo.down) }) : t('{down} down · {each} / quarter', { down: money(fo.down), each: money(fo.each) })) : '';
        if (ans) {
          row.appendChild(el('span', 'q-ufit is-best', t(TAG[search.kind] || 'Best fit') + (plan ? ' · ' + plan : '')));
          row.classList.add('is-best');
        } else if (fo) row.appendChild(el('span', 'q-ufit', t('Fits') + ' · ' + plan));
        if (u.sellable) {
          row.classList.toggle('is-on', cur.u === u.code);
          row.addEventListener('click', function () { selectUnit(u.code); });
        }
        row.dataset.code = u.code;
        list.appendChild(row);
      });
      unitPanel.appendChild(list);
      if (search.active) [].forEach.call(list.children, function (row) {
        var u = on.filter(function (x) { return x.code === row.dataset.code; })[0];
        row.classList.toggle('is-nomatch', !!(u && !search.match(u)));
      });
      s3.hidden = false;
      if (!keep) { s4.hidden = true; go(s3); }
      else if (cur.u) selectUnit(cur.u, true);
    }

    /* ---- 3 → 4 ------------------------------------------------------------ */
    var planId = null;
    /* the offer ends by itself; one rule, shared with Find a unit */
    function plansFor(u) { return MM.plans.applicable(p.plans, u.type); }

    /* the plan to offer a unit on, when a budget is typed and the unit fits it
       (Find a unit owns the rule: one answer everywhere) */
    function fitOf(u) {
      return (search.offer && u.sellable && search.match && search.match(u)) ? search.offer(u) : null;
    }

    /* THE ANSWER from Find a unit (build 76): one unit, whichever tab asked,
       green on its building, its floor card, its row and the drawing. The
       other options are the units that answer the same question: they fit
       the budget, or, with filters only, they match. */
    var TAG = { fit: 'Best fit', cheapest: 'Cheapest match', closest: 'Closest — over budget', available: 'Cheapest available' };
    function isAnswer(u) { return !!search.best && u.code === search.best; }
    function isOption(u) {
      if (!u.sellable || isAnswer(u)) return false;
      if (search.offer) return !!fitOf(u);
      return search.kind === 'cheapest' && !!search.match && search.match(u);
    }

    function selectUnit(code, keep) {
      var u = rows.filter(function (x) { return x.code === code && x.sellable; })[0];
      if (!u) return;
      if (!keep) { var fo0 = fitOf(u); if (fo0) planId = fo0.id; }
      cur.u = code;
      [].forEach.call(unitPanel.querySelectorAll('.q-unit, .q-u'), function (r) { r.classList.toggle('is-on', r.dataset.code === code); });
      detail.textContent = '';
      var b = buildings.filter(function (x) { return x.id === cur.b; })[0];

      var card = el('div', 'q-unitcard');
      [['Unit', u.code], ['Floor', floorName(u.fid)], ['Type', useOne(u.type)],
       ['Area', t('{a} m²', { a: money(u.area) })], ['Price', egp(u.listPrice)],
       ['Price per m²', t('{v} EGP/m²', { v: money(u.listPrice / u.area) })]].forEach(function (x) {
        var c = el('div');
        c.appendChild(el('span', 'q-lab', t(x[0])));
        c.appendChild(el('span', 'q-v', x[1]));
        card.appendChild(c);
      });
      detail.appendChild(card);

      var plans = plansFor(u);
      if (!plans.length) {
        detail.appendChild(el('p', 'q-empty', t('No payment plan applies to this unit yet.')));
        s4.hidden = false;
        if (!keep) go(s4);
        return;
      }
      if (!plans.some(function (pl) { return pl.id === planId; })) planId = plans[0].id;
      detail.appendChild(el('p', 'q-k', t('Payment plan')));
      var ps = el('select', 'q-select q-plansel');
      ps.setAttribute('aria-label', t('Payment plan'));
      var groups = {};
      plans.forEach(function (pl) {
        var gk = pl.group || 'other';
        if (!groups[gk]) {
          groups[gk] = el('optgroup');
          groups[gk].label = t((p.planGroups && p.planGroups[gk]) || 'Plans');
          ps.appendChild(groups[gk]);
        }
        var op = el('option', null, planName(pl.label));
        op.value = pl.id;
        groups[gk].appendChild(op);
      });
      ps.value = planId;
      detail.appendChild(ps);
      var figures = el('div', 'q-figs');
      detail.appendChild(figures);
      var actions = el('div', 'q-actions');
      var send = el('button', 'q-cta', t('Send offer on WhatsApp'));
      send.type = 'button';
      var copy = el('button', 'q-ghost', t('Copy offer text'));
      copy.type = 'button';
      var note = el('span', 'q-note');
      /* build 134: once the store has saved an offer PDF it says how many times that offer has gone, and
         this line says so, as the post sheet does: always for a general broadcast, and for a special
         request when it was joined to one sent before (the same unit, the same company, ten minutes). */
      var counted = el('span', 'q-note q-counted'); counted.hidden = true; counted.setAttribute('aria-live', 'polite');
      function paintCounted(e) {
        var n = e ? Number(e.rounds) : 0, broadcast = !(e && e.company_id);
        if (!n || (!broadcast && n < 2)) return;
        counted.textContent = sentWords(e, n, broadcast);
        counted.hidden = false;
      }
      /* build 126: "Copy offer text" is off the page (Muhanad, 2026-10-07). The post has its own "Copy text". */
      actions.appendChild(send); actions.appendChild(note); actions.appendChild(counted);
      var assume = el('ul', 'q-assume');
      (p.assumptions || []).forEach(function (a) { assume.appendChild(el('li', null, t(a))); });

      var current = null;
      function draw() {
        var pl = plans.filter(function (x) { return x.id === ps.value; })[0];
        planId = pl.id;
        var s = MM.plans.schedule({ listPrice: u.listPrice, discount: pl.discount || 0, plan: pl, terms: p.terms });
        figures.textContent = '';
        current = null;
        counted.hidden = true;                                   /* another plan is another offer */
        if (!s || s.broken) {
          /* a schedule that does not foot is not shown at all */
          figures.appendChild(el('p', 'q-empty', t('This plan could not be worked out for this unit, so it is not shown.')));
          send.disabled = copy.disabled = true;
          return;
        }
        send.disabled = copy.disabled = false;
        current = { u: u, pl: pl, s: s, b: b };
        var tiles = el('div', 'q-tiles');
        function tile(k, v, vars) { var d = el('div', 'q-tile'); d.appendChild(el('span', 'q-lab', t(k, vars))); d.appendChild(el('span', 'q-v', v)); tiles.appendChild(d); }
        if (s.discount && !s.cash) tile('Price after {p} off', money(s.payable), { p: pct(s.discountPct) });
        if (s.cash) {
          tile('Cash payment · {p} off', money(s.payable), { p: pct(s.discountPct) });
          tile('You save', money(s.discount));
        } else {
          tile('Down payment', money(s.down));
          tile('Quarterly', money(s.each));
          tile('Instalments', String(s.count));
          tile('Total payable', money(s.payable));
        }
        figures.appendChild(tiles);
        if (search.budget) figures.appendChild(budgetCheck(s));
        if (!s.cash) figures.appendChild(table(s));
      }
      /* against what the agent typed in Find a unit: fits, or by how much it
         is over, and one tap to the plan that does fit */
      function budgetCheck(s) {
        /* a box the agent left empty is zero, never "no limit" (finder.js) */
        var B = search.budget, needC = s.down - (B.cash || 0);
        var needQ = !s.cash ? Math.max(s.each, s.lastInstalment) - (B.quarter || 0) : 0;
        var box = el('div', 'q-budget');
        if (needC <= 0 && needQ <= 0) {
          box.classList.add('is-ok');
          var have = [];
          if (B.cash) have.push(t('{v} down of {of}', { v: money(s.down), of: money(B.cash) }));
          if (B.quarter && !s.cash) have.push(t('{v} a quarter of {of}', { v: money(s.each), of: money(B.quarter) }));
          box.appendChild(el('p', null, t('Within the client’s budget: {list}.', { list: have.join(' · ') })));
          return box;
        }
        box.classList.add('is-over');
        var gaps = [];
        if (needC > 0) gaps.push(t('{v} more cash', { v: money(needC) }));
        if (needQ > 0) gaps.push(t('{v} more a quarter', { v: money(needQ) }));
        box.appendChild(el('p', null, t('Over the client’s budget on this plan: needs {list}.', { list: gaps.join(t(' and ')) })));
        var fo = fitOf(u);
        if (fo && fo.id !== ps.value) {
          var sw = el('button', 'q-ghost q-tiny', t('Switch to {plan}', { plan: planName(fo.label) }));
          sw.type = 'button';
          sw.addEventListener('click', function () { ps.value = fo.id; draw(); });
          box.appendChild(sw);
        }
        return box;
      }
      ps.addEventListener('change', draw);
      draw();

      function offerText() {
        var c = current, s = c.s, lines = [];
        lines.push('*' + l.name + ' · ' + useOne(c.u.type) + ' ' + c.u.code + '*');
        lines.push(c.b.label + ' · ' + floorName(c.u.fid) + ' · ' + t('{a} m²', { a: money(c.u.area) }));
        lines.push(t('Price: {v}', { v: egp(c.u.listPrice) }));
        lines.push(t('Plan: {plan}', { plan: planName(c.pl.label) }) +
          (c.pl.until ? ' ' + t('(offer until {date})', { date: day(new Date(c.pl.until + 'T12:00:00')) }) : ''));
        if (s.discount) lines.push(t('Price after {p} off: {v}', { p: pct(s.discountPct), v: egp(s.payable) }));
        if (s.cash) lines.push(t('Cash payment: {v}', { v: egp(s.payable) }));
        else {
          lines.push(t('Down payment: {v}', { v: egp(s.down) }));
          lines.push(t('Quarterly instalment: {v} × {n}', { v: egp(s.each), n: s.count }));
        }
        lines.push('');
        lines.push(t('Available as of {date}', { date: day(new Date()) }) + (session.name ? ' · ' + session.name : '') + ' · Main Marks');
        return lines.join('\n');
      }
      /* window.open must fire in the click itself, before anything async:
         a popup opened later is blocked silently (playbook 01, 4b) */
      send.addEventListener('click', function () {
        if (!current) return;
        var c = current, demo = demoPhone();
        var withPdf = !!(MM.offerPdf && MM.offerPdf.can(p, c.u));
        function makePdf() {
          return MM.offerPdf.make({ project: p, unit: c.u, plan: c.pl, buildingName: c.b && c.b.name, buildingRows: c.b && c.b.rows });
        }
        /* build 88, THE REAL PHONE does what the demo shows: the offer PDF goes
           into WhatsApp through the phone's own share sheet. The PDF is built
           NOW, while the question below is answered, because an iPhone refuses
           to open the share sheet once the tap has waited for anything; so the
           Continue tap must find it ready (playbook 01: "Build the share file
           when the panel opens"). */
        var made = null, ready = null;
        if (!demo && withPdf) ready = makePdf().then(function (r) { made = r; return r; });
        /* build 84: first, WHO IS IT FOR (developer playbook §13; promised in
           the quotation): a broker's special request, counted for that
           company, or a general broadcast. Then it goes. */
        askAudience(function (who) {
          /* build 90: or as a WhatsApp POST (js/post.js): a picture and a
             caption, the Ayyam / Qomor way, for groups */
          if (who.format === 'post' && MM.post) {
            MM.post.open({
              project: p, line: l, unit: c.u, plan: c.pl, buildingName: c.b && c.b.name, who: who,
              session: session, demo: demo, onSent: sent(who, 'post', c.u, offerKey([{ code: c.u.code, plan: c.pl && c.pl.id }])),
              kit: { handheld: handheld, canShare: canShare, shareOrTimeOut: shareOrTimeOut, saveFile: saveFile, sentWords: sentWords }
            });
            return;
          }
          /* build 83: inside the demo's phone (demo.html), the demo's own
             phone screens answer: its share sheet, the chat, the PDF. */
          if (demo) {
            demo.share({
              text: offerText(), agent: session.name || '', unit: c.u.code,
              audience: who.audience, company: who.company,
              pdf: withPdf ? makePdf : null
            });
            return;
          }
          deliver(made, offerText(), sent(who, 'pdf', c.u, offerKey([{ code: c.u.code, plan: c.pl && c.pl.id }])));       /* still inside the Continue tap */
        }, { ready: ready, withPdf: withPdf });
      });
      /* the offer leaves the app. A phone: the PDF (and the text) through its
         share sheet. A laptop: WhatsApp Web with the text, and the PDF saved to
         attach, because a laptop's share flyout can hang for ever (playbook 01,
         4) and wa.me cannot carry a file (5). No PDF for this unit: the text. */
      function deliver(made, text, leaves) {
        var file = null;
        /* build 134: 'ok' also asks to be told the store's row, for the line above */
        counted.hidden = true;
        var left = function (stage) { if (stage === 'ok') leaves('ok', paintCounted); else leaves(stage); };
        try { if (made) file = new File([made.blob], made.name, { type: 'application/pdf' }); } catch (e) { file = null; }
        /* copy the text FIRST: once the share sheet is open the page has lost
           focus and the clipboard refuses; WhatsApp on an iPhone often drops
           the text that travels with a file */
        if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).catch(function () {});
        if (file && handheld() && canShare({ files: [file] })) {
          var payload = canShare({ files: [file], text: text }) ? { files: [file], text: text } : { files: [file] };
          note.textContent = '';
          left('start');
          shareOrTimeOut(payload).then(function () {
            left('ok');
            note.textContent = t('Offer PDF shared. The text is copied too, in case WhatsApp drops it.');
          }, function (e) {
            if (e && e.name === 'AbortError') { left('no'); return; }          /* the agent closed the sheet: a decision, not a failure */
            left('ok');
            saveFile(file);
            note.textContent = t('Could not open the share sheet, so the PDF was saved. The text is copied.');
          });
          return;
        }
        window.open('https://wa.me/?text=' + encodeURIComponent(text), '_blank', 'noopener');
        left('ok');
        if (file) { saveFile(file); note.textContent = t('WhatsApp opened with the text. The offer PDF is downloaded: attach it there.'); }
      }
      copy.addEventListener('click', function () {
        if (!current) return;
        var txt = offerText();
        var done = function () { note.textContent = t('Copied.'); setTimeout(function () { note.textContent = ''; }, 2200); };
        if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt).then(done, function () { note.textContent = t('Could not copy.'); });
      });
      detail.appendChild(actions);
      detail.appendChild(assume);
      s4.hidden = false;
      if (!keep) go(s4);
    }

    /* Qomor's schedule: year-grouped, the down payment first, each year's
       share of the price on its first row.
       Build 82 (Muhanad, 2026-10-02: "make sure the payment plan table is not
       doubled"): ONE table, one header row. It opens showing the down payment
       and the FIRST 3 YEARS; every later payment is further down the SAME
       table, which scrolls inside itself with its header pinned. (Build 81
       split it into two cards, each with its own header: it read as two
       tables.) A plan of 3 years or less (or cash) never scrolls. */
    /* ---- WHO IS THIS OFFER FOR (build 84) --------------------------
       Asked before every offer leaves the app (developer playbook §13,
       "the question before every offer"; the quotation: "each offer is
       tagged to a brokerage company or marked as general marketing"):
         Special request   a broker asked: the company is named, so the
                           manager's view can count it against them
         General broadcast groups, channels, status: no single company
       The last answer is remembered for the visit (ten offers to one
       company are not ten questions). Main Marks has not sent its brokerage
       list yet, so the company is typed, and the card says so; the demo's
       phone passes the company the request came from. Recorded nowhere yet:
       the activity log is the back end's job. */
    var AUD_KEY = 'mm.audience';
    /* build 127: THE OFFER LEFT THE APP, so it is saved to the store (js/auth.js logOffer; nothing on
       the demo). Called where the share sheet took it or WhatsApp opened, never when the agent closed
       the share sheet. A post of several options is one answer to one request: one row, no unit. */
    var SOLD_AS = { commercial: 'Commercial', admin: 'Offices', fourth: 'The Fourth', wellness: 'Clinics', residence: 'Serviced apartments' };
    /* Returns one function, called with 'start' just before a phone's share sheet opens, 'ok' when the
       offer went, 'no' when the agent closed the sheet. On a phone the row is on the phone before the
       sheet opens, so a page the phone throws away while he is in WhatsApp still saves the offer. */
    /* build 129: WHAT THE OFFER IS, for the store: the unit or units, each with its plan. The same key
       from the same person on the same day is the same general broadcast sent again, and the store
       counts it once (mm_log_offer). items: [{ code, plan: plan id or nothing }] */
    function offerKey(items) {
      return items.map(function (x) { return x && x.code ? String(x.code).toUpperCase() + (x.plan ? ':' + x.plan : '') : ''; }).filter(Boolean).sort().join('+');
    }
    /* build 134: WHAT THE STORE SAYS ABOUT A SEND, in the agent's words (Muhanad, 2026-10-09). A general
       broadcast is one however many times it goes that day; a special request is one when the same unit
       goes again to the same company within ten minutes; a post and a PDF count alike, and when the
       offer went both ways the line says how many of each. e: the store's row; n: how many times it has
       gone (the post sheet counts its own sends ahead of the store's answer). */
    function sentWords(e, n, broadcast) {
      var s = broadcast ? (n === 1 ? t('Sent once. Counted as one broadcast.') : t('Sent {n} times. Counted as one broadcast.', { n: n }))
                        : t('Sent {n} times. Counted as one special request.', { n: n });
      var a = e ? Number(e.sent_pdf) : 0, b = e ? Number(e.sent_post) : 0;
      if (a > 0 && b > 0 && a + b === n) s += ' ' + t('As an offer PDF: {a}. As a WhatsApp post: {b}.', { a: a, b: b });
      return s;
    }
    function sent(who, channel, u, key) {
      var ref = null;
      var row = { company: who && who.audience === 'broker' ? who.company : null, propose: !!(who && who.audience === 'broker' && who.isNew), product: SOLD_AS[l.id] || null, channel: channel,
        unit: u ? u.code : null, area: u ? u.area : null, value: u ? (u.listPrice || u.finalPrice || null) : null, key: key || null };
      /* saved: told the store's row once this send is saved (the post sheet shows its count) */
      return function (stage, saved) {
        if (!MM.auth.offerLeaving) return;
        if (stage === 'start') { ref = MM.auth.offerLeaving(row); return; }
        if (stage === 'no') { MM.auth.offerNotSent(ref); ref = null; return; }
        if (!ref) ref = MM.auth.offerLeaving(row);
        MM.auth.offerLeft(ref, saved); ref = null;
      };
    }
    /* how.ready (build 88): the offer PDF being made for a real phone; Continue
       waits for it, so the share sheet can open inside that tap */
    function askAudience(then, how) {
      var last = null;
      try { last = JSON.parse(sessionStorage.getItem(AUD_KEY) || 'null'); } catch (e) { last = null; }
      var demo = demoPhone(), asked = demo && demo.request && demo.request.company;
      /* build 125: on the store, the admin's list of companies (kept on the phone); otherwise the file's */
      var list = ((MM.auth.companyList && MM.auth.companyList()) || p.brokerages || []).map(function (b) { return typeof b === 'string' ? b : b.name; }).filter(Boolean);

      var box = el('div', 'q q-who');
      box.setAttribute('role', 'dialog'); box.setAttribute('aria-modal', 'true'); box.setAttribute('aria-labelledby', 'qWhoH');
      var dim = el('div', 'q-who-dim');
      var card = el('div', 'q-who-card');
      card.appendChild(el('p', 'q-k', t('Before you send')));
      var h = el('h3', null, t('Who is this offer for?')); h.id = 'qWhoH';
      card.appendChild(h);
      var opts = el('div', 'q-who-opts');
      function opt(a, title, sub) {
        var b = el('button', 'q-who-opt'); b.type = 'button'; b.dataset.a = a;
        b.setAttribute('aria-pressed', 'false');
        b.appendChild(el('b', null, t(title))); b.appendChild(el('span', null, t(sub)));
        b.addEventListener('click', function () { choose(a); });
        opts.appendChild(b);
        return b;
      }
      /* build 140 (Muhanad, 2026-10-10): "the manger will not sent bodcast it is not part of his job". A
         sales manager's offer is the rare one he sends for a sales agent the broker could not reach
         ("the sales in the brokrage company was not able to get on hold of the sales so he reached ihis
         manger"). It always names the company that asked, so it is counted on that company's page, and
         he hands it to that sales agent on Team Pulse afterwards. So he is not offered the general
         broadcast, and the store refuses one from him (mm_log_offer). */
      var session = MM.auth.current && MM.auth.current();
      var forAgent = !!(MM.auth.real && MM.auth.real() && session && session.role === 'sales_manager');
      opt('broker', 'Special request', 'A broker asked for it. Counted for their company.');
      if (!forAgent) opt('broadcast', 'General broadcast', 'Groups, channels, status. No single company.');
      card.appendChild(opts);
      if (forAgent) card.appendChild(el('p', 'q-who-note', t('After sending, hand it to the sales agent on Team Pulse.')));

      /* the company: TYPED, with a dropdown of the brokerage list that
         narrows as you type (build 85; a <datalist> shows nothing on an
         iPhone until you guess a letter, so the list is drawn here). The
         company the request came from is listed first and says so. */
      var co = el('div', 'q-who-co'); co.hidden = true;
      var lab = el('label', 'q-k', t('Which company asked?')); lab.setAttribute('for', 'qWhoIn');
      co.appendChild(lab);
      var field = el('div', 'q-who-field');
      var inp = el('input', 'q-select q-who-in');
      inp.id = 'qWhoIn'; inp.type = 'text'; inp.placeholder = t('Type the brokerage company'); inp.autocomplete = 'off';
      inp.setAttribute('role', 'combobox'); inp.setAttribute('aria-autocomplete', 'list');
      inp.setAttribute('aria-controls', 'qWhoList'); inp.setAttribute('aria-expanded', 'false');
      var drop = el('ul', 'q-who-list'); drop.id = 'qWhoList'; drop.setAttribute('role', 'listbox'); drop.hidden = true;
      field.appendChild(inp); field.appendChild(drop);
      co.appendChild(field);
      /* build 127: on the store, the company is one on the admin's list, or a name he sends for approval */
      var STORE = !!(MM.auth.real && MM.auth.real()), fresh = null;
      /* build 128: THE REAL APP'S FILE CARRIES NO COMPANY LIST (it was readable without signing in). A
         phone that has not fetched the admin's list yet fetches it as this sheet opens. Until it lands
         no name can be sent for approval: against an empty list every company would look unlisted. */
      var loading = STORE && !list.length && !!MM.auth.loadCompanies, listNote = null;
      if (!list.length) {
        listNote = el('span', 'q-who-note', STORE ? t('Loading the companies…') : t('Main Marks’ brokerage list will fill this once it is sent. Type the company for now.'));
        co.appendChild(listNote);
      }
      var newNote = el('p', 'q-who-note'); newNote.hidden = true;
      co.appendChild(newNote);
      card.appendChild(co);

      /* build 90: SEND IT AS the offer PDF or a WhatsApp post (Muhanad,
         2026-10-03: the post beside the PDF, as Ayyam and Qomor have it).
         Until the salesperson picks, it follows the answer above: a broker's
         request gets the PDF, a broadcast gets the post. */
      var fmtBox = el('div', 'q-who-fmt');
      fmtBox.appendChild(el('p', 'q-k', t('Send it as')));
      var fmtOpts = el('div', 'q-who-fmt-opts');
      function fmtOpt(f, title, sub) {
        var b = el('button', 'q-who-opt'); b.type = 'button'; b.dataset.f = f;
        b.setAttribute('aria-pressed', 'false');
        b.appendChild(el('b', null, t(title))); b.appendChild(el('span', null, t(sub)));
        b.addEventListener('click', function () { setFormat(f, true); });
        fmtOpts.appendChild(b);
        return b;
      }
      fmtOpt('pdf', 'Offer PDF', how && how.withPdf === false ? 'Text only: no PDF for this unit yet' : 'The 6-page offer, for one broker');
      fmtOpt('post', 'WhatsApp post', 'A picture and text, for groups');
      fmtBox.appendChild(fmtOpts);
      card.appendChild(fmtBox);
      /* build 96: several options go as a post only, so there is nothing to choose */
      var postOnly = !!(how && how.postOnly);
      fmtBox.hidden = postOnly;
      var format = null, fmtPicked = false;
      function setFormat(f, byHand) {
        format = f;
        if (byHand) fmtPicked = true;
        [].forEach.call(fmtOpts.children, function (b) { b.setAttribute('aria-pressed', String(b.dataset.f === f)); });
        check();
      }

      /* the names offered, and their folded forms for the matching below; set again when the list lands */
      var names = [], folded = {};
      function setNames(l) {
        names = asked && l.indexOf(asked) > 0 ? [asked].concat(l.filter(function (n) { return n !== asked; })) : l;
        folded = {};
        names.forEach(function (n) {
          folded[n] = { all: fold(n), words: String(n).split(/[\s\-_.,&/()]+/).map(fold).filter(Boolean) };
        });
      }
      var hi = -1;
      /* build 91 (Muhanad: "every letter he types, the list filters to
         whatever is close to what he is typing"): FORGIVING matching. Case,
         spaces and punctuation are ignored and Arabic letter forms folded
         (أ إ آ -> ا, ة -> ه, ى -> ي), then, best first: the name starts with
         it, a word in it does ("banker"), it is inside it, its letters come
         in order ("acm" -> Acme), or it is one slip away ("acmi" -> Acme; two
         for six letters or more). Nothing close: the list says so, and the
         name is kept as typed. */
      function fold(s) {
        var out = '', low = String(s).toLowerCase();
        for (var i = 0; i < low.length; i++) {
          var c = low.charCodeAt(i);
          if (c === 0x623 || c === 0x625 || c === 0x622) c = 0x627;
          else if (c === 0x629) c = 0x647;
          else if (c === 0x649) c = 0x64A;
          if ((c >= 0x61 && c <= 0x7a) || (c >= 0x30 && c <= 0x39) || (c >= 0x621 && c <= 0x64A && c !== 0x640)) out += String.fromCharCode(c);
        }
        return out;
      }
      function slips(a, b) {                 /* edit distance */
        var prev = [], cur, i, j;
        for (j = 0; j <= b.length; j++) prev[j] = j;
        for (i = 1; i <= a.length; i++) {
          cur = [i];
          for (j = 1; j <= b.length; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
          prev = cur;
        }
        return prev[b.length];
      }
      setNames(list);
      function score(n, q) {
        var f = folded[n], all = f.all, words = f.words, i, j;
        if (all.indexOf(q) === 0) return 100;
        if (words.some(function (w) { return w.indexOf(q) === 0; })) return 90;
        if (all.indexOf(q) > 0) return 80;
        var heads = [all].concat(words);
        if (q.length >= 2 && heads.some(function (h) {
          if (h[0] !== q[0]) return false;
          for (i = 0, j = 0; i < h.length && j < q.length; i++) if (h[i] === q[j]) j++;
          return j === q.length;
        })) return 60;
        if (q.length >= 3) {
          var allow = q.length >= 6 ? 2 : 1, best = 9;
          heads.forEach(function (h) {
            for (var L = q.length - 1; L <= q.length + 1; L++) if (L > 0 && L <= h.length) best = Math.min(best, slips(q, h.slice(0, L)));
          });
          if (best <= allow) return 50 - best * 5;
        }
        return -1;
      }
      function matches() {
        var q = fold(inp.value);
        if (!q) return names;
        return names.map(function (n, k) { return { n: n, s: score(n, q), k: k }; })
          .filter(function (r) { return r.s > 0; })
          .sort(function (a, b) { return b.s - a.s || a.k - b.k; })
          .map(function (r) { return r.n; });
      }
      /* the typed letters in bold inside the name, where they appear as typed */
      function nameLabel(n) {
        var span = el('span'), q = inp.value.trim(), at = q ? n.toLowerCase().indexOf(q.toLowerCase()) : -1;
        if (at < 0) { span.textContent = n; return span; }
        span.appendChild(document.createTextNode(n.slice(0, at)));
        span.appendChild(el('b', null, n.slice(at, at + q.length)));
        span.appendChild(document.createTextNode(n.slice(at + q.length)));
        return span;
      }
      /* build 91, ON A PHONE the keyboard covers the bottom of the screen and a
         fixed sheet stays behind it. While the company is typed the card keeps
         only the question, the field and the list (class is-picking), the sheet
         is fitted to the part of the screen the keyboard leaves
         (visualViewport), and the list takes the rest of that space. */
      var phone = handheld(), vv = root.visualViewport;
      function fitView() {
        if (!vv) return;
        box.style.top = vv.offsetTop + 'px';
        box.style.height = vv.height + 'px';
        box.style.bottom = 'auto';
      }
      function picking(on) {
        card.classList.toggle('is-picking', !!(on && phone));
        if (on && phone) card.scrollTop = 0;
      }
      function paintDrop(open) {
        var m = matches(), typed = inp.value.trim();
        drop.textContent = '';
        if (!open || (m.length === 1 && m[0] === typed)) {
          drop.hidden = true; inp.setAttribute('aria-expanded', 'false'); return;
        }
        if (!m.length && !STORE) drop.appendChild(el('li', 'q-who-none', t('No company in the list is close to “{typed}”. It will be kept as typed.', { typed: typed })));
        if (hi >= m.length) hi = m.length - 1;
        m.forEach(function (n, i) {
          var li = el('li', 'q-who-item' + (i === hi ? ' is-hi' : ''));
          li.setAttribute('role', 'option'); li.dataset.name = n;
          li.appendChild(nameLabel(n));
          if (n === asked) li.appendChild(el('em', null, t('Sent the request')));
          /* pointerdown, not click: the field's blur would close the list first */
          li.addEventListener('pointerdown', function (e) { e.preventDefault(); pickName(n); });
          drop.appendChild(li);
        });
        /* build 127, ON THE STORE: a name that is not on the list is not kept as typed. He picks a listed
           company, or sends the name to the admin for approval; after three wrong spellings, he cannot. */
        /* no list yet: the line under the field says so, once (the same words in this box read twice) */
        if (STORE && loading) { drop.hidden = true; inp.setAttribute('aria-expanded', 'false'); return; }
        if (STORE && !loading && typed.length >= 2 && !listed(typed)) {
          if (MM.auth.mayPropose()) {
            var add = el('li', 'q-who-item q-who-new');
            add.setAttribute('role', 'option');
            add.appendChild(el('span', null, t('Not on the list? Send “{typed}” to the admin for approval', { typed: typed })));
            add.addEventListener('pointerdown', function (e) { e.preventDefault(); proposeName(typed); });
            drop.appendChild(add);
          } else {
            drop.appendChild(el('li', 'q-who-none', t('“{typed}” is not on the company list. Choose a listed company, or ask the admin to add it.', { typed: typed })));
          }
        }
        if (phone) {
          var room = (vv ? vv.height : root.innerHeight) - 200;
          drop.style.maxHeight = Math.max(150, Math.min(380, room)) + 'px';
        }
        drop.hidden = false; inp.setAttribute('aria-expanded', 'true');
      }
      function listed(typed) {
        var want = String(typed || '').trim().toLowerCase(), i;
        for (i = 0; i < names.length; i++) if (String(names[i]).trim().toLowerCase() === want) return names[i];
        return null;
      }
      function sayNew() {
        newNote.hidden = !fresh;
        if (fresh) newNote.textContent = t('“{name}” goes to the admin for approval. If it is a listed company spelled differently, it counts against you: {n} of 3 so far.', { name: fresh, n: MM.auth.wrongNames() });
      }
      function proposeName(n) {
        fresh = n; inp.value = n; hi = -1; paintDrop(false); sayNew(); check();
        picking(false);
        if (phone) inp.blur();
      }
      function pickName(n) {
        fresh = null; sayNew();
        inp.value = n; hi = -1; paintDrop(false); check();
        picking(false);                      /* the whole card comes back, with Continue */
        if (phone) inp.blur();               /* and the keyboard goes */
      }
      inp.addEventListener('focus', function () { picking(true); paintDrop(true); });
      inp.addEventListener('click', function () { picking(true); paintDrop(true); });   /* a tap on a field that already has focus */
      /* the best match is lit as you type, so Enter / Go picks it */
      inp.addEventListener('input', function () { if (fresh !== null && inp.value.trim() !== fresh) { fresh = null; sayNew(); } picking(true); hi = inp.value.trim() ? 0 : -1; paintDrop(true); });
      inp.addEventListener('blur', function () { setTimeout(function () { paintDrop(false); picking(false); }, 120); });
      inp.addEventListener('keydown', function (e) {
        var m = matches();
        if (e.key === 'ArrowDown') { e.preventDefault(); hi = Math.min(m.length - 1, hi + 1); paintDrop(true); }
        else if (e.key === 'ArrowUp') { e.preventDefault(); hi = Math.max(0, hi - 1); paintDrop(true); }
        else if (e.key === 'Enter' && hi >= 0 && m[hi]) { e.preventDefault(); pickName(m[hi]); }
        else if (e.key === 'Escape' && !drop.hidden) { e.stopPropagation(); paintDrop(false); }
      });

      var acts = el('div', 'q-who-acts');
      var cancel = el('button', 'q-ghost', t('Cancel')); cancel.type = 'button';
      var go2 = el('button', 'q-cta', t('Continue to WhatsApp')); go2.type = 'button';
      var pending = !!(how && how.ready);
      if (pending) {
        how.ready.then(function () { pending = false; check(); },
          function () {
            pending = false; check();
            card.insertBefore(el('p', 'q-who-note', t('The offer PDF could not be made, so the text goes alone.')), acts);
          });
      }
      acts.appendChild(cancel); acts.appendChild(go2);
      card.appendChild(acts);
      box.appendChild(dim); box.appendChild(card);

      var audience = null;
      function choose(a) {
        audience = a;
        [].forEach.call(opts.children, function (b) { b.setAttribute('aria-pressed', String(b.dataset.a === a)); });
        co.hidden = a !== 'broker';
        if (a === 'broker' && !inp.value && !asked) {
          inp.value = (last && last.audience === 'broker' && last.company) || '';
          /* the company he proposed a moment ago is still the one he is sending to */
          if (STORE && !loading && last && last.isNew && inp.value && !listed(inp.value) && MM.auth.mayPropose()) { fresh = inp.value; sayNew(); }
        }
        if (!fmtPicked) setFormat(a === 'broker' ? 'pdf' : 'post', false);
        check();
      }
      function check() {
        var waitPdf = pending && format === 'pdf';
        go2.textContent = waitPdf ? t('Preparing the offer PDF…') : format === 'post' ? t('Make the post') : t('Continue to WhatsApp');
        go2.disabled = waitPdf || !audience || !format || (audience === 'broker' && !inp.value.trim()) ||
          (STORE && audience === 'broker' && !listed(inp.value) && fresh !== inp.value.trim());
      }
      inp.addEventListener('input', check);
      function close() {
        box.classList.remove('in');
        setTimeout(function () { if (box.parentNode) box.parentNode.removeChild(box); }, 300);
        document.removeEventListener('keydown', onKey);
        if (vv) { vv.removeEventListener('resize', fitView); vv.removeEventListener('scroll', fitView); }
      }
      if (vv && phone) { vv.addEventListener('resize', fitView); vv.addEventListener('scroll', fitView); fitView(); }
      function onKey(e) { if (e.key === 'Escape') close(); }
      cancel.addEventListener('click', close);
      dim.addEventListener('click', close);
      document.addEventListener('keydown', onKey);
      go2.addEventListener('click', function () {
        var who = { audience: audience, company: audience === 'broker' ? (STORE && listed(inp.value)) || inp.value.trim() : null, format: format };
        if (STORE && audience === 'broker' && !listed(inp.value)) who.isNew = true;
        /* a post-only send does not change how the next single offer is sent */
        var keep = postOnly ? { audience: who.audience, company: who.company, isNew: who.isNew, format: (last && last.format) || null } : who;
        try { sessionStorage.setItem(AUD_KEY, JSON.stringify(keep)); } catch (e) {}
        close();
        then(who);
      });

      if (loading) {
        MM.auth.loadCompanies().then(function (a) {
          loading = false;
          setNames(a.map(function (b) { return b.name; }).filter(Boolean));
          if (listNote) listNote.hidden = true;
          if (document.activeElement === inp) paintDrop(true);
          check();
        }, function () {
          /* `loading` stays on: nothing is sent for approval against a list that never came */
          if (listNote) listNote.textContent = t('The companies could not be loaded. Check your connection, then open this again.');
          if (document.activeElement === inp) paintDrop(true);
        });
      }

      /* not in the demo (a request on its lock screen): Watch it must always get the PDF */
      if (postOnly) setFormat('post', true);
      else if (last && last.format && !asked) setFormat(last.format, true);
      if (forAgent) choose('broker');
      else if (last && !asked) choose(last.audience); else check();
      document.body.appendChild(box);
      void box.offsetWidth;
      box.classList.add('in');
    }

    var FIRST_YEARS = 3;
    function table(s) {
      var wrap = el('div', 'q-sched-wrap');
      var yearly = {};
      s.rows.forEach(function (r) {
        if (r.kind === 'instalment') { var y = Math.ceil(r.months / 12); yearly[y] = (yearly[y] || 0) + r.amount; }
      });
      var later = s.rows.filter(function (r) { return r.months > FIRST_YEARS * 12; });
      if (!later.length) { wrap.appendChild(sheet(s.rows, yearly, s, 'q-sched')); return wrap; }

      var lastY = Math.ceil(later[later.length - 1].months / 12);
      var box = sheet(s.rows, yearly, s, 'q-sched q-sched-scroll');
      box.setAttribute('tabindex', '0');                  /* scrollable by keyboard too */
      box.setAttribute('role', 'region');
      box.setAttribute('aria-label', t('Payment schedule'));
      wrap.appendChild(box);
      wrap.appendChild(el('p', 'q-sched-hint', t('Year {a} to Year {b}', { a: FIRST_YEARS + 1, b: lastY }) + ' · ' +
        t(later.length === 1 ? '{n} more payment' : '{n} more payments', { n: later.length }) + ' · ' + t('scroll the table')));
      /* the box ends exactly where Year 4 starts, once it is on screen */
      requestAnimationFrame(function () { fitSched(box); });
      return wrap;
    }
    function fitSched(box) {
      var first = [].filter.call(box.querySelectorAll('tbody tr'), function (tr) { return Number(tr.dataset.m) > FIRST_YEARS * 12; })[0];
      if (!first || !box.offsetHeight) return;            /* hidden: keep the CSS height */
      var top = first.getBoundingClientRect().top - box.getBoundingClientRect().top + box.scrollTop;
      box.style.maxHeight = Math.round(top) + 'px';
    }
    window.addEventListener('resize', function () {
      [].forEach.call(document.querySelectorAll('.q-sched-scroll'), function (b) { b.style.maxHeight = ''; fitSched(b); });
    });
    /* one card of rows, with its own header */
    function sheet(rows, yearly, s, cls) {
      var box = el('div', cls);
      var tb = el('table');
      var hr = el('tr');
      ['Year', 'Instalment', 'Date', 'Amount (EGP)', '%', 'Yearly %'].forEach(function (h) { hr.appendChild(el('th', null, t(h))); });
      var thead = el('thead'); thead.appendChild(hr); tb.appendChild(thead);
      var body = el('tbody');
      var seenYear = {};
      rows.forEach(function (r) {
        var tr = el('tr');
        if (r.kind === 'down') {
          if (!r.amount) return;                       /* 0% down: no row */
          tr.className = 'is-dp';
          tr.appendChild(el('td', null, t('DP')));
          tr.appendChild(el('td', null, t('Down payment')));
          tr.appendChild(el('td', null, tday(r.due)));
          tr.appendChild(el('td', 'num', money(r.amount)));
          tr.appendChild(el('td', 'num', pct(r.amount / s.payable, 2)));
          tr.appendChild(el('td', 'num', pct(r.amount / s.payable, 2)));
        } else {
          var y = Math.ceil(r.months / 12), first = !seenYear[y];
          seenYear[y] = true;
          if (first) tr.className = 'is-year';
          tr.appendChild(el('td', null, first ? t('Year {y}', { y: y }) : ''));
          tr.appendChild(el('td', null, t('Inst. {n}', { n: r.no })));
          tr.appendChild(el('td', null, tday(r.due)));
          tr.appendChild(el('td', 'num', money(r.amount)));
          tr.appendChild(el('td', 'num', pct(r.amount / s.payable, 2)));
          tr.appendChild(el('td', 'num', first ? pct(yearly[y] / s.payable, 2) : ''));
        }
        tr.dataset.m = r.months;
        body.appendChild(tr);
      });
      tb.appendChild(body);
      box.appendChild(tb);
      return box;
    }

    load();
  }

  MM.lineFlow = lineFlow;
  MM.lineFlow.floorId = floorId;
}(typeof window !== 'undefined' ? window : globalThis));
