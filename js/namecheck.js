/* ------------------------------------------------------------------
   Main Marks — checking a long list of company names before it goes in
   (build 154).

   WHY. The final list is about 2,000 brokerages (Muhanad, 2026-10-10),
   and "clean broker data is the product": every record must land on the
   right company. A name typed twice, or spelled a little differently from
   one already listed ("Delta Homes" and "Delta Homes Real Estate", "Palm Keys"
   and "Palm Kees"), would split one company's record in two. So the
   admin sees those BEFORE anything is added, and decides each one.

   check(typed, listed) sorts the typed names into:
     fresh    new names, to add
     already  the same name as a listed company (case, spaces, dots and
              words like "Real Estate" aside): passed over
     twice    the same name twice in the typed list: kept once
     alike    a name close to a listed company or to another typed name:
              hers to decide, with the name it is close to
   "Close" is the same key (see key()) but for one or two letters, or one
   key that begins with the other. It is a warning, never a merge: she
   decides.

   It runs on the phone. 2,000 typed against 2,000 listed takes well under
   a second (scripts/check-namecheck.js times it).
   ------------------------------------------------------------------ */
(function (root) {
  'use strict';

  /* words that do not tell one brokerage from another */
  var FILLER = {};
  ('real estate realestate developments development developers developer investment investments invest group ' +
   'co company companies corp properties property brokerage brokerages brokers broker marketing consultancy consulting ' +
   'egypt the for and of el al llc ltd inc شركة للتسويق التسويق العقاري العقارية عقارات للاستثمار الاستثمار للتطوير')
    .split(' ').forEach(function (w) { FILLER[w] = 1; });

  function plain(s) {
    return String(s || '').toLowerCase()
      .replace(/[أإآٱ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي')
      .replace(/[ً-ْـ]/g, '')               /* Arabic marks and the stretch */
      .replace(/&/g, ' and ')
      .replace(/[^a-z0-9ء-ي]+/g, ' ').trim();
  }
  /* the name as a key: plain letters, no filler words, no spaces. A name that is only filler words
     ("Real Estate Group") keeps them all, so it is not an empty key. */
  function key(s) {
    var words = plain(s).split(' ').filter(Boolean), kept = words.filter(function (w) { return !FILLER[w]; });
    return (kept.length ? kept : words).join('');
  }
  /* edit distance, given up past `k` */
  function near(a, b, k) {
    if (Math.abs(a.length - b.length) > k) return false;
    var prev = [], cur, i, j, best;
    for (j = 0; j <= b.length; j++) prev[j] = j;
    for (i = 1; i <= a.length; i++) {
      cur = [i]; best = i;
      for (j = 1; j <= b.length; j++) {
        cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a.charAt(i - 1) === b.charAt(j - 1) ? 0 : 1));
        if (cur[j] < best) best = cur[j];
      }
      if (best > k) return false;
      prev = cur;
    }
    return prev[b.length] <= k;
  }
  function close(a, b) {
    if (!a || !b) return false;
    var k = Math.min(a.length, b.length) <= 5 ? 1 : 2;
    if (a.length >= 4 && b.length >= 4 && (a.indexOf(b) === 0 || b.indexOf(a) === 0)) return true;
    return near(a, b, k);
  }

  /* typed: strings; listed: [{ id, name }] (switched-off companies included: a name is never doubled) */
  function check(typed, listed) {
    var out = { fresh: [], already: [], twice: [], alike: [] }, seen = {}, byKey = {};
    /* THE INDEX, so 2,000 names are not each compared with 2,000 others. Two keys one letter apart (a
       letter missing, added or changed), or with two letters swapped, share a key with one letter taken
       out of each (dropped[]); a key that begins with another is found by its beginnings (starts[]).
       Each candidate is then measured (close()). Two letters changed in two places is not looked for:
       it would cost the phone seconds on 2,000 names, and is a rarer slip. */
    var dropped = {}, starts = {};
    var put = function (map, k, item) { (map[k] = map[k] || []).push(item); };
    var drops = function (k) {
      var one = {}, i;
      one[k] = 1;
      for (i = 0; i < k.length; i++) one[k.slice(0, i) + k.slice(i + 1)] = 1;
      return Object.keys(one);
    };
    var file = function (item) {
      drops(item.k).forEach(function (d) { put(dropped, d, item); });
      for (var l = 4; l <= item.k.length; l++) put(starts, item.k.slice(0, l), item);
    };
    (listed || []).forEach(function (c) { var k = key(c.name); if (!k) return; byKey[k] = byKey[k] || c; file({ k: k, name: c.name, id: c.id }); });
    (typed || []).forEach(function (raw) {
      var name = String(raw || '').replace(/\s+/g, ' ').trim(), k = key(name);
      if (!name || !k) return;
      if (byKey[k]) { out.already.push({ name: name, as: byKey[k].name }); return; }
      if (seen[k]) { out.twice.push({ name: name, as: seen[k] }); return; }
      seen[k] = name;
      var hit = null, l, d = drops(k), i, j, list;
      /* a listed key that begins with this one, or this one begins with a listed key */
      if (k.length >= 4) {
        if (starts[k]) hit = starts[k][0];
        for (l = 4; l < k.length && !hit; l++) if (byKey[k.slice(0, l)] || seen[k.slice(0, l)]) {
          list = starts[k.slice(0, l)] || [];
          for (i = 0; i < list.length; i++) if (list[i].k === k.slice(0, l)) { hit = list[i]; break; }
        }
      }
      for (i = 0; i < d.length && !hit; i++) {
        list = dropped[d[i]] || [];
        for (j = 0; j < list.length; j++) if (close(k, list[j].k)) { hit = list[j]; break; }
      }
      if (hit) out.alike.push({ name: name, like: hit.name, listed: !!hit.id });
      else out.fresh.push(name);
      /* the next typed names are checked against this one too */
      file({ k: k, name: name, id: null });
    });
    return out;
  }
  /* the names in a pasted column or a CSV file: the first cell of each line, a header row dropped */
  function namesIn(text) {
    var rows = String(text || '').replace(/^﻿/, '').split(/\r\n|\n|\r/);
    var out = rows.map(function (r) {
      var c = r.split(/[\t;,]/)[0] || '';
      return c.replace(/^"|"$/g, '').replace(/""/g, '"').trim();
    }).filter(Boolean);
    if (out.length && /^(company|companies|name|names|brokerage|broker|الشركة|اسم الشركة)$/i.test(out[0])) out.shift();
    return out;
  }

  var api = { check: check, key: key, namesIn: namesIn };
  if (typeof module === 'object' && module.exports) module.exports = api;
  else { root.MM = root.MM || {}; root.MM.nameCheck = api; }
}(typeof window !== 'undefined' ? window : globalThis));
