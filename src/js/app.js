'use strict';
/* ============================================================
   LOCAL BUSINESS AI HUB — Full Application v2
   ============================================================ */

var _kit = null;      // parsed content
var _form = null;     // form values
var _videoId = null;  // HeyGen video_id
var _pollTimer = null;
var _ldMsgTimer = null;
var _ldStepTimer = null;

/* ------------------------------------------------------------
   NAVIGATION
   ------------------------------------------------------------ */
function goHome() {
  _videoId = null;
  clearInterval(_pollTimer);
  show('page-form');
  hide('page-loading');
  hide('page-results');
  show('site-footer');
  window.scrollTo(0, 0);
}

function scrollForm() {
  document.getElementById('form-top').scrollIntoView({ behavior: 'smooth' });
}

function show(id) { var e = document.getElementById(id); if (e) e.style.display = 'block'; }
function hide(id) { var e = document.getElementById(id); if (e) e.style.display = 'none'; }

function setPage(name) {
  ['page-form','page-loading','page-results'].forEach(function(id) {
    var el = document.getElementById(id);
    if (el) el.style.display = id === name ? 'block' : 'none';
  });
  var footer = document.getElementById('site-footer');
  if (footer) footer.style.display = name === 'page-loading' ? 'none' : '';
  if (name !== 'page-loading') window.scrollTo(0, 0);
}

/* ------------------------------------------------------------
   PROGRESS BAR
   ------------------------------------------------------------ */
function updateProgress() {
  var textIds = ['q-type','q-name','q-location','q-service','q-customer','q-usp','q-price','q-goal'];
  var filled = textIds.filter(function(id) {
    var el = document.getElementById(id);
    return el && el.value && el.value.trim();
  }).length;
  var radios = ['years','web'].filter(function(name) {
    return !!document.querySelector('input[name="' + name + '"]:checked');
  }).length;
  var total = textIds.length + 2;
  var done = filled + radios;
  var pct = Math.round((done / total) * 100);
  var fill = document.getElementById('prog-fill');
  var text = document.getElementById('prog-text');
  if (fill) fill.style.width = Math.max(1, pct) + '%';
  if (text) text.textContent = done + ' / ' + total + (done === total ? ' ✓' : '');
}

/* ------------------------------------------------------------
   RADIO CARDS
   ------------------------------------------------------------ */
function pickRadio(groupId, card) {
  var group = document.getElementById(groupId);
  if (!group) return;
  group.querySelectorAll('.radio-card').forEach(function(c) { c.classList.remove('sel'); });
  card.classList.add('sel');
  var r = card.querySelector('input[type="radio"]');
  if (r) r.checked = true;
  updateProgress();
}

/* ------------------------------------------------------------
   FORM COLLECTION & VALIDATION
   ------------------------------------------------------------ */
function collectForm() {
  function v(id) { return ((document.getElementById(id) || {}).value || '').trim(); }
  return {
    type:     v('q-type'),
    name:     v('q-name'),
    location: v('q-location'),
    service:  v('q-service'),
    customer: v('q-customer'),
    usp:      v('q-usp'),
    price:    v('q-price'),
    years:    ((document.querySelector('input[name="years"]:checked') || {}).value) || '',
    web:      ((document.querySelector('input[name="web"]:checked') || {}).value) || '',
    goal:     v('q-goal')
  };
}

function validateForm(f) {
  if (!f.type)     return 'Please select your business type.';
  if (!f.name)     return 'Please enter your business name.';
  if (!f.location) return 'Please enter your location / service area.';
  if (!f.service)  return 'Please describe your key service or product.';
  if (!f.customer) return 'Please describe your ideal customer.';
  if (!f.usp)      return 'Please describe what makes you different.';
  if (!f.price)    return 'Please select your price range.';
  if (!f.years)    return 'Please select how long you\'ve been in business.';
  if (!f.web)      return 'Please answer the website/social media question.';
  if (!f.goal)     return 'Please describe your main challenge and goal.';
  return null;
}

/* ------------------------------------------------------------
   LOADING ANIMATION
   ------------------------------------------------------------ */
var LDMsgs = [
  'Analysing your business profile…',
  'Writing your landing page copy…',
  'Crafting your email templates…',
  'Building your social media posts…',
  'Writing your video script…',
  'Finalising your complete kit…'
];

function startLoading() {
  var mi = 0;
  var msgEl = document.getElementById('loading-msg');
  var steps = ['ls-content','ls-video','ls-done'];
  var si = 0;

  function nextMsg() { mi = (mi + 1) % LDMsgs.length; if (msgEl) msgEl.textContent = LDMsgs[mi]; }
  function nextStep() {
    if (si > 0) { var p = document.getElementById(steps[si-1]); if (p) { p.classList.remove('active'); p.classList.add('done'); } }
    var c = document.getElementById(steps[si]); if (c) c.classList.add('active');
    si++;
  }

  if (msgEl) msgEl.textContent = LDMsgs[0];
  nextStep();
  _ldMsgTimer = setInterval(nextMsg, 3000);
  _ldStepTimer = setInterval(nextStep, 8000);
}

function stopLoading() {
  clearInterval(_ldMsgTimer);
  clearInterval(_ldStepTimer);
  ['ls-content','ls-video','ls-done'].forEach(function(id) {
    var el = document.getElementById(id);
    if (el) { el.classList.remove('active'); el.classList.add('done'); }
  });
}

function resetLoadingUI() {
  ['ls-content','ls-video','ls-done'].forEach(function(id) {
    var el = document.getElementById(id);
    if (el) el.className = 'lstep';
  });
  var msg = document.getElementById('loading-msg');
  if (msg) msg.textContent = LDMsgs[0];
}

/* ------------------------------------------------------------
   MAIN GENERATE FLOW
   ------------------------------------------------------------ */
async function startGenerate() {
  var errEl = document.getElementById('form-err');
  errEl.style.display = 'none';

  var f = collectForm();
  var err = validateForm(f);
  if (err) {
    errEl.textContent = err;
    errEl.style.display = 'block';
    errEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    return;
  }

  _form = f;
  var btn = document.getElementById('gen-btn');
  btn.disabled = true;

  resetLoadingUI();
  setPage('page-loading');
  startLoading();

  try {
    // Step 1: generate text content
    var res = await fetch('/.netlify/functions/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(f)
    });
    var data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Generation failed.');
    _kit = parse(data.text);

    // Step 2: kick off HeyGen video (non-blocking)
    if (_kit.videoScript) {
      startVideoGeneration(_kit.videoScript, f.name);
    }

    stopLoading();
    renderResults(_kit, f);
    setPage('page-results');

  } catch (e) {
    stopLoading();
    setPage('page-form');
    btn.disabled = false;
    errEl.textContent = 'Error: ' + e.message;
    errEl.style.display = 'block';
    document.getElementById('form-top').scrollIntoView({ behavior: 'smooth' });
  }
}

/* ------------------------------------------------------------
   CONTENT PARSER
   ------------------------------------------------------------ */
function extract(text, start, end) {
  var s = text.indexOf(start);
  if (s === -1) return '';
  s += start.length;
  var e = end ? text.indexOf(end, s) : text.length;
  return text.slice(s, e < 0 ? text.length : e).trim();
}

function extractLine(block, key) {
  var m = block.match(new RegExp(key + ':\\s*([^\\n]+)', 'i'));
  return m ? m[1].trim().replace(/^\[|]$/g, '') : '';
}

function extractBody(block) {
  var m = block.match(/BODY:\s*\n([\s\S]+?)(?=\n===|$)/i);
  return m ? m[1].trim() : '';
}

function parse(raw) {
  // Landing page
  var lpBlock = extract(raw, '=== LANDING PAGE ===', '=== EMAIL 1');
  var landing = {
    headline:    extractLine(lpBlock, 'HEADLINE'),
    subheadline: extractLine(lpBlock, 'SUBHEADLINE'),
    body:        extractBody(lpBlock)
  };

  // Emails
  var emailMeta = [
    { label: 'Enquiry Reply',   badge: 'eb-1', start: '=== EMAIL 1: ENQUIRY REPLY ===',    next: '=== EMAIL 2' },
    { label: 'Quote Follow-Up', badge: 'eb-2', start: '=== EMAIL 2: QUOTE FOLLOW-UP ===',  next: '=== EMAIL 3' },
    { label: 'Review Request',  badge: 'eb-3', start: '=== EMAIL 3: REVIEW REQUEST ===',   next: '=== EMAIL 4' },
    { label: 'Seasonal Offer',  badge: 'eb-4', start: '=== EMAIL 4: SEASONAL OFFER ===',   next: '=== EMAIL 5' },
    { label: 'Referral Request',badge: 'eb-5', start: '=== EMAIL 5: REFERRAL REQUEST ===', next: '=== SOCIAL POST 1' }
  ];
  var emails = emailMeta.map(function(m) {
    var block = extract(raw, m.start, m.next);
    return { label: m.label, badge: m.badge, subject: extractLine(block, 'SUBJECT'), body: extractBody(block) || block };
  });

  // Social posts
  var platCycle = ['Facebook','Instagram','LinkedIn','Facebook','Instagram','LinkedIn','Facebook','Instagram','Facebook','LinkedIn'];
  var posts = [];
  for (var i = 1; i <= 10; i++) {
    var plat = platCycle[i - 1];
    var s = '=== SOCIAL POST ' + i + ' (' + plat + ') ===';
    var n = i < 10 ? '=== SOCIAL POST ' + (i + 1) : '=== VIDEO SCRIPT ===';
    var block = extract(raw, s, n);
    var hashMatch = block.match(/HASHTAGS:\s*([^\n]+)/i);
    var postText = block.replace(/^POST:\s*/i, '').replace(/HASHTAGS:\s*[^\n]+/i, '').trim();
    posts.push({ num: i, platform: plat, text: postText, hashtags: hashMatch ? hashMatch[1].trim() : '' });
  }

  // Video script
  var videoScript = extract(raw, '=== VIDEO SCRIPT ===', null);

  return { landing, emails, posts, videoScript };
}

/* ------------------------------------------------------------
   HEYGEN VIDEO GENERATION
   ------------------------------------------------------------ */
async function startVideoGeneration(script, businessName) {
  try {
    var res = await fetch('/.netlify/functions/video', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ script, businessName })
    });
    var data = await res.json();
    if (data.data && data.data.video_id) {
      _videoId = data.data.video_id;
      renderVideoPanel('pending', null);
      pollVideo();
    } else {
      renderVideoPanel('error', 'Video generation could not be started: ' + (data.error || JSON.stringify(data)));
    }
  } catch (e) {
    renderVideoPanel('error', 'Video request failed: ' + e.message);
  }
}

function pollVideo() {
  clearInterval(_pollTimer);
  _pollTimer = setInterval(async function() {
    if (!_videoId) { clearInterval(_pollTimer); return; }
    try {
      var res = await fetch('/.netlify/functions/video?video_id=' + _videoId);
      var data = await res.json();
      var d = data.data || data;
      var status = d.status;
      if (status === 'completed') {
        clearInterval(_pollTimer);
        renderVideoPanel('ready', d.video_url);
      } else if (status === 'failed') {
        clearInterval(_pollTimer);
        renderVideoPanel('error', 'Video generation failed. Please try again.');
      }
      // 'processing' or 'pending' — keep polling
    } catch (e) { /* keep polling */ }
  }, 8000); // poll every 8 seconds
}

/* ------------------------------------------------------------
   RENDER RESULTS
   ------------------------------------------------------------ */
function esc(s) {
  return (s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function cpBtn(text, label) {
  return '<button class="copy-btn" onclick="copyText(this,' + JSON.stringify(text) + ')">' +
    '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>' +
    ' ' + (label || 'Copy') + '</button>';
}

function renderResults(kit, f) {
  var desc = document.getElementById('results-desc');
  if (desc) desc.textContent = f.name + ' · ' + f.location + ' · ' + f.type;
  renderLanding(kit.landing, f);
  renderEmails(kit.emails);
  renderPosts(kit.posts);
  renderVideoPanel('initial', kit.videoScript);
}

function renderLanding(l, f) {
  var el = document.getElementById('out-landing');
  if (!el) return;
  var allText = (l.headline || '') + '\n\n' + (l.subheadline || '') + '\n\n' + (l.body || '');
  el.innerHTML = [
    '<div class="lp-block">',
    '  <div class="lp-section">',
    '    <div class="lp-row"><span class="lp-tag">Headline</span>' + cpBtn(l.headline, 'Copy headline') + '</div>',
    '    <div class="lp-headline">' + esc(l.headline) + '</div>',
    '  </div>',
    '  <div class="lp-section">',
    '    <div class="lp-row"><span class="lp-tag">Subheadline</span>' + cpBtn(l.subheadline, 'Copy') + '</div>',
    '    <div class="lp-subheadline">' + esc(l.subheadline) + '</div>',
    '  </div>',
    '  <div class="lp-section">',
    '    <div class="lp-row"><span class="lp-tag">Body Copy — 300–500 words</span>' + cpBtn(l.body, 'Copy body') + '</div>',
    '    <div class="lp-body">' + esc(l.body) + '</div>',
    '  </div>',
    '  <div class="lp-copy-all"><span>Copy all landing page copy at once</span>' + cpBtn(allText, 'Copy all') + '</div>',
    '</div>'
  ].join('');
}

function renderEmails(emails) {
  var el = document.getElementById('out-emails');
  if (!el) return;
  el.innerHTML = emails.map(function(e, i) {
    var all = 'Subject: ' + (e.subject || '') + '\n\n' + (e.body || '');
    return [
      '<div class="email-card">',
      '  <div class="email-top">',
      '    <div>',
      '      <span class="email-badge ' + e.badge + '">Email ' + (i+1) + ' — ' + e.label + '</span>',
      '      <div class="email-subject"><span class="email-subj-tag">Subject:</span>' + esc(e.subject) + '</div>',
      '    </div>',
      '    ' + cpBtn(all, 'Copy email'),
      '  </div>',
      '  <div class="email-body-text">' + esc(e.body) + '</div>',
      '</div>'
    ].join('');
  }).join('');
}

function renderPosts(posts) {
  var el = document.getElementById('out-social');
  if (!el) return;
  var pillClass = { Facebook: 'pp-fb', Instagram: 'pp-ig', LinkedIn: 'pp-li' };
  el.innerHTML = posts.map(function(p) {
    var all = (p.text || '') + (p.hashtags ? '\n\n' + p.hashtags : '');
    return [
      '<div class="social-card" data-plat="' + p.platform + '">',
      '  <div class="social-top">',
      '    <div class="plat-pill ' + (pillClass[p.platform] || '') + '">' + p.platform + '</div>',
      '    <span class="post-n">Post ' + p.num + '</span>',
      '  </div>',
      '  <div class="social-body">',
      '    <div class="post-txt">' + esc(p.text) + '</div>',
      p.hashtags ? '    <div class="post-tags">' + esc(p.hashtags) + '</div>' : '',
      '  </div>',
      '  <div class="social-foot">' + cpBtn(all, 'Copy post') + '</div>',
      '</div>'
    ].join('');
  }).join('');
}

function renderVideoPanel(state, payload) {
  var el = document.getElementById('out-video');
  if (!el) return;
  var script = (_kit && _kit.videoScript) ? _kit.videoScript : '';
  var scriptHtml = script ? [
    '<div class="script-box" style="margin-top:20px;">',
    '  <div class="script-top"><h3>Video Script</h3>' + cpBtn(script, 'Copy script') + '</div>',
    '  <div class="script-text">' + esc(script) + '</div>',
    '</div>'
  ].join('') : '';

  var videoHtml = '';
  if (state === 'initial') {
    videoHtml = [
      '<div class="video-wrap">',
      '  <div class="video-player-wrap">',
      '    <div class="video-pending">',
      '      <div class="v-spinner"></div>',
      '      <h3>Generating your video…</h3>',
      '      <p>HeyGen is rendering your talking-head video. This usually takes 2–5 minutes.</p>',
      '    </div>',
      '  </div>',
      '  <div class="video-info"><p>Video generation started automatically. This panel will update when ready.</p></div>',
      '</div>'
    ].join('');
  } else if (state === 'pending') {
    videoHtml = [
      '<div class="video-wrap">',
      '  <div class="video-player-wrap">',
      '    <div class="video-pending">',
      '      <div class="v-spinner"></div>',
      '      <h3>Rendering your video…</h3>',
      '      <p>HeyGen is processing. Checking every 8 seconds. Usually takes 2–5 minutes.</p>',
      '    </div>',
      '  </div>',
      '  <div class="video-info"><p>Video ID: ' + esc(_videoId || '') + '</p></div>',
      '</div>'
    ].join('');
  } else if (state === 'ready') {
    var url = payload || '';
    videoHtml = [
      '<div class="video-wrap">',
      '  <div class="video-player-wrap">',
      '    <video controls src="' + esc(url) + '">Your browser does not support video.</video>',
      '  </div>',
      '  <div class="video-info">',
      '    <p>Your AI marketing video is ready.</p>',
      '    <div style="display:flex;gap:8px;flex-wrap:wrap;">',
      '      <a href="' + esc(url) + '" download="marketing-video.mp4" class="btn-download" style="background:var(--blue);color:#fff;border:none;">⬇ Download MP4</a>',
      '    </div>',
      '  </div>',
      '</div>'
    ].join('');
  } else if (state === 'error') {
    videoHtml = [
      '<div class="video-wrap">',
      '  <div class="video-player-wrap">',
      '    <div class="video-error">',
      '      <p>⚠️ ' + esc(payload || 'Video generation failed.') + '</p>',
      '      <button onclick="retryVideo()" class="video-gen-btn" style="margin-top:14px;">Retry Video Generation</button>',
      '    </div>',
      '  </div>',
      '</div>'
    ].join('');
  }

  el.innerHTML = videoHtml + scriptHtml;
}

function retryVideo() {
  if (_kit && _kit.videoScript && _form) {
    renderVideoPanel('pending', null);
    startVideoGeneration(_kit.videoScript, _form.name);
  }
}

/* ------------------------------------------------------------
   TAB SWITCHING
   ------------------------------------------------------------ */
function showTab(name, btn) {
  document.querySelectorAll('.tab').forEach(function(t) { t.classList.remove('active'); });
  document.querySelectorAll('.panel').forEach(function(p) { p.style.display = 'none'; p.classList.remove('active'); });
  if (btn) btn.classList.add('active');
  var panel = document.getElementById('panel-' + name);
  if (panel) { panel.style.display = 'block'; panel.classList.add('active'); }
}

function filterPosts(plat, btn) {
  document.querySelectorAll('.pf-btn').forEach(function(b) { b.classList.remove('active'); });
  if (btn) btn.classList.add('active');
  document.querySelectorAll('.social-card').forEach(function(c) {
    c.style.display = (plat === 'all' || c.getAttribute('data-plat') === plat) ? '' : 'none';
  });
}

/* ------------------------------------------------------------
   CLIPBOARD
   ------------------------------------------------------------ */
function copyText(btn, text) {
  navigator.clipboard.writeText(text).then(function() {
    btn.classList.add('copied');
    var orig = btn.innerHTML;
    btn.innerHTML = '✓ Copied!';
    setTimeout(function() { btn.classList.remove('copied'); btn.innerHTML = orig; }, 2000);
  }).catch(function() {
    var ta = document.createElement('textarea');
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
  });
}

/* ------------------------------------------------------------
   PDF DOWNLOAD
   ------------------------------------------------------------ */
function downloadPDF() {
  if (!_kit || !_form) return;
  if (typeof window.jspdf === 'undefined') { alert('PDF library loading — try again.'); return; }
  var doc = new window.jspdf.jsPDF({ unit:'mm', format:'a4' });
  var pw = doc.internal.pageSize.getWidth();
  var ml = 18, usable = pw - ml*2, y = 20;
  var lh = 5.5;
  function newPage() { doc.addPage(); y = 20; }
  function chk(h) { if (y + h > 272) newPage(); }
  function h1(t) { chk(14); doc.setFontSize(15); doc.setFont('helvetica','bold'); doc.setTextColor(29,78,216); doc.text(t, ml, y); y += 6; doc.setDrawColor(29,78,216); doc.setLineWidth(0.5); doc.line(ml, y, pw-ml, y); y += 6; }
  function h2(t) { chk(10); doc.setFontSize(12); doc.setFont('helvetica','bold'); doc.setTextColor(30,41,59); doc.text(t, ml, y); y += lh*1.3; }
  function tag(t) { doc.setFontSize(8); doc.setFont('helvetica','bold'); doc.setTextColor(148,163,184); doc.text(t.toUpperCase(), ml, y); y += lh; }
  function body(t, small) {
    doc.setFontSize(small?9:10); doc.setFont('helvetica','normal'); doc.setTextColor(71,85,105);
    doc.splitTextToSize(t||'', usable).forEach(function(l) { chk(lh); doc.text(l, ml, y); y += lh*0.85; }); y += 2;
  }
  function gap(n) { y += lh*(n||1); }
  // Cover
  doc.setFillColor(15,23,42); doc.rect(0,0,pw,50,'F');
  doc.setFontSize(20); doc.setFont('helvetica','bold'); doc.setTextColor(255,255,255); doc.text('Marketing Kit', ml, 22);
  doc.setFontSize(12); doc.setFont('helvetica','normal'); doc.setTextColor(148,163,184);
  doc.text((_form.name||'') + ' · ' + (_form.location||''), ml, 32);
  doc.setFontSize(9); doc.text('Local Business AI Hub · ' + new Date().toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric'}), ml, 42);
  y = 62;
  h1('Landing Page'); tag('Headline'); body(_kit.landing.headline); gap(0.3); tag('Subheadline'); body(_kit.landing.subheadline); gap(0.3); tag('Body Copy'); body(_kit.landing.body); gap(1.5);
  h1('Email Templates');
  _kit.emails.forEach(function(e,i){ h2('Email '+(i+1)+' — '+e.label); tag('Subject'); body(e.subject,true); gap(0.2); tag('Body'); body(e.body); gap(0.8); });
  h1('Social Media Posts');
  _kit.posts.forEach(function(p){ h2('Post '+p.num+' · '+p.platform); body(p.text); if(p.hashtags){doc.setFontSize(9);doc.setTextColor(59,130,246);doc.splitTextToSize(p.hashtags,usable).forEach(function(l){chk(lh);doc.text(l,ml,y);y+=lh*0.85;});} gap(0.6); });
  if (_kit.videoScript) { h1('Video Script'); body(_kit.videoScript); }
  doc.save('marketing-kit-' + (_form.name||'business').replace(/[^a-z0-9]/gi,'-').toLowerCase() + '.pdf');
}

/* ------------------------------------------------------------
   ZIP DOWNLOAD
   ------------------------------------------------------------ */
async function downloadZIP() {
  if (!_kit || !_form) return;
  if (typeof JSZip === 'undefined') { alert('ZIP library loading — try again.'); return; }
  var z = new JSZip();
  var fn = (_form.name||'business').replace(/[^a-z0-9]/gi,'-').toLowerCase();
  var folder = z.folder('marketing-kit-' + fn);
  var date = new Date().toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric'});
  var hdr = 'Marketing Kit — ' + (_form.name||'') + '\nGenerated: ' + date + '\n' + '='.repeat(50) + '\n\n';

  folder.file('01-landing-page.txt', hdr + 'HEADLINE\n' + (_kit.landing.headline||'') + '\n\nSUBHEADLINE\n' + (_kit.landing.subheadline||'') + '\n\nBODY COPY\n' + (_kit.landing.body||''));

  var emailsTxt = hdr;
  _kit.emails.forEach(function(e,i){ emailsTxt += 'EMAIL '+(i+1)+' — '+e.label.toUpperCase()+'\n'+'-'.repeat(40)+'\nSubject: '+(e.subject||'')+'\n\n'+(e.body||'')+'\n\n\n'; });
  folder.file('02-email-templates.txt', emailsTxt);

  var socialTxt = hdr;
  _kit.posts.forEach(function(p){ socialTxt += 'POST '+p.num+' — '+p.platform.toUpperCase()+'\n'+'-'.repeat(40)+'\n'+(p.text||'')+(p.hashtags?'\n\n'+p.hashtags:'')+'\n\n\n'; });
  folder.file('03-social-posts.txt', socialTxt);

  if (_kit.videoScript) folder.file('04-video-script.txt', hdr + 'VIDEO SCRIPT\n' + '-'.repeat(40) + '\n' + _kit.videoScript);

  // All in one
  var all = hdr + '1. LANDING PAGE\n' + '='.repeat(50) + '\n\nHEADLINE\n'+(_kit.landing.headline||'')+'\n\nSUBHEADLINE\n'+(_kit.landing.subheadline||'')+'\n\nBODY COPY\n'+(_kit.landing.body||'')+'\n\n\n';
  all += '2. EMAIL TEMPLATES\n' + '='.repeat(50) + '\n\n';
  _kit.emails.forEach(function(e,i){ all+='Email '+(i+1)+' — '+e.label+'\nSubject: '+(e.subject||'')+'\n\n'+(e.body||'')+'\n\n\n'; });
  all += '3. SOCIAL POSTS\n' + '='.repeat(50) + '\n\n';
  _kit.posts.forEach(function(p){ all+='Post '+p.num+' ('+p.platform+')\n'+(p.text||'')+(p.hashtags?'\n'+p.hashtags:'')+'\n\n'; });
  if (_kit.videoScript) all += '\n4. VIDEO SCRIPT\n' + '='.repeat(50) + '\n\n' + _kit.videoScript;
  folder.file('00-all-content.txt', all);

  var blob = await z.generateAsync({ type:'blob' });
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = url; a.download = 'marketing-kit-' + fn + '.zip';
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/* ------------------------------------------------------------
   INIT
   ------------------------------------------------------------ */
document.addEventListener('DOMContentLoaded', function() {
  setPage('page-form');
  updateProgress();
});
