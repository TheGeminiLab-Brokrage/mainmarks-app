/* BUILD 186 (designed as try-out 186): the guided tour of My activity.
   Muhanad, 2026-11-19: "a complete walkthrough ... how can it benefit him ... short, just to the point";
   round 7: "make him understand the active, gone quiet, inactive, never asked ... how to record the
   orientations, the plus circle ... and the profile button"; round 8: "the animation in the tutorial should be
   slower and more smooth ... understand it to write the correct walk through and what is important to show".

   WHAT THE TOUR TEACHES, IN HIS ORDER OF IMPORTANCE (from the app's code and his own rules):
   1. How the page fills: most of it counts by itself. Every offer sent from Quick Offer asks "Who is this offer
      for?": Special request (a broker asked; counted for that company) or General broadcast (groups; counted
      on today's target). lineflow.js "Before you send".
   2. His results: the dates, his sales first (a split deal counts half), his special requests and the pace.
   3. His companies, the headline: N of TOTAL asked him; the four groups by the app's own rule (stateAt: a
      request in the last 14 days = active, then 14 days of silence = gone quiet, a month = inactive, none =
      never asked) and what each group asks of him; tap a group for the names.
   4. His day: at least 3 offers a day to all companies as a broadcast (one offer sent in rounds counts once).
   5. Requests to contracts.
   6. What he records with +: visits and deals (orientation, workshop, meeting, reservation, contract). The
      tour opens the real form on Orientation and lights it; it never types, never saves. A mistake is taken
      back the same day; after that his manager corrects it.
   7. Profile: the words explained.

   MOTION (round 8): one move per step. The note fades out, the page and the lit box glide TOGETHER to the next
   card in one eased movement (0.8 to 1.1 s, drawn frame by frame, so the box never lags the page), then the
   note fades in beside it. The finger on the graph drags slowly (2.8 s). Less motion asked: no glide. */
(function () {
  'use strict';
  function $(s) { return document.querySelector(s); }
  function txt(s) { var e = $(s); return e ? e.textContent.replace(/\s+/g, ' ').trim() : ''; }
  /* build 192 (Muhanad, 2026-11-20: "do the Arabic ... what the sales agents in the egytian market is most
     familiar with"): the tour speaks Arabic on the Arabic page. Build 197 (his word, 2026-11-25: "everything translated in
     accurate Arabic"): standard Arabic, no loanwords (عرض, رسالة جماعية, اجتماع, جلسة تعريفية, ورشة عمل). L(english, arabic) picks one; the English is unchanged. */
  var AR = !!(window.MM && MM.lang === 'ar');
  function L(en, ar) { return AR ? ar : en; }
  /* build 201: an Arabic count takes the right form of its noun ("64 عرضاً", never "64 عرض") */
  function offersAr(t) { var n = parseInt(String(t).replace(/[^0-9]/g, ''), 10), r = n % 100; if (isNaN(n)) return t + ' عرض';
    return n === 1 ? 'عرض واحد' : n === 2 ? 'عرضان' : t + (r >= 3 && r <= 10 ? ' عروض' : ' عرضاً'); }
  function when() {
    var b = $('.seg186 button[aria-pressed="true"]'), k = b ? b.dataset.r : '';
    return AR ? ({ today: 'اليوم', week: 'هذا الأسبوع', month: 'في آخر 30 يوماً', ever: 'حتى الآن' }[k] || 'في هذه التواريخ')
      : ({ today: 'today', week: 'this week', month: 'in the last 30 days', ever: 'so far' }[k] || 'in these dates');
  }
  function money() { return txt('.hero186 .sales b').replace(/^EGP\s*/, 'EGP '); }
  /* build 192: the DAILY target from the settings. Since 191 the ring shows the target for the chosen dates
     (90 for 30 days), so reading it off the ring made the tour say "Send 90 offers a day". */
  function goal() { var n = typeof CONFIG !== 'undefined' && CONFIG.salesDay && Number(CONFIG.salesDay.broadcasts); return String(n || 3); }
  function bar(k) { return $('#tab button[data-t="' + k + '"]'); }
  function card(re) { return [].filter.call(document.querySelectorAll('.scr .card'), function (c) { var h = c.querySelector('h2'); return h && re.test(h.textContent); })[0]; }
  function inSheet(s) { var sh = $('#sheet'); return sh && sh.classList.contains('on') ? sh.querySelector(s) : null; }

  var CHOOSE = L('<div class="tour-mock" aria-hidden="true"><span><b>Special request</b>A company asked. Counts for that company.</span><span><b>General broadcast</b>To groups. Counts on today’s target.</span></div>',
    '<div class="tour-mock" aria-hidden="true"><span><b>طلب خاص</b>شركة طلبت منك. يُحتسب لهذه الشركة.</span><span><b>رسالة جماعية</b>للمجموعات. تُحتسب في مستهدف اليوم.</span></div>');

  var STEPS = [
    { center: true, title: L('Your work, counted', 'عملك كله مسجّل'), text: L('Most of this page fills by itself as you send offers. Here is how to read it and use it.', 'تمتلئ معظم هذه الصفحة تلقائياً كلما أرسلت عروضاً. إليك طريقة قراءتها والاستفادة منها.') },

    { ch: L('How it fills', 'كيف تمتلئ'), find: function () { return bar('offer'); }, pad: 2, title: L('It starts with an offer', 'البداية من العرض'), text: L('Send offers from Quick Offer. Before each one goes, you choose who it is for:', 'أرسل العروض من «عرض سريع». قبل إرسال أي عرض، تختار لمن هو:'), extra: CHOOSE },

    { ch: L('Your results', 'نتائجك'), sel: '.segrow186', title: L('Pick your dates', 'اختر التواريخ'), text: L('Today, this week, 30 days or all time. Every card on this page follows them.', 'اليوم، أو الأسبوع، أو 30 يوماً، أو منذ البداية. كل بطاقة في الصفحة تتبعها.') },
    { ch: L('Your results', 'نتائجك'), sel: '.hero186', title: L('Your sales', 'مبيعاتك'), text: function () { var v = money(); return AR ? (v ? 'مبيعاتك ' + when() + ': ' + v + '.' : 'ما بعته.') + ' الصفقة المشتركة مع زميل تُحتسب بالنصف.'
      : (v ? v + ' sold ' + when() + '.' : 'What you sold.') + ' A deal split with a colleague counts half.'; } },
    { ch: L('Your results', 'نتائجك'), sel: '.curve186', title: L('Special requests', 'الطلبات الخاصة'), text: function () { var n = txt('.curve186 .big186 b'); return AR ? (n ? offersAr(n) : 'العروض') + ' لشركات طلبت منك، ' + when() + '. البرتقالي فوق المتقطع: أنت متقدم.'
      : (n ? n + ' offers' : 'Offers') + ' to companies that asked you, ' + when() + '. Orange above dashed: ahead.'; } },
    { ch: L('Your results', 'نتائجك'), sel: '.curve186', demo: true, title: L('Read any day', 'اقرأ أي يوم'), text: L('Drag a finger across the graph to read any day. “Open this day” shows who asked.', 'اسحب إصبعك على الرسم البياني لقراءة أي يوم. «افتح هذا اليوم» يعرض من طلب.') },

    { ch: L('Your companies', 'شركاتك'), sel: '.reach186 .big186', pad: 10, title: L('Active companies', 'الشركات النشطة'), text: function () { var n = txt('.reach186 .big186 b'), of = txt('.reach186 .big186 span').replace(/^(of|من)\s*/, '');
      return AR ? (n && of ? n + ' من شركاتك الـ ' + of + ' طلبت منك ' + when() + '.' : 'عدد شركاتك التي طلبت منك.') + ' طلبات أكثر تعني مبيعات أكثر.'
        : (n && of ? n + ' of your ' + of + ' companies asked you ' + when() + '.' : 'How many of your companies asked you.') + ' More asking, more sales.'; } },
    { ch: L('Your companies', 'شركاتك'), sel: '.st186[data-g186="active"]', title: L('Active', 'نشطة'), text: L('Asked you for an offer in the dates you picked. Keep them warm with your offers.', 'طلبت منك عرضاً في التواريخ التي اخترتها. حافظ على تواصلك معها بالعروض.') },
    { ch: L('Your companies', 'شركاتك'), sel: '.st186[data-g186="quiet"]', title: L('Gone quiet', 'تراجع نشاطها'), text: L('Asked you just before your dates, then nothing in them. The early warning: call them today.', 'طلبت منك قبل هذه التواريخ مباشرةً، ثم لم تطلب خلالها. هذا هو الإنذار المبكر: اتصل بها اليوم.') },
    { ch: L('Your companies', 'شركاتك'), sel: '.st186[data-g186="inactive"]', title: L('Inactive', 'غير نشطة'), text: L('Asked you once, long before your dates, nothing since. A visit to their office can wake them up.', 'طلبت منك مرة قبل هذه التواريخ بفترة طويلة، ولم تطلب شيئاً منذ ذلك الحين. قد تعيدها زيارة لمكتبها.') },
    { ch: L('Your companies', 'شركاتك'), sel: '.st186[data-g186="never"]', title: L('Never asked', 'لم تطلب أبداً'), text: L('Never asked you for an offer. An orientation at their office is the way in.', 'لم تطلب منك عرضاً قط. الجلسة التعريفية في مكتبها هي الخطوة الأولى.') },
    { ch: L('Your companies', 'شركاتك'), sel: '.states186', pad: 8, title: L('See the names', 'اطّلع على الأسماء'), text: L('Tap any group to see its companies. The gone quiet ones also show below it.', 'اضغط على أي مجموعة لعرض شركاتها. والشركات التي تراجع نشاطها تظهر أسفلها أيضاً.') },

    { ch: L('Your day', 'يومك'), sel: '.ring186', title: L('Your broadcast target', 'مستهدف الرسائل الجماعية'), text: function () { return AR ? 'أرسل ' + goal() + ' عروض يومياً، كل يوم، إلى كل شركاتك رسالةً جماعية. يُحتسب كل عرض مرة واحدة. وكلما اخترت أياماً أكثر، زاد المستهدف معها.'
      : 'Send ' + goal() + ' offers a day, every day, to all your companies as General broadcast. Each counts once. Pick more days and the target grows with them.'; } },
    { ch: L('Your day', 'يومك'), sel: '.path186', title: L('From request to contract', 'من الطلب إلى العقد'), text: L('How your requests became meetings, reservations and contracts. Tap a line for names.', 'كيف تحولت طلباتك إلى اجتماعات وحجوزات وعقود. اضغط على أي سطر لعرض الأسماء.') },

    { ch: L('Record your work', 'سجّل عملك'), sel: '#fab', round: true, pad: 6, title: L('The orange +', 'زر + البرتقالي'), text: L('Offers count by themselves. Your visits, meetings and deals: record them with +.', 'العروض تُحتسب تلقائياً. أما زياراتك واجتماعاتك وصفقاتك فسجّلها من زر +.') },
    { ch: L('Record your work', 'سجّل عملك'), scene: 'sheet', find: function () { return inSheet('.chips'); }, pad: 6, title: L('Choose what happened', 'اختر ما حدث'), text: L('Orientation: a visit to present Moray. Workshop: a session where requests bring no meeting.', 'الجلسة التعريفية: زيارة لتقديم Moray. ورشة العمل: جلسة مع شركة تطلب ولا تُثمر طلباتها اجتماعاً.') },
    { ch: L('Record your work', 'سجّل عملك'), scene: 'sheet', find: function () { var a = inSheet('.fld.pick'), b = inSheet('.range'); return a ? (b ? [a, b] : a) : null; }, pad: 6, title: L('The company and the date', 'الشركة والتاريخ'), text: L('Type the first letters of the company and pick it. Set the date and who came.', 'اكتب أول حروف اسم الشركة واخترها. حدد التاريخ ومن حضر.') },
    { ch: L('Record your work', 'سجّل عملك'), scene: 'sheet', find: function () { return inSheet('#rSave'); }, pad: 5, title: L('Save', 'حفظ'), text: L('It shows on this page at once, and your manager sees it.', 'يظهر في هذه الصفحة فوراً، ويراه مديرك.') },
    { ch: L('Record your work', 'سجّل عملك'), find: function () { return card(/What I entered|ما سجّلته|ما سجلته/); }, title: L('What you entered', 'ما سجّلته'), text: L('Everything you recorded, newest first. A mistake? Take it back the same day.', 'كل ما سجّلته، الأحدث أولاً. هل هناك خطأ؟ اسحبه في اليوم نفسه.') },

    { ch: L('Profile', 'حسابي'), find: function () { return bar('profile'); }, pad: 2, title: L('Profile', 'حسابي'), text: L('Your account, what every word means, English or Arabic, and sign out.', 'حسابك، ومعنى كل كلمة، والعربية أو الإنجليزية، وتسجيل الخروج.') },
    { ch: L('Profile', 'حسابي'), scene: 'profile', find: function () { return card(/What the words mean|معنى|معاني/); }, title: L('What the words mean', 'معاني الكلمات'), text: L('Not sure what a word on the page means? Each one is explained here.', 'لست متأكداً من معنى كلمة؟ كل كلمة في الصفحة مشروحة هنا.') }
  ];

  var LAST = STEPS.length - 1, i = 0, on = false, ov, hole, note, finger;
  var demoRaf = 0, demoWait = 0, seek = 0, moveRaf = 0, moving = false, turn = 0, cur = null, curRad = 0, outAt = 0;
  var still = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var FADE = 220;

  function el(tag, cls) { var e = document.createElement(tag); if (cls) e.className = cls; return e; }
  function build() {
    ov = el('div', 'tour-ov'); ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-modal', 'true'); ov.setAttribute('aria-label', L('How My activity works', 'كيف تعمل صفحة نشاطي'));
    hole = el('div', 'tour-hole'); note = el('div', 'tour-note'); finger = el('i', 'tour-finger');
    note.setAttribute('aria-live', 'polite');
    ov.appendChild(hole); ov.appendChild(finger); ov.appendChild(note); document.body.appendChild(ov);
    ov.addEventListener('click', function (e) {
      var b = e.target.closest('[data-tour]'); if (!b) return;
      var a = b.dataset.tour; if (a === 'next') go(i + 1); else if (a === 'back') go(i - 1); else stop(a === 'done');
    });
  }
  function targets(s) {
    if (s.center) return null;
    var t = s.find ? s.find() : $(s.sel); if (!t) return null;
    var list = [].concat(t).filter(function (x) { var r = x.getBoundingClientRect(); return r.width && r.height; });
    return list.length ? list : null;
  }
  /* the lit box for a step, in screen coordinates, padding included */
  function rectOf(list, s) {
    var r = list.map(function (x) { return x.getBoundingClientRect(); }), p = s.pad === undefined ? 4 : s.pad;
    var L = Math.min.apply(null, r.map(function (x) { return x.left; })), T = Math.min.apply(null, r.map(function (x) { return x.top; }));
    var R = Math.max.apply(null, r.map(function (x) { return x.right; })), B = Math.max.apply(null, r.map(function (x) { return x.bottom; }));
    return { l: L - p, t: T - p, w: R - L + 2 * p, h: B - T + 2 * p };
  }
  function radOf(list, s) { var p = s.pad === undefined ? 4 : s.pad; if (s.round) return 999; return (list.length > 1 ? 16 : parseFloat(getComputedStyle(list[0]).borderRadius) || 14) + p; }
  function centre() { return { l: window.innerWidth / 2, t: window.innerHeight / 2, w: 0, h: 0 }; }
  function setHole(R, rad) {
    cur = R; curRad = rad;
    hole.style.transform = 'translate(' + R.l.toFixed(2) + 'px,' + R.t.toFixed(2) + 'px)';
    hole.style.width = Math.max(0, R.w).toFixed(2) + 'px'; hole.style.height = Math.max(0, R.h).toFixed(2) + 'px';
    hole.style.borderRadius = Math.min(rad, Math.max(R.w, R.h) / 2 + 1).toFixed(1) + 'px';
    hole.style.outlineColor = R.w < 2 ? 'transparent' : '';
  }
  function placeNote(R) {
    var vw = window.innerWidth, vh = window.innerHeight, nw = note.offsetWidth, nh = note.offsetHeight;
    note.style.left = Math.max(12, (vw - nw) / 2) + 'px';
    if (!R || R.w < 2) { note.style.top = Math.max(12, (vh - nh) / 2) + 'px'; return; }
    var below = R.t + R.h + 12, above = R.t - 12 - nh;
    note.style.top = (below + nh < vh - 8 ? below : above > 8 ? above : Math.max(8, vh - nh - 8)) + 'px';
  }
  /* when he scrolls or turns the phone while a note is up: follow at once */
  function place() {
    if (!on || moving) return;
    var s = STEPS[i]; if (s.center) { setHole(centre(), 0); placeNote(null); return; }
    var list = targets(s); if (!list) return;
    var R = rectOf(list, s); setHole(R, radOf(list, s)); placeNote(R);
  }

  /* THE SCENE a step needs: the page, the record form open on Orientation, or the Profile tab */
  function sheetOn() { var s = $('#sheet'); return !!(s && s.classList.contains('on')); }
  function onProfile() { var b = bar('profile'); return !!(b && b.getAttribute('aria-current') === 'page'); }
  function scene(want) {
    var wait = 0;
    if (want !== 'sheet' && sheetOn()) { $('#veil').click(); wait = 480; }
    if (want !== 'profile' && onProfile()) { bar('my').click(); wait = 1900; }   /* back to My activity plays the pulse */
    if (want === 'profile' && !onProfile()) { bar('profile').click(); window.scrollTo(0, 0); wait = Math.max(wait, 380); }
    if (want === 'sheet') {
      if (!sheetOn()) { $('#fab').click(); wait = Math.max(wait, 560); }
      var o = inSheet('[data-k="orientation"]'); if (o && o.getAttribute('aria-pressed') !== 'true') o.click();
    }
    return wait;
  }

  /* THE GLIDE: page scroll and lit box in one eased movement, drawn frame by frame */
  function ease(k) { return k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2; }
  function glide(s, list, done) {
    cancelAnimationFrame(moveRaf);
    var t = list[0], inSheetT = !!t.closest('#sheet'), fixed = !!t.closest('#tab, #fab');
    if (inSheetT) t.scrollIntoView({ block: 'nearest' });
    var y0 = window.scrollY, y1 = y0;
    if (!inSheetT && !fixed) {
      var R0 = rectOf(list, s), vh = window.innerHeight, nh = note.offsetHeight || 170;
      /* the card high enough that the note fits under it; a tall card goes near the top */
      var want = R0.h + nh + 24 < vh - 110 ? Math.max(80, (vh - R0.h - nh - 24) / 2) : 70;
      var max = document.documentElement.scrollHeight - vh;
      y1 = Math.max(0, Math.min(max, y0 + R0.t - want));
    }
    var H0 = cur || centre(), rad0 = curRad, rad1 = radOf(list, s);
    var D = still ? 0 : Math.round(Math.min(1100, 800 + Math.abs(y1 - y0) * 0.25));
    var t0 = 0; moving = true;
    function frame(ts) {
      if (!t0) t0 = ts;
      var k = D ? Math.min(1, (ts - t0) / D) : 1, e = ease(k);
      if (y1 !== y0) window.scrollTo(0, y0 + (y1 - y0) * e);
      var R = rectOf(list, s);   /* the card where it is now, after this frame's scroll */
      setHole({ l: H0.l + (R.l - H0.l) * e, t: H0.t + (R.t - H0.t) * e, w: H0.w + (R.w - H0.w) * e, h: H0.h + (R.h - H0.h) * e }, rad0 + (rad1 - rad0) * e);
      if (k < 1) moveRaf = requestAnimationFrame(frame); else { moving = false; done(R); }
    }
    moveRaf = requestAnimationFrame(frame);
  }

  function stopDemo() { cancelAnimationFrame(demoRaf); clearTimeout(demoWait); demoRaf = 0; if (finger) finger.classList.remove('on'); if (window.MM && MM.unscrub186) MM.unscrub186(); }
  /* THE FINGER on "Read any day": drags slowly across the graph and rests on today */
  function runDemo() {
    var ch = $('.curve186 .chart186'); if (!ch || !window.MM || !MM.scrub186) return;
    var t0 = 0, dur = still ? 1 : 2800;
    function at(k) {
      var r = ch.getBoundingClientRect(), x = r.left + 2 + (r.width - 4) * k;
      MM.scrub186(ch, x);
      finger.style.transform = 'translate(' + (x - 19).toFixed(1) + 'px,' + (r.bottom - 26).toFixed(1) + 'px)';
    }
    function frame(ts) {
      if (!t0) t0 = ts;
      var k = Math.min(1, (ts - t0) / dur), e = (1 - Math.cos(Math.PI * k)) / 2;
      at(e); if (k < 1) demoRaf = requestAnimationFrame(frame); else demoWait = setTimeout(function () { finger.classList.remove('on'); }, 1000);
    }
    at(0); if (!still) finger.classList.add('on');
    demoWait = setTimeout(function () { demoRaf = requestAnimationFrame(frame); }, still ? 0 : 350);   /* the finger lands, then moves */
  }

  function head(s) {
    var h = '';
    for (var k = 1; k <= LAST; k++) h += '<i' + (k === i ? ' class="on"' : k < i ? ' class="done"' : '') + '></i>';
    return '<p class="tour-k">' + s.ch + '</p><p class="tour-dots" aria-label="' + L('Step ', 'خطوة ') + i + L(' of ', ' من ') + LAST + '">' + h + '</p>';
  }
  function fill(s) {
    var first = i === 0, last = i === LAST;
    note.className = 'tour-note out' + (first ? ' welcome' : '');
    if (AR) { note.dir = 'rtl'; note.style.direction = 'rtl'; note.style.textAlign = first ? 'center' : 'right'; }
    note.innerHTML = (first ? '<p class="tour-k">' + L('Quick tour', 'جولة سريعة') + '</p>' : head(s)) + '<h4>' + s.title + '</h4><p class="tour-t">' + (typeof s.text === 'function' ? s.text() : s.text) + '</p>' + (s.extra || '') +
      '<div class="tour-b">' +
      (last ? '<span class="tour-gap"></span>' : '<button type="button" data-tour="skip" class="tour-skip">' + (first ? L('Not now', 'ليس الآن') : L('Skip', 'تخطي')) + '</button>') +
      (i > 1 ? '<button type="button" data-tour="back" class="tour-back">' + L('Back', 'رجوع') + '</button>' : '') +
      '<button type="button" data-tour="' + (last ? 'done' : 'next') + '" class="tour-next">' + (first ? L('Show me', 'ابدأ الجولة') : last ? L('Done', 'تم') : L('Next', 'التالي')) + '</button></div>';
  }
  function show() { void note.offsetWidth; note.classList.remove('out'); var nx = note.querySelector('.tour-next'); if (nx) nx.focus({ preventScroll: true }); }

  function go(n) {
    stopDemo(); clearTimeout(seek); cancelAnimationFrame(moveRaf); moving = false;
    var dir = n >= i ? 1 : -1;
    if (n < 0) n = 0;
    if (n > LAST) return stop(true);
    i = n; var s = STEPS[i], my = ++turn;
    note.classList.add('out'); outAt = Date.now();   /* the old note fades out first */
    var wait = scene(s.scene || 'page');
    if (wait && cur) { var c = centre(); glide0(c); }   /* while the scene changes: the box closes to the middle, the page stays dim */
    var tries = 0;
    function look() {
      if (my !== turn) return;
      if (s.center) { fill(s); placeNote(null); glide0(centre(), show); return; }
      var list = targets(s);
      if (!list) { if (tries++ < 30) { seek = setTimeout(look, 100); return; } return go(i + dir); }   /* not on this page: passed over */
      fill(s);
      glide(s, list, function (R) { if (my !== turn) return; placeNote(R); show(); if (s.demo) demoWait = setTimeout(runDemo, still ? 0 : 250); });
    }
    seek = setTimeout(look, Math.max(wait, FADE - (Date.now() - outAt)));
  }
  /* the box to a point (no target): used by the welcome and while a scene changes */
  function glide0(to, done) {
    var H0 = cur || centre(), rad0 = curRad, t0 = 0, D = still ? 0 : 700; moving = true;
    cancelAnimationFrame(moveRaf);
    function frame(ts) {
      if (!t0) t0 = ts;
      var k = D ? Math.min(1, (ts - t0) / D) : 1, e = ease(k);
      setHole({ l: H0.l + (to.l - H0.l) * e, t: H0.t + (to.t - H0.t) * e, w: H0.w + (to.w - H0.w) * e, h: H0.h + (to.h - H0.h) * e }, rad0 * (1 - e));
      if (k < 1) moveRaf = requestAnimationFrame(frame); else { moving = false; if (done) done(); }
    }
    moveRaf = requestAnimationFrame(frame);
  }

  function start() {
    if (!ov) build();
    on = true; i = 0; cur = null; curRad = 0; setHole(centre(), 0);
    document.documentElement.classList.add('touring');
    requestAnimationFrame(function () { ov.classList.add('on'); });   /* the dim fades in */
    go(0);
    [].forEach.call(document.querySelectorAll('.tour186.fresh'), function (b) { b.classList.remove('fresh'); });
    try { localStorage.setItem('tour186-seen', '1'); } catch (e) { /* only means the "?" may pulse again */ }
  }
  function stop(done) {
    stopDemo(); clearTimeout(seek); cancelAnimationFrame(moveRaf); moving = false; turn++;
    on = false; if (ov) ov.classList.remove('on'); document.documentElement.classList.remove('touring');
    scene('page');   /* Skip or Done: the form closed, back on My activity */
    if (done) window.scrollTo({ top: 0, behavior: still ? 'auto' : 'smooth' });
  }
  window.addEventListener('scroll', place, { passive: true });
  window.addEventListener('resize', place);
  document.addEventListener('keydown', function (e) { if (!on) return; if (e.key === 'Escape') stop(); else if (e.key === 'ArrowRight') go(i + 1); else if (e.key === 'ArrowLeft' && i > 1) go(i - 1); }, true);
  document.addEventListener('click', function (e) { if (e.target.closest && e.target.closest('.tour186')) start(); });
  window.MMTour = { start: start, stop: stop };
})();
