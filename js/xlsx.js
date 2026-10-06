/* ------------------------------------------------------------------
   Main Marks — a real .xlsx, written in the browser, with no library.

   The CCR Development App's js/xlsx.js, for Main Marks (2026-10-06): the
   manager view downloads every list as an Excel sheet. A CSV opens in
   Excel but carries no formatting, no frozen header and no dates Excel
   understands; the manager would have to tidy it before sending it to
   anyone. This writes the real format.

   An .xlsx is a zip of a few XML files. The zip here is STORED, not
   compressed -- every reader accepts it, and it needs no deflate code --
   and the XML is the smallest set Excel opens without a repair prompt:
   content types, two relationship files, the workbook, the styles, and
   one worksheet per sheet. Strings are written inline, so there is no
   shared-string table to keep in step.

   THE INPUT is the same `report` the PDF writer takes (js/report.js), so
   the two downloads can never say different things:
     { title, subtitle, period, generated, demo, rtl,
       summary: [[label, value]], notes: [text],
       tables: [{ title, cols: [{ h, w, type }], rows: [[cell]] }] }
   A column's type is 'text' | 'int' | 'money' | 'pct' | 'date' | 'datetime'.
   Dates are real Excel dates (serial numbers with a date format), so the
   manager can sort and filter them.

   Browser and Node alike: scripts can build a workbook and open it in
   Excel to check it, which is how it was verified.
   ------------------------------------------------------------------ */
(function (root) {
  'use strict';

  /* ---- the zip ------------------------------------------------------ */
  var CRC = (function () {
    var t = new Uint32Array(256);
    for (var n = 0; n < 256; n++) {
      var c = n;
      for (var k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
      t[n] = c >>> 0;
    }
    return t;
  }());
  function crc32(u8) {
    var c = 0xFFFFFFFF;
    for (var i = 0; i < u8.length; i++) c = CRC[(c ^ u8[i]) & 0xFF] ^ (c >>> 8);
    return (c ^ 0xFFFFFFFF) >>> 0;
  }
  var enc = typeof TextEncoder !== 'undefined' ? new TextEncoder() : null;
  function utf8(s) {
    if (enc) return enc.encode(s);
    return new Uint8Array(Buffer.from(s, 'utf8'));          /* Node without TextEncoder */
  }
  /* files: [{ name, data: Uint8Array }] -> Uint8Array */
  function zip(files) {
    var now = new Date();
    var dosTime = (now.getHours() << 11) | (now.getMinutes() << 5) | Math.floor(now.getSeconds() / 2);
    var dosDate = ((now.getFullYear() - 1980) << 9) | ((now.getMonth() + 1) << 5) | now.getDate();
    var parts = [], central = [], offset = 0;
    files.forEach(function (f) {
      var name = utf8(f.name), data = f.data, crc = crc32(data);
      var head = new Uint8Array(30 + name.length);
      var h = new DataView(head.buffer);
      h.setUint32(0, 0x04034b50, true);
      h.setUint16(4, 20, true);
      h.setUint16(6, 0x0800, true);          /* the name is UTF-8 */
      h.setUint16(8, 0, true);               /* stored */
      h.setUint16(10, dosTime, true);
      h.setUint16(12, dosDate, true);
      h.setUint32(14, crc, true);
      h.setUint32(18, data.length, true);
      h.setUint32(22, data.length, true);
      h.setUint16(26, name.length, true);
      h.setUint16(28, 0, true);
      head.set(name, 30);
      parts.push(head, data);

      var cd = new Uint8Array(46 + name.length);
      var c = new DataView(cd.buffer);
      c.setUint32(0, 0x02014b50, true);
      c.setUint16(4, 20, true);
      c.setUint16(6, 20, true);
      c.setUint16(8, 0x0800, true);
      c.setUint16(10, 0, true);
      c.setUint16(12, dosTime, true);
      c.setUint16(14, dosDate, true);
      c.setUint32(16, crc, true);
      c.setUint32(20, data.length, true);
      c.setUint32(24, data.length, true);
      c.setUint16(28, name.length, true);
      c.setUint32(42, offset, true);
      cd.set(name, 46);
      central.push(cd);
      offset += head.length + data.length;
    });
    var cdSize = central.reduce(function (a, b) { return a + b.length; }, 0);
    var end = new Uint8Array(22);
    var e = new DataView(end.buffer);
    e.setUint32(0, 0x06054b50, true);
    e.setUint16(8, files.length, true);
    e.setUint16(10, files.length, true);
    e.setUint32(12, cdSize, true);
    e.setUint32(16, offset, true);
    var all = parts.concat(central, [end]);
    var total = all.reduce(function (a, b) { return a + b.length; }, 0);
    var out = new Uint8Array(total), at = 0;
    all.forEach(function (p) { out.set(p, at); at += p.length; });
    return out;
  }

  /* ---- the XML ------------------------------------------------------ */
  /* The page's invisible direction marks (FSI, PDI, LRM, RLM) -- in a cell
     they only get in the way of sorting and searching. Built from code
     points, so this file holds no invisible characters of its own: an
     escape typed into an editing tool once arrived here as the raw
     character, NUL bytes included, and grep started calling the file
     binary. */
  var MARKS = new RegExp('[' + String.fromCharCode(0x2066) + '-' + String.fromCharCode(0x2069) +
    String.fromCharCode(0x200E) + String.fromCharCode(0x200F) + ']', 'g');
  /* characters XML 1.0 forbids outright -- one stray control code in a
     company name and Excel refuses the whole file */
  function xmlSafe(ch) {
    var c = ch.charCodeAt(0);
    return !((c < 0x20 && c !== 0x09 && c !== 0x0A && c !== 0x0D) || c === 0xFFFE || c === 0xFFFF);
  }
  function esc(s) {
    return String(s == null ? '' : s).replace(MARKS, '').split('').filter(xmlSafe).join('')
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function colName(i) {                       /* 0 -> A, 25 -> Z, 26 -> AA */
    var s = '';
    i += 1;
    while (i > 0) { var m = (i - 1) % 26; s = String.fromCharCode(65 + m) + s; i = Math.floor((i - 1) / 26); }
    return s;
  }
  /* An Excel date is days since 30 Dec 1899, counted on the wall clock --
     so it is built from the local date parts, never from the UTC instant,
     or every time moves by the timezone offset. */
  function serial(d) {
    return Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), d.getHours(), d.getMinutes(), d.getSeconds()) /
      86400000 + 25569;
  }

  /* style indexes into cellXfs below */
  var S = { plain: 0, title: 1, head: 2, int: 3, date: 4, datetime: 5, pct: 6, note: 7, section: 8,
    demo: 9, sub: 10, label: 11, money: 12 };
  var STYLES =
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
    '<numFmts count="3">' +
    '<numFmt numFmtId="164" formatCode="d mmm yyyy"/>' +
    '<numFmt numFmtId="165" formatCode="d mmm yyyy hh:mm"/>' +
    '<numFmt numFmtId="166" formatCode="#,##0 &quot;EGP&quot;"/>' +
    '</numFmts>' +
    '<fonts count="6">' +
    '<font><sz val="11"/><name val="Calibri"/><family val="2"/></font>' +
    '<font><b/><sz val="16"/><color rgb="FF000000"/><name val="Calibri"/><family val="2"/></font>' +
    '<font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Calibri"/><family val="2"/></font>' +
    '<font><b/><sz val="11"/><name val="Calibri"/><family val="2"/></font>' +
    '<font><b/><sz val="11"/><color rgb="FFC0392B"/><name val="Calibri"/><family val="2"/></font>' +
    '<font><i/><sz val="10"/><color rgb="FF5A6272"/><name val="Calibri"/><family val="2"/></font>' +
    '</fonts>' +
    '<fills count="3">' +
    '<fill><patternFill patternType="none"/></fill>' +
    '<fill><patternFill patternType="gray125"/></fill>' +
    '<fill><patternFill patternType="solid"><fgColor rgb="FF17110C"/><bgColor indexed="64"/></patternFill></fill>' +
    '</fills>' +
    '<borders count="2">' +
    '<border><left/><right/><top/><bottom/><diagonal/></border>' +
    '<border><left/><right/><top/><bottom style="thin"><color rgb="FFD9DCE3"/></bottom><diagonal/></border>' +
    '</borders>' +
    '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>' +
    '<cellXfs count="13">' +
    '<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>' +                                         /* plain */
    '<xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/>' +                            /* title */
    '<xf numFmtId="0" fontId="2" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1" applyAlignment="1">' +
    '<alignment vertical="center" wrapText="1"/></xf>' +                                                          /* head */
    '<xf numFmtId="3" fontId="0" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyBorder="1"/>' +     /* int */
    '<xf numFmtId="164" fontId="0" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyBorder="1"/>' +   /* date */
    '<xf numFmtId="165" fontId="0" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyBorder="1"/>' +   /* datetime */
    '<xf numFmtId="9" fontId="0" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyBorder="1"/>' +     /* pct */
    '<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0" applyAlignment="1">' +
    '<alignment vertical="top" wrapText="1"/></xf>' +                                                             /* note */
    '<xf numFmtId="0" fontId="3" fillId="0" borderId="0" xfId="0" applyFont="1"/>' +                            /* section */
    '<xf numFmtId="0" fontId="4" fillId="0" borderId="0" xfId="0" applyFont="1"/>' +                            /* demo */
    '<xf numFmtId="0" fontId="5" fillId="0" borderId="0" xfId="0" applyFont="1"/>' +                            /* sub */
    '<xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1"/>' +                          /* label */
    '<xf numFmtId="166" fontId="0" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyBorder="1"/>' +   /* money */
    '</cellXfs>' +
    '<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>' +
    '</styleSheet>';

  /* One cell. `type` picks both how the value is written and its style. */
  function cell(ref, v, type, style) {
    if (v === null || v === undefined || v === '') return '';
    if (type === 'date' || type === 'datetime') {
      if (!(v instanceof Date) || isNaN(v.getTime())) return cell(ref, String(v), 'text', S.label);
      return '<c r="' + ref + '" s="' + (type === 'date' ? S.date : S.datetime) + '"><v>' + serial(v) + '</v></c>';
    }
    if ((type === 'int' || type === 'money' || type === 'pct') && typeof v === 'number' && isFinite(v)) {
      var st = type === 'pct' ? S.pct : type === 'money' ? S.money : S.int;
      return '<c r="' + ref + '" s="' + st + '"><v>' + v + '</v></c>';
    }
    var s = String(v);
    var space = /^\s|\s$/.test(s) ? ' xml:space="preserve"' : '';
    return '<c r="' + ref + '" t="inlineStr" s="' + (style == null ? S.label : style) + '"><is><t' + space + '>' +
      esc(s) + '</t></is></c>';
  }

  /* rows: [{ cells: [[value, type, style]], height }] */
  function sheetXml(rows, o) {
    o = o || {};
    var out = [];
    rows.forEach(function (r, i) {
      var n = i + 1;
      var cells = r.cells.map(function (c, j) { return c ? cell(colName(j) + n, c[0], c[1], c[2]) : ''; }).join('');
      out.push('<row r="' + n + '"' + (r.height ? ' ht="' + r.height + '" customHeight="1"' : '') + '>' + cells + '</row>');
    });
    var pane = o.freeze ? '<pane ySplit="' + o.freeze + '" topLeftCell="A' + (o.freeze + 1) +
      '" activePane="bottomLeft" state="frozen"/><selection pane="bottomLeft" activeCell="A' + (o.freeze + 1) +
      '" sqref="A' + (o.freeze + 1) + '"/>' : '';
    var cols = (o.widths || []).map(function (w, j) {
      return '<col min="' + (j + 1) + '" max="' + (j + 1) + '" width="' + w + '" customWidth="1"/>';
    }).join('');
    return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" ' +
      'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">' +
      '<sheetViews><sheetView workbookViewId="0"' + (o.rtl ? ' rightToLeft="1"' : '') + (o.first ? ' tabSelected="1"' : '') + '>' +
      pane + '</sheetView></sheetViews>' +
      '<sheetFormatPr defaultRowHeight="15"/>' +
      (cols ? '<cols>' + cols + '</cols>' : '') +
      '<sheetData>' + out.join('') + '</sheetData>' +
      (o.filter ? '<autoFilter ref="' + o.filter + '"/>' : '') +
      '<pageMargins left="0.5" right="0.5" top="0.6" bottom="0.6" header="0.3" footer="0.3"/>' +
      '<pageSetup orientation="landscape" fitToWidth="1" fitToHeight="0"/>' +
      '</worksheet>';
  }

  /* Excel refuses a sheet name longer than 31 characters or holding : \ / ? * [ ] */
  function sheetName(s, used) {
    var base = String(s || 'Sheet').replace(/[:\\\/\?\*\[\]]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 31) || 'Sheet';
    var name = base, n = 2;
    while (used[name.toLowerCase()]) { var tail = ' (' + n++ + ')'; name = base.slice(0, 31 - tail.length) + tail; }
    used[name.toLowerCase()] = true;
    return name;
  }

  /* ---- the workbook --------------------------------------------------- */
  function workbook(report) {
    var L = report.labels || {};
    var used = {};
    var sheets = [];

    /* sheet 1: what this is, the headline numbers, and the analysis */
    var rows = [];
    rows.push({ cells: [[report.title, 'text', S.title]], height: 24 });
    if (report.subtitle) rows.push({ cells: [[report.subtitle, 'text', S.sub]] });
    if (report.highlight) rows.push({ cells: [[report.highlight, 'text', S.section]], height: 20 });
    if (report.answer) rows.push({ cells: [[report.answer, 'text', S.section]], height: Math.max(20, Math.ceil(String(report.answer).length / 70) * 16) });
    if (report.demo) rows.push({ cells: [[report.demo, 'text', S.demo]] });
    rows.push({ cells: [] });
    (report.meta || []).forEach(function (m) { rows.push({ cells: [[m[0], 'text', S.section], [m[1], m[2] || 'text', S.plain]] }); });
    if ((report.summary || []).length) {
      rows.push({ cells: [] });
      rows.push({ cells: [[L.summary || 'Summary', 'text', S.section]] });
      report.summary.forEach(function (s) { rows.push({ cells: [[s[0], 'text', S.label], [s[1], s[2] || 'int', null]] }); });
    }
    if ((report.notes || []).length) {
      rows.push({ cells: [] });
      rows.push({ cells: [[L.analysis || 'What this tells you', 'text', S.section]] });
      report.notes.forEach(function (n) { rows.push({ cells: [[n, 'text', S.note]], height: Math.max(15, Math.ceil(String(n).length / 95) * 15) }); });
    }
    sheets.push({ name: sheetName(L.summarySheet || 'Summary', used),
      xml: sheetXml(rows, { widths: [60, 22], rtl: report.rtl, first: true }) });

    /* one sheet per table, header frozen and filterable */
    (report.tables || []).forEach(function (tb) {
      var rs = [];
      rs.push({ cells: tb.cols.map(function (c) { return [c.h, 'text', S.head]; }), height: 20 });
      tb.rows.forEach(function (r) {
        rs.push({ cells: r.map(function (v, j) { return [v, tb.cols[j].type || 'text', null]; }) });
      });
      var lastCol = colName(Math.max(0, tb.cols.length - 1));
      sheets.push({
        name: sheetName(tb.sheet || tb.title, used),
        xml: sheetXml(rs, {
          widths: tb.cols.map(function (c) { return c.xw || Math.max(10, Math.min(46, (c.w || 12))); }),
          freeze: 1, rtl: report.rtl,
          filter: tb.rows.length ? 'A1:' + lastCol + (tb.rows.length + 1) : null
        }),
        filter: tb.rows.length ? { cols: tb.cols.length, rows: tb.rows.length + 1 } : null
      });
    });

    var ct = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
      '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
      '<Default Extension="xml" ContentType="application/xml"/>' +
      '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>' +
      '<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>' +
      sheets.map(function (s, i) {
        return '<Override PartName="/xl/worksheets/sheet' + (i + 1) + '.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>';
      }).join('') +
      '<Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>' +
      '<Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>' +
      '</Types>';
    var rels = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
      '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>' +
      '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>' +
      '<Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>' +
      '</Relationships>';
    /* The filter needs its hidden defined name, or Excel repairs the file. */
    var names = sheets.map(function (s, i) {
      if (!s.filter) return '';
      return '<definedName name="_xlnm._FilterDatabase" localSheetId="' + i + '" hidden="1">\'' +
        esc(s.name).replace(/'/g, "''") + '\'!$A$1:$' + colName(s.filter.cols - 1) + '$' + s.filter.rows + '</definedName>';
    }).join('');
    var wb = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" ' +
      'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">' +
      '<bookViews><workbookView activeTab="0"/></bookViews><sheets>' +
      sheets.map(function (s, i) {
        return '<sheet name="' + esc(s.name) + '" sheetId="' + (i + 1) + '" r:id="rId' + (i + 1) + '"/>';
      }).join('') + '</sheets>' + (names ? '<definedNames>' + names + '</definedNames>' : '') + '</workbook>';
    var wbRels = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
      sheets.map(function (s, i) {
        return '<Relationship Id="rId' + (i + 1) + '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet' + (i + 1) + '.xml"/>';
      }).join('') +
      '<Relationship Id="rId' + (sheets.length + 1) + '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>' +
      '</Relationships>';
    var iso = new Date().toISOString().replace(/\.\d+Z$/, 'Z');
    var core = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" ' +
      'xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" ' +
      'xmlns:dcmitype="http://purl.org/dc/dcmitype/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">' +
      '<dc:title>' + esc(report.title) + '</dc:title><dc:creator>Main Marks sales app</dc:creator>' +
      '<dcterms:created xsi:type="dcterms:W3CDTF">' + iso + '</dcterms:created>' +
      '<dcterms:modified xsi:type="dcterms:W3CDTF">' + iso + '</dcterms:modified>' +
      '</cp:coreProperties>';
    var app = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties">' +
      '<Application>Microsoft Excel</Application></Properties>';

    var files = [
      { name: '[Content_Types].xml', data: utf8(ct) },
      { name: '_rels/.rels', data: utf8(rels) },
      { name: 'docProps/core.xml', data: utf8(core) },
      { name: 'docProps/app.xml', data: utf8(app) },
      { name: 'xl/workbook.xml', data: utf8(wb) },
      { name: 'xl/_rels/workbook.xml.rels', data: utf8(wbRels) },
      { name: 'xl/styles.xml', data: utf8(STYLES) }
    ].concat(sheets.map(function (s, i) { return { name: 'xl/worksheets/sheet' + (i + 1) + '.xml', data: utf8(s.xml) }; }));
    return zip(files);
  }

  var api = { workbook: workbook, zip: zip, crc32: crc32, serial: serial,
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' };
  if (typeof module === 'object' && module.exports) module.exports = api;
  else { root.MM = root.MM || {}; root.MM.xlsx = api; }
}(typeof window !== 'undefined' ? window : globalThis));
