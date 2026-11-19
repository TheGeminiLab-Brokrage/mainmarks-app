/* ------------------------------------------------------------------
   Main Marks — the payment schedule.

   ONE function builds the schedule, and the screen, the PDF and the
   WhatsApp post all call it. The moment any of them formats an
   instalment of its own, two numbers in front of one customer start to
   disagree.

   THE PLANS IN CONFIG ARE DEMO. Main Marks has not sent theirs. The
   ENGINE is not demo: it derives every figure, it never transcribes a
   rounded percentage, and it refuses to return a schedule that does not
   foot. When the real plans arrive they are five lines of config.

   The rules it encodes, each of which a client answers differently and
   each of which changes every figure on the page:
     1. The discount is read PER UNIT from the inventory, never assumed.
     2. The down payment is a percentage of the price the plan is quoted
        on — `downOn` says which, 'list' or 'discounted'.
     3. Milestones come OUT of the 100%, never on top of it: the level
        instalment absorbs them.
     4. Maintenance is a percentage of the price, due at a stated month,
        and is not part of the instalment plan.
     5. Extras are fixed amounts with a stated month. An extra with no
        timing appears in NO figure — it cannot, because we would be
        inventing when it is owed.
   ------------------------------------------------------------------ */

(function (root) {
  'use strict';

  var MM = root.MM || (root.MM = {});

  /* Every figure a customer sees is a whole pound. Round once, here. */
  function egp(v) { return Math.round(v); }

  function addMonths(date, n) {
    var d = new Date(date.getTime());
    var day = d.getDate();
    d.setDate(1);
    d.setMonth(d.getMonth() + n);
    /* 31 Jan + 1 month is 28 Feb, not 3 March. */
    d.setDate(Math.min(day, new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()));
    return d;
  }

  /* the maintenance deposit, or null when the terms state none. Cash deals owe it too (build 153). */
  function maintenanceOf(terms, list, payable, start) {
    var mm = terms.maintenance;
    if (!mm || !mm.pct) return null;
    var month = (mm.months !== undefined && mm.months !== null)
      ? mm.months
      : (terms.deliveryMonths || 0) - (mm.dueMonthsBeforeDelivery || 0);
    return {
      pct: mm.pct,
      on: mm.on === 'discounted' ? 'discounted' : 'list',
      amount: egp((mm.on === 'discounted' ? payable : list) * mm.pct),
      months: month,
      due: addMonths(start, month),
      label: mm.label || 'Maintenance'
    };
  }
  function deliveryOf(terms, start) { return terms.deliveryMonths ? addMonths(start, terms.deliveryMonths) : null; }

  /* ---- the block a unit stands in, and that unit's own terms (build 155) ----------------------------
     Main Marks, 11 Nov 2026 (Yossef Walid's email, Operations): delivery differs by building, "A1 & B1:
     2 years. A2, B2 & D: 3 years. E: 4 years." `terms.deliveryByBuilding` holds the months per block
     (config `buildings` ids). The block is found the way the line page finds it (js/lineflow.js physFor):
     a street-level shop by the block above it (`street`, the start of its code), any other unit by the
     sheet's name for its block or the block's own id, a name two blocks share ("B") told apart by the
     unit number. A unit no block claims, or a block with no date (C1, C2, HA to HD today), gets NO
     delivery date, and the documents say it is to be confirmed (fail closed). */
  function blockOf(p, u) {
    var B = (p && p.buildings) || [], key = u && u.building, code = String((u && u.code) || '').toUpperCase();
    var s = B.filter(function (x) { return (x.street || []).some(function (st) { return code.indexOf(st) === 0; }); });
    if (s.length === 1) return s[0];
    var c = B.filter(function (x) { return (x.sheet || []).indexOf(key) !== -1 || x.id === key; });
    if (c.length > 1) {
      var m = /(\d{2})\D*$/.exec(code), n = m ? +m[1] : -1;
      c = c.filter(function (x) { return (x.units || []).some(function (r) { return n >= r[0] && n <= r[1]; }); });
    }
    return c.length === 1 ? c[0] : null;
  }
  function termsFor(p, u) {
    var t = Object.assign({}, (p && p.terms) || {}), by = t.deliveryByBuilding;
    if (by) {
      var b = blockOf(p, u);
      t.deliveryMonths = (b && by[b.id]) || null;
    }
    return t;
  }

  /* o: { listPrice, discount, plan, terms, from } */
  function schedule(o) {
    var list = egp(o.listPrice);
    var plan = o.plan;
    var terms = o.terms || {};
    if (!(list > 0)) return null;                         /* fail closed */
    var start = o.from ? new Date(o.from.getTime()) : new Date();

    /* SPOT CASH (Moray's "40% discount: spot cash"): the whole discounted
       price on contract, no instalments. The discount is the plan's. */
    if (plan && plan.cash) {
      var cd = egp(list * (o.discount || 0)), cp = list - cd, cm = maintenanceOf(terms, list, cp, start);
      return {
        list: list, discountPct: o.discount || 0, discount: cd, payable: cp, downOn: 'discounted',
        down: cp, downTotal: cp, milestones: [], balance: 0, count: 0, each: 0, lastInstalment: 0,
        everyMonths: 0, years: 0, cash: true,
        rows: [{ no: 0, kind: 'down', label: 'Cash payment', months: 0, due: new Date(start.getTime()), amount: cp }],
        maintenance: cm, extras: [], start: start, deliveryMonths: terms.deliveryMonths || null,
        delivery: deliveryOf(terms, start),
        cashTotal: cp + (cm ? cm.amount : 0)
      };
    }
    if (!plan || !(plan.down >= 0) || !(plan.years > 0)) return null;
    var every = plan.every || terms.instalmentEvery || 3;  /* months */

    var discountPct = o.discount || 0;
    var onList = (plan.downOn || terms.downOn) === 'list';
    /* Build 154 (Muhanad, 2026-11-05): the admin chooses, per plan, whether the discount is a share of
       the original price or of what is left after the down payment ("the down payment first, then the
       discount on the rest"). The second needs the down payment on the original price, both parts of a
       split one: a down payment on the price after a discount that is itself worked from the down
       payment has no answer, so that pair has no schedule (fail closed). */
    var afterDown = plan.discountOn === 'afterDown';
    if (afterDown && !onList) return null;
    var discountBase = list;
    if (afterDown) {
      discountBase = list - egp(list * plan.down) - (plan.milestones || []).filter(function (m) { return m.down; }).reduce(function (t, m) { return t + egp(list * m.pct); }, 0);
      if (discountBase < 0) return null;
    }
    var discount = egp(discountBase * discountPct);
    var payable = list - discount;

    /* Rule 2. Which price the down payment is a share of is the client's
       decision, not ours, so it is stated in config and read here. */
    var downBase = onList ? list : payable;
    var down = egp(downBase * plan.down);

    /* Rule 3. Milestones are percentages of the payable price at stated
       months. They come out of what the instalments carry. A milestone
       marked `down` is the second part of a split down payment (Moray,
       "2.5% down payment, followed by an additional 2.5% after 3 months",
       2 Nov 2026): it is a share of the same price the down payment is. */
    var milestones = (plan.milestones || []).map(function (m) {
      return { pct: m.pct, months: m.months, amount: egp((m.down ? downBase : payable) * m.pct), label: m.label || 'Milestone', down: !!m.down };
    });
    var milestoneTotal = milestones.reduce(function (s, m) { return s + m.amount; }, 0);

    var count = Math.round((plan.years * 12) / every);
    /* Guard the count itself: a schedule quietly one instalment short is
       worth real money and looks completely normal on the page. */
    if (count !== (plan.years * 12) / every) return null;

    var balance = payable - down - milestoneTotal;
    if (balance < 0) return null;

    var each = egp(balance / count);

    var rows = [{ no: 0, kind: 'down', label: 'Down payment', months: 0, due: new Date(start.getTime()), amount: down }];
    var running = 0, i, amt;
    for (i = 1; i <= count; i++) {
      /* The LAST instalment carries the rounding drift, so the rows sum
         to the balance exactly rather than approximately. */
      amt = (i === count) ? (balance - each * (count - 1)) : each;
      running += amt;
      rows.push({
        no: i, kind: 'instalment',
        label: 'Instalment ' + i + ' of ' + count,
        months: i * every, due: addMonths(start, i * every), amount: amt
      });
    }
    milestones.forEach(function (m) {
      rows.push({ no: null, kind: 'milestone', label: m.label, months: m.months, due: addMonths(start, m.months), amount: m.amount, down: m.down, pct: m.pct });
    });

    var maintenance = maintenanceOf(terms, list, payable, start);

    /* An extra with no month is carried but NOT counted, and it says so.
       Inventing when a club fee is owed is inventing a number. */
    var extras = (terms.extras || []).map(function (x) {
      return { key: x.key, label: x.label, amount: egp(x.amount), months: x.months, dated: x.months !== undefined && x.months !== null };
    });

    /* on the same date, the down payment's second part before the instalment it falls with */
    var KIND_ORDER = { down: 0, milestone: 1, instalment: 2 };
    rows.sort(function (a, b) { return a.months - b.months || KIND_ORDER[a.kind] - KIND_ORDER[b.kind]; });

    var out = {
      list: list,
      discountPct: discountPct,
      discount: discount,
      payable: payable,
      downOn: (plan.downOn || terms.downOn) === 'list' ? 'list' : 'discounted',
      /* what the discount is a share of: 'list' (the original price) or 'afterDown' (what is left after
         the down payment), and that amount */
      discountOn: afterDown ? 'afterDown' : 'list',
      discountBase: discountBase,
      down: down,
      /* the whole down payment, both parts of a split one: what a client needs as cash */
      downTotal: down + milestones.filter(function (m) { return m.down; }).reduce(function (t, m) { return t + m.amount; }, 0),
      milestones: milestones,
      balance: balance,
      count: count,
      each: each,
      lastInstalment: each ? (balance - each * (count - 1)) : 0,
      everyMonths: every,
      years: plan.years,
      rows: rows,
      maintenance: maintenance,
      extras: extras,
      start: start,
      deliveryMonths: terms.deliveryMonths || null,
      delivery: deliveryOf(terms, start)
    };

    /* What the customer actually hands over, all in — and only the parts
       whose timing we know. */
    out.cashTotal = payable +
      (maintenance ? maintenance.amount : 0) +
      extras.filter(function (x) { return x.dated; }).reduce(function (s, x) { return s + x.amount; }, 0);

    /* ---- self-checks. A schedule that does not foot must not render.
       Returning nothing is visible; returning a wrong number is not. --- */
    var problems = [];
    if (running !== balance) problems.push('instalments sum to ' + running + ', balance is ' + balance);
    if (down + balance + milestoneTotal !== payable) problems.push('down + milestones + instalments do not equal the discounted price');
    if (list - discount !== payable) problems.push('list - discount does not equal the discounted price');
    var instalments = rows.filter(function (r) { return r.kind === 'instalment'; });
    if (instalments.length !== count) problems.push('expected ' + count + ' instalments, built ' + instalments.length);
    if (instalments.length && instalments[instalments.length - 1].months !== plan.years * 12) {
      problems.push('the last instalment does not land on the end of the term');
    }
    if (problems.length) { out.broken = problems; return out; }

    return out;
  }

  /* The monthly-equivalent figure a broker asks for. Quarterly
     instalments divided by the months between them — and the caller must
     say which it is showing, because they are not the same sentence. */
  function perMonth(s) { return s ? Math.round(s.each / s.everyMonths) : 0; }

  /* The plans a unit may be offered on TODAY. One rule, read by the unit
     details and by "Find a unit", so the search never tests a plan the
     offer would not show: an offer past its `until` date is gone, and a
     plan is never offered on a type it names in `notFor`.
     Build 154 (the admin keeps the plans, js/planbook.js): a plan with a
     `from` date is offered from that day. And a plan whose timing the
     documents cannot say is never offered: the PDF, the post and the unit
     card write "every 3 months" and "after 3 months" in words, so a plan
     paid otherwise would print a wrong line on a customer's document. */
  function worded(pl) {
    if (pl.cash) return true;
    if ((pl.every || 3) !== 3) return false;
    return (pl.milestones || []).every(function (m) { return m.months === 3; });
  }
  function applicable(plans, type, today) {
    var d = today ? new Date(today.getTime()) : new Date();
    d.setHours(0, 0, 0, 0);
    return (plans || []).filter(function (pl) {
      if (pl.until && d > new Date(pl.until + 'T23:59:59')) return false;
      if (pl.from && d < new Date(pl.from + 'T00:00:00')) return false;
      if (pl.notFor && pl.notFor.indexOf(type) !== -1) return false;
      return worded(pl);
    });
  }

  var api = { schedule: schedule, addMonths: addMonths, egp: egp, perMonth: perMonth, applicable: applicable, worded: worded,
              blockOf: blockOf, termsFor: termsFor };
  if (typeof module === 'object' && module.exports) module.exports = api;
  else { root.MM = root.MM || {}; root.MM.plans = api; }
}(typeof window !== 'undefined' ? window : globalThis));
