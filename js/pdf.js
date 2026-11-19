/* ------------------------------------------------------------------
   Main Marks — the unit offer, as a PDF, in English or Arabic, in the
   CI of the unit's line.

   Build 78 (2026-10-02): first cut. Muhanad: "create a pdf offer ... the
   payment sheet like the one in the Ayyam pdf", "make sure to have the
   moray wellness branding", "the first floor in moray wellness only".
   Build 79: the project and the selected building, the mall renders.
   Build 80: "the exact same pdf but in arabic" -- one layout, two languages.
   2026-11-04: EVERY LINE (Muhanad: "we need to have all the pdfs offers and
   the whatsapp posts"): a clinic in the Moray Wellness CI, an office or a
   shop in the Moray CI, a fourth-floor office in The Fourth's (THEMES).
   Every page says SAMPLE until Main Marks confirms the terms it rests on.

   Six A4 pages, in the order a buyer asks (the Ayyam offer's order,
   CCR Development App js/pdf.js, plus the project and the building):
     1. cover          the line, which unit, the date
     2. the project    Moray: the brochure's renders and its own figures
     3. your building  the master plan with the building lit; the line's own
                       two pictures and words (Medical Spaces for a clinic)
     4. your unit      the drawing, the unit in the accent, the facts, a key plan
     5. the plan       what it costs and how it is paid
     6. schedule       every payment, dated: the Ayyam payment sheet
   Every render is Main Marks' own (its brochures and CIs). The night aerial on
   the app's chooser page was made in Codex, so it is never printed here.

   THE LOOK is the line's CI (THEMES, below; config offer.lines). The Moray
   Wellness CI: teal #095569, orange #FA6126, charcoal #191819, white (p.6);
   cyan #15BEE8 and #12A2C6 (p.7); its template bars (p.10, p.14); headings in
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

  /* THE THREE CIs AN OFFER WEARS (2026-11-04), one per line (config offer.lines[id].brand). The same six
     pages in each; what changes is the colour, the heading face and the cover's own device.
       primary   headings, figures, the table's head, the first card
       accent    the unit on its drawing, the building on the master plan, the SAMPLE pill
       edge      the stack down the reading-end edge of every inner page
       display   the heading face: the Wellness CI's serif italic (Campaign Serif, Instrument Serif
                 standing in), or Manrope SemiBold where the CI's face is a sans
     The pale tints and the ink of small accent text are derived for legibility on white, not CI colours. */
  var THEMES = {
    /* 02 Brand & CI\Moray Wellness - CI.pdf: teal 095569, orange FA6126, charcoal 191819 (p.6); cyan 15BEE8,
       blue 12A2C6 (p.7); the template's orange bar F67C4B as placed on p.10; Campaign Serif / Manrope (p.5) */
    wellness: {
      primary: '#095569', accent: '#FA6126', text: '#191819', bar: '#F67C4B',
      edge: [['#15BEE8', 0.22], ['#12A2C6', 0.20], ['#095569', 0.58]],
      accentInk: '#C4471B',      /* orange small text: 4.7:1 on white */
      grey: '#5B6670', rule: '#DCE3E6', primaryTint: '#E6F0F2', accentTint: '#FEEBE2',
      onPrimary: '#D3E6EB', onPrimaryCaps: '#A9CDD6', coverCaps: '#9CC3CD', coverRule: '#3C7A8B', coverKicker: '#15BEE8',
      years: ['#FDF0E9', '#EAF3F5'], yearRule: '#2F6878', tableRule: '#D3DDE1', tableBorder: '#9DB3BA', totalFill: '#DCEBEF',
      display: 'serif', logoW: 104, cover: 'wellness'
    },
    /* 02 Brand & CI\Moray - CI.pdf: primary 323031 and white (p.31), 191819, orange fa6126 (p.32), secondary
       c0bdbd, 565656, f59421 (p.34); Manrope, the primary typeface (p.37). Commercial and the offices. */
    moray: {
      primary: '#323031', accent: '#FA6126', text: '#191819', bar: '#FA6126',
      edge: [['#FA6126', 0.22], ['#565656', 0.20], ['#323031', 0.58]],
      accentInk: '#C4471B',
      grey: '#565656', rule: '#E0DEDE', primaryTint: '#F0EFEF', accentTint: '#FEEBE2',
      onPrimary: '#E4E2E2', onPrimaryCaps: '#C0BDBD', coverCaps: '#C0BDBD', coverRule: '#565656', coverKicker: '#FA6126',
      years: ['#FDF0E9', '#F0EFEF'], yearRule: '#565656', tableRule: '#DCDADA', tableBorder: '#B3B0B0', totalFill: '#E9E8E8',
      display: 'semi', logoW: 96, cover: 'moray'
    },
    /* 02 Brand & CI\The Fourth - CI.pdf: void black 090909, pure white, paper white F4F4F1 (p.21); field green
       5E743B and concrete D7D8D5, "sparingly" (p.22); Naru Sans (p.23), a licensed face, so Manrope stands in.
       The red D74E3C is SAMPLED off the CI's p.30 post (its squares); it is not among the printed colours. */
    fourth: {
      primary: '#090909', accent: '#D74E3C', text: '#090909', bar: '#5E743B',
      edge: [['#5E743B', 0.22], ['#D7D8D5', 0.20], ['#090909', 0.58]],
      accentInk: '#B23A2A',      /* the red, darkened for small text: 5.9:1 on white */
      grey: '#5A5A58', rule: '#DFDFDB', primaryTint: '#F4F4F1', accentTint: '#FBEAE7',
      onPrimary: '#F4F4F1', onPrimaryCaps: '#D7D8D5', coverCaps: '#D7D8D5', coverRule: '#3A3A38', coverKicker: '#D7D8D5',
      years: ['#F4F4F1', '#EEF1EA'], yearRule: '#5E743B', tableRule: '#DCDCD8', tableBorder: '#B5B6B2', totalFill: '#ECECE8',
      display: 'semi', logoW: 118, cover: 'fourth'
    }
  };

  /* the words that name the unit, by the sheet's Type */
  var KINDS = {
    Clinic:     { en: 'Clinic', enMany: 'Clinics', ar: 'عيادة', arMany: 'عيادات', arYour: 'عيادتك', arThis: 'هذه العيادة', arFloors: 'أدوار العيادات' },
    Admin:      { en: 'Office', enMany: 'Offices', ar: 'مكتب', arMany: 'مكاتب إدارية', arYour: 'مكتبك', arThis: 'هذا المكتب', arFloors: 'أدوار المكاتب' },
    Commercial: { en: 'Shop',   enMany: 'Shops',   ar: 'محل', arMany: 'محلات تجارية', arYour: 'محلك', arThis: 'هذا المحل', arFloors: 'أدوار المحلات' }
  };

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
  var FLOOR_AR = { street: 'مستوى الشارع', ground: 'الأرضي', first: 'الأول', second: 'الثاني', third: 'الثالث',
    fourth: 'الرابع', fifth: 'الخامس' };

  var EN = {
    rtl: false,
    egp: function (v) { return 'EGP ' + money(v); },
    shortDate: function (d) { return d.getDate() + ' ' + MON_EN[d.getMonth()] + ' ' + d.getFullYear(); },
    longDate: function (d) { return d.getDate() + ' ' + MONTH_EN[d.getMonth()] + ' ' + d.getFullYear(); },
    building: function (name) { return name; },
    /* the sheet writes the street level 'S.Level': it is named as the app names it (js/post.js) */
    floor: function (fid, word) { return fid === 'street' ? 'Street level' : word; },
    floorPhrase: function (fid, word) { return fid === 'street' ? 'Street level' : word + ' floor'; },
    floorLower: function (fid, word) { return fid === 'street' ? 'street level' : word.toLowerCase() + ' floor'; },
    area: function (a) { return money(a) + ' m²'; },
    src: function (pg) { return 'Moray brochure, PDF p.' + pg; },
    pill: 'SAMPLE · FOR REVIEW', stamp: 'SAMPLE',
    /* K = the unit's words (KINDS), L = its line (config offer.lines) */
    footer: function (code, K, L) { return L.name + '  ·  ' + K.en + ' offer  ·  ' + code; },
    /* build 155: the line's name as its card and Main Marks' offer design write it */
    lineSub: function (sub) { return String(sub || '').replace(/(^|\s)\w/g, function (c) { return c.toUpperCase(); }); },
    footerDemo: 'Sample for review. Prices are Main Marks’ live sheet; anything marked “to be confirmed” is not yet confirmed by Main Marks. Not an offer.',
    unitOffer: function (K) { return K.en + ' offer'; }, unit: function (K, c) { return K.en + ' ' + c; }, date: 'Date',
    /* 2 */
    project: 'The project', projectSub: function (p) { return [p.mark, p.place].filter(Boolean).join('  ·  '); },
    renderSrc: function (pg) { return 'Render: Moray brochure, PDF p.' + pg + '.'; },
    /* build 155: page 2 as Main Marks laid it out */
    mixedUse: 'Mixed use', mark1: '1ST MARK /', mark2: 'NEW CAIRO', northSt: 'NORTH 90',
    renderSrcDay: 'Render and map: Main Marks.', mapSrc: 'Where Moray is: North 90th Street, New Cairo.',
    factSmall: function (f) { return f.small; },
    plaza: 'The Grand Central Plaza', sky: 'Sky Lounges',
    /* 3 */
    yourBuilding: 'Your building', buildingSub: function (K, L) { return L.name + '  ·  on the master plan'; },
    tag: function (b) { return b.toUpperCase(); },
    masterSrc: function (pg) { return 'Master plan: Moray brochure, PDF p.' + pg + '.'; },
    fBuilding: 'Building', fLine: 'Line', fUse: 'Use', uses: function (K) { return K.enMany; }, fUnitFloors: function (K) { return K.en + ' floors'; },
    fYourUnit: function (K) { return 'Your ' + K.en.toLowerCase(); }, floorList: function (list) { return list.join(', '); },
    yourUnitVal: function (code, fl) { return code + ', ' + fl; },
    /* a clinic block is a WING of its building (brochure p.20); every other unit is in its building */
    litNote: function (b, K, wing) {
      return wing ? 'The lit block is ' + b + '’s clinic wing, the part of the building that holds its clinics.'
        : 'The lit block is ' + b + ', the building this ' + K.en.toLowerCase() + ' is in.';
    },
    floorsSrc: function (K) { return K.en + ' floors: Main Marks’ sheet.'; },
    rooms: function (L) { return L.rooms.title; },
    quote: function (L) { return L.quote ? '“' + L.quote + '”' : ''; },
    quoteSrc: function (L) {
      var R = L.rooms, same = R.a.page === L.quotePage && R.b.page === L.quotePage;
      return R.doc + ', PDF p.' + L.quotePage + '. ' + (same ? 'Renders: the same page.'
        : 'Renders: PDF p.' + (R.a.page === R.b.page ? R.a.page : R.a.page + ' and ' + R.b.page) + '.');
    },
    /* 4 */
    yourUnit: function (K) { return 'Your ' + K.en.toLowerCase(); }, unitSub: function (b, fl, L) { return b + '  ·  ' + fl + '  ·  ' + L.name; },
    thisUnit: function (K, c) { return 'This ' + K.en.toLowerCase() + ', ' + c; },
    fUnitCode: 'Unit code', unitWord: function (K) { return K.en; }, fFloor: 'Floor', fArea: 'Area', fList: 'Original price', fPerM: 'Price per m²',
    onFloor: function (fl) { return 'On the ' + fl; },
    drawingsSrc: function (floor) { return 'Drawings: Main Marks’ floor plans, ' + floor.toLowerCase() + '.'; },
    /* 5 */
    paymentPlan: 'Payment plan', planLabel: function (pl) { return pl.label; },
    group: function (until) { return until ? 'Current offer  ·  valid until ' + until : 'Standard plan'; },
    cPayable: 'Price after discount', cPrice: 'Price', cOff: function (p, l) { return p + '% off ' + l; },
    cNoDiscount: 'no discount on this plan', cDown: 'Down payment', cOnSigning: 'on signing', cNothing: 'nothing on signing',
    cPlusLater: function (v) { return 'on signing, + ' + v + ' after 3 months'; },
    cEvery: 'Every 3 months', cOver: function (n, y) { return n + ' instalments over ' + y + (y === 1 ? ' year' : ' years'); },
    cPaid: 'Paid', cOnce: 'Once, on signing',
    sPrice: 'The price', list: 'Original price', discount: 'Your discount',
    minus: function (v) { return '− EGP ' + money(v); },
    discountSub: function (p, current, afterDown) { return p + (afterDown ? '% off what is left after the down payment  ·  ' : '% off the original price  ·  ') + (current ? 'the current offer' : 'this plan'); },
    payable: 'Price after discount', price: 'Price',
    sHow: 'How it is paid', paidFull: 'Paid in full, on signing', downRow: 'Down payment, on signing', down2Row: 'Down payment, second part, after 3 months',
    downSub: function (p, onList, date) { return p + (onList ? '% of the original price  ·  ' : '% of the price after discount  ·  ') + date; },
    instRow: function (n) { return n + ' instalments, every 3 months'; },
    instSub: function (a, b, last) { return 'First on ' + a + ', last on ' + b + (last ? ' (the last one ' + last + ')' : ''); },
    each: function (v) { return v + ' each'; },
    planTotal: 'Total of the plan',
    sNotYet: 'Not included yet', maint: 'Maintenance deposit', maintSub: 'Main Marks has not confirmed the amount or when it is due',
    tbc: 'To be confirmed', delivery: 'Delivery', deliverySub: 'Main Marks has not confirmed the delivery date',
    /* build 153: the maintenance deposit and delivery, from config terms */
    sAlso: 'On top of the price',
    sDelivery: 'Handover',   /* build 155: delivery alone, maintenance is not on the offer */
    maintDue: function (p, onList, date, before) { return p + (onList ? '% of the original price  ·  due ' : '% of the price after discount  ·  due ') + date + ', ' + span(before) + ' before delivery'; },
    deliveryAfter: function (m) { var w = span(m); return w.charAt(0).toUpperCase() + w.slice(1) + ' after the contract'; },
    totalAll: 'Total, with the maintenance deposit',
    assumed: 'Assumed until Main Marks confirms', assume: function (n) { return n; },
    /* 6 */
    schedule: 'Payment schedule', scheduleTitle: 'Every payment, dated',
    scheduleSub: function (date, cash, before) {
      return 'From a contract dated ' + date + '. ' +
        (cash ? 'Paid in full on signing. ' : 'Instalments are quarterly; the first falls three months after signing, as in Main Marks’ sample contract. ') +
        (before === null ? '' : before !== undefined ? 'The maintenance deposit falls ' + span(before) + ' before delivery.' : 'The maintenance deposit is not shown: Main Marks has not confirmed it.');
    },
    colYear: 'Year', colDue: 'Due date', colWhat: 'Payment', colAmount: 'Amount (EGP)',
    year: function (n) { return 'Year ' + n; }, rowDown: 'Down payment', rowDown2: 'Down payment, second part', rowCash: 'Cash payment',
    rowInst: function (n, of) { return 'Instalment ' + n + ' of ' + of; }, rowMaint: 'Maintenance deposit',
    plusMaint: 'Plus the maintenance deposit, once Main Marks confirms its amount and date.',
    deliveryTbc: 'The delivery date of this building is to be confirmed by Main Marks.',
    deliveryLine: function (date, m) { return 'Delivery on ' + date + ', ' + span(m) + ' after the contract.'; }
  };
  /* a stretch of months in words: "one year", "two years", "18 months" */
  function span(m) { return m === 12 ? 'one year' : m === 24 ? 'two years' : m % 12 === 0 ? (m / 12) + ' years' : m + ' months'; }

  /* the project's written assumptions, in Arabic; an unknown one prints in
     English rather than vanish (a note nobody can read beats no note) */
  var ASSUME_AR = {
    'The down payment is taken as a share of the price after the plan’s discount.':
      'المقدم محسوب كنسبة من السعر بعد خصم نظام السداد.',
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
    floorPhrase: function (fid, word) { return fid === 'street' ? FLOOR_AR.street : 'الدور ' + (FLOOR_AR[fid] || word); },
    floorLower: function (fid, word) { return fid === 'street' ? FLOOR_AR.street : 'الدور ' + (FLOOR_AR[fid] || word); },
    area: function (a) { return money(a) + ' م²'; },
    src: function (pg) { return 'كتيب Moray، صفحة ' + pg; },
    pill: 'عينة · للمراجعة', stamp: 'عينة',
    footer: function (code, K, L) { return L.nameAr + '  ·  عرض ' + K.ar + '  ·  ' + code; },
    lineSub: function (sub) { return ({ 'Commercial units': 'الوحدات التجارية', 'Administrative units': 'الوحدات الإدارية', 'Premium offices with view': 'مكاتب مميزة بإطلالة',
      'Clinical units': 'الوحدات الطبية', 'Serviced apartments': 'الشقق الفندقية' })[sub] || sub; },
    footerDemo: 'عينة للمراجعة. الأسعار من قائمة Main Marks الحالية، وكل ما هو مكتوب «يُحدد لاحقاً» لم تؤكده Main Marks بعد. هذا ليس عرضاً.',
    unitOffer: function (K) { return 'عرض ' + K.ar; }, unit: function (K, c) { return K.ar + ' ' + c; }, date: 'التاريخ',
    /* 2 */
    project: 'المشروع', projectSub: function (p) { return [p.mark, 'شارع التسعين الشمالي، القاهرة الجديدة'].filter(Boolean).join('  ·  '); },
    renderSrc: function (pg) { return 'الصورة: كتيب Moray، صفحة ' + pg + '.'; },
    /* build 155 (our Arabic) */
    mixedUse: 'متعدد الاستخدامات', mark1: 'العلامة الأولى /', mark2: 'القاهرة الجديدة', northSt: 'التسعين الشمالي',
    renderSrcDay: 'الصورة والخريطة: Main Marks.', mapSrc: 'موقع Moray: شارع التسعين الشمالي، القاهرة الجديدة.',
    factSmall: function (f) { return f.smallAr || f.small; },
    plaza: 'الساحة المركزية الكبرى', sky: 'الصالات العلوية',
    /* 3 */
    yourBuilding: 'المبنى', buildingSub: function (K, L) { return L.nameAr + '  ·  على المخطط العام'; },
    tag: function (b) { return b; },
    masterSrc: function (pg) { return 'المخطط العام: كتيب Moray، صفحة ' + pg + '.'; },
    fBuilding: 'المبنى', fLine: 'العلامة', fUse: 'الاستخدام', uses: function (K) { return K.arMany; }, fUnitFloors: function (K) { return K.arFloors; },
    fYourUnit: function (K) { return K.arYour; }, floorList: function (list) { return list.join('، '); },
    yourUnitVal: function (code, fl) { return code + '، ' + fl; },
    litNote: function (b, K, wing) {
      return wing ? 'الجزء المضيء هو جناح العيادات في ' + b + '، وهو الجزء الذي يضم عياداته.'
        : 'الجزء المضيء هو ' + b + '، المبنى الذي يقع فيه ' + K.arThis + '.';
    },
    floorsSrc: function (K) { return K.arFloors + ': من قائمة Main Marks.'; },
    rooms: function (L) { return L.rooms.titleAr; },
    quote: function (L) { return L.quoteAr ? '«' + L.quoteAr + '»' : ''; },
    quoteSrc: function (L) {
      var R = L.rooms, same = R.a.page === L.quotePage && R.b.page === L.quotePage;
      return 'ترجمة عن ' + R.docAr + '، صفحة ' + L.quotePage + '. ' + (same ? 'الصور: الصفحة نفسها.'
        : 'الصور: صفحة ' + (R.a.page === R.b.page ? R.a.page : R.a.page + ' و' + R.b.page) + '.');
    },
    /* 4 */
    yourUnit: function (K) { return K.arYour; }, unitSub: function (b, fl, L) { return b + '  ·  ' + fl + '  ·  ' + L.nameAr; },
    thisUnit: function (K, c) { return K.arThis + '، ' + c; },
    fUnitCode: 'كود الوحدة', unitWord: function (K) { return K.ar; }, fFloor: 'الدور', fArea: 'المساحة', fList: 'السعر الأصلي', fPerM: 'سعر المتر المربع',
    onFloor: function (fl) { return 'في ' + fl; },
    drawingsSrc: function (floor) { return 'الرسومات: مخططات أدوار Main Marks، ' + floor + '.'; },
    /* 5 */
    paymentPlan: 'نظام السداد',
    planLabel: function (pl) {
      if (pl.cash) return 'كاش فوري' + (pl.discount ? '  ·  خصم ' + pct(pl.discount) + '%' : '');
      /* a split down payment names both parts: مقدم 2.5% + 2.5% */
      var parts = [pl.down].concat((pl.milestones || []).filter(function (m) { return m.down; }).map(function (m) { return m.pct; }));
      return 'مقدم ' + parts.map(function (f) { return pct(f) + '%'; }).join(' + ') + '  ·  ' + yearsAr(pl.years) + (pl.discount ? '  ·  خصم ' + pct(pl.discount) + '%' : '');
    },
    group: function (until) { return until ? 'العرض الحالي  ·  ساري حتى ' + until : 'نظام أساسي'; },
    cPayable: 'السعر بعد الخصم', cPrice: 'السعر', cOff: function (p, l) { return 'خصم ' + p + '% من ' + l; },
    cNoDiscount: 'بدون خصم على نظام السداد هذا', cDown: 'المقدم', cOnSigning: 'عند التعاقد', cNothing: 'لا شيء عند التعاقد',
    cPlusLater: function (v) { return 'عند التعاقد، + ' + v + ' بعد 3 شهور'; },
    cEvery: 'كل 3 شهور', cOver: function (n, y) { return countAr(n) + ' على ' + yearsAr(y); },
    cPaid: 'السداد', cOnce: 'دفعة واحدة عند التعاقد',
    sPrice: 'السعر', list: 'السعر الأصلي', discount: 'خصمك',
    /* NO space after the sign: with one, the shaper's ordering put the minus on
       the far side of the figure ("1,391,200 −"); joined, it stays on the figure */
    minus: function (v) { return '−' + money(v) + ' جنيه'; },
    discountSub: function (p, current, afterDown) { return 'خصم ' + p + (afterDown ? '% من المتبقي بعد المقدم  ·  ' : '% من السعر الأصلي  ·  ') + (current ? 'العرض الحالي' : 'هذا النظام'); },
    payable: 'السعر بعد الخصم', price: 'السعر',
    sHow: 'طريقة السداد', paidFull: 'السداد بالكامل عند التعاقد', downRow: 'المقدم، عند التعاقد', down2Row: 'الجزء الثاني من المقدم، بعد 3 شهور',
    downSub: function (p, onList, date) { return p + (onList ? '% من السعر الأصلي  ·  ' : '% من السعر بعد الخصم  ·  ') + date; },
    instRow: function (n) { return countAr(n) + '، كل 3 شهور'; },
    instSub: function (a, b, last) { return 'الأول في ' + a + '، والأخير في ' + b + (last ? ' (الأخير ' + last + ')' : ''); },
    each: function (v) { return v + ' للقسط'; },
    planTotal: 'إجمالي نظام السداد',
    sNotYet: 'غير مشمول حتى الآن', maint: 'وديعة الصيانة', maintSub: 'لم تؤكد Main Marks قيمتها أو موعد استحقاقها',
    tbc: 'يُحدد لاحقاً', delivery: 'الاستلام', deliverySub: 'لم تؤكد Main Marks موعد الاستلام',
    /* build 153 (our Arabic) */
    sAlso: 'بالإضافة إلى السعر',
    sDelivery: 'الاستلام',   /* build 155 (our Arabic) */
    maintDue: function (p, onList, date, before) { return p + (onList ? '% من السعر الأصلي  ·  تُستحق في ' : '% من السعر بعد الخصم  ·  تُستحق في ') + date + '، قبل الاستلام ' + byAr(before); },
    deliveryAfter: function (m) { return 'بعد ' + spanAr(m) + ' من التعاقد'; },
    totalAll: 'الإجمالي شامل وديعة الصيانة',
    assumed: 'افتراضات حتى تؤكدها Main Marks', assume: function (n) { return ASSUME_AR[n] || n; },
    /* 6 */
    schedule: 'جدول السداد', scheduleTitle: 'كل دفعة بتاريخها',
    scheduleSub: function (date, cash, before) {
      return 'من تعاقد بتاريخ ' + date + '. ' +
        (cash ? 'السداد بالكامل عند التعاقد. ' : 'الأقساط كل 3 شهور، والقسط الأول بعد 3 شهور من التعاقد، كما في نموذج عقد Main Marks. ') +
        (before === null ? '' : before !== undefined ? 'وديعة الصيانة تُستحق قبل الاستلام ' + byAr(before) + '.' : 'وديعة الصيانة غير موضحة لأن Main Marks لم تؤكدها بعد.');
    },
    colYear: 'السنة', colDue: 'تاريخ الاستحقاق', colWhat: 'البيان', colAmount: 'المبلغ (جنيه)',
    year: function (n) { return 'السنة ' + n; }, rowDown: 'المقدم', rowDown2: 'الجزء الثاني من المقدم', rowCash: 'دفعة كاش',
    rowInst: function (n, of) { return 'القسط ' + n + ' من ' + of; }, rowMaint: 'وديعة الصيانة',
    plusMaint: 'يضاف إليها وديعة الصيانة بعد أن تؤكد Main Marks قيمتها وموعدها.',
    deliveryTbc: 'موعد استلام هذا المبنى تؤكده Main Marks لاحقاً.',
    deliveryLine: function (date, m) { return 'الاستلام في ' + date + '، بعد ' + spanAr(m) + ' من التعاقد.'; }
  };
  function spanAr(m) { return m === 12 ? 'سنة' : m === 24 ? 'سنتين' : m % 12 === 0 ? yearsAr(m / 12) : m + (m <= 10 ? ' شهور' : ' شهراً'); }
  /* build 154: the admin sets the years (2 to 12), so the Arabic counted noun follows the number:
     2 سنتين, 3 to 10 سنوات, 11 and up سنة; 3 to 10 أقساط, 11 and up قسطاً */
  function yearsAr(y) { return y === 1 ? 'سنة واحدة' : y === 2 ? 'سنتين' : y + (y <= 10 ? ' سنوات' : ' سنة'); }
  function countAr(n) { return n + (n <= 10 ? ' أقساط' : ' قسطاً'); }
  /* "by a year" بسنة, but "by 6 months" بـ 6 شهور: a digit does not join the letter */
  function byAr(m) { var w = spanAr(m); return (/^[0-9]/.test(w) ? 'بـ ' : 'ب') + w; }

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
    if ((p.offer.drawingDiffers || []).indexOf(u.code) !== -1) return false;
    return true;
  }

  /* the unit's line: the first released line whose `match` takes it, by the rule the line page uses
     (js/lineflow.js inLine: the sheet's Type, and the floors when the line names them); and that line's
     offer (config offer.lines). Null: no line, so no offer (fail closed). */
  function lineOf(p, u) {
    var lines = (p && p.lines) || [], i, m, types;
    if (!u) return null;
    for (i = 0; i < lines.length; i++) {
      m = lines[i].match;
      if (!lines[i].released || !m) continue;
      types = (m.type || []).map(function (t) { return String(t).toLowerCase(); });
      if (types.indexOf(String(u.type || '').trim().toLowerCase()) === -1) continue;
      if (m.floors && m.floors.indexOf(u.fid) === -1) continue;
      return lines[i];
    }
    return null;
  }
  function lineOffer(p, u) {
    var l = lineOf(p, u), L = l && p.offer && p.offer.lines && p.offer.lines[l.id];
    return L && THEMES[L.brand] && KINDS[u.type] ? L : null;
  }

  /* where a building is on the master plan. The fit (config masterFromFloor) is measured on one floor's
     drawing, so a building is found through its cut on THAT floor (build 126); one with no cut there (HA,
     whose shops are on the street level) through the fit of its own floor (masterFits). Returns the master
     plan box of the unit's cut, in master pixels, or null: not found, so no picture and no document. */
  function onMaster(p, building, fid) {
    var O = p.offer || {}, R = O.masterFromFloor, box = (p.plates[building] || {})[fid];
    if (!R || !box) return null;
    var mb = (p.plates[building] || {})[R.floor || 'first'];
    if (!mb) { R = (O.masterFits || {})[fid]; mb = box; }
    if (!R) return null;
    return [R.s * mb[0] + R.tx, R.s * mb[1] + R.ty, R.s * mb[2] + R.tx, R.s * mb[3] + R.ty];
  }

  /* everything a unit's offer needs is there: in scope, its line and CI, its drawing, its outline, its place
     on the master plan. The button in the app and the document itself ask the same question. */
  function can(p, u) {
    if (!inScope(p, u) || !lineOffer(p, u)) return false;
    var a = (p.offer && p.offer.art) || {};
    return !!(a.plates && a.plates[u.building] && a.plates[u.building][u.fid] && a.floors && a.floors[u.fid] &&
      p.unitShapes && p.unitShapes[u.code] && onMaster(p, u.building, u.fid));
  }

  /* ---- the document ---------------------------------------------- */
  function offer(o) {
    var p = o.project, u = o.unit, plan = o.plan, art = o.art, P = o.plans;
    var when = o.date || new Date();
    var T = o.lang === 'ar' ? AR : EN, RTL = T.rtl, A = o.arabic;
    /* the SAMPLE stamp, pill and footer line: one switch with the post's (config `post.sample`, off since
       build 153) */
    var SAMPLE = !!(p && p.post && p.post.sample);

    /* fail closed: the UI prevents all of these, but this is the document a
       customer acts on, so it does not trust its caller */
    if (!u || !u.sellable) throw new Error('Unit ' + (u && u.code) + ' is not available, so it cannot be offered.');
    if (!inScope(p, u)) throw new Error('Unit ' + u.code + ' is outside what the offer covers today.');
    var L = lineOffer(p, u);
    if (!L) throw new Error('Unit ' + u.code + ' belongs to no line with an offer of its own. No document.');
    var C = THEMES[L.brand], K = KINDS[u.type];
    var applicable = P.applicable(p.plans, u.type, when).some(function (x) { return x.id === plan.id; });
    if (!applicable) throw new Error('The plan ' + plan.label + ' is not offered on this unit today.');
    /* build 155: the unit's own terms, its block's delivery date (js/plans.js termsFor) */
    var s = P.schedule({ listPrice: u.listPrice, discount: plan.discount || 0, plan: plan, terms: P.termsFor ? P.termsFor(p, u) : (p.terms || {}), from: when });
    if (!s || s.broken) throw new Error('The ' + plan.label + ' schedule does not foot: ' + (s && s.broken ? s.broken.join('; ') : 'no schedule'));
    var box = p.plates && p.plates[u.building] && p.plates[u.building][u.fid];
    var shape = p.unitShapes && p.unitShapes[u.code];
    if (!box || !shape || !art.plate || !art.plan) throw new Error('Unit ' + u.code + ' has no drawing yet, so no offer is made.');
    ['render', 'logoCover', 'logoPage', 'mainMarks', 'street', 'plaza', 'sky', 'roomA', 'roomB', 'master', 'map', 'morayLogo', 'morayWhite', 'mainMarksBlack'].forEach(function (k) {
      if (!art[k]) throw new Error('The offer artwork "' + k + '" is missing. No document.');
    });
    var mbox = onMaster(p, u.building, u.fid);
    if (!mbox) throw new Error('Building ' + u.building + ' cannot be found on the master plan. No document.');
    if (RTL && !A) throw new Error('An Arabic offer needs js/arabic.js.');
    var floorIdOf = o.floorId || function (f) { return String(f).toLowerCase(); };

    /* the line's CI */
    var PRIMARY = C.primary, ACCENT = C.accent, TEXT = C.text, BAR = C.bar, ACCENT_INK = C.accentInk;
    var GREY = C.grey, RULE = C.rule, PRIMARY_TINT = C.primaryTint, ACCENT_TINT = C.accentTint;

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
      title: L.name + ' — ' + K.en.toLowerCase() + ' ' + u.code + (SAMPLE ? (RTL ? ' (Arabic, SAMPLE)' : ' (SAMPLE)') : (RTL ? ' (Arabic)' : '')),
      subject: K.en + (SAMPLE ? ' offer, sample for review' : ' offer'), creator: 'Main Marks app'
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
      if (!SAMPLE) return;
      font('semi', 92);
      var t = T.stamp, ar = isAr(t), w = width(t) + (ar ? 0 : t.length * 6), a = 36 * Math.PI / 180;
      alpha(0.05, function () {
        ink(PRIMARY);
        put(t, W / 2 - Math.cos(a) * w / 2, H / 2 + Math.sin(a) * w / 2, { angle: 36, charSpace: 6, abs: true });
      });
    }
    function pill() {
      if (!SAMPLE) return;
      font('semi', isAr(T.pill) ? 8.2 : 7.2);
      var tw = width(T.pill) + (isAr(T.pill) ? 0 : T.pill.length * 0.9), pw = tw + 18, ph = 17, py = 28;
      fill(ACCENT);
      rrect(W - M - pw, py, pw, ph, 8.5, 'F');
      ink('#FFFFFF');
      /* the pill sits at the reading END of the header */
      put(T.pill, W - M - 9, py + 11.6, { align: 'right', charSpace: 0.9 });
    }
    /* the stack down the page's reading-end edge: the Wellness CI's template (p.10, p.14), and the same
       device in the line's own colours for the others */
    function edge() {
      var y0 = 0;
      C.edge.forEach(function (e) { fill(e[0]); rect(W - 9, y0, 9, H * e[1], 'F'); y0 += H * e[1]; });
    }
    /* the heading face: the CI's display serif, or its sans set a size smaller (a SemiBold sans at the
       serif's size reads as shouting) */
    function display(sz) { font(C.display, C.display === 'serif' ? sz : sz * 0.78); }
    /* a quote from the brochure: the serif, or the sans in its light weight */
    function quoteFace(sz) { font(C.display === 'serif' ? 'serif' : 'light', C.display === 'serif' ? sz : sz * 0.86); }
    /* BUILD 155: Main Marks' own footer (their offer design, 11 Nov 2026): MAIN MARKS at the reading start,
       MORAY in the middle, the line's name and the page at the end */
    var LN0 = lineOf(p, u), CD0 = LN0 && LN0.card;
    function footer(n, total) {
      var y = H - 30;
      stroke(TEXT, 0.6);
      line(M, y - 14, W - M, y - 14);
      if (CD0) {
        var fmw = 62, fmh = fmw * art.mainMarksBlack.h / art.mainMarksBlack.w;
        image(art.mainMarksBlack, mx(M, fmw), y - fmh + 1, fmw, fmh);
        var fow = 50, foh = fow * art.morayLogo.h / art.morayLogo.w;
        image(art.morayLogo, (W - fow) / 2, y - foh + 1, fow, foh);
        font('normal', 7.8);
        ink(TEXT);
        put(T.lineSub(CD0.sub) + '      ' + n + ' / ' + total, W - M, y, { align: 'right' });
      } else {
        font('normal', 7.5);
        ink(GREY);
        put(T.footer(u.code, K, L), M, y);
        put(n + ' / ' + total, W - M, y, { align: 'right' });
      }
      if (!SAMPLE) return;
      font('medium', 7.2);
      ink(ACCENT_INK);
      put(T.footerDemo, W / 2, y + 11, { align: 'center' });
    }
    /* BUILD 156 (Muhanad, 12 Nov 2026: "the pdf generated should not carry the logo in every page, it should be
       designed like it shows in the pdf provided in page 6"): in Main Marks' offer design only the cover and page 2
       carry a logo; pages 3 and 4 open on the title itself, with no small label over it. Pages 5 and 6 follow.
       Every page's content moves up by TOP with the title. */
    var TOP = CD0 ? 66 : 0;
    function head(kicker, title, sub) {
      fill('#FFFFFF');
      doc.rect(0, 0, W, H, 'F');
      if (CD0) {
        pill();
        display(30);
        ink(PRIMARY);
        put(title, M, 128 - TOP);
        if (sub) { font('normal', 10.5); ink(GREY); put(sub, M, 148 - TOP); }
        return;
      }
      edge();
      var lw = C.logoW, lh = lw * art.logoPage.h / art.logoPage.w;
      image(art.logoPage, mx(M, lw), 27 + Math.max(0, (20 - lh) / 2), lw, lh);
      pill();
      caps(kicker, M, 96, 8, ACCENT_INK);
      display(30);
      ink(PRIMARY);
      put(title, M, 128);
      if (sub) { font('normal', 10.5); ink(GREY); put(sub, M, 148); }
    }

    var TOTAL = 6;
    var bw = box[2] - box[0], bh = box[3] - box[1];

    /* ============ 1. cover ============ */
    /* BUILD 155: MAIN MARKS' OWN COVER (their offer design of 11 Nov 2026, "we will use the new design for each
       unit type"): the line's picture on the top half, its logo and its name centred over it; under it a panel
       in the line's colour (its card's, config `card`) with the unit, its place and size, and the date; at the
       foot MAIN MARKS, MORAY and 1ST MARK / NEW CAIRO.
       BUILD 156, as their page 6 draws it: the logo across two thirds of the page with the line's name set to
       its width under it, no dark band (a fade from the top keeps them readable), and on the commercial cover
       the brand book's "Same place / One Address" in cream on the maroon (config offer.lines.commercial.script,
       Moray Commercial Guidelines p.12), the unit lower down under it. */
    if (CD0) {
      var PHT = 404, light = CD0.ink === '#000000', inkC = CD0.ink;
      fill(CD0.ground);
      doc.rect(0, 0, W, H, 'F');
      /* build 181: a card that frames its photo (config card.frame.inset, Wellness) gets the same frame on the cover,
         at the card's zoom: the frame's ground, the photo its whole height (`coverPhotoW` wide per unit of height,
         as measured on the card) at the card's object-position, and the card's right-hand bars beside it, at the
         card's share of the width. Drawn at physical positions, as the card is in both languages. */
      var FR = CD0.frame && CD0.frame.inset && typeof art.coverPhotoW === 'number' ? CD0.frame : null;
      if (FR) {
        var frBars = CD0.bars && CD0.bars.right, frBw = frBars ? W * parseFloat((CD0.barWidth && CD0.barWidth.right) || '6') / 100 : 0;
        var frPw = Math.min(W - frBw, PHT * art.coverPhotoW), frPx = W - frBw - frPw;
        var frPos = String(FR.position || '50% 50%').split(/\s+/).map(function (v) { return parseFloat(v) / 100; });
        doc.setFillColor(FR.ground || '#FFFFFF'); doc.rect(0, 0, W, PHT, 'F');
        cover(art.render, frPx, 0, frPw, PHT, frPos[0], frPos[1]);
        if (frBars) {
          var frStops = Array.isArray(frBars) ? frBars : [[frBars, 100]], frFrom = 0;
          frStops.forEach(function (s) {
            doc.setFillColor(s[0]); doc.rect(W - frBw, PHT * frFrom / 100, frBw, PHT * (s[1] - frFrom) / 100, 'F');
            frFrom = s[1];
          });
        }
      } else cover(art.render, 0, 0, W, PHT, 0.5, typeof art.coverFy === 'number' ? art.coverFy : 0.45);
      /* BUILD 177 (Muhanad, 19 Nov 2026, on the Wellness cover: "the logo ... could be placed better ... where i
         show in the arrow and the text left and right can go down, this will fix the huge empty space, make it
         more like the front page of the commercial unit pdf ... in all the front pages for all types except the
         commercial"): every line but commercial (the one with `art.script`) carries its logo and name IN THE
         PANEL, where commercial has its script, and the unit and date sit low as on commercial. The picture is
         left clean (no logo, no fade). Commercial is unchanged. */
      var logoOnPicture = !!art.script;
      /* the logo and the line's name read on any picture: black fading out down the top of the picture */
      if (logoOnPicture) for (var vs = 0; vs < 14; vs++) {
        alpha(0.34 * (1 - vs / 14), function () { fill('#000000'); doc.rect(0, vs * 15, W, 15, 'F'); });
      }
      /* the template bars over the fade, in their own colours (build 157: `coverBars` where the card's
         own bars are its mock's frame, not the cover's) */
      var CB = FR ? null : (CD0.coverBars || CD0.bars);   /* build 181: a framed cover carries the card's own bars */
      if (CB && CB.left) { fill(CB.left); rect(0, 0, 18, PHT, 'F'); }
      if (CB && CB.right) { fill(CB.right); rect(W - 18, 0, 18, PHT, 'F'); }
      /* in the panel the logo takes the panel's own ink: the white logo on a dark panel (Wellness' orange), the
         dark one (`logoPage`) on a light panel (Offices' orange, The Fourth's white), as the unit's name does */
      var clogo = (logoOnPicture || !light) ? art.logoCover : art.logoPage;
      var cvw = 400, cvh = cvw * clogo.h / clogo.w;
      if (logoOnPicture && cvh > 72) { cvh = 72; cvw = cvh * clogo.w / clogo.h; }
      var csub = isAr(T.lineSub(CD0.sub)) ? T.lineSub(CD0.sub) : String(CD0.sub).toUpperCase();
      font('light', 20);
      var csz = Math.min(isAr(csub) ? 17 : 28, 20 * Math.max(cvw, 300) * 0.93 / (width(csub) + csub.length * 1.5));
      /* BUILD 178 (Muhanad, 19 Nov 2026: "big font small font ... it should all be unified exactly like the
         commercial pdf", his pick "logo in panel, Commercial sizes"): in the panel EVERY lockup is drawn at the
         width of commercial's MORAY logo (400), so MORAY / FOURTH read at one size on every cover (177 capped the
         height at 72, which made Offices' MORAY 400 wide and Wellness / The Fourth 210-250); and the line's name is
         commercial's size (28, Arabic 17) on every line, smaller only if it would run past the page's margins.
         On the picture (commercial) nothing changes. */
      if (!logoOnPicture) csz = Math.min(isAr(csub) ? 17 : 28, 20 * (W - 2 * (M + 10)) / (width(csub) + csub.length * 1.5));
      /* BUILD 179 (Muhanad, 19 Nov 2026: "make sure all the logos and their size and the other details in all the
         first pages are in the same size and the same placement"): in the panel every logo is FITTED INTO ONE BOX
         (400 wide x 100 high, at PHT+56) and centred in it, so each fills the box as far as its shape allows and
         all sit in the same place; the line's name has ONE baseline (PHT+196) on every cover. (178 drew them all
         400 wide, so The Fourth stood 138 high against Offices' 59.) On the picture (commercial) nothing changes. */
      var BOXW = 400, BOXH = 100, BOXY = PHT + 56, cly, nameY;
      if (logoOnPicture) { cly = 44; nameY = cly + cvh + 12 + csz; }
      else {
        var fit = Math.min(BOXW / clogo.w, BOXH / clogo.h);
        cvw = clogo.w * fit; cvh = clogo.h * fit;
        cly = BOXY + (BOXH - cvh) / 2;
        nameY = BOXY + BOXH + 40;
      }
      image(clogo, (W - cvw) / 2, cly, cvw, cvh);
      font('light', csz);
      ink(logoOnPicture ? '#FFFFFF' : inkC);
      put(csub, W / 2, nameY, { align: 'center', charSpace: 1.5 });

      /* the unit and the date: low in the panel, as on commercial, on every cover */
      var uy0 = PHT + 300;
      if (art.script) {
        var scw = 430, sch = scw * art.script.h / art.script.w;
        image(art.script, (W - scw) / 2, PHT + 34, scw, sch);
      }
      ink(inkC);
      font('normal', 34);
      put(T.unit(K, u.code), M + 10, uy0);
      font('light', 11);
      put([bName, T.floorPhrase(fid, floorWord), T.area(u.area)].join('   ·   '), M + 10, uy0 + 24);
      /* build 178: the date in the same size and weight as the details beside it on the same line (it was 9.5
         against 11: "big font small font"); on every cover, commercial too */
      put(T.longDate(when), W - M - 10, uy0 + 24, { align: 'right' });

      /* the foot: MAIN MARKS, MORAY, 1ST MARK / NEW CAIRO (brand lockups: Latin in both languages) */
      alpha(0.6, function () { stroke(inkC, 0.6); line(M + 10, H - 78, W - M - 10, H - 78); });
      var cmm = light ? art.mainMarksBlack : art.mainMarks, cmo = light ? art.morayLogo : art.morayWhite;
      var cmw = 92, cmh = cmw * cmm.h / cmm.w;
      image(cmm, mx(M + 10, cmw), H - 50 - cmh / 2, cmw, cmh);
      var cow = 74, coh = cow * cmo.h / cmo.w;
      image(cmo, (W - cow) / 2, H - 50 - coh / 2, cow, coh);
      font('medium', 8);
      ink(inkC);
      put('1ST MARK /', W - M - 10, H - 53, { align: 'right', charSpace: 0.6 });
      put('NEW CAIRO', W - M - 10, H - 42, { align: 'right', charSpace: 0.6 });
      pill();
      stamp();
    } else {
    fill(PRIMARY);
    doc.rect(0, 0, W, H, 'F');
    var heroH = 440;
    cover(art.render, 0, 0, W, heroH, 0.5, C.cover === 'fourth' ? 0.4 : 0.55);
    if (C.cover === 'wellness') {
      /* the template bars: orange at the reading start with a charcoal foot,
         the blue stack at the reading end, as the CI places a render (p.10, p.14) */
      fill(BAR); rect(0, 120, 22, 330, 'F');
      fill(TEXT); rect(0, 450, 22, 70, 'F');
      fill(C.edge[0][0]); rect(W - 22, 60, 22, 130, 'F');
      fill(C.edge[1][0]); rect(W - 22, 190, 22, 130, 'F');
      fill(PRIMARY); rect(W - 22, 320, 22, 130, 'F');
    } else if (C.cover === 'moray') {
      /* Moray's orange at the reading start, run down past the picture into the ground (CI p.50) */
      fill(BAR); rect(0, 120, 22, 330, 'F');
      fill(TEXT); rect(0, 450, 22, 70, 'F');
    } else {
      /* The Fourth's line: run edge to edge under the picture and ended in the red squares (CI p.19, p.30) */
      stroke(C.onPrimary, 1.4);
      line(0, heroH, W, heroH);
      fill(ACCENT); rect(0, heroH - 4.5, 9, 9, 'F'); rect(W - 9, heroH - 4.5, 9, 9, 'F');
    }

    /* the logo is Latin artwork in both languages: placed, never mirrored */
    var lw0 = C.cover === 'fourth' ? 210 : 230, lh0 = lw0 * art.logoCover.h / art.logoCover.w;
    image(art.logoCover, mx(M + 10, lw0), heroH + 34, lw0, lh0);
    caps(T.unitOffer(K), M + 10, heroH + 148, 8.5, C.coverKicker);
    display(44);
    ink('#FFFFFF');
    put(T.unit(K, u.code), M + 10, heroH + 192);
    font('light', 12.5);
    ink(C.onPrimary);
    put([bName, T.floorPhrase(fid, floorWord), T.area(u.area)].join('   ·   '), M + 10, heroH + 216);

    var fy = heroH + 262;
    caps(T.date, M + 10, fy, 6.8, C.coverCaps, { weight: 'medium' });
    font('medium', 11);
    ink('#FFFFFF');
    put(T.longDate(when), M + 10, fy + 19);
    stroke(C.coverRule, 0.7);
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
    }

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
      caps(title, x, y, 7, PRIMARY);
      source(src, x, y + 11);
    }

    /* ============ 2. the project: Moray ============ */
    /* BUILD 155: MAIN MARKS' OWN PAGE (their design notes of 11 Nov 2026): MORAY centred with "Mixed use" under
       it, a row between two rules (1ST MARK / NEW CAIRO and NORTH 90), their day render across the page, the
       brochure's three figures, and their map of where Moray is. */
    doc.addPage();
    fill('#FFFFFF');
    doc.rect(0, 0, W, H, 'F');
    pill();
    var PW = W - 2 * M;
    /* build 156: as their page 6 draws it, MORAY alone and larger (no "Mixed use"), and no source lines */
    var mlw = 216, mlh = mlw * art.morayLogo.h / art.morayLogo.w;
    image(art.morayLogo, (W - mlw) / 2, 30, mlw, mlh);
    var ry = 30 + mlh + 34;
    stroke(TEXT, 0.8);
    line(M, ry, W - M, ry);
    line(M, ry + 46, W - M, ry + 46);
    font('medium', 10.5);
    ink(TEXT);
    put(T.mark1, M, ry + 19);
    put(T.mark2, M, ry + 34);
    put(T.northSt, W - M, ry + 27, { align: 'right' });
    var ry2 = ry + 62, rh = 232;
    cover(art.street, M, ry2, PW, rh, 0.5, 0.62);
    if (!CD0) source(T.renderSrcDay, M, ry2 + rh + 12);

    /* the brochure's own figures, as it states them (PDF p.14) */
    var facts0 = O.facts || [];
    var fy0 = ry2 + rh + 52;
    if (facts0.length) {
      var fw = PW / facts0.length;
      stroke(RULE, 0.6);
      line(M, fy0 - 18, M + PW, fy0 - 18);
      facts0.forEach(function (f, i) {
        var x = M + i * fw;
        if (i) { stroke(RULE, 0.6); line(x - 8, fy0 - 6, x - 8, fy0 + 46); }
        /* Instrument Serif has NO "²" (U+00B2): set in it, "70,000 m²" printed
           "70,000 m" with no error (build 79). The figure takes the serif,
           the unit the body face, which has it (playbook 01, Phase 4, 1b) */
        var mu = /^(.*?)\s+(m²)$/.exec(f.big);
        display(27);
        ink(PRIMARY);
        put(mu ? mu[1] : f.big, x, fy0 + 14);
        if (mu) {
          var nw = width(mu[1]);
          font('light', 15);
          put(RTL ? 'م²' : mu[2], x + nw + 4, fy0 + 14);
        }
        font('normal', 8.2);
        ink(TEXT);
        wrap(T.factSmall(f), fw - 22).forEach(function (ln, k) { put(ln, x, fy0 + 31 + k * 10.5); });
      });
      stroke(RULE, 0.6);
      line(M, fy0 + 58, M + PW, fy0 + 58);
    }

    /* the map, to the foot of the page */
    var my0 = fy0 + 74, mh0 = Math.min(PW * art.map.h / art.map.w, H - 72 - my0);
    cover(art.map, M, my0, PW, mh0, 0.5, 0.5);
    if (!CD0) source(T.mapSrc + '  ' + T.src(O.factsPage) + '.', M, my0 + mh0 + 12);
    footer(2, TOTAL);
    stamp();

    /* ============ 3. your building ============ */
    doc.addPage();
    head(T.yourBuilding, bName, T.buildingSub(K, L));
    /* the master plan (PDF p.17), the building lit, the rest veiled. Its cut
       is found on the master plan through the measured fit (onMaster: config
       masterFromFloor, or masterFits), never placed by eye. The plan is not
       mirrored: only where it sits on the page is. */
    /* build 155: as Main Marks' offer design lays it out: the master plan large, its facts under it */
    var mpw = 404, mph = mpw * art.master.h / art.master.w, mpy = 168 - (TOP ? TOP - 18 : 0), mpx = mx(M, mpw);
    image(art.master, mpx, mpy, mpw, mph);
    var ms = mpw / art.master.w;
    var ex0 = mpx + mbox[0] * ms, ey0 = mpy + mbox[1] * ms;
    var ex1 = mpx + mbox[2] * ms, ey1 = mpy + mbox[3] * ms;
    alpha(0.62, function () {
      fill('#FFFFFF');
      doc.rect(mpx, mpy, mpw, ey0 - mpy, 'F');
      doc.rect(mpx, ey1, mpw, mpy + mph - ey1, 'F');
      doc.rect(mpx, ey0, ex0 - mpx, ey1 - ey0, 'F');
      doc.rect(ex1, ey0, mpx + mpw - ex1, ey1 - ey0, 'F');
    });
    stroke(ACCENT, 2.2);
    doc.rect(ex0, ey0, ex1 - ex0, ey1 - ey0, 'S');
    /* the building's tag, above it */
    var tag = T.tag(bName);
    font('semi', isAr(tag) ? 8 : 7);
    var tgw = width(tag) + (isAr(tag) ? 0 : tag.length * 0.8) + 12;
    fill(ACCENT);
    doc.rect(ex0 + (ex1 - ex0) / 2 - tgw / 2, ey0 - 17, tgw, 13, 'F');
    ink('#FFFFFF');
    put(tag, ex0 + (ex1 - ex0) / 2, ey0 - 8, { align: 'center', charSpace: 0.8, abs: true });
    if (!CD0) source(T.masterSrc(17), M, mpy + mph + 12);   /* build 156: their design has no source lines */

    /* beside it: the building in facts from the sheet */
    var bx = M + 14, bwid = 280, by = mpy + mph + 34;
    var rowsB = (o.buildingRows || []).filter(function (r) { return r.type === u.type; });
    var floorsB = [];
    rowsB.forEach(function (r) { var k = floorIdOf(r.floor); if (floorsB.indexOf(k) === -1) floorsB.push(k); });
    var ORDER = ['street', 'ground', 'first', 'second', 'third', 'fourth', 'fifth'];
    floorsB.sort(function (a, c) { return ORDER.indexOf(a) - ORDER.indexOf(c); });
    var floorNames = floorsB.map(function (k) {
      var raw = (rowsB.filter(function (r) { return floorIdOf(r.floor) === k; })[0] || {}).floor || k;
      return T.floor(k, String(raw).replace(/^\w/, function (c) { return c.toUpperCase(); }));
    });
    var bfacts = [[T.fLine, RTL ? L.nameAr : L.name], [T.fUse, T.uses(K)]];   /* the building is the title (build 155) */
    if (floorNames.length) bfacts.push([T.fUnitFloors(K), T.floorList(floorNames)]);
    bfacts.push([T.fYourUnit(K), T.yourUnitVal(u.code, T.floorLower(fid, floorWord))]);
    bfacts.forEach(function (f, i) {
      var yy = by + i * 40;
      label(f[0], bx, yy + 10);
      font('semi', 12.5);
      ink(PRIMARY);
      put(f[1], bx, yy + 27);
      if (i < bfacts.length - 1) { stroke(RULE, 0.5); line(bx, yy + 37, bx + bwid, yy + 37); }
    });
    font('normal', 8.2);
    ink(TEXT);
    /* build 155: no note, no pictures and no quote here: Main Marks' offer design keeps this page to the plan and its facts */
    footer(3, TOTAL);
    stamp();

    /* ============ 4. your unit ============ */
    doc.addPage();
    head(T.yourUnit(K), T.unit(K, u.code), T.unitSub(bName, T.floorPhrase(fid, floorWord), L));

    /* the drawing: the building's floor, the unit in the accent. The sharp
       piece covers EXACTLY the cut, so the traced outline lands on it in the
       brochure's own pixels (config plates / unitShapes / plateImgs). The
       drawing is never mirrored; only its place on the page is.
       A TALL cut (most blocks) stands at the reading start with the facts
       beside it, no wider than 310 pt so the facts keep their column; a WIDE
       one (the street level under HA) runs across the page, the facts under
       it in three columns. The drawing's region is 570 pt tall either way. */
    var dy0 = 172 - (TOP ? TOP - 18 : 0), REG = 570, tall = bw / bh <= 0.8, dh, dw;
    if (tall) { dh = REG; dw = dh * bw / bh; if (dw > 310) { dw = 310; dh = dw * bh / bw; } }
    else { dw = W - 2 * M - 12; dh = dw * bh / bw; if (dh > 330) { dh = 330; dw = dh * bw / bh; } }
    var dx0 = mx(M, dw);
    image(art.plate, dx0, dy0, dw, dh);
    stroke(RULE, 0.8);
    doc.rect(dx0, dy0, dw, dh, 'S');
    var pts = shape.map(function (q) { return [dx0 + (q[0] - box[0]) / bw * dw, dy0 + (q[1] - box[1]) / bh * dh]; });
    alpha(0.38, function () { fill(ACCENT); poly(pts, 'F'); });
    stroke(ACCENT, 1.8);
    poly(pts, 'S');
    /* a key, not a leader line: a line from the clinic crossed the
       corridor and the next unit's printed area (build 78) */
    var rx = tall ? M + dw + 30 : M, rw = W - M - 12 - rx, k0 = tall ? dy0 : dy0 + dh + 16;
    alpha(0.38, function () { fill(ACCENT); rect(rx, k0 + 2, 16, 11, 'F'); });
    stroke(ACCENT, 1.4);
    rect(rx, k0 + 2, 16, 11, 'S');
    font('medium', 9);
    ink(TEXT);
    put(T.thisUnit(K, u.code), rx + 24, k0 + 10.5);

    var facts = [
      [T.fUnitCode, u.code], [T.fUse, T.unitWord(K)], [T.fFloor, T.floor(fid, floorWord)],
      [T.fArea, T.area(u.area)], [T.fList, T.egp(u.listPrice)],
      [T.fPerM, T.egp(u.listPrice / u.area)]
    ];
    /* tall: one column, the key plan under it; wide: two columns, the key plan beside them */
    var fy2 = k0 + 34, per = tall ? 1 : 2, fcw = (tall ? rw : rw * 0.56) / per;
    facts.forEach(function (f, i) {
      var fx = rx + (i % per) * fcw, yy = fy2 + Math.floor(i / per) * 40;
      label(f[0], fx, yy + 10);
      font('semi', 12.5);
      ink(PRIMARY);
      put(f[1], fx, yy + 27);
      if (i < facts.length - per) { stroke(RULE, 0.5); line(fx, yy + 35, fx + fcw - (tall ? 0 : 14), yy + 35); }
    });

    /* the key plan: where this wing sits on the whole floor (never mirrored) */
    var kx0 = tall ? rx : rx + rw * 0.6, kr = tall ? rw : rw * 0.4;
    var ky = tall ? fy2 + facts.length * 40 + 22 : fy2 + 8;
    label(T.onFloor(T.floorLower(fid, floorWord)), kx0, ky);
    var kw = kr, kh = kw * art.plan.h / art.plan.w;
    if (ky + 8 + kh > dy0 + REG) { kh = dy0 + REG - ky - 8; kw = kh * art.plan.w / art.plan.h; }
    var kx = mx(kx0, kw);
    image(art.plan, kx, ky + 8, kw, kh);
    var ksx = kw / art.plan.w, ksy = kh / art.plan.h;
    stroke(ACCENT, 1.6);
    doc.rect(kx + box[0] * ksx, ky + 8 + box[1] * ksy, bw * ksx, bh * ksy, 'S');
    var ux = shape.reduce(function (a, q) { return a + q[0]; }, 0) / shape.length;
    var uy = shape.reduce(function (a, q) { return a + q[1]; }, 0) / shape.length;
    fill(ACCENT);
    doc.circle(kx + ux * ksx, ky + 8 + uy * ksy, 2.4, 'F');

    /* 2026-11-03: the floor drawing and the building cut are Main Marks' original plans (no brochure
       page, no sharpened copy any more) */
    if (!CD0) source(T.drawingsSrc(T.floorPhrase(fid, floorWord)), M, dy0 + REG + 14);
    footer(4, TOTAL);
    stamp();

    /* ============ 5. the plan ============ */
    doc.addPage();
    head(T.paymentPlan, T.planLabel(plan), T.group(plan.until ? T.longDate(new Date(plan.until + 'T12:00:00')) : null));
    /* the second part of a split down payment (config plans: a `down` milestone), its own line and row */
    var down2 = s.rows.filter(function (r) { return r.kind === 'milestone' && r.down; })[0] || null;
    var cards = s.cash
      ? [[T.cPayable, T.egp(s.payable), T.cOff(pct(s.discountPct), T.egp(s.discountBase || s.list))],
         [T.cPaid, T.cOnce, T.shortDate(s.rows[0].due)]]
      : [[s.discount ? T.cPayable : T.cPrice, T.egp(s.payable), s.discount ? T.cOff(pct(s.discountPct), T.egp(s.discountBase || s.list)) : T.cNoDiscount],
         [T.cDown, T.egp(s.down), down2 ? T.cPlusLater(T.egp(down2.amount)) : s.down ? T.cOnSigning : T.cNothing],
         [T.cEvery, T.egp(s.each), T.cOver(s.count, s.years)]];
    var cgap = 10, cwid = (W - 2 * M - 12 - (cards.length - 1) * cgap) / cards.length, cy0 = 170 - (TOP ? TOP - 18 : 0);
    cards.forEach(function (c, i) {
      var x = M + i * (cwid + cgap);
      fill(i === 0 ? PRIMARY : '#FFFFFF');
      stroke(i === 0 ? PRIMARY : RULE, 0.8);
      rrect(x, cy0, cwid, 82, 8, 'FD');
      caps(c[0], x + 14, cy0 + 22, 6.6, i === 0 ? C.onPrimaryCaps : GREY, { weight: 'medium' });
      font('semi', 15);
      ink(i === 0 ? '#FFFFFF' : PRIMARY);
      put(c[1], x + 14, cy0 + 48);
      font('normal', 8);
      ink(i === 0 ? C.onPrimary : GREY);
      put(c[2], x + 14, cy0 + 66);
    });

    var RX = W - M - 12, ly = cy0 + 120;
    function row(l, subText, v, opts) {
      opts = opts || {};
      var tall = (subText ? 12.5 : 0) + 29;
      if (opts.highlight) {
        fill(ACCENT_TINT);
        rrect(M - 10, ly - 17, RX - M + 20, tall, 7, 'F');
        fill(ACCENT);
        rect(M - 10, ly - 17, 3.5, tall, 'F');
      }
      font(opts.bold || opts.highlight ? 'semi' : 'normal', opts.highlight ? 11.5 : opts.bold ? 11 : 10);
      ink(opts.colour || TEXT);
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
    function section(text) { caps(text, M, ly - 8, 7.2, PRIMARY); ly += 12; }

    section(T.sPrice);
    row(T.list, null, T.egp(s.list));
    if (s.discount) row(T.discount, T.discountSub(pct(s.discountPct), !!plan.until, s.discountOn === 'afterDown'),
      T.minus(s.discount), { highlight: true, colour: ACCENT_INK });
    row(s.discount ? T.payable : T.price, null, T.egp(s.payable), { bold: true, colour: PRIMARY });

    ly += 8;
    section(T.sHow);
    if (s.cash) {
      row(T.paidFull, T.shortDate(s.rows[0].due), T.egp(s.payable));
    } else {
      var inst = s.rows.filter(function (r) { return r.kind === 'instalment'; });
      if (s.down) row(T.downRow, T.downSub(pct(plan.down), s.downOn === 'list', T.shortDate(s.rows[0].due)), T.egp(s.down));
      if (down2) row(T.down2Row, T.downSub(pct(down2.pct), s.downOn === 'list', T.shortDate(down2.due)), T.egp(down2.amount));
      row(T.instRow(s.count),
        T.instSub(T.shortDate(inst[0].due), T.shortDate(inst[inst.length - 1].due), s.lastInstalment !== s.each ? T.egp(s.lastInstalment) : ''),
        T.each(T.egp(s.each)));
    }
    row(T.planTotal, null, T.egp(s.payable), { bold: true, colour: PRIMARY });

    /* build 153: the maintenance deposit and delivery, when the terms state both (and the deposit falls
       before delivery); otherwise what is not stated is said to be unstated, with no figure */
    var MD = s.maintenance && s.delivery && s.maintenance.months < s.deliveryMonths ? s.maintenance : null;
    /* build 155 (Main Marks, 11 Nov 2026): "Maintenance fees should not appear in the sales offer", and
       delivery is by building. With no maintenance in the terms, only the delivery is said: its date, or
       that it is to be confirmed when the unit's block has none. */
    var NOMAINT = !(p.terms && p.terms.maintenance);
    ly += 8;
    if (MD) {
      section(T.sAlso);
      row(T.maint, T.maintDue(pct(MD.pct), MD.on === 'list', T.shortDate(MD.due), s.deliveryMonths - MD.months), T.egp(MD.amount));
      row(T.delivery, T.deliveryAfter(s.deliveryMonths), T.shortDate(s.delivery));
      row(T.totalAll, null, T.egp(s.payable + MD.amount), { bold: true, colour: PRIMARY });
    } else if (NOMAINT) {
      section(T.sDelivery);
      if (s.delivery) row(T.delivery, T.deliveryAfter(s.deliveryMonths), T.shortDate(s.delivery));
      else row(T.delivery, T.deliverySub, T.tbc, { muted: true });
    } else {
      section(T.sNotYet);
      row(T.maint, T.maintSub, T.tbc, { muted: true });
      row(T.delivery, T.deliverySub, T.tbc, { muted: true });
    }

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
      fill(PRIMARY_TINT);
      rrect(M - 10, ly - 12, RX - M + 20, nh, 7, 'F');
      caps(T.assumed, M, ly + 2, 6.8, PRIMARY);
      font('normal', 8.2);
      ink(TEXT);
      notes.forEach(function (n, i) { put('·  ' + T.assume(n), M, ly + 17 + i * 12); });
    }
    footer(5, TOTAL);
    stamp();

    /* ============ 6. schedule: the Ayyam payment sheet ============ */
    doc.addPage();
    head(T.schedule, T.scheduleTitle);
    font('normal', 9);
    ink(GREY);
    wrap(T.scheduleSub(T.longDate(when), s.cash, MD ? s.deliveryMonths - MD.months : NOMAINT ? null : undefined), W - 2 * M - 12)
      .forEach(function (ln, i) { put(ln, M, 150 - TOP + i * 12); });

    /* a 0% down plan has no down payment to list: no zero row on the sheet */
    var items = s.rows.filter(function (r) { return r.amount > 0; }).map(function (r) {
      return { what: r.kind === 'down' ? (s.cash ? T.rowCash : T.rowDown) : r.kind === 'milestone' ? (r.down ? T.rowDown2 : r.label) : T.rowInst(r.no, s.count),
               due: r.due, months: r.months, amount: r.amount };
    });
    /* the maintenance deposit on its own date, after the payments of that date */
    if (MD) {
      var at = items.length;
      while (at > 0 && items[at - 1].months > MD.months) at--;
      items.splice(at, 0, { what: T.rowMaint, due: MD.due, months: MD.months, amount: MD.amount });
    }

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
    var TW = W - 2 * M - 12, ty0 = 186 - TOP, hh = 22, rh = 15.4, PAD = 7, FIT = 34, GAP = 14;
    var YEAR_FILL = C.years;
    var YEAR_RULE = C.yearRule;
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
      fill(PRIMARY);
      doc.rect(bx2, ty0, tw, hh, 'F');
      font('semi', hs);
      ink('#FFFFFF');
      cols.forEach(function (col, ci) { cell(HEAD[col.k], x0, ci, ty0, hh, hs); });
      list.forEach(function (it, i) {
        var top = bodyTop + i * rh;
        if (it.start) { fill(YEAR_FILL[(it.year - 1) % 2]); doc.rect(bx2, top, tw, rh, 'F'); }
        var weight = it.start ? 'semi' : 'normal';
        cols.forEach(function (col, ci) {
          if (col.k === 'year') { if (!it.start) return; font('semi', bs); ink(PRIMARY); }
          else if (col.k === 'amt') { font(it.start ? 'semi' : 'medium', bs); ink(PRIMARY); }
          else { font(weight, bs); ink(TEXT); }
          cell(textOf(it, col.k), x0, ci, top, rh, bs);
        });
        running += it.amount;
      });
      /* rules after the fills: verticals and thin row rules, then the year
         rules on top. A shorter second table keeps its empty ruled rows. */
      stroke(C.tableRule, 0.45);
      var vx = x0;
      for (var ci = 0; ci < cols.length - 1; ci++) { vx += cols[ci].w; doc.line(px(vx), bodyTop, px(vx), totalTop); }
      for (var r = 1; r < per; r++) {
        if (list[r] && list[r].start) continue;
        doc.line(bx2, bodyTop + r * rh, bx2 + tw, bodyTop + r * rh);
      }
      stroke(YEAR_RULE, 1.1);
      list.forEach(function (it, i) { if (it.start && i > 0) doc.line(bx2, bodyTop + i * rh, bx2 + tw, bodyTop + i * rh); });
      stroke(C.tableBorder, 0.8);
      doc.rect(bx2, ty0, tw, totalTop - ty0, 'S');
    });

    /* the table RE-ADDED, not s.payable restated: a copied total would print
       even if the rows did not add up */
    var owed = s.payable + (MD ? MD.amount : 0);
    if (running !== owed) throw new Error('The schedule adds to ' + running + ', not ' + owed + '. No document.');
    fill(C.totalFill);
    rect(M, totalTop, TW, hh, 'F');
    font('semi', RTL ? 10 : 9.5);
    ink(PRIMARY);
    put(MD ? T.totalAll : T.planTotal, M + PAD + 1, totalTop + hh / 2 + 3.4);
    put(T.egp(running), M + TW - PAD - 1, totalTop + hh / 2 + 3.4, { align: 'right' });
    stroke(C.tableBorder, 0.8);
    rect(M, totalTop, TW, hh, 'S');
    stroke(PRIMARY, 1.1);
    line(M, totalTop, M + TW, totalTop);
    font('normal', RTL ? 9 : 8.5);
    ink(GREY);
    put(MD || (NOMAINT && s.delivery) ? T.deliveryLine(T.shortDate(s.delivery), s.deliveryMonths) : NOMAINT ? T.deliveryTbc : T.plusMaint, M, totalTop + hh + 18);
    footer(6, TOTAL);
    stamp();

    undo();
    return doc;
  }

  /* the artwork an offer needs, so the caller can fetch it all in one batch */
  function artwork(p, u) {
    var a = (p.offer && p.offer.art) || {}, L = lineOffer(p, u) || { rooms: { a: {}, b: {} } };
    return {
      render: L.cover, logoCover: L.logoCover, logoPage: L.logoPage, mainMarks: a.mainMarks,
      plate: a.plates && a.plates[u.building] && a.plates[u.building][u.fid],
      plan: a.floors && a.floors[u.fid],
      street: a.street, plaza: a.plaza, sky: a.sky, roomA: L.rooms.a.img, roomB: L.rooms.b.img, master: a.master,
      map: a.map, morayLogo: a.morayLogo, morayWhite: a.morayWhite, mainMarksBlack: a.mainMarksBlack,
      script: L.script,  /* build 156: optional, the commercial cover's "Same place / One Address" */
      coverFy: L.coverFy, /* build 179: which part of the cover photo shows (0 top, 1 bottom); default 0.45 */
      coverPhotoW: L.coverPhotoW /* build 181: a framed cover (card.frame): the photo's width per unit of height */
    };
  }

  var api = { offer: offer, artwork: artwork, inScope: inScope, can: can, lineOf: lineOf, lineOffer: lineOffer, onMaster: onMaster, themes: THEMES, disarm: disarm };
  if (typeof module === 'object' && module.exports) module.exports = api;
  else { root.MM = root.MM || {}; root.MM.pdf = api; }
}(typeof window !== 'undefined' ? window : globalThis));
