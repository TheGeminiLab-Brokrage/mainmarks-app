/* ------------------------------------------------------------------
   Main Marks — the zoom-and-pan window.

   Taken from the CCR app (js/zoom.js there, build 122) with the namespace
   changed and nothing else: the same window the Ayyam masterplan uses, so
   the Moray line pages zoom and pan exactly as that page does.

   Written once and used by both drawings on the project page: the
   masterplan panel and the "where it is" plan inside a unit. They are
   the same thing, so they should not be two copies of the same eighty
   lines drifting apart.

   How it works, and why: zoom widens an inner canvas inside a fixed
   scrolling window rather than applying a CSS transform. Scrollbars,
   touch panning, and anything positioned on the plan in percentages all
   then work with no extra code.

   Zoom stops where the drawing stops being sharp. Past about 1.4x the
   image's own pixels it only gets blurrier, and a blurry plan in front
   of a customer is worse than no zoom at all.
   ------------------------------------------------------------------ */

(function () {
  'use strict';

  var C = window.MM || (window.MM = {});
  var LEVELS = [1, 1.5, 2, 3, 4];

  function makeZoom(o) {
    var view = o.view, canvas = o.canvas, img = o.img;
    var levels = o.levels || LEVELS;
    var zi = 0;
    var touch = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;

    function maxIndex() {
      if (!img.naturalWidth || !view.clientWidth) return levels.length - 1;
      var cap = Math.max(2, img.naturalWidth / view.clientWidth * 1.4);
      var m = 0;
      levels.forEach(function (L, i) { if (L <= cap + 1e-6) m = i; });
      return m;
    }

    function centre() {
      var w = canvas.offsetWidth || 1, h = canvas.offsetHeight || 1;
      return { x: (view.scrollLeft + view.clientWidth / 2) / w,
               y: (view.scrollTop + view.clientHeight / 2) / h };
    }

    function set(i, c) {
      c = c || centre();
      var top = maxIndex();
      zi = Math.max(0, Math.min(top, i));
      view.classList.toggle('zoomed', zi > 0);
      canvas.style.width = (levels[zi] * 100) + '%';
      /* keep the same point of the plan in the middle of the window */
      view.scrollLeft = c.x * canvas.offsetWidth - view.clientWidth / 2;
      view.scrollTop = c.y * canvas.offsetHeight - view.clientHeight / 2;
      if (o.read) o.read.textContent = Math.round(levels[zi] * 100) + '%';
      if (o.out) o.out.disabled = zi === 0;
      if (o.in) o.in.disabled = zi >= top;
      if (o.hint) {
        o.hint.textContent = zi > 0
          ? C.t(touch ? 'Swipe to move around the plan' : 'Drag to move around the plan') : '';
      }
      if (o.onZoom) o.onZoom(zi);
    }

    if (o.out) o.out.addEventListener('click', function () { set(zi - 1); });
    if (o.in) o.in.addEventListener('click', function () { set(zi + 1); });
    if (o.read) o.read.addEventListener('click', function () { set(0, { x: 0.5, y: 0.5 }); });

    view.addEventListener('keydown', function (e) {
      if (e.key === '+' || e.key === '=') { set(zi + 1); e.preventDefault(); }
      else if (e.key === '-' || e.key === '_') { set(zi - 1); e.preventDefault(); }
      else if (e.key === '0') { set(0, { x: 0.5, y: 0.5 }); e.preventDefault(); }
    });

    /* Mouse: drag to pan. Touch already pans by scrolling the window.
       o.blockDrag lets the caller keep a drag for itself — the view cone
       is dragged with the same button on the same surface. */
    /* A DRAG STARTS ONLY ONCE THE POINTER HAS MOVED (fixed 2026-09-16).
       This used to capture the pointer and preventDefault() on pointerdown,
       which is what makes a drag smooth -- and it also meant the browser
       never raised a click. So while the plan was zoomed in, clicking a
       building with a mouse did nothing at all: no pointerup on the ring, no
       click, no selection (Muhanad: "even when I zoom in and try to select a
       building it does not work"). Nothing was wrong with the buildings; the
       pan layer was eating every tap.

       Now the press is left alone, the drag arms itself after SLOP pixels of
       movement, and a click that follows a real drag is swallowed so panning
       never selects a building by accident. */
    var SLOP = 4;
    var drag = null, dragged = false;
    view.addEventListener('pointerdown', function (e) {
      if (e.pointerType !== 'mouse' || zi === 0 || e.button !== 0) return;
      if (o.blockDrag && o.blockDrag(e)) return;
      dragged = false;
      drag = { x: e.clientX, y: e.clientY, l: view.scrollLeft, t: view.scrollTop, id: e.pointerId, on: false };
    });
    view.addEventListener('pointermove', function (e) {
      if (!drag) return;
      var dx = e.clientX - drag.x, dy = e.clientY - drag.y;
      if (!drag.on) {
        if (Math.abs(dx) < SLOP && Math.abs(dy) < SLOP) return;   /* still a click, not a drag */
        drag.on = true;
        dragged = true;
        try { view.setPointerCapture(drag.id); } catch (err) { /* the pointer is already gone */ }
        view.classList.add('dragging');
      }
      view.scrollLeft = drag.l - dx;
      view.scrollTop = drag.t - dy;
      e.preventDefault();
    });
    var end = function () { drag = null; view.classList.remove('dragging'); };
    view.addEventListener('pointerup', end);
    view.addEventListener('pointercancel', end);
    /* the click that ends a drag must not also pick whatever is under the cursor */
    view.addEventListener('click', function (e) {
      if (!dragged) return;
      dragged = false;
      e.stopPropagation();
      e.preventDefault();
    }, true);

    return {
      set: set,
      index: function () { return zi; },
      centre: centre,
      max: maxIndex,
      levels: levels
    };
  }

  /* the minus / readout / plus control, so both panels get the same one */
  function zoomBar(label) {
    var el = C.el;
    var mk = function (name, path) {
      var b = el('button', 'mp-zbtn');
      b.type = 'button';
      b.title = name;
      b.setAttribute('aria-label', name);
      b.insertAdjacentHTML('beforeend',
        '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
        'stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="' + path + '"/></svg>');
      return b;
    };
    var box = el('div', 'mp-zoom');
    box.setAttribute('role', 'group');
    box.setAttribute('aria-label', label || C.t('Zoom'));
    var out = mk(C.t('Zoom out'), 'M5 12h14');
    var read = el('button', 'mp-zread', '100%');
    read.type = 'button';
    read.title = C.t('Reset to fit');
    read.setAttribute('aria-label', C.t('Zoom level — press to reset to fit'));
    read.setAttribute('aria-live', 'polite');
    var zin = mk(C.t('Zoom in'), 'M12 5v14M5 12h14');
    box.appendChild(out); box.appendChild(read); box.appendChild(zin);
    return { box: box, out: out, read: read, in: zin };
  }

  /* ---- a drawing, full size, inside the app ----------------------------
     Shared by the masterplan and the "where it is" plan inside a unit, for
     the same reason the zoom is shared: it is one behaviour, and two copies
     would drift.

     It does not copy the drawing. The live figure itself goes full screen,
     so everything on it keeps working -- the lit buildings and their counts,
     the unit's pin, the view cone and its handles. Controls that live
     outside the figure (the zoom bar, the cone's buttons) are MOVED into its
     header and footer while it is open and put back exactly where they were
     when it closes.

     Opens at 100%, the whole drawing (Muhanad, 2026-09-13). The zoom the
     panel had is restored on close.

       o.fig      the figure element that goes full screen
       o.view     its scrolling window (flex-fills the screen)
       o.zoom     the makeZoom() for that window
       o.head     nodes to carry into the header, beside Close
       o.foot     nodes to carry into a footer
       o.title    function returning the header text
       o.onOpen / o.onClose   optional hooks                           */
  function fullView(o) {
    var el = C.el;
    var on = false, saved = null, homes = [], holder = null;

    var head = el('div', 'fv-head');
    head.hidden = true;
    var title = el('p', 'fv-title', '');
    var slot = el('div', 'fv-slot');
    var close = el('button', 'fv-close', C.t('Close'));
    close.type = 'button';
    head.appendChild(title);
    head.appendChild(slot);
    head.appendChild(close);
    o.fig.insertBefore(head, o.fig.firstChild);

    var foot = el('div', 'fv-foot');
    foot.hidden = true;
    o.fig.appendChild(foot);

    /* remember where each carried node lives, with a marker left in its place */
    function carry(nodes, into) {
      (nodes || []).forEach(function (n) {
        if (!n || !n.parentNode) return;
        var mark = document.createComment('full-view');
        n.parentNode.insertBefore(mark, n);
        homes.push({ node: n, mark: mark });
        into.appendChild(n);
      });
    }
    function bringBack() {
      homes.forEach(function (h) {
        if (h.mark.parentNode) { h.mark.parentNode.insertBefore(h.node, h.mark); h.mark.parentNode.removeChild(h.mark); }
      });
      homes = [];
    }

    function open(trigger) {
      if (on) return;
      on = true;
      saved = { i: o.zoom.index(), c: o.zoom.centre(), trigger: trigger || document.activeElement,
                y: window.pageYOffset };
      /* Hold the figure's place. Lifted out to position:fixed, it left the page
         shorter, the phone clamped its scroll, and Close landed the user at the
         top of the app instead of where they were (Muhanad, 2026-09-13). */
      var fcs = getComputedStyle(o.fig);
      holder = el('div', 'fv-holder');
      holder.style.height = o.fig.offsetHeight + 'px';
      holder.style.marginTop = fcs.marginTop;
      holder.style.marginBottom = fcs.marginBottom;
      o.fig.parentNode.insertBefore(holder, o.fig);
      o.fig.classList.add('fv-on');
      document.documentElement.classList.add('fv-locked');
      carry(o.head, slot);
      carry(o.foot, foot);
      head.hidden = false;
      foot.hidden = !foot.childNodes.length;
      title.textContent = o.title ? o.title() : '';
      if (o.onOpen) o.onOpen();
      requestAnimationFrame(function () {
        o.zoom.set(0, { x: 0.5, y: 0.5 });
        close.focus();
      });
    }
    function shut() {
      if (!on) return;
      on = false;
      o.fig.classList.remove('fv-on');
      document.documentElement.classList.remove('fv-locked');
      head.hidden = true;
      foot.hidden = true;
      bringBack();
      if (holder && holder.parentNode) holder.parentNode.removeChild(holder);
      holder = null;
      var back = saved;
      var home = function () { if (back) window.scrollTo({ top: back.y, left: 0, behavior: 'instant' }); };
      home();
      requestAnimationFrame(function () {
        if (back) o.zoom.set(back.i, back.c);
        home();
      });
      if (o.onClose) o.onClose();
    }

    /* preventScroll: focusing the trigger must not undo the restored position */
    close.addEventListener('click', function () {
      var t = saved && saved.trigger;
      shut();
      if (t && t.focus) t.focus({ preventScroll: true });
    });
    /* On the figure, not the document: a unit's plan is built afresh every
       time a unit is opened, and document listeners would pile up. Focus is
       inside the figure while it is open (Close takes it), so Esc arrives. */
    o.fig.addEventListener('keydown', function (e) {
      if (on && e.key === 'Escape') {
        var t = saved && saved.trigger;
        shut();
        if (t && t.focus) t.focus({ preventScroll: true });
      }
    });

    return {
      open: open,
      close: shut,
      isOpen: function () { return on; },
      setTitle: function () { if (on) title.textContent = o.title ? o.title() : ''; }
    };
  }

  C.makeZoom = makeZoom;
  C.zoomBar = zoomBar;
  C.fullView = fullView;
}());
