/* ------------------------------------------------------------------
   h:rs — step 3: building, floor, unit, and the payment schedule.

   Two rules run through all of it:
   - NOTHING IS OFFERED unless the sheet says it is available. A unit
     that is Reserved, Sold, Not released or carries a status we do not
     recognise is shown, greyed, and cannot be picked. The salesperson
     needs to know the unit exists and is gone, or they phone ops.
   - A FLOOR WITH NO UNITS is not in the list at all. A disabled floor
     card would state a reason for the absence that we do not know.

   Every number on the read-out comes from js/plans.js on the plan the
   salesperson picked — the same schedule the PDF and the WhatsApp post
   will use. Nothing is formatted twice.
   ------------------------------------------------------------------ */

(function (root) {
  'use strict';

  var MM = root.MM || (root.MM = {});

  function money(v) { return Math.round(v).toLocaleString('en-US'); }
  function pct(f) { return String(Math.round(f * 1000) / 10) + '%'; }
  function when(d) {
    return d.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });
  }

  function panel(p) {
    var el = MM.el, t = MM.t;
    var node = el('section', 'panel units-panel');
    var head = el('div', 'panel-head');
    head.appendChild(el('h2', null, t('Building & unit')));
    var count = el('span', 'pill', '');
    head.appendChild(count);
    node.appendChild(head);

    /* The demo banner. It is not dismissible and it is not subtle:
       while the demo book is the source, every price on this screen is
       invented. */
    if (p.inventory && p.inventory.demo) {
      var warn = el('div', 'soon-note demo-flag');
      warn.setAttribute('role', 'note');
      warn.appendChild(el('strong', null, t('Demo prices.')));
      warn.appendChild(el('span', null, ' ' + (p.inventory.demoNote || '')));
      node.appendChild(warn);
    }

    var state = el('p', 'units-state', t('Loading units…'));
    node.appendChild(state);

    var body = el('div', 'units');
    body.hidden = true;
    node.appendChild(body);

    var bRow = el('div', 'chips b-row');
    var fRow = el('div', 'chips f-row');
    var grid = el('div', 'u-grid');
    var detail = el('div', 'u-detail');
    detail.hidden = true;
    body.appendChild(bRow);
    body.appendChild(fRow);
    body.appendChild(grid);
    body.appendChild(detail);

    var data = null;          /* the parsed inventory, once it lands   */
    var pending = null;       /* a building clicked before it landed   */
    var curB = null, curF = null, curU = null, curPlan = null;
    var listeners = [];

    /* ---- load ---------------------------------------------------------- */
    if (!p.inventory || !p.inventory.url) {
      state.textContent = t('Units will appear here as soon as they are released.');
      return api();
    }

    MM.inventory.load(p.inventory).then(function (res) {
      data = res;
      state.hidden = true;
      body.hidden = false;
      count.textContent = res.units.length + t(' available of ') + res.all.length;

      if (res.problems.length) {
        var pb = el('div', 'soon-note problems');
        pb.appendChild(el('strong', null, t('The sheet reported:')));
        res.problems.slice(0, 6).forEach(function (x) { pb.appendChild(el('span', 'prob', x)); });
        node.insertBefore(pb, state);
      }

      buildings();
      listeners.forEach(function (fn) { fn(res); });
      if (pending) { pickBuilding(pending); pending = null; }
    }).catch(function (e) {
      /* A refusal the salesperson can see beats a list that is quietly
         wrong. Never fall back to a cached or partial book. */
      state.textContent = t('Units could not be loaded. Please try again.');
      state.classList.add('is-bad');
    });

    /* ---- buildings ------------------------------------------------------ */
    function buildings() {
      bRow.textContent = '';
      var by = MM.inventory.byBuilding(data.all);
      (p.masterplan && p.masterplan.buildings ? p.masterplan.buildings : Object.keys(by)).forEach(function (b) {
        var list = by[b] || [];
        var avail = list.filter(function (u) { return u.sellable; }).length;
        var c = el('button', 'chip b-chip-btn');
        c.type = 'button';
        c.appendChild(el('span', 'c-id', b));
        c.appendChild(el('span', 'c-n', avail ? avail + t(' available') : t('none available')));
        if (!avail) c.classList.add('is-empty');
        c.addEventListener('click', function () { pickBuilding(b); });
        bRow.appendChild(c);
      });
    }

    function counts() {
      var out = {};
      if (!data) return out;
      var by = MM.inventory.byBuilding(data.all);
      Object.keys(by).forEach(function (b) {
        out[b] = { total: by[b].length, available: by[b].filter(function (u) { return u.sellable; }).length };
      });
      return out;
    }

    /* ---- floors ---------------------------------------------------------- */
    function pickBuilding(b) {
      if (!data) { pending = b; return; }
      curB = b;
      curF = null; curU = null;
      detail.hidden = true;
      Array.prototype.forEach.call(bRow.children, function (n) {
        n.classList.toggle('is-on', n.firstChild.textContent === b);
      });

      var mine = data.all.filter(function (u) { return u.building === b; });
      var floors = MM.inventory.floorsOf(mine);

      fRow.textContent = '';
      floors.forEach(function (f) {
        var avail = f.units.filter(function (u) { return u.sellable; }).length;
        var c = el('button', 'chip f-chip', '');
        c.type = 'button';
        c.appendChild(el('span', 'c-id', f.name));
        c.appendChild(el('span', 'c-n', avail ? avail + t(' available') : t('none')));
        if (!avail) c.classList.add('is-empty');
        c.addEventListener('click', function () { pickFloor(b, f, c); });
        fRow.appendChild(c);
      });

      grid.textContent = '';
      grid.appendChild(el('p', 'u-hint', t('Choose a floor in ') + b + '.'));
      node.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    function pickFloor(b, f, btn) {
      curF = f;
      curU = null;
      detail.hidden = true;
      Array.prototype.forEach.call(fRow.children, function (n) { n.classList.remove('is-on'); });
      btn.classList.add('is-on');

      grid.textContent = '';
      f.units.slice().sort(function (a, c) { return Number(a.unit) - Number(c.unit); }).forEach(function (u) {
        grid.appendChild(card(u));
      });
    }

    /* ---- a unit ---------------------------------------------------------- */
    function card(u) {
      var sellable = u.sellable;
      var c = el(sellable ? 'button' : 'div', 'u-card' + (sellable ? '' : ' is-gone'));
      if (sellable) c.type = 'button';
      else c.setAttribute('aria-disabled', 'true');

      var top = el('div', 'u-top');
      top.appendChild(el('span', 'u-code', u.code));
      top.appendChild(el('span', 'u-st st-' + u.status.toLowerCase().replace(/\s+/g, '-'), u.status));
      c.appendChild(top);

      c.appendChild(el('span', 'u-kind', u.kind + (u.type && u.type !== u.kind ? ' · ' + u.type : '')));
      c.appendChild(el('span', 'u-area', u.area + ' m²'));
      /* A price is shown on a unit that cannot be sold too — the broker
         asks what it WAS, and hiding it invites a phone call. */
      c.appendChild(el('span', 'u-price', money(u.finalPrice)));

      if (sellable) c.addEventListener('click', function () { pickUnit(u); });
      return c;
    }

    function pickUnit(u) {
      curU = u;
      curPlan = curPlan || (p.plans && p.plans[0]);
      Array.prototype.forEach.call(grid.children, function (n) {
        n.classList.toggle('is-on', n.classList.contains('u-card') && n.firstChild &&
          n.firstChild.firstChild && n.firstChild.firstChild.textContent === u.code);
      });
      drawDetail();
      detail.hidden = false;
      detail.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    /* ---- the read-out, and the schedule ----------------------------------- */
    function drawDetail() {
      var u = curU;
      detail.textContent = '';

      var top = el('div', 'd-top');
      var id = el('div', 'd-id');
      id.appendChild(el('h3', null, u.code));
      id.appendChild(el('p', 'd-sub', [u.kind, u.type, u.floor, u.view ? u.view + ' view' : ''].filter(Boolean).join(' · ')));
      top.appendChild(id);

      var pr = el('div', 'd-price');
      if (u.discount > 0) {
        pr.appendChild(el('span', 'd-was', money(u.listPrice)));
        pr.appendChild(el('span', 'd-off', '−' + pct(u.discount)));
      }
      pr.appendChild(el('span', 'd-now', money(u.finalPrice) + ' EGP'));
      pr.appendChild(el('span', 'd-rate', u.area + ' m²' + (u.meterPrice ? ' · ' + money(u.meterPrice) + ' / m²' : '')));
      top.appendChild(pr);
      detail.appendChild(top);

      /* plan picker */
      if (p.plans && p.plans.length) {
        var pick = el('div', 'chips plan-row');
        p.plans.forEach(function (pl) {
          var b = el('button', 'chip plan-chip');
          b.type = 'button';
          b.appendChild(el('span', 'c-id', pl.label));
          b.classList.toggle('is-on', curPlan && pl.id === curPlan.id);
          b.addEventListener('click', function () { curPlan = pl; drawDetail(); });
          pick.appendChild(b);
        });
        detail.appendChild(pick);
        if (p.plansDemo) {
          var pn = el('p', 'd-note', t('Demo plans. Main Marks has not sent theirs — these are placeholders with the right shape.'));
          detail.appendChild(pn);
        }
      }

      var s = MM.plans.schedule({
        listPrice: u.listPrice,
        discount: u.discount,
        plan: curPlan,
        terms: p.terms,
        from: new Date()
      });

      if (!s) {
        detail.appendChild(el('p', 'd-bad', t('No schedule could be built for this unit.')));
        return;
      }
      if (s.broken) {
        /* A schedule that does not foot must never render as if it did. */
        var bad = el('div', 'soon-note d-bad');
        bad.appendChild(el('strong', null, t('This schedule does not add up, so it is not shown.')));
        bad.appendChild(el('span', null, ' ' + s.broken.join('; ')));
        detail.appendChild(bad);
        return;
      }

      var sum = el('div', 'd-sum');
      [
        [t('Down payment'), money(s.down), s.downOn === 'list' ? t('of the list price') : t('of the discounted price')],
        [t('Instalment'), money(s.each), t('every ') + s.everyMonths + t(' months × ') + s.count],
        [t('Per month'), money(MM.plans.perMonth(s)), t('the instalment spread over ') + s.everyMonths + t(' months')],
        s.maintenance ? [s.maintenance.label, money(s.maintenance.amount), pct(s.maintenance.pct) + t(' · month ') + s.maintenance.months] : null,
        [t('Total, all in'), money(s.cashTotal), t('over ') + s.years + t(' years')]
      ].filter(Boolean).forEach(function (r) {
        var c = el('div', 'sum-c');
        c.appendChild(el('span', 'sum-k', r[0]));
        c.appendChild(el('span', 'sum-v', r[1]));
        c.appendChild(el('span', 'sum-n', r[2]));
        sum.appendChild(c);
      });
      detail.appendChild(sum);

      /* the schedule itself, collapsed — it is long and it is the thing
         the customer asks to see second, not first */
      var det = el('details', 'd-sched');
      var sm = el('summary', null, t('The full schedule — ') + (s.rows.length) + t(' payments'));
      det.appendChild(sm);
      var tbl = el('div', 'sched');
      s.rows.forEach(function (r) {
        var row = el('div', 'sched-r' + (r.kind !== 'instalment' ? ' is-key' : ''));
        row.appendChild(el('span', 'sr-l', r.label));
        row.appendChild(el('span', 'sr-d', when(r.due)));
        row.appendChild(el('span', 'sr-a', money(r.amount)));
        tbl.appendChild(row);
      });
      if (s.maintenance) {
        var mr = el('div', 'sched-r is-key');
        mr.appendChild(el('span', 'sr-l', s.maintenance.label));
        mr.appendChild(el('span', 'sr-d', when(s.maintenance.due)));
        mr.appendChild(el('span', 'sr-a', money(s.maintenance.amount)));
        tbl.appendChild(mr);
      }
      det.appendChild(tbl);
      detail.appendChild(det);

      /* the two ways an offer leaves the app — not built yet, and the
         buttons say what each one is waiting for rather than failing */
      var go = el('div', 'd-go');
      [
        [t('Create offer (PDF)'), t('Needs the price list and the logo files as vectors.')],
        [t('WhatsApp post'), t('Needs two or three real posts your team has sent, so it comes out in their format.')]
      ].forEach(function (b) {
        var btn = el('button', 'btn is-wait');
        btn.type = 'button';
        btn.disabled = true;
        btn.appendChild(el('span', null, b[0]));
        var w = el('span', 'btn-why', b[1]);
        var box = el('div', 'go-b');
        box.appendChild(btn);
        box.appendChild(w);
        go.appendChild(box);
      });
      detail.appendChild(go);
    }

    /* ---- what the page can ask of this panel ------------------------------ */
    function api() {
      return {
        node: node,
        pickBuilding: pickBuilding,
        onData: function (fn) { if (data) fn(data); else listeners.push(fn); },
        counts: counts
      };
    }
    return api();
  }

  MM.units = { panel: panel };
}(typeof window !== 'undefined' ? window : globalThis));
