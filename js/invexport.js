/* ------------------------------------------------------------------
   Main Marks — THE INVENTORY, AS THE APP READS IT, for the admin.

   Build 155 put this download on the projects page for the managers,
   directors, the CCO and the admin. Build 197 (Muhanad, 25 Nov 2026: "the
   inventory export should only be in [the admin] view, where the admin
   account could have the option of exporting all the inventory accessible
   to the sales in the app") moved it here: it is on the admin page only.

   Build 198 (Muhanad, 25 Nov 2026: "the inventory that should be exported from the admin account should
   only be the available unit and the units on hold nothing else"): a unit is in the file only if the app
   offers it (status Available, with a price and a size: js/inventory.js `sellable`) or its status is On hold.
   Sold, reserved, blocked, not released, and an Available unit with no price, are left out. Fail closed:
   a status the app does not know is left out too.

   Main Marks Development, 11 Nov 2026: "Add a feature to extract the
   inventory periodically for validation." One Excel file, every row of the
   sheet the moment it is pressed, for every project a sales agent can open
   (released, `ready: true`, with an inventory): what the app read (code,
   building, floor, type, size, price, status) and what it makes of it (its
   block, its line, whether it is offered, whether its outline is traced,
   whether it gets the offer PDF, its delivery). One sheet per project.
   Nothing is written anywhere.

   Needs, loaded before it: config, i18n, plans, auth, inventory, pdf,
   unit-shapes, xlsx.
   ------------------------------------------------------------------ */
(function (root) {
  'use strict';
  var MM = root.MM = root.MM || {};

  /* the projects a sales agent can open, by the same rule as js/brand.js sellableProject: released only */
  function projects() {
    return ((typeof CONFIG !== 'undefined' && CONFIG.projects) || []).filter(function (p) { return p && p.ready === true && p.inventory; });
  }

  /* build 198: available (as the app offers it) or on hold, nothing else */
  function inFile(u) { return u.sellable === true || u.status === 'On hold'; }

  /* one project's rows and summary, read now */
  function readProject(p) {
    var t = MM.t;
    return MM.inventory.load(p.inventory).then(function (res) {
      var B = p.buildings || [];
      var rows = res.all.filter(inFile).map(function (u) {
        var x = Object.assign({}, u);
        x.fid = MM.inventory.floorId(u.floor);
        /* placed as the line page places it: a street shop in the block above it, a "B" unit in its block */
        var k = MM.plans.blockOf(p, u);
        if (k) {
          var shared = B.filter(function (y) { return (y.sheet || []).indexOf(u.building) !== -1; }).length;
          if (shared > 1) x.building = k.id;
          else if (!B.some(function (y) { return (y.sheet || []).indexOf(u.building) !== -1 || y.id === u.building; })) x.building = (k.sheet || [])[0] || k.id;
        }
        var line = MM.pdf ? MM.pdf.lineOf(p, x) : null, dm = MM.plans.termsFor(p, u).deliveryMonths;
        return [u.code, u.building, k ? k.id : '', u.floor, u.type, line ? line.name : '', u.area, u.areaFrom === 'plan' ? t('The floor plan') : t('The inventory'),
                u.listPrice, t(u.sellable ? 'Available' : 'On hold'), u.sellable ? t('Yes') : t('No'),
                (p.unitShapes || {})[u.code] ? t('Yes') : t('No'),
                u.sellable && MM.pdf && MM.pdf.can(p, x) ? t('Yes') : t('No'),
                dm ? dm / 12 : ''];
      });
      var n = function (f) { return rows.filter(f).length; };
      return {
        project: p,
        rows: rows,
        notes: res.problems || [],
        summary: [[t('Units in this file'), rows.length], [t('Available'), n(function (r) { return r[10] === t('Yes'); })],
                  [t('On hold'), n(function (r) { return r[10] !== t('Yes'); })], [t('With an outline on the drawing'), n(function (r) { return r[11] === t('Yes'); })],
                  [t('With the offer PDF'), n(function (r) { return r[12] === t('Yes'); })]]
      };
    });
  }

  function cols() {
    var t = MM.t;
    return [
      { h: t('Unit'), w: 10 }, { h: t('Building (inventory)'), w: 12 }, { h: t('Block'), w: 9 }, { h: t('Floor'), w: 10 }, { h: t('Type'), w: 11 },
      { h: t('Line'), w: 18 }, { h: t('Area m²'), type: 'int', w: 9 }, { h: t('Area from'), w: 13 }, { h: t('Price'), type: 'money', w: 14 },
      { h: t('Status'), w: 12 }, { h: t('Offered'), w: 9 }, { h: t('Outline'), w: 9 }, { h: t('Offer PDF'), w: 10 }, { h: t('Delivery, years'), type: 'int', w: 10 }];
  }

  /* reads every project, builds one workbook and hands it to the browser. Resolves with the file name;
     rejects if any project could not be read (no half file). */
  function download() {
    var t = MM.t, list = projects();
    if (!list.length || !MM.xlsx || !MM.inventory) return Promise.reject(new Error('nothing to read'));
    return Promise.all(list.map(readProject)).then(function (all) {
      var now = new Date(), one = all.length === 1;
      var name = one ? all[0].project.name : 'Main Marks';
      var report = {
        title: t('{name} inventory, as the app reads it', { name: name }),
        subtitle: t('Read {when}', { when: now.toLocaleString('en-GB') }),
        rtl: !!MM.isArabic,
        /* one project: its figures as they are; several: each line says whose */
        summary: [].concat.apply([], all.map(function (a) {
          return a.summary.map(function (s) { return [one ? s[0] : a.project.name + ' · ' + s[0], s[1]]; });
        })),
        notes: [].concat.apply([], all.map(function (a) { return a.notes.map(function (x) { return one ? x : a.project.name + ': ' + x; }); })),
        tables: all.map(function (a) { return { title: one ? t('Units') : a.project.name, cols: cols(), rows: a.rows }; })
      };
      var file = name + ' inventory - ' + now.toISOString().slice(0, 10) + '.xlsx';
      var blob = new Blob([MM.xlsx.workbook(report)], { type: MM.xlsx.type });
      /* inside a claude.ai link the frame cannot download: the page around it saves (artifact-frame-file-handover) */
      var w = root.parent, hook = null;
      try { hook = w && w !== root && w.MMsave; } catch (e) { hook = null; }
      if (!(typeof hook === 'function' && hook(blob, file) === true)) {
        var a = document.createElement('a'), url = URL.createObjectURL(blob);
        a.href = url; a.download = file; document.body.appendChild(a); a.click(); a.remove();
        setTimeout(function () { URL.revokeObjectURL(url); }, 60000);
      }
      return file;
    });
  }

  MM.invExport = { projects: projects, download: download };
}(window));
