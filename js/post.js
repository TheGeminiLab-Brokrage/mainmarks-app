/* ------------------------------------------------------------------
   Main Marks — the WhatsApp post (build 90), the second way an offer
   leaves the app, beside the offer PDF.

   Muhanad, 2026-10-03: "take Ayyam and Qomor as a reference and do like
   them". So this is the Ayyam post (CCR Development App, js/post.js),
   which was itself transcribed from CCR's sales team's own posts:

     picture  ONE tall image: the whole Moray master plan on top, the
              clinic's building lit and the clinic pinned; under it the
              clinic on its floor drawing, in orange, with the facts and a
              key plan beside it. No price on the picture: prices change,
              and a picture is forwarded for weeks.
     caption  the offer headline · ✨ Moray Wellness ✨ · 📍E125 · size ·
              floor and building · price before (struck) and after the
              discount · down payment · quarterly instalment · about how
              much a month · how long the offer runs. In the language the
              app is in (build 92, Muhanad: "English or Arabic depends on
              the language used in the app"), the picture's words too.

   WHY A POST AND NOT ONLY THE PDF (playbook 01, 5b): in a broker group a
   PDF reads as a formal offer nobody opens; a picture with a formatted
   caption reads as a listing and is forwarded.

   RULES IT KEEPS
   - Every figure comes from MM.plans.schedule on the plan chosen in step 4,
     the same schedule the screen and the PDF use. Nothing is typed.
   - No example post from Main Marks yet: the WORDING is Ayyam's sales-team
     wording, re-used for a clinic. Main Marks may want their own.
   - While config `post.sample` is on, the caption opens with a SAMPLE line
     and the picture is stamped, exactly like the PDF: the down payment is
     worked on an ASSUMED basis (terms.downOn) Main Marks has not confirmed.
   - Maintenance, delivery, fees: not supplied, so never printed.
   - No link into the app: a public site hands a broker group every price.
   - The picture is drawn from the CLEAN drawing: it never shows which
     units are sold or on hold.
   - The salesperson's name and number are optional, remembered only on
     this device.

     MM.post.caption(o)   -> text            (throws: fail closed)
     MM.post.picture(o)   -> Promise<Blob>   (JPEG)
     MM.post.canPicture(project, unit) -> true if the unit has a drawing
     MM.post.open(o)      the post sheet
   ------------------------------------------------------------------ */
(function (root) {
  'use strict';
  var MM = root.MM || (root.MM = {});
  var V = (root.CONFIG && CONFIG.build) || '0';

  function money(v) { return Math.round(v).toLocaleString('en-US'); }
  function pctOf(f) { return String(Math.round(f * 1000) / 10); }
  /* "10%" inside Arabic shows as "%10": wrap it in a left-to-right isolate,
     as Qomor's post does (js/post.js iso()). Built from code points: a typed
     escape can land in the file as the raw character. */
  var LRI = String.fromCharCode(0x2066), PDI = String.fromCharCode(0x2069);
  function isoPct(f) { return LRI + pctOf(f) + '%' + PDI; }

  var MONTHS_AR = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
  var MONTHS_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  var FLOOR_AR = { street: 'الدور الأرضي', ground: 'الدور الأرضي', first: 'الدور الأول', second: 'الدور الثاني',
    third: 'الدور الثالث', fourth: 'الدور الرابع', fifth: 'الدور الخامس' };
  var FLOOR_EN = { street: 'Street level', ground: 'Ground floor', first: '1st floor', second: '2nd floor',
    third: '3rd floor', fourth: '4th floor', fifth: '5th floor' };
  var USE_AR = { Clinic: 'عيادة', Admin: 'مكتب إداري', Commercial: 'محل تجاري' };
  var USE_EN = { Clinic: 'Clinic', Admin: 'Office', Commercial: 'Shop' };

  /* "Building E" -> "E": the letter the drawings print */
  function bLetter(name, u) { return String(name || u.building || '').replace(/^Building\s*/i, ''); }

  var TEXT = {
    en: {
      sample: '⚠️ SAMPLE — plan terms not yet confirmed by Main Marks',
      headline: function (s, pl) {
        var d = pctOf(s.discountPct);
        if (s.cash) return '🔥 ' + d + '% off · cash 🔥';
        var down = pl.down ? pctOf(pl.down) + '% down' : 'No down payment';
        return '🔥 ' + (s.discount ? d + '% off · ' : '') + down + ' · ' + pl.years + ' years to pay 🔥';
      },
      size: function (u) { return '🔷 ' + (USE_EN[u.type] || u.type) + ' · ' + money(u.area) + ' m²'; },
      where: function (u, b) { return '🔷 ' + (FLOOR_EN[u.fid] || u.floor) + ' · Building ' + b; },
      before: function (v) { return '👈 Price before discount ~' + v + '~'; },
      after: function (v) { return '👈 *Price after discount EGP ' + v + '* 🔥'; },
      price: function (v) { return '👈 *Price EGP ' + v + '* 🔥'; },
      cash: '👈 *One payment, in cash* 🔥',
      down: function (v) { return '👈 *Down payment EGP ' + v + '* 🔥'; },
      noDown: '👈 *No down payment* 🔥',
      quarter: function (v) { return '👈 *Every 3 months EGP ' + v + '* 🔥'; },
      monthly: function (v) { return '👈 That is about EGP ' + v + ' a month'; },
      until: function (d) { return '⏳ Offer valid until ' + d.getDate() + ' ' + MONTHS_EN[d.getMonth()] + ' ' + d.getFullYear(); },
      contact: function (name, phone) { return '📞 ' + [name, phone].filter(Boolean).join(' · '); }
    },
    ar: {
      sample: '⚠️ عينة — شروط الخطة لم تؤكدها Main Marks بعد',
      headline: function (s, pl) {
        if (s.cash) return '🔥خصم ' + isoPct(s.discountPct) + ' كاش🔥';
        var yrs = pl.years + (pl.years <= 10 ? ' سنين' : ' سنة');
        var down = pl.down ? 'بمقدم ' + isoPct(pl.down) : 'بدون مقدم';
        return '🔥' + (s.discount ? 'خصم ' + isoPct(s.discountPct) + ' و' : '') + 'تقسيط على ' + yrs + ' ' + down + '🔥';
      },
      size: function (u) { return '🔷 ' + (USE_AR[u.type] || u.type) + ' ' + money(u.area) + ' متر'; },
      where: function (u, b) { return '🔷 ' + (FLOOR_AR[u.fid] || u.floor) + ' · مبنى ' + b; },
      before: function (v) { return '👈السعر قبل الخصم ~' + v + '~'; },
      after: function (v) { return '👈*السعر بعد الخصم ' + v + '*🔥'; },
      price: function (v) { return '👈*السعر ' + v + '*🔥'; },
      cash: '👈*الدفع كاش مرة واحدة*🔥',
      down: function (v) { return '👈*مقدم ' + v + '*🔥'; },
      noDown: '👈*بدون مقدم*🔥',
      quarter: function (v) { return '👈*قسط كل 3 شهور ' + v + '*🔥'; },
      monthly: function (v) { return '👈يعني حوالي ' + v + ' في الشهر'; },
      until: function (d) { return '⏳ العرض ساري حتى ' + d.getDate() + ' ' + MONTHS_AR[d.getMonth()] + ' ' + d.getFullYear(); },
      contact: function (name, phone) { return '📞 للتواصل: ' + [name, phone].filter(Boolean).join(' · '); }
    }
  };

  /* o: { project, line, unit, plan, buildingName, lang, agent:{name,phone}|null, date }
     The schedule is worked HERE from the plan, the way the PDF works it,
     so a caller cannot hand in a stale one. */
  function caption(o) {
    var p = o.project, u = o.unit, pl = o.plan, T = TEXT[o.lang === 'en' ? 'en' : 'ar'];
    if (!u || !u.sellable) throw new Error('this unit is not available, so it cannot be posted');
    var when = o.date || new Date();
    var ok = MM.plans.applicable(p.plans, u.type, when).some(function (x) { return x.id === pl.id; });
    if (!ok) throw new Error('the plan ' + pl.label + ' is not offered on this unit today');
    var s = MM.plans.schedule({ listPrice: u.listPrice, discount: pl.discount || 0, plan: pl, terms: p.terms || {}, from: when });
    if (!s) throw new Error('no schedule could be worked for this plan');
    if (s.broken) throw new Error('the schedule does not add up: ' + s.broken.join('; '));

    var lines = [];
    if (p.post && p.post.sample) lines.push(T.sample, '');
    lines.push(T.headline(s, pl));
    lines.push('✨ ' + ((o.line && o.line.name) || p.name) + ' ✨');
    lines.push('📍' + u.code);
    lines.push(T.size(u));
    lines.push(T.where(u, bLetter(o.buildingName, u)));
    if (s.discount) { lines.push(T.before(money(s.list))); lines.push(T.after(money(s.payable))); }
    else lines.push(T.price(money(s.payable)));
    lines.push('');
    if (s.cash) lines.push(T.cash);
    else {
      lines.push(s.down ? T.down(money(s.down)) : T.noDown);
      lines.push(T.quarter(money(s.each)));
      /* "about": the posts quote a month, Main Marks bills a quarter */
      var inst = Math.max(s.each, s.lastInstalment || 0);
      lines.push(T.monthly(money(Math.ceil(inst / (s.everyMonths || 3)))));
    }
    if (pl.until) lines.push('', T.until(new Date(pl.until + 'T12:00:00')));
    if (o.agent && (o.agent.name || o.agent.phone)) {
      lines.push('', T.contact((o.agent.name || '').trim(), (o.agent.phone || '').trim()));
    }
    return lines.join('\n');
  }

  /* ================================================================ picture */

  var imgs = {};
  function loadImage(src) {
    if (!imgs[src]) {
      imgs[src] = new Promise(function (ok, fail) {
        var im = new Image();
        im.onload = function () { ok(im); };
        im.onerror = function () { delete imgs[src]; fail(new Error('Could not load ' + src)); };
        im.src = src + '?v=' + V;
      });
    }
    return imgs[src];
  }

  /* the drawing, the cut and the traced outline: all three, or no picture */
  function canPicture(p, u) {
    var a = (p.offer && p.offer.art) || {};
    return !!(u && p.offer && p.offer.masterFromFloor && a.master &&
      a.plates && a.plates[u.building] && a.plates[u.building][u.fid] &&
      a.floors && a.floors[u.fid] &&
      p.plates && p.plates[u.building] && p.plates[u.building][u.fid] &&
      p.unitShapes && p.unitShapes[u.code]);
  }

  /* the Ayyam pin (CCR js/units.js mapPin): a teardrop, its TIP on the spot */
  var PIN_D = 'M12 1.2C6.92 1.2 2.8 5.32 2.8 10.4c0 2.6 1.36 5.72 3.2 8.86' +
    ' 1.85 3.15 4.12 6.2 5.36 7.8a.8.8 0 0 0 1.28 0c1.24-1.6 3.51-4.65 5.36-7.8' +
    ' 1.84-3.14 3.2-6.26 3.2-8.86 0-5.08-4.12-9.2-9.2-9.2z';
  function pin(ctx, x, y, h, colour) {
    if (!root.Path2D) return;
    var k = h / 34;
    ctx.save();
    ctx.translate(x - 12 * k, y - 27.6 * k);
    ctx.scale(k, k);
    ctx.shadowColor = 'rgba(0,0,0,.45)'; ctx.shadowBlur = 5 / k; ctx.shadowOffsetY = 2.5 / k;
    var body = new root.Path2D(PIN_D);
    ctx.fillStyle = colour; ctx.fill(body);
    ctx.shadowColor = 'transparent';
    ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 1.3; ctx.stroke(body);
    ctx.fillStyle = '#FFFFFF'; ctx.beginPath(); ctx.arc(12, 10.4, 3.4, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }
  function poly(ctx, pts) {
    ctx.beginPath();
    pts.forEach(function (q, i) { if (i) ctx.lineTo(q[0], q[1]); else ctx.moveTo(q[0], q[1]); });
    ctx.closePath();
  }

  /* The Moray Wellness CI, as the PDF uses it (js/pdf.js) */
  var TEAL = '#095569', ORANGE = '#FA6126', CHAR = '#191819', GREY = '#5B6670', RULE = '#DCE3E6';

  var PIC = {
    en: { building: function (b) { return 'BUILDING ' + b; }, use: function (u) { return (USE_EN[u.type] || u.type).toUpperCase(); },
          area: function (u) { return money(u.area) + ' m²'; }, where: function (u, b) { return (FLOOR_EN[u.fid] || u.floor) + ' · Building ' + b; },
          sample: 'SAMPLE · terms to be confirmed' },
    ar: { building: function (b) { return 'مبنى ' + b; }, use: function (u) { return USE_AR[u.type] || u.type; },
          area: function (u) { return money(u.area) + ' متر'; }   /* the posts' word; a canvas puts ² on the wrong side in Arabic */, where: function (u, b) { return (FLOOR_AR[u.fid] || u.floor) + ' · مبنى ' + b; },
          sample: 'عينة · الشروط قيد التأكيد' }
  };

  /* o: { project, unit, buildingName, lang } -> Promise<Blob> */
  function picture(o) {
    var p = o.project, u = o.unit, W8 = PIC[o.lang === 'ar' ? 'ar' : 'en'], AR_PIC = o.lang === 'ar';
    if (!canPicture(p, u)) return Promise.reject(new Error('Unit ' + u.code + ' has no drawing yet'));
    var a = p.offer.art, box = p.plates[u.building][u.fid], shape = p.unitShapes[u.code], R = p.offer.masterFromFloor;
    var fontsReady = root.document && document.fonts && document.fonts.load
      ? Promise.all(['600 100px Manrope', '500 30px Manrope', '700 22px Manrope', '600 30px "IBM Plex Sans Arabic"', '500 30px "IBM Plex Sans Arabic"']
          .map(function (f) { return document.fonts.load(f, AR_PIC ? 'عيادة' : 'A'); })).catch(function () {})
      : Promise.resolve();
    return Promise.all([loadImage(a.master), loadImage(a.plates[u.building][u.fid]), loadImage(a.floors[u.fid]),
      a.logoOrange ? loadImage(a.logoOrange) : Promise.resolve(null), fontsReady])
      .then(function (g) {
        var master = g[0], plate = g[1], plan = g[2], logo = g[3];
        var W = 1200, F = '"Manrope", "IBM Plex Sans Arabic", "Segoe UI", Arial, sans-serif';
        var letter = bLetter(o.buildingName, u);

        /* ---- the master plan, whole (Ayyam: a broker who does not know
           Moray needs to see where the building sits in all of it) ---- */
        var ms = W / master.naturalWidth, MH = Math.round(master.naturalHeight * ms);
        var bw = box[2] - box[0], bh = box[3] - box[1];
        var PAD = 44, GAP = 40, DH = 820, DW = Math.round(DH * bw / bh);
        var H = MH + PAD + DH + PAD;
        var cv = document.createElement('canvas');
        cv.width = W; cv.height = H;
        var ctx = cv.getContext('2d');
        ctx.imageSmoothingQuality = 'high';
        /* Arabic words read right to left; the drawing itself is never mirrored */
        if (AR_PIC && 'direction' in ctx) ctx.direction = 'rtl';
        ctx.fillStyle = '#FFFFFF'; ctx.fillRect(0, 0, W, H);
        ctx.drawImage(master, 0, 0, W, MH);

        /* the building lit, the rest veiled: its cut is found on the master
           plan through the measured fit (config masterFromFloor), never by eye */
        var toM = function (x, y) { return [(R.s * x + R.tx) * ms, (R.s * y + R.ty) * ms]; };
        var e0 = toM(box[0], box[1]), e1 = toM(box[2], box[3]);
        ctx.fillStyle = 'rgba(255,255,255,.55)';
        ctx.fillRect(0, 0, W, e0[1]);
        ctx.fillRect(0, e1[1], W, MH - e1[1]);
        ctx.fillRect(0, e0[1], e0[0], e1[1] - e0[1]);
        ctx.fillRect(e1[0], e0[1], W - e1[0], e1[1] - e0[1]);
        ctx.strokeStyle = ORANGE; ctx.lineWidth = 5;
        ctx.strokeRect(e0[0], e0[1], e1[0] - e0[0], e1[1] - e0[1]);
        /* the building's tag, beside it (above would cover the top road) */
        var tag = W8.building(letter);
        ctx.font = '700 22px ' + F;
        var tw = ctx.measureText(tag).width + 28, tx = e0[0] - tw - 12, ty = e0[1] + 6;
        if (tx < 12) tx = e1[0] + 12;
        ctx.fillStyle = ORANGE;
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(tx, ty, tw, 38, 19); else ctx.rect(tx, ty, tw, 38);
        ctx.fill();
        ctx.fillStyle = '#FFFFFF'; ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
        ctx.fillText(tag, tx + 14, ty + 20);
        /* the clinic itself, pinned where it sits in the building */
        var cx = shape.reduce(function (s, q) { return s + q[0]; }, 0) / shape.length;
        var cy = shape.reduce(function (s, q) { return s + q[1]; }, 0) / shape.length;
        var pm = toM(cx, cy);
        pin(ctx, pm[0], pm[1], 64, ORANGE);
        ctx.fillStyle = RULE; ctx.fillRect(0, MH, W, 2);

        /* ---- under it: the clinic on its floor (right), the facts (left) ---- */
        var top = MH + PAD, dx = W - PAD - DW;
        ctx.drawImage(plate, dx, top, DW, DH);
        ctx.strokeStyle = RULE; ctx.lineWidth = 2; ctx.strokeRect(dx, top, DW, DH);
        var pts = shape.map(function (q) { return [dx + (q[0] - box[0]) / bw * DW, top + (q[1] - box[1]) / bh * DH]; });
        poly(ctx, pts); ctx.fillStyle = 'rgba(250,97,38,.42)'; ctx.fill();
        poly(ctx, pts); ctx.strokeStyle = ORANGE; ctx.lineWidth = 4; ctx.stroke();

        var lx = PAD, lw = dx - GAP - PAD, y = top;
        if (logo) {
          var lgw = Math.min(lw, 330), lgh = lgw * logo.naturalHeight / logo.naturalWidth;
          ctx.drawImage(logo, lx, y, lgw, lgh);
          y += lgh + 56;
        }
        ctx.textBaseline = 'alphabetic';
        ctx.fillStyle = GREY; ctx.font = '700 22px ' + F;
        var kicker = W8.use(u);
        if (AR_PIC) ctx.font = '600 26px ' + F;
        if ('letterSpacing' in ctx && !AR_PIC) ctx.letterSpacing = '4px';   /* Arabic is never letterspaced */
        ctx.fillText(kicker, lx, y + 22);
        if ('letterSpacing' in ctx) ctx.letterSpacing = '0px';
        ctx.fillStyle = TEAL; ctx.font = '600 104px ' + F;
        ctx.fillText(u.code, lx - 4, y + 128);
        ctx.fillStyle = CHAR; ctx.font = '500 40px ' + F;
        ctx.fillText(W8.area(u), lx, y + 190);
        ctx.fillStyle = GREY; ctx.font = '500 30px ' + F;
        ctx.fillText(W8.where(u, letter), lx, y + 238);
        y += 290;

        /* the key plan: where this wing sits on the whole floor */
        var kh = top + DH - y, kw = kh * plan.naturalWidth / plan.naturalHeight;
        if (kw > lw) { kw = lw; kh = kw * plan.naturalHeight / plan.naturalWidth; }
        var ky = top + DH - kh;
        ctx.drawImage(plan, lx, ky, kw, kh);
        var ks = kw / plan.naturalWidth;
        ctx.strokeStyle = ORANGE; ctx.lineWidth = 3.5;
        ctx.strokeRect(lx + box[0] * ks, ky + box[1] * ks, bw * ks, bh * ks);
        ctx.fillStyle = ORANGE; ctx.beginPath(); ctx.arc(lx + cx * ks, ky + cy * ks, 7, 0, Math.PI * 2); ctx.fill();

        if (p.post && p.post.sample) {
          /* the PDF's warning, on the picture itself: a caption can be deleted */
          ctx.font = '700 22px ' + F;
          var label = W8.sample;
          var sw = ctx.measureText(label).width + 32;
          ctx.fillStyle = ORANGE;
          ctx.beginPath();
          if (ctx.roundRect) ctx.roundRect(16, 16, sw, 40, 20); else ctx.rect(16, 16, sw, 40);
          ctx.fill();
          ctx.fillStyle = '#FFFFFF'; ctx.textBaseline = 'middle'; ctx.fillText(label, 32, 37);
        }
        return new Promise(function (ok, fail) {
          cv.toBlob(function (b) { b ? ok(b) : fail(new Error('Could not make the picture.')); }, 'image/jpeg', 0.9);
        });
      });
  }

  /* ============================================== several options (build 96)

     "Send these options" (Muhanad, 2026-10-03, after a mock-up he approved):
     the cards Find a unit answers with — the answer, the best value, the
     stretch — leave as ONE post, so the advice reaches the broker and the
     dearer unit is in front of the client with its exact extra cost.

       picture  the master plan with the building lit; under it the floor
                drawing with every option in orange. The numbers sit just
                OUTSIDE the drawing, level with their unit: on the unit they
                covered the drawing's own code and size. Only when every
                option is traced on ONE floor drawing; otherwise text alone.
       caption  what the options share (floor, plan) once on top; then each
                option: code, size, why it is there, price, instalment.

     Rules kept from the single post: every figure from MM.plans.schedule;
     no price on the picture; SAMPLE while config says so; fail closed.
     Filters only (the By unit tab) carry no plan: the price alone. */
  var KEYCAP = ['1', '2', '3', '4'].map(function (d) { return d + String.fromCharCode(0xFE0F, 0x20E3); });
  var OPT = {
    en: {
      head: function (n) { return '🔥 ' + n + ' options for your client 🔥'; },
      where: function (f, b) { return '🔷 ' + f + ' · Building ' + b; },
      planLine: function (s, pl) {
        if (s.cash) return '💰 ' + pctOf(s.discountPct) + '% off · cash';
        return '💰 ' + (s.discount ? pctOf(s.discountPct) + '% off · ' : '') + (pl.down ? pctOf(pl.down) + '% down' : 'No down payment') + ' · ' + pl.years + ' years to pay';
      },
      unit: function (i, u) { return KEYCAP[i] + ' 📍*' + u.code + '* · ' + (USE_EN[u.type] || u.type) + ' ' + money(u.area) + ' m²'; },
      role: { fit: '✅ Fits the budget', cheapest: '✅ Lowest price', value: '✅ Lowest price per m²', lower: '✅ Lower price', stretch: '⬆️ A step up' },
      twins: function (c) { return ' (also ' + c.join(', ') + ')'; },
      stepQ: function (m2, v) { return ': ' + m2 + ' m² more for EGP ' + v + ' more every 3 months'; },
      stepC: function (m2, v) { return ': ' + m2 + ' m² more for EGP ' + v + ' more'; },
      stepM: function (m2) { return ': ' + m2 + ' m² more'; },
      price: function (v) { return '👈 Price EGP ' + v; },
      before: function (v) { return '👈 Price before discount ~' + v + '~'; },
      after: function (v) { return '👈 Price after discount EGP ' + v; },
      cash: '👈 *One payment, in cash*',
      down: function (v) { return '👈 Down payment EGP ' + v; },
      quarter: function (v, m) { return '👈 *Every 3 months EGP ' + v + '* (about ' + m + ' a month)'; },
      picRole: { fit: 'Fits the budget', cheapest: 'Lowest price', value: 'Lowest price per m²', lower: 'Lower price', stretch: 'A step up in size' },
      picHead: function (n, u) { return n + ' ' + (USE_EN[u.type] || u.type).toUpperCase() + ' OPTIONS'; }
    },
    ar: {
      head: function (n) { return '🔥 ' + n + ' اختيارات لعميلك 🔥'; },
      where: function (f, b) { return '🔷 ' + f + ' · مبنى ' + b; },
      planLine: function (s, pl) {
        if (s.cash) return '💰 خصم ' + isoPct(s.discountPct) + ' كاش';
        return '💰 ' + (s.discount ? 'خصم ' + isoPct(s.discountPct) + ' و' : '') + 'تقسيط على ' + pl.years + (pl.years <= 10 ? ' سنين ' : ' سنة ') + (pl.down ? 'بمقدم ' + isoPct(pl.down) : 'بدون مقدم');
      },
      unit: function (i, u) { return KEYCAP[i] + ' 📍*' + u.code + '* · ' + (USE_AR[u.type] || u.type) + ' ' + money(u.area) + ' متر'; },
      role: { fit: '✅ الأنسب للميزانية', cheapest: '✅ أقل سعر', value: '✅ أقل سعر للمتر', lower: '✅ سعر أقل', stretch: '⬆️ خطوة أعلى' },
      twins: function (c) { return ' (ومثلها ' + c.join(' و') + ')'; },
      stepQ: function (m2, v) { return ': مساحة أكبر بـ ' + m2 + ' متر بزيادة ' + v + ' كل 3 شهور'; },
      stepC: function (m2, v) { return ': مساحة أكبر بـ ' + m2 + ' متر بزيادة ' + v; },
      stepM: function (m2) { return ': مساحة أكبر بـ ' + m2 + ' متر'; },
      price: function (v) { return '👈 السعر ' + v; },
      before: function (v) { return '👈 السعر قبل الخصم ~' + v + '~'; },
      after: function (v) { return '👈 السعر بعد الخصم ' + v; },
      cash: '👈 *الدفع كاش مرة واحدة*',
      down: function (v) { return '👈 مقدم ' + v; },
      quarter: function (v, m) { return '👈 *قسط كل 3 شهور ' + v + '* (حوالي ' + m + ' في الشهر)'; },
      picRole: { fit: 'الأنسب للميزانية', cheapest: 'أقل سعر', value: 'أقل سعر للمتر', lower: 'سعر أقل', stretch: 'مساحة أكبر' },
      /* several of them: the plural */
      picHead: function (n, u) { return n + ' اختيارات · ' + ({ Clinic: 'عيادات', Admin: 'مكاتب إدارية', Commercial: 'محلات تجارية' }[u.type] || u.type); }
    }
  };
  /* "Lowest price per m²" is a thin claim when the gap is a few pounds
     (E125 beats E124 by EGP 33 a metre): under 1% apart, and cheaper in
     total, the broker is told the plain thing — it costs less. */
  var THIN = 0.01;
  function roleOf(x, first) {
    if (x.role !== 'value') return x.role;
    var a = x.unit.listPrice / x.unit.area, b = first.unit.listPrice / first.unit.area;
    return (b - a) / b < THIN && x.unit.listPrice < first.unit.listPrice ? 'lower' : 'value';
  }
  function samePlace(opts) {
    return opts.every(function (x) { return x.unit.fid === opts[0].unit.fid && x.unit.building === opts[0].unit.building; });
  }

  /* o: { project, line, options:[{unit, plan|null, role, buildingName}], all:[units], lang, agent, date } */
  function captionOptions(o) {
    var p = o.project, L = o.lang === 'en' ? 'en' : 'ar', X = OPT[L], T = TEXT[L], opts = o.options || [];
    var FL = L === 'en' ? FLOOR_EN : FLOOR_AR, when = o.date || new Date();
    if (opts.length < 2 || opts.length > KEYCAP.length) throw new Error('a post of options needs two to four units');
    var S = opts.map(function (x) {
      var u = x.unit, pl = x.plan;
      if (!u || !u.sellable) throw new Error('unit ' + (u && u.code) + ' is not available, so it cannot be posted');
      if (!pl) return null;
      if (!MM.plans.applicable(p.plans, u.type, when).some(function (q) { return q.id === pl.id; })) {
        throw new Error('the plan ' + pl.label + ' is not offered on ' + u.code + ' today');
      }
      var s = MM.plans.schedule({ listPrice: u.listPrice, discount: pl.discount || 0, plan: pl, terms: p.terms || {}, from: when });
      if (!s) throw new Error('no schedule could be worked for ' + u.code);
      if (s.broken) throw new Error('the schedule of ' + u.code + ' does not add up: ' + s.broken.join('; '));
      return s;
    });
    var planned = S.every(Boolean);
    if (!planned && S.some(Boolean)) throw new Error('some options have a plan and some do not');
    var onePlan = planned && opts.every(function (x) { return x.plan.id === opts[0].plan.id; });
    var onePlace = samePlace(opts);
    var codes = opts.map(function (x) { return x.unit.code; });

    var lines = [];
    if (p.post && p.post.sample) lines.push(T.sample, '');
    lines.push(X.head(opts.length));
    lines.push('✨ ' + ((o.line && o.line.name) || p.name) + ' ✨');
    if (onePlace) lines.push(X.where(FL[opts[0].unit.fid] || opts[0].unit.floor, bLetter(opts[0].buildingName, opts[0].unit)));
    if (onePlan) lines.push(X.planLine(S[0], opts[0].plan));
    opts.forEach(function (x, i) {
      var u = x.unit, s = S[i], u0 = opts[0].unit, role = X.role[roleOf(x, opts[0])];
      if (x.role === 'stretch') {
        var m2 = money(u.area - u0.area);
        role += !planned ? X.stepC(m2, money(u.listPrice - u0.listPrice))
          : !onePlan ? X.stepM(m2)
          : s.cash ? X.stepC(m2, money(s.payable - S[0].payable)) : X.stepQ(m2, money(s.each - S[0].each));
      } else {
        /* identical units still for sale: the broker's backups */
        var tw = (o.all || []).filter(function (y) {
          return y.sellable && codes.indexOf(y.code) < 0 && y.listPrice === u.listPrice && y.area === u.area && y.fid === u.fid && y.building === u.building;
        }).map(function (y) { return y.code; });
        if (tw.length) role += X.twins(tw);
      }
      lines.push('', X.unit(i, u), role);
      if (!onePlace) lines.push(X.where(FL[u.fid] || u.floor, bLetter(x.buildingName, u)));
      if (!s) { lines.push(X.price(money(u.listPrice))); return; }
      if (!onePlan) lines.push(X.planLine(s, x.plan));
      if (s.discount) lines.push(X.before(money(s.list)), X.after(money(s.payable))); else lines.push(X.price(money(s.payable)));
      if (s.cash) lines.push(X.cash);
      else {
        if (s.down) lines.push(X.down(money(s.down)));
        lines.push(X.quarter(money(s.each), money(Math.ceil(Math.max(s.each, s.lastInstalment || 0) / (s.everyMonths || 3)))));
      }
    });
    var until = planned ? opts.map(function (x) { return x.plan.until; }).filter(Boolean).sort()[0] : null;
    if (until) lines.push('', T.until(new Date(until + 'T12:00:00')));
    if (o.agent && (o.agent.name || o.agent.phone)) {
      lines.push('', T.contact((o.agent.name || '').trim(), (o.agent.phone || '').trim()));
    }
    return lines.join('\n');
  }

  /* one picture needs every option traced on the SAME floor drawing */
  function canPictureOptions(p, opts) {
    return !!(opts && opts.length > 1 && samePlace(opts) && opts.every(function (x) { return canPicture(p, x.unit); }));
  }

  /* o: { project, options, lang } -> Promise<Blob> */
  function pictureOptions(o) {
    var p = o.project, opts = o.options, AR_PIC = o.lang === 'ar', L = AR_PIC ? 'ar' : 'en', W8 = PIC[L], X = OPT[L];
    if (!canPictureOptions(p, opts)) return Promise.reject(new Error('These units are not all on one traced drawing'));
    var u0 = opts[0].unit, a = p.offer.art, box = p.plates[u0.building][u0.fid], R = p.offer.masterFromFloor;
    var fontsReady = root.document && document.fonts && document.fonts.load
      ? Promise.all(['600 100px Manrope', '500 30px Manrope', '700 22px Manrope', '600 30px "IBM Plex Sans Arabic"', '500 30px "IBM Plex Sans Arabic"']
          .map(function (f) { return document.fonts.load(f, AR_PIC ? 'عيادة' : 'A'); })).catch(function () {})
      : Promise.resolve();
    return Promise.all([loadImage(a.master), loadImage(a.plates[u0.building][u0.fid]), loadImage(a.floors[u0.fid]),
      a.logoOrange ? loadImage(a.logoOrange) : Promise.resolve(null), fontsReady])
      .then(function (g) {
        var master = g[0], plate = g[1], plan = g[2], logo = g[3];
        var W = 1200, F = '"Manrope", "IBM Plex Sans Arabic", "Segoe UI", Arial, sans-serif';
        var letter = bLetter(opts[0].buildingName, u0);
        var ms = W / master.naturalWidth, MH = Math.round(master.naturalHeight * ms);
        var bw = box[2] - box[0], bh = box[3] - box[1];
        var PAD = 44, GAP = 40, DH = 860, DW = Math.round(DH * bw / bh);
        var H = MH + PAD + DH + PAD;
        var cv = document.createElement('canvas');
        cv.width = W; cv.height = H;
        var ctx = cv.getContext('2d');
        ctx.imageSmoothingQuality = 'high';
        if (AR_PIC && 'direction' in ctx) ctx.direction = 'rtl';
        ctx.fillStyle = '#FFFFFF'; ctx.fillRect(0, 0, W, H);
        ctx.drawImage(master, 0, 0, W, MH);

        /* the building lit on the whole master plan, one pin on it */
        var toM = function (x, y) { return [(R.s * x + R.tx) * ms, (R.s * y + R.ty) * ms]; };
        var e0 = toM(box[0], box[1]), e1 = toM(box[2], box[3]);
        ctx.fillStyle = 'rgba(255,255,255,.55)';
        ctx.fillRect(0, 0, W, e0[1]);
        ctx.fillRect(0, e1[1], W, MH - e1[1]);
        ctx.fillRect(0, e0[1], e0[0], e1[1] - e0[1]);
        ctx.fillRect(e1[0], e0[1], W - e1[0], e1[1] - e0[1]);
        ctx.strokeStyle = ORANGE; ctx.lineWidth = 5;
        ctx.strokeRect(e0[0], e0[1], e1[0] - e0[0], e1[1] - e0[1]);
        var tag = W8.building(letter);
        ctx.font = '700 22px ' + F;
        var tw = ctx.measureText(tag).width + 28, tx = e0[0] - tw - 12, ty = e0[1] + 6;
        if (tx < 12) tx = e1[0] + 12;
        ctx.fillStyle = ORANGE;
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(tx, ty, tw, 38, 19); else ctx.rect(tx, ty, tw, 38);
        ctx.fill();
        ctx.fillStyle = '#FFFFFF'; ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
        ctx.fillText(tag, tx + 14, ty + 20);
        pin(ctx, (e0[0] + e1[0]) / 2, (e0[1] + e1[1]) / 2, 64, ORANGE);
        ctx.fillStyle = RULE; ctx.fillRect(0, MH, W, 2);

        function badge(x, y, r, n) {
          ctx.save();
          if ('direction' in ctx) ctx.direction = 'ltr';
          ctx.fillStyle = ORANGE; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
          ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = r / 7; ctx.stroke();
          ctx.fillStyle = '#FFFFFF'; ctx.font = '700 ' + Math.round(r * 1.15) + 'px ' + F;
          ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.fillText(String(n), x, y + r * 0.06);
          ctx.restore();
        }

        /* the floor drawing (right): every option in orange, its number beside it */
        var top = MH + PAD, dx = W - PAD - DW;
        ctx.drawImage(plate, dx, top, DW, DH);
        ctx.strokeStyle = RULE; ctx.lineWidth = 2; ctx.strokeRect(dx, top, DW, DH);
        opts.forEach(function (x, i) {
          var shape = p.unitShapes[x.unit.code];
          var pts = shape.map(function (q) { return [dx + (q[0] - box[0]) / bw * DW, top + (q[1] - box[1]) / bh * DH]; });
          poly(ctx, pts); ctx.fillStyle = 'rgba(250,97,38,.42)'; ctx.fill();
          poly(ctx, pts); ctx.strokeStyle = ORANGE; ctx.lineWidth = 4; ctx.stroke();
          var cx = shape.reduce(function (s, q) { return s + q[0]; }, 0) / shape.length;
          var cy = shape.reduce(function (s, q) { return s + q[1]; }, 0) / shape.length;
          badge(cx < (box[0] + box[2]) / 2 ? dx - 21 : dx + DW + 21, top + (cy - box[1]) / bh * DH, 17, i + 1);
        });

        /* the left column: the logo, what they share, one row per option, the key plan */
        var lx = PAD, lw = dx - GAP - PAD, y = top;
        if (logo) {
          var lgw = Math.min(lw, 300), lgh = lgw * logo.naturalHeight / logo.naturalWidth;
          ctx.drawImage(logo, lx, y, lgw, lgh);
          y += lgh + 50;
        }
        ctx.textBaseline = 'alphabetic'; ctx.textAlign = 'left';
        ctx.fillStyle = GREY; ctx.font = (AR_PIC ? '600 26px ' : '700 22px ') + F;
        if ('letterSpacing' in ctx && !AR_PIC) ctx.letterSpacing = '4px';
        ctx.fillText(X.picHead(opts.length, u0), lx, y + 22);
        if ('letterSpacing' in ctx) ctx.letterSpacing = '0px';
        ctx.font = '500 30px ' + F;
        ctx.fillText(W8.where(u0, letter), lx, y + 66);
        y += 104;
        var ROW = 132;
        opts.forEach(function (x, i) {
          ctx.fillStyle = RULE; ctx.fillRect(lx, y, lw, 2);
          badge(lx + 30, y + ROW / 2 + 1, 30, i + 1);
          ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
          ctx.save();
          if ('direction' in ctx) ctx.direction = 'ltr';
          ctx.fillStyle = TEAL; ctx.font = '600 62px ' + F;
          ctx.fillText(x.unit.code, lx + 82, y + 66);
          var cw = ctx.measureText(x.unit.code).width;
          ctx.restore();
          ctx.fillStyle = CHAR; ctx.font = '500 34px ' + F;
          ctx.fillText(W8.area(x.unit), lx + 82 + cw + 22, y + 64);
          ctx.fillStyle = GREY; ctx.font = (AR_PIC ? '600 ' : '500 ') + '28px ' + F;
          ctx.fillText(X.picRole[roleOf(x, opts[0])], lx + 82, y + 108);
          y += ROW;
        });
        ctx.fillStyle = RULE; ctx.fillRect(lx, y, lw, 2);
        y += 36;
        var kh = top + DH - y, kw = kh * plan.naturalWidth / plan.naturalHeight;
        if (kw > lw) { kw = lw; kh = kw * plan.naturalHeight / plan.naturalWidth; }
        if (kh >= 150) {
          var ky = top + DH - kh, ks = kw / plan.naturalWidth;
          ctx.drawImage(plan, lx, ky, kw, kh);
          ctx.strokeStyle = ORANGE; ctx.lineWidth = 3.5;
          ctx.strokeRect(lx + box[0] * ks, ky + box[1] * ks, bw * ks, bh * ks);
        }

        if (p.post && p.post.sample) {
          ctx.font = '700 22px ' + F;
          var label = W8.sample, sw = ctx.measureText(label).width + 32;
          ctx.fillStyle = ORANGE;
          ctx.beginPath();
          if (ctx.roundRect) ctx.roundRect(16, 16, sw, 40, 20); else ctx.rect(16, 16, sw, 40);
          ctx.fill();
          ctx.fillStyle = '#FFFFFF'; ctx.textBaseline = 'middle'; ctx.textAlign = 'left'; ctx.fillText(label, 32, 37);
        }
        return new Promise(function (ok, fail) {
          cv.toBlob(function (b) { b ? ok(b) : fail(new Error('Could not make the picture.')); }, 'image/jpeg', 0.9);
        });
      });
  }

  /* ================================================================ sheet */

  var AGENT_KEY = 'mm.agent';
  function readAgent(fallbackName) {
    var a = null;
    try { a = JSON.parse(localStorage.getItem(AGENT_KEY) || 'null'); } catch (e) { a = null; }
    return a || { on: false, name: fallbackName || '', phone: '' };
  }
  function saveAgent(a) { try { localStorage.setItem(AGENT_KEY, JSON.stringify(a)); } catch (e) { /* not remembered */ } }

  /* o: { project, line, unit, plan, buildingName, who, session, kit:{handheld, canShare, shareOrTimeOut, saveFile}, demo }
     build 96: or, in place of unit + plan, options:[{unit, plan|null, role, buildingName}] and all:[units] */
  function open(o) {
    var el = MM.el, t = MM.t, kit = o.kit;
    var many = !!(o.options && o.options.length > 1);
    var codes = many ? o.options.map(function (x) { return x.unit.code; }) : [o.unit.code];
    var hasPic = many ? canPictureOptions(o.project, o.options) : canPicture(o.project, o.unit);
    var lang = MM.lang === 'ar' ? 'ar' : 'en';           /* the app's language (js/i18n.js) */
    var agent = readAgent((o.session && o.session.name) || '');
    var file = null, fileUrl = null;

    var box = el('div', 'q q-who q-post');
    box.setAttribute('role', 'dialog'); box.setAttribute('aria-modal', 'true'); box.setAttribute('aria-labelledby', 'qPostH');
    var dim = el('div', 'q-who-dim');
    var card = el('div', 'q-who-card q-post-card');
    var head = el('div', 'q-post-head');
    var hl = el('div');
    hl.appendChild(el('p', 'q-k', o.who && o.who.audience === 'broker' && o.who.company
      ? t('WhatsApp post') + ' · ' + o.who.company : t('WhatsApp post') + ' · ' + t('General broadcast')));
    var h = el('h3', null, many ? t('{n} options', { n: codes.length }) + ' · ' + codes.join(', ') : t('Clinic {code}', { code: o.unit.code })); h.id = 'qPostH';
    if (!many && o.unit.type !== 'Clinic') h.textContent = o.unit.code;
    hl.appendChild(h);
    head.appendChild(hl);
    var x = el('button', 'q-post-x', '×'); x.type = 'button'; x.setAttribute('aria-label', t('Close'));
    head.appendChild(x);
    card.appendChild(head);

    var shot = el('div', 'q-post-shot');
    card.appendChild(shot);

    var agentRow = el('label', 'q-post-check');
    var agentOn = el('input'); agentOn.type = 'checkbox'; agentOn.checked = !!agent.on;
    agentRow.appendChild(agentOn); agentRow.appendChild(el('span', null, t('Add my name and number')));
    card.appendChild(agentRow);
    var agentBox = el('div', 'q-post-agent');
    var nameIn = el('input', 'q-select'); nameIn.type = 'text'; nameIn.placeholder = t('Your name'); nameIn.value = agent.name || ''; nameIn.autocomplete = 'name';
    var phoneIn = el('input', 'q-select'); phoneIn.type = 'tel'; phoneIn.placeholder = t('Your mobile number'); phoneIn.value = agent.phone || ''; phoneIn.autocomplete = 'tel'; phoneIn.dir = 'ltr';
    agentBox.appendChild(nameIn); agentBox.appendChild(phoneIn);
    agentBox.hidden = !agent.on;
    card.appendChild(agentBox);

    var ta = el('textarea', 'q-post-text');
    ta.rows = 13;
    ta.setAttribute('aria-label', t('The post text. You can edit it before sending.'));
    card.appendChild(ta);

    var acts = el('div', 'q-who-acts q-post-acts');
    var copy = el('button', 'q-ghost', t('Copy text')); copy.type = 'button';
    var send = el('button', 'q-cta', t('Send on WhatsApp')); send.type = 'button';
    acts.appendChild(copy); acts.appendChild(send);
    card.appendChild(acts);
    var note = el('p', 'q-who-note q-post-note'); note.setAttribute('aria-live', 'polite');
    card.appendChild(note);

    box.appendChild(dim); box.appendChild(card);

    function flash(msg) { note.textContent = msg; }
    function writeText() {
      try {
        var ag = agentOn.checked ? { name: nameIn.value, phone: phoneIn.value } : null;
        ta.value = many
          ? captionOptions({ project: o.project, line: o.line, options: o.options, all: o.all, lang: lang, agent: ag })
          : caption({ project: o.project, line: o.line, unit: o.unit, plan: o.plan, buildingName: o.buildingName, lang: lang, agent: ag });
        copy.disabled = false;
      } catch (e) {
        ta.value = '';
        copy.disabled = send.disabled = true;
        flash(t('The post could not be made: {e}', { e: e.message }));
      }
      ta.dir = lang === 'ar' ? 'rtl' : 'ltr';
      send.disabled = !ta.value || (hasPic && !file);
    }
    agentOn.addEventListener('change', function () {
      agentBox.hidden = !agentOn.checked;
      saveAgent({ on: agentOn.checked, name: nameIn.value, phone: phoneIn.value });
      writeText();
      if (agentOn.checked && !phoneIn.value) phoneIn.focus();
    });
    [nameIn, phoneIn].forEach(function (i) {
      i.addEventListener('input', function () { saveAgent({ on: agentOn.checked, name: nameIn.value, phone: phoneIn.value }); writeText(); });
    });

    /* copy without awaiting anything first, with a fallback for pages the
       clipboard API refuses (plain http on a phone is one) */
    function copyNow() {
      var done = false;
      try {
        if (navigator.clipboard && root.isSecureContext) {
          navigator.clipboard.writeText(ta.value).catch(function () { /* refused: the text is still in the box */ });
          done = true;
        }
      } catch (e) { done = false; }
      if (!done) {
        ta.focus(); ta.select();
        try { done = document.execCommand('copy'); } catch (e2) { done = false; }
        ta.setSelectionRange(0, 0);
      }
      return done;
    }
    copy.addEventListener('click', function () {
      flash(copyNow() ? t('Copied. Paste it into WhatsApp.') : t('Select the text above and copy it.'));
    });

    send.addEventListener('click', function () {
      if (send.disabled) return;
      /* the demo's phone answers inside the demo (demo.html) */
      if (o.demo && typeof o.demo.sharePost === 'function') {
        o.demo.sharePost({ text: ta.value, image: file, unit: codes.join(', '), audience: o.who && o.who.audience, company: o.who && o.who.company,
          /* which cards went: the manager's view will want to know what sells */
          options: many ? o.options.map(function (x) { return { unit: x.unit.code, role: x.role }; }) : null });
        close();
        return;
      }
      /* the picture was made when the sheet opened, so the share runs
         straight from the tap: an iPhone refuses a share after an await */
      var copied = copyNow();
      if (file && kit.handheld() && kit.canShare({ files: [file] })) {
        var payload = kit.canShare({ files: [file], text: ta.value }) ? { files: [file], text: ta.value } : { files: [file] };
        kit.shareOrTimeOut(payload).then(function () {
          /* WhatsApp on an iPhone often drops the caption from a shared picture */
          flash(copied ? t('Sent to the share sheet. If WhatsApp shows the picture without the text, paste it: it is copied.') : t('Sent to the share sheet.'));
        }, function (e) {
          if (e && e.name === 'AbortError') { flash(t('Not sent.')); return; }
          kit.saveFile(file);
          flash(t('The share sheet did not open, so the picture was saved and the text copied. Attach the picture in WhatsApp and paste the text.'));
        });
        return;
      }
      /* a laptop: WhatsApp Web with the text, the picture saved to attach
         (a web page cannot hand WhatsApp Web a picture) */
      /* NOT wa.me: its redirect turns every emoji into U+FFFD (seen 2026-10-03);
         WhatsApp's own address keeps them */
      root.open('https://api.whatsapp.com/send?text=' + encodeURIComponent(ta.value), '_blank', 'noopener');
      if (file) { kit.saveFile(file); flash(t('WhatsApp opened with the text. The picture is saved: attach it there.')); }
    });

    function close() {
      box.classList.remove('in');
      document.removeEventListener('keydown', onKey);
      setTimeout(function () { if (box.parentNode) box.parentNode.removeChild(box); if (fileUrl) URL.revokeObjectURL(fileUrl); }, 300);
    }
    function onKey(e) { if (e.key === 'Escape') close(); }
    x.addEventListener('click', close);
    dim.addEventListener('click', close);
    document.addEventListener('keydown', onKey);

    writeText();
    if (hasPic) {
      shot.appendChild(el('p', 'q-who-note', t('Making the picture…')));
      (many ? pictureOptions({ project: o.project, options: o.options, lang: lang })
            : picture({ project: o.project, unit: o.unit, buildingName: o.buildingName, lang: lang })).then(function (blob) {
        file = new File([blob], 'Moray Wellness - ' + codes.join(' ') + '.jpg', { type: 'image/jpeg' });
        fileUrl = URL.createObjectURL(blob);
        shot.textContent = '';
        var im = el('img');
        im.src = fileUrl;
        im.alt = many ? t('The picture that goes with the post: the master plan with the building lit, and the options numbered on their floor')
          : t('The picture that goes with the post: the master plan with the building lit, and the clinic on its floor');
        shot.appendChild(im);
        writeText();
      }, function (e) {
        shot.textContent = '';
        shot.appendChild(el('p', 'q-who-note', t('The picture could not be made: {e}. The text can still be sent.', { e: e.message })));
        file = null;
        send.disabled = !ta.value;
      });
    } else {
      shot.appendChild(el('p', 'q-who-note', many
        ? t('No picture for these units yet: they are not all traced on one floor drawing. The text goes alone.')
        : t('No picture for this unit yet: its floor drawing is not traced. The text goes alone.')));
    }

    document.body.appendChild(box);
    void box.offsetWidth;
    box.classList.add('in');
    x.focus();
  }

  MM.post = { caption: caption, picture: picture, canPicture: canPicture, open: open,
              captionOptions: captionOptions, pictureOptions: pictureOptions, canPictureOptions: canPictureOptions };
  if (typeof module === 'object' && module.exports) module.exports = MM.post;
}(typeof window !== 'undefined' ? window : globalThis));
