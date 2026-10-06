/* ------------------------------------------------------------------
   Main Marks — the clinic offer PDF, made IN THE BROWSER (build 83).

   js/pdf.js draws the document and is DOM-free; scripts/make-sample-offer.js
   feeds it from Node. This file feeds the very same code from a page: it
   loads jsPDF (420 KB) only when an offer is asked for, fetches the fonts
   and the artwork, and
   hands back the PDF as a Blob. Nothing here works out a figure: the unit
   comes from the sheet, the schedule from MM.plans inside js/pdf.js.

   Fails closed exactly as js/pdf.js does: a unit outside the offer's scope
   (config `offer.scope`: today the 1st-floor clinics of E02) gets no PDF.

     MM.offerPdf.can(project, unit)      -> true if an offer PDF exists for it
     MM.offerPdf.make({ project, unit, plan, buildingName, buildingRows, lang })
                                         -> Promise<{ blob, name, pages }>

   Build 92: the PDF comes out in the language the APP is in (MM.lang), as
   Ayyam's Create offer does. Arabic loads its three IBM Plex Sans Arabic
   faces and js/arabic.js (the shaper js/pdf.js needs) only when asked for.
   ------------------------------------------------------------------ */
(function (root) {
  'use strict';
  var MM = root.MM || (root.MM = {});
  var V = (root.CONFIG && CONFIG.build) || '0';

  var FONTS_AR = [
    ['normal', 'IBMPlexSansArabic-Regular.ttf', 'PlexArabic'], ['medium', 'IBMPlexSansArabic-Medium.ttf', 'PlexArabicMedium'],
    ['semi', 'IBMPlexSansArabic-SemiBold.ttf', 'PlexArabicSemi']
  ];
  var FONTS = [
    ['light', 'Manrope-Light.ttf', 'ManropeLight'], ['normal', 'Manrope-Regular.ttf', 'Manrope'],
    ['medium', 'Manrope-Medium.ttf', 'ManropeMedium'], ['semi', 'Manrope-SemiBold.ttf', 'ManropeSemi'],
    ['serif', 'InstrumentSerif-Italic.ttf', 'InstrumentSerifItalic']
  ];

  var loaded = {};
  function script(src) {
    if (loaded[src]) return loaded[src];
    loaded[src] = new Promise(function (ok, no) {
      var s = document.createElement('script');
      s.src = src + '?v=' + V;
      s.onload = ok;
      s.onerror = function () { delete loaded[src]; no(new Error('Could not load ' + src)); };
      document.head.appendChild(s);
    });
    return loaded[src];
  }
  function bytes(src) {
    return fetch(src + '?v=' + V).then(function (r) {
      if (!r.ok) throw new Error('Could not load ' + src + ' (' + r.status + ')');
      return r.arrayBuffer();
    }).then(function (b) { return new Uint8Array(b); });
  }
  function base64(u8) {
    var s = '', CH = 0x8000;
    for (var i = 0; i < u8.length; i += CH) s += String.fromCharCode.apply(null, u8.subarray(i, i + CH));
    return btoa(s);
  }
  /* a PNG's or a JPEG's pixel size, from its header (as make-sample-offer.js) */
  function isPng(u8) { return u8[0] === 0x89 && u8[1] === 0x50 && u8[2] === 0x4e && u8[3] === 0x47; }
  function imageSize(u8) {
    var d = new DataView(u8.buffer, u8.byteOffset, u8.byteLength);
    if (isPng(u8)) return { w: d.getUint32(16), h: d.getUint32(20) };
    var i = 2;
    while (i < u8.length) {
      if (u8[i] !== 0xff) { i++; continue; }
      var m = u8[i + 1], len = d.getUint16(i + 2);
      if (m >= 0xc0 && m <= 0xcf && m !== 0xc4 && m !== 0xc8 && m !== 0xcc) return { h: d.getUint16(i + 5), w: d.getUint16(i + 7) };
      i += 2 + len;
    }
    throw new Error('An offer picture has no size marker.');
  }

  var fontCache = {};
  function faces(list, lang) {
    if (!fontCache[lang]) {
      fontCache[lang] = Promise.all(list.map(function (f) {
        return bytes('vendor/fonts/' + f[1]).then(function (u8) {
          return { lang: lang, weight: f[0], file: f[1], family: f[2], base64: base64(u8) };
        });
      }));
      fontCache[lang].catch(function () { delete fontCache[lang]; });
    }
    return fontCache[lang];
  }
  /* the English faces always (Latin-only strings keep them), the Arabic ones for an Arabic offer */
  function fonts(lang) {
    if (lang !== 'ar') return faces(FONTS, 'en');
    return Promise.all([faces(FONTS, 'en'), faces(FONTS_AR, 'ar'), script('js/arabic.js')])
      .then(function (r) { return r[0].concat(r[1]); });
  }
  var artCache = {};
  function picture(src) {
    if (!artCache[src]) {
      artCache[src] = bytes(src).then(function (u8) {
        var sz = imageSize(u8);
        return { data: u8, format: isPng(u8) ? 'PNG' : 'JPEG', key: src, w: sz.w, h: sz.h };
      });
      artCache[src].catch(function () { delete artCache[src]; });
    }
    return artCache[src];
  }

  /* js/pdf.js is loaded with the page (52 KB); only jsPDF waits to be asked for */
  function can(project, unit) { return !!(MM.pdf && MM.pdf.inScope(project, unit)); }

  function make(o) {
    var lang = (o.lang || MM.lang) === 'ar' ? 'ar' : 'en';
    return script('vendor/jspdf.umd.min.js').then(function () {
      var want = MM.pdf.artwork(o.project, o.unit), keys = Object.keys(want).filter(function (k) { return want[k]; });
      return Promise.all([fonts(lang), Promise.all(keys.map(function (k) { return picture(want[k]); }))]).then(function (got) {
        var art = {};
        keys.forEach(function (k, i) { art[k] = got[1][i]; });
        var doc = MM.pdf.offer({
          jsPDF: root.jspdf.jsPDF, plans: MM.plans, project: o.project, unit: o.unit, plan: o.plan,
          buildingName: o.buildingName, buildingRows: o.buildingRows, floorId: MM.inventory.floorId,
          art: art, fonts: got[0], date: new Date(), lang: lang, arabic: MM.arabic
        });
        var name = 'Moray Wellness - Clinic ' + o.unit.code + ' - offer' + (lang === 'ar' ? ' - Arabic' : '') + ' (SAMPLE).pdf';
        return { blob: doc.output('blob'), name: name, pages: doc.getNumberOfPages() };
      });
    });
  }

  MM.offerPdf = { can: can, make: make };
}(typeof window !== 'undefined' ? window : globalThis));
