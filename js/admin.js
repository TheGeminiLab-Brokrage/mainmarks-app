/* ------------------------------------------------------------------
   Main Marks — the admin's page (build 123). admin.html.

   WHO IT IS FOR. The one person at Main Marks who looks after the
   accounts (Muhanad, 2026-10-06: Nehal). She adds a person, hands him
   his email and first password, switches an account off when someone
   leaves and on again, moves a person to another team, resets a
   password, and keeps the list of brokerage companies.

   WHAT IT IS NOT. It is not security. Every button here calls a function
   in the store that asks "is this an admin?" itself; a person who opened
   this page without being one would see an empty page and be refused by
   every button (C:\Butterfly project\Main Marks Store, 02_functions.sql).

   NOTHING IS DELETED HERE, and there is no delete button on purpose: a
   person and a company are switched off, and everything they did stays.

   THE EMAIL IS SUGGESTED, NOT TYPED. It is built from the name and the
   role in the agreed pattern (first two names, then the role's ending).
   She can correct the spelling; the store refuses one whose ending does
   not match the role.

   THE PASSWORD IS SHOWN ONCE. The store makes it and keeps only a hash,
   so this page is the only moment anyone can read it.
   ------------------------------------------------------------------ */
(function () {
  'use strict';

  var MM = window.MM, t = MM.t, AR = MM.isArabic;
  var session = MM.auth.require('admin.html');
  if (!session) return;
  if (session.role !== 'admin') { location.replace('index.html'); return; }

  var $ = function (id) { return document.getElementById(id); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var nm = function (s) { return '<bdi>' + esc(s) + '</bdi>'; };

  var ENDING = { sales: 'sales', sales_manager: 'manager', director: 'director', cco: 'cco', admin: 'admin' };
  var ROLES = ['sales', 'sales_manager', 'admin'];            /* what she can make today; directors and the CCO come later */
  function roleName(r) { return t(((CONFIG.roles || {})[r] || {}).label || r); }

  /* what the store says when it refuses, in words */
  var WHY = {
    MM_EMAIL_PATTERN: 'This email does not fit the role. Check the part after the @.',
    MM_BAD_EMAIL: 'This email does not fit the role. Check the part after the @.',
    MM_EMAIL_TAKEN: 'Someone already has this email. Change the part before the @.',
    MM_STAFF_CODE_TAKEN: 'Someone already has this staff code.',
    MM_NO_TEAM: 'Choose the team.',
    MM_NO_NAME: 'Enter the name.',
    MM_NAME_TAKEN: 'This name is already on the list.',
    MM_NOT_YOURSELF: 'You cannot do this to your own account.',
    MM_NOT_ALLOWED: 'This account is not an admin account.',
    MM_NOT_SIGNED_IN: 'This account is not an admin account.'
  };
  function why(r) {
    var code = r && r.body && r.body.message;
    return t(WHY[code] || 'This could not be saved. Try again.');
  }

  /* ---- the store ------------------------------------------------------ */
  var people = [], teams = [], companies = [];
  function rpc(fn, body) { return MM.auth.call('/rest/v1/rpc/' + fn, { method: 'POST', body: body || {} }); }
  function load() {
    return Promise.all([
      rpc('mm_admin_people'),
      MM.auth.call('/rest/v1/mm_teams?select=id,name,manager_id&order=name'),
      MM.auth.call('/rest/v1/mm_companies?select=id,name,active,pending,proposed_by,merged_into&order=name')
    ]).then(function (r) {
      if (r[0].status !== 200 || r[1].status !== 200 || r[2].status !== 200) throw new Error('store');
      people = r[0].body; teams = r[1].body; companies = r[2].body;
    });
  }
  function person(id) { return people.filter(function (p) { return p.id === id; })[0] || null; }
  function team(id) { return teams.filter(function (x) { return x.id === id; })[0] || null; }

  /* ---- the email, from the name and the role -------------------------
     First two names, small letters, a dot between. "Abd el-Rahman Saleh"
     is abdelrahman.saleh: a particle joins the name it belongs to. */
  var PARTICLE = { abd: 1, abdel: 1, abdul: 1, el: 1, al: 1, abu: 1, abo: 1 };
  function suggestEmail(name, role) {
    var words = String(name || '').toLowerCase().replace(/[^a-z\s-]/g, ' ').split(/\s+/).map(function (w) { return w.replace(/-/g, ''); }).filter(Boolean);
    var out = [], i = 0, w;
    while (i < words.length && out.length < 2) {
      w = words[i++];
      while (PARTICLE[w] && i < words.length) w += words[i++];
      out.push(w);
    }
    if (!out.length || !ENDING[role]) return '';
    return out.join('.') + '@mainmarks-' + ENDING[role] + '.com';
  }

  /* ---- the screen ----------------------------------------------------- */
  var tab = 'people', filter = 'all', find = '', opener = null;
  var ICON = {
    people: '<path d="M16 19v-1a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v1"/><circle cx="9.5" cy="7" r="3.5"/><path d="M21 19v-1a4 4 0 0 0-3-3.8M16 3.6a3.5 3.5 0 0 1 0 6.8"/>',
    companies: '<path d="M4 20V6l8-3v17M12 9h8v11M2 20h20M7 9v0M7 13v0M7 17v0M16 13v0M16 17v0"/>',
    me: '<circle cx="12" cy="8" r="4"/><path d="M4 20a8 8 0 0 1 16 0"/>',
    plus: '<path d="M12 5v14M5 12h14"/>'
  };
  function svg(k) { return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + ICON[k] + '</svg>'; }

  function head(h, sub) {
    return '<div class="hd my"><p class="eyebrow">' + nm(session.name) + ' · ' + t('Admin') + '</p><h1>' + h + '</h1></div>' + (sub ? '<p class="showing">' + sub + '</p>' : '');
  }
  function matches(text) { return !find || String(text).toLowerCase().indexOf(find.toLowerCase()) !== -1; }

  function personRow(p) {
    var bits = [p.title ? esc(p.title) : roleName(p.role), '<bdi>' + esc(p.email) + '</bdi>'];
    var flag = !p.active ? '<span class="adm-flag off">' + t('Switched off') + '</span>' : (p.must_change_password ? '<span class="adm-flag">' + t('First password') + '</span>' : '');
    /* build 127: how many company names he sent that turned out to be listed companies spelled differently */
    if (p.wrong_names > 0) flag += '<span class="adm-flag off">' + t('Wrong spellings: {n} of 3', { n: p.wrong_names }) + '</span>';
    return '<button class="row' + (p.active ? '' : ' gone') + '" type="button" data-p="' + esc(p.id) + '"><span class="nm">' + nm(p.name) + '</span><span class="sub">' + bits.join(' · ') + '</span><span class="val code">' + flag + '</span></button>';
  }
  function screenPeople() {
    var shown = people.filter(function (p) {
      if (filter === 'off' ? p.active : (filter !== 'all' && (p.role !== filter || !p.active))) return false;
      return matches(p.name + ' ' + p.email + ' ' + (p.staff_code || ''));
    });
    var on = people.filter(function (p) { return p.active; }).length;
    var html = head(t('People'), t('{n} accounts, {off} switched off', { n: '<b>' + people.length + '</b>', off: '<b>' + (people.length - on) + '</b>' })) +
      '<label class="fld adm-find"><input id="find" type="search" autocomplete="off" placeholder="' + esc(t('Find a name or an email')) + '" value="' + esc(find) + '"></label>' +
      '<div class="chips">' + [['all', t('Everyone')], ['sales', t('Sales agents')], ['sales_manager', t('Managers')], ['off', t('Switched off')]].map(function (c) { return '<button class="chip" type="button" data-f="' + c[0] + '" aria-pressed="' + (filter === c[0]) + '">' + c[1] + '</button>'; }).join('') + '</div>';
    teams.forEach(function (tm) {
      var mgr = person(tm.manager_id);
      var rows = shown.filter(function (p) { return p.team_id === tm.id; }).sort(function (a, b) { return (b.role === 'sales_manager') - (a.role === 'sales_manager') || a.name.localeCompare(b.name); });
      if (!rows.length && (find || filter !== 'all')) return;
      html += '<section class="card"><h2>' + nm(tm.name) + '<em>' + (mgr ? t('Manager: {name}', { name: nm(mgr.name) }) : t('No manager yet')) + '</em></h2>' +
        (rows.length ? '<div class="rows">' + rows.map(personRow).join('') + '</div>' : '<p class="note">' + t('Nobody is in this team yet.') + '</p>') +
        '<button class="also adm-link" type="button" data-team="' + esc(tm.id) + '">' + t('Change the manager') + '</button></section>';
    });
    var loose = shown.filter(function (p) { return !p.team_id || !team(p.team_id); });
    if (loose.length) html += '<section class="card"><h2>' + t('Not in a team') + '</h2><div class="rows">' + loose.map(personRow).join('') + '</div></section>';
    if (!shown.length) html += '<p class="note center">' + t('Nobody matches.') + '</p>';
    html += '<button class="btn ghost" type="button" id="addTeam">' + t('Add a team') + '</button>';
    return html;
  }
  function screenCompanies() {
    /* build 127: names sales agents sent that are not on the list wait here for her; a spelling she
       moved onto a listed company is not a company and is not listed */
    var waiting = companies.filter(function (c) { return c.pending; });
    var real = companies.filter(function (c) { return !c.pending && !c.merged_into; });
    var shown = real.filter(function (c) { return matches(c.name); });
    var on = real.filter(function (c) { return c.active; }).length;
    return head(t('Brokerage companies'), t('{n} companies, {off} switched off', { n: '<b>' + real.length + '</b>', off: '<b>' + (real.length - on) + '</b>' })) +
      (waiting.length ? '<section class="card"><h2>' + t('Waiting for your approval') + ' <em>' + waiting.length + '</em></h2><p class="note">' + t('Sales agents sent offers to these names, which are not on the list. Open each one and decide.') + '</p><div class="rows">' + waiting.map(function (c) {
        var by = person(c.proposed_by);
        return '<button class="row" type="button" data-c="' + esc(c.id) + '"><span class="nm">' + nm(c.name) + '</span><span class="sub">' + (by ? t('Sent by {name}', { name: nm(by.name) }) : '') + '</span><span class="val code"><span class="adm-flag">' + t('Decide') + '</span></span></button>';
      }).join('') + '</div></section>' : '') +
      '<label class="fld adm-find"><input id="find" type="search" autocomplete="off" placeholder="' + esc(t('Find a company')) + '" value="' + esc(find) + '"></label>' +
      (shown.length ? '<section class="card"><div class="rows">' + shown.map(function (c) {
        return '<button class="row' + (c.active ? '' : ' gone') + '" type="button" data-c="' + esc(c.id) + '"><span class="nm">' + nm(c.name) + '</span><span class="val code">' + (c.active ? '' : '<span class="adm-flag off">' + t('Switched off') + '</span>') + '</span></button>';
      }).join('') + '</div></section>' : '<p class="note center">' + (companies.length ? t('No company matches.') : t('No company is on the list yet. Add the first one with the plus.')) + '</p>');
  }
  function screenMe() {
    return head(t('Your account')) +
      '<section class="card"><div class="facts"><div><span>' + t('Name') + '</span><b>' + nm(session.name) + '</b></div><div><span>' + t('Email') + '</span><b><bdi>' + esc(session.email) + '</bdi></b></div>' +
      '<div><span>' + t('Language') + '</span><b><span class="chips"><button class="chip" type="button" data-lang="en" lang="en" aria-pressed="' + !AR + '">English</button><button class="chip" type="button" data-lang="ar" lang="ar" aria-pressed="' + AR + '">العربية</button></span></b></div></div>' +
      '<a class="btn ghost" href="login.html?change=1">' + t('Change password') + '</a><button class="btn ghost" type="button" id="out">' + t('Sign out') + '</button></section>' +
      '<section class="card"><h2>' + t('How this page works') + '</h2><p class="note">' + t('Nothing is ever deleted. A person who leaves is switched off: he can no longer sign in, and everything he recorded stays with his team. A company that is switched off leaves the lists and keeps its history.') + '</p>' +
      '<p class="note">' + t('A password is shown once, when the account is made or reset. Nobody can read it afterwards, not even here.') + '</p></section>';
  }
  function draw() {
    var keep = document.activeElement && document.activeElement.id === 'find';
    $('scr').innerHTML = tab === 'people' ? screenPeople() : tab === 'companies' ? screenCompanies() : screenMe();
    $('tab').innerHTML = [['people', t('People')], ['companies', t('Companies')], ['me', t('Account')]].map(function (x) {
      return '<button type="button" data-t="' + x[0] + '"' + (tab === x[0] ? ' aria-current="page"' : '') + '>' + svg(x[0]) + '<span>' + x[1] + '</span></button>';
    }).join('');
    $('tab').hidden = false;
    $('fab').hidden = tab === 'me';
    $('fab').innerHTML = svg('plus');
    $('fab').setAttribute('aria-label', tab === 'companies' ? t('Add a company') : t('Add a person'));
    if (keep) { var f = $('find'); f.focus(); f.setSelectionRange(f.value.length, f.value.length); }
  }

  /* ---- sheets ---------------------------------------------------------- */
  function showSheet(html) {
    if (!$('sheet').classList.contains('on')) opener = document.activeElement;
    $('sheet').innerHTML = '<span class="grab"></span><button class="x" id="closeSheet" type="button" aria-label="' + esc(t('Close')) + '">✕</button>' + html;
    $('sheet').scrollTop = 0;
    $('sheet').classList.add('on'); $('veil').classList.add('on');
    document.documentElement.classList.add('is-locked');
    $('closeSheet').addEventListener('click', closeSheet);
  }
  function closeSheet() {
    $('sheet').classList.remove('on'); $('veil').classList.remove('on');
    document.documentElement.classList.remove('is-locked');
    if (opener && document.contains(opener)) opener.focus({ preventScroll: true });
  }
  var toastT;
  function toast(msg) { var n = $('toast'); n.textContent = msg; n.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(function () { n.classList.remove('on'); }, 3200); }
  function bad(msg) { var n = $('aErr'); n.textContent = msg; n.hidden = false; }
  /* one save at a time: the button waits for the store's answer */
  function send(btn, call, then) {
    btn.disabled = true; $('aErr').hidden = true;
    call.then(function (r) {
      btn.disabled = false;
      if (r.status >= 300) return bad(why(r));
      then(r.body);
    }, function () { btn.disabled = false; bad(t('No connection. Try again when you are online.')); });
  }
  function again(msg) { return load().then(function () { draw(); if (msg) toast(msg); }); }

  function teamOptions(chosen, none) {
    return (none ? '<option value="">' + none + '</option>' : '') + teams.map(function (x) { return '<option value="' + esc(x.id) + '"' + (x.id === chosen ? ' selected' : '') + '>' + esc(x.name) + '</option>'; }).join('');
  }
  function roleChips(chosen) {
    return '<div class="chips" id="aRole">' + ROLES.map(function (r) { return '<button class="chip" type="button" data-role="' + r + '" aria-pressed="' + (r === chosen) + '">' + roleName(r) + '</button>'; }).join('') + '</div>';
  }

  /* THE PASSWORD, ONCE. With the message to pass on, ready to copy. */
  function showPassword(heading, p, password) {
    var msg = (AR ? ['تطبيق Main Marks', 'البريد الإلكتروني: ' + p.email, 'كلمة المرور: ' + password, 'يمكنك تغيير كلمة المرور بعد تسجيل الدخول.'] : ['Main Marks app', 'Email: ' + p.email, 'Password: ' + password, 'You can change the password after you sign in.']).join('\n');
    showSheet('<div><h3>' + heading + '</h3><p class="role">' + nm(p.name) + '</p></div><div class="form">' +
      '<div class="adm-pass"><span>' + t('Email') + '</span><b><bdi>' + esc(p.email) + '</bdi></b><span>' + t('Password') + '</span><b class="pw"><bdi id="aPw">' + esc(password) + '</bdi></b></div>' +
      '<p class="note bad">' + t('Copy it now. This password is shown once and cannot be read again.') + '</p>' +
      '<button class="btn" type="button" id="aCopy">' + t('Copy the message to send') + '</button><button class="btn ghost" type="button" id="aDone">' + t('Done') + '</button></div>');
    $('aCopy').addEventListener('click', function () {
      var ok = function () { toast(t('Copied. Paste it in a message to {name}.', { name: p.name })); };
      var old = function () { var x = document.createElement('textarea'); x.value = msg; document.body.appendChild(x); x.select(); try { document.execCommand('copy'); ok(); } catch (e) { toast(t('Copy it by hand: select the password.')); } x.remove(); };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(msg).then(ok, old); else old();
    });
    $('aDone').addEventListener('click', closeSheet);
  }

  function openAddPerson() {
    var role = 'sales', touched = false;
    if (!teams.length) return openTeam(null, t('Make the first team, then add its people.'));
    showSheet('<div><h3>' + t('Add a person') + '</h3><p class="role">' + t('The email is made from the name. The password is made for you and shown once.') + '</p></div><div class="form">' +
      roleChips(role) +
      '<label class="fld">' + t('Full name, in English letters') + '<input id="aName" type="text" autocomplete="off" autocapitalize="words" spellcheck="false"></label>' +
      '<div class="range"><label class="fld">' + t('Job title') + '<input id="aTitle" type="text" autocomplete="off"></label><label class="fld">' + t('Staff code') + '<input id="aStaff" type="text" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="MMD"></label></div>' +
      '<label class="fld" id="aTeamBox">' + t('Team') + '<select id="aTeam">' + teamOptions('', t('Choose the team')) + '</select></label>' +
      '<label class="fld">' + t('Sign-in email') + '<input id="aEmail" type="email" dir="ltr" autocomplete="off" autocapitalize="off" spellcheck="false"></label>' +
      '<p class="note" id="aHint"></p><p class="note bad" id="aErr" hidden></p><button class="btn" type="button" id="aSave">' + t('Make the account') + '</button></div>');
    function hint() {
      $('aTeamBox').hidden = role === 'admin';
      $('aHint').textContent = role === 'sales_manager' ? t('A manager sees his own team only. To make him the manager of a team, choose it here, then set him as its manager on the team.') : role === 'admin' ? t('An admin sees everything and can change every account. Add one only for someone you trust with that.') : t('A sales agent sees his own activity only.');
    }
    function suggest() { if (!touched) $('aEmail').value = suggestEmail($('aName').value, role); }
    $('aName').addEventListener('input', suggest);
    $('aEmail').addEventListener('input', function () { touched = !!$('aEmail').value; });
    $('aRole').addEventListener('click', function (e) {
      var b = e.target.closest('[data-role]'); if (!b) return;
      role = b.dataset.role;
      Array.prototype.forEach.call($('aRole').children, function (c) { c.setAttribute('aria-pressed', c === b); });
      /* the ending follows the role, even on an email she corrected by hand */
      var at = $('aEmail').value.split('@')[0];
      if (touched && at) $('aEmail').value = at + '@mainmarks-' + ENDING[role] + '.com'; else suggest();
      hint();
    });
    hint();
    $('aSave').addEventListener('click', function () {
      var name = $('aName').value.replace(/\s+/g, ' ').trim(), email = $('aEmail').value.trim().toLowerCase(), teamId = role === 'admin' ? null : ($('aTeam').value || null);
      if (!name) return bad(t('Enter the name.'));
      if (role === 'sales' && !teamId) return bad(t('Choose the team.'));
      if (!email) return bad(t('This email does not fit the role. Check the part after the @.'));
      send($('aSave'), rpc('mm_admin_add_person', { p_email: email, p_name: name, p_title: $('aTitle').value.trim(), p_staff: $('aStaff').value.trim() || null, p_role: role, p_team: teamId }), function (rows) {
        var made = rows[0];
        again().then(function () { showPassword(t('The account is made'), { name: name, email: email }, made.password); });
      });
    });
  }

  function openPerson(id) {
    var p = person(id); if (!p) return;
    var tm = team(p.team_id), self = p.id === session.id;
    showSheet('<div><h3>' + nm(p.name) + '</h3><p class="role">' + roleName(p.role) + (p.title ? ' · ' + esc(p.title) : '') + '</p></div><div class="form">' +
      '<div class="facts"><div><span>' + t('Sign-in email') + '</span><b><bdi>' + esc(p.email) + '</bdi></b></div><div><span>' + t('Team') + '</span><b>' + (tm ? nm(tm.name) : t('Not in a team')) + '</b></div>' +
      (p.staff_code ? '<div><span>' + t('Staff code') + '</span><b>' + nm(p.staff_code) + '</b></div>' : '') +
      '<div><span>' + t('Account') + '</span><b>' + (p.active ? (p.must_change_password ? t('On. Still using the first password.') : t('On')) : t('Switched off on {date}', { date: '<bdi>' + esc(p.left_on || '') + '</bdi>' })) + '</b></div></div>' +
      '<p class="note bad" id="aErr" hidden></p>' +
      '<button class="btn ghost" type="button" id="aEdit">' + t('Change the name, title, role or team') + '</button>' +
      '<button class="btn ghost" type="button" id="aReset">' + t('Reset the password') + '</button>' +
      (self ? '' : '<button class="btn' + (p.active ? ' ghost adm-danger' : '') + '" type="button" id="aOnOff">' + (p.active ? t('Switch this account off') : t('Switch this account on again')) + '</button>') +
      '<p class="note">' + (p.active ? t('Switching off stops the sign-in at once. Nothing he recorded is removed.') : t('Switched off: he cannot sign in. Everything he recorded is still with his team.')) + '</p></div>');
    $('aEdit').addEventListener('click', function () { openEdit(p); });
    $('aReset').addEventListener('click', function () {
      if (!window.confirm(t('Make a new password for {name}? The one he has stops working.', { name: p.name }))) return;
      send($('aReset'), rpc('mm_admin_reset_password', { p_person: p.id }), function (pw) { again().then(function () { showPassword(t('A new password'), p, pw); }); });
    });
    if ($('aOnOff')) $('aOnOff').addEventListener('click', function () {
      if (p.active && !window.confirm(t('Switch off {name}? He will not be able to sign in.', { name: p.name }))) return;
      send($('aOnOff'), rpc('mm_admin_set_active', { p_person: p.id, p_active: !p.active }), function () {
        closeSheet(); again(p.active ? t('{name} is switched off.', { name: p.name }) : t('{name} can sign in again.', { name: p.name }));
      });
    });
  }

  function openEdit(p) {
    var role = p.role, self = p.id === session.id;
    showSheet('<div><h3>' + nm(p.name) + '</h3><p class="role">' + t('The sign-in email does not change. What he sees follows the role chosen here.') + '</p></div><div class="form">' +
      (self ? '' : roleChips(role)) +
      '<label class="fld">' + t('Full name, in English letters') + '<input id="aName" type="text" autocomplete="off" value="' + esc(p.name) + '"></label>' +
      '<label class="fld">' + t('Job title') + '<input id="aTitle" type="text" autocomplete="off" value="' + esc(p.title) + '"></label>' +
      '<label class="fld" id="aTeamBox">' + t('Team') + '<select id="aTeam">' + teamOptions(p.team_id, t('Not in a team')) + '</select></label>' +
      '<p class="note">' + t('Moving a person to another team moves everything he recorded with him: his new manager sees it, his old manager no longer does.') + '</p>' +
      '<p class="note bad" id="aErr" hidden></p><button class="btn" type="button" id="aSave">' + t('Save') + '</button></div>');
    if ($('aRole')) $('aRole').addEventListener('click', function (e) {
      var b = e.target.closest('[data-role]'); if (!b) return;
      role = b.dataset.role;
      Array.prototype.forEach.call($('aRole').children, function (c) { c.setAttribute('aria-pressed', c === b); });
    });
    $('aSave').addEventListener('click', function () {
      var name = $('aName').value.replace(/\s+/g, ' ').trim(), teamId = $('aTeam').value || null;
      if (!name) return bad(t('Enter the name.'));
      if (role === 'sales' && !teamId) return bad(t('Choose the team.'));
      send($('aSave'), rpc('mm_admin_set_person', { p_person: p.id, p_name: name, p_title: $('aTitle').value.trim(), p_role: role, p_team: teamId }), function () { closeSheet(); again(t('Saved.')); });
    });
  }

  /* a team: its name and who manages it. tm null = a new team. */
  function openTeam(tm, lead) {
    var managers = people.filter(function (p) { return p.active && p.role === 'sales_manager'; });
    showSheet('<div><h3>' + (tm ? nm(tm.name) : t('Add a team')) + '</h3><p class="role">' + (lead || t('A team is one sales manager and the people under him. He sees his own team only.')) + '</p></div><div class="form">' +
      (tm ? '' : '<label class="fld">' + t('Team name') + '<input id="aName" type="text" autocomplete="off"></label>') +
      '<label class="fld">' + t('Its manager') + '<select id="aMgr"><option value="">' + t('No manager yet') + '</option>' + managers.map(function (p) { return '<option value="' + esc(p.id) + '"' + (tm && tm.manager_id === p.id ? ' selected' : '') + '>' + esc(p.name) + '</option>'; }).join('') + '</select></label>' +
      (managers.length ? '' : '<p class="note">' + t('There is no sales manager account yet. Make the team now and choose its manager after you add him.') + '</p>') +
      '<p class="note bad" id="aErr" hidden></p><button class="btn" type="button" id="aSave">' + (tm ? t('Save') : t('Make the team')) + '</button></div>');
    $('aSave').addEventListener('click', function () {
      var mgr = $('aMgr').value || null;
      if (tm) return send($('aSave'), rpc('mm_admin_set_team', { p_team: tm.id, p_manager: mgr, p_director: null }), function () { closeSheet(); again(t('Saved.')); });
      var name = $('aName').value.replace(/\s+/g, ' ').trim();
      if (!name) return bad(t('Enter the name.'));
      send($('aSave'), rpc('mm_admin_add_team', { p_name: name, p_manager: mgr }), function () { closeSheet(); again(t('The team is made.')); });
    });
  }

  /* A NAME THAT IS NOT ON THE LIST (build 127). Two answers, and only hers: it is a new company (she
     may correct the name first), or it is a listed company spelled differently. The second moves every
     offer onto that company and counts against the agent who sent it: three, and he can no longer send
     to a company that is not on the list. */
  function openPending(c) {
    var by = person(c.proposed_by), who = by ? by.name : t('the sales agent');
    var listed = companies.filter(function (x) { return x.active && !x.pending; });
    showSheet('<div><h3>' + nm(c.name) + '</h3><p class="role">' + (by ? t('Sent by {name}', { name: nm(by.name) }) + ' · ' : '') + t('Not on the list yet') + '</p></div><div class="form">' +
      '<p class="sec">' + t('It is a new company') + '</p>' +
      '<label class="fld">' + t('Company name') + '<input id="aName" type="text" autocomplete="off" value="' + esc(c.name) + '"></label>' +
      '<button class="btn" type="button" id="aSave">' + t('Add it to the list') + '</button>' +
      '<p class="sec">' + t('It is a listed company, spelled differently') + '</p>' +
      '<label class="fld">' + t('Which company is it') + '<select id="aInto"><option value="">' + t('Choose a company') + '</option>' + listed.map(function (x) { return '<option value="' + esc(x.id) + '">' + esc(x.name) + '</option>'; }).join('') + '</select></label>' +
      '<p class="note">' + t('The offers move onto that company. This counts as a wrong spelling for {name}: {n} of 3. After three, {name} can no longer send to a company that is not on the list.', { name: nm(who), n: ((by && by.wrong_names) || 0) + 1 }) + '</p>' +
      '<button class="btn ghost adm-danger" type="button" id="aMerge">' + t('Move it to that company') + '</button>' +
      '<p class="note bad" id="aErr" hidden></p></div>');
    $('aSave').addEventListener('click', function () {
      var name = $('aName').value.replace(/\s+/g, ' ').trim();
      if (!name) return bad(t('Enter the name.'));
      send($('aSave'), rpc('mm_admin_set_company', { p_company: c.id, p_name: name, p_active: true }), function () { closeSheet(); again(t('{name} is on the list.', { name: name })); });
    });
    $('aMerge').addEventListener('click', function () {
      var into = $('aInto').value, target = companies.filter(function (x) { return x.id === into; })[0];
      if (!target) return bad(t('Choose which company it is.'));
      send($('aMerge'), rpc('mm_admin_merge_company', { p_company: c.id, p_into: into }), function (n) {
        closeSheet(); again(t('Moved to {company}. {name}: wrong spelling {n} of 3.', { company: target.name, name: who, n: n }));
      });
    });
  }

  function openCompany(c) {
    if (c && c.pending) return openPending(c);
    showSheet('<div><h3>' + (c ? nm(c.name) : t('Add a company')) + '</h3><p class="role">' + (c ? (c.active ? t('On the lists every sales agent chooses from.') : t('Switched off: it is not offered any more. Its history is kept.')) : t('It appears at once in every sales agent\'s list of companies.')) + '</p></div><div class="form">' +
      '<label class="fld">' + t('Company name') + '<input id="aName" type="text" autocomplete="off" value="' + esc(c ? c.name : '') + '"></label>' +
      '<p class="note bad" id="aErr" hidden></p><button class="btn" type="button" id="aSave">' + (c ? t('Save the name') : t('Add the company')) + '</button>' +
      (c ? '<button class="btn ghost' + (c.active ? ' adm-danger' : '') + '" type="button" id="aOnOff">' + (c.active ? t('Switch this company off') : t('Switch this company on again')) + '</button>' : '') + '</div>');
    $('aSave').addEventListener('click', function () {
      var name = $('aName').value.replace(/\s+/g, ' ').trim();
      if (!name) return bad(t('Enter the name.'));
      send($('aSave'), c ? rpc('mm_admin_set_company', { p_company: c.id, p_name: name, p_active: c.active }) : rpc('mm_admin_add_company', { p_name: name }), function () { closeSheet(); again(c ? t('Saved.') : t('{name} is on the list.', { name: name })); });
    });
    if ($('aOnOff')) $('aOnOff').addEventListener('click', function () {
      send($('aOnOff'), rpc('mm_admin_set_company', { p_company: c.id, p_name: c.name, p_active: !c.active }), function () { closeSheet(); again(c.active ? t('{name} is switched off.', { name: c.name }) : t('{name} is on the list.', { name: c.name })); });
    });
    if (!c) $('aName').focus();
  }

  /* ---- taps ------------------------------------------------------------ */
  document.addEventListener('click', function (e) {
    var hit = function (a) { return e.target.closest('[' + a + ']'); };
    var p = hit('data-p'), c = hit('data-c'), f = hit('data-f'), tb = e.target.closest('#tab [data-t]'), l = hit('data-lang'), tm = hit('data-team');
    if (e.target.closest('#veil')) closeSheet();
    else if (tb) { tab = tb.dataset.t; find = ''; draw(); window.scrollTo(0, 0); }
    else if (p) openPerson(p.dataset.p);
    else if (c) openCompany(companies.filter(function (x) { return x.id === c.dataset.c; })[0]);
    else if (tm) openTeam(team(tm.dataset.team));
    else if (f) { filter = f.dataset.f; draw(); }
    else if (l) { if (l.dataset.lang !== MM.lang) MM.setLang(l.dataset.lang); }
    else if (e.target.closest('#addTeam')) openTeam(null);
    else if (e.target.closest('#fab')) { if (tab === 'companies') openCompany(null); else openAddPerson(); }
    else if (e.target.closest('#out')) { MM.auth.signOut(); location.replace('login.html'); }
  });
  document.addEventListener('input', function (e) { if (e.target.id === 'find') { find = e.target.value; draw(); } });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeSheet(); });

  /* for the check script: the email rule, without a browser tap */
  MM.adminSuggestEmail = suggestEmail;

  $('scr').innerHTML = '<p class="note center">' + t('Opening the accounts…') + '</p>';
  load().then(function () { $('scr').classList.add('in'); draw(); }, function () {
    $('scr').innerHTML = '<p class="note center">' + t('The accounts could not be opened. Check the connection and open the page again.') + '</p><button class="btn ghost" type="button" id="out">' + t('Sign out') + '</button>';
  });
}());
