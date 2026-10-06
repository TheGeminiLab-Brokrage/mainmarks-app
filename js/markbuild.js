/* ------------------------------------------------------------------
   THE MARK BUILDS ITSELF — the h:rs entry transition.

   Tapping the live project assembles its logo, extends it with the
   Main Marks pillars lockup, and then uncovers the project page.
   Built to the client's specification of 2026-09-21 and to the two
   sources it names: `Hrs Animation logo.mp4` (the real website
   animation) and the approved final lockup frame.

   ---- THE TWO RULES THIS FILE IS ARRANGED AROUND -------------------

   1. EVERY WHITE PIECE IS A CUT OF THE SUPPLIED LOGO. A piece is the
      whole logo file with a rectangular window over it. The window
      opens from one edge to draw the piece on, and the eight windows,
      fully open, tile the file with no gap and no overlap. So there
      cannot be an orbiting disc, a decorative arc or a spare square —
      there is nothing on screen that is not already in the logo, and
      assembled the pieces ARE the logo. The cut columns were measured
      off the file's alpha channel and live in config.

      (The client's note asks for separated SVG paths. Main Marks has
      supplied the logo as a transparent PNG and no vector, so the
      windows are the honest equivalent: the artwork is theirs,
      untouched, and nothing has been traced. If they send the vector
      or the original animation source, this is the file to replace.)

   2. THE CHOREOGRAPHY IS MEASURED, NOT INVENTED. Every entry
      direction, distance and start time below was read off their MP4
      by tracking the white shapes frame by frame. In their animation
      the two colon squares appear first, far apart, and close on each
      other; the h's stem DRAWS DOWNWARD from above the wordmark; the
      s arrives from the right; the r's stem DRAWS UPWARD from below;
      and the two shoulders wipe on left to right. That order and
      those directions are reproduced here, compressed from their
      1,333ms to the 1,100ms the note asks for.

   ---- WHERE IT RUNS -------------------------------------------------

   PHASE 1 ONLY happens on the page being left: the card is disabled,
   the screen goes black, and we navigate. EVERYTHING ELSE happens on
   the project page, under a black overlay it paints before its first
   frame.

   That split is deliberate. Two documents cannot be composited, so a
   hand-over always shows one frame of each. Handing over on PURE
   BLACK — nothing on screen at all — is the only seam that cannot be
   seen. Earlier this transition handed over on the finished wordmark
   and read as two separate animations stitched together.

   ---- ONE TIMELINE --------------------------------------------------

   Every step is a Web Animations API animation started in the same
   tick with its own delay, so they share one clock and cannot drift.
   `SPEED` scales all of it. There is no setTimeout anywhere in the
   choreography; the only timers are the two safety nets at the end,
   which exist so a browser that refuses to animate still gets the
   person to the project page.
   ------------------------------------------------------------------ */

(function (root) {
  'use strict';

  var MM = root.MM || (root.MM = {});

  var reduced = false;
  try {
    reduced = root.matchMedia &&
      root.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch (e) { /* no matchMedia: assume motion is fine */ }

  var KEY = 'mm.mark';
  var SPEED = 1;                 /* 1.15 would make the whole thing quicker */

  /* ---- the timeline -------------------------------------------------
     Milliseconds from the tap. Phase 1 is the 160ms on the page being
     left; everything from ASSEMBLY on is measured from the project
     page's first frame, which is why those numbers restart at 0. */
  var T = {
    handoff:    160,           /* phase 1, on the page being left       */

    /* phase 2 — the assembly, 1,100ms, their MP4's own order          */
    colon:      [0, 522],
    hStem:      [165, 632],
    s:          [413, 1100],
    rStem:      [467, 852],
    hArch:      [660, 852],
    rArch:      [852, 1100],

    hold:       [1100, 1200],   /* phase 3, the wordmark alone          */
    move:       [1200, 1540],   /* phase 3, down-left and smaller       */
    device:     [1400, 1760],   /* phase 4, blue, yellow, red           */
    devStep:    60,
    slogan:     [1720, 2005],   /* phase 5, one word at a time          */
    slogStep:   55,
    lockHold:   [2005, 2260],   /* phase 6                              */
    markOut:    [2260, 2400],   /* the lockup goes FIRST, on its own     */
    reveal:     [2380, 2740]    /* phase 7, the black dissolves          */
  };
  var END = T.reveal[1];

  var EASE_OUT = 'cubic-bezier(.16, 1, .3, 1)';   /* the note's own curve */
  var EASE_DRAW = 'cubic-bezier(.4, 0, .2, 1)';   /* a stroke being drawn */

  /* ---- the eight pieces ---------------------------------------------
     `rect` is the piece's window on the logo, as fractions of the file,
     from config. `open` is the edge the window opens from — 'n' draws
     downward, 's' upward, 'w' rightward, 'e' leftward, null appears
     whole. `dx`/`dy` are where the piece starts, as fractions of the
     MARK'S OWN WIDTH, so the distances hold at any size; they are the
     MP4's distances divided by the 421px its wordmark measures there. */
  function pieces(c) {
    return [
      /* the colon: first to arrive in their animation, and the two
         squares close on each other from a long way apart */
      { id: 'colonTop', x0: c.xColon, x1: c.xR, y0: 0, y1: c.yColon,
        open: null, dx: 0.036, dy: -0.178, at: T.colon, ease: EASE_OUT, fade: true },
      { id: 'colonBot', x0: c.xColon, x1: c.xR, y0: c.yColon, y1: 1,
        open: null, dx: -0.017, dy: 0.166, at: T.colon, ease: EASE_OUT, fade: true },

      /* the h's stem draws DOWN, from well above the wordmark */
      { id: 'hStem', x0: 0, x1: c.xStem, y0: 0, y1: 1,
        open: 'n', dx: 0, dy: -0.342, at: T.hStem, ease: EASE_DRAW },

      /* the s arrives from the right */
      { id: 'sTop', x0: c.xS, x1: 1, y0: 0, y1: c.yS,
        open: 'e', dx: 0.300, dy: -0.060, at: T.s, ease: EASE_OUT },
      { id: 'sBot', x0: c.xS, x1: 1, y0: c.yS, y1: 1,
        open: 'e', dx: 0.300, dy: 0.060, at: T.s, ease: EASE_OUT },

      /* the r's stem draws UP, from below the wordmark */
      { id: 'rStem', x0: c.xR, x1: c.xRStem, y0: 0, y1: 1,
        open: 's', dx: 0, dy: 0.420, at: T.rStem, ease: EASE_DRAW },

      /* both shoulders wipe on left to right, closing their letters */
      { id: 'hArch', x0: c.xStem, x1: c.xColon, y0: 0, y1: 1,
        open: 'w', dx: 0, dy: 0, at: T.hArch, ease: EASE_DRAW },
      { id: 'rArch', x0: c.xRStem, x1: c.xS, y0: 0, y1: 1,
        open: 'w', dx: 0, dy: 0, at: T.rArch, ease: EASE_DRAW }
    ];
  }

  /* inset(top right bottom left) for a piece's window, in %. `shut`
     collapses it against the edge it opens from, so the piece is drawn
     on rather than faded up. */
  function window_(p, shut) {
    var t = p.y0, r = 1 - p.x1, b = 1 - p.y1, l = p.x0;
    if (shut) {
      if (p.open === 'n') b = 1 - p.y0;          /* nothing, at the top   */
      else if (p.open === 's') t = 1 - p.y1;     /* nothing, at the foot  */
      else if (p.open === 'w') r = 1 - p.x0;     /* nothing, at the left  */
      else if (p.open === 'e') l = 1 - p.x1;     /* nothing, at the right */
    }
    return 'inset(' + (t * 100).toFixed(4) + '% ' + (r * 100).toFixed(4) + '% ' +
           (b * 100).toFixed(4) + '% ' + (l * 100).toFixed(4) + '%)';
  }

  /* Where each pillar of the device comes in from, as fractions of the
     DEVICE's width. Blue from the upper left, yellow from the lower
     left, red from the right — the client's own order. */
  var DEVICE_IN = {
    work:    { dx: -0.10, dy: -0.08 },
    engage:  { dx: -0.09, dy:  0.10 },
    connect: { dx:  0.12, dy: -0.06 }
  };
  var DEVICE_ORDER = ['work', 'engage', 'connect'];

  /* A path out of storage is checked, never trusted. */
  function safeSrc(s) {
    return /^img\/[A-Za-z0-9._-]+\.(png|jpg|jpeg|svg|webp)$/.test(s || '') ? s : null;
  }

  function el(tag, cls) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    return n;
  }
  function overlay() { return document.getElementById('markbuild'); }

  /* ================================================================
     PHASE 1 — the tap, and the black hand-over.
     Called by the page being left. Returns false if it cannot play,
     and the caller then navigates the ordinary way.
     ================================================================ */
  function cross(then, mark, card) {
    var n = overlay();
    if (!n || !safeSrc(mark && mark.src) || !n.animate) return false;

    /* the card must not be tappable twice */
    if (card) {
      card.classList.add('is-taken');
      card.setAttribute('aria-disabled', 'true');
      card.style.pointerEvents = 'none';
    }

    n.classList.add('is-on', 'is-busy');
    var go = function () { if (!go.done) { go.done = true; then(); } };

    try {
      sessionStorage.setItem(KEY, JSON.stringify({ t: Date.now(), src: mark.src }));
    } catch (e) { /* private mode: the project page just arrives plainly */ }

    var ms = reduced ? 120 : T.handoff / SPEED;
    var a = n.animate([{ opacity: 0 }, { opacity: 1 }],
                      { duration: ms, easing: 'ease-out', fill: 'forwards' });
    a.finished.then(go, go);
    /* the safety net: a browser that will not animate still leaves */
    setTimeout(go, ms + 120);
    return true;
  }

  /* ================================================================
     PHASES 2 to 7 — everything else, on the project page.
     The overlay is already black: the inline script at the top of the
     page put it there before anything painted.
     ================================================================ */
  function run(p) {
    var n = overlay();
    if (!n || !n.classList.contains('is-on')) return;

    var done = function () {
      if (done.called) return;
      done.called = true;
      n.className = 'markbuild';
      n.removeAttribute('style');
      document.documentElement.classList.remove('mb-running');
    };

    var mark = p && p.markBuild;
    var src = safeSrc(mark && mark.src);
    if (src && mark.kind === 'letters' && n.animate) { runLetters(p, n, mark, src, done); return; }
    if (src && mark.kind === 'fourth' && n.animate) { runFourth(p, n, mark, src, done); return; }
    if (!src || !mark.cut || !n.animate) { fade(n, done); return; }

    var lock = n.querySelector('.mb-lock');
    if (!lock) { fade(n, done); return; }
    document.documentElement.classList.add('mb-running');

    /* ---- build the layers ---- */
    var stage = el('div', 'mb-stage');
    stage.style.aspectRatio = /^[0-9]+ \/ [0-9]+$/.test(mark.ratio || '')
      ? mark.ratio : '';
    var list = pieces(mark.cut);

    /* Each piece is a WINDOW the size of its own cut, with the whole
       logo inside it. The window is what makes the piece a cut of the
       file; the ink sliding inside the window is what draws it on.

       It is built this way for one reason: both halves are then a
       TRANSFORM, and transforms are the only thing a browser animates
       without the main thread. This runs while the project page is
       building underneath it, and anything on the main thread stutters
       exactly then. An earlier version animated clip-path and did. */
    var parts = list.map(function (q) {
      var pw = q.x1 - q.x0, ph = q.y1 - q.y0;
      var w = el('span', 'mb-part');
      w.style.left = (q.x0 * 100).toFixed(4) + '%';
      w.style.top = (q.y0 * 100).toFixed(4) + '%';
      w.style.width = (pw * 100).toFixed(4) + '%';
      w.style.height = (ph * 100).toFixed(4) + '%';
      var ink = el('span', 'mb-ink');
      ink.style.width = (100 / pw).toFixed(4) + '%';
      ink.style.height = (100 / ph).toFixed(4) + '%';
      ink.style.left = (-q.x0 / pw * 100).toFixed(4) + '%';
      ink.style.top = (-q.y0 / ph * 100).toFixed(4) + '%';
      ink.style.backgroundImage = 'url("' + src + '")';
      w.appendChild(ink);
      stage.appendChild(w);
      return { wrap: w, ink: ink, pw: pw, ph: ph };
    });
    var whole = el('img', 'mb-whole');
    whole.alt = '';
    whole.src = src;
    stage.appendChild(whole);

    var device = el('div', 'mb-device');
    var devs = [];
    DEVICE_ORDER.forEach(function (id) {
      var ds = safeSrc(mark.pillars && mark.pillars[id]);
      if (!ds) return;
      var s = el('span', 'mb-dev');
      s.style.backgroundImage = 'url("' + ds + '")';
      device.appendChild(s);
      devs.push({ node: s, id: id });
    });

    var slogan = el('div', 'mb-slogan');
    var words = [];
    (p.pillars || []).forEach(function (pl) {
      var w = el('span', 'mb-sl');
      var sq = el('i');
      sq.style.background = (p.colour && p.colour[pl.id]) || '#fff';
      w.appendChild(sq);
      w.appendChild(document.createTextNode(pl.name + '.'));
      slogan.appendChild(w);
      words.push(w);
    });

    lock.appendChild(device);
    lock.appendChild(stage);
    lock.appendChild(slogan);
    /* the words are sized off the FRAME, so they keep their proportion
       to the mark on any screen; 2.44% is their height in the client's
       own lockup frame */
    var frame = lock.getBoundingClientRect().width || 0;
    if (frame) lock.style.fontSize = (frame * 0.0244).toFixed(2) + 'px';

    /* ================================================================
       Somebody who has asked for less movement gets the three beats and
       nothing else: black, the finished lockup, the page. Under half a
       second, as the note requires.
       ================================================================ */
    if (reduced) {
      /* nothing to do to the pieces: a window with its ink at rest is
         already exactly its cut of the logo */
      devs.forEach(function (d) { d.node.style.opacity = 1; });
      words.forEach(function (w) { w.style.opacity = 1; });
      stage.classList.add('is-placed');
      n.animate([{ opacity: 1 }, { opacity: 1, offset: 0.5 }, { opacity: 0 }],
                { duration: 360, easing: 'ease-out', fill: 'forwards' })
        .finished.then(done, done);
      setTimeout(done, 700);
      return;
    }

    /* ================================================================
       ONE TIMELINE. Every animation below is started in this tick and
       carries its own delay, so they share a clock. Nothing here waits
       on a timer.
       ================================================================ */
    var d = function (ms) { return ms / SPEED; };
    var all = [];
    var add = function (node, frames, opts) {
      var a = node.animate(frames, opts);
      all.push(a);
      return a;
    };

    /* ---- phase 2: the wordmark draws itself ----
       Two transforms per piece. The WINDOW carries the piece across the
       screen; the INK slides inside it so the piece is drawn on from
       the edge their animation draws it from. Percentages are of each
       element's own box, which is why they are divided through by the
       piece's size. */
    list.forEach(function (q, i) {
      var P = parts[i];
      var opts = { delay: d(q.at[0]), duration: d(q.at[1] - q.at[0]),
                   easing: q.ease, fill: 'both' };

      add(P.wrap, [
        { transform: 'translate(' + (q.dx / P.pw * 100).toFixed(3) + '%, ' +
                                    (q.dy / P.ph * 100).toFixed(3) + '%)' },
        { transform: 'none' }
      ], opts);

      var ix = 0, iy = 0;
      if (q.open === 'n') iy = -P.ph * 100;        /* drawn downward   */
      else if (q.open === 's') iy = P.ph * 100;    /* drawn upward     */
      else if (q.open === 'w') ix = -P.pw * 100;   /* drawn rightward  */
      else if (q.open === 'e') ix = P.pw * 100;    /* drawn leftward   */
      if (ix || iy) {
        add(P.ink, [
          { transform: 'translate(' + ix.toFixed(3) + '%, ' + iy.toFixed(3) + '%)' },
          { transform: 'none' }
        ], opts);
      }
      if (q.fade) add(P.wrap, [{ opacity: 0 }, { opacity: 1 }], opts);
    });

    /* ---- phase 3: the finished mark replaces its pieces, holds, and
       travels down-left into the lockup.

       The swap is instant and invisible: at that moment the pieces are
       already exactly the logo. It is there so the held frame is the
       supplied file rather than eight windows that are nearly aligned. */
    add(whole, [{ opacity: 0 }, { opacity: 1 }], {
      delay: d(T.hold[0]), duration: 1, fill: 'both'
    });
    parts.forEach(function (P) {
      add(P.wrap, [{ opacity: 1 }, { opacity: 0 }], {
        delay: d(T.hold[0]), duration: 1, fill: 'both'
      });
    });
    add(stage, [
      { transform: 'none' },
      { transform: 'translate(-42.5217%, 123.809%) scale(.769348)' }
    ], {
      delay: d(T.move[0]), duration: d(T.move[1] - T.move[0]),
      easing: EASE_OUT, fill: 'both'
    });

    /* ---- phase 4: the pillars ---- */
    devs.forEach(function (o, i) {
      var from = DEVICE_IN[o.id] || { dx: 0, dy: 0 };
      add(o.node, [
        { opacity: 0, transform: 'translate(' + (from.dx * 100) + '%, ' + (from.dy * 100) + '%)' },
        { opacity: 1, transform: 'none' }
      ], {
        delay: d(T.device[0] + i * T.devStep),
        duration: d(T.device[1] - T.device[0] - 2 * T.devStep),
        easing: EASE_OUT, fill: 'both'
      });
    });

    /* ---- phase 5: the words, each with its square ---- */
    words.forEach(function (w, i) {
      add(w, [
        { opacity: 0, transform: 'translateX(-.5em)' },
        { opacity: 1, transform: 'none' }
      ], {
        delay: d(T.slogan[0] + i * T.slogStep),
        duration: d(T.slogan[1] - T.slogan[0] - 2 * T.slogStep),
        easing: EASE_OUT, fill: 'both'
      });
    });

    /* ---- phases 6 and 7: hold, then uncover the project from the top.
       The lockup goes first, so the page's own h:rs never appears
       beside a second copy of itself. The black is clipped away rather
       than faded: the note asks for a rectangular reveal, top to
       bottom, not a dissolve and not a circular wipe. */
    add(lock, [{ opacity: 1 }, { opacity: 0 }], {
      delay: d(T.markOut[0]), duration: d(T.markOut[1] - T.markOut[0]),
      easing: 'ease-out', fill: 'both'
    });
    /* THE BLACK DISSOLVES. It does not move.

       The note asked for a reveal from top to bottom, and both ways of
       doing that — clipping the layer or sliding it — were tried and
       both read the same way on a phone: as a black PANEL travelling
       down the screen. The eye follows its edge, and an edge crossing
       the screen is an object, not a transition.

       Nothing moves here. The project page is already behind the black,
       fully laid out, and the black simply stops being opaque. There is
       no edge to follow, so there is nothing to see except the page
       arriving. The lockup has already gone by now, on its own, so the
       page's own h:rs never appears beside a second copy of itself. */
    var last = add(n, [
      { opacity: 1 },
      { opacity: 0 }
    ], {
      delay: d(T.reveal[0]), duration: d(T.reveal[1] - T.reveal[0]),
      easing: 'linear', fill: 'both'
    });

    /* ---- START THE CLOCK ONLY WHEN THE SCREEN CAN KEEP UP ----------
       Everything above is created PAUSED. This is the whole reason:
       run() is called at the top of the project page, and the page
       then spends a few hundred milliseconds building itself — the
       render, the masterplan, the unit list. An animation started
       before that work keeps counting through it, so the first frame
       anyone actually SEES is already a third of the way in. It looks
       like the transition begins in the middle, because it does.

       Two frames of waiting means the page has painted once and the
       main thread is free, and the assembly starts at its beginning.
       Every animation is played in the same tick, so they still share
       one clock. */
    all.forEach(function (a) { a.pause(); a.currentTime = 0; });

    var begin = function () {
      if (begin.done) return;
      begin.done = true;
      all.forEach(function (a) { a.play(); });
      last.finished.then(done, done);
      /* The safety nets, and the only timers in here: one for a browser
         that never resolves the animation, one far enough out that
         nobody is ever left looking at a black screen. */
      setTimeout(done, d(END) + 400);
      setTimeout(done, d(END) + 2000);
    };

    requestAnimationFrame(function () { requestAnimationFrame(begin); });
    /* and if frames never come — a background tab, a browser that has
       stopped painting — start anyway rather than hold the black */
    setTimeout(begin, 400);
  }

  /* ================================================================
     MORAY — "letters". Same frame as h:rs: black hand-over, the mark
     builds, a lockup forms under it, the lockup goes first, the black
     dissolves. What differs is what the pieces ARE.

     Moray's logo arrives as vectors (lifted off its CI), and each of
     its five letters is its own path. So a piece here is not a window
     over a picture: it is ONE LETTER, alone in its own SVG. The A and
     the Y overlap on the x-axis, which rules out rectangular cuts —
     and makes this the stricter version of rule 1: nothing on screen
     is anything but a letter of the logo.

     Each letter RISES into place from its own baseline, left to right
     in reading order, inside a window its own size: built up, the way
     the buildings are. Then the brochure's lockup line (PDF p.9)
     arrives under it — the orange slash draws up, "1st MARK OF", the
     rule draws out, "DISTINCTION".
     ================================================================ */
  var TL = {
    letter:   [0, 540],      /* each letter's rise                   */
    step:     95,            /* between letters: M O R A Y           */
    slash:    [760, 1000],
    lead:     [860, 1120],   /* "1st MARK OF"                        */
    rule:     [960, 1260],
    tail:     [1080, 1340],  /* "DISTINCTION"                        */
    lockHold: [1340, 1900],
    markOut:  [1900, 2040],
    reveal:   [2020, 2380]
  };

  /* MORAY WELLNESS — the same frame and the same exit, with two things
     Moray's own logo does not have (config: `script`, `bars`):
       - the template's bars (Wellness CI p.10) draw in first, the orange
         one down from the top, the blue stack up from the foot — the
         post assembling itself around the logo;
       - the logo is TWO rows. MORAY rises letter by letter exactly as
         Moray's entry does; the script "Wellness" under it is then
         written on, left to right, as a pen would. */
  var TLW = {
    bars:     [0, 520],
    barStep:  80,
    letter:   [120, 660],
    step:     90,
    script:   [640, 1340],
    slash:    [1180, 1420],
    lead:     [1260, 1520],
    rule:     [1340, 1640],
    tail:     [1460, 1720],
    markOut:  [2160, 2300],
    reveal:   [2280, 2640]
  };

  /* R- RESIDENCE — the brochure's lockup, PDF p.39: a long orange slash
     leaning in left of MORAY, "R- RESIDENCE by" set over the wordmark.
     The slash draws up first, MORAY rises letter by letter as Moray's own
     entry does, then the name arrives over it. (config: `over`)
     OFFICES — Moray's own build, with the brochure's section heading
     (PDF p.35, "/ ADMINISTRATIVE SPACES") in place of the 1st Mark line:
     the slash draws up, the heading comes in. (config: `heading`) */
  var TLR = {
    slash:    [0, 340],
    letter:   [140, 680],
    step:     90,
    over:     [860, 1160],
    markOut:  [1900, 2040],
    reveal:   [2020, 2380]
  };

  function runLetters(p, n, mark, src, done) {
    var lock = n.querySelector('.mb-lock');
    if (!lock || !root.fetch || !root.DOMParser) { fade(n, done); return; }

    /* The logo was already fetched by the card on the page we left, so
       this is a cache hit. If it fails, the black simply lifts. */
    root.fetch(src).then(function (r) {
      if (!r.ok) throw new Error('logo ' + r.status);
      return r.text();
    }).then(function (text) {
      var doc = new root.DOMParser().parseFromString(text, 'image/svg+xml');
      var svg = doc.documentElement;
      var vb = (svg.getAttribute('viewBox') || '').split(/\s+/).map(Number);
      var paths = Array.prototype.slice.call(doc.getElementsByTagName('path'));
      if (vb.length !== 4 || vb.some(isNaN) || !paths.length) throw new Error('logo shape');
      play(vb, paths);
    }).catch(function () { fade(n, done); });

    function play(vb, paths) {
      document.documentElement.classList.add('mb-running');
      var NS = 'http://www.w3.org/2000/svg';
      var two = !!mark.script;          /* a second row, written on */
      var over = mark.over && mark.over.length ? mark.over : null;   /* R- Residence */
      var tl = two ? TLW : over ? TLR : TL;

      var stage = el('div', 'mb-stage mb-word' + (two ? ' mb-word2' : '') + (over ? ' mb-word-r' : ''));
      stage.style.aspectRatio = vb[2] + ' / ' + vb[3];

      /* Every path's own extent, measured here rather than typed anywhere.
         The outlines are absolute M/L/C commands, so the numbers come in
         x,y pairs. */
      var shapes = paths.map(function (src) {
        var d = src.getAttribute('d') || '';
        var nums = (d.match(/-?\d*\.?\d+(?:e-?\d+)?/gi) || []).map(Number);
        var b = { d: d, x0: Infinity, x1: -Infinity, y0: Infinity, y1: -Infinity };
        for (var i = 0; i + 1 < nums.length; i += 2) {
          b.x0 = Math.min(b.x0, nums[i]); b.x1 = Math.max(b.x1, nums[i]);
          b.y0 = Math.min(b.y0, nums[i + 1]); b.y1 = Math.max(b.y1, nums[i + 1]);
        }
        return b;
      });

      /* One row (Moray): every path is a letter, in the file's order. Two
         rows (Wellness): the paths above the middle are the letters, in
         reading order; the rest are the script, written on as one. */
      var mid = vb[1] + vb[3] / 2;
      var top = two ? shapes.filter(function (b) { return (b.y0 + b.y1) / 2 < mid; }) : shapes;
      var low = two ? shapes.filter(function (b) { return (b.y0 + b.y1) / 2 >= mid; }) : [];
      if (two) top.sort(function (a, b) { return a.x0 - b.x0; });
      /* a top-row letter rises inside a window only as tall as its row,
         so it comes up from its own baseline, not through the script */
      var rowB = two ? Math.max.apply(null, top.map(function (b) { return b.y1; })) : vb[1] + vb[3];
      var hf = Math.min(1, (rowB - vb[1]) / vb[3] + 0.02);

      function glyphs(list, cls) {
        var s = document.createElementNS(NS, 'svg');
        s.setAttribute('viewBox', vb.join(' '));
        s.setAttribute('class', cls || 'mb-glyph');
        s.setAttribute('preserveAspectRatio', 'none');
        list.forEach(function (b) {
          var path = document.createElementNS(NS, 'path');
          path.setAttribute('d', b.d);
          path.setAttribute('fill', '#FFFFFF');
          s.appendChild(path);
        });
        return s;
      }

      /* One window per letter, the size of the letter's own extent. */
      var letters = top.map(function (b) {
        var fx0 = Math.max(0, (b.x0 - vb[0]) / vb[2] - 0.004);
        var fx1 = Math.min(1, (b.x1 - vb[0]) / vb[2] + 0.004);
        var pw = fx1 - fx0;

        var w = el('span', 'mb-part');
        w.style.left = (fx0 * 100).toFixed(4) + '%';
        w.style.width = (pw * 100).toFixed(4) + '%';
        w.style.top = '0';
        w.style.height = (hf * 100).toFixed(4) + '%';

        var s = glyphs([b]);
        s.style.width = (100 / pw).toFixed(4) + '%';
        s.style.left = (-fx0 / pw * 100).toFixed(4) + '%';
        s.style.height = (100 / hf).toFixed(4) + '%';
        w.appendChild(s);
        stage.appendChild(w);
        return { wrap: w, ink: s };
      });

      /* the script row, whole, behind a window that opens left to right */
      var script = null;
      if (low.length) {
        script = el('span', 'mb-part mb-script');
        script.style.left = '0';
        script.style.width = '100%';
        script.style.top = '0';
        script.style.height = '100%';
        var ss = glyphs(low);
        ss.style.width = '100%';
        ss.style.left = '0';
        script.appendChild(ss);
        stage.appendChild(script);
      }

      /* the template's bars, at the edges of the frame (Wellness CI p.10) */
      var bars = [];
      if (mark.bars) {
        var bl = el('span', 'mb-bar mb-bar-l');
        bl.style.background = 'linear-gradient(to bottom, ' + mark.bars.left + ' 0 83%, ' +
          (mark.bars.foot || mark.bars.left) + ' 83% 100%)';
        var br = el('span', 'mb-bar mb-bar-r');
        var from = 0;
        br.style.background = 'linear-gradient(to bottom, ' + (mark.bars.right || []).map(function (c) {
          var s = c[0] + ' ' + from + '%, ' + c[0] + ' ' + c[1] + '%';
          from = c[1];
          return s;
        }).join(', ') + ')';
        /* on the SCREEN edges, not the portrait frame: inside the frame a
           strip of black showed beside them on a phone */
        n.querySelectorAll(".mb-bar").forEach(function (x) { x.parentNode.removeChild(x); });
        n.appendChild(bl);
        n.appendChild(br);
        bars = [bl, br];
      }

      /* the lockup line: the brochure's (PDF p.9), or the template's, or
         Offices' section heading (one line: the slash and the heading) */
      var heading = mark.heading || '';
      var tag = el('div', 'mb-tag' + (two ? ' mb-tag2' : '') + (heading ? ' mb-tag-h' : ''));
      var slash = el('span', 'mb-slash');
      var lead = el('span', 'mb-tw');
      var rule = el('span', 'mb-rule');
      var tail = el('span', 'mb-tw');
      var words = mark.tagline || [];
      lead.textContent = heading || words[0] || '';
      tail.textContent = words[1] || '';
      tag.appendChild(slash);
      tag.appendChild(lead);
      if (!heading) { tag.appendChild(rule); tag.appendChild(tail); }

      /* R- Residence: the long slash left of the wordmark and the name
         over it, in place of the lockup line */
      var overNode = null;
      if (over) {
        slash.className = 'mb-slash mb-slash-tall';
        overNode = el('div', 'mb-over');
        var on = el('span', 'mb-over-name');
        on.textContent = over[0] || '';
        var ob = el('span', 'mb-over-by');
        ob.textContent = over[1] || '';
        overNode.appendChild(on);
        overNode.appendChild(ob);
      }

      lock.appendChild(stage);
      if (over) { lock.appendChild(slash); lock.appendChild(overNode); }
      else lock.appendChild(tag);
      var frame = lock.getBoundingClientRect().width || 0;
      if (frame) lock.style.fontSize = (frame * 0.028).toFixed(2) + 'px';

      if (reduced) {
        [slash, lead, rule, tail, overNode].forEach(function (x) { if (x) x.style.opacity = 1; });
        n.animate([{ opacity: 1 }, { opacity: 1, offset: 0.5 }, { opacity: 0 }],
                  { duration: 360, easing: 'ease-out', fill: 'forwards' })
          .finished.then(done, done);
        setTimeout(done, 700);
        return;
      }

      var d = function (ms) { return ms / SPEED; };
      var all = [];
      var add = function (node, frames, opts) {
        var a = node.animate(frames, opts);
        all.push(a);
        return a;
      };
      var span = function (at, extra) {
        return { delay: d(at[0] + (extra || 0)), duration: d(at[1] - at[0]),
                 easing: EASE_OUT, fill: 'both' };
      };

      /* the bars draw in: orange down from the top, the blue stack up */
      bars.forEach(function (b, i) {
        add(b, [{ transform: 'scaleY(0)' }, { transform: 'none' }],
            { delay: d(tl.bars[0] + i * tl.barStep), duration: d(tl.bars[1] - tl.bars[0]),
              easing: EASE_DRAW, fill: 'both' });
      });

      /* the letters rise, M to Y */
      letters.forEach(function (L, i) {
        add(L.ink, [{ transform: 'translateY(104%)' }, { transform: 'none' }],
            span(tl.letter, i * tl.step));
      });

      /* the script is written on */
      if (script) {
        add(script, [{ clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0% 0 0)' }],
            { delay: d(tl.script[0]), duration: d(tl.script[1] - tl.script[0]), easing: EASE_DRAW, fill: 'both' });
      }

      /* the lockup line (or, for R- Residence, the slash and the name over) */
      add(slash, [{ opacity: 0, transform: 'scaleY(0)' }, { opacity: 1, transform: 'none' }], span(tl.slash));
      if (over) {
        add(overNode, [{ opacity: 0, transform: 'translateY(.5em)' }, { opacity: 1, transform: 'none' }], span(tl.over));
      } else {
        add(lead, [{ opacity: 0, transform: 'translateX(-.4em)' }, { opacity: 1, transform: 'none' }], span(tl.lead));
      }
      if (!over && !heading) {
        add(rule, [{ opacity: 1, transform: 'scaleX(0)' }, { opacity: 1, transform: 'none' }],
            { delay: d(tl.rule[0]), duration: d(tl.rule[1] - tl.rule[0]), easing: EASE_DRAW, fill: 'both' });
        add(tail, [{ opacity: 0, transform: 'translateX(-.4em)' }, { opacity: 1, transform: 'none' }], span(tl.tail));
      }

      /* the lockup goes first, then the black dissolves — see h:rs */
      add(lock, [{ opacity: 1 }, { opacity: 0 }],
          { delay: d(tl.markOut[0]), duration: d(tl.markOut[1] - tl.markOut[0]), easing: 'ease-out', fill: 'both' });
      bars.forEach(function (x) {
        add(x, [{ opacity: 1 }, { opacity: 0 }],
            { delay: d(tl.markOut[0]), duration: d(tl.markOut[1] - tl.markOut[0]), easing: 'ease-out', fill: 'both' });
      });
      var last = add(n, [{ opacity: 1 }, { opacity: 0 }],
          { delay: d(tl.reveal[0]), duration: d(tl.reveal[1] - tl.reveal[0]), easing: 'linear', fill: 'both' });

      /* paused until the page has painted, exactly as h:rs */
      all.forEach(function (a) { a.pause(); a.currentTime = 0; });
      var begin = function () {
        if (begin.done) return;
        begin.done = true;
        all.forEach(function (a) { a.play(); });
        last.finished.then(done, done);
        setTimeout(done, d(tl.reveal[1]) + 400);
        setTimeout(done, d(tl.reveal[1]) + 2000);
      };
      requestAnimationFrame(function () { requestAnimationFrame(begin); });
      setTimeout(begin, 400);
    }
  }

  /* ================================================================
     THE FOURTH — its own post, CI p.30 ("centered placement"), on VOID
     BLACK (CI p.21). Same frame and exit as Moray; the pieces are the
     client's own logo file (the-fourth-logo-white.svg), whose three
     groups are FOURTH (F, O, U, RTH), THE, and LEVEL OF BUSINESS.

       1. THE LINE draws across the frame at the F's crossbar — CI p.19:
          "match the line thickness to the horizontal stroke of the F;
          align the line as a natural extension of the F" — and lands in
          the post's red squares at both edges.
       2. FOURTH RISES out of it, letter by letter, each from its own
          baseline: "the place where ambition rises" (CI p.8). Once the
          letters stand, the line between them goes, leaving the two
          stubs the post draws: square to F, H to square.
       3. THE settles on top; LEVEL OF BUSINESS is written on.
       4. The post's foot: BY/ MAIN MARKS MORAY, 1ST MARK / NEW CAIRO.
     The line's height and thickness are READ off the F's own outline
     (its left-most points), never typed.
     ================================================================ */
  var TF = {
    line:     [0, 480],
    squares:  [380, 640],
    letter:   [440, 960],
    step:     90,
    swap:     [1060, 1260],
    the:      [1040, 1340],
    lob:      [1180, 1600],
    foot:     [1380, 1700],
    markOut:  [2200, 2340],
    reveal:   [2320, 2680]
  };

  function runFourth(p, n, mark, src, done) {
    var lock = n.querySelector('.mb-lock');
    if (!lock || !root.fetch || !root.DOMParser) { fade(n, done); return; }
    root.fetch(src).then(function (r) {
      if (!r.ok) throw new Error('logo ' + r.status);
      return r.text();
    }).then(function (text) {
      var doc = new root.DOMParser().parseFromString(text, 'image/svg+xml');
      var vb = (doc.documentElement.getAttribute('viewBox') || '').split(/\s+/).map(Number);
      var groups = Array.prototype.slice.call(doc.documentElement.children)
        .filter(function (x) { return x.tagName === 'g'; });
      if (vb.length !== 4 || vb.some(isNaN) || groups.length < 3) throw new Error('logo shape');
      play(vb, groups);
    }).catch(function () { fade(n, done); });

    function play(vb, groups) {
      var NS = 'http://www.w3.org/2000/svg';
      /* measure every shape with the browser's own geometry: the file
         mixes polygons and relative path commands */
      var probe = document.createElementNS(NS, 'svg');
      probe.setAttribute('viewBox', vb.join(' '));
      probe.setAttribute('style', 'position:absolute;left:-9999px;top:0;width:1006px;height:347px;visibility:hidden');
      document.body.appendChild(probe);
      function shapes(g) {
        return Array.prototype.slice.call(g.children).map(function (s) {
          var c = document.importNode(s, true);
          c.removeAttribute('class');
          c.setAttribute('fill', '#FFFFFF');
          probe.appendChild(c);
          var b = c.getBBox();
          return { node: c, x0: b.x, x1: b.x + b.width, y0: b.y, y1: b.y + b.height };
        });
      }
      /* which group is which, by where it sits: THE on top, LEVEL OF
         BUSINESS at the foot, FOURTH (the tallest) between */
      var sets = groups.map(shapes);
      function span(list) {
        return { y0: Math.min.apply(null, list.map(function (s) { return s.y0; })),
                 y1: Math.max.apply(null, list.map(function (s) { return s.y1; })) };
      }
      sets.sort(function (a, b) { return span(a).y0 - span(b).y0; });
      var THE = sets[0], FOURTH = sets[1], LOB = sets[2];
      FOURTH.sort(function (a, b) { return a.x0 - b.x0; });
      var F = FOURTH[0], LAST = FOURTH[FOURTH.length - 1];
      /* the crossbar: the F's left-most points (the stroke the CI extends) */
      var fpts = (F.node.getAttribute('points') || '').trim().split(/[\s,]+/).map(Number);
      var cy0 = Infinity, cy1 = -Infinity;
      for (var i = 0; i + 1 < fpts.length; i += 2) {
        if (fpts[i] <= F.x0 + 1) { cy0 = Math.min(cy0, fpts[i + 1]); cy1 = Math.max(cy1, fpts[i + 1]); }
      }
      if (!(cy1 > cy0)) { cy0 = F.y0 + (F.y1 - F.y0) * 0.37; cy1 = cy0 + (F.y1 - F.y0) * 0.25; }

      document.documentElement.classList.add('mb-running');
      if (mark.ground && /^#[0-9a-f]{6}$/i.test(mark.ground)) n.style.background = mark.ground;
      var red = /^#[0-9a-f]{6}$/i.test(mark.red || '') ? mark.red : '#D74E3C';

      var stage = el('div', 'mb-stage mb-f4');
      stage.style.aspectRatio = vb[2] + ' / ' + vb[3];
      var fx = function (x) { return (x - vb[0]) / vb[2]; };
      var fy = function (y) { return (y - vb[1]) / vb[3]; };

      function glyphs(list) {
        var s = document.createElementNS(NS, 'svg');
        s.setAttribute('viewBox', vb.join(' '));
        s.setAttribute('class', 'mb-glyph');
        s.setAttribute('preserveAspectRatio', 'none');
        list.forEach(function (b) { s.appendChild(b.node.cloneNode(true)); });
        return s;
      }
      /* a window the width of a shape, from the top of the file to the
         shape's foot, so the shape rises from its own baseline */
      function windowed(b, padX) {
        var x0 = Math.max(0, fx(b.x0) - padX), x1 = Math.min(1, fx(b.x1) + padX);
        var pw = x1 - x0, hf = Math.min(1, fy(b.y1) + 0.004);
        var w = el('span', 'mb-part');
        w.style.left = (x0 * 100).toFixed(4) + '%';
        w.style.width = (pw * 100).toFixed(4) + '%';
        w.style.top = '0';
        w.style.height = (hf * 100).toFixed(4) + '%';
        var s = glyphs([b]);
        s.style.width = (100 / pw).toFixed(4) + '%';
        s.style.left = (-x0 / pw * 100).toFixed(4) + '%';
        s.style.height = (100 / hf).toFixed(4) + '%';
        w.appendChild(s);
        stage.appendChild(w);
        return { wrap: w, ink: s };
      }
      function full100(s) { s.style.width = '100%'; s.style.left = '0'; return s; }
      var letters = FOURTH.map(function (b) { return windowed(b, 0.003); });
      var the = el('span', 'mb-part mb-f4-the');
      the.style.cssText = 'left:0;top:0;width:100%;height:100%';
      the.appendChild(full100(glyphs(THE)));
      stage.appendChild(the);
      var lob = el('span', 'mb-part mb-f4-lob');
      lob.style.cssText = 'left:0;top:0;width:100%;height:100%';
      lob.appendChild(full100(glyphs(LOB)));
      stage.appendChild(lob);
      probe.parentNode.removeChild(probe);

      /* the line and the squares live in the FRAME, so they can reach its
         edges; positioned from the stage's own box and the crossbar */
      lock.appendChild(stage);
      var L = lock.getBoundingClientRect(), S = stage.getBoundingClientRect();
      if (!L.width || !S.width) { fade(n, done); return; }
      var pct = function (v, of) { return (v / of * 100).toFixed(4) + '%'; };
      var top = S.top - L.top + S.height * fy(cy0), th = S.height * (fy(cy1) - fy(cy0));
      var fLeft = S.left - L.left + S.width * fx(F.x0);
      var hRight = S.left - L.left + S.width * fx(LAST.x1);
      function bar(cls, left, right) {
        var b = el('span', 'mb-f4line ' + cls);
        b.style.top = pct(top, L.height);
        b.style.height = pct(th, L.height);
        b.style.left = pct(left, L.width);
        b.style.right = pct(L.width - right, L.width);
        lock.appendChild(b);
        return b;
      }
      var full = bar('mb-f4-full', 0, L.width);
      var stubL = bar('mb-f4-stub', 0, fLeft);
      var stubR = bar('mb-f4-stub', hRight, L.width);
      /* the post's squares: 5.1% of the post wide, 20.3% of the logo tall,
         centred on the crossbar (measured off CI p.30 for the card) */
      var sqH = S.height * 0.203, mid = top + th / 2;
      var sqs = ['l', 'r'].map(function (side) {
        var q = el('span', 'mb-f4sq mb-f4sq-' + side);
        q.style.background = red;
        q.style.top = pct(mid - sqH / 2, L.height);
        q.style.height = pct(sqH, L.height);
        lock.appendChild(q);
        return q;
      });

      /* the post's foot */
      var by = el('div', 'mb-f4foot mb-f4by');
      by.appendChild(document.createTextNode('BY/'));
      [[mark.byline, 'mb-f4by-mm'], [mark.moray, 'mb-f4by-moray']].forEach(function (x) {
        var s = safeSrc(x[0]);
        if (!s) return;
        var im = el('img', x[1]);
        im.alt = '';
        im.src = s;
        by.appendChild(im);
      });
      var mk = el('div', 'mb-f4foot mb-f4mark');
      ['1ST MARK /', 'NEW CAIRO'].forEach(function (w) { var sp = el('span'); sp.textContent = w; mk.appendChild(sp); });
      lock.appendChild(by);
      lock.appendChild(mk);
      lock.style.fontSize = (L.width * 0.028).toFixed(2) + 'px';

      if (reduced) {
        [stubL, stubR, sqs[0], sqs[1], by, mk].forEach(function (x) { x.style.opacity = 1; });
        full.style.opacity = 0;
        n.animate([{ opacity: 1 }, { opacity: 1, offset: 0.5 }, { opacity: 0 }],
                  { duration: 360, easing: 'ease-out', fill: 'forwards' }).finished.then(done, done);
        setTimeout(done, 700);
        return;
      }

      var d = function (ms) { return ms / SPEED; };
      var all = [];
      var add = function (node, frames, opts) { var a = node.animate(frames, opts); all.push(a); return a; };
      var at = function (r, extra, ease) {
        return { delay: d(r[0] + (extra || 0)), duration: d(r[1] - r[0]), easing: ease || EASE_OUT, fill: 'both' };
      };

      /* 1. the line, left to right, into the squares */
      add(full, [{ transform: 'scaleX(0)' }, { transform: 'none' }], at(TF.line, 0, EASE_DRAW));
      sqs.forEach(function (q, i) {
        add(q, [{ transform: 'scaleY(0)' }, { transform: 'none' }], at(TF.squares, i * 70, EASE_DRAW));
      });
      /* 2. FOURTH rises, F to H */
      letters.forEach(function (Lt, i) {
        add(Lt.ink, [{ transform: 'translateY(104%)' }, { transform: 'none' }], at(TF.letter, i * TF.step));
      });
      /* the line between the letters goes; the two stubs stay */
      add(full, [{ opacity: 1 }, { opacity: 0 }], at(TF.swap, 0, 'ease-out'));
      [stubL, stubR].forEach(function (s) {
        add(s, [{ opacity: 0 }, { opacity: 1 }], { delay: d(TF.swap[0]), duration: 1, fill: 'both' });
      });
      /* 3. THE settles on top; LEVEL OF BUSINESS is written on */
      add(the, [{ opacity: 0, transform: 'translateY(-6%)' }, { opacity: 1, transform: 'none' }], at(TF.the));
      add(lob, [{ clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0% 0 0)' }], at(TF.lob, 0, EASE_DRAW));
      /* 4. the foot */
      [by, mk].forEach(function (x, i) {
        add(x, [{ opacity: 0, transform: 'translateY(.4em)' }, { opacity: 1, transform: 'none' }], at(TF.foot, i * 80));
      });

      /* the lockup goes first, then the black dissolves — see h:rs */
      add(lock, [{ opacity: 1 }, { opacity: 0 }], at(TF.markOut, 0, 'ease-out'));
      var last = add(n, [{ opacity: 1 }, { opacity: 0 }], at(TF.reveal, 0, 'linear'));

      all.forEach(function (a) { a.pause(); a.currentTime = 0; });
      var begin = function () {
        if (begin.done) return;
        begin.done = true;
        all.forEach(function (a) { a.play(); });
        last.finished.then(done, done);
        setTimeout(done, d(TF.reveal[1]) + 400);
        setTimeout(done, d(TF.reveal[1]) + 2000);
      };
      requestAnimationFrame(function () { requestAnimationFrame(begin); });
      setTimeout(begin, 400);
    }
  }

  /* The plain way out, for a page that cannot play the lockup: the
     black simply lifts. */
  function fade(n, done) {
    if (!n.animate) { done(); return; }
    n.animate([{ opacity: 1 }, { opacity: 0 }],
              { duration: 260, easing: 'ease-out', fill: 'forwards' })
      .finished.then(done, done);
    setTimeout(done, 500);
  }

  MM.markbuild = { cross: cross, run: run };

}(window));
