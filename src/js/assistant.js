(function () {
  'use strict';

  var RETELL_SRC = 'https://dashboard.retellai.com/retell-widget-v2.js';
  var RETELL_CFG = {
    'data-voice-public-key': 'public_key_d95c4f3c8a9d1f5a72e2c',
    'data-voice-agent-id': 'agent_5ef610cbf7f79fd3802513c955',
    'data-title': 'Webb Digital',
    'data-bot-name': 'Webb Digital Assistant',
    'data-fab-text': 'Talk to our AI assistant',
    'data-theme-color': '#080D1F',
    'data-component-color': '#2563EB'
  };
  var FAB_TEXT_FULL = 'Talk to our AI assistant';
  var FAB_TEXT_SHORT = 'Ask our assistant';
  var NARROW_LABEL_BP = 480;
  var HIDE_BUBBLE_BP = 360;
  var BUBBLE_DELAY_MS = 4000;
  var BUBBLE_KEY = 'webb-assistant-bubble-seen-v1';

  var BUBBLE_MESSAGES = {
    home: "Got a question? Ask our AI assistant about websites, apps, AI and prices — by voice or text. It's the same kind of assistant we can build for your business.",
    'care-providers': "Run a care service? Ask how an AI assistant can handle enquiries and referrals — never safeguarding.",
    'builders-maintenance': "Run a trades business? Ask how an AI assistant can take call-outs and quote jobs faster — without you picking up every call.",
    'electricians-plumbers': "Electrician or plumber? Ask how an AI assistant can take call-outs 24/7 and book jobs into your diary.",
    'property-lettings': "Letting or selling homes? Ask how an AI assistant can answer tenant questions and book viewings.",
    'professional-services': "Run a practice? Ask how an AI assistant can qualify enquiries and route them to the right partner.",
    'shops-retail': "Run a shop? Ask how an AI assistant can handle hours, stock and delivery questions after hours.",
    'salons-beauty': "Run a salon? Ask how an AI assistant could answer your clients' questions and fill your diary.",
    hospitality: "Café or restaurant? Ask how an AI assistant can take bookings and answer dietary questions on the quiet days.",
    'training-education': "Run training? Ask how an AI assistant can explain courses, take sign-ups and answer parents.",
    'fitness-wellbeing': "Gym or studio? Ask how an AI assistant can book classes and answer membership questions 24/7.",
    'cake-makers-bakers': "Bake for a living? Ask how an AI assistant can take order enquiries and quote by message.",
    'swimwear-leisure': "Swimwear or leisure? Ask how an AI assistant can answer sizing, stock and shipping questions.",
    'other-businesses': "Any local business? Ask how an AI assistant could answer your customers and send real enquiries to you."
  };

  function getSectorKey() {
    var attr = document.body && document.body.getAttribute('data-sector');
    if (attr && BUBBLE_MESSAGES[attr]) return attr;
    var path = (location && location.pathname) || '/';
    var m = path.match(/\/sectors\/([^\/]+)\/?/);
    if (m && BUBBLE_MESSAGES[m[1]]) return m[1];
    return 'home';
  }

  function injectRetell() {
    if (document.getElementById('retell-widget')) return;
    var s = document.createElement('script');
    s.id = 'retell-widget';
    s.src = RETELL_SRC;
    s.type = 'module';
    Object.keys(RETELL_CFG).forEach(function (k) { s.setAttribute(k, RETELL_CFG[k]); });
    if (window.matchMedia && window.matchMedia('(max-width: ' + NARROW_LABEL_BP + 'px)').matches) {
      s.setAttribute('data-fab-text', FAB_TEXT_SHORT);
    }
    document.head.appendChild(s);
  }

  function openAssistant() {
    var tried = 0;
    function tryOnce() {
      tried++;
      var scope = document.body;
      var all = scope.querySelectorAll('*');
      for (var i = 0; i < all.length; i++) {
        var el = all[i];
        if (el.id === 'retell-widget') continue;
        var tag = (el.tagName || '').toLowerCase();
        if (tag.indexOf('retell') !== -1) {
          var sr = el.shadowRoot;
          if (sr) {
            var btn = sr.querySelector('button');
            if (btn) { btn.click(); return true; }
          }
          try { el.click(); return true; } catch (_) {}
        }
        var cls = (el.className && typeof el.className === 'string') ? el.className : '';
        if (/retell/i.test(cls)) {
          var b = el.tagName === 'BUTTON' ? el : el.querySelector('button');
          if (b) { b.click(); return true; }
        }
      }
      var buttons = scope.querySelectorAll('button');
      for (var j = 0; j < buttons.length; j++) {
        var t = (buttons[j].textContent || '').trim();
        if (/talk to our|ask our/i.test(t)) { buttons[j].click(); return true; }
      }
      return false;
    }
    if (tryOnce()) return;
    var iv = setInterval(function () {
      if (tryOnce() || tried > 20) clearInterval(iv);
    }, 250);
  }

  function makeBubble(message) {
    var wrap = document.createElement('div');
    wrap.className = 'webb-assistant-bubble';
    wrap.setAttribute('role', 'dialog');
    wrap.setAttribute('aria-live', 'polite');
    wrap.innerHTML = '<button class="webb-assistant-bubble__close" type="button" aria-label="Close">&times;</button>' +
      '<p class="webb-assistant-bubble__msg"></p>';
    wrap.querySelector('.webb-assistant-bubble__msg').textContent = message;
    document.body.appendChild(wrap);
    var closed = false;
    function dismiss() {
      if (closed) return;
      closed = true;
      try { sessionStorage.setItem(BUBBLE_KEY, '1'); } catch (_) {}
      wrap.classList.remove('is-visible');
      setTimeout(function () { wrap.remove(); }, 220);
    }
    wrap.querySelector('.webb-assistant-bubble__close').addEventListener('click', function (ev) {
      ev.stopPropagation();
      dismiss();
    });
    wrap.addEventListener('click', function () {
      dismiss();
      openAssistant();
    });
    requestAnimationFrame(function () { wrap.classList.add('is-visible'); });
  }

  function maybeShowBubble() {
    if (window.innerWidth < HIDE_BUBBLE_BP) return;
    var seen = false;
    try { seen = sessionStorage.getItem(BUBBLE_KEY) === '1'; } catch (_) {}
    if (seen) return;
    var msg = BUBBLE_MESSAGES[getSectorKey()] || BUBBLE_MESSAGES.home;
    setTimeout(function () { makeBubble(msg); }, BUBBLE_DELAY_MS);
  }

  function addTryButtons() {
    var cards = document.querySelectorAll('.sp-svc, .wb-card, .care-card, [data-ai-card]');
    cards.forEach(function (card) {
      var h3 = card.querySelector('h3');
      if (!h3) return;
      var t = (h3.textContent || '').trim();
      if (!/ai assistant|ai receptionist/i.test(t)) return;
      if (card.querySelector('.webb-assistant-try')) return;
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'webb-assistant-try';
      btn.textContent = 'Try ours now';
      btn.addEventListener('click', function (ev) {
        ev.preventDefault();
        openAssistant();
      });
      card.appendChild(btn);
    });
  }

  function init() {
    injectRetell();
    addTryButtons();
    maybeShowBubble();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
