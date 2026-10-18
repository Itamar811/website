// Mobile menu, conversion-event hooks, contact form (mailto until a form service is connected).
(function () {
  // Safari skips links and buttons on Tab unless the user turns on full keyboard access.
  // An explicit tabindex puts them back in the Tab order for every visitor.
  document.querySelectorAll('a[href]:not([tabindex]), button:not([tabindex])').forEach(function (el) {
    el.setAttribute('tabindex', '0');
  });

  var toggle = document.querySelector('.menu-toggle');
  var nav = document.getElementById('main-nav');
  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('open')) {
        nav.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
        toggle.focus();
      }
    });
  }

  // Mobile action bar: call / WhatsApp open a small chooser sheet.
  var sheets = document.querySelectorAll('.sheet');
  function closeSheets() {
    var opener = document.querySelector('.sheet-toggle[aria-expanded="true"]');
    var focusInside = opener && document.activeElement && document.activeElement.closest('.sheet');
    sheets.forEach(function (s) { s.hidden = true; });
    document.querySelectorAll('.sheet-toggle').forEach(function (b) { b.setAttribute('aria-expanded', 'false'); });
    if (focusInside) opener.focus(); // return keyboard focus to the button that opened the sheet
  }
  document.querySelectorAll('.sheet-toggle').forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      var sheet = document.getElementById(btn.getAttribute('aria-controls'));
      var wasOpen = !sheet.hidden;
      closeSheets();
      if (!wasOpen) { sheet.hidden = false; btn.setAttribute('aria-expanded', 'true'); sheet.querySelector('a').focus(); }
    });
  });
  document.querySelectorAll('.sheet-close').forEach(function (b) { b.addEventListener('click', closeSheets); });
  document.addEventListener('click', function (e) { if (!e.target.closest('.sheet')) closeSheets(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeSheets(); });
  // Keyboard users who Tab out of an open sheet: close it so it does not cover the content they move to.
  sheets.forEach(function (s) {
    s.addEventListener('focusout', function (e) {
      var to = e.relatedTarget;
      if (to && !s.contains(to) && !to.closest('.sheet-toggle')) closeSheets();
    });
  });

  // Accessibility panel: high contrast, link highlighting, larger text. Remembered per browser.
  var root = document.documentElement;
  var a11yBtn = document.querySelector('.a11y-toggle');
  var a11yPanel = document.getElementById('a11y-panel');
  function saveA11y() {
    var on = [];
    ['contrast', 'links', 'text'].forEach(function (k) { if (root.classList.contains('a11y-' + k)) on.push(k); });
    try { localStorage.setItem('a11y', JSON.stringify(on)); } catch (e) {}
  }
  function syncA11y() {
    document.querySelectorAll('.a11y-opt').forEach(function (b) {
      b.setAttribute('aria-pressed', root.classList.contains('a11y-' + b.dataset.a11y) ? 'true' : 'false');
    });
  }
  function closeA11y(returnFocus) {
    if (!a11yPanel || a11yPanel.hidden) return;
    a11yPanel.hidden = true;
    a11yBtn.setAttribute('aria-expanded', 'false');
    if (returnFocus) a11yBtn.focus();
  }
  if (a11yBtn && a11yPanel) {
    syncA11y();
    a11yBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      if (a11yPanel.hidden) {
        closeSheets();
        a11yPanel.hidden = false;
        a11yBtn.setAttribute('aria-expanded', 'true');
        a11yPanel.querySelector('button').focus();
      } else closeA11y(true);
    });
    a11yPanel.addEventListener('click', function (e) {
      e.stopPropagation();
      var opt = e.target.closest('.a11y-opt');
      if (opt) { root.classList.toggle('a11y-' + opt.dataset.a11y); syncA11y(); saveA11y(); }
      if (e.target.closest('.a11y-reset')) {
        root.classList.remove('a11y-contrast', 'a11y-links', 'a11y-text'); syncA11y(); saveA11y();
      }
    });
    document.addEventListener('click', function () { closeA11y(false); });
    a11yPanel.addEventListener('focusout', function (e) {
      var to = e.relatedTarget;
      if (to && !a11yPanel.contains(to) && to !== a11yBtn) closeA11y(false);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeA11y(a11yPanel.contains(document.activeElement));
    });
  }

  // Conversion events (spec §65). Pushed to dataLayer; GA4/GTM picks them up once connected.
  window.dataLayer = window.dataLayer || [];
  document.addEventListener('click', function (e) {
    var el = e.target.closest('[data-event]');
    if (el) window.dataLayer.push({ event: el.getAttribute('data-event') });
  });

  var form = document.getElementById('contact-form');
  if (!form) return;
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (form.querySelector('.hp input').value) return; // spam honeypot
    var ok = true;
    form.querySelectorAll('[required], input[type="email"]').forEach(function (f) {
      var err = document.getElementById(f.id + '-error');
      var val = f.value.trim();
      var badEmail = f.type === 'email' && val && !/^\S+@\S+\.\S+$/.test(val);
      var bad = (f.required && !val) || badEmail;
      f.setAttribute('aria-invalid', bad ? 'true' : 'false');
      if (err) err.hidden = !bad;
      if (bad && ok) { f.focus(); ok = false; }
    });
    if (!ok) return;
    var v = function (id) { return document.getElementById(id).value.trim(); };
    var body = 'שם: ' + v('f-name') + '\nטלפון: ' + v('f-phone') + '\nדוא״ל: ' + v('f-email') +
      '\nסוג השירות: ' + v('f-service') + '\n\n' + v('f-message');
    window.dataLayer.push({ event: 'form_submit', service_type: v('f-service') });
    window.location.href = 'mailto:dritamarfeldman@gmail.com?subject=' +
      encodeURIComponent('פנייה מהאתר: ' + v('f-service')) + '&body=' + encodeURIComponent(body);
    var status = document.getElementById('form-status');
    status.hidden = false;
    status.focus();
  });
})();
