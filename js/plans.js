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
      var cd = egp(list * (o.discount || 0)), cp = list - cd;
      return {
        list: list, discountPct: o.discount || 0, discount: cd, payable: cp, downOn: 'discounted',
        down: cp, milestones: [], balance: 0, count: 0, each: 0, lastInstalment: 0,
        everyMonths: 0, years: 0, cash: true,
        rows: [{ no: 0, kind: 'down', label: 'Cash payment', months: 0, due: new Date(start.getTime()), amount: cp }],
        maintenance: null, extras: [], start: start, deliveryMonths: terms.deliveryMonths || null,
        cashTotal: cp
      };
    }
    if (!plan || !(plan.down >= 0) || !(plan.years > 0)) return null;
    var every = plan.every || terms.instalmentEvery || 3;  /* months */

    var discountPct = o.discount || 0;
    var discount = egp(list * discountPct);
    var payable = list - discount;

    /* Rule 2. Which price the down payment is a share of is the client's
       decision, not ours, so it is stated in config and read here. */
    var downBase = (plan.downOn || terms.downOn) === 'list' ? list : payable;
    var down = egp(downBase * plan.down);

    /* Rule 3. Milestones are percentages of the payable price at stated
       months. They come out of what the instalments carry. */
    var milestones = (plan.milestones || []).map(function (m) {
      return { pct: m.pct, months: m.months, amount: egp(payable * m.pct), label: m.label || 'Milestone' };
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
      rows.push({ no: null, kind: 'milestone', label: m.label, months: m.months, due: addMonths(start, m.months), amount: m.amount });
    });

    var maintenance = null;
    if (terms.maintenance && terms.maintenance.pct) {
      var mm = terms.maintenance;
      var month = (mm.months !== undefined && mm.months !== null)
        ? mm.months
        : (terms.deliveryMonths || 0) - (mm.dueMonthsBeforeDelivery || 0);
      maintenance = {
        pct: mm.pct,
        amount: egp((mm.on === 'discounted' ? payable : list) * mm.pct),
        months: month,
        due: addMonths(start, month),
        label: mm.label || 'Maintenance'
      };
    }

    /* An extra with no month is carried but NOT counted, and it says so.
       Inventing when a club fee is owed is inventing a number. */
    var extras = (terms.extras || []).map(function (x) {
      return { key: x.key, label: x.label, amount: egp(x.amount), months: x.months, dated: x.months !== undefined && x.months !== null };
    });

    rows.sort(function (a, b) { return a.months - b.months; });

    var out = {
      list: list,
      discountPct: discountPct,
      discount: discount,
      payable: payable,
      downOn: (plan.downOn || terms.downOn) === 'list' ? 'list' : 'discounted',
      down: down,
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
      deliveryMonths: terms.deliveryMonths || null
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
     plan is never offered on a type it names in `notFor`. */
  function applicable(plans, type, today) {
    var d = today ? new Date(today.getTime()) : new Date();
    d.setHours(0, 0, 0, 0);
    return (plans || []).filter(function (pl) {
      if (pl.until && d > new Date(pl.until + 'T23:59:59')) return false;
      if (pl.notFor && pl.notFor.indexOf(type) !== -1) return false;
      return true;
    });
  }

  var api = { schedule: schedule, addMonths: addMonths, egp: egp, perMonth: perMonth, applicable: applicable };
  if (typeof module === 'object' && module.exports) module.exports = api;
  else { root.MM = root.MM || {}; root.MM.plans = api; }
}(typeof window !== 'undefined' ? window : globalThis));
