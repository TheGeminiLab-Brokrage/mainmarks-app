/* ------------------------------------------------------------------
   Main Marks — reading the inventory.

   It reads a CSV. Today that CSV is the demo file in demo/; tomorrow it
   is Main Marks' own Google Sheet at
   https://docs.google.com/spreadsheets/d/<ID>/gviz/tq?tqx=out:csv
   and the only change is the URL in js/config.js.

   Every rule below exists because the same fault reached a real document
   on another client, so none of it is precautionary:

   - The HEADER ROW is the only proof we are reading the sheet we think
     we are. Google's gviz endpoint serves the FIRST tab when the sheet
     name is wrong, with HTTP 200 and no error, so a wrong tab looks
     exactly like a right one. Validate the header; refuse the file.
   - NUMBERS MAY NOT BE IN ENGLISH. An Arabic-locale export writes the
     decimal point as U+066B and thousands as U+066C, and the usual
     cleaner DELETES them, returning a number 10-100x too large with no
     error. Fold digits and separators in one pass.
   - TWO COLUMNS CAN CARRY THE SAME HEADING. Match by name, keep the
     first position, and report it rather than silently reading one twice.
   - FAIL CLOSED. A unit with no usable price is not offered. A blank
     status is NOT available. A status we do not recognise is a fault in
     the data, not an invitation to guess.
   ------------------------------------------------------------------ */

(function (root) {
  'use strict';

  var MM = root.MM || (root.MM = {});

  /* ---- numbers ------------------------------------------------------
     One pass, no locale detection: a single live row has been seen with
     both conventions in adjacent cells. Returns null, never NaN and
     never 0, when there is no number to read — 0 is a real price. */
  function num(raw) {
    if (raw === null || raw === undefined) return null;
    var s = String(raw)
      .replace(/[٠-٩]/g, function (d) { return d.charCodeAt(0) - 0x0660; })
      .replace(/[۰-۹]/g, function (d) { return d.charCodeAt(0) - 0x06F0; })
      .replace(/٬/g, '').replace(/٫/g, '.')
      .replace(/[^\d.\-]/g, '');
    if (s === '' || s === '-' || s === '.') return null;
    var v = Number(s);
    return isFinite(v) ? v : null;
  }

  /* ---- CSV ----------------------------------------------------------
     Small and complete rather than clever: quoted fields, doubled quotes
     inside them, commas and newlines inside them, CRLF, and a BOM. A
     split(',') tears any type name or view that contains a comma. */
  function parseCSV(text) {
    var rows = [], row = [], field = '', inQ = false, i, ch;
    if (text.charCodeAt(0) === 0xFEFF) text = text.slice(1);
    for (i = 0; i < text.length; i++) {
      ch = text[i];
      if (inQ) {
        if (ch === '"') {
          if (text[i + 1] === '"') { field += '"'; i++; }
          else inQ = false;
        } else field += ch;
      } else if (ch === '"') inQ = true;
      else if (ch === ',') { row.push(field); field = ''; }
      else if (ch === '\n' || ch === '\r') {
        if (ch === '\r' && text[i + 1] === '\n') i++;
        row.push(field); field = '';
        if (row.length > 1 || row[0] !== '') rows.push(row);
        row = [];
      } else field += ch;
    }
    row.push(field);
    if (row.length > 1 || row[0] !== '') rows.push(row);
    return rows;
  }

  /* ---- statuses ------------------------------------------------------
     An allow-list. Everything sellable is named here and nothing else is
     sellable. An unknown word is counted and reported, never guessed. */
  var SELLABLE = ['available'];
  var KNOWN = {
    'available': 'Available',
    'reserved': 'Reserved',
    'hold': 'On hold',             /* Main Marks' word (Moray sheet, 2026-10-01): held, not sellable */
    'on hold': 'On hold',
    'sold': 'Sold',
    'blocked': 'Blocked',
    'not released': 'Not released'
  };

  function readStatus(raw) {
    var s = String(raw === undefined || raw === null ? '' : raw).trim().toLowerCase();
    if (!s) return { label: 'Not available', ok: false, known: false, blank: true };
    var label = KNOWN[s];
    if (!label) return { label: String(raw).trim(), ok: false, known: false, blank: false };
    return { label: label, ok: SELLABLE.indexOf(s) !== -1, known: true, blank: false };
  }

  /* ---- the column map -------------------------------------------------
     Named, so a client's sheet is mapped in config rather than in code.
     Each entry is a list of acceptable headings; the FIRST match wins and
     a second column with the same heading is reported, not read. */
  /* The alias lists must not overlap. A sheet with both "Unit Code" and
     "Unit" is normal, and listing 'unit' under BOTH keys made the reader
     report a duplicate heading that was not there — a false alarm that
     teaches the salesperson to ignore the real ones. */
  var COLS = {
    code:       ['unit code', 'code'],
    project:    ['project'],
    building:   ['building', 'block'],
    floor:      ['floor'],
    floorNo:    ['floor no', 'floor number'],
    unit:       ['unit no', 'unit number', 'unit'],
    kind:       ['kind', 'use'],
    type:       ['type', 'unit type'],
    area:       ['area', 'bua', 'built up area'],
    meterPrice: ['meter price', 'price per meter', 'price/m2'],
    listPrice:  ['list price', 'total price', 'price'],
    discount:   ['discount'],
    finalPrice: ['final price', 'net price'],
    view:       ['view'],
    bedrooms:   ['bedrooms'],
    terrace:    ['terrace', 'terrace/storage'],
    status:     ['status', 'availability']
  };

  /* `extra` is the project's own headings from config (inventory.columns),
     e.g. Moray's "Bldg" and "Live unit price". They REPLACE the default
     list for that field, so a client's sheet is mapped in config and a
     default alias can never also match a second column by accident. */
  function mapHeader(head, extra) {
    var lower = head.map(function (h) { return String(h).trim().toLowerCase(); });
    var at = {}, dupes = [];
    var cols = {};
    Object.keys(COLS).forEach(function (k) { cols[k] = COLS[k]; });
    Object.keys(extra || {}).forEach(function (k) {
      cols[k] = extra[k].map(function (n) { return String(n).trim().toLowerCase(); });
    });
    Object.keys(cols).forEach(function (key) {
      var names = cols[key], idx = -1, hits = 0;
      for (var i = 0; i < lower.length; i++) {
        if (names.indexOf(lower[i]) !== -1) { hits++; if (idx === -1) idx = i; }
      }
      if (hits > 1) dupes.push(key);
      if (idx !== -1) at[key] = idx;
    });
    return { at: at, dupes: dupes };
  }

  /* ---- load ------------------------------------------------------------
     Resolves to { units, all, problems, header } and REJECTS when the
     file is not the file we asked for. A refusal the salesperson can see
     beats a list that is quietly wrong. */
  function load(inv) {
    var url = inv.url + (inv.url.indexOf('?') === -1 ? '?' : '&') + 't=' + Date.now();
    return fetch(url, { cache: 'no-store' }).then(function (r) {
      if (!r.ok) throw new Error('The inventory answered HTTP ' + r.status + '.');
      return r.text();
    }).then(function (text) {
      /* A restricted Google Sheet returns a sign-in PAGE with HTTP 200.
         It parses as garbage rather than failing, so look at it. */
      if (/^\s*<(!doctype|html)/i.test(text)) {
        throw new Error('The inventory link returned a web page, not a sheet. It is probably not shared.');
      }
      var rows = parseCSV(text);
      if (rows.length < 2) throw new Error('The inventory has no rows.');

      var head = rows[0];
      var m = mapHeader(head, inv.columns);

      /* The header check. Every column named as required must be there,
         or we are reading the wrong tab and must not guess. */
      var required = inv.required || ['code', 'building', 'floor', 'area', 'listPrice', 'status'];
      var missing = required.filter(function (k) { return m.at[k] === undefined; });
      if (missing.length) {
        throw new Error('This is not the inventory sheet: it has no ' +
          missing.map(function (k) { return '"' + COLS[k][0] + '"'; }).join(', ') + ' column.');
      }

      var problems = [];
      m.dupes.forEach(function (k) {
        problems.push('Two columns are headed "' + COLS[k][0] + '". Reading the first one only.');
      });

      var units = [], all = [], unknownStatus = {}, noPrice = 0, i;

      for (i = 1; i < rows.length; i++) {
        var row = rows[i];
        if (!row.join('').trim()) continue;
        var get = function (k) { return m.at[k] === undefined ? '' : (row[m.at[k]] === undefined ? '' : String(row[m.at[k]]).trim()); };

        var st = readStatus(get('status'));
        if (!st.known && !st.blank) unknownStatus[st.label] = (unknownStatus[st.label] || 0) + 1;

        var area = num(get('area'));
        var list = num(get('listPrice'));
        var disc = num(get('discount'));
        var fin = num(get('finalPrice'));
        var meter = num(get('meterPrice'));

        /* Discount may be written 0.1 or 10 or "10%". Anything at or
           above 1 is read as a percentage — someone typing 15 must never
           price a unit at minus fourteen times its value. */
        if (disc !== null && disc >= 1) disc = disc / 100;
        if (disc === null) disc = 0;

        if (list === null && fin !== null) list = Math.round(fin / (1 - disc));
        if (fin === null && list !== null) fin = Math.round(list * (1 - disc));

        var u = {
          code: get('code'),
          project: get('project'),
          building: get('building'),
          floor: get('floor'),
          floorNo: num(get('floorNo')),
          unit: get('unit'),
          kind: get('kind'),
          type: get('type'),
          area: area,
          meterPrice: meter,
          listPrice: list,
          discount: disc,
          finalPrice: fin,
          view: get('view'),
          bedrooms: get('bedrooms'),
          terrace: get('terrace'),
          status: st.label,
          sellable: st.ok
        };

        /* Fail closed, in this order. A unit with no code cannot be
           offered, quoted or recorded; one with no price cannot be
           quoted at all. Neither is shown. */
        if (!u.code || !u.building) continue;
        if (!(u.finalPrice > 0) || !(u.area > 0)) {
          noPrice++;
          u.sellable = false;
          u.status = 'Not available';
        }

        /* Cross-foot the sheet's own arithmetic. The warning names the
           unit and never a value a customer must not see. */
        if (u.meterPrice && u.area && u.listPrice) {
          var expect = u.area * u.meterPrice;
          if (Math.abs(expect - u.listPrice) / u.listPrice > 0.02) {
            problems.push('Unit ' + u.code + ': the price does not match its area times its rate.');
          }
        }

        all.push(u);
        if (u.sellable) units.push(u);
      }

      Object.keys(unknownStatus).forEach(function (s) {
        problems.push('Status "' + s + '" is not one we know, on ' + unknownStatus[s] +
          ' unit(s). They are not offered.');
      });
      if (noPrice) problems.push(noPrice + ' unit(s) have no usable price or area. They are not offered.');
      if (!all.length) throw new Error('The inventory parsed, but it holds no usable units.');

      return { units: units, all: all, problems: problems, demo: !!inv.demo };
    });
  }

  /* ---- shapes the panels ask for -------------------------------------- */
  function byBuilding(list) {
    var out = {};
    list.forEach(function (u) { (out[u.building] || (out[u.building] = [])).push(u); });
    return out;
  }

  /* Floors in the order they are in the building, read from floorNo where
     the sheet has it and from first-seen order where it does not. A floor
     with no units is not returned at all — a disabled floor card would
     state a reason for the absence that we do not know. */
  function floorsOf(list) {
    var seen = {}, out = [];
    list.forEach(function (u) {
      var key = u.floor || '—';
      if (!seen[key]) {
        seen[key] = { name: key, no: u.floorNo, units: [] };
        out.push(seen[key]);
      }
      seen[key].units.push(u);
    });
    out.sort(function (a, b) {
      if (a.no === null || b.no === null || a.no === undefined || b.no === undefined) return 0;
      return a.no - b.no;
    });
    return out;
  }

  /* The sheet's floor word ("First", "S.Level", "2nd") as the app's floor
     id. ONE rule, used by the line page and the offer PDF (build 78). */
  var FLOOR_ORDER = ['street', 'ground', 'first', 'second', 'third', 'fourth', 'fifth'];
  function floorId(raw) {
    var s = String(raw || '').trim().toLowerCase().replace(/\s+/g, ' ');
    if (/^s\.? ?level|^street/.test(s)) return 'street';
    if (/^g(round)?$|^gf$/.test(s)) return 'ground';
    var words = { first: 1, second: 2, third: 3, fourth: 4, fifth: 5, '1st': 1, '2nd': 2, '3rd': 3, '4th': 4, '5th': 5 };
    if (words[s]) return FLOOR_ORDER[words[s] + 1];
    return s || 'unknown';
  }

  MM.inventory = { load: load, num: num, parseCSV: parseCSV, readStatus: readStatus, byBuilding: byBuilding, floorsOf: floorsOf, COLS: COLS, floorId: floorId };
  if (typeof module === 'object' && module.exports) module.exports = MM.inventory;
}(typeof window !== 'undefined' ? window : globalThis));
