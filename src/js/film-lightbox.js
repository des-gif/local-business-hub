(function () {
  'use strict';

  var OPEN_CLASS = 'webb-lb-open';
  var FALLBACK_HREF = '#contact';
  var FALLBACK_TEXT = 'Discuss your project';

  var current = null;
  var lastFocus = null;

  function pauseAllVideos() {
    var vids = document.querySelectorAll('video');
    for (var i = 0; i < vids.length; i++) {
      try { vids[i].pause(); } catch (_) {}
    }
  }

  function close() {
    if (!current) return;
    try {
      var v = current.querySelector('video');
      if (v) { try { v.pause(); } catch (_) {} v.removeAttribute('src'); try { v.load(); } catch (_) {} }
    } catch (_) {}
    current.remove();
    current = null;
    document.documentElement.classList.remove(OPEN_CLASS);
    document.removeEventListener('keydown', onKeydown, true);
    if (lastFocus && typeof lastFocus.focus === 'function') {
      try { lastFocus.focus(); } catch (_) {}
    }
    lastFocus = null;
  }

  function onKeydown(ev) {
    if (!current) return;
    if (ev.key === 'Escape' || ev.keyCode === 27) {
      ev.preventDefault();
      close();
      return;
    }
    if (ev.key === 'Tab' || ev.keyCode === 9) {
      var focusables = current.querySelectorAll('button, a[href], video, [tabindex]:not([tabindex="-1"])');
      if (!focusables.length) { ev.preventDefault(); return; }
      var first = focusables[0];
      var last = focusables[focusables.length - 1];
      var active = document.activeElement;
      if (ev.shiftKey && (active === first || !current.contains(active))) {
        ev.preventDefault();
        last.focus();
      } else if (!ev.shiftKey && (active === last || !current.contains(active))) {
        ev.preventDefault();
        first.focus();
      }
    }
  }

  function buildShell(title) {
    var backdrop = document.createElement('div');
    backdrop.className = 'webb-lb';
    backdrop.setAttribute('role', 'dialog');
    backdrop.setAttribute('aria-modal', 'true');
    if (title) backdrop.setAttribute('aria-label', title);
    backdrop.addEventListener('click', function (ev) {
      if (ev.target === backdrop) close();
    });

    var closer = document.createElement('button');
    closer.type = 'button';
    closer.className = 'webb-lb__close';
    closer.setAttribute('aria-label', 'Close');
    closer.innerHTML = '&times;';
    closer.addEventListener('click', function (ev) {
      ev.preventDefault();
      close();
    });

    var panel = document.createElement('div');
    panel.className = 'webb-lb__panel';
    panel.appendChild(closer);

    backdrop.appendChild(panel);
    return { backdrop: backdrop, panel: panel };
  }

  function showFallback(panel, title) {
    var box = document.createElement('div');
    box.className = 'webb-lb__fallback';
    var h = document.createElement('p');
    h.className = 'webb-lb__fallback-title';
    h.textContent = title || 'Discuss your project';
    var a = document.createElement('a');
    a.className = 'webb-lb__fallback-cta';
    a.href = FALLBACK_HREF;
    a.textContent = FALLBACK_TEXT;
    a.addEventListener('click', function () { setTimeout(close, 0); });
    box.appendChild(h);
    box.appendChild(a);
    panel.appendChild(box);
    return a;
  }

  function showVideo(panel, url, title) {
    var v = document.createElement('video');
    v.className = 'webb-lb__video';
    v.src = url;
    v.controls = true;
    v.autoplay = true;
    v.playsInline = true;
    v.muted = false;
    v.disablePictureInPicture = true;
    v.setAttribute('controlslist', 'nopictureinpicture');
    v.setAttribute('disablepictureinpicture', '');
    if (title) v.setAttribute('aria-label', title);
    v.addEventListener('play', function () {
      var vids = document.querySelectorAll('video');
      for (var i = 0; i < vids.length; i++) {
        if (vids[i] !== v) { try { vids[i].pause(); } catch (_) {} }
      }
    });
    panel.appendChild(v);
    try { v.play(); } catch (_) {}
    return v;
  }

  function open(url, opts) {
    opts = opts || {};
    if (current) close();
    lastFocus = document.activeElement;
    pauseAllVideos();

    var shell = buildShell(opts.title);
    current = shell.backdrop;
    document.body.appendChild(current);
    document.documentElement.classList.add(OPEN_CLASS);
    document.addEventListener('keydown', onKeydown, true);

    function focusInitial(el) {
      try { el.focus(); } catch (_) {}
    }

    if (!url) {
      var a = showFallback(shell.panel, opts.title);
      focusInitial(a);
      return;
    }

    fetch(url, { method: 'HEAD' }).then(function (r) {
      if (!r.ok) {
        var a2 = showFallback(shell.panel, opts.title);
        focusInitial(a2);
        return;
      }
      var v = showVideo(shell.panel, url, opts.title);
      focusInitial(v);
    }).catch(function () {
      var a3 = showFallback(shell.panel, opts.title);
      focusInitial(a3);
    });
  }

  function titleFromButton(btn) {
    var aria = btn.getAttribute('aria-label') || '';
    var m = aria.match(/—\s*(.+)$/);
    if (m) return m[1].trim();
    var fig = btn.closest && btn.closest('figure');
    if (fig) {
      var h = fig.querySelector('h3, figcaption, .sec-screen3__title, .sec-screen2__title, .sec-screen__title');
      if (h) return (h.textContent || '').trim();
    }
    return '';
  }

  function wire() {
    var selectors = ['.sec-screen3__hit', '.sec-screen2__hit', '.sec-screen__play'];
    document.querySelectorAll(selectors.join(', ')).forEach(function (btn) {
      if (btn.getAttribute('data-lb-wired') === '1') return;
      btn.setAttribute('data-lb-wired', '1');

      var url = btn.getAttribute('data-video');
      if (!url && btn.classList.contains('sec-screen__play')) {
        var fig = btn.closest && btn.closest('.sec-screen');
        var src = fig && fig.querySelector('source[data-src]');
        if (src) url = src.getAttribute('data-src');
      }

      btn.addEventListener('click', function (ev) {
        ev.preventDefault();
        open(url, { title: titleFromButton(btn) });
      });
    });

    // Film-label pills: clicking the label opens the same film as its screen.
    document.querySelectorAll('[data-film-label]').forEach(function (lbl) {
      if (lbl.getAttribute('data-lb-wired') === '1') return;
      lbl.setAttribute('data-lb-wired', '1');
      function trigger() {
        var fig = lbl.closest && lbl.closest('figure');
        if (!fig) return;
        var hit = fig.querySelector('.sec-screen3__hit, .sec-screen2__hit, .sec-screen__play, .hero-film__hit');
        if (hit) { hit.click(); return; }
        var src = fig.querySelector('source[data-src]');
        var url = src && src.getAttribute('data-src');
        if (url) open(url, { title: (lbl.textContent || '').trim() });
      }
      lbl.addEventListener('click', function (ev) { ev.preventDefault(); trigger(); });
      lbl.addEventListener('keydown', function (ev) {
        if (ev.key === 'Enter' || ev.key === ' ' || ev.keyCode === 13 || ev.keyCode === 32) {
          ev.preventDefault();
          trigger();
        }
      });
    });
  }

  window.WebbFilmLightbox = { open: open, close: close };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', wire);
  } else {
    wire();
  }
})();
