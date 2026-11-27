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
  function wireForm(f, err, ok) {
    if (!f) return;
    f.addEventListener('submit', async function (ev) {
      ev.preventDefault();
      if (err) err.style.display = 'none';
      if (ok) ok.style.display = 'none';

      var fd = new FormData(f);
      var payload = {};
      fd.forEach(function (v, k) { payload[k] = v; });

      var btn = f.querySelector('button[type=submit]');
      var old = btn ? btn.textContent : '';
      if (btn) { btn.disabled = true; btn.textContent = 'Sending…'; }

      try {
        var res = await fetch(f.action, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          if (ok) ok.style.display = 'block';
          f.reset();
        } else {
          var txt;
          try { txt = (await res.json()).error; } catch (_) { txt = null; }
          if (!txt) txt = 'Something went wrong. Please email info@webbcareconsultancy.com or call 07876 453800.';
          if (err) { err.textContent = txt; err.style.display = 'block'; }
        }
      } catch (e) {
        if (err) {
          err.textContent = 'Could not reach the server. Please email info@webbcareconsultancy.com or call 07876 453800.';
          err.style.display = 'block';
        }
      } finally {
        if (btn) { btn.disabled = false; btn.textContent = old || 'Send my enquiry'; }
      }
    });
  }
  wireForm(form, errEl, okEl);
  wireForm(
    document.getElementById('tell-us-form'),
    document.getElementById('tu-err'),
    document.getElementById('tu-ok')
  );

  // --- Click-to-play YouTube Shorts (privacy-enhanced nocookie embed) ---
  document.querySelectorAll('.short[data-video]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var id = btn.getAttribute('data-video');
      if (!id) return;
      var iframe = document.createElement('iframe');
      iframe.src = 'https://www.youtube-nocookie.com/embed/' + id + '?autoplay=1&rel=0';
      iframe.title = btn.getAttribute('aria-label') || 'YouTube Short';
      iframe.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture');
      iframe.setAttribute('allowfullscreen', '');
      iframe.className = 'short__frame';
      btn.replaceWith(iframe);
    });
  });

  // --- Try it now — fills a template preview, no server call ---
  var tryForm = document.getElementById('try-now-form');
  if (tryForm) {
    tryForm.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var biz   = (document.getElementById('try-biz').value   || '').trim();
      var trade = (document.getElementById('try-trade').value || '').trim();
      var town  = (document.getElementById('try-town').value  || '').trim();
      if (!biz || !trade || !town) return;
      var cap = function (s) { return s.charAt(0).toUpperCase() + s.slice(1); };
      document.getElementById('try-pv-brand').textContent = biz;
      document.getElementById('try-pv-kicker').textContent = cap(trade) + ' · Local · Trusted';
      document.getElementById('try-pv-headline').textContent = cap(trade) + ' services in ' + cap(town) + '.';
      document.getElementById('try-pv-sub').textContent = biz + ' — friendly, dependable ' + trade.toLowerCase() + ' work across ' + cap(town) + ' and the surrounding area. Honest advice, work done properly, first time.';
      var pv = document.getElementById('try-now-preview');
      pv.hidden = false;
      pv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
  }

  // --- Talk to us (floating widget) ---
  // Retell voice/avatar host: when the <script id="retell-widget"> actually
  // loads (i.e. its `src` attribute is set, not the on-hold placeholder),
  // the shop's own "Talk to us" pill hides so Retell's FAB is the only
  // bottom-right CTA. See src/index.html head for activation steps.
  var retellTag = document.getElementById('retell-widget');
  var retellActive = !!(retellTag && retellTag.src);
  var talkLauncher = document.getElementById('talk-launcher');
  var talkPanel    = document.getElementById('talk-panel');
  var talkClose    = document.getElementById('talk-close');
  var talkForm     = document.getElementById('talk-form');
  if (retellActive && talkLauncher) {
    talkLauncher.hidden = true;
    if (talkPanel) talkPanel.hidden = true;
  }
  if (talkLauncher && talkPanel) {
    function openTalk() {
      talkPanel.hidden = false;
      talkPanel.classList.add('is-open');
      talkLauncher.setAttribute('aria-expanded', 'true');
    }
    function closeTalk() {
      talkPanel.classList.remove('is-open');
      talkLauncher.setAttribute('aria-expanded', 'false');
      setTimeout(function () {
        if (!talkPanel.classList.contains('is-open')) talkPanel.hidden = true;
      }, 220);
    }
    talkLauncher.addEventListener('click', function () {
      if (talkPanel.classList.contains('is-open')) closeTalk(); else openTalk();
    });
    if (talkClose) talkClose.addEventListener('click', closeTalk);
    document.addEventListener('keydown', function (ev) {
      if (ev.key === 'Escape' && talkPanel.classList.contains('is-open')) closeTalk();
    });
    // Close talk when user opens the full enquiry dialog from it
    talkPanel.querySelectorAll('[data-open-enquiry]').forEach(function (el) {
      el.addEventListener('click', function () { closeTalk(); });
    });
    // Wire the mini form through the same AJAX path
    wireForm(talkForm, document.getElementById('talk-err'), document.getElementById('talk-ok'));
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

  // --- What we build: expand/collapse in place + audio player ---
  var wb = document.getElementById('what-we-build');
  if (wb) {
    // Expand / collapse (no scroll jump — stable in-place reveal)
    wb.querySelectorAll('.wb-card__toggle').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var expanded = btn.getAttribute('aria-expanded') === 'true';
        var bodyId = btn.getAttribute('aria-controls');
        var body = bodyId ? document.getElementById(bodyId) : null;
        var card = btn.closest('.wb-card');
        var label = btn.querySelector('.wb-card__toggle-label');
        btn.setAttribute('aria-expanded', expanded ? 'false' : 'true');
        if (card) card.classList.toggle('is-open', !expanded);
        if (body) { if (expanded) { body.hidden = true; } else { body.hidden = false; } }
        if (label) {
          var original = label.getAttribute('data-original');
          if (!original) { label.setAttribute('data-original', label.textContent); original = label.textContent; }
          label.textContent = expanded ? original : 'Close';
        }
      });
    });

    // Audio: only one plays at a time, keyboard accessible, no autoplay.
    var audio = null;
    var current = null;
    var live = document.getElementById('wb-live');
    function stopCurrent() {
      if (audio) { try { audio.pause(); } catch (e) {} audio = null; }
      if (current) {
        current.classList.remove('is-playing');
        var lbl = current.querySelector('.wb-listen__label');
        if (lbl) {
          var orig = current.getAttribute('data-orig-label');
          if (orig) lbl.textContent = orig;
        }
        current = null;
      }
      if (live) live.textContent = '';
    }
    wb.querySelectorAll('.wb-listen').forEach(function (btn) {
      var lbl = btn.querySelector('.wb-listen__label');
      if (lbl) btn.setAttribute('data-orig-label', lbl.textContent);
      btn.addEventListener('click', function () {
        var src = btn.getAttribute('data-wb-audio');
        if (!src) return;
        if (current === btn) { stopCurrent(); return; }
        stopCurrent();
        audio = new Audio(src);
        current = btn;
        btn.classList.add('is-playing');
        if (lbl) lbl.textContent = 'Playing…';
        if (live) live.textContent = 'Playing audio.';
        audio.addEventListener('ended', stopCurrent);
        audio.addEventListener('error', stopCurrent);
        audio.play().catch(function () { stopCurrent(); });
      });
    });
  }
})();
