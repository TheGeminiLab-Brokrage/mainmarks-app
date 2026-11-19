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
  function when() {
    var b = $('.seg186 button[aria-pressed="true"]'), k = b ? b.dataset.r : '';
    return { today: 'today', week: 'this week', month: 'in the last 30 days', ever: 'so far' }[k] || 'in these dates';
  }
  function money() { return txt('.hero186 .sales b').replace(/^EGP\s*/, 'EGP '); }
  function goal() { var m = /\/(\d+)/.exec(txt('.ring186 text')); return m ? m[1] : '3'; }
  function bar(k) { return $('#tab button[data-t="' + k + '"]'); }
  function card(re) { return [].filter.call(document.querySelectorAll('.scr .card'), function (c) { var h = c.querySelector('h2'); return h && re.test(h.textContent); })[0]; }
  function inSheet(s) { var sh = $('#sheet'); return sh && sh.classList.contains('on') ? sh.querySelector(s) : null; }

  var CHOOSE = '<div class="tour-mock" aria-hidden="true"><span><b>Special request</b>A company asked. Counts for that company.</span><span><b>General broadcast</b>To groups. Counts on today’s target.</span></div>';
  var STEPS = [
    { center: true, title: 'Your work, counted', text: 'Most of this page fills by itself as you send offers. Here is how to read it and use it.' },

    { ch: 'How it fills', find: function () { return bar('offer'); }, pad: 2, title: 'It starts with an offer', text: 'Send offers from Quick Offer. Before each one goes, you choose who it is for:', extra: CHOOSE },

    { ch: 'Your results', sel: '.segrow186', title: 'Pick your dates', text: 'Today, this week, 30 days or all time. Every card on this page follows them.' },
    { ch: 'Your results', sel: '.hero186', title: 'Your sales', text: function () { var v = money(); return (v ? v + ' sold ' + when() + '.' : 'What you sold.') + ' A deal split with a colleague counts half.'; } },
    { ch: 'Your results', sel: '.curve186', title: 'Special requests', text: function () { var n = txt('.curve186 .big186 b'); return (n ? n + ' offers' : 'Offers') + ' to companies that asked you, ' + when() + '. Orange above dashed: ahead.'; } },
    { ch: 'Your results', sel: '.curve186', demo: true, title: 'Read any day', text: 'Drag a finger across the graph to read any day. “Open this day” shows who asked.' },

    { ch: 'Your companies', sel: '.reach186 .big186', pad: 10, title: 'Active companies', text: function () { var n = txt('.reach186 .big186 b'), of = txt('.reach186 .big186 span').replace(/^of\s*/, ''); return (n && of ? n + ' of your ' + of + ' companies asked you ' + when() + '.' : 'How many of your companies asked you.') + ' More asking, more sales.'; } },
    { ch: 'Your companies', sel: '.st186[data-g186="active"]', title: 'Active', text: 'Asked you for an offer in the last 2 weeks. Keep them warm with your offers.' },
    { ch: 'Your companies', sel: '.st186[data-g186="quiet"]', title: 'Gone quiet', text: 'Asked before, then nothing for 2 weeks. The early warning: call them today.' },
    { ch: 'Your companies', sel: '.st186[data-g186="inactive"]', title: 'Inactive', text: 'No request to you for a month. A visit to their office can wake them up.' },
    { ch: 'Your companies', sel: '.st186[data-g186="never"]', title: 'Never asked', text: 'Never asked you for an offer. An orientation at their office is the way in.' },
    { ch: 'Your companies', sel: '.states186', pad: 8, title: 'See the names', text: 'Tap any group to see its companies. The gone quiet ones also show below it.' },

    { ch: 'Your day', sel: '.ring186', title: 'Today’s target', text: function () { return 'Send ' + goal() + ' offers a day to all your companies as General broadcast. Each counts once.'; } },
    { ch: 'Your day', sel: '.path186', title: 'From request to contract', text: 'How your requests became meetings, reservations and contracts. Tap a line for names.' },

    { ch: 'Record your work', sel: '#fab', round: true, pad: 6, title: 'The orange +', text: 'Offers count by themselves. Your visits, meetings and deals: record them with +.' },
    { ch: 'Record your work', scene: 'sheet', find: function () { return inSheet('.chips'); }, pad: 6, title: 'Choose what happened', text: 'Orientation: a visit to present Moray. Workshop: a session where requests bring no meeting.' },
    { ch: 'Record your work', scene: 'sheet', find: function () { var a = inSheet('.fld.pick'), b = inSheet('.range'); return a ? (b ? [a, b] : a) : null; }, pad: 6, title: 'The company and the date', text: 'Type the first letters of the company and pick it. Set the date and who came.' },
    { ch: 'Record your work', scene: 'sheet', find: function () { return inSheet('#rSave'); }, pad: 5, title: 'Save', text: 'It shows on this page at once, and your manager sees it.' },
    { ch: 'Record your work', find: function () { return card(/What I entered|ما سجلته/); }, title: 'What you entered', text: 'Everything you recorded, newest first. A mistake? Take it back the same day.' },

    { ch: 'Profile', find: function () { return bar('profile'); }, pad: 2, title: 'Profile', text: 'Your account, what every word means, English or Arabic, and sign out.' },
    { ch: 'Profile', scene: 'profile', find: function () { return card(/What the words mean|معنى/); }, title: 'What the words mean', text: 'Not sure what a word on the page means? Each one is explained here.' }
  ];

  var LAST = STEPS.length - 1, i = 0, on = false, ov, hole, note, finger;
  var demoRaf = 0, demoWait = 0, seek = 0, moveRaf = 0, moving = false, turn = 0, cur = null, curRad = 0, outAt = 0;
  var still = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var FADE = 220;

  function el(tag, cls) { var e = document.createElement(tag); if (cls) e.className = cls; return e; }
  function build() {
    ov = el('div', 'tour-ov'); ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-modal', 'true'); ov.setAttribute('aria-label', 'How My activity works');
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
    return '<p class="tour-k">' + s.ch + '</p><p class="tour-dots" aria-label="Step ' + i + ' of ' + LAST + '">' + h + '</p>';
  }
  function fill(s) {
    var first = i === 0, last = i === LAST;
    note.className = 'tour-note out' + (first ? ' welcome' : '');
    note.innerHTML = (first ? '<p class="tour-k">Quick tour</p>' : head(s)) + '<h4>' + s.title + '</h4><p class="tour-t">' + (typeof s.text === 'function' ? s.text() : s.text) + '</p>' + (s.extra || '') +
      '<div class="tour-b">' +
      (last ? '<span class="tour-gap"></span>' : '<button type="button" data-tour="skip" class="tour-skip">' + (first ? 'Not now' : 'Skip') + '</button>') +
      (i > 1 ? '<button type="button" data-tour="back" class="tour-back">Back</button>' : '') +
      '<button type="button" data-tour="' + (last ? 'done' : 'next') + '" class="tour-next">' + (first ? 'Show me' : last ? 'Done' : 'Next') + '</button></div>';
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
