'use strict';

/* =========================================================
   LOCAL BUSINESS AI HUB — Main Application
   ========================================================= */

var _generatedData = null;
var _formData = null;

/* ---------------------------------------------------------
   SECTION NAVIGATION
   --------------------------------------------------------- */
function showSection(name) {
  var sections = ['section-form', 'section-loading', 'section-results'];
  sections.forEach(function(id) {
    var el = document.getElementById(id);
    if (el) el.style.display = id === 'section-' + name ? 'block' : 'none';
  });
  var footer = document.getElementById('main-footer');
  if (footer) footer.style.display = name === 'loading' ? 'none' : 'block';
  if (name !== 'loading') window.scrollTo(0, 0);
}

/* ---------------------------------------------------------
   PROGRESS BAR
   --------------------------------------------------------- */
function updateProgress() {
  var fields = [
    document.getElementById('q-business-type'),
    document.getElementById('q-location'),
    document.getElementById('q-audience'),
    document.getElementById('q-usp'),
    document.getElementById('q-services'),
    document.getElementById('q-price'),
    document.getElementById('q-years'),
    document.getElementById('q-painpoints'),
    document.getElementById('q-strength'),
    document.querySelector('input[name="social"]:checked'),
    document.getElementById('api-key')
  ];
  var filled = fields.filter(function(f) { return f && f.value && f.value.trim(); }).length;
  var pct = Math.round((filled / fields.length) * 100);
  var fill = document.getElementById('progress-fill');
  var label = document.getElementById('progress-label');
  if (fill) fill.style.width = Math.max(6, pct) + '%';
  if (label) {
    var answered = Math.min(10, Math.floor((filled / fields.length) * 10));
    label.textContent = answered < 10 ? 'Question ' + (answered + 1) + ' of 10' : 'All questions answered ✓';
  }
}

/* ---------------------------------------------------------
   RADIO CARD SELECTION
   --------------------------------------------------------- */
function selectRadio(card, groupId) {
  var group = document.getElementById(groupId);
  if (!group) return;
  group.querySelectorAll('.radio-card').forEach(function(c) { c.classList.remove('selected'); });
  card.classList.add('selected');
  var radio = card.querySelector('input[type="radio"]');
  if (radio) radio.checked = true;
  updateProgress();
}

/* ---------------------------------------------------------
   API KEY TOGGLE
   --------------------------------------------------------- */
function toggleApiKey() {
  var inp = document.getElementById('api-key');
  var btn = document.getElementById('api-toggle-btn');
  if (!inp) return;
  if (inp.type === 'password') {
    inp.type = 'text';
    btn.textContent = '🔒';
  } else {
    inp.type = 'password';
    btn.textContent = '👁';
  }
}

/* ---------------------------------------------------------
   FORM VALIDATION
   --------------------------------------------------------- */
function getFormData() {
  var errors = [];
  var data = {
    businessType:  (document.getElementById('q-business-type') || {}).value || '',
    location:      ((document.getElementById('q-location') || {}).value || '').trim(),
    audience:      ((document.getElementById('q-audience') || {}).value || '').trim(),
    usp:           ((document.getElementById('q-usp') || {}).value || '').trim(),
    services:      ((document.getElementById('q-services') || {}).value || '').trim(),
    priceRange:    (document.getElementById('q-price') || {}).value || '',
    years:         (document.getElementById('q-years') || {}).value || '',
    painPoints:    ((document.getElementById('q-painpoints') || {}).value || '').trim(),
    strength:      ((document.getElementById('q-strength') || {}).value || '').trim(),
    hasSocial:     '',
    apiKey:        ((document.getElementById('api-key') || {}).value || '').trim()
  };
  var socialRadio = document.querySelector('input[name="social"]:checked');
  if (socialRadio) data.hasSocial = socialRadio.value;

  if (!data.businessType) errors.push('Please select your business type.');
  if (!data.location) errors.push('Please enter your location.');
  if (!data.audience) errors.push('Please describe your typical customers.');
  if (!data.usp) errors.push('Please describe what makes you different.');
  if (!data.services) errors.push('Please list your main services.');
  if (!data.priceRange) errors.push('Please select your price range.');
  if (!data.years) errors.push('Please select how long you\'ve been in business.');
  if (!data.painPoints) errors.push('Please describe your customers\' pain points.');
  if (!data.strength) errors.push('Please describe your biggest strength.');
  if (!data.hasSocial) errors.push('Please answer the website/social media question.');
  if (!data.apiKey) errors.push('Please enter your Anthropic API key.');
  if (data.apiKey && !data.apiKey.startsWith('sk-ant-')) errors.push('API key should start with sk-ant-');

  return { data: data, errors: errors };
}

/* ---------------------------------------------------------
   PROMPT BUILDER
   --------------------------------------------------------- */
function buildPrompt(d) {
  return 'You are an expert UK marketing copywriter for local businesses. Generate a complete marketing kit for this business.\n\n' +
    'BUSINESS PROFILE:\n' +
    '- Business Type: ' + d.businessType + '\n' +
    '- Location: ' + d.location + '\n' +
    '- Target Audience: ' + d.audience + '\n' +
    '- Unique Selling Point: ' + d.usp + '\n' +
    '- Main Services: ' + d.services + '\n' +
    '- Price Range: ' + d.priceRange + '\n' +
    '- Time in Business: ' + d.years + '\n' +
    '- Customer Pain Points: ' + d.painPoints + '\n' +
    '- Biggest Strength: ' + d.strength + '\n' +
    '- Current Online Presence: ' + d.hasSocial + '\n\n' +
    'Generate ALL sections below. Use EXACTLY these headers — nothing before the first header.\n\n' +

    '=== LANDING PAGE ===\n' +
    'HEADLINE: [Write a compelling, specific headline for this exact business and location. 8-12 words.]\n' +
    'SUBHEADLINE: [Write a supporting subheadline. 15-20 words. Reference the location.]\n' +
    'BODY:\n' +
    '[Write exactly 200 words of professional website body copy. Reference the business type, location, services and USP specifically. End with a clear call to action.]\n\n' +

    '=== EMAIL 1: ENQUIRY RESPONSE ===\n' +
    'SUBJECT: [Subject line]\n' +
    'BODY:\n' +
    '[Professional email sent within minutes of receiving an enquiry. Warm, responsive, mentions their specific enquiry, gives next steps. 100-130 words.]\n\n' +

    '=== EMAIL 2: QUOTE FOLLOW-UP ===\n' +
    'SUBJECT: [Subject line]\n' +
    'BODY:\n' +
    '[Sent 3 days after sending a quote if no reply. Polite, adds a small extra value point, easy next step. 80-100 words.]\n\n' +

    '=== EMAIL 3: REVIEW REQUEST ===\n' +
    'SUBJECT: [Subject line]\n' +
    'BODY:\n' +
    '[Sent after completing a job. Genuine, grateful, makes leaving a Google review feel easy and worthwhile. 80-100 words.]\n\n' +

    '=== EMAIL 4: SEASONAL PROMOTION ===\n' +
    'SUBJECT: [Subject line]\n' +
    'BODY:\n' +
    '[A seasonal offer email relevant to the business type — spring clean, winter prep, new year check-up etc. Creates urgency without being pushy. 100-120 words.]\n\n' +

    '=== EMAIL 5: REFERRAL REQUEST ===\n' +
    'SUBJECT: [Subject line]\n' +
    'BODY:\n' +
    '[Sent to a happy customer asking for referrals. Friendly, explains why referrals matter to a small business, makes it easy to share. 80-100 words.]\n\n' +

    '=== SOCIAL POST 1 (Facebook) ===\n' +
    '[Facebook post. Conversational, warm community feel. 3-4 sentences + space + hashtags on own line. Starts with an engaging first line.]\n' +
    'HASHTAGS: [5-7 relevant hashtags]\n\n' +

    '=== SOCIAL POST 2 (Instagram) ===\n' +
    '[Instagram post. Visual hook first. 3-4 punchy sentences. Slightly more aspirational/inspirational than Facebook.]\n' +
    'HASHTAGS: [8-10 relevant hashtags including location]\n\n' +

    '=== SOCIAL POST 3 (LinkedIn) ===\n' +
    '[LinkedIn post. More professional. Could be a tip, insight or behind-the-scenes. 4-5 sentences. Professional but human.]\n' +
    'HASHTAGS: [4-5 professional hashtags]\n\n' +

    '=== SOCIAL POST 4 (Facebook) ===\n' +
    '[Facebook post about a customer result or transformation — keep anonymous. Story format. 3-4 sentences.]\n' +
    'HASHTAGS: [5-7 relevant hashtags]\n\n' +

    '=== SOCIAL POST 5 (Instagram) ===\n' +
    '[Instagram post. A tip or piece of advice related to the business type. Educational content.]\n' +
    'HASHTAGS: [8-10 hashtags]\n\n' +

    '=== SOCIAL POST 6 (LinkedIn) ===\n' +
    '[LinkedIn. The story of why this business exists / the owner\'s passion for their trade. Human and authentic.]\n' +
    'HASHTAGS: [4-5 hashtags]\n\n' +

    '=== SOCIAL POST 7 (Facebook) ===\n' +
    '[Facebook. Seasonal or timely content relevant to the business. Could be a warning, a tip or a promotion.]\n' +
    'HASHTAGS: [5-7 hashtags]\n\n' +

    '=== SOCIAL POST 8 (Instagram) ===\n' +
    '[Instagram. Before and after style post OR a "did you know" fact about the trade. Engaging and shareable.]\n' +
    'HASHTAGS: [8-10 hashtags]\n\n' +

    '=== SOCIAL POST 9 (Facebook) ===\n' +
    '[Facebook. A question or poll-style post to drive engagement. Relates to a common customer question or decision.]\n' +
    'HASHTAGS: [5-7 hashtags]\n\n' +

    '=== SOCIAL POST 10 (LinkedIn) ===\n' +
    '[LinkedIn. A piece of industry insight, a prediction or a strong opinion about the trade. Shows expertise.]\n' +
    'HASHTAGS: [4-5 hashtags]\n\n' +

    '=== QUOTE GRAPHIC 1 ===\n' +
    'QUOTE: "[An inspiring or powerful quote about their service, quality, or customer care. 15-25 words. First person from the business owner.]"\n' +
    'ATTRIBUTION: [Business owner title / business name]\n' +
    'DESIGN NOTES: [2-3 sentences of design guidance: suggested colours, mood, typography feel]\n\n' +

    '=== QUOTE GRAPHIC 2 ===\n' +
    'QUOTE: "[A quote about reliability, trust or peace of mind. 15-25 words. First person.]"\n' +
    'ATTRIBUTION: [Title]\n' +
    'DESIGN NOTES: [Design guidance]\n\n' +

    '=== QUOTE GRAPHIC 3 ===\n' +
    'QUOTE: "[A quote about the customer experience or transformation. 15-25 words.]"\n' +
    'ATTRIBUTION: [Title]\n' +
    'DESIGN NOTES: [Design guidance]\n\n' +

    '=== QUOTE GRAPHIC 4 ===\n' +
    'QUOTE: "[A quote about expertise or passion for the trade. 15-25 words.]"\n' +
    'ATTRIBUTION: [Title]\n' +
    'DESIGN NOTES: [Design guidance]\n\n' +

    '=== QUOTE GRAPHIC 5 ===\n' +
    'QUOTE: "[A quote about community, local pride or being part of the area. References the location. 15-25 words.]"\n' +
    'ATTRIBUTION: [Title]\n' +
    'DESIGN NOTES: [Design guidance]\n\n' +

    'Make EVERYTHING specific to this exact business, location and audience. Never use placeholder text. Write as if you know this business personally.';
}

/* ---------------------------------------------------------
   API CALL
   --------------------------------------------------------- */
async function callAnthropic(prompt, apiKey) {
  var response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
      'anthropic-dangerous-direct-browser-access': 'true'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 8000,
      system: 'You are an expert UK marketing copywriter. Generate structured marketing content using EXACTLY the section headers specified. Never add preamble or commentary. Start directly with the first section header.',
      messages: [{ role: 'user', content: prompt }]
    })
  });
  if (!response.ok) {
    var errData = await response.json().catch(function() { return {}; });
    throw new Error((errData.error && errData.error.message) || 'API error ' + response.status);
  }
  var data = await response.json();
  if (!data.content || !data.content[0]) throw new Error('No content returned from API.');
  return data.content[0].text;
}

/* ---------------------------------------------------------
   CONTENT PARSER
   --------------------------------------------------------- */
function extractSection(text, startMarker, endMarker) {
  var s = text.indexOf(startMarker);
  if (s === -1) return '';
  s += startMarker.length;
  var e = endMarker ? text.indexOf(endMarker, s) : text.length;
  if (e === -1) e = text.length;
  return text.slice(s, e).trim();
}

function extractField(block, fieldName) {
  var pattern = new RegExp(fieldName + ':\\s*([^\\n]+(?:\\n(?!' + ['HEADLINE','SUBHEADLINE','BODY','SUBJECT','HASHTAGS','QUOTE','ATTRIBUTION','DESIGN NOTES'].join('|') + ')[^\\n]+)*)', 'i');
  var m = block.match(pattern);
  return m ? m[1].trim().replace(/^\[|]$/g, '') : '';
}

function parseContent(text) {
  var sections = [
    '=== LANDING PAGE ===',
    '=== EMAIL 1: ENQUIRY RESPONSE ===',
    '=== EMAIL 2: QUOTE FOLLOW-UP ===',
    '=== EMAIL 3: REVIEW REQUEST ===',
    '=== EMAIL 4: SEASONAL PROMOTION ===',
    '=== EMAIL 5: REFERRAL REQUEST ===',
    '=== SOCIAL POST 1 (Facebook) ===',
    '=== SOCIAL POST 2 (Instagram) ===',
    '=== SOCIAL POST 3 (LinkedIn) ===',
    '=== SOCIAL POST 4 (Facebook) ===',
    '=== SOCIAL POST 5 (Instagram) ===',
    '=== SOCIAL POST 6 (LinkedIn) ===',
    '=== SOCIAL POST 7 (Facebook) ===',
    '=== SOCIAL POST 8 (Instagram) ===',
    '=== SOCIAL POST 9 (Facebook) ===',
    '=== SOCIAL POST 10 (LinkedIn) ===',
    '=== QUOTE GRAPHIC 1 ===',
    '=== QUOTE GRAPHIC 2 ===',
    '=== QUOTE GRAPHIC 3 ===',
    '=== QUOTE GRAPHIC 4 ===',
    '=== QUOTE GRAPHIC 5 ==='
  ];

  function getBlock(marker, nextMarker) {
    return extractSection(text, marker, nextMarker || null);
  }

  // Landing Page
  var landingBlock = getBlock('=== LANDING PAGE ===', '=== EMAIL 1');
  var bodyMatch = landingBlock.match(/BODY:\s*\n([\s\S]+?)(?=\n===|$)/i);
  var landing = {
    headline: extractField(landingBlock, 'HEADLINE'),
    subheadline: extractField(landingBlock, 'SUBHEADLINE'),
    body: bodyMatch ? bodyMatch[1].trim().replace(/^\[|]$/g, '') : ''
  };

  // Emails
  var emailDefs = [
    { key: 'enquiry',  label: 'Enquiry Response',  badge: 'badge-enquiry',  marker: '=== EMAIL 1: ENQUIRY RESPONSE ===',  next: '=== EMAIL 2' },
    { key: 'followup', label: 'Quote Follow-Up',   badge: 'badge-followup', marker: '=== EMAIL 2: QUOTE FOLLOW-UP ===',    next: '=== EMAIL 3' },
    { key: 'review',   label: 'Review Request',    badge: 'badge-review',   marker: '=== EMAIL 3: REVIEW REQUEST ===',     next: '=== EMAIL 4' },
    { key: 'seasonal', label: 'Seasonal Promotion',badge: 'badge-seasonal', marker: '=== EMAIL 4: SEASONAL PROMOTION ===', next: '=== EMAIL 5' },
    { key: 'referral', label: 'Referral Request',  badge: 'badge-referral', marker: '=== EMAIL 5: REFERRAL REQUEST ===',   next: '=== SOCIAL POST 1' }
  ];
  var emails = emailDefs.map(function(e) {
    var block = getBlock(e.marker, e.next);
    var bodyM = block.match(/BODY:\s*\n([\s\S]+?)(?=\n===|$)/i);
    return {
      key: e.key, label: e.label, badge: e.badge,
      subject: extractField(block, 'SUBJECT'),
      body: bodyM ? bodyM[1].trim().replace(/^\[|]$/g, '') : block
    };
  });

  // Social Posts
  var socialDefs = [
    { num: 1,  platform: 'Facebook',  next: '=== SOCIAL POST 2' },
    { num: 2,  platform: 'Instagram', next: '=== SOCIAL POST 3' },
    { num: 3,  platform: 'LinkedIn',  next: '=== SOCIAL POST 4' },
    { num: 4,  platform: 'Facebook',  next: '=== SOCIAL POST 5' },
    { num: 5,  platform: 'Instagram', next: '=== SOCIAL POST 6' },
    { num: 6,  platform: 'LinkedIn',  next: '=== SOCIAL POST 7' },
    { num: 7,  platform: 'Facebook',  next: '=== SOCIAL POST 8' },
    { num: 8,  platform: 'Instagram', next: '=== SOCIAL POST 9' },
    { num: 9,  platform: 'Facebook',  next: '=== SOCIAL POST 10' },
    { num: 10, platform: 'LinkedIn',  next: '=== QUOTE GRAPHIC 1' }
  ];
  var posts = socialDefs.map(function(p) {
    var marker = '=== SOCIAL POST ' + p.num + ' (' + p.platform + ') ===';
    var block = getBlock(marker, p.next);
    var hashMatch = block.match(/HASHTAGS:\s*([^\n]+)/i);
    var hashText = hashMatch ? hashMatch[1].trim() : '';
    var postText = block.replace(/HASHTAGS:\s*[^\n]+/i, '').trim();
    return {
      num: p.num,
      platform: p.platform,
      text: postText,
      hashtags: hashText
    };
  });

  // Quote Graphics
  var quoteDefs = [
    { num: 1, next: '=== QUOTE GRAPHIC 2' },
    { num: 2, next: '=== QUOTE GRAPHIC 3' },
    { num: 3, next: '=== QUOTE GRAPHIC 4' },
    { num: 4, next: '=== QUOTE GRAPHIC 5' },
    { num: 5, next: null }
  ];
  var quotes = quoteDefs.map(function(q) {
    var marker = '=== QUOTE GRAPHIC ' + q.num + ' ===';
    var block = getBlock(marker, q.next);
    var dnMatch = block.match(/DESIGN NOTES:\s*([\s\S]+?)(?=\n===|$)/i);
    return {
      num: q.num,
      quote: extractField(block, 'QUOTE').replace(/^"|"$/g, ''),
      attribution: extractField(block, 'ATTRIBUTION'),
      designNotes: dnMatch ? dnMatch[1].trim() : ''
    };
  });

  return { landing: landing, emails: emails, posts: posts, quotes: quotes, raw: text };
}

/* ---------------------------------------------------------
   LOADING ANIMATION
   --------------------------------------------------------- */
var _loadingTimer = null;
var _stepTimer = null;

function startLoading() {
  var messages = [
    'Analysing your business profile',
    'Writing your landing page copy',
    'Crafting your email templates',
    'Creating your social media posts',
    'Designing your quote graphics',
    'Putting the finishing touches on your kit'
  ];
  var steps = ['lstep-1', 'lstep-2', 'lstep-3', 'lstep-4'];
  var msgEl = document.getElementById('loading-msg');
  var msgIdx = 0;
  var stepIdx = 0;

  function nextMsg() {
    msgIdx = (msgIdx + 1) % messages.length;
    if (msgEl) {
      msgEl.innerHTML = messages[msgIdx] + '<span class="ldot">.</span><span class="ldot">.</span><span class="ldot">.</span>';
    }
  }

  function nextStep() {
    if (stepIdx < steps.length) {
      if (stepIdx > 0) {
        var prev = document.getElementById(steps[stepIdx - 1]);
        if (prev) { prev.classList.remove('active'); prev.classList.add('done'); }
      }
      var cur = document.getElementById(steps[stepIdx]);
      if (cur) cur.classList.add('active');
      stepIdx++;
    }
  }

  if (msgEl) msgEl.innerHTML = messages[0] + '<span class="ldot">.</span><span class="ldot">.</span><span class="ldot">.</span>';
  nextStep();
  _loadingTimer = setInterval(nextMsg, 2500);
  _stepTimer = setInterval(nextStep, 4000);
}

function stopLoading() {
  clearInterval(_loadingTimer);
  clearInterval(_stepTimer);
  var steps = ['lstep-1', 'lstep-2', 'lstep-3', 'lstep-4'];
  steps.forEach(function(id) {
    var el = document.getElementById(id);
    if (el) { el.classList.remove('active'); el.classList.add('done'); }
  });
}

/* ---------------------------------------------------------
   MAIN GENERATE FUNCTION
   --------------------------------------------------------- */
async function generateKit() {
  var errEl = document.getElementById('form-error');
  errEl.style.display = 'none';

  var result = getFormData();
  if (result.errors.length > 0) {
    errEl.textContent = result.errors[0];
    errEl.style.display = 'block';
    errEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    return;
  }

  var btn = document.getElementById('generate-btn');
  btn.disabled = true;

  _formData = result.data;
  showSection('loading');
  startLoading();

  try {
    var prompt = buildPrompt(result.data);
    var rawText = await callAnthropic(prompt, result.data.apiKey);
    _generatedData = parseContent(rawText);
    stopLoading();
    renderResults(_generatedData, result.data);
    showSection('results');
  } catch (err) {
    stopLoading();
    showSection('form');
    btn.disabled = false;
    errEl.textContent = 'Generation failed: ' + err.message + '. Please check your API key and try again.';
    errEl.style.display = 'block';
    document.getElementById('form-top').scrollIntoView({ behavior: 'smooth' });
  }
}

/* ---------------------------------------------------------
   RESULTS RENDERING
   --------------------------------------------------------- */
function esc(s) {
  return (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function copyBtn(label, content) {
  return '<button class="copy-btn" onclick="copyText(this,' + JSON.stringify(content) + ')">' +
    '<span>📋</span>' + label + '</button>';
}

function renderResults(data, formData) {
  // Update subtitle
  var sub = document.getElementById('results-biz-label');
  if (sub) sub.textContent = 'Complete marketing kit for ' + formData.businessType + ' · ' + formData.location;

  renderLanding(data.landing);
  renderEmails(data.emails);
  renderPosts(data.posts);
  renderQuotes(data.quotes);
}

function renderLanding(landing) {
  var el = document.getElementById('landing-content');
  if (!el) return;
  el.innerHTML = [
    '<div class="landing-field">',
    '  <div class="landing-field-label">',
    '    <span class="landing-field-title">Main Headline</span>',
    '    ' + copyBtn('Copy headline', landing.headline),
    '  </div>',
    '  <div class="landing-headline-text">' + esc(landing.headline) + '</div>',
    '</div>',
    '<div class="landing-field">',
    '  <div class="landing-field-label">',
    '    <span class="landing-field-title">Subheadline</span>',
    '    ' + copyBtn('Copy subheadline', landing.subheadline),
    '  </div>',
    '  <div class="landing-sub-text">' + esc(landing.subheadline) + '</div>',
    '</div>',
    '<div class="landing-field">',
    '  <div class="landing-field-label">',
    '    <span class="landing-field-title">Body Copy (~200 words)</span>',
    '    ' + copyBtn('Copy body copy', landing.body),
    '  </div>',
    '  <div class="landing-body-text">' + esc(landing.body) + '</div>',
    '</div>',
    '<div class="landing-field" style="background:var(--surface)">',
    '  <div class="landing-field-label">',
    '    <span class="landing-field-title">Copy All Landing Page Copy</span>',
    '    ' + copyBtn('Copy all', landing.headline + '\n\n' + landing.subheadline + '\n\n' + landing.body),
    '  </div>',
    '  <p style="font-size:12px;color:var(--muted);">Copies headline + subheadline + body copy in one click.</p>',
    '</div>'
  ].join('');
}

function renderEmails(emails) {
  var el = document.getElementById('emails-content');
  if (!el) return;
  el.innerHTML = emails.map(function(email, i) {
    var allText = 'Subject: ' + email.subject + '\n\n' + email.body;
    return [
      '<div class="email-card">',
      '  <div class="email-header">',
      '    <div>',
      '      <span class="email-type-badge ' + email.badge + '">Email ' + (i + 1) + ' — ' + email.label + '</span>',
      '      <div class="email-subject"><span class="email-subject-label">Subject:</span>' + esc(email.subject) + '</div>',
      '    </div>',
      '    ' + copyBtn('Copy email', allText),
      '  </div>',
      '  <div class="email-body-wrap">',
      '    <div class="email-body">' + esc(email.body) + '</div>',
      '  </div>',
      '</div>'
    ].join('');
  }).join('');
}

function renderPosts(posts) {
  var el = document.getElementById('social-content');
  if (!el) return;
  var platformColors = { 'Facebook': 'badge-fb', 'Instagram': 'badge-ig', 'LinkedIn': 'badge-li' };
  el.innerHTML = posts.map(function(post) {
    var allText = post.text + (post.hashtags ? '\n\n' + post.hashtags : '');
    return [
      '<div class="social-card" data-platform="' + esc(post.platform) + '">',
      '  <div class="social-card-header">',
      '    <div class="platform-badge ' + (platformColors[post.platform] || '') + '">' + esc(post.platform) + '</div>',
      '    <span class="social-post-num">Post ' + post.num + '</span>',
      '  </div>',
      '  <div class="social-body">',
      '    <div class="social-text">' + esc(post.text) + '</div>',
      post.hashtags ? '    <div class="social-hashtags">' + esc(post.hashtags) + '</div>' : '',
      '    <div style="margin-top:12px;">' + copyBtn('Copy post', allText) + '</div>',
      '  </div>',
      '</div>'
    ].join('');
  }).join('');
}

function renderQuotes(quotes) {
  var el = document.getElementById('quotes-content');
  if (!el) return;
  var gradients = ['qg-1', 'qg-2', 'qg-3', 'qg-4', 'qg-5'];
  el.innerHTML = quotes.map(function(q, i) {
    var allText = '"' + q.quote + '" — ' + q.attribution;
    return [
      '<div class="quote-card-wrap">',
      '  <div class="quote-graphic ' + gradients[i] + '">',
      '    <div class="quote-text">' + esc(q.quote) + '</div>',
      '    <div class="quote-attr">— ' + esc(q.attribution) + '</div>',
      '  </div>',
      '  <div class="quote-card-actions">',
      '    ' + copyBtn('Copy quote text', allText),
      '  </div>',
      '  <div class="quote-design-note">',
      '    <div class="quote-design-label">Design notes for your designer</div>',
      '    ' + esc(q.designNotes),
      '  </div>',
      '</div>'
    ].join('');
  }).join('');
}

/* ---------------------------------------------------------
   TAB SWITCHING
   --------------------------------------------------------- */
function switchTab(name, btn) {
  document.querySelectorAll('.tab-btn').forEach(function(b) { b.classList.remove('active'); });
  document.querySelectorAll('.tab-panel').forEach(function(p) { p.style.display = 'none'; p.classList.remove('active'); });
  if (btn) btn.classList.add('active');
  var panel = document.getElementById('tab-' + name);
  if (panel) { panel.style.display = 'block'; panel.classList.add('active'); }
}

/* ---------------------------------------------------------
   PLATFORM FILTER
   --------------------------------------------------------- */
function filterPosts(platform, btn) {
  document.querySelectorAll('.filter-btn').forEach(function(b) { b.classList.remove('active'); });
  if (btn) btn.classList.add('active');
  document.querySelectorAll('.social-card').forEach(function(card) {
    var p = card.getAttribute('data-platform');
    card.style.display = (platform === 'all' || p === platform) ? 'block' : 'none';
  });
}

/* ---------------------------------------------------------
   COPY TO CLIPBOARD
   --------------------------------------------------------- */
function copyText(btn, text) {
  navigator.clipboard.writeText(text).then(function() {
    btn.classList.add('copied');
    var orig = btn.innerHTML;
    btn.innerHTML = '<span>✓</span> Copied!';
    setTimeout(function() {
      btn.classList.remove('copied');
      btn.innerHTML = orig;
    }, 2000);
  }).catch(function() {
    var ta = document.createElement('textarea');
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
  });
}

/* ---------------------------------------------------------
   PDF DOWNLOAD
   --------------------------------------------------------- */
function downloadPDF() {
  if (!_generatedData || !_formData) return;
  var d = _generatedData;
  var f = _formData;

  // Use jsPDF if available, else fallback to text download
  if (typeof window.jspdf !== 'undefined') {
    var doc = new window.jspdf.jsPDF({ unit: 'mm', format: 'a4' });
    var margin = 18;
    var pageW = doc.internal.pageSize.getWidth();
    var usableW = pageW - margin * 2;
    var y = 20;
    var lineH = 6;

    function addHeading1(text) {
      if (y > 240) { doc.addPage(); y = 20; }
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 41, 59);
      doc.text(text, margin, y);
      y += lineH * 2;
      doc.setDrawColor(249, 115, 22);
      doc.setLineWidth(0.8);
      doc.line(margin, y - 4, pageW - margin, y - 4);
      y += 4;
    }
    function addHeading2(text) {
      if (y > 240) { doc.addPage(); y = 20; }
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 41, 59);
      doc.text(text, margin, y);
      y += lineH * 1.4;
    }
    function addLabel(text) {
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(148, 163, 184);
      doc.text(text.toUpperCase(), margin, y);
      y += lineH;
    }
    function addBody(text, small) {
      doc.setFontSize(small ? 9 : 10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(71, 85, 105);
      var lines = doc.splitTextToSize(text || '', usableW);
      lines.forEach(function(line) {
        if (y > 270) { doc.addPage(); y = 20; }
        doc.text(line, margin, y);
        y += lineH * 0.85;
      });
      y += lineH * 0.5;
    }
    function addGap(n) { y += lineH * (n || 1); }

    // Cover
    doc.setFillColor(30, 41, 59);
    doc.rect(0, 0, pageW, 50, 'F');
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text('Marketing Kit', margin, 22);
    doc.setFontSize(13);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(148, 163, 184);
    doc.text(f.businessType + ' · ' + f.location, margin, 33);
    doc.setFontSize(10);
    doc.text('Generated by Local Business AI Hub · ' + new Date().toLocaleDateString('en-GB', {day:'numeric',month:'long',year:'numeric'}), margin, 42);
    y = 62;

    // Landing Page
    addHeading1('Landing Page Copy');
    addLabel('Headline');
    addBody(d.landing.headline);
    addLabel('Subheadline');
    addBody(d.landing.subheadline);
    addLabel('Body Copy');
    addBody(d.landing.body);
    addGap(2);

    // Emails
    addHeading1('Email Templates');
    d.emails.forEach(function(email, i) {
      addHeading2('Email ' + (i + 1) + ' — ' + email.label);
      addLabel('Subject');
      addBody(email.subject, true);
      addLabel('Body');
      addBody(email.body);
      addGap();
    });

    // Social Posts
    addHeading1('Social Media Posts');
    d.posts.forEach(function(post) {
      addHeading2('Post ' + post.num + ' · ' + post.platform);
      addBody(post.text);
      if (post.hashtags) addBody(post.hashtags, true);
      addGap(0.5);
    });

    // Quote Graphics
    addHeading1('Quote Graphics');
    d.quotes.forEach(function(q, i) {
      addHeading2('Quote ' + (i + 1));
      addLabel('Quote');
      addBody('"' + q.quote + '"');
      addLabel('Attribution');
      addBody(q.attribution, true);
      addLabel('Design Notes');
      addBody(q.designNotes, true);
      addGap(0.5);
    });

    doc.save('marketing-kit-' + f.location.replace(/\s+/g, '-').toLowerCase() + '.pdf');
  } else {
    // Fallback: plain text download
    downloadTextFile('marketing-kit.txt', buildPlainText(_generatedData, _formData));
  }
}

/* ---------------------------------------------------------
   ZIP DOWNLOAD
   --------------------------------------------------------- */
async function downloadZIP() {
  if (!_generatedData || !_formData) return;
  var d = _generatedData;
  var f = _formData;

  if (typeof JSZip === 'undefined') {
    alert('ZIP download is loading — please try again in a moment.');
    return;
  }

  var zip = new JSZip();
  var folder = zip.folder('marketing-kit');

  // Landing page
  folder.file('01-landing-page.txt',
    'LANDING PAGE COPY\n' +
    'Generated for: ' + f.businessType + ' · ' + f.location + '\n' +
    '='.repeat(50) + '\n\n' +
    'HEADLINE\n' + d.landing.headline + '\n\n' +
    'SUBHEADLINE\n' + d.landing.subheadline + '\n\n' +
    'BODY COPY\n' + d.landing.body
  );

  // Emails
  var emailText = 'EMAIL TEMPLATES\n' +
    'Generated for: ' + f.businessType + ' · ' + f.location + '\n' +
    '='.repeat(50) + '\n\n';
  d.emails.forEach(function(email, i) {
    emailText += 'EMAIL ' + (i + 1) + ' — ' + email.label.toUpperCase() + '\n' +
      '-'.repeat(40) + '\n' +
      'Subject: ' + email.subject + '\n\n' +
      email.body + '\n\n\n';
  });
  folder.file('02-email-templates.txt', emailText);

  // Social posts
  var socialText = 'SOCIAL MEDIA POSTS\n' +
    'Generated for: ' + f.businessType + ' · ' + f.location + '\n' +
    '='.repeat(50) + '\n\n';
  d.posts.forEach(function(post) {
    socialText += 'POST ' + post.num + ' — ' + post.platform.toUpperCase() + '\n' +
      '-'.repeat(40) + '\n' +
      post.text + '\n' +
      (post.hashtags ? '\n' + post.hashtags : '') + '\n\n\n';
  });
  folder.file('03-social-media-posts.txt', socialText);

  // Quote graphics
  var quoteText = 'QUOTE GRAPHICS\n' +
    'Generated for: ' + f.businessType + ' · ' + f.location + '\n' +
    '='.repeat(50) + '\n\n';
  d.quotes.forEach(function(q, i) {
    quoteText += 'QUOTE ' + (i + 1) + '\n' +
      '-'.repeat(40) + '\n' +
      '"' + q.quote + '"\n' +
      '— ' + q.attribution + '\n\n' +
      'DESIGN NOTES:\n' + q.designNotes + '\n\n\n';
  });
  folder.file('04-quote-graphics.txt', quoteText);

  // All in one
  folder.file('00-all-content.txt', buildPlainText(d, f));

  var blob = await zip.generateAsync({ type: 'blob' });
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = url;
  a.download = 'marketing-kit-' + f.location.replace(/\s+/g, '-').toLowerCase() + '.zip';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function buildPlainText(d, f) {
  var lines = [
    'COMPLETE MARKETING KIT',
    'Business: ' + f.businessType,
    'Location: ' + f.location,
    'Generated: ' + new Date().toLocaleDateString('en-GB', {day:'numeric',month:'long',year:'numeric'}),
    '='.repeat(60),
    '', '',
    'SECTION 1: LANDING PAGE COPY',
    '='.repeat(60),
    '',
    'HEADLINE',
    d.landing.headline,
    '',
    'SUBHEADLINE',
    d.landing.subheadline,
    '',
    'BODY COPY',
    d.landing.body,
    '', '',
    'SECTION 2: EMAIL TEMPLATES',
    '='.repeat(60)
  ];
  d.emails.forEach(function(e, i) {
    lines.push('', 'Email ' + (i+1) + ' — ' + e.label, '-'.repeat(40), 'Subject: ' + e.subject, '', e.body);
  });
  lines.push('', '', 'SECTION 3: SOCIAL MEDIA POSTS', '='.repeat(60));
  d.posts.forEach(function(p) {
    lines.push('', 'Post ' + p.num + ' — ' + p.platform, '-'.repeat(40), p.text);
    if (p.hashtags) lines.push('', p.hashtags);
  });
  lines.push('', '', 'SECTION 4: QUOTE GRAPHICS', '='.repeat(60));
  d.quotes.forEach(function(q, i) {
    lines.push('', 'Quote ' + (i+1), '-'.repeat(40), '"' + q.quote + '"', '— ' + q.attribution, '', 'Design Notes:', q.designNotes);
  });
  return lines.join('\n');
}

function downloadTextFile(filename, text) {
  var blob = new Blob([text], { type: 'text/plain' });
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/* ---------------------------------------------------------
   INIT
   --------------------------------------------------------- */
document.addEventListener('DOMContentLoaded', function() {
  showSection('form');
  updateProgress();
});
