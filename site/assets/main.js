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

  // Analytics consent. Only active when the build sets data-ga; GA loads after "אישור" and never before.
  var gaId = root.getAttribute('data-ga');
  var consent = document.getElementById('consent');
  if (gaId && consent) {
    var getChoice = function () { try { return localStorage.getItem('consent'); } catch (e) { return null; } };
    var loadGa = function () {
      if (window.gtag) return;
      window.gtag = function () { window.dataLayer.push(arguments); };
      window.gtag('js', new Date());
      window.gtag('config', gaId);
      var s = document.createElement('script');
      s.async = true;
      s.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(gaId);
      document.head.appendChild(s);
    };
    var clearGaCookies = function () {
      var host = location.hostname.replace(/^www\./, '');
      document.cookie.split(';').forEach(function (c) {
        var name = c.split('=')[0].trim();
        if (name.indexOf('_ga') !== 0) return;
        ['', '; domain=' + host, '; domain=.' + host].forEach(function (d) {
          document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/' + d;
        });
      });
    };
    var opener = null;
    // The accessibility button floats above the banner while it is open, so it stays reachable.
    var syncConsentHeight = function () {
      root.style.setProperty('--consent-h', consent.hidden ? '0px' : consent.offsetHeight + 'px');
    };
    window.addEventListener('resize', syncConsentHeight);
    var showConsent = function () {
      opener = document.activeElement;
      consent.hidden = false;
      syncConsentHeight();
    };
    if (getChoice() === 'granted') loadGa();
    else if (getChoice() !== 'denied') showConsent();
    consent.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-consent]');
      if (!btn) return;
      var choice = btn.getAttribute('data-consent');
      try { localStorage.setItem('consent', choice); } catch (err) {}
      var hadFocus = consent.contains(document.activeElement);
      consent.hidden = true;
      syncConsentHeight();
      if (choice === 'granted') loadGa();
      else {
        clearGaCookies();
        // GA already running on this page keeps its in-memory state; reload so it is gone.
        if (window.gtag) { location.reload(); return; }
      }
      if (hadFocus && opener && opener.classList && opener.classList.contains('consent-open')) opener.focus();
    });
    document.querySelectorAll('.consent-open').forEach(function (b) {
      b.addEventListener('click', function () {
        showConsent();
        consent.querySelector('button').focus();
      });
    });
  }
  // GA4 (gtag) ignores {event: ...} objects, so each event also goes through gtag once consent has loaded it.
  // Phone and WhatsApp clicks share one GA event each; click_detail says which button.
  function track(name, params) {
    window.dataLayer.push(Object.assign({ event: name }, params));
    if (!window.gtag) return;
    var gaName = /^click_phone_/.test(name) ? 'phone_click' : /^click_whatsapp_/.test(name) ? 'whatsapp_click' : name;
    window.gtag('event', gaName, Object.assign({ click_detail: name }, params));
  }
  document.addEventListener('click', function (e) {
    var el = e.target.closest('[data-event]');
    if (el) track(el.getAttribute('data-event'));
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
    track('form_submit', { service_type: v('f-service') });
    window.location.href = 'mailto:dritamarfeldman@gmail.com?subject=' +
      encodeURIComponent('פנייה מהאתר: ' + v('f-service')) + '&body=' + encodeURIComponent(body);
    var status = document.getElementById('form-status');
    status.hidden = false;
    status.focus();
  });
})();
