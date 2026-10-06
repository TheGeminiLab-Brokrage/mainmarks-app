/* ------------------------------------------------------------------
   Main Marks — the clinic offer, as a PDF, in English or Arabic, in the
   Moray Wellness CI.

   Build 78 (2026-10-02): first cut. Muhanad: "create a pdf offer ... the
   payment sheet like the one in the Ayyam pdf", "make sure to have the
   moray wellness branding", "the first floor in moray wellness only".
   Build 79: the project and the selected building, the mall renders.
   Build 80: "the exact same pdf but in arabic" -- one layout, two languages.
   Every page says SAMPLE until Main Marks confirms the terms it rests on.

   Six A4 pages, in the order a buyer asks (the Ayyam offer's order,
   CCR Development App js/pdf.js, plus the project and the building):
     1. cover          the line, which clinic, the date
     2. the project    Moray: the brochure's renders and its own figures
     3. your building  the master plan with the building lit; Medical Spaces
     4. your clinic    the drawing, the clinic in orange, the facts, a key plan
     5. the plan       what it costs and how it is paid
     6. schedule       every payment, dated: the Ayyam payment sheet
   Every render is Main Marks' own (the Moray brochure). The night aerial on
   the app's chooser page was made in Codex, so it is never printed here.

   THE LOOK is the Moray Wellness CI (02 Brand & CI\Moray Wellness - CI.pdf):
   teal #095569, orange #FA6126, charcoal #191819, white (p.6); cyan
   #15BEE8 and #12A2C6 (p.7); its template bars (p.10, p.14); headings in
   Campaign Serif italic (p.5), a licensed face, so Instrument Serif italic
   (SIL OFL) stands in; body in Manrope (p.5, SIL OFL). Arabic: IBM Plex Sans
   Arabic (SIL OFL), the one modern sans measured with all 125 presentation
   forms the shaper emits AND full Latin with ² and % (CCR, 2026-09-13).

   ARABIC (the CCR app's method, proven on Ayyam):
     - every string goes through put(), which shapes and orders it with
       js/arabic.js; jsPDF's own two Arabic passes are disarmed (disarm());
     - the FONT IS CHOSEN PER STRING: a string with Arabic letters takes Plex
       Arabic; a Latin-only string ("Moray", "E125", a figure) keeps the
       English face, so both documents look alike (playbook 01, Phase 4, 1b);
     - the page is MIRRORED, not re-laid: text positions are written once, in
       reading-start terms, and put() reflects them; boxes go through mx();
       drawings, plans and renders are NEVER flipped (north stays north);
     - Arabic is never letterspaced or upper-cased, and figures stay Western
       digits (the font has no Arabic-Indic digits; the brochure uses Western);
     - wrapping is done on the LOGICAL string, then each line is shaped.

   Rules carried from the offer playbook (Desktop\Playbooks\01):
     - fonts are EMBEDDED, never named and trusted to the reader;
     - clip with doc.rect(x, y, w, h, null);
     - fail closed: a unit that is not sellable, outside the offer's scope,
       or whose schedule does not foot gets no document at all;
     - every figure comes from the sheet through MM.plans.schedule, the
       engine step 4 uses, and the schedule's total is RE-ADDED from its rows;
     - nothing Main Marks has not stated is printed as if it had;
     - no client name and no contact details (as decided for CCR).

   DOM-free: the caller hands over jsPDF, the fonts, the artwork and (for
   Arabic) the shaper, so scripts/make-sample-offer.js drives the very same
   code from Node.
   ------------------------------------------------------------------ */

(function (root) {
  'use strict';

  var W = 595.28, H = 841.89, M = 40;        /* A4 portrait, in points */

  /* the Moray Wellness CI */
  var TEAL = '#095569';        /* main, p.6 */
  var ORANGE = '#FA6126';      /* main, p.6 */
  var CHAR = '#191819';        /* main, p.6 */
  var CYAN = '#15BEE8';        /* supportive, p.7 */
  var BLUE = '#12A2C6';        /* supportive, p.7 */
  var BAR = '#F67C4B';         /* the template's orange bar, as placed on p.10 */
  /* derived for legibility on white (not CI colours, tints of them) */
  var ORANGE_INK = '#C4471B';  /* orange small text: 4.7:1 on white */
  var GREY = '#5B6670';        /* 5.9:1 on white */
  var RULE = '#DCE3E6';
  var TEAL_TINT = '#E6F0F2';
  var ORANGE_TINT = '#FEEBE2';

  function money(v) { return Math.round(v).toLocaleString('en-US'); }
  function pct(f) { return Math.round(f * 1000) / 10; }

  /* ---- the words ------------------------------------------------------
     Every word on the page, both languages. Arabic is written with Western
     digits and any tanween AFTER the alef (playbook 01, Phase 5). The Arabic
     wording is ours and must be read by an Arabic reader before real use. */
  var MON_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  var MONTH_EN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August',
    'September', 'October', 'November', 'December'];
  var MONTH_AR = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس',
    'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
  var FLOOR_AR = { street: 'الشارع', ground: 'الأرضي', first: 'الأول', second: 'الثاني', third: 'الثالث',
    fourth: 'الرابع', fifth: 'الخامس' };

  var EN = {
    rtl: false,
    egp: function (v) { return 'EGP ' + money(v); },
    shortDate: function (d) { return d.getDate() + ' ' + MON_EN[d.getMonth()] + ' ' + d.getFullYear(); },
    longDate: function (d) { return d.getDate() + ' ' + MONTH_EN[d.getMonth()] + ' ' + d.getFullYear(); },
    building: function (name) { return name; },
    floor: function (fid, word) { return word; },
    floorPhrase: function (fid, word) { return word + ' floor'; },
    floorLower: function (fid, word) { return word.toLowerCase() + ' floor'; },
    area: function (a) { return money(a) + ' m²'; },
    src: function (pg) { return 'Moray brochure, PDF p.' + pg; },
    pill: 'SAMPLE · FOR REVIEW', stamp: 'SAMPLE',
    footer: function (code) { return 'Moray Wellness  ·  Clinic offer  ·  ' + code; },
    footerDemo: 'Sample for review. Prices are Main Marks’ live sheet; anything marked “to be confirmed” is not yet confirmed by Main Marks. Not an offer.',
    clinicOffer: 'Clinic offer', clinic: function (c) { return 'Clinic ' + c; }, date: 'Date',
    /* 2 */
    project: 'The project', projectSub: function (p) { return [p.mark, p.place].filter(Boolean).join('  ·  '); },
    renderSrc: function (pg) { return 'Render: Moray brochure, PDF p.' + pg + '.'; },
    factSmall: function (f) { return f.small; },
    plaza: 'The Grand Central Plaza', sky: 'Sky Lounges',
    /* 3 */
    yourBuilding: 'Your building', buildingSub: 'Moray Wellness clinics  ·  on the master plan',
    tag: function (b) { return b.toUpperCase(); },
    masterSrc: function (pg) { return 'Master plan: Moray brochure, PDF p.' + pg + '.'; },
    fBuilding: 'Building', fLine: 'Line', fUse: 'Use', clinics: 'Clinics', fClinicFloors: 'Clinic floors',
    fYourClinic: 'Your clinic', floorList: function (list) { return list.join(', '); },
    yourClinicVal: function (code, fl) { return code + ', ' + fl; },
    litNote: function (b) { return 'The lit block is ' + b + '’s clinic wing, the part of the building that holds its clinics.'; },
    floorsSrc: 'Clinic floors: Main Marks’ sheet.',
    medical: 'Medical Spaces',
    quote: function (O) { return O.clinicQuote ? '“' + O.clinicQuote + '”' : ''; },
    quoteSrc: function (pg) { return 'Moray brochure, PDF p.' + pg + '. Renders: the same page.'; },
    /* 4 */
    yourClinic: 'Your clinic', clinicSub: function (b, fl) { return b + '  ·  ' + fl + '  ·  Moray Wellness'; },
    thisClinic: function (c) { return 'This clinic, ' + c; },
    fUnitCode: 'Unit code', clinicWord: 'Clinic', fFloor: 'Floor', fArea: 'Area', fList: 'Original price', fPerM: 'Price per m²',
    onFloor: function (fl) { return 'On the ' + fl; },
    drawingsSrc: function (b) { return 'Drawings: Moray brochure, PDF p.20, first floor; ' + b + ' is a sharpened copy.'; },
    /* 5 */
    paymentPlan: 'Payment plan', planLabel: function (pl) { return pl.label; },
    group: function (until) { return until ? 'Current offer  ·  valid until ' + until : 'Standard plan'; },
    cPayable: 'Price after discount', cPrice: 'Price', cOff: function (p, l) { return p + '% off ' + l; },
    cNoDiscount: 'no discount on this plan', cDown: 'Down payment', cOnSigning: 'on signing', cNothing: 'nothing on signing',
    cEvery: 'Every 3 months', cOver: function (n, y) { return n + ' instalments over ' + y + ' years'; },
    cPaid: 'Paid', cOnce: 'Once, on signing',
    sPrice: 'The price', list: 'Original price', discount: 'Your discount',
    minus: function (v) { return '− EGP ' + money(v); },
    discountSub: function (p, current) { return p + '% off the original price  ·  ' + (current ? 'the current offer' : 'this plan'); },
    payable: 'Price after discount', price: 'Price',
    sHow: 'How it is paid', paidFull: 'Paid in full, on signing', downRow: 'Down payment, on signing',
    downSub: function (p, onList, date) { return p + (onList ? '% of the original price  ·  ' : '% of the price after discount  ·  ') + date; },
    instRow: function (n) { return n + ' instalments, every 3 months'; },
    instSub: function (a, b, last) { return 'First on ' + a + ', last on ' + b + (last ? ' (the last one ' + last + ')' : ''); },
    each: function (v) { return v + ' each'; },
    planTotal: 'Total of the plan',
    sNotYet: 'Not included yet', maint: 'Maintenance deposit', maintSub: 'Main Marks has not confirmed the amount or when it is due',
    tbc: 'To be confirmed', delivery: 'Delivery', deliverySub: 'Main Marks has not confirmed the delivery date',
    assumed: 'Assumed until Main Marks confirms', assume: function (n) { return n; },
    /* 6 */
    schedule: 'Payment schedule', scheduleTitle: 'Every payment, dated',
    scheduleSub: function (date, cash) {
      return 'From a contract dated ' + date + '. ' +
        (cash ? 'Paid in full on signing. ' : 'Instalments are quarterly; the first falls three months after signing, as in Main Marks’ sample contract. ') +
        'The maintenance deposit is not shown: Main Marks has not confirmed it.';
    },
    colYear: 'Year', colDue: 'Due date', colWhat: 'Payment', colAmount: 'Amount (EGP)',
    year: function (n) { return 'Year ' + n; }, rowDown: 'Down payment', rowCash: 'Cash payment',
    rowInst: function (n, of) { return 'Instalment ' + n + ' of ' + of; },
    plusMaint: 'Plus the maintenance deposit, once Main Marks confirms its amount and date.'
  };

  /* the project's written assumptions, in Arabic; an unknown one prints in
     English rather than vanish (a note nobody can read beats no note) */
  var ASSUME_AR = {
    'The down payment is taken as a share of the price after the plan’s discount.':
      'المقدم محسوب كنسبة من السعر بعد خصم الخطة.',
    'The first instalment falls three months after the down payment, as in Main Marks’ sample contract.':
      'القسط الأول يستحق بعد 3 شهور من المقدم، كما في نموذج عقد Main Marks.'
  };

  var AR = {
    rtl: true,
    egp: function (v) { return money(v) + ' جنيه'; },
    shortDate: function (d) { return d.getDate() + ' ' + MONTH_AR[d.getMonth()] + ' ' + d.getFullYear(); },
    longDate: function (d) { return d.getDate() + ' ' + MONTH_AR[d.getMonth()] + ' ' + d.getFullYear(); },
    building: function (name) { return String(name).replace(/^Building\s+/, 'مبنى '); },
    floor: function (fid, word) { return FLOOR_AR[fid] || word; },
    floorPhrase: function (fid, word) { return 'الدور ' + (FLOOR_AR[fid] || word); },
    floorLower: function (fid, word) { return 'الدور ' + (FLOOR_AR[fid] || word); },
    area: function (a) { return money(a) + ' م²'; },
    src: function (pg) { return 'كتيب Moray، صفحة ' + pg; },
    pill: 'عينة · للمراجعة', stamp: 'عينة',
    footer: function (code) { return 'Moray Wellness  ·  عرض عيادة  ·  ' + code; },
    footerDemo: 'عينة للمراجعة. الأسعار من قائمة Main Marks الحالية، وكل ما هو مكتوب «يُحدد لاحقاً» لم تؤكده Main Marks بعد. هذا ليس عرضاً.',
    clinicOffer: 'عرض عيادة', clinic: function (c) { return 'عيادة ' + c; }, date: 'التاريخ',
    /* 2 */
    project: 'المشروع', projectSub: function (p) { return [p.mark, 'شارع التسعين الشمالي، القاهرة الجديدة'].filter(Boolean).join('  ·  '); },
    renderSrc: function (pg) { return 'الصورة: كتيب Moray، صفحة ' + pg + '.'; },
    factSmall: function (f) { return f.smallAr || f.small; },
    plaza: 'الساحة المركزية الكبرى', sky: 'الصالات العلوية',
    /* 3 */
    yourBuilding: 'المبنى', buildingSub: 'عيادات Moray Wellness  ·  على المخطط العام',
    tag: function (b) { return b; },
    masterSrc: function (pg) { return 'المخطط العام: كتيب Moray، صفحة ' + pg + '.'; },
    fBuilding: 'المبنى', fLine: 'العلامة', fUse: 'الاستخدام', clinics: 'عيادات', fClinicFloors: 'أدوار العيادات',
    fYourClinic: 'عيادتك', floorList: function (list) { return list.join('، '); },
    yourClinicVal: function (code, fl) { return code + '، ' + fl; },
    litNote: function (b) { return 'الجزء المضيء هو جناح العيادات في ' + b + '، وهو الجزء الذي يضم عياداته.'; },
    floorsSrc: 'أدوار العيادات: من قائمة Main Marks.',
    medical: 'المساحات الطبية',
    quote: function (O) { return O.clinicQuoteAr ? '«' + O.clinicQuoteAr + '»' : ''; },
    quoteSrc: function (pg) { return 'ترجمة عن كتيب Moray، صفحة ' + pg + '. الصور: الصفحة نفسها.'; },
    /* 4 */
    yourClinic: 'عيادتك', clinicSub: function (b, fl) { return b + '  ·  ' + fl + '  ·  Moray Wellness'; },
    thisClinic: function (c) { return 'هذه العيادة، ' + c; },
    fUnitCode: 'كود الوحدة', clinicWord: 'عيادة', fFloor: 'الدور', fArea: 'المساحة', fList: 'السعر الأصلي', fPerM: 'سعر المتر المربع',
    onFloor: function (fl) { return 'في ' + fl; },
    drawingsSrc: function (b) { return 'الرسومات: كتيب Moray، صفحة 20، الدور الأول؛ رسم ' + b + ' نسخة أوضح منها.'; },
    /* 5 */
    paymentPlan: 'خطة السداد',
    planLabel: function (pl) {
      if (pl.cash) return 'كاش فوري  ·  خصم ' + pct(pl.discount) + '%';
      return 'مقدم ' + pct(pl.down) + '%  ·  ' + pl.years + ' سنوات' + (pl.discount ? '  ·  خصم ' + pct(pl.discount) + '%' : '');
    },
    group: function (until) { return until ? 'العرض الحالي  ·  ساري حتى ' + until : 'خطة أساسية'; },
    cPayable: 'السعر بعد الخصم', cPrice: 'السعر', cOff: function (p, l) { return 'خصم ' + p + '% من ' + l; },
    cNoDiscount: 'بدون خصم على هذه الخطة', cDown: 'المقدم', cOnSigning: 'عند التعاقد', cNothing: 'لا شيء عند التعاقد',
    cEvery: 'كل 3 شهور', cOver: function (n, y) { return n + ' قسطاً على ' + y + ' سنوات'; },
    cPaid: 'السداد', cOnce: 'دفعة واحدة عند التعاقد',
    sPrice: 'السعر', list: 'السعر الأصلي', discount: 'خصمك',
    /* NO space after the sign: with one, the shaper's ordering put the minus on
       the far side of the figure ("1,391,200 −"); joined, it stays on the figure */
    minus: function (v) { return '−' + money(v) + ' جنيه'; },
    discountSub: function (p, current) { return 'خصم ' + p + '% من السعر الأصلي  ·  ' + (current ? 'العرض الحالي' : 'هذه الخطة'); },
    payable: 'السعر بعد الخصم', price: 'السعر',
    sHow: 'طريقة السداد', paidFull: 'السداد بالكامل عند التعاقد', downRow: 'المقدم، عند التعاقد',
    downSub: function (p, onList, date) { return p + (onList ? '% من السعر الأصلي  ·  ' : '% من السعر بعد الخصم  ·  ') + date; },
    instRow: function (n) { return n + ' قسطاً، كل 3 شهور'; },
    instSub: function (a, b, last) { return 'الأول في ' + a + '، والأخير في ' + b + (last ? ' (الأخير ' + last + ')' : ''); },
    each: function (v) { return v + ' للقسط'; },
    planTotal: 'إجمالي الخطة',
    sNotYet: 'غير مشمول حتى الآن', maint: 'وديعة الصيانة', maintSub: 'لم تؤكد Main Marks قيمتها أو موعد استحقاقها',
    tbc: 'يُحدد لاحقاً', delivery: 'الاستلام', deliverySub: 'لم تؤكد Main Marks موعد الاستلام',
    assumed: 'افتراضات حتى تؤكدها Main Marks', assume: function (n) { return ASSUME_AR[n] || n; },
    /* 6 */
    schedule: 'جدول السداد', scheduleTitle: 'كل دفعة بتاريخها',
    scheduleSub: function (date, cash) {
      return 'من تعاقد بتاريخ ' + date + '. ' +
        (cash ? 'السداد بالكامل عند التعاقد. ' : 'الأقساط كل 3 شهور، والقسط الأول بعد 3 شهور من التعاقد، كما في نموذج عقد Main Marks. ') +
        'وديعة الصيانة غير موضحة لأن Main Marks لم تؤكدها بعد.';
    },
    colYear: 'السنة', colDue: 'تاريخ الاستحقاق', colWhat: 'البيان', colAmount: 'المبلغ (جنيه)',
    year: function (n) { return 'السنة ' + n; }, rowDown: 'المقدم', rowCash: 'دفعة كاش',
    rowInst: function (n, of) { return 'القسط ' + n + ' من ' + of; },
    plusMaint: 'يضاف إليها وديعة الصيانة بعد أن تؤكد Main Marks قيمتها وموعدها.'
  };

  /* ---- jsPDF's own Arabic passes, switched off for this document ----
     Text reaches doc.text() already shaped and in drawing order. jsPDF then
     (1) re-joins it in preProcessText, fusing a lam that merely ENDS UP beside
     an alef into one glyph, and (2) reverses the run again in its bidi pass.
     (1) is unsubscribed from the document; the parser object is also patched
     because getTextWidth() reads it there. (2) is disarmed on every call.
     Returns the undo. Copied from the CCR app (Qomor, 2026-08-15). */
  function disarm(doc, jsPDF) {
    var ev = doc.internal && doc.internal.events;
    if (ev && typeof ev.getTopics === 'function') {
      var topics = ev.getTopics() || {};
      Object.keys(topics.preProcessText || {}).forEach(function (k) { ev.unsubscribe(k); });
    }
    var parser = jsPDF.API && jsPDF.API.__arabicParser__;
    var original = parser && parser.processArabic;
    if (parser) parser.processArabic = function (a) { return typeof a === 'string' ? a : (a && a.text); };
    var text = doc.text.bind(doc);
    doc.text = function (s, x, y, o) {
      return text(s, x, y, Object.assign({}, o || {}, { isInputVisual: true, isOutputVisual: true }));
    };
    return function () { if (parser && original) parser.processArabic = original; };
  }

  /* is this unit inside what the offer covers today (config `offer.scope`) */
  function inScope(p, u) {
    var sc = p.offer && p.offer.scope;
    if (!sc || !u) return false;
    if (sc.types && sc.types.indexOf(u.type) === -1) return false;
    if (sc.floors && sc.floors.indexOf(u.fid) === -1) return false;
    if (sc.buildings && sc.buildings.indexOf(u.building) === -1) return false;
    return true;
  }

  /* ---- the document ---------------------------------------------- */
  function offer(o) {
    var p = o.project, u = o.unit, plan = o.plan, art = o.art, P = o.plans;
    var when = o.date || new Date();
    var T = o.lang === 'ar' ? AR : EN, RTL = T.rtl, A = o.arabic;

    /* fail closed: the UI prevents all of these, but this is the document a
       customer acts on, so it does not trust its caller */
    if (!u || !u.sellable) throw new Error('Unit ' + (u && u.code) + ' is not available, so it cannot be offered.');
    if (!inScope(p, u)) throw new Error('Unit ' + u.code + ' is outside what the offer covers today.');
    var applicable = P.applicable(p.plans, u.type, when).some(function (x) { return x.id === plan.id; });
    if (!applicable) throw new Error('The plan ' + plan.label + ' is not offered on this unit today.');
    var s = P.schedule({ listPrice: u.listPrice, discount: plan.discount || 0, plan: plan, terms: p.terms || {}, from: when });
    if (!s || s.broken) throw new Error('The ' + plan.label + ' schedule does not foot: ' + (s && s.broken ? s.broken.join('; ') : 'no schedule'));
    var box = p.plates && p.plates[u.building] && p.plates[u.building][u.fid];
    var shape = p.unitShapes && p.unitShapes[u.code];
    if (!box || !shape || !art.plate || !art.plan) throw new Error('Unit ' + u.code + ' has no drawing yet, so no offer is made.');
    ['render', 'street', 'plaza', 'sky', 'corridor', 'clinicRoom', 'master'].forEach(function (k) {
      if (!art[k]) throw new Error('The offer artwork "' + k + '" is missing. No document.');
    });
    if (!(p.offer && p.offer.masterFromFloor)) throw new Error('The master plan fit is missing. No document.');
    if (RTL && !A) throw new Error('An Arabic offer needs js/arabic.js.');
    var floorIdOf = o.floorId || function (f) { return String(f).toLowerCase(); };

    var EN_NAME = o.buildingName || ('Building ' + u.building);
    var bName = T.building(EN_NAME);
    var floorWord = (u.floor || '').replace(/^\w/, function (c) { return c.toUpperCase(); });
    var fid = u.fid;

    var doc = new o.jsPDF({ unit: 'pt', format: 'a4', compress: true });
    var fams = {}, arFams = {};
    o.fonts.forEach(function (f) {
      doc.addFileToVFS(f.file, f.base64);
      doc.addFont(f.file, f.family, 'normal');
      if (f.lang === 'ar') arFams[f.weight] = f.family; else fams[f.weight] = f.family;
    });
    ['light', 'normal', 'medium', 'semi', 'serif'].forEach(function (k) {
      if (!fams[k]) throw new Error('Font "' + k + '" missing; refusing to fall back to an unembedded face.');
    });
    if (RTL) ['normal', 'medium', 'semi'].forEach(function (k) {
      if (!arFams[k]) throw new Error('Arabic font "' + k + '" missing; refusing to fall back to an unembedded face.');
    });
    var undo = RTL ? disarm(doc, o.jsPDF) : function () {};
    doc.setProperties({
      title: 'Moray Wellness — clinic ' + u.code + (RTL ? ' (Arabic, SAMPLE)' : ' (SAMPLE)'),
      subject: 'Clinic offer, sample for review', creator: 'Main Marks app'
    });

    /* ---- drawing helpers, mirrored for Arabic ---- */
    function fill(hex) { doc.setFillColor(hex); }
    function ink(hex) { doc.setTextColor(hex); }
    function stroke(hex, w) { doc.setDrawColor(hex); doc.setLineWidth(w); }
    /* a box's left edge, and a point's x, reflected */
    function mx(x, w) { return RTL ? W - x - (w || 0) : x; }
    function px(x) { return RTL ? W - x : x; }
    function line(x1, y1, x2, y2) { doc.line(px(x1), y1, px(x2), y2); }
    function rect(x, y, w, h, style) { doc.rect(mx(x, w), y, w, h, style); }
    function rrect(x, y, w, h, r, style) { doc.roundedRect(mx(x, w), y, w, h, r, r, style); }

    /* THE FONT IS CHOSEN PER STRING. font() records the role; the face is
       picked when a string is drawn or measured: Arabic letters take Plex
       Arabic, anything else the English face of that role. A display serif
       has no Arabic, so an Arabic heading takes Plex SemiBold a size smaller. */
    var AR_OF = { light: 'normal', normal: 'normal', medium: 'medium', semi: 'semi', serif: 'semi' };
    var role = 'normal', size = 10;
    function font(weight, sz) { role = weight; size = sz; }
    function isAr(str) { return !!A && A.hasArabic(str); }
    function use(str) {
      var ar = isAr(str);
      var fam = ar ? arFams[AR_OF[role]] : fams[role];
      if (!fam) throw new Error('No face for "' + role + '" (' + (ar ? 'Arabic' : 'Latin') + '). No document.');
      doc.setFont(fam, 'normal');
      doc.setFontSize(ar && role === 'serif' ? size * 0.8 : size);
      return { ar: ar, fam: fam, text: ar ? A.forPdf(str) : str };
    }
    /* every string drawn is reported WITH ITS FONT and as drawn, so the caller
       can test each character against that font's own cmap ("70,000 m",
       build 79) and each Arabic string for lost letters */
    var seen = o.onText || function () {};
    /* THE text funnel: x is where the line STARTS in reading order */
    function put(str, x, y, opts) {
      opts = opts || {};
      var t = String(str == null ? '' : str), f = use(t);
      seen(t, f.fam, f.text);
      var align = opts.align || 'left';
      if (RTL && !opts.abs) { x = W - x; align = align === 'left' ? 'right' : align === 'right' ? 'left' : align; }
      var o2 = { align: align };
      if (opts.charSpace && !f.ar) o2.charSpace = opts.charSpace;
      if (opts.angle) o2.angle = opts.angle;
      doc.text(f.text, x, y, o2);
    }
    function width(str) { var f = use(String(str)); return doc.getTextWidth(f.text); }
    /* wrap the LOGICAL text, then each line is shaped when it is drawn */
    function wrap(str, max) {
      var words = String(str).split(' '), lines = [], ln = '';
      words.forEach(function (w) {
        var t = ln ? ln + ' ' + w : w;
        if (ln && width(t) > max) { lines.push(ln); ln = w; } else ln = t;
      });
      if (ln) lines.push(ln);
      return lines;
    }
    /* small caps labels: Arabic is never upper-cased or letterspaced */
    function caps(text, x, y, sz, colour, opts) {
      opts = opts || {};
      var ar = isAr(text);
      font(opts.weight || 'semi', ar ? sz + 1.5 : sz);
      ink(colour);
      put(ar ? text : String(text).toUpperCase(), x, y, { charSpace: sz * 0.14, align: opts.align });
    }
    function label(text, x, y) { caps(text, x, y, 6.8, GREY, { weight: 'medium' }); }
    function alpha(a, fn) {
      doc.saveGraphicsState();
      doc.setGState(new doc.GState({ opacity: a, 'stroke-opacity': a }));
      fn();
      doc.restoreGraphicsState();
    }
    function clipped(x, y, w, h, fn) {
      doc.saveGraphicsState();
      doc.rect(x, y, w, h, null);            /* null: the clip only works on an open path */
      doc.clip();
      doc.discardPath();
      fn();
      doc.restoreGraphicsState();
    }
    /* images take PHYSICAL positions: a picture is never mirrored */
    function image(img, x, y, w, h) { doc.addImage(img.data, img.format, x, y, w, h, img.key, 'FAST'); }
    function cover(img, x, y, w, h, focusX, focusY) {
      var sc = Math.max(w / img.w, h / img.h);
      var dw = img.w * sc, dh = img.h * sc;
      clipped(x, y, w, h, function () { image(img, x + (w - dw) * focusX, y + (h - dh) * focusY, dw, dh); });
    }
    /* a polygon from absolute (physical) points */
    function poly(pts, style) {
      var d = [];
      for (var i = 1; i < pts.length; i++) d.push([pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]]);
      doc.lines(d, pts[0][0], pts[0][1], [1, 1], style, true);
    }

    function stamp() {
      /* diagonal and faint, on every page: a sample must never be mistaken
         for an offer, however the file is forwarded */
      font('semi', 92);
      var t = T.stamp, ar = isAr(t), w = width(t) + (ar ? 0 : t.length * 6), a = 36 * Math.PI / 180;
      alpha(0.05, function () {
        ink(TEAL);
        put(t, W / 2 - Math.cos(a) * w / 2, H / 2 + Math.sin(a) * w / 2, { angle: 36, charSpace: 6, abs: true });
      });
    }
    function pill() {
      font('semi', isAr(T.pill) ? 8.2 : 7.2);
      var tw = width(T.pill) + (isAr(T.pill) ? 0 : T.pill.length * 0.9), pw = tw + 18, ph = 17, py = 28;
      fill(ORANGE);
      rrect(W - M - pw, py, pw, ph, 8.5, 'F');
      ink('#FFFFFF');
      /* the pill sits at the reading END of the header */
      put(T.pill, W - M - 9, py + 11.6, { align: 'right', charSpace: 0.9 });
    }
    /* the CI's template stack (p.10, p.14), down the page's reading-end edge */
    function edge() {
      fill(CYAN); rect(W - 9, 0, 9, H * 0.22, 'F');
      fill(BLUE); rect(W - 9, H * 0.22, 9, H * 0.2, 'F');
      fill(TEAL); rect(W - 9, H * 0.42, 9, H * 0.58, 'F');
    }
    function footer(n, total) {
      var y = H - 30;
      stroke(RULE, 0.6);
      line(M, y - 14, W - M, y - 14);
      font('normal', 7.5);
      ink(GREY);
      put(T.footer(u.code), M, y);
      put(n + ' / ' + total, W - M, y, { align: 'right' });
      font('medium', 7.2);
      ink(ORANGE_INK);
      put(T.footerDemo, W / 2, y + 11, { align: 'center' });
    }
    function head(kicker, title, sub) {
      fill('#FFFFFF');
      doc.rect(0, 0, W, H, 'F');
      edge();
      var lw = 104, lh = lw * art.logoOrange.h / art.logoOrange.w;
      image(art.logoOrange, mx(M, lw), 27, lw, lh);
      pill();
      caps(kicker, M, 96, 8, ORANGE_INK);
      font('serif', 30);
      ink(TEAL);
      put(title, M, 128);
      if (sub) { font('normal', 10.5); ink(GREY); put(sub, M, 148); }
    }

    var TOTAL = 6;
    var bw = box[2] - box[0], bh = box[3] - box[1];

    /* ============ 1. cover ============ */
    fill(TEAL);
    doc.rect(0, 0, W, H, 'F');
    var heroH = 440;
    cover(art.render, 0, 0, W, heroH, 0.5, 0.55);
    /* the template bars: orange at the reading start with a charcoal foot,
       the blue stack at the reading end, as the CI places a render (p.10, p.14) */
    fill(BAR); rect(0, 120, 22, 330, 'F');
    fill(CHAR); rect(0, 450, 22, 70, 'F');
    fill(CYAN); rect(W - 22, 60, 22, 130, 'F');
    fill(BLUE); rect(W - 22, 190, 22, 130, 'F');
    fill(TEAL); rect(W - 22, 320, 22, 130, 'F');

    /* the logo is Latin artwork in both languages: placed, never mirrored */
    var lw0 = 230, lh0 = lw0 * art.logoWhite.h / art.logoWhite.w;
    image(art.logoWhite, mx(M + 10, lw0), heroH + 34, lw0, lh0);
    caps(T.clinicOffer, M + 10, heroH + 148, 8.5, CYAN);
    font('serif', 44);
    ink('#FFFFFF');
    put(T.clinic(u.code), M + 10, heroH + 192);
    font('light', 12.5);
    ink('#D3E6EB');
    put([bName, T.floorPhrase(fid, floorWord), T.area(u.area)].join('   ·   '), M + 10, heroH + 216);

    var fy = heroH + 262;
    caps(T.date, M + 10, fy, 6.8, '#9CC3CD', { weight: 'medium' });
    font('medium', 11);
    ink('#FFFFFF');
    put(T.longDate(when), M + 10, fy + 19);
    stroke('#3C7A8B', 0.7);
    line(M + 10, fy + 30, W - M, fy + 30);

    /* the CI's foot: BY/ MAIN MARKS at the reading start, 1ST MARK / NEW
       CAIRO at the end (p.1). Brand lockups: Latin in both languages */
    font('medium', 8);
    ink('#FFFFFF');
    var mw = 104, mh = mw * art.mainMarks.h / art.mainMarks.w, mmx = mx(M + 10, mw);
    put('BY/', mmx, H - 62, { abs: true });
    image(art.mainMarks, mmx, H - 56, mw, mh);
    put('1ST MARK /', W - M, H - 62, { align: 'right', charSpace: 0.6 });
    put('NEW CAIRO', W - M, H - 50, { align: 'right', charSpace: 0.6 });
    pill();
    stamp();

    var O = p.offer || {};
    var CW = W - 2 * M - 12;
    /* a render with the CI's orange bar on its reading-start edge (CI p.10, p.14) */
    function render(img, x, y, w, h, fx, fy2) {
      var bx = mx(x, w);
      cover(img, bx, y, w, h, fx === undefined ? 0.5 : fx, fy2 === undefined ? 0.5 : fy2);
      fill(BAR);
      doc.rect(RTL ? bx + w - 4 : bx, y, 4, h, 'F');
    }
    function source(text, x, y, opts) { font('normal', 7.2); ink(GREY); put(text, x, y, opts); }
    function caption(title, src, x, y) {
      caps(title, x, y, 7, TEAL);
      source(src, x, y + 11);
    }

    /* ============ 2. the project: Moray ============ */
    doc.addPage();
    head(T.project, p.short || 'Moray', T.projectSub(p));
    render(art.street, M, 168, CW, 250, 0.5, 0.62);
    source(T.renderSrc(12), M, 430);

    /* the brochure's own figures, as it states them (PDF p.14) */
    var facts0 = O.facts || [];
    if (facts0.length) {
      var fw = CW / facts0.length, fy0 = 466;
      stroke(RULE, 0.6);
      line(M, fy0 - 18, M + CW, fy0 - 18);
      facts0.forEach(function (f, i) {
        var x = M + i * fw;
        if (i) { stroke(RULE, 0.6); line(x - 8, fy0 - 6, x - 8, fy0 + 46); }
        /* Instrument Serif has NO "²" (U+00B2): set in it, "70,000 m²" printed
           "70,000 m" with no error (build 79). The figure takes the serif,
           the unit the body face, which has it (playbook 01, Phase 4, 1b) */
        var mu = /^(.*?)\s+(m²)$/.exec(f.big);
        font('serif', 27);
        ink(TEAL);
        put(mu ? mu[1] : f.big, x, fy0 + 14);
        if (mu) {
          var nw = width(mu[1]);
          font('light', 15);
          put(RTL ? 'م²' : mu[2], x + nw + 4, fy0 + 14);
        }
        font('normal', 8.2);
        ink(CHAR);
        wrap(T.factSmall(f), fw - 22).forEach(function (ln, k) { put(ln, x, fy0 + 31 + k * 10.5); });
      });
      stroke(RULE, 0.6);
      line(M, fy0 + 58, M + CW, fy0 + 58);
      source(T.src(O.factsPage) + '.', M, fy0 + 71);
    }

    var gw = (CW - 12) / 2, gh = 168, gy = 566;
    render(art.plaza, M, gy, gw, gh, 0.5, 0.5);
    render(art.sky, M + gw + 12, gy, gw, gh, 0.5, 0.45);
    caption(T.plaza, T.src(26), M, gy + gh + 15);
    caption(T.sky, T.src(25), M + gw + 12, gy + gh + 15);
    footer(2, TOTAL);
    stamp();

    /* ============ 3. your building ============ */
    doc.addPage();
    head(T.yourBuilding, bName, T.buildingSub);
    /* the master plan (PDF p.17), the building lit, the rest veiled. Its cut
       is found on the master plan through the measured fit (config
       masterFromFloor), never placed by eye. The plan is not mirrored: only
       where it sits on the page is. */
    var R = O.masterFromFloor;
    var mpw = 300, mph = mpw * art.master.h / art.master.w, mpy = 168, mpx = mx(M, mpw);
    image(art.master, mpx, mpy, mpw, mph);
    var ms = mpw / art.master.w;
    var ex0 = mpx + (R.s * box[0] + R.tx) * ms, ey0 = mpy + (R.s * box[1] + R.ty) * ms;
    var ex1 = mpx + (R.s * box[2] + R.tx) * ms, ey1 = mpy + (R.s * box[3] + R.ty) * ms;
    alpha(0.62, function () {
      fill('#FFFFFF');
      doc.rect(mpx, mpy, mpw, ey0 - mpy, 'F');
      doc.rect(mpx, ey1, mpw, mpy + mph - ey1, 'F');
      doc.rect(mpx, ey0, ex0 - mpx, ey1 - ey0, 'F');
      doc.rect(ex1, ey0, mpx + mpw - ex1, ey1 - ey0, 'F');
    });
    stroke(ORANGE, 2.2);
    doc.rect(ex0, ey0, ex1 - ex0, ey1 - ey0, 'S');
    /* the building's tag, above it */
    var tag = T.tag(bName);
    font('semi', isAr(tag) ? 8 : 7);
    var tgw = width(tag) + (isAr(tag) ? 0 : tag.length * 0.8) + 12;
    fill(ORANGE);
    doc.rect(ex0 + (ex1 - ex0) / 2 - tgw / 2, ey0 - 17, tgw, 13, 'F');
    ink('#FFFFFF');
    put(tag, ex0 + (ex1 - ex0) / 2, ey0 - 8, { align: 'center', charSpace: 0.8, abs: true });
    source(T.masterSrc(17), M, mpy + mph + 12);

    /* beside it: the building in facts from the sheet */
    var bx = M + mpw + 26, bwid = M + CW - bx, by = 176;
    var rowsB = (o.buildingRows || []).filter(function (r) { return r.type === u.type; });
    var floorsB = [];
    rowsB.forEach(function (r) { var k = floorIdOf(r.floor); if (floorsB.indexOf(k) === -1) floorsB.push(k); });
    var ORDER = ['street', 'ground', 'first', 'second', 'third', 'fourth', 'fifth'];
    floorsB.sort(function (a, c) { return ORDER.indexOf(a) - ORDER.indexOf(c); });
    var floorNames = floorsB.map(function (k) {
      var raw = (rowsB.filter(function (r) { return floorIdOf(r.floor) === k; })[0] || {}).floor || k;
      return T.floor(k, String(raw).replace(/^\w/, function (c) { return c.toUpperCase(); }));
    });
    var bfacts = [[T.fBuilding, bName], [T.fLine, 'Moray Wellness'], [T.fUse, T.clinics]];
    if (floorNames.length) bfacts.push([T.fClinicFloors, T.floorList(floorNames)]);
    bfacts.push([T.fYourClinic, T.yourClinicVal(u.code, T.floorLower(fid, floorWord))]);
    bfacts.forEach(function (f, i) {
      var yy = by + i * 42;
      label(f[0], bx, yy + 10);
      font('semi', 12.5);
      ink(TEAL);
      put(f[1], bx, yy + 27);
      if (i < bfacts.length - 1) { stroke(RULE, 0.5); line(bx, yy + 37, bx + bwid, yy + 37); }
    });
    font('normal', 8.2);
    ink(CHAR);
    wrap(T.litNote(bName), bwid).forEach(function (ln, k) { put(ln, bx, by + bfacts.length * 42 + 6 + k * 11); });
    if (floorNames.length) source(T.floorsSrc, bx, by + bfacts.length * 42 + 36);

    /* Medical Spaces, as the brochure shows them (PDF p.37) */
    var my4 = Math.max(mpy + mph + 40, 500);
    caps(T.medical, M, my4, 7.5, ORANGE_INK);
    var rw4 = (CW - 12) / 2, rh4 = 168;
    render(art.clinicRoom, M, my4 + 10, rw4, rh4, 0.5, 0.5);
    render(art.corridor, M + rw4 + 12, my4 + 10, rw4, rh4, 0.5, 0.42);
    var quote = T.quote(O);
    if (quote) {
      font('serif', isAr(quote) ? 16.5 : 14.5);
      ink(TEAL);
      var ql = wrap(quote, CW);
      ql.forEach(function (ln, k) { put(ln, M, my4 + rh4 + 38 + k * 17); });
      source(T.quoteSrc(O.clinicQuotePage), M, my4 + rh4 + 38 + ql.length * 17 + 2);
    }
    footer(3, TOTAL);
    stamp();

    /* ============ 4. your clinic ============ */
    doc.addPage();
    head(T.yourClinic, T.clinic(u.code), T.clinicSub(bName, T.floorPhrase(fid, floorWord)));

    /* the drawing: the building's floor, the clinic in orange. The sharp
       piece covers EXACTLY the cut, so the traced outline lands on it in the
       brochure's own pixels (config plates / unitShapes / plateImgs). The
       drawing is never mirrored; only its place on the page is. */
    var dy0 = 172, dh = 570, dw = dh * bw / bh;
    var dx0 = mx(M, dw);
    image(art.plate, dx0, dy0, dw, dh);
    stroke(RULE, 0.8);
    doc.rect(dx0, dy0, dw, dh, 'S');
    var pts = shape.map(function (q) { return [dx0 + (q[0] - box[0]) / bw * dw, dy0 + (q[1] - box[1]) / bh * dh]; });
    alpha(0.38, function () { fill(ORANGE); poly(pts, 'F'); });
    stroke(ORANGE, 1.8);
    poly(pts, 'S');
    /* a key, not a leader line: a line from the clinic crossed the
       corridor and the next unit's printed area (build 78) */
    var rx = M + dw + 30, rw = W - M - 12 - rx;
    alpha(0.38, function () { fill(ORANGE); rect(rx, dy0 + 2, 16, 11, 'F'); });
    stroke(ORANGE, 1.4);
    rect(rx, dy0 + 2, 16, 11, 'S');
    font('medium', 9);
    ink(CHAR);
    put(T.thisClinic(u.code), rx + 24, dy0 + 10.5);

    var facts = [
      [T.fUnitCode, u.code], [T.fUse, T.clinicWord], [T.fFloor, T.floor(fid, floorWord)],
      [T.fArea, T.area(u.area)], [T.fList, T.egp(u.listPrice)],
      [T.fPerM, T.egp(u.listPrice / u.area)]
    ];
    var fy2 = dy0 + 34;
    facts.forEach(function (f, i) {
      var yy = fy2 + i * 40;
      label(f[0], rx, yy + 10);
      font('semi', 12.5);
      ink(TEAL);
      put(f[1], rx, yy + 27);
      if (i < facts.length - 1) { stroke(RULE, 0.5); line(rx, yy + 35, rx + rw, yy + 35); }
    });

    /* the key plan: where this wing sits on the whole floor (never mirrored) */
    var ky = fy2 + facts.length * 40 + 22;
    label(T.onFloor(T.floorLower(fid, floorWord)), rx, ky);
    var kw = rw, kh = kw * art.plan.h / art.plan.w;
    if (ky + 8 + kh > dy0 + dh) { kh = dy0 + dh - ky - 8; kw = kh * art.plan.w / art.plan.h; }
    var kx = mx(rx, kw);
    image(art.plan, kx, ky + 8, kw, kh);
    var ksx = kw / art.plan.w, ksy = kh / art.plan.h;
    stroke(ORANGE, 1.6);
    doc.rect(kx + box[0] * ksx, ky + 8 + box[1] * ksy, bw * ksx, bh * ksy, 'S');
    var ux = shape.reduce(function (a, q) { return a + q[0]; }, 0) / shape.length;
    var uy = shape.reduce(function (a, q) { return a + q[1]; }, 0) / shape.length;
    fill(ORANGE);
    doc.circle(kx + ux * ksx, ky + 8 + uy * ksy, 2.4, 'F');

    source(T.drawingsSrc(bName), M, dy0 + dh + 14);
    footer(4, TOTAL);
    stamp();

    /* ============ 5. the plan ============ */
    doc.addPage();
    head(T.paymentPlan, T.planLabel(plan), T.group(plan.until ? T.longDate(new Date(plan.until + 'T12:00:00')) : null));
    var cards = s.cash
      ? [[T.cPayable, T.egp(s.payable), T.cOff(pct(s.discountPct), T.egp(s.list))],
         [T.cPaid, T.cOnce, T.shortDate(s.rows[0].due)]]
      : [[s.discount ? T.cPayable : T.cPrice, T.egp(s.payable), s.discount ? T.cOff(pct(s.discountPct), T.egp(s.list)) : T.cNoDiscount],
         [T.cDown, T.egp(s.down), s.down ? T.cOnSigning : T.cNothing],
         [T.cEvery, T.egp(s.each), T.cOver(s.count, s.years)]];
    var cgap = 10, cwid = (W - 2 * M - 12 - (cards.length - 1) * cgap) / cards.length, cy0 = 170;
    cards.forEach(function (c, i) {
      var x = M + i * (cwid + cgap);
      fill(i === 0 ? TEAL : '#FFFFFF');
      stroke(i === 0 ? TEAL : RULE, 0.8);
      rrect(x, cy0, cwid, 82, 8, 'FD');
      caps(c[0], x + 14, cy0 + 22, 6.6, i === 0 ? '#A9CDD6' : GREY, { weight: 'medium' });
      font('semi', 15);
      ink(i === 0 ? '#FFFFFF' : TEAL);
      put(c[1], x + 14, cy0 + 48);
      font('normal', 8);
      ink(i === 0 ? '#D3E6EB' : GREY);
      put(c[2], x + 14, cy0 + 66);
    });

    var RX = W - M - 12, ly = cy0 + 120;
    function row(l, subText, v, opts) {
      opts = opts || {};
      var tall = (subText ? 12.5 : 0) + 29;
      if (opts.highlight) {
        fill(ORANGE_TINT);
        rrect(M - 10, ly - 17, RX - M + 20, tall, 7, 'F');
        fill(ORANGE);
        rect(M - 10, ly - 17, 3.5, tall, 'F');
      }
      font(opts.bold || opts.highlight ? 'semi' : 'normal', opts.highlight ? 11.5 : opts.bold ? 11 : 10);
      ink(opts.colour || CHAR);
      put(l, M, ly);
      if (opts.highlight) font('semi', 14);
      if (opts.muted) { font('medium', 9.5); ink(GREY); }
      put(v, RX, ly + (opts.highlight ? 1 : 0), { align: 'right' });
      var h = 0;
      if (subText) { font('normal', 8); ink(GREY); put(subText, M, ly + 12.5); h = 12.5; }
      ly += h + 12;
      if (!opts.highlight) { stroke(RULE, opts.bold ? 1 : 0.5); line(M, ly - 3, RX, ly - 3); }
      ly += opts.highlight ? 17 : 15;
    }
    function section(text) { caps(text, M, ly - 8, 7.2, TEAL); ly += 12; }

    section(T.sPrice);
    row(T.list, null, T.egp(s.list));
    if (s.discount) row(T.discount, T.discountSub(pct(s.discountPct), !!plan.until),
      T.minus(s.discount), { highlight: true, colour: ORANGE_INK });
    row(s.discount ? T.payable : T.price, null, T.egp(s.payable), { bold: true, colour: TEAL });

    ly += 8;
    section(T.sHow);
    if (s.cash) {
      row(T.paidFull, T.shortDate(s.rows[0].due), T.egp(s.payable));
    } else {
      var inst = s.rows.filter(function (r) { return r.kind === 'instalment'; });
      if (s.down) row(T.downRow, T.downSub(pct(plan.down), s.downOn === 'list', T.shortDate(s.rows[0].due)), T.egp(s.down));
      row(T.instRow(s.count),
        T.instSub(T.shortDate(inst[0].due), T.shortDate(inst[inst.length - 1].due), s.lastInstalment !== s.each ? T.egp(s.lastInstalment) : ''),
        T.each(T.egp(s.each)));
    }
    row(T.planTotal, null, T.egp(s.payable), { bold: true, colour: TEAL });

    /* what Main Marks has not stated is said to be unstated, with no figure */
    ly += 8;
    section(T.sNotYet);
    row(T.maint, T.maintSub, T.tbc, { muted: true });
    row(T.delivery, T.deliverySub, T.tbc, { muted: true });

    /* the project's written assumptions, less the one "Not included yet" just
       said and any that do not apply to this plan */
    var notes = (p.assumptions || []).filter(function (n) {
      if (/^maintenance and delivery/i.test(n)) return false;
      if (/down payment is taken/i.test(n) && (s.cash || !s.down)) return false;   /* no down payment on this plan */
      if (/first instalment/i.test(n) && s.cash) return false;                     /* no instalments */
      return true;
    });
    if (notes.length) {
      ly += 6;
      var nh = 26 + notes.length * 12;
      fill(TEAL_TINT);
      rrect(M - 10, ly - 12, RX - M + 20, nh, 7, 'F');
      caps(T.assumed, M, ly + 2, 6.8, TEAL);
      font('normal', 8.2);
      ink(CHAR);
      notes.forEach(function (n, i) { put('·  ' + T.assume(n), M, ly + 17 + i * 12); });
    }
    footer(5, TOTAL);
    stamp();

    /* ============ 6. schedule: the Ayyam payment sheet ============ */
    doc.addPage();
    head(T.schedule, T.scheduleTitle);
    font('normal', 9);
    ink(GREY);
    wrap(T.scheduleSub(T.longDate(when), s.cash), W - 2 * M - 12)
      .forEach(function (ln, i) { put(ln, M, 150 + i * 12); });

    /* a 0% down plan has no down payment to list: no zero row on the sheet */
    var items = s.rows.filter(function (r) { return r.amount > 0; }).map(function (r) {
      return { what: r.kind === 'down' ? (s.cash ? T.rowCash : T.rowDown) : T.rowInst(r.no, s.count),
               due: r.due, months: r.months, amount: r.amount };
    });

    /* Laid out as the Ayyam offer's payment sheet (CCR builds 52-54, to
       Muhanad's written spec), in the Wellness colours:
         - a teal header row: Year | Due date | Payment | Amount (EGP);
         - GROUPED BY CONTRACT YEAR through the rows themselves: the first row
           of each year is bold in every column, filled with a very light
           tint alternating orange / teal by year, names the year in its own
           column, and has a stronger rule on top; every other row is white,
           divided by thin rules (a tinted ordinary row would read as a year);
         - ONE full-width table when it fits (34 rows), otherwise TWO side by
           side, split at the year boundary nearest the middle, the total
           running under both;
         - column widths MEASURED from the text they hold;
         - in Arabic the columns and the two tables run right to left.
       Year 1 is the down payment and months 1-12: year = max(1, ceil(m/12)). */
    var TW = W - 2 * M - 12, ty0 = 186, hh = 22, rh = 15.4, PAD = 7, FIT = 34, GAP = 14;
    var YEAR_FILL = ['#FDF0E9', '#EAF3F5'];
    var YEAR_RULE = '#2F6878';
    var lastYr = 0;
    items.forEach(function (it) {
      it.year = Math.max(1, Math.ceil(it.months / 12));
      it.start = it.year !== lastYr;
      lastYr = it.year;
    });
    var split = items.length > FIT, cut = items.length;
    if (split) {
      var best = Infinity;
      items.forEach(function (it, i) {
        if (!it.start || i === 0 || i > FIT || items.length - i > FIT) return;
        if (Math.abs(i - items.length / 2) < best) { best = Math.abs(i - items.length / 2); cut = i; }
      });
      if (best === Infinity) cut = Math.ceil(items.length / 2);
    }
    var tables = split ? [items.slice(0, cut), items.slice(cut)] : [items];
    var per = Math.max.apply(null, tables.map(function (t) { return t.length; }));
    if (per > FIT) throw new Error('The schedule has ' + items.length + ' payments, more than two tables fit on the page. No document.');
    var tw = split ? (TW - GAP) / 2 : TW;
    var bodyTop = ty0 + hh, totalTop = bodyTop + per * rh;
    var hs = RTL ? 8.5 : 7.8;
    var HEAD = { year: T.colYear, due: T.colDue, what: T.colWhat, amt: T.colAmount };
    var keys = ['year', 'due', 'what', 'amt'];
    function textOf(it, k) {
      return k === 'year' ? (it.start ? T.year(it.year) : '') : k === 'due' ? T.shortDate(it.due) : k === 'what' ? it.what : money(it.amount);
    }
    var bs = RTL ? (split ? 8.5 : 9) : (split ? 8 : 8.5), cols;
    for (;;) {
      cols = keys.map(function (k) {
        font('semi', hs);
        var wmax = width(HEAD[k]);
        font('semi', bs);
        items.forEach(function (it) { wmax = Math.max(wmax, width(textOf(it, k))); });
        return { k: k, need: wmax + 2 * PAD, w: wmax + 2 * PAD, align: k === 'amt' ? 'right' : null };
      });
      var fixed = cols.reduce(function (sum, col) { return col.k === 'what' ? sum : sum + col.w; }, 0);
      var what = cols.filter(function (col) { return col.k === 'what'; })[0];
      if (tw - fixed >= what.need || bs <= 7) {
        var spare = Math.max(0, tw - fixed - what.need);
        what.w = what.need + spare * (split ? 1 : 0.55);
        if (!split) cols.filter(function (col) { return col.k === 'amt'; })[0].w += spare * 0.45;
        break;
      }
      bs -= 0.25;
    }
    /* text in one cell; x0 is the table's reading-start edge, put() mirrors it */
    function cell(str, x0, ci, top, height, sz) {
      var left = x0;
      for (var j = 0; j < ci; j++) left += cols[j].w;
      var col = cols[ci], base = top + height / 2 + sz * 0.36;
      if (col.align === 'right') put(str, left + col.w - PAD, base, { align: 'right' });
      else put(str, left + PAD, base);
    }

    var running = 0;
    tables.forEach(function (list, t) {
      var x0 = M + t * (tw + GAP), bx2 = mx(x0, tw);
      fill('#FFFFFF');
      doc.rect(bx2, ty0, tw, totalTop - ty0, 'F');
      fill(TEAL);
      doc.rect(bx2, ty0, tw, hh, 'F');
      font('semi', hs);
      ink('#FFFFFF');
      cols.forEach(function (col, ci) { cell(HEAD[col.k], x0, ci, ty0, hh, hs); });
      list.forEach(function (it, i) {
        var top = bodyTop + i * rh;
        if (it.start) { fill(YEAR_FILL[(it.year - 1) % 2]); doc.rect(bx2, top, tw, rh, 'F'); }
        var weight = it.start ? 'semi' : 'normal';
        cols.forEach(function (col, ci) {
          if (col.k === 'year') { if (!it.start) return; font('semi', bs); ink(TEAL); }
          else if (col.k === 'amt') { font(it.start ? 'semi' : 'medium', bs); ink(TEAL); }
          else { font(weight, bs); ink(CHAR); }
          cell(textOf(it, col.k), x0, ci, top, rh, bs);
        });
        running += it.amount;
      });
      /* rules after the fills: verticals and thin row rules, then the year
         rules on top. A shorter second table keeps its empty ruled rows. */
      stroke('#D3DDE1', 0.45);
      var vx = x0;
      for (var ci = 0; ci < cols.length - 1; ci++) { vx += cols[ci].w; doc.line(px(vx), bodyTop, px(vx), totalTop); }
      for (var r = 1; r < per; r++) {
        if (list[r] && list[r].start) continue;
        doc.line(bx2, bodyTop + r * rh, bx2 + tw, bodyTop + r * rh);
      }
      stroke(YEAR_RULE, 1.1);
      list.forEach(function (it, i) { if (it.start && i > 0) doc.line(bx2, bodyTop + i * rh, bx2 + tw, bodyTop + i * rh); });
      stroke('#9DB3BA', 0.8);
      doc.rect(bx2, ty0, tw, totalTop - ty0, 'S');
    });

    /* the table RE-ADDED, not s.payable restated: a copied total would print
       even if the rows did not add up */
    if (running !== s.payable) throw new Error('The schedule adds to ' + running + ', not ' + s.payable + '. No document.');
    fill('#DCEBEF');
    rect(M, totalTop, TW, hh, 'F');
    font('semi', RTL ? 10 : 9.5);
    ink(TEAL);
    put(T.planTotal, M + PAD + 1, totalTop + hh / 2 + 3.4);
    put(T.egp(running), M + TW - PAD - 1, totalTop + hh / 2 + 3.4, { align: 'right' });
    stroke('#9DB3BA', 0.8);
    rect(M, totalTop, TW, hh, 'S');
    stroke(TEAL, 1.1);
    line(M, totalTop, M + TW, totalTop);
    font('normal', RTL ? 9 : 8.5);
    ink(GREY);
    put(T.plusMaint, M, totalTop + hh + 18);
    footer(6, TOTAL);
    stamp();

    undo();
    return doc;
  }

  /* the artwork an offer needs, so the caller can fetch it all in one batch */
  function artwork(p, u) {
    var a = (p.offer && p.offer.art) || {};
    return {
      render: a.render, logoWhite: a.logoWhite, logoOrange: a.logoOrange, mainMarks: a.mainMarks,
      plate: a.plates && a.plates[u.building] && a.plates[u.building][u.fid],
      plan: a.floors && a.floors[u.fid],
      street: a.street, plaza: a.plaza, sky: a.sky, corridor: a.corridor, clinicRoom: a.clinicRoom, master: a.master
    };
  }

  var api = { offer: offer, artwork: artwork, inScope: inScope, disarm: disarm };
  if (typeof module === 'object' && module.exports) module.exports = api;
  else { root.MM = root.MM || {}; root.MM.pdf = api; }
}(typeof window !== 'undefined' ? window : globalThis));
