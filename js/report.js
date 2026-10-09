/* ------------------------------------------------------------------
   Main Marks — a Team Pulse report, as a PDF, in English or Arabic.

   WHY (Muhanad, 2026-10-06): whatever the manager downloads must be "a
   very detailed PDF with infographics, with charts", its tables as clean
   as the payment plan sheet, in Main Marks' branding and carrying the
   name of the manager who made it.

   This is the CCR Development App's sectioned report (its js/report.js,
   build 120), in Main Marks' colours and faces:
     - a black band on every page with the wordmark, who prepared it and
       when, and a DEMO pill while the figures are a demo;
     - a cover: what the report is, ONE sentence that says what it found,
       up to five tiles, one picture of the whole;
     - then ONE SECTION PER PAGE: an orange label, a title, the reading in
       plain sentences, a chart with its numbers printed on it, and a
       table laid out like the payment schedule (black header, thin
       gridlines both ways, a framed sheet, figures right-aligned, a
       total row).

   THE INPUT is the same `report` js/xlsx.js takes, plus `sections`:
     { title, kind, subtitle, by, demo, rtl, answer, meta, summary,
       coverChart, labels,
       sections: [{ kicker, title, text: [..], notes: [..],
                    charts: [{ type, title, rows, ... }],
                    tables: [{ title, cols, rows, total, more }] }] }
   chart types: 'hbar' rows [[label, n, note, colour]];
                'columns' rows [[label, n, colour]];
                'stacked' series [{ name, color }], rows [[label, [n, n]]];
                'donut' rows [[label, n, colour]] (six parts at most).
   The page never works a figure out here: every number arrives in the
   report, so the PDF and the Excel file cannot disagree.

   Rules carried from the offer PDF (js/pdf.js) and the playbook: fonts
   are EMBEDDED and chosen PER STRING (a brokerage's name may be Arabic in
   an English report); Arabic pages are MIRRORED, not re-laid; text that
   does not fit is CUT with an ellipsis, measured; a colour never carries
   a fact alone, the number is printed beside it.

   DOM-free: the caller hands over jsPDF, the fonts, js/arabic.js and the
   disarm() from js/pdf.js.
   ------------------------------------------------------------------ */
(function (root) {
  'use strict';

  var M = 36;                                    /* margin, in points */
  var BLACK = '#0C0907', ORANGE = '#F7951E', DEEP = '#B96200';
  var INK = '#141210', GREY = '#6B645D', PAPER = '#FFFFFF', WASH = '#FAF6F1';
  var GRID = '#DDD6CE', FRAME = '#A59C92', TOTALF = '#F3E9DC', AXIS = '#BDB4AA', FAINT = '#ECE5DD';
  var BAND = 46, FOOT = 26;

  var MON_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  var MON_AR = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];

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
    var W = 841.89, H = 595.28;                  /* A4 landscape: the tables are the point */
    var RTL = !!rep.rtl, L = rep.labels || {}, A = o.arabic;

    var doc = new o.jsPDF({ unit: 'pt', format: 'a4', orientation: 'landscape', compress: true });
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
    function width(s, weight, size) { s = clean(s); setF(s, weight, size); return doc.getTextWidth(shape(s)); }
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

    var y = 0, pages = 0, bottom = H - M - FOOT;

    /* every page: the black band, the mark, who made it, the DEMO pill */
    function paper() {
      box(0, 0, W, H, PAPER);
      box(0, 0, W, BAND, BLACK);
      box(0, BAND, W, 2, ORANGE);
      if (o.logo) {
        var lh = 13, lw = lh * o.logo.w / o.logo.h;
        doc.addImage(o.logo.data, 'PNG', mx(M, lw), (BAND - lh) / 2, lw, lh);
      } else put('MAIN MARKS', M, 28, 'semi', 11, '#FFFFFF', null, 1.2);
      var end = W - M;
      if (rep.demo) {
        var dl = L.demoFoot || 'DEMO FIGURES', dw = width(dl, 'semi', 7.5) + 18;
        doc.setFillColor(ORANGE);
        doc.roundedRect(mx(end - dw, dw), 15.500, dw, 15, 7.5, 7.5, 'F');
        put(dl, end - dw / 2, 26, 'semi', 7.5, BLACK, 'center');
        end -= dw + 14;
      }
      if (rep.by) put(fit(rep.by, 380, 'normal', 8), end, 26.500, 'normal', 8, '#D8CFC6', 'end');
    }
    function page() { if (pages) doc.addPage(); pages++; paper(); y = BAND + 34; }
    function fits(h) { return y + h <= bottom; }
    function kicker(s, yy) { put(RTL ? s : String(s).toUpperCase(), M, yy, 'semi', 8.5, DEEP, null, 1.1); }
    function para(text, size, colour, gapAfter) {
      wrap(text, W - 2 * M, 'normal', size).forEach(function (line) {
        if (!fits(size + 4)) page();
        put(line, M, y, 'normal', size, colour);
        y += size + 4.5;
      });
      y += gapAfter || 0;
    }
    function bullets(list) {
      (list || []).forEach(function (n) {
        var lines = wrap(n, W - 2 * M - 14, 'normal', 9.5);
        if (!fits(lines.length * 13.5 + 4)) page();
        doc.setFillColor(ORANGE);
        doc.rect(mx(M + 1, 4), y - 6, 4, 4, 'F');
        lines.forEach(function (line) { put(line, M + 12, y, 'normal', 9.5, INK); y += 13.5; });
        y += 3;
      });
      if (list && list.length) y += 6;
    }
    function chartTitle(s) { if (s) { put(s, M, y, 'semi', 10, INK); y += 15; } }

    /* ---- charts: drawn here, each with its numbers printed ---- */
    function hbar(ch) {
      var rows = ch.rows.filter(function (r) { return r[1] > 0 || ch.keepZero; });
      if (!rows.length) return;
      var rowH = 17, need = 16 + rows.length * rowH + 8;
      if (!fits(need)) page();
      chartTitle(ch.title);
      var labW = 190, valW = 170, barW = W - 2 * M - labW - valW;
      var max = rows.reduce(function (m, r) { return Math.max(m, r[1]); }, 0) || 1;
      rows.forEach(function (r) {
        put(fit(r[0], labW - 10, 'normal', 8.5), M, y + 9, 'normal', 8.5, INK);
        var bw = Math.max(2, barW * r[1] / max);
        doc.setFillColor(r[3] || ch.color || BLACK);
        doc.roundedRect(mx(M + labW, bw), y + 1.5, bw, 9.5, Math.min(2, bw / 2), 2, 'F');
        var tag = (ch.fmt ? ch.fmt(r[1]) : num(r[1])) + (r[2] ? '   ' + r[2] : '');
        put(fit(tag, valW + (barW - bw) - 8, 'semi', 8.5), M + labW + bw + 6, y + 9.5, 'semi', 8.5, INK);
        y += rowH;
      });
      y += 22;
    }
    function columns(ch) {
      var rows = ch.rows;
      if (!rows.length) return;
      var hgt = ch.height || 140, need = 16 + hgt + 30;
      if (!fits(need)) page();
      chartTitle(ch.title);
      var axisW = 34, x0 = M + axisW, cw = W - 2 * M - axisW, base = y + hgt + 8;
      var max = rows.reduce(function (m, r) { return Math.max(m, r[1]); }, 0) || 1;
      var step = max <= 4 ? 1 : Math.pow(10, Math.floor(Math.log(max) / Math.LN10));
      var top = Math.max(4, Math.ceil(max / step) * step);
      doc.setLineWidth(0.4);
      for (var g = 0; g <= 4; g++) {
        var gy = base - hgt * g / 4;
        doc.setDrawColor(g ? FAINT : AXIS);
        doc.line(mx(x0, 0), gy, mx(x0 + cw, 0), gy);
        put(num(top * g / 4), x0 - 6, gy + 3, 'normal', 7, GREY, 'end');
      }
      var slot = cw / rows.length, bw = Math.min(46, slot * 0.62);
      rows.forEach(function (r, i) {
        var h = hgt * r[1] / top, cx = x0 + slot * i + slot / 2;
        if (h > 0) {
          doc.setFillColor(r[2] || ch.color || BLACK);
          doc.roundedRect(mx(cx - bw / 2, bw), base - h, bw, h, Math.min(3, bw / 2), Math.min(3, h / 2), 'F');
          doc.rect(mx(cx - bw / 2, bw), base - Math.min(h, 3), bw, Math.min(h, 3), 'F');   /* square foot on the baseline */
        }
        put(num(r[1]), cx, base - h - 4, 'semi', 8, INK, 'center');
        put(fit(r[0], slot - 4, 'normal', 7.5), cx, base + 12, 'normal', 7.5, GREY, 'center');
      });
      y = base + 36;
    }
    function legend(series, yy) {
      var x = M;
      series.forEach(function (s) {
        doc.setFillColor(s.color);
        doc.roundedRect(mx(x, 9), yy - 7.5, 9, 9, 2, 2, 'F');
        put(s.name, x + 14, yy, 'normal', 8.5, INK);
        x += 14 + width(s.name, 'normal', 8.5) + 18;
      });
    }
    function stacked(ch) {
      var rows = ch.rows;
      if (!rows.length) return;
      var rowH = 19, need = 16 + 20 + rows.length * rowH + 8;
      if (!fits(need)) page();
      chartTitle(ch.title);
      legend(ch.series, y + 2);
      y += 16;
      var labW = 170, valW = 60, barW = W - 2 * M - labW - valW;
      var max = rows.reduce(function (m, r) { return Math.max(m, r[1].reduce(function (a, v) { return a + v; }, 0)); }, 0) || 1;
      rows.forEach(function (r) {
        put(fit(r[0], labW - 10, 'normal', 8.5), M, y + 10, 'normal', 8.5, INK);
        var x = M + labW, total = 0;
        r[1].forEach(function (v, k) {
          total += v;
          if (!v) return;
          var w = barW * v / max;
          doc.setFillColor(ch.series[k].color);
          doc.rect(mx(x, Math.max(0.5, w - 1.5)), y + 2, Math.max(0.5, w - 1.5), 11, 'F');   /* a sliver of paper between parts */
          if (w > 16) put(num(v), x + w / 2, y + 10.5, 'semi', 7.5, ch.series[k].ink || '#FFFFFF', 'center');
          x += w;
        });
        put(num(total), x + 6, y + 10.5, 'semi', 8.5, INK);
        y += rowH;
      });
      y += 22;
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
    function donut(ch) {
      var rows = ch.rows.filter(function (r) { return r[1] > 0; }).slice(0, 6);
      var total = rows.reduce(function (a, r) { return a + r[1]; }, 0);
      if (!total) return;
      var R = 62, r0 = 40, need = 16 + 2 * R + 16;
      if (!fits(need)) page();
      chartTitle(ch.title);
      var cx = RTL ? W - M - R : M + R, cy = y + R + 4;
      var a = -Math.PI / 2, GAP = rows.length > 1 ? 0.012 : 0;
      rows.forEach(function (r) {
        var sweep = 2 * Math.PI * r[1] / total;
        doc.setFillColor(r[2]);
        if (sweep > 2 * GAP + 0.002) arc(cx, cy, r0, R, a + GAP, a + sweep - GAP);
        a += sweep;
      });
      put(num(total), M + R, cy + 2, 'semi', 16, INK, 'center');
      if (ch.centre) put(fit(ch.centre, 2 * r0 - 10, 'normal', 7.5), M + R, cy + 14, 'normal', 7.5, GREY, 'center');
      var lx = M + 2 * R + 34, ly = y + 18;
      rows.forEach(function (r) {
        doc.setFillColor(r[2]);
        doc.roundedRect(mx(lx, 10), ly - 8, 10, 10, 2, 2, 'F');
        put(r[0], lx + 16, ly, 'normal', 9.5, INK);
        put(num(r[1]), lx + 250, ly, 'semi', 9.5, INK, 'end');
        var share = r[1] / total * 100;
        put(share > 0 && share < 0.5 ? '<1%' : Math.round(share) + '%', lx + 300, ly, 'normal', 9, GREY, 'end');
        ly += 20;
      });
      y = Math.max(cy + R + 16, ly + 4);
    }
    function chart(ch) {
      if (!ch) return;
      if (ch.type === 'hbar') hbar(ch);
      else if (ch.type === 'columns') columns(ch);
      else if (ch.type === 'stacked') stacked(ch);
      else if (ch.type === 'donut') donut(ch);
    }

    /* ---- the sheet: laid out like the payment schedule ---- */
    function sheet(tb) {
      var rowsAll = tb.pdfRows || tb.rows;
      var avail = W - 2 * M, hh = 21, rh = 15.5, PAD = 6;
      var total = tb.cols.reduce(function (a, c) { return a + (c.w || 12); }, 0);
      var ws = tb.cols.map(function (c) { return avail * (c.w || 12) / total; });
      var xs = [], at = M;
      ws.forEach(function (w) { xs.push(at); at += w; });
      var segTop = 0;
      function title(cont) {
        put(cont ? tb.title + ' — ' + (L.continued || 'continued') : tb.title, M, y, 'semi', 10.5, INK);
        y += 10;
      }
      /* a heading that does not fit its column takes a second line; it is never cut to "Special r…" */
      var heads = tb.cols.map(function (c, j) { var l = wrap(c.h, ws[j] - 2 * PAD, 'semi', 7.6); return l.length > 2 ? [l[0], fit(l.slice(1).join(' '), ws[j] - 2 * PAD, 'semi', 7.6)] : l; });
      var deep = heads.reduce(function (m, l) { return Math.max(m, l.length); }, 1);
      hh = deep > 1 ? 30 : 21;
      function header() {
        segTop = y;
        box(M, y, avail, hh, BLACK);
        tb.cols.forEach(function (c, j) {
          heads[j].forEach(function (lab, k) {
            var ly = y + (hh - heads[j].length * 9.5) / 2 + 7.2 + k * 9.5;
            if (numeric(c.type) || c.h === '#') put(lab, xs[j] + ws[j] - PAD, ly, 'semi', 7.6, '#FFFFFF', 'end');
            else put(lab, xs[j] + PAD, ly, 'semi', 7.6, '#FFFFFF');
          });
        });
        y += hh;
      }
      function frame() {
        doc.setDrawColor(GRID);
        doc.setLineWidth(0.45);
        for (var j = 1; j < ws.length; j++) doc.line(mx(xs[j], 0), segTop + hh, mx(xs[j], 0), y);
        doc.setDrawColor(FRAME);
        doc.setLineWidth(0.8);
        doc.rect(mx(M, avail), segTop, avail, y - segTop, 'S');
      }
      /* build 119: a short table is never split over two pages (seven salespeople had one on a page alone) */
      if (!fits(10 + hh + rh * (rowsAll.length <= 14 ? Math.max(1, rowsAll.length) : 3) + (tb.total && rowsAll.length <= 14 ? hh : 0))) page();
      title(false);
      header();
      if (!rowsAll.length) {
        box(M, y, avail, rh + 4, PAPER);
        put(L.none || 'Nothing in these dates.', M + PAD, y + 12, 'normal', 8.5, GREY);
        y += rh + 4;
        frame();
        y += 18;
        return;
      }
      rowsAll.forEach(function (r, i) {
        /* the total never goes onto a page by itself: the last row goes with it */
        if (!fits(rh + (tb.total && i === rowsAll.length - 1 ? hh : 0))) { frame(); page(); title(true); header(); }
        box(M, y, avail, rh, i % 2 ? WASH : PAPER);
        tb.cols.forEach(function (c, j) {
          /* build 119: a cell that does not fit gets smaller type first; a figure or a date is never cut
             (a price printed as "EGP 39,123,0…"), a name is cut only as the last resort */
          var raw = fmt(r[j], c.type), wt = numeric(c.type) ? 'medium' : 'normal', z = 8, max = ws[j] - 2 * PAD;
          while (z > 5.6 && width(raw, wt, z) > max) z -= 0.3;
          var s = numeric(c.type) || c.type === 'date' || c.type === 'datetime' ? raw : fit(raw, max, wt, z);
          if (c.h === '#') put(s, xs[j] + ws[j] - PAD, y + 10.8, 'semi', z, DEEP, 'end');
          else if (numeric(c.type)) put(s, xs[j] + ws[j] - PAD, y + 10.8, 'medium', z, INK, 'end');
          else put(s, xs[j] + PAD, y + 10.8, 'normal', z, INK);
        });
        doc.setDrawColor(GRID);
        doc.setLineWidth(0.45);
        doc.line(mx(M, 0), y + rh, mx(M + avail, 0), y + rh);
        y += rh;
      });
      if (tb.total) {
        if (!fits(hh)) { frame(); page(); title(true); header(); }
        box(M, y, avail, hh, TOTALF);
        tb.cols.forEach(function (c, j) {
          var v = tb.total[j];
          if (v === undefined || v === null || v === '') return;
          var s = fit(fmt(v, c.type), ws[j] - 2 * PAD, 'semi', 8.5);
          if (numeric(c.type)) put(s, xs[j] + ws[j] - PAD, y + 13.5, 'semi', 8.5, INK, 'end');
          else put(s, xs[j] + PAD, y + 13.5, 'semi', 8.5, INK);
        });
        y += hh;
      }
      frame();
      if (tb.more) { y += 12; put(tb.more, M, y, 'normal', 8.5, GREY); }
      y += 20;
    }

    /* ---- the cover ---- */
    page();
    kicker(rep.kind || '', y);
    y += 30;
    wrap(rep.title, W - 2 * M, 'semi', 24).forEach(function (line) { put(line, M, y, 'semi', 24, INK); y += 29; });
    if (rep.subtitle) para(rep.subtitle, 9.5, GREY, 2);
    y += 6;
    if (rep.answer) {
      var al = wrap(rep.answer, W - 2 * M - 34, 'semi', 12.5);
      var ah = 18 + al.length * 17;
      box(M, y, W - 2 * M, ah, WASH);
      box(M, y, 4, ah, ORANGE);
      al.forEach(function (line, i) { put(line, M + 18, y + 21 + i * 17, 'semi', 12.5, INK); });
      y += ah + 14;
    }
    var sum = (rep.summary || []).slice(0, 5);
    if (sum.length) {
      var gap = 10, tw = (W - 2 * M - gap * (sum.length - 1)) / sum.length, th = 60;
      sum.forEach(function (s, j) {
        var x = M + j * (tw + gap);
        box(x, y, tw, th, BLACK);
        box(x, y, 4, th, s[3] || ORANGE);
        if ((s[2] || 'int') === 'text') {
          wrap(String(s[1]), tw - 22, 'semi', 10.5).slice(0, 2).forEach(function (line, k) { put(line, x + 15, y + 21 + k * 13, 'semi', 10.5, '#FFFFFF'); });
        } else put(fit(s[2] === 'money' && s[1] >= 1e6 ? short(s[1]) : fmt(s[1], s[2] || 'int'), tw - 22, 'semi', 19), x + 15, y + 28, 'semi', 19, '#FFFFFF');
        wrap(s[0], tw - 22, 'normal', 7.8).slice(0, 2).forEach(function (line, k) { put(line, x + 15, y + 43 + k * 9.5, 'normal', 7.8, '#CFC6BD'); });
      });
      y += th + 20;
    }
    if (rep.coverChart) chart(rep.coverChart);
    var mt = (rep.meta || []).map(function (m) { return m[0] + ': ' + fmt(m[1], m[2]); }).join('   ·   ');
    if (mt) put(fit(mt, W - 2 * M, 'normal', 8), M, bottom - 2, 'normal', 8, GREY);

    /* ---- one section per page ---- */
    (rep.sections || []).forEach(function (sec) {
      page();
      if (sec.kicker) kicker(sec.kicker, y);
      y += sec.kicker ? 26 : 8;
      wrap(sec.title, W - 2 * M, 'semi', 19).forEach(function (line) { put(line, M, y, 'semi', 19, INK); y += 24; });
      y += 2;
      (sec.text || []).forEach(function (p) { para(p, 10, GREY, 5); });
      y += 4;
      bullets(sec.notes);
      (sec.charts || []).forEach(chart);
      (sec.tables || []).forEach(function (tb) { if (!tb.excelOnly) sheet(tb); });
    });

    /* the running footer, once the page count is known */
    var n = doc.getNumberOfPages();
    for (var p = 1; p <= n; p++) {
      doc.setPage(p);
      doc.setDrawColor(GRID);
      doc.setLineWidth(0.5);
      doc.line(M, H - M - 8, W - M, H - M - 8);
      put(fit(rep.title + (rep.range ? '  ·  ' + rep.range : ''), W / 2 - M - 40, 'normal', 7.5), M, H - M + 4, 'normal', 7.5, GREY);
      put((L.page || 'Page {n} of {m}').replace('{n}', p).replace('{m}', n), W - M, H - M + 4, 'normal', 7.5, GREY, 'end');
      if (rep.demo) put(L.demoFoot || 'DEMO FIGURES', W / 2, H - M + 4, 'semi', 7.5, DEEP, 'center');
    }
    undo();
    return doc;
  }

  var api = { build: build };
  if (typeof module === 'object' && module.exports) module.exports = api;
  else { root.MM = root.MM || {}; root.MM.report = api; }
}(typeof window !== 'undefined' ? window : globalThis));
