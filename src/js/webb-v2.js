// Webb Digital v2 — small script for nav, dialog and form.
(function () {
  'use strict';

  // --- Mobile nav toggle ---
  var nav = document.getElementById('nav');
  var burger = document.getElementById('nav-burger');
  if (burger && nav) {
    burger.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    // Close on link click (mobile)
    nav.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () {
        nav.classList.remove('open');
        burger.setAttribute('aria-expanded', 'false');
      });
    });
  }

  // --- Enquiry dialog ---
  var dialog = document.getElementById('enquiry-dialog');
  var dialogPanel = dialog ? dialog.querySelector('.dialog__panel') : null;
  var interestSel = document.getElementById('enq-interest');
  var closeBtn = document.getElementById('enq-close');
  var form = document.getElementById('enquiry-form');
  var errEl = document.getElementById('enq-err');
  var okEl = document.getElementById('enq-ok');
  var lastFocus = null;

  function openDialog(interest) {
    if (!dialog) return;
    lastFocus = document.activeElement;
    if (interest && interestSel) {
      for (var i = 0; i < interestSel.options.length; i++) {
        if (interestSel.options[i].value === interest) {
          interestSel.selectedIndex = i;
          break;
        }
      }
    }
    dialog.classList.add('is-open');
    dialog.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    setTimeout(function () {
      var first = dialog.querySelector('input,select,textarea,button');
      if (first) first.focus();
    }, 50);
  }

  function closeDialog() {
    if (!dialog) return;
    dialog.classList.remove('is-open');
    dialog.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    if (errEl) errEl.style.display = 'none';
    if (okEl) okEl.style.display = 'none';
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  // Bind every [data-open-enquiry] trigger
  document.addEventListener('click', function (ev) {
    var t = ev.target && ev.target.closest ? ev.target.closest('[data-open-enquiry]') : null;
    if (t) {
      ev.preventDefault();
      openDialog(t.getAttribute('data-interest') || 'General enquiry');
      return;
    }
    // Click backdrop to close
    if (ev.target === dialog) {
      closeDialog();
    }
  });
  if (closeBtn) closeBtn.addEventListener('click', closeDialog);
  document.addEventListener('keydown', function (ev) {
    if (ev.key === 'Escape' && dialog && dialog.classList.contains('is-open')) closeDialog();
  });

  // --- Form submit (AJAX) ---
  if (form) {
    form.addEventListener('submit', async function (ev) {
      ev.preventDefault();
      if (errEl) errEl.style.display = 'none';
      if (okEl) okEl.style.display = 'none';

      var fd = new FormData(form);
      var payload = {};
      fd.forEach(function (v, k) { payload[k] = v; });

      var btn = form.querySelector('button[type=submit]');
      var old = btn ? btn.textContent : '';
      if (btn) { btn.disabled = true; btn.textContent = 'Sending…'; }

      try {
        var res = await fetch(form.action, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          if (okEl) okEl.style.display = 'block';
          form.reset();
        } else {
          var txt;
          try { txt = (await res.json()).error; } catch (_) { txt = null; }
          if (!txt) txt = 'Something went wrong. Please email des@webbcareconsultancy.com or call 07876 453800.';
          if (errEl) { errEl.textContent = txt; errEl.style.display = 'block'; }
        }
      } catch (e) {
        if (errEl) {
          errEl.textContent = 'Could not reach the server. Please email des@webbcareconsultancy.com or call 07876 453800.';
          errEl.style.display = 'block';
        }
      } finally {
        if (btn) { btn.disabled = false; btn.textContent = old || 'Send my enquiry'; }
      }
    });
  }

  // --- Reveal-on-scroll (progressive enhancement) ---
  if ('IntersectionObserver' in window) {
    var reveals = document.querySelectorAll('.reveal');
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, { threshold: 0.12 });
    reveals.forEach(function (el) { io.observe(el); });
  }
})();
