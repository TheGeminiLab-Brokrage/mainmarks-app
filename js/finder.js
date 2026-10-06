/* ------------------------------------------------------------------
   Main Marks — "Find a unit", the closed bar above step 1 (build 69).

   Ported from the CCR app's Ayyam finder (CCR Development App,
   js/finder.js; playbook 01, "A FILTER THAT LIGHTS THE MASTERPLAN…",
   rounds 1-4), cut to a mixed-use project: no bedrooms; size, floor,
   price ceiling and "include on hold" instead. Brief §5b.

   Built for the question a broker actually asks — "a clinic around
   80 m² under 15 million" — when nobody remembers which building holds
   what.

   Closed by default. Closed, it still says what is applied and how many
   units match, so a filter can never hide units unseen. Open: two tabs,
   BY UNIT and CLIENT BUDGET, which apply together.

   CLIENT BUDGET asks what a buyer knows: cash now (the down payment)
   and what they can pay PER QUARTER — every Main Marks plan is
   quarterly. Each unit is tested on every plan that applies to it
   TODAY (MM.plans.applicable: the offer ends 15 Oct 2026 by itself and
   never applies to Commercial) through MM.plans.schedule, the engine
   step 4 uses, so the search and the offer can never disagree. It hands
   back EVERY unit the budget reaches (build 73, Muhanad: "best fit or
   things lower than what he typed"): the best fit first, then the
   cheaper ones, each with the plan to offer it on (offerFor) and what is
   left of the budget. When nothing fits, the nearest miss with both
   gaps, and each lever that would bring units in, with its own Apply.

   It OWNS NOTHING. It reads the rows the line page already loaded, and
   every tap ends in the page's own select path.

   WHAT IS ASKED comes from the PROJECT, not from today's sheet (build 112,
   Muhanad: "we are building the whole project ... make sure it adapts to
   the end version, not what we have today in the inventory"). Each line
   names its own questions in config (`filters`): its floors, its size
   bands and its own facets (Commercial: the tenant kind; The Fourth: the
   terrace; R- Residence: the unit type), all read off the brochures. The
   sheet only says what can be sold TODAY: an option with nothing available
   is still shown, dimmed, and cannot be chosen. Prices stay derived from
   the rows: the sheet is the only place a price exists.
   ------------------------------------------------------------------ */
(function (root) {
  'use strict';
  var MM = root.MM || (root.MM = {});

  /* Round numbers a person says out loud; a unit belongs to exactly one.
     Only the bands that hold a unit are offered. Tuned to Moray's sheet
     (clinics 51-118 m², offices 48-571): fine where clinics sit, broad
     where only big offices are. */
  var SIZE_BANDS = [
    { id: 'b60',  label: 'Up to 60 m²',  lo: 0,   hi: 60 },
    { id: 'b80',  label: '61–80 m²',     lo: 60,  hi: 80 },
    { id: 'b100', label: '81–100 m²',    lo: 80,  hi: 100 },
    { id: 'b120', label: '101–120 m²',   lo: 100, hi: 120 },
    { id: 'b150', label: '121–150 m²',   lo: 120, hi: 150 },
    { id: 'b200', label: '151–200 m²',   lo: 150, hi: 200 },
    { id: 'b300', label: '201–300 m²',   lo: 200, hi: 300 },
    { id: 'bmax', label: 'Over 300 m²',  lo: 300, hi: Infinity }
  ];
  /* When what is left comes in this many sizes or fewer, the real sizes
     are offered ("95 m²") instead of ranges (Ayyam, round 3). */
  var EXACT_UP_TO = 8;
  /* A fixed round ladder trimmed to the rows — quartiles gave odd
     ceilings on CCR because one type dominated the sheet. */
  var LADDER = [10, 12, 15, 20, 25, 30, 50, 75, 100].map(function (m) { return m * 1e6; });

  var ORDER = ['street', 'ground', 'first', 'second', 'third', 'fourth', 'fifth'];
  /* "add this much and N more units come into reach", one whole sentence each */
  var LEVER = [
    'Add EGP {gap} a quarter and one more unit comes into reach.', 'Add EGP {gap} a quarter and {n} more units come into reach.',
    'Add EGP {gap} cash and one more unit comes into reach.', 'Add EGP {gap} cash and {n} more units come into reach.',
    'Or add EGP {gap} a quarter and one more unit comes into reach.', 'Or add EGP {gap} a quarter and {n} more units come into reach.',
    'Or add EGP {gap} cash and one more unit comes into reach.', 'Or add EGP {gap} cash and {n} more units come into reach.'
  ];
  var FLOOR = { street: 'Street', ground: 'Ground', first: '1st', second: '2nd', third: '3rd', fourth: '4th', fifth: '5th' };

  function money(v) { return Math.round(v).toLocaleString('en-US'); }
  function millions(v) { return (Math.round(v / 1e4) / 100).toString().replace(/\.0+$/, '') + 'M'; }
  /* 55,500 reads "55.5k", never "56k": a summary must not round a budget
     up past what the client said */
  function short(v) { return !v ? '0' : v >= 1e6 ? millions(v) : (Math.round(v / 100) / 10).toString().replace(/\.0$/, '') + 'k'; }
  function roundUpTo(n, step) { return Math.ceil(n / step) * step; }

  /* What a salesperson types: "8m", "500k", "8,000,000", "٨٠٠٠٠٠٠",
     "8 مليون". Digits go through the app's one number reader, so an
     Arabic-locale entry is never read 10x too large. */
  function readAmount(text) {
    var s = String(text || '').trim();
    if (!s) return null;
    var mil = /(m|mn|million|مليون)\s*$/i.test(s);
    var thou = /(k|thousand|الف|ألف)\s*$/i.test(s);
    var v = MM.inventory.num(s);
    /* "0" is an answer — the client has no cash — not an empty box */
    if (v === null || !(v >= 0)) return null;
    if (mil) v *= 1e6; else if (thou) v *= 1e3;
    return Math.round(v);
  }

  /* o: { project, useWord, nameOf(buildingKey) } */
  function finder(o) {
    var el = MM.el, t = MM.t;
    var p = o.project;
    var F = o.filters || {};
    var facets = F.facets || [];
    var BANDS = F.sizes || SIZE_BANDS;
    var every = (p.terms && p.terms.instalmentEvery) || 3;
    var nameOf = o.nameOf || function (k) { return t('Building {b}', { b: k }); };
    /* build 92: the sheet's floor words in the app's language */
    var fl = function (f) { return MM.tx ? MM.tx.floorShort(f, FLOOR[f] || f) : (FLOOR[f] || f); };
    var flFull = function (f) { return MM.tx ? MM.tx.floor(f, (FLOOR[f] || f) + ' floor') : (FLOOR[f] || f) + ' floor'; };
    var plan = function (label) { return MM.tx ? MM.tx.plan(label) : label; };
    var join = function (a) { return MM.tx ? MM.tx.list(a) : a.join(', '); };

    var box = el('div', 'fd');
    box.setAttribute('role', 'search');
    box.setAttribute('aria-label', t('Find a unit'));

    /* ---- the closed bar ---- */
    var bar = el('div', 'fd-bar');
    var toggle = el('button', 'fd-toggle');
    toggle.type = 'button';
    toggle.setAttribute('aria-expanded', 'false');
    toggle.insertAdjacentHTML('beforeend',
      '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" ' +
      'stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5"/></svg>');
    toggle.appendChild(el('span', null, t('Find a unit')));
    var chev = el('span', 'fd-chev');
    chev.setAttribute('aria-hidden', 'true');
    toggle.appendChild(chev);
    bar.appendChild(toggle);
    var summary = el('p', 'fd-summary');
    summary.setAttribute('aria-live', 'polite');
    bar.appendChild(summary);
    var clear = el('button', 'fd-clear', t('Clear'));
    clear.type = 'button';
    clear.hidden = true;
    bar.appendChild(clear);
    box.appendChild(bar);

    /* ---- the open panel ---- */
    var body = el('div', 'fd-body');
    body.hidden = true;
    box.appendChild(body);
    var modes = el('div', 'fd-modes');
    modes.setAttribute('role', 'tablist');
    body.appendChild(modes);
    var paneUnit = el('div', 'fd-pane');
    var paneBudget = el('div', 'fd-pane');
    paneBudget.hidden = true;
    body.appendChild(paneUnit);
    body.appendChild(paneBudget);
    var shared = el('div', 'fd-shared');
    body.appendChild(shared);
    var result = el('div', 'fd-result');
    body.appendChild(result);
    paneUnit.appendChild(el('p', 'fd-wait', t('Loading units…')));

    var S = { sizes: [], floors: [], facets: {}, max: null, hold: false, cash: null, quarter: null };
    var units = [], listeners = [], chips = [];
    var pickBuilding = null, showUnit = null, showAll = false, sendOptions = null;
    var has = function (a, v) { return a.indexOf(v) >= 0; };
    var flip = function (a, v) { var i = a.indexOf(v); if (i >= 0) a.splice(i, 1); else a.push(v); };

    /* ---- each unit on each plan that applies to it today, worked once,
       through the engine step 4 uses ---- */
    var fitCache = {};
    function plansFor(u) {
      if (fitCache[u.code]) return fitCache[u.code];
      fitCache[u.code] = MM.plans.applicable(p.plans, u.type).map(function (pl) {
        var s = MM.plans.schedule({ listPrice: u.listPrice, discount: pl.discount || 0, plan: pl, terms: p.terms });
        if (!s || s.broken) return null;          /* fail closed: a plan that does not foot fits nobody */
        /* `quarter` is what is TESTED: the larger of the regular and the last
           instalment (the last absorbs the rounding), so a fit is never off
           by a few pounds. `each` is what is SHOWN: the regular instalment,
           the figure step 4 shows, so the two screens never disagree. */
        return { id: pl.id, label: pl.label, cash: !!s.cash, down: s.down, payable: s.payable,
                 quarter: s.cash ? 0 : Math.max(s.each, s.lastInstalment), each: s.cash ? 0 : s.each };
      }).filter(Boolean);
      return fitCache[u.code];
    }
    /* NEVER ASSUME MONEY THE CLIENT DID NOT SAY HE HAS (2026-10-03). Once a
       budget is typed, a box left empty counts as ZERO, never "no limit":
       only "400k a quarter" typed used to answer "spot cash 12.2M", and
       only cash typed answered a plan at 1.07M a quarter. Now only a
       quarter typed reaches plans with no down payment, and only cash
       typed reaches cash plans; everything shown is surely affordable. */
    function cap(key) { return S[key] === null ? 0 : S[key]; }
    function fitsAt(f, cash, quarter) {
      return f.down <= (cash || 0) && f.quarter <= (quarter || 0);
    }
    function fitting(u) { return plansFor(u).filter(function (f) { return fitsAt(f, S.cash, S.quarter); }); }
    var budgetOn = function () { return S.cash !== null || S.quarter !== null; };

    /* THE PLAN TO OFFER a unit on, when more than one fits the budget: the
       one that costs the client least in total (usually the biggest
       discount that still fits), then the smaller down payment. One rule,
       used by the options list, the unit list, the drawing and step 4,
       so the agent is never shown two different answers. */
    function offerFor(u) {
      var fs = fitting(u);
      if (!fs.length) return null;
      return fs.slice().sort(function (a, b) { return a.payable - b.payable || a.down - b.down; })[0];
    }
    /* every sellable unit the search allows that the budget reaches, the
       most the budget reaches FIRST (the best fit), then the cheaper ones */
    function options() {
      if (!budgetOn()) return [];
      return units.filter(function (u) { return u.sellable && match(u); })
        .map(function (u) { return { u: u, f: offerFor(u) }; })
        .filter(function (x) { return x.f; })
        .sort(function (a, b) { return b.u.listPrice - a.u.listPrice || b.u.area - a.u.area || a.u.code.localeCompare(b.u.code, 'en', { numeric: true }); });
    }

    /* "Active" = the salesperson asked for something. Available-only is
       the default, not a question, so on its own it lights nothing. */
    function active() {
      return !!(S.sizes.length || S.floors.length || S.max || S.hold || budgetOn() ||
        facets.some(function (f) { return chosen(f).length; }));
    }

    /* Available is the sellable test itself, so a status the app does not
       know is never searched as available. On hold is shown when asked
       for (salespeople check holds); it is never opened as an offer. */
    function statusOk(u) { return u.sellable || (S.hold && u.status === 'On hold'); }
    function sizeOk(u) {
      if (!S.sizes.length) return true;
      return S.sizes.some(function (k) {
        if (k.charAt(0) === 'a') return u.area === +k.slice(1);
        var b = BANDS.filter(function (x) { return x.id === k; })[0];
        return b && u.area > b.lo && u.area <= b.hi;
      });
    }
    function floorOk(u) { return !S.floors.length || has(S.floors, u.fid); }

    /* ---- A FACET: a question only this product has (config `filters.facets`).
       Which option a unit is, in this order: what the SHEET says (the facet's
       `column`, matched on each option's `words`; `positive` for a number such
       as a terrace area), then the project's own `rules` read off the brochure
       (by unit code or floor), then `otherwise`. A unit nothing places answers
       no option (fail closed): it stays in the lists and matches no chip. ---- */
    var facetCache = {};
    function chosen(f) { return S.facets[f.id] || (S.facets[f.id] = []); }
    function norm(s) { return String(s == null ? '' : s).toUpperCase().replace(/[^A-Z0-9]/g, ''); }
    function facetOf(u, f) {
      var k = f.id + '|' + u.code;
      if (k in facetCache) return facetCache[k];
      var v = null;
      var said = f.column ? String(u[f.column] == null ? '' : u[f.column]).trim().toLowerCase() : '';
      if (said && f.positive) { if (MM.inventory.num(said) > 0) v = f.positive; }
      else if (said) {
        f.options.forEach(function (op) {
          if (v === null && (op.words || [op.label]).some(function (w) { return said.indexOf(String(w).toLowerCase()) !== -1; })) v = op.id;
        });
      }
      if (v === null) {
        var code = norm(u.code);
        (f.rules || []).some(function (r) {
          if (r.floors && r.floors.indexOf(u.fid) === -1) return false;
          if (r.codes && r.codes.map(norm).indexOf(code) === -1) return false;
          if (r.starts && !r.starts.some(function (s) { return code.indexOf(norm(s)) === 0; })) return false;
          v = r.is;
          return true;
        });
      }
      if (v === null && f.otherwise) v = f.otherwise;
      return (facetCache[k] = v);
    }
    function facetOk(u, skip) {
      return facets.every(function (f) {
        var c = chosen(f);
        return skip === 'facet:' + f.id || !c.length || has(c, facetOf(u, f));
      });
    }
    function priceOk(u) { return !S.max || u.listPrice <= S.max; }

    /* everything but one test, so that test's chips can be offered from it */
    function rest(u, skip) {
      if (!statusOk(u)) return false;
      if (skip !== 'size' && !sizeOk(u)) return false;
      if (skip !== 'floor' && !floorOk(u)) return false;
      if (skip !== 'price' && !priceOk(u)) return false;
      if (!facetOk(u, skip)) return false;
      if (skip !== 'budget' && budgetOn() && !fitting(u).length) return false;
      return true;
    }
    function match(u) { return rest(u, null); }

    /* ---- when nothing fits: the nearest miss, on the share of the budget
       it would need on whichever lever is tighter; ties to the lower price */
    function share(need, have) { return need <= 0 ? 0 : (have > 0 ? need / have : Infinity); }
    function score(f) {
      return Math.max(share(f.down, cap('cash')), share(f.quarter, cap('quarter')));
    }
    function nearestMiss(minArea) {
      var best = null, bs = Infinity;
      units.forEach(function (u) {
        if (!u.sellable || !rest(u, 'budget') || fitting(u).length) return;
        if (minArea && !(u.area > minArea)) return;
        plansFor(u).forEach(function (f) {
          var s = score(f);
          if (s < bs || (s === bs && best && u.listPrice < best.u.listPrice)) { bs = s; best = { u: u, f: f, s: s }; }
        });
      });
      return best;
    }

    /* ---- THE TWO SIDE CARDS (build 94, Muhanad 2026-10-03) -----------
       The best fit stays the most the budget reaches: deal size is never
       traded for advice. Beside it, what a senior salesperson also puts in
       front of the broker:
         value   — the lowest price per m² among the units that fit
         stretch — the unit just over the budget that needs the least
                   extra, with exactly what it needs. It must be BIGGER
                   than the best fit: paying more for less is not an
                   upsell anyone can sell. Not offered past
                   STRETCH_MAX of the tighter box: that is not a stretch.
       An upsell works when the dearer unit is in front of the broker with
       its exact extra cost; it fails when it is hidden behind "See more". */
    var STRETCH_MAX = 1.25;
    function perM2(u) { return u.listPrice / u.area; }
    function bestValue(opts) {
      if (opts.length < 2) return null;
      return opts.slice().sort(function (a, b) {
        return perM2(a.u) - perM2(b.u) || b.u.area - a.u.area || a.u.code.localeCompare(b.u.code, 'en', { numeric: true });
      })[0];
    }
    function stretch(top) {
      var m = nearestMiss(top.area);
      return m && m.s <= STRETCH_MAX ? m : null;
    }
    function countAt(cash, quarter) {
      var n = 0;
      units.forEach(function (u) {
        if (u.sellable && rest(u, 'budget') && plansFor(u).some(function (f) { return fitsAt(f, cash, quarter); })) n++;
      });
      return n;
    }
    /* The smallest rise on EACH lever that brings at least one more unit
       in — the client may have spare cash but not spare income, or the
       reverse (Ayyam, round 4). Read off the rows, not a fixed probe.
       The smaller proportional rise is listed first. */
    function levers(have) {
      if (!budgetOn()) return [];
      var needQ = null, needC = null, hc = cap('cash'), hq = cap('quarter');
      units.forEach(function (u) {
        if (!u.sellable || !rest(u, 'budget')) return;
        var fs = plansFor(u);
        if (fs.some(function (f) { return fitsAt(f, S.cash, S.quarter); })) return;
        fs.forEach(function (f) {
          if (f.down <= hc && f.quarter > hq && (needQ === null || f.quarter < needQ)) needQ = f.quarter;
          if (f.quarter <= hq && f.down > hc && (needC === null || f.down < needC)) needC = f.down;
        });
      });
      var out = [];
      if (needQ !== null) {
        var q = roundUpTo(needQ, 5000), n1 = countAt(S.cash, q) - have;
        if (n1 > 0) out.push({ key: 'quarter', value: q, gap: q - hq, n: n1, rise: share(q - hq, hq) });
      }
      if (needC !== null) {
        var c = roundUpTo(needC, 10000), n2 = countAt(c, S.quarter) - have;
        if (n2 > 0) out.push({ key: 'cash', value: c, gap: c - hc, n: n2, rise: share(c - hc, hc) });
      }
      out.sort(function (a, b) { return a.rise - b.rise; });
      return out;
    }

    /* ---- building blocks ---- */
    function row(parent, label, list) {
      var r = el('div', 'fd-row');
      r.appendChild(el('span', 'fd-label', label));
      var wrap = el('div', 'fd-chips');
      list.forEach(function (c) { wrap.appendChild(c); });
      r.appendChild(wrap);
      parent.appendChild(r);
      return { row: r, wrap: wrap };
    }
    /* `isEmpty`: the project has this option but nothing of it can be sold today:
       shown, dimmed, not a button (build 112) */
    function chip(text, isOn, onTap, isEmpty) {
      var b = el('button', 'fd-chip', text);
      b.type = 'button';
      b.__sync = function () {
        b.setAttribute('aria-pressed', String(!!isOn()));
        if (isEmpty) b.disabled = !isOn() && !!isEmpty();
      };
      b.addEventListener('click', function () { onTap(); showAll = false; optsAll = false; changed(); });
      b.__sync();
      chips.push(b);
      return b;
    }
    var tabs = [];
    function mode(label, pane, on) {
      var b = el('button', 'fd-mode', label);
      b.type = 'button';
      b.setAttribute('role', 'tab');
      b.setAttribute('aria-selected', String(!!on));
      b.addEventListener('click', function () {
        tabs.forEach(function (x) { x.b.setAttribute('aria-selected', String(x.b === b)); x.pane.hidden = x.b !== b; });
        if (units.length) changed();
      });
      tabs.push({ b: b, pane: pane });
      modes.appendChild(b);
    }
    mode(t('By unit'), paneUnit, true);
    mode(t('Client budget'), paneBudget, false);

    /* the budget boxes are built once, so typing is never interrupted */
    function amountBox(key, label, unit, placeholder) {
      var wrap = el('label', 'fd-amount');
      wrap.appendChild(el('span', 'fd-label', label));
      var field = el('span', 'fd-amount-in');
      field.appendChild(el('span', 'fd-cur', 'EGP'));
      var input = el('input');
      input.type = 'text';
      input.inputMode = 'decimal';
      input.placeholder = placeholder;
      input.autocomplete = 'off';
      field.appendChild(input);
      if (unit) field.appendChild(el('span', 'fd-cur', unit));
      wrap.appendChild(field);
      var read = el('span', 'fd-amount-read');
      wrap.appendChild(read);
      input.addEventListener('input', function () { S[key] = readAmount(input.value); showAll = false; optsAll = false; changed(key); });
      return { node: wrap, input: input, read: read, key: key };
    }
    var boxCash = amountBox('cash', t('Cash now'), '', t('the down payment, e.g. 2m'));
    var boxQuarter = amountBox('quarter', t('Per quarter'), t('/ quarter'), t('e.g. 400k'));
    var boxes = [boxCash, boxQuarter];

    var floorList = [], sizeRow = null, priceRow = null;

    /* "Floors ▾": one chip that opens IN the flow under its row, never a
       popover that can run off a phone (CCR, 2026-09-14). The button reads
       out the choice, so it is visible with the list shut. */
    function floorPicker() {
      var btn = el('button', 'fd-chip fd-floor-btn');
      btn.type = 'button';
      btn.setAttribute('aria-expanded', 'false');
      var label = el('span', null, t('Floors'));
      btn.appendChild(label);
      var cv = el('span', 'fd-chev fd-chev-sm');
      cv.setAttribute('aria-hidden', 'true');
      btn.appendChild(cv);
      var menu = el('div', 'fd-floor-menu');
      menu.hidden = true;
      var list = el('div', 'fd-chips');
      menu.appendChild(list);
      list.appendChild(chip(t('Any floor'), function () { return !S.floors.length; }, function () { S.floors = []; }));
      floorList.forEach(function (f) {
        list.appendChild(chip(fl(f), function () { return has(S.floors, f); }, function () { flip(S.floors, f); },
          function () { return !units.some(function (u) { return u.fid === f && rest(u, 'floor'); }); }));
      });
      var done = el('button', 'fd-more', t('Done'));
      done.type = 'button';
      menu.appendChild(done);
      function setMenu(open) {
        menu.hidden = !open;
        btn.setAttribute('aria-expanded', String(open));
        btn.classList.toggle('is-open', open);
      }
      btn.addEventListener('click', function () { setMenu(menu.hidden); });
      done.addEventListener('click', function () { setMenu(false); btn.focus(); });
      btn.__sync = function () {
        btn.setAttribute('aria-pressed', String(S.floors.length > 0));
        label.textContent = !S.floors.length ? t('Floors')
          : t('Floors: {list}', { list: join(floorList.filter(function (f) { return has(S.floors, f); }).map(fl)) });
      };
      btn.__sync();
      chips.push(btn);
      return { btn: btn, menu: menu };
    }

    /* With nothing asked, a shortcut to the cheapest available unit. Once
       anything is asked, THE ANSWER card (below) takes its place. Tapped,
       the unit is "pinned": it is the answer, and glows, until the search
       changes (Muhanad, 2026-10-02: "the unit must always glow"). */
    var cheapest = el('button', 'fd-pick');
    cheapest.type = 'button';
    cheapest.hidden = true;
    var cheapestU = null, pinned = null;
    cheapest.addEventListener('click', function () {
      if (!cheapestU) return;
      pinned = cheapestU.code;
      changed(null, true);
      if (showUnit) showUnit(cheapestU, null);
    });
    function cheapFirst(a, b) {
      return a.listPrice - b.listPrice || b.area - a.area || a.code.localeCompare(b.code, 'en', { numeric: true });
    }

    function build() {
      chips = [];
      paneUnit.textContent = '';
      paneBudget.textContent = '';
      shared.textContent = '';
      floorList = (F.floors || []).slice();          /* the product's floors, then any other the sheet names */
      units.forEach(function (u) { if (!has(floorList, u.fid)) floorList.push(u.fid); });
      floorList.sort(function (a, b) { return ORDER.indexOf(a) - ORDER.indexOf(b); });

      /* -- by unit -- */
      facets.forEach(function (f) {
        row(paneUnit, t(f.label), f.options.map(function (op) {
          return chip(t(op.label), function () { return has(chosen(f), op.id); }, function () { flip(chosen(f), op.id); },
            function () { return !units.some(function (u) { return facetOf(u, f) === op.id && rest(u, 'facet:' + f.id); }); });
        }));
      });
      sizeRow = row(paneUnit, t('Size'), []);          /* filled on every change, from what is left */
      priceRow = row(paneUnit, t('Price up to'), []);
      var fp = floorPicker();
      row(paneUnit, t('Floor'), [fp.btn]);
      paneUnit.appendChild(fp.menu);
      paneUnit.appendChild(cheapest);

      /* -- client budget -- */
      boxes.forEach(function (b) { paneBudget.appendChild(b.node); });
      var fp2 = floorPicker();
      row(paneBudget, t('Floor'), [fp2.btn]);
      paneBudget.appendChild(fp2.menu);

      /* -- applies to both -- */
      var holds = units.filter(function (u) { return u.status === 'On hold'; }).length;
      if (holds) row(shared, t('Show'), [chip(t('Include on hold') + ' · ' + holds, function () { return S.hold; }, function () { S.hold = !S.hold; })]);
    }

    /* ---- options follow each other (Ayyam, round 3). A chosen option
       that no longer exists is DROPPED, never left matching nothing. ---- */
    function renderSizes() {
      var areas = [];
      units.forEach(function (u) { if (rest(u, 'size') && !has(areas, u.area)) areas.push(u.area); });
      areas.sort(function (a, b) { return a - b; });
      var narrowed = S.floors.length || S.max || budgetOn();
      /* the product's own bands (config) are ALWAYS all on show; one with nothing in it is dimmed */
      var fixed = !!F.sizes;
      var live = function (b) { return areas.some(function (a) { return a > b.lo && a <= b.hi; }); };
      var offer = fixed ? BANDS.map(function (b) { return { k: b.id, label: t(b.label), none: !live(b) }; })
        : (narrowed && areas.length && areas.length <= EXACT_UP_TO)
        ? areas.map(function (a) { return { k: 'a' + a, label: t('{a} m²', { a: money(a) }) }; })
        : SIZE_BANDS.filter(function (b) { return areas.some(function (a) { return a > b.lo && a <= b.hi; }); })
            .map(function (b) { return { k: b.id, label: t(b.label) }; });
      var keys = offer.filter(function (x) { return !x.none; }).map(function (x) { return x.k; });
      S.sizes = S.sizes.filter(function (k) { return has(keys, k); });
      chips = chips.filter(function (c) { return !c.__size; });
      sizeRow.wrap.textContent = '';
      offer.forEach(function (x) {
        var c = chip(x.label, function () { return has(S.sizes, x.k); }, function () { flip(S.sizes, x.k); },
          function () { return !!x.none; });
        c.__size = true;
        sizeRow.wrap.appendChild(c);
      });
      if (!offer.length) sizeRow.wrap.appendChild(el('span', 'fd-none', t('No sizes left for this search')));
    }
    /* a chosen facet option that no longer holds a unit is dropped, like a size */
    function pruneFacets() {
      facets.forEach(function (f) {
        S.facets[f.id] = chosen(f).filter(function (id) {
          return units.some(function (u) { return facetOf(u, f) === id && rest(u, 'facet:' + f.id); });
        });
      });
    }
    /* A ceiling below the cheapest unit left matches nothing, and one at
       or above the dearest matches everything: neither is offered. But a
       ceiling the salesperson CHOSE stays on show while it is still true —
       picking 61-80 m² (all under 15M) must not make their 15M vanish.
       It is dropped only when it would match nothing. */
    function renderPrices() {
      var lo = Infinity, hi = 0;
      units.forEach(function (u) {
        if (!rest(u, 'price')) return;
        lo = Math.min(lo, u.listPrice); hi = Math.max(hi, u.listPrice);
      });
      if (S.max && !(S.max >= lo)) S.max = null;
      var offer = LADDER.filter(function (r) { return r >= lo && (r < hi || r === S.max); });
      chips = chips.filter(function (c) { return !c.__price; });
      priceRow.wrap.textContent = '';
      offer.forEach(function (r) {
        var c = chip(millions(r), function () { return S.max === r; }, function () { S.max = S.max === r ? null : r; });
        c.__price = true;
        priceRow.wrap.appendChild(c);
      });
      if (!offer.length) priceRow.wrap.appendChild(el('span', 'fd-none', t('One price band left')));
    }
    function floorWords() {
      return t('{floors} floor', { floors: join(floorList.filter(function (f) { return has(S.floors, f); }).map(fl)) });
    }
    function sizeWord(k) {
      if (k.charAt(0) === 'a') return t('{a} m²', { a: money(+k.slice(1)) });
      var b = BANDS.filter(function (x) { return x.id === k; })[0];
      return b ? t(b.label) : k;
    }
    function describe() {
      var bits = [o.useWord || ''];
      facets.forEach(function (f) {
        var c = f.options.filter(function (op) { return has(chosen(f), op.id); }).map(function (op) { return t(op.label); });
        if (c.length) bits.push(c.join(t(' or ')));
      });
      if (S.sizes.length) bits.push(S.sizes.map(sizeWord).join(t(' or ')));
      if (S.floors.length) bits.push(floorWords());
      if (S.max) bits.push(t('up to {v}', { v: millions(S.max) }));
      if (S.cash !== null) bits.push(t('cash {v}', { v: short(S.cash) }));
      if (S.quarter !== null) bits.push(t('{v} a quarter', { v: short(S.quarter) }));
      if (S.hold) bits.push(t('+ on hold'));
      return bits.filter(Boolean).join(' · ');
    }
    function where(u) { return nameOf(u.building) + ' · ' + flFull(u.fid) + ' · ' + u.code; }

    function fillPick(btn, k, u, lines) {
      btn.textContent = '';
      btn.appendChild(el('span', 'fd-pk', k));
      btn.appendChild(el('span', 'fd-pv', money(u.listPrice)));
      lines.forEach(function (s) { btn.appendChild(el('span', 'fd-pw', s)); });
    }

    /* ---- the options: what the agent offers the broker ---------------
       Best fit first, then every cheaper unit the budget also reaches, each
       with the plan to offer it on, what the client pays on it, and what is
       left of the budget. A tap opens the unit on that plan. */
    var optsAll = false;
    function spare(f) {
      var bits = [];
      if (S.cash && S.cash - f.down >= 1000) bits.push(t('{v} cash', { v: short(S.cash - f.down) }));
      if (S.quarter && !f.cash && S.quarter - f.quarter >= 1000) bits.push(t('{v} a quarter', { v: short(S.quarter - f.quarter) }));
      return bits.length ? t('{list} to spare', { list: bits.join(t(' and ')) }) : t('uses the whole budget');
    }
    /* THE ANSWER (build 76). Whatever Find a unit is asked, it answers with
       ONE unit, in both tabs, and that unit wears green everywhere: this
       card, its building, its floor card and the unit on the floor drawing.
         fit      — a budget is typed: the most the budget reaches (build 74)
         cheapest — only filters: the cheapest unit that matches
         closest  — a budget nothing fits: the nearest miss, marked over budget
       The other units that also answer wait behind "See N more" here, and
       behind "Show other options" on the drawing. */
    var KIND = {
      fit: { tag: 'Best fit', more1: 'See {n} more unit that fits', more: 'See {n} more units that fit',
             head: 'Also within the budget, from the dearest down' },
      cheapest: { tag: 'Cheapest match', more1: 'See {n} more match', more: 'See {n} more matches',
                  head: 'Also matching, from the cheapest up' },
      closest: { tag: 'Closest — over budget' }
    };
    var SIDE = { value: 'Best value', stretch: 'Stretch' };
    function answer(on, opts) {
      if (budgetOn()) {
        if (opts.length) {
          var bv = bestValue(opts);
          return { kind: 'fit', list: opts, stretch: stretch(opts[0].u),
                   value: bv && bv.u !== opts[0].u ? bv : null, bestIsValue: !!(bv && bv.u === opts[0].u) };
        }
        var m = nearestMiss();
        return m ? { kind: 'closest', list: [m] } : null;
      }
      if (!on) return null;
      var ms = units.filter(function (u) { return u.sellable && match(u); }).sort(cheapFirst)
        .map(function (u) { return { u: u, f: null }; });
      if (!ms.length) return null;
      /* build 95: the same two side cards on BY UNIT. The cheapest match
         stays the answer; the price chip, when one is on, is the limit a
         stretch goes past. No price chip, no stretch. */
      var bu = bestValue(ms);
      return { kind: 'cheapest', list: ms, stretch: priceStretch(ms[0].u),
               value: bu && bu.u !== ms[0].u ? bu : null, bestIsValue: !!(bu && bu.u === ms[0].u) };
    }
    /* the cheapest unit just above the price chip that every other filter
       allows: bigger than the answer, and no more than STRETCH_MAX of the chip */
    function priceStretch(top) {
      if (!S.max) return null;
      var best = null;
      units.forEach(function (u) {
        if (!u.sellable || !rest(u, 'price') || !(u.listPrice > S.max) ||
            u.listPrice > S.max * STRETCH_MAX || !(u.area > top.area)) return;
        if (!best || cheapFirst(u, best.u) < 0) best = { u: u, f: null };
      });
      return best;
    }
    /* side: 'value' | 'stretch' for the two side cards, else undefined */
    function optCard(x, best, ans, side) {
      var u = x.u, f = x.f, k = ans.kind;
      var over = k === 'closest' || side === 'stretch';
      var tag = best ? t(KIND[k].tag) : side ? t(SIDE[side]) : '';
      var b = el('button', 'fd-opt' + (best ? ' is-best' : '') + (side ? ' is-side' : '') + (over ? ' is-over' : ''));
      b.type = 'button';
      if (tag) b.appendChild(el('span', 'fd-otag' + (side ? ' is-side' : ''), tag));
      var top = el('span', 'fd-o1');
      top.appendChild(el('b', null, u.code));
      top.appendChild(document.createTextNode(' · ' + t('{a} m²', { a: money(u.area) }) + ' · ' + nameOf(u.building) + ' · ' + flFull(u.fid)));
      b.appendChild(top);
      b.appendChild(el('span', 'fd-op', money(u.listPrice)));
      if (f) {
        b.appendChild(el('span', 'fd-o2', plan(f.label)));
        b.appendChild(el('span', 'fd-o3', f.cash ? t('EGP {v} cash, once', { v: money(f.down) })
          : t('{down} down · {each} a quarter', { down: money(f.down), each: money(f.each) })));
        if (over) {
          var gaps = [];
          if (f.down > cap('cash')) gaps.push(t('EGP {v} more cash', { v: money(f.down - cap('cash')) }));
          if (f.quarter > cap('quarter')) gaps.push(t('EGP {v} more a quarter', { v: money(f.quarter - cap('quarter')) }));
          if (gaps.length) b.appendChild(el('span', 'fd-o4', t('Needs {list}', { list: gaps.join(t(' and ')) })));
        } else b.appendChild(el('span', 'fd-o4', spare(f)));
        /* why this card, in one line, from the sheet's own figures */
        var top1 = ans.list[0].u;
        if (side === 'value') b.appendChild(el('span', 'fd-o4', t('EGP {v} per m², the lowest of the {n} that fit',
          { v: money(perM2(u)), n: ans.list.length })));
        if (best && ans.bestIsValue) b.appendChild(el('span', 'fd-o4', t('Also the lowest price per m² that fits')));
        if (side === 'stretch' && u.area > top1.area) b.appendChild(el('span', 'fd-o4',
          t('{n} m² more than the best fit', { n: money(u.area - top1.area) })));
      } else {
        b.appendChild(el('span', 'fd-o2', t('{v} EGP per m²', { v: money(u.listPrice / u.area) })));
        /* a tie is part of the answer: the broker is offered all of them */
        var same = best ? ans.list.slice(1).filter(function (y) { return y.u.listPrice === u.listPrice; }) : [];
        if (same.length) b.appendChild(el('span', 'fd-o3', t('Same price: {codes}', { codes: same.map(function (y) { return y.u.code; }).join(', ') })));
        /* why this card (build 95), as on the budget tab */
        var first = ans.list[0].u;
        if (side === 'value') b.appendChild(el('span', 'fd-o4', t('The lowest price per m² of the {n} that match', { n: ans.list.length })));
        if (best && ans.bestIsValue) b.appendChild(el('span', 'fd-o4', t('Also the lowest price per m² that matches')));
        if (side === 'stretch') {
          b.appendChild(el('span', 'fd-o4', t('EGP {v} above the {max} limit', { v: money(u.listPrice - S.max), max: millions(S.max) })));
          b.appendChild(el('span', 'fd-o4', t('{n} m² more than the cheapest match', { n: money(u.area - first.area) })));
        }
      }
      if (best) b.appendChild(el('span', 'fd-ogo', t('Show it on the layout')));
      b.setAttribute('aria-label', (tag ? tag + ': ' : '') + u.code + ', ' + money(u.listPrice) +
        (f ? ', ' + plan(f.label) : '') + '. ' + t('Show it on the layout'));
      b.addEventListener('click', function () { if (showUnit) showUnit(u, f ? f.id : null); });
      return b;
    }
    var OPT_CAP = 10;                          /* a long list behind one more tap */
    var optsFull = false;
    function optionList(ans) {
      var opts = ans.list, K = KIND[ans.kind];
      var wrap = el('div', 'fd-opts');
      wrap.appendChild(optCard(opts[0], true, ans));
      if (ans.value) wrap.appendChild(optCard(ans.value, false, ans, 'value'));
      if (ans.stretch) wrap.appendChild(optCard(ans.stretch, false, ans, 'stretch'));
      /* build 96, SEND THESE OPTIONS: the cards above leave the app as ONE
         WhatsApp post (js/post.js), so the advice reaches the broker and the
         dearer unit is in front of the client. The page does the sending. */
      var cards = [{ x: opts[0], role: ans.kind === 'fit' ? 'fit' : 'cheapest' }];
      if (ans.value) cards.push({ x: ans.value, role: 'value' });
      if (ans.stretch) cards.push({ x: ans.stretch, role: 'stretch' });
      if (cards.length > 1 && ans.kind !== 'closest') {
        var sendB = el('button', 'fd-send', t('Send these {n} options on WhatsApp', { n: cards.length }));
        sendB.type = 'button';
        sendB.addEventListener('click', function () {
          if (sendOptions) sendOptions(cards.map(function (c) { return { u: c.x.u, plan: c.x.f ? c.x.f.id : null, role: c.role }; }));
        });
        wrap.appendChild(sendB);
      }
      var others = opts.length - 1;
      if (others && K.more) {
        var more = el('button', 'fd-seemore', optsAll ? t('Hide the other options')
          : t(others === 1 ? K.more1 : K.more, { n: others }));
        more.type = 'button';
        more.setAttribute('aria-expanded', String(optsAll));
        more.addEventListener('click', function () { optsAll = !optsAll; optsFull = false; changed(null, true); });
        wrap.appendChild(more);
        if (optsAll) {
          var list = el('div', 'fd-others');
          list.appendChild(el('p', 'fd-opts-h', t(K.head)));
          var rest1 = opts.slice(1);
          (optsFull ? rest1 : rest1.slice(0, OPT_CAP)).forEach(function (x) { list.appendChild(optCard(x, false, ans)); });
          if (rest1.length > OPT_CAP && !optsFull) {
            var all = el('button', 'fd-more', t('Show all {n}', { n: rest1.length }));
            all.type = 'button';
            all.addEventListener('click', function () { optsFull = true; changed(null, true); });
            list.appendChild(all);
          }
          wrap.appendChild(list);
        }
      }
      return wrap;
    }

    function changed(typingKey, keepPin) {
      if (!keepPin) pinned = null;               /* any new question drops a pinned unit */
      pruneFacets();
      renderSizes();
      renderPrices();
      chips.forEach(function (c) { c.__sync(); });
      boxes.forEach(function (b) {
        if (b.key !== typingKey) b.input.value = S[b.key] !== null ? money(S[b.key]) : '';
        /* once a budget is on, a box at zero (typed or left empty) says
           what that rules out, so the answer never looks arbitrary */
        b.read.textContent = S[b.key]
          ? (b.key === 'quarter'
              ? t('Up to EGP {v} every 3 months (about {m} a month)', { v: money(S[b.key]), m: money(S[b.key] / every) })
              : t('Up to EGP {v}', { v: money(S[b.key]) }))
          : (b.input.value && S[b.key] === null && b.key === typingKey) ? t('Type an amount')
          : budgetOn() ? (b.key === 'cash' ? t('No cash: plans with no down payment only')
                                           : t('No instalments: cash plans only'))
          : '';
      });

      var on = active();
      clear.hidden = !on;
      var byB = {}, total = 0, low = null;
      units.forEach(function (u) {
        if (!match(u)) return;
        if (u.sellable && (!low || cheapFirst(u, low) < 0)) low = u;
        if (!on) return;
        total++;
        byB[u.building] = (byB[u.building] || 0) + 1;
      });
      var list = Object.keys(byB).sort(function (a, b) { return byB[b] - byB[a] || a.localeCompare(b); });

      /* nothing asked: the shortcut to the cheapest available. Asked: the answer card */
      cheapestU = on ? null : low;
      cheapest.hidden = !cheapestU;
      cheapest.classList.toggle('is-pinned', !!(cheapestU && pinned === cheapestU.code));
      if (cheapestU) fillPick(cheapest, t('Cheapest available'), cheapestU,
        [where(cheapestU) + ' · ' + t('{a} m²', { a: money(cheapestU.area) }) + t(' — show it on the layout')]);

      var opts = options();
      var ans = answer(on, opts);

      summary.textContent = '';
      summary.hidden = !on;
      if (on) {
        summary.appendChild(el('span', 'fd-what', describe()));
        summary.appendChild(el('span', 'fd-found' + (total ? '' : ' is-none'), total ? t(total === 1 ? '{n} match' : '{n} matches', { n: total }) : t('nothing matches')));
      }

      result.textContent = '';
      result.hidden = !on;
      if (on && ans) result.appendChild(optionList(ans));
      if (on) {
        if (!total) {
          result.appendChild(el('p', 'fd-count is-none', ans && ans.kind === 'closest'
            ? t('Nothing fits that budget. The closest unit is above.')
            : (budgetOn() && !cap('quarter')) ? t('Nothing fits on cash alone. Type what the client can pay per quarter.')
            : (S.hold ? t('Nothing matches. Take a filter off.') : t('Nothing matches. Take a filter off, or include on hold.'))));
        } else {
          result.appendChild(el('p', 'fd-count', t('{units} in {buildings} — lit on the view. Tap one:', {
            units: t(total === 1 ? '1 unit' : '{n} units', { n: total }),
            buildings: t(list.length === 1 ? '1 building' : '{n} buildings', { n: list.length }) })));
          var bl = el('div', 'fd-buildings');
          var CAP = 8;                        /* forty chips push the picture off a phone */
          (showAll ? list : list.slice(0, CAP)).forEach(function (k) {
            var b = el('button', 'fd-bld');
            b.type = 'button';
            b.appendChild(el('span', null, nameOf(k)));
            b.appendChild(el('span', 'fd-bc', String(byB[k])));
            b.setAttribute('aria-label', t('{name}, {n} matching units', { name: nameOf(k), n: byB[k] }));
            b.addEventListener('click', function () { if (pickBuilding) pickBuilding(k); });
            bl.appendChild(b);
          });
          if (list.length > CAP) {
            var more = el('button', 'fd-more', showAll ? t('Show fewer') : t('Show all {n}', { n: list.length }));
            more.type = 'button';
            more.addEventListener('click', function () { showAll = !showAll; changed(); });
            bl.appendChild(more);
          }
          result.appendChild(bl);
        }
        /* shown whenever more units can be brought in, not only when none fit */
        var lv = levers(total);
        if (lv.length) {
          var ub = el('div', 'fd-unlock');
          lv.forEach(function (x, i) {
            var pp = el('p');
            /* one whole sentence per case (also in scripts/i18n-dynamic.json) */
            var lk = (i ? 4 : 0) + (x.key === 'quarter' ? 0 : 2) + (x.n === 1 ? 0 : 1);
            pp.appendChild(document.createTextNode(t(LEVER[lk],
              { gap: money(x.gap), n: x.n }) + ' '));
            var ap = el('button', 'fd-apply', t('Apply'));
            ap.type = 'button';
            ap.addEventListener('click', function () { S[x.key] = x.value; showAll = false; changed(); });
            pp.appendChild(ap);
            ub.appendChild(pp);
          });
          result.appendChild(ub);
        }
      }

      var out = { active: on, match: on ? match : null, byBuilding: byB, total: total, buildings: list,
                  budget: budgetOn() ? { cash: S.cash, quarter: S.quarter } : null,
                  offer: budgetOn() ? offerFor : null,
                  /* THE ANSWER, one code, and what kind it is; the page lights it green */
                  best: ans ? ans.list[0].u.code : pinned,
                  kind: ans ? ans.kind : (pinned ? 'available' : null) };
      listeners.forEach(function (fn) { fn(out); });
    }

    function setOpen(open) {
      body.hidden = !open;
      box.classList.toggle('is-open', open);
      toggle.setAttribute('aria-expanded', String(open));
    }
    toggle.addEventListener('click', function () { setOpen(body.hidden); });
    clear.addEventListener('click', function () {
      S.sizes = []; S.floors = []; S.facets = {}; S.max = null; S.hold = false; S.cash = null; S.quarter = null;
      boxes.forEach(function (b) { b.input.value = ''; });
      showAll = false;
      changed();
    });

    return {
      node: box,
      setUnits: function (list) {
        units = list || [];
        fitCache = {};
        facetCache = {};
        if (!units.length) {
          paneUnit.textContent = '';
          paneUnit.appendChild(el('p', 'fd-wait', t('Units could not be loaded, so there is nothing to search.')));
          return;
        }
        build();
        changed();
      },
      onChange: function (fn) { listeners.push(fn); },
      onPickBuilding: function (fn) { pickBuilding = fn; },
      onShowUnit: function (fn) { showUnit = fn; },
      onSendOptions: function (fn) { sendOptions = fn; },
      open: setOpen,
      /* for the checks only: the state, read-only */
      state: function () { return JSON.parse(JSON.stringify(S)); }
    };
  }

  MM.finder = finder;
}(typeof window !== 'undefined' ? window : globalThis));
