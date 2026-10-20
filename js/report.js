/* ------------------------------------------------------------------
   Main Marks — a Team Pulse report, as a PDF, in English or Arabic.

   WHY (Muhanad, 2026-10-06): whatever the manager downloads must be "a
   very detailed PDF with infographics, with charts", its tables as clean
   as the payment plan sheet, in Main Marks' branding and carrying the
   name of the manager who made it.

   BUILD 145, LOOK B, EMBER (his choice on 2026-10-11, of three looks
   drawn on the agent plan sheet: Main Marks Handoff, "Agent plan sheet,
   three looks to choose", pages 6 to 9; his ask on 2026-10-21: "make
   sure that the style of the report we choosed is applied in the app").
   The app's own look on paper: warm black pages, Manrope, orange as the
   signal, A4 upright. Every page:
     - a band: the wordmark, what the report is, whose, which dates, and
       a DEMO pill while the figures are a demo;
     - ONE SUBJECT PER PAGE, its head a big orange number, an orange
       label and the title, a rule under it;
     - what the page found, in plain sentences, at the top;
     - at the side, WHERE IT IS IN THE APP, as a path in words ("Team ›
       Build Check"). The look he chose had a picture of the screen
       there; the phone cannot photograph its own screen into a file, so
       the path names it instead (told to him, 2026-10-21);
     - the chart and the table under them, the width of the page;
     - HOW IT IS COUNTED at the foot;
     - page dots, one for each subject, and "n of m".
   The cover: the title, the report in one sentence, its figures, and
   what is in it, with the page of each.

   THE INPUT is the same `report` js/xlsx.js takes, plus `sections`:
     { title, kind, subtitle, by, demo, rtl, answer, meta, summary, where,
       coverChart, labels,
       sections: [{ kicker, title, text: [..], notes: [..], where: [..],
                    charts: [{ type, title, rows, ... }],
                    tables: [{ title, cols, rows, total, more }] }] }
     notes  what the page found: the sentences at the top
     text   how it is counted: the words at the foot
     where  the path in the app, a list of names; the report's own when
            a section has none
   chart types: 'hbar' rows [[label, n, note, colour]];
                'columns' rows [[label, n, colour]];
                'stacked' series [{ name, color }], rows [[label, [n, n]]];
                'donut' rows [[label, n, colour]] (six parts at most).
   The page never works a figure out here: every number arrives in the
   report, so the PDF and the Excel file cannot disagree.

   THE COLOURS a caller sends were chosen for white paper (black bars, a
   light grey for "nothing yet"). On warm black they would vanish, so
   each is given its Ember tone here (`tone`); a colour never carries a
   fact alone, the number is printed beside it.

   Rules carried from the offer PDF (js/pdf.js) and the playbook: fonts
   are EMBEDDED and chosen PER STRING (a brokerage's name may be Arabic in
   an English report); Arabic pages are MIRRORED, not re-laid; text that
   does not fit is CUT with an ellipsis, measured.

   DOM-free: the caller hands over jsPDF, the fonts, js/arabic.js and the
   disarm() from js/pdf.js.
   ------------------------------------------------------------------ */
(function (root) {
  'use strict';

  /* LOOK B, EMBER: the plan sheet's own values (tools/plan-sheet-2.js, .look-ember) */
  var PAPER = '#100C09', PANEL = '#1B140E', BANDROW = '#17110C', INK = '#F6F0E9', MUT = '#AB9F93', FAINT = '#6A5D51';
  var RULE = '#34281D', ACCENT = '#F7951E', BAR = '#6B5E52', HOT = '#FF8F78', GOOD = '#43CF9C';
  var MM_ = 2.8346;                              /* points in a millimetre */
  var M = 15 * MM_, BAND = 13 * MM_, FOOTH = 17 * MM_;
  var SIDE = 66 * MM_, GAP = 9 * MM_;

  var MON_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  var MON_AR = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];

  /* a white-paper colour, in its Ember tone */
  var TONES = { '#0C0907': BAR, '#141210': BAR, '#000000': BAR, '#CFC8C0': '#4D4137', '#1E9E78': GOOD, '#E0A800': '#F2C037', '#C4472F': HOT, '#7C8794': '#8B96A3' };
  function tone(hex) { var k = String(hex || '').toUpperCase(); return TONES[k] || hex || BAR; }
  /* the ink a number takes on top of a part of that colour */
  function inkOn(hex) { var h = String(hex).replace('#', ''), r = parseInt(h.slice(0, 2), 16), g = parseInt(h.slice(2, 4), 16), b = parseInt(h.slice(4, 6), 16); return (r * 299 + g * 587 + b * 114) / 1000 > 150 ? PAPER : INK; }

  function num(v) { return Math.round(v).toLocaleString('en-US'); }
  function two(n) { return (n < 10 ? '0' : '') + n; }

  /* The invisible direction marks the page's translator wraps round every
     number in Arabic. Right on screen; in a PDF they have no glyph and
     print as empty boxes. Built from code points: this file holds no
     invisible characters of its own. */
  var MARKS = new RegExp('[' + String.fromCharCode(0x2066) + '-' + String.fromCharCode(0x2069) +
    String.fromCharCode(0x200E) + String.fromCharCode(0x200F) + ']', 'g');
  /* build 120: Arabic vowel marks (the tanween on the last letter of "never", a kasra, a shadda).
     jsPDF does not position a mark on its letter, so each one prints beside it as a stray tick.
     Arabic reads normally without them, so the PDF drops them. The screen keeps them. */
  var HARAKAT = new RegExp('[' + String.fromCharCode(0x064B) + '-' + String.fromCharCode(0x0652) + String.fromCharCode(0x0670) + ']', 'g');
  function clean(s) { return String(s == null ? '' : s).replace(MARKS, '').replace(HARAKAT, ''); }

  function build(o) {
    var rep = o.report;
    var W = 595.28, H = 841.89;                  /* A4 upright, as the look he chose */
    var RTL = !!rep.rtl, L = rep.labels || {}, A = o.arabic;
    var CW = W - 2 * M, LW = CW - SIDE - GAP, SX = M + LW + GAP;

    var doc = new o.jsPDF({ unit: 'pt', format: 'a4', orientation: 'portrait', compress: true });
    var fam = { en: {}, ar: {} };
    o.fonts.forEach(function (f) {
      doc.addFileToVFS(f.file, f.base64);
      doc.addFont(f.file, f.family, 'normal');
      fam[f.lang][f.weight] = f.family;
    });
    var needAr = RTL || o.hasArabicText;
    if (!fam.en.normal) throw new Error('The English fonts are missing; refusing to fall back to an unembedded face.');
    if (needAr && (!fam.ar.normal || !A || !o.disarm)) throw new Error('This report has Arabic in it and the Arabic fonts are missing.');
    var undo = needAr ? o.disarm(doc, o.jsPDF) : function () {};
    doc.setProperties({ title: rep.title, subject: rep.subtitle || '', author: rep.by || '', creator: 'Main Marks sales app' });

    function isAr(s) { return !!A && needAr && A.hasArabic(String(s)); }
    function face(s, weight) { var set = isAr(s) ? fam.ar : fam.en; return set[weight] || set.normal; }
    function shape(s) { return isAr(s) ? A.forPdf(s) : s; }
    function setF(s, weight, size) { doc.setFont(face(s, weight), 'normal'); doc.setFontSize(size); }
    function width(s, weight, size, spacing) { s = clean(s); setF(s, weight, size); return doc.getTextWidth(shape(s)) + (spacing && !isAr(s) ? spacing * Math.max(0, s.length - 1) : 0); }
    function mx(x, w) { return RTL ? W - x - (w || 0) : x; }
    /* THE text funnel. x is where the text STARTS in reading order; align
       'end' puts its END there instead. Mirrored for Arabic. */
    function put(s, x, y, weight, size, colour, align, spacing) {
      var str = clean(s);
      setF(str, weight, size);
      doc.setTextColor(colour || INK);
      var a = align === 'end' ? 'right' : align === 'center' ? 'center' : 'left';
      if (RTL) { x = W - x; a = a === 'left' ? 'right' : a === 'right' ? 'left' : a; }
      doc.text(shape(str), x, y, spacing && !isAr(str) ? { align: a, charSpace: spacing } : { align: a });
    }
    /* small capitals with air between the letters: the labels of the look. Arabic has no capitals. */
    function caps(s) { return RTL ? clean(s) : clean(s).toUpperCase(); }
    function label(s, x, y, colour, size) { put(caps(s), x, y, 'semi', size || 6.9, colour || MUT, null, 1.05); }
    function fit(s, max, weight, size) {
      var str = clean(s);
      if (width(str, weight, size) <= max) return str;
      var lo = 0, hi = str.length;
      while (lo < hi) {
        var mid = Math.ceil((lo + hi) / 2);
        if (width(str.slice(0, mid) + '…', weight, size) <= max) lo = mid; else hi = mid - 1;
      }
      return str.slice(0, lo).replace(/\s+$/, '') + '…';
    }
    function wrap(s, max, weight, size) {
      var words = clean(s).split(' '), lines = [], line = '';
      words.forEach(function (w) {
        var tryLine = line ? line + ' ' + w : w;
        if (line && width(tryLine, weight, size) > max) { lines.push(line); line = w; } else line = tryLine;
      });
      if (line) lines.push(line);
      return lines;
    }
    function box(x, y, w, h, hex) { doc.setFillColor(hex); doc.rect(mx(x, w), y, w, h, 'F'); }
    function rule(x, y, w, hex, lw) { doc.setDrawColor(hex || RULE); doc.setLineWidth(lw || 0.5); doc.line(mx(x, 0), y, mx(x + w, 0), y); }

    function date(d) { return d.getDate() + ' ' + (RTL ? MON_AR : MON_EN)[d.getMonth()] + ' ' + d.getFullYear(); }
    function fmt(v, type) {
      if (v === null || v === undefined || v === '') return '—';
      if ((type === 'date' || type === 'datetime') && v instanceof Date && !isNaN(v.getTime())) {
        return date(v) + (type === 'datetime' ? '  ' + two(v.getHours()) + ':' + two(v.getMinutes()) : '');
      }
      if (typeof v === 'number' && isFinite(v)) {
        if (type === 'pct') return Math.round(v * 100) + '%';
        if (type === 'money') return RTL ? num(v) + ' جنيه' : 'EGP ' + num(v);
        return num(v);
      }
      return String(v);
    }
    function short(v) { var m = String(Math.round(v / 1e5) / 10); return RTL ? m + ' مليون' : 'EGP ' + m + 'M'; }
    var numeric = function (type) { return type === 'int' || type === 'money' || type === 'pct'; };

    var sections = rep.sections || [];
    var y = 0, pages = 0, BOTTOM = H - FOOTH - 8, bottom = BOTTOM, at = 0;   /* `at`: the subject of this page, 0 on the cover */
    var pageOf = [];                                                          /* the page each subject begins on */

    /* every page: the warm black, and the band */
    function paper() {
      box(0, 0, W, H, PAPER);
      if (o.logo) {
        var lh = 10.5, lw = lh * o.logo.w / o.logo.h;
        doc.addImage(o.logo.data, 'PNG', mx(M, lw), (BAND - lh) / 2, lw, lh);
      } else put('MAIN MARKS', M, BAND / 2 + 3.5, 'semi', 11, INK, null, 1.2);
      rule(0, BAND, W, RULE, 0.7);
      var end = W - M;
      if (rep.demo) {
        var dl = caps(L.demoFoot || 'DEMO FIGURES'), dw = width(dl, 'semi', 6.6, 0.8) + 16;
        doc.setFillColor(ACCENT);
        doc.roundedRect(mx(end - dw, dw), BAND / 2 - 6.5, dw, 13, 6.5, 6.5, 'F');
        put(dl, end - dw / 2, BAND / 2 + 2.4, 'semi', 6.6, PAPER, 'center', 0.8);
        end -= dw + 12;
      }
      /* what it is (muted) · whose (ink) · the dates (muted), as the look's band does */
      var room = end - M - 90, kind = caps(rep.kind || ''), who = caps(rep.title || ''), when = caps(rep.range || '');
      var sep = '  ·  ', wk = width(kind + sep, 'normal', 6.9, 0.7), ww = width(who, 'semi', 6.9, 0.7), wd = width(sep + when, 'normal', 6.9, 0.7);
      if (wk + ww + wd > room) { kind = ''; wk = 0; }
      if (ww + wd > room) who = fit(who, Math.max(40, room - wd), 'semi', 6.9);
      ww = width(who, 'semi', 6.9, 0.7);
      var x0 = end - (wk + ww + wd);
      if (kind) put(kind + sep, x0, BAND / 2 + 2.4, 'normal', 6.9, MUT, null, 0.7);
      put(who, x0 + wk, BAND / 2 + 2.4, 'semi', 6.9, INK, null, 0.7);
      if (when) put(sep + when, x0 + wk + ww, BAND / 2 + 2.4, 'normal', 6.9, MUT, null, 0.7);
    }
    function page() { if (pages) doc.addPage('a4', 'portrait'); pages++; paper(); y = BAND + 13 * MM_; bottom = BOTTOM; }
    function fits(h) { return y + h <= bottom; }
    function para(text, max, size, colour, weight, lead, x) {
      wrap(text, max, weight || 'normal', size).forEach(function (line) {
        if (!fits(size + 4)) more();
        put(line, x || M, y, weight || 'normal', size, colour || INK);
        y += lead || size * 1.45;
      });
    }
    /* a subject that runs onto the next page: the band, and the subject named again, small */
    var cur = null;
    function more() {
      page();
      if (cur) { label((cur.kicker ? cur.kicker + '  ·  ' : '') + cur.title + ' — ' + (L.continued || 'continued'), M, y, ACCENT, 7.2); y += 22; }
    }
    function chartTitle(s, x, w, aside) {
      if (!s) return;
      put(fit(s, w - (aside ? width(aside, 'normal', 8) + 10 : 0), 'semi', 9.5), x, y, 'semi', 9.5, INK);
      if (aside) put(aside, x + w, y, 'normal', 8, MUT, 'end');
      y += 16;
    }

    /* ---- charts, each with its numbers printed; `x`, `w` the room it has ---- */
    function hbar(ch, x, w) {
      var rows = ch.rows.filter(function (r) { return r[1] > 0 || ch.keepZero; });
      if (!rows.length) return;
      x = x || M; w = w || CW;
      var narrow = w < 300, rowH = narrow ? 25 : 18, need = 18 + rows.length * rowH + 8;
      if (!fits(need)) more();
      chartTitle(ch.title, x, w);
      var max = rows.reduce(function (m, r) { return Math.max(m, r[1]); }, 0) || 1;
      if (narrow) {
        /* the side column: the name and the number on a line, the bar the width of the column under them */
        rows.forEach(function (r) {
          var tag = ch.fmt ? ch.fmt(r[1]) : num(r[1]);
          put(fit(r[0], w - width(tag, 'semi', 9) - 8, 'normal', 8.2), x, y + 8, 'normal', 8.2, MUT);
          put(tag, x + w, y + 8, 'semi', 9, INK, 'end');
          box(x, y + 12.5, w, 5, PANEL);
          var bw = Math.max(r[1] > 0 ? 2 : 0, w * r[1] / max);
          if (bw) { doc.setFillColor(tone(r[3] || ch.color)); doc.roundedRect(mx(x, bw), y + 12.5, bw, 5, Math.min(2, bw / 2), 2, 'F'); }
          y += rowH;
        });
        y += 10;
        return;
      }
      var labW = Math.min(170, w * 0.32), valW = Math.min(150, w * 0.27), barW = w - labW - valW;
      rows.forEach(function (r) {
        put(fit(r[0], labW - 10, 'normal', 8.5), x, y + 9, 'normal', 8.5, INK);
        var bw = Math.max(2, barW * r[1] / max);
        doc.setFillColor(tone(r[3] || ch.color));
        doc.roundedRect(mx(x + labW, bw), y + 1.5, bw, 9.5, Math.min(2, bw / 2), 2, 'F');
        var tag = (ch.fmt ? ch.fmt(r[1]) : num(r[1])) + (r[2] ? '   ' + r[2] : '');
        put(fit(tag, valW + (barW - bw) - 8, 'semi', 8.5), x + labW + bw + 6, y + 9.5, 'semi', 8.5, INK);
        y += rowH;
      });
      y += 20;
    }
    function columns(ch) {
      var rows = ch.rows;
      if (!rows.length) return;
      var hgt = ch.height || 130, need = 18 + hgt + 34;
      if (!fits(need)) more();
      chartTitle(ch.title, M, CW);
      var axisW = 26, x0 = M + axisW, cw = CW - axisW, base = y + hgt + 8;
      var max = rows.reduce(function (m, r) { return Math.max(m, r[1]); }, 0) || 1;
      var step = max <= 4 ? 1 : Math.pow(10, Math.floor(Math.log(max) / Math.LN10));
      var top = Math.max(4, Math.ceil(max / step) * step);
      for (var g = 0; g <= 4; g++) {
        var gy = base - hgt * g / 4;
        rule(x0, gy, cw, g ? '#241A12' : FAINT, g ? 0.4 : 0.6);
        put(num(top * g / 4), x0 - 6, gy + 3, 'normal', 6.8, FAINT, 'end');
      }
      var slot = cw / rows.length, bw = Math.min(40, slot * 0.64);
      rows.forEach(function (r, i) {
        var h = hgt * r[1] / top, cx = x0 + slot * i + slot / 2, c = tone(r[2] || ch.color);
        if (h > 0) {
          doc.setFillColor(c);
          doc.roundedRect(mx(cx - bw / 2, bw), base - h, bw, h, Math.min(2.5, bw / 2), Math.min(2.5, h / 2), 'F');
          doc.rect(mx(cx - bw / 2, bw), base - Math.min(h, 3), bw, Math.min(h, 3), 'F');   /* square foot on the baseline */
        }
        put(num(r[1]), cx, base - h - 4, 'semi', 7.6, c === ACCENT ? ACCENT : INK, 'center');
        put(fit(r[0], slot - 2, 'normal', 6.8), cx, base + 11, 'normal', 6.8, MUT, 'center');
      });
      y = base + 34;
    }
    function legend(series, yy) {
      var x = M;
      series.forEach(function (s) {
        doc.setFillColor(tone(s.color));
        doc.roundedRect(mx(x, 8), yy - 7, 8, 8, 2, 2, 'F');
        put(s.name, x + 13, yy, 'normal', 8.2, MUT);
        x += 13 + width(s.name, 'normal', 8.2) + 16;
      });
    }
    function stacked(ch) {
      var rows = ch.rows;
      if (!rows.length) return;
      var rowH = 19, need = 18 + 20 + rows.length * rowH + 8;
      if (!fits(need)) more();
      chartTitle(ch.title, M, CW);
      legend(ch.series, y + 2);
      y += 16;
      var labW = 150, valW = 44, barW = CW - labW - valW;
      var max = rows.reduce(function (m, r) { return Math.max(m, r[1].reduce(function (a, v) { return a + v; }, 0)); }, 0) || 1;
      rows.forEach(function (r) {
        put(fit(r[0], labW - 10, 'normal', 8.5), M, y + 10, 'normal', 8.5, INK);
        var x = M + labW, total = 0;
        r[1].forEach(function (v, k) {
          total += v;
          if (!v) return;
          var w = barW * v / max, c = tone(ch.series[k].color);
          doc.setFillColor(c);
          doc.rect(mx(x, Math.max(0.5, w - 1.5)), y + 2, Math.max(0.5, w - 1.5), 11, 'F');   /* a sliver of paper between parts */
          if (w > 16) put(num(v), x + w / 2, y + 10.5, 'semi', 7.5, inkOn(c), 'center');
          x += w;
        });
        put(num(total), x + 6, y + 10.5, 'semi', 8.5, INK);
        y += rowH;
      });
      y += 20;
    }
    function arc(cx, cy, r0, r1, a0, a1) {
      var pts = [], n = Math.max(2, Math.ceil((a1 - a0) / (Math.PI / 90))), i, a;
      for (i = 0; i <= n; i++) { a = a0 + (a1 - a0) * i / n; pts.push([cx + r1 * Math.cos(a), cy + r1 * Math.sin(a)]); }
      for (i = n; i >= 0; i--) { a = a0 + (a1 - a0) * i / n; pts.push([cx + r0 * Math.cos(a), cy + r0 * Math.sin(a)]); }
      var d = [];
      for (i = 1; i < pts.length; i++) d.push([pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]]);
      doc.lines(d, pts[0][0], pts[0][1], [1, 1], 'F', true);
    }
    /* part-to-whole only, six parts at most, every part named with its count and share */
    function donut(ch, x, w) {
      var rows = ch.rows.filter(function (r) { return r[1] > 0; }).slice(0, 6);
      var total = rows.reduce(function (a, r) { return a + r[1]; }, 0);
      if (!total) return;
      x = x || M; w = w || CW;
      var narrow = w < 300, R = narrow ? 46 : 58, r0 = narrow ? 30 : 38;
      var need = 18 + 2 * R + 16 + (narrow ? rows.length * 17 : 0);
      if (!fits(need)) more();
      chartTitle(ch.title, x, w);
      /* the ring is drawn in page space, so it is placed where reading order puts it */
      var rx = narrow ? x + w / 2 : x + R, cx = RTL ? W - rx : rx, cy = y + R + 4;
      var a = -Math.PI / 2, GAPA = rows.length > 1 ? 0.012 : 0;
      rows.forEach(function (r) {
        var sweep = 2 * Math.PI * r[1] / total;
        doc.setFillColor(tone(r[2]));
        if (sweep > 2 * GAPA + 0.002) arc(cx, cy, r0, R, a + GAPA, a + sweep - GAPA);
        a += sweep;
      });
      put(num(total), rx, cy + 3, 'semi', 15, INK, 'center');
      if (ch.centre) put(fit(ch.centre, 2 * r0 - 10, 'normal', 7), rx, cy + 14, 'normal', 7, MUT, 'center');
      var lx = narrow ? x : x + 2 * R + 30, ly = narrow ? cy + R + 20 : y + 16, lw = narrow ? w : Math.min(330, x + w - lx);
      rows.forEach(function (r) {
        doc.setFillColor(tone(r[2]));
        doc.roundedRect(mx(lx, 9), ly - 7.5, 9, 9, 2, 2, 'F');
        put(fit(r[0], lw - 90, 'normal', 9), lx + 15, ly, 'normal', 9, INK);
        put(num(r[1]), lx + lw - 38, ly, 'semi', 9, INK, 'end');
        var share = r[1] / total * 100;
        put(share > 0 && share < 0.5 ? '<1%' : Math.round(share) + '%', lx + lw, ly, 'normal', 8.5, MUT, 'end');
        ly += narrow ? 17 : 20;
      });
      y = narrow ? ly + 6 : Math.max(cy + R + 18, ly + 4);
    }
    function chart(ch, x, w) {
      if (!ch) return;
      if (ch.type === 'hbar') hbar(ch, x, w);
      else if (ch.type === 'columns') columns(ch);
      else if (ch.type === 'stacked') stacked(ch);
      else if (ch.type === 'donut') donut(ch, x, w);
    }

    /* ---- the table, in the look: small capitals over an ink rule, a hairline under each row, the rows
       one a shade lighter than the next (his ask for every list, build 143), no frame ---- */
    function sheet(tb) {
      var rowsAll = tb.pdfRows || tb.rows;
      var avail = CW, rh = 17, PAD = 4.5;
      var total = tb.cols.reduce(function (a, c) { return a + (c.w || 12); }, 0);
      var ws = tb.cols.map(function (c) { return avail * (c.w || 12) / total; });
      var xs = [], at0 = M;
      ws.forEach(function (w) { xs.push(at0); at0 += w; });
      function title(cont) {
        put(fit(cont ? tb.title + ' — ' + (L.continued || 'continued') : tb.title, CW, 'semi', 10), M, y, 'semi', 10, INK);
        y += 12;
      }
      /* a heading that does not fit its column takes a second line; it is never cut to "Special r…" */
      var HS = 6.3, heads = tb.cols.map(function (c, j) { var l = wrap(caps(c.h), ws[j] - 2 * PAD, 'semi', HS); return l.length > 2 ? [l[0], fit(l.slice(1).join(' '), ws[j] - 2 * PAD, 'semi', HS)] : l; });
      var deep = heads.reduce(function (m, l) { return Math.max(m, l.length); }, 1), hh = deep > 1 ? 24 : 16;
      function header() {
        tb.cols.forEach(function (c, j) {
          heads[j].forEach(function (lab, k) {
            var ly = y + hh - 5 - (heads[j].length - 1 - k) * 8;
            if (numeric(c.type) || c.h === '#') put(lab, xs[j] + ws[j] - PAD, ly, 'semi', HS, MUT, 'end');
            else put(lab, xs[j] + PAD, ly, 'semi', HS, MUT);
          });
        });
        y += hh;
        rule(M, y, avail, INK, 0.8);
      }
      /* build 119: a short table is never split over two pages (seven salespeople had one on a page alone) */
      if (!fits(12 + hh + rh * (rowsAll.length <= 14 ? Math.max(1, rowsAll.length) : 3) + (tb.total && rowsAll.length <= 14 ? rh + 4 : 0))) more();
      title(false);
      header();
      if (!rowsAll.length) {
        put(L.none || 'Nothing in these dates.', M + PAD, y + 13, 'normal', 8.5, MUT);
        y += rh + 2;
        rule(M, y, avail, RULE, 0.5);
        y += 22;
        return;
      }
      /* ONE SIZE A COLUMN: the size at which its widest cell fits, so a row never mixes sizes. A name is not
         made smaller than can be read on a phone (6.4 pt) and is cut there; a figure or a date is never cut
         (a price printed as "EGP 39,123,0…"), it only gets smaller. */
      var fixed = function (c) { return numeric(c.type) || c.type === 'date' || c.type === 'datetime'; };
      var zs = tb.cols.map(function (c, j) {
        var wt = numeric(c.type) ? 'medium' : 'normal', max = ws[j] - 2 * PAD, lim = fixed(c) ? 5.4 : 6.4, z = 7.8;
        rowsAll.forEach(function (r) { var raw = fmt(r[j], c.type); while (z > lim && width(raw, wt, z) > max) z -= 0.2; });
        return Math.max(lim, z);
      });
      rowsAll.forEach(function (r, i) {
        /* the total never goes onto a page by itself: the last row goes with it */
        if (!fits(rh + (tb.total && i === rowsAll.length - 1 ? rh + 4 : 0))) { more(); title(true); header(); }
        if (i % 2) box(M, y, avail, rh, BANDROW);
        tb.cols.forEach(function (c, j) {
          /* build 119: a cell that does not fit gets smaller type first; a figure or a date is never cut
             (a price printed as "EGP 39,123,0…"), a name is cut only as the last resort */
          var raw = fmt(r[j], c.type), wt = numeric(c.type) ? 'medium' : 'normal', z = zs[j], max = ws[j] - 2 * PAD;
          var s = fixed(c) ? raw : fit(raw, max, wt, z);
          if (c.h === '#') put(s, xs[j] + ws[j] - PAD, y + 11.5, 'semi', z, ACCENT, 'end');
          else if (numeric(c.type)) put(s, xs[j] + ws[j] - PAD, y + 11.5, 'medium', z, INK, 'end');
          else put(s, xs[j] + PAD, y + 11.5, 'normal', z, raw === '—' ? FAINT : INK);
        });
        rule(M, y + rh, avail, RULE, 0.45);
        y += rh;
      });
      if (tb.total) {
        if (!fits(rh + 4)) { more(); title(true); header(); }
        rule(M, y, avail, INK, 0.8);
        y += 2;
        tb.cols.forEach(function (c, j) {
          var v = tb.total[j];
          if (v === undefined || v === null || v === '') return;
          var raw = fmt(v, c.type), max = ws[j] - 2 * PAD, z = 8.2;
          while (z > 5.4 && width(raw, 'semi', z) > max) z -= 0.2;
          var s = numeric(c.type) ? raw : fit(raw, max, 'semi', z);
          if (numeric(c.type)) put(s, xs[j] + ws[j] - PAD, y + 12, 'semi', z, INK, 'end');
          else put(s, xs[j] + PAD, y + 12, 'semi', z, INK);
        });
        y += rh;
      }
      if (tb.more) { y += 12; put(tb.more, M, y, 'normal', 8.2, MUT); }
      y += 22;
    }

    /* the side column: where it is in the app, as a path in words */
    function whereBlock(path, yy) {
      if (!path || !path.length) return yy;
      label(L.where || 'Where it is in the app', SX, yy);
      rule(SX, yy + 6, SIDE, INK, 0.8);
      var yy2 = yy + 22, x = SX, sep = '  ›  ';
      (path || []).forEach(function (p, i) {
        var s = clean(p), w0 = width(s, 'semi', 10);
        if (i) {
          var ws0 = width(sep, 'semi', 10);
          if (x + ws0 + Math.min(w0, 60) > SX + SIDE) { x = SX; yy2 += 15; }
          else { put(sep, x, yy2, 'semi', 10, ACCENT); x += ws0; }
        }
        s = fit(s, SX + SIDE - x, 'semi', 10);
        put(s, x, yy2, 'semi', 10, INK);
        x += width(s, 'semi', 10);
      });
      return yy2 + 10;
    }
    /* the foot of a subject's first page: how it is counted */
    function howBlock(text) {
      var lines = [];
      (text || []).forEach(function (p) { lines = lines.concat(wrap(p, LW, 'normal', 8.4)); });
      if (!lines.length) return 0;
      var h = 14 + 12 + lines.length * 12.2, top = BOTTOM - h;
      rule(M, top, LW, INK, 0.8);
      label(L.how || 'How it is counted', M, top + 14, INK, 6.7);
      lines.forEach(function (l, i) { put(l, M, top + 28 + i * 12.2, 'normal', 8.4, MUT); });
      return h + 14;
    }

    /* ---- the cover ---- */
    page();
    put(caps((rep.kind || '') + (rep.range ? '  ·  ' + rep.range : '')), M, y + 2, 'semi', 7.6, ACCENT, null, 1.1);
    y += 46;
    var tl = wrap(rep.title, CW, 'semi', 40);
    if (tl.length > 2) tl = wrap(rep.title, CW, 'semi', 30);
    var tsz = tl.length > 2 || width(rep.title, 'semi', 40) > CW ? 30 : 40;
    tl.slice(0, 3).forEach(function (line) { put(line, M, y, 'semi', tsz, INK); y += tsz * 1.08; });
    y += 4;
    if (rep.subtitle) { put(fit(rep.subtitle, CW, 'normal', 9.5), M, y, 'normal', 9.5, MUT); y += 14; }
    if (rep.by) { put(fit(rep.by, CW, 'normal', 9.5), M, y, 'normal', 9.5, MUT); y += 14; }
    y += 10;
    rule(M, y, CW, INK, 0.9);
    y += 34;
    var colTop = y;
    /* the side: where, and the picture of the whole */
    var sideY = whereBlock(rep.where || [], colTop - 10) + 22;
    if (rep.coverChart) { var keepY = y; y = sideY; chart(rep.coverChart, SX, SIDE); sideY = y; y = keepY; }
    /* in one sentence */
    label(L.sentence || 'In one sentence', M, y - 10, ACCENT, 7.2);
    y += 14;
    if (rep.answer) { para(rep.answer, LW, 15, INK, 'medium', 20); y += 4; }
    /* its figures, two to a row */
    var sum = (rep.summary || []).slice(0, 6);
    if (sum.length) {
      y += 4;
      var tw = (LW - 14) / 2, th = 46;
      sum.forEach(function (s, j) {
        var cx = M + (j % 2) * (tw + 14), cy = y + Math.floor(j / 2) * th;
        rule(cx, cy, tw, RULE, 0.5);
        var big = (s[2] || 'int') === 'text' ? String(s[1]) : s[2] === 'money' && s[1] >= 1e6 ? short(s[1]) : fmt(s[1], s[2] || 'int');
        put(fit(big, tw, 'semi', (s[2] || 'int') === 'text' ? 12 : 20), cx, cy + 24, 'semi', (s[2] || 'int') === 'text' ? 12 : 20, INK);
        put(fit(s[0], tw, 'normal', 7.8), cx, cy + 37, 'normal', 7.8, MUT);
      });
      y += Math.ceil(sum.length / 2) * th + 8;
    }
    /* what is in it, and the page of each (written in once every page is known) */
    var toc = [];
    if (sections.length) {
      y += 14;
      label(L.contents || 'In this report', M, y, MUT);
      y += 6;
      rule(M, y, LW, INK, 0.8);
      var tocBottom = BOTTOM - 26, rowT = 17.5, room = Math.floor((tocBottom - y) / rowT);
      var shown = sections.length > room ? sections.slice(0, Math.max(1, room - 1)) : sections;
      shown.forEach(function (sec, i) {
        var ry = y + 12.5;
        put(String(i + 1), M, ry, 'semi', 9, ACCENT);
        put(fit(sec.title, LW - 60, 'normal', 9), M + 24, ry, 'normal', 9, INK);
        toc.push({ i: i, y: ry });
        y += rowT;
        rule(M, y, LW, RULE, 0.45);
      });
      if (shown.length < sections.length) { y += 13; put((L.andMore || '{n} more inside').replace('{n}', sections.length - shown.length), M + 24, y, 'normal', 8.5, MUT); y += 6; }
    }
    var mt = (rep.meta || []).map(function (m) { return m[0] + ': ' + fmt(m[1], m[2]); }).join('   ·   ');
    if (mt) wrap(mt, CW, 'normal', 7.4).slice(0, 2).forEach(function (line, i, all) { put(line, M, BOTTOM - (all.length - 1 - i) * 10, 'normal', 7.4, FAINT); });

    /* ---- one subject per page ---- */
    sections.forEach(function (sec, i) {
      at = i + 1; cur = null;
      page();
      pageOf[i] = pages;
      /* the head: the big number, the label, the title, a rule */
      var n = String(i + 1), nw = width(n, 'semi', 54), tx = M + nw + 16, tmax = CW - nw - 16;
      var lines = wrap(sec.title, tmax, 'semi', 28), sz = 28;
      if (lines.length > 2) { lines = wrap(sec.title, tmax, 'semi', 22); sz = 22; }
      lines = lines.slice(0, 3);
      var top = y, base = top + 8 + (sec.kicker ? 30 : 22) + (lines.length - 1) * sz * 1.06;
      if (sec.kicker) label(sec.kicker, tx, top + 8, ACCENT, 7.6);
      lines.forEach(function (l, k) { put(l, tx, base - (lines.length - 1 - k) * sz * 1.06, 'semi', sz, INK); });
      put(n, M, base + 1, 'semi', 54, ACCENT);
      y = base + 17;
      rule(M, y, CW, INK, 0.9);
      y += 26;
      /* the foot first, so the page knows its room */
      bottom = BOTTOM - howBlock(sec.text);
      /* the side: where it is in the app */
      var sideEnd = whereBlock(sec.where || rep.where || [], y);
      /* what the page found */
      var found = (sec.notes || []).slice();
      if (!found.length && sec.text && sec.text.length && !(sec.charts || []).length && !(sec.tables || []).filter(function (t) { return !t.excelOnly; }).length) found = sec.text;
      found.forEach(function (p, k) {
        if (k) { y += 2; rule(M, y - 12, LW, RULE, 0.5); y += 6; }
        para(p, LW, 11.5, INK, 'medium', 16);
      });
      y = Math.max(y + 10, sideEnd + 14);
      cur = sec;
      (sec.charts || []).forEach(function (ch) { chart(ch); });
      (sec.tables || []).forEach(function (tb) { if (!tb.excelOnly) sheet(tb); });
    });

    /* the cover's contents get their pages, and every page its foot, once the count is known */
    var total = doc.getNumberOfPages();
    doc.setPage(1);
    toc.forEach(function (r) { put(String(pageOf[r.i] || ''), M + LW, r.y, 'normal', 9, MUT, 'end'); });
    var subjOf = function (p) { var s = 0; pageOf.forEach(function (q, k) { if (q <= p) s = k + 1; }); return s; };
    for (var p = 1; p <= total; p++) {
      doc.setPage(p);
      var fy = H - 9 * MM_, here = p === 1 ? 0 : subjOf(p), S = sections.length;
      /* the dots: one for each subject, this one lit, those before it drawn */
      var d = 11.5, gap = 2.6;
      while (S * (d + gap) > CW * 0.46 && d > 6) { d -= 0.5; gap = Math.max(1.2, gap - 0.1); }
      for (var k = 1; k <= S; k++) {
        var dx = M + (k - 1) * (d + gap) + d / 2, ccx = RTL ? W - dx : dx;
        if (k === here) { doc.setFillColor(INK); doc.circle(ccx, fy - 3, d / 2, 'F'); }
        else { doc.setDrawColor(k < here ? FAINT : RULE); doc.setLineWidth(0.6); doc.circle(ccx, fy - 3, d / 2 - 0.3, 'S'); }
        if (d >= 9) put(String(k), dx, fy - 0.6, 'semi', d * 0.52, k === here ? PAPER : k < here ? MUT : FAINT, 'center');
      }
      var mid = M + S * (d + gap) + 14, end = W - M;
      var pn = (L.page || 'Page {n} of {m}').replace('{n}', p).replace('{m}', total);
      put(pn, end, fy, 'normal', 7.2, MUT, 'end');
      var room2 = end - width(pn, 'normal', 7.2) - 14 - mid;
      if (rep.demo) {
        var dm = caps(L.demoFoot || 'DEMO FIGURES'), rest = clean(rep.demo), lab = clean(L.demoFoot || '');
        if (lab && rest.toLowerCase().indexOf(lab.toLowerCase()) === 0) rest = rest.slice(lab.length).replace(/^[\s.·:،-]+/, '');
        put(dm, mid, fy, 'semi', 7.2, ACCENT, null, 0.6);
        if (rest) put(fit(' · ' + rest, room2 - width(dm, 'semi', 7.2, 0.6), 'normal', 7.2), mid + width(dm, 'semi', 7.2, 0.6), fy, 'normal', 7.2, MUT);
      } else if (rep.by) put(fit(rep.by, room2, 'normal', 7.2), mid, fy, 'normal', 7.2, MUT);
    }
    undo();
    return doc;
  }

  var api = { build: build };
  if (typeof module === 'object' && module.exports) module.exports = api;
  else { root.MM = root.MM || {}; root.MM.report = api; }
}(typeof window !== 'undefined' ? window : globalThis));
