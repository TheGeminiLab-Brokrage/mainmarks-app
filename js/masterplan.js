/* ------------------------------------------------------------------
   h:rs — the master plan, with the buildings selectable on it.

   The salesperson's real move is "which building is that one?", so the
   drawing is the control, not a picture beside one.

   HOW IT IS BUILT
   - The hotspots are POLYGONS IN FRACTIONS of the image (js/config.js),
     drawn into an SVG with viewBox "0 0 1 1" and preserveAspectRatio
     none. That makes every target scale exactly with the drawing at any
     width, on any phone, with no re-measuring — the fault that made a
     dot a speck on a zoomed plan on an earlier build.
   - Each building is a <a>-like button with a real accessible name, so
     it works from the keyboard as well as the thumb.
   - The count of AVAILABLE units per building is painted on when the
     inventory lands, because "which building" is really "which building
     has something I can sell".

   WHAT IT DOES NOT DO
   - It does not own the selection. It calls back; the unit panel owns
     what happens next, exactly as the floor list does.
   - It does not pin individual UNITS. That needs Main Marks' own
     full-resolution master plan with the unit numbers printed on it, and
     tracing 450 pins off a brochure crop would be inventing positions.
   ------------------------------------------------------------------ */

(function (root) {
  'use strict';

  var MM = root.MM || (root.MM = {});
  var NS = 'http://www.w3.org/2000/svg';

  function svgEl(tag, attrs) {
    var n = document.createElementNS(NS, tag);
    Object.keys(attrs || {}).forEach(function (k) { n.setAttribute(k, attrs[k]); });
    return n;
  }

  /* p: the project.  onPick: function(buildingId).
     Returns { node, setCounts, select } */
  function build(p, onPick) {
    var el = MM.el, t = MM.t;
    var mp = p.masterplan || {};
    var wrap = el('div', 'mplan');

    var img = new Image();
    img.src = mp.img;
    img.alt = t('{name} master plan', { name: p.name });
    wrap.appendChild(img);

    var svg = svgEl('svg', {
      viewBox: '0 0 1 1',
      preserveAspectRatio: 'none',
      class: 'mplan-hits'
    });
    svg.setAttribute('role', 'group');
    svg.setAttribute('aria-label', t('Buildings'));
    wrap.appendChild(svg);

    var shapes = {}, labels = {}, counts = {};
    var current = null;

    (mp.hotspots || []).forEach(function (h) {
      var g = svgEl('g', { class: 'mp-b', tabindex: '0', role: 'button' });
      g.setAttribute('aria-label', t('Building {b}', { b: h.id }));

      var poly = svgEl('polygon', {
        points: h.points.map(function (pt) { return pt[0] + ',' + pt[1]; }).join(' '),
        class: 'mp-shape'
      });
      g.appendChild(poly);
      svg.appendChild(g);

      /* The label sits at the polygon's centre, as a fraction of the
         picture, so it travels with the shape at any width. */
      var cx = h.points.reduce(function (s, pt) { return s + pt[0]; }, 0) / h.points.length;
      var cy = h.points.reduce(function (s, pt) { return s + pt[1]; }, 0) / h.points.length;

      /* Text is drawn in a second, unscaled layer: text inside a
         non-uniformly scaled viewBox is stretched with it. */
      var tag = el('button', 'mp-tag');
      tag.type = 'button';
      tag.style.left = (cx * 100) + '%';
      tag.style.top = (cy * 100) + '%';
      tag.appendChild(el('span', 'mp-id', h.id));
      var n = el('span', 'mp-n', '');
      tag.appendChild(n);
      wrap.appendChild(tag);

      function choose() { select(h.id); if (onPick) onPick(h.id); }
      g.addEventListener('click', choose);
      tag.addEventListener('click', choose);
      g.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); choose(); }
      });
      /* Hover on the shape lights the tag and the other way round, so the
         two halves of one target never look like two targets. */
      [g, tag].forEach(function (x) {
        x.addEventListener('mouseenter', function () { poly.classList.add('is-hot'); tag.classList.add('is-hot'); });
        x.addEventListener('mouseleave', function () { poly.classList.remove('is-hot'); tag.classList.remove('is-hot'); });
      });

      shapes[h.id] = poly;
      labels[h.id] = { tag: tag, n: n };
    });

    function select(id) {
      current = id;
      Object.keys(shapes).forEach(function (k) {
        shapes[k].classList.toggle('is-on', k === id);
        labels[k].tag.classList.toggle('is-on', k === id);
      });
    }

    /* counts: { HA: {available, total}, ... } */
    function setCounts(c) {
      counts = c || {};
      Object.keys(labels).forEach(function (k) {
        var e = counts[k];
        var avail = e ? e.available : 0;
        labels[k].n.textContent = e ? MM.t('{n} available', { n: avail }) : MM.t('none');
        labels[k].tag.classList.toggle('is-empty', !avail);
        if (shapes[k]) shapes[k].classList.toggle('is-empty', !avail);
      });
    }

    return { node: wrap, setCounts: setCounts, select: select };
  }

  MM.masterplan = { build: build };
}(typeof window !== 'undefined' ? window : globalThis));
