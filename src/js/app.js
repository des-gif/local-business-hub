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
   Q4 / Q5 PRESET DATA
   ------------------------------------------------------------ */
var SERVICE_PRESETS = {
  'Plumber':                      ['Emergency call-outs','Boiler installation & repair','Bathroom fitting','Leak detection & repair','Drain unblocking','Central heating'],
  'Electrician':                  ['Full rewiring','Consumer unit upgrades','EV charger installation','Fault finding','Smart home & lighting','PAT testing'],
  'Builder / General Contractor': ['House extensions','Loft conversions','New builds','Full renovations','Structural work','Garden rooms'],
  'Roofer':                       ['Roof repairs','New roof installation','Flat roofing','Guttering','Fascias & soffits'],
  'Decorator / Painter':          ['Interior painting & decorating','Exterior painting','Wallpapering','Woodwork & staining'],
  'Carpenter / Joiner':           ['Fitted wardrobes & storage','Kitchen fitting','Bespoke furniture','Decking','Doors & windows'],
  'Tiler':                        ['Floor tiling','Wall tiling','Bathroom tiling','Kitchen splashbacks','Outdoor paving'],
  'Heating Engineer':             ['Boiler installation','Boiler service & repair','Central heating systems','Underfloor heating','Heat pumps'],
  'Handyman':                     ['General repairs & maintenance','Furniture assembly','Shelving & hanging','Door & lock repairs','Odd jobs'],
  'Locksmith':                    ['Emergency lockouts','Lock replacement & upgrades','Security assessments','Key cutting'],
  'Pest Control':                 ['Rodent control','Insect treatment','Bird proofing','Commercial pest management'],
  'Coffee Shop / Café':           ['Coffee & hot drinks','Breakfast & brunch','Lunch & light bites','Cakes & pastries'],
  'Restaurant / Takeaway':        ['Dine-in meals','Takeaway & delivery','Catering for events','Private dining'],
  'Bakery':                       ['Fresh bread & rolls','Cakes & pastries','Wedding & celebration cakes','Custom orders'],
  'Catering / Private Chef':      ['Event catering','Private dining','Wedding catering','Corporate catering','Meal prep'],
  'Food Truck / Street Food':     ['Street food & market stalls','Event catering','Private hire','Pop-up dining'],
  'Pub / Bar':                    ['Food & drinks service','Live events','Private hire','Sunday roasts'],
  'Personal Trainer':             ['1-to-1 personal training','Group fitness sessions','Online coaching','Nutrition advice','Weight loss programmes'],
  'Gym / Fitness Studio':         ['Gym membership','Group classes','Personal training','Online programmes'],
  'Yoga / Pilates Studio':        ['Group classes','1-to-1 sessions','Online classes','Workshops & retreats'],
  'Nutritionist / Dietitian':     ['Nutrition consultations','Meal planning','Weight management','Sports nutrition'],
  'Physiotherapist':              ['Sports injury treatment','Post-surgery rehabilitation','Back & neck pain','Manual therapy'],
  'Osteopath / Chiropractor':     ['Back & spine treatment','Sports injury rehab','Neck & shoulder pain','Preventative care'],
  'Sports Massage Therapist':     ['Sports massage','Deep tissue massage','Injury rehabilitation','Pre/post-event massage'],
  'Hair Salon':                   ['Haircuts & styling','Colouring & highlights','Treatments & extensions','Blow-dries'],
  'Barber':                       ['Haircuts & fades','Beard trims & shaping','Hot towel shaves','Kids cuts'],
  'Beauty Salon / Nail Bar':      ['Manicures & pedicures','Facials','Waxing','Eyelash & eyebrow treatments'],
  'Spa':                          ['Massage treatments','Facials & skin treatments','Body treatments','Spa day packages'],
  'Massage Therapist':            ['Swedish massage','Deep tissue massage','Hot stone massage','Pregnancy massage'],
  'Tattoo & Piercing Studio':     ['Custom tattoos','Piercing services','Cover-ups & reworks','Flash tattoos'],
  'Aesthetics Clinic':            ['Anti-wrinkle injections','Dermal fillers','Skin rejuvenation','Body contouring'],
  'Dog Walker / Pet Sitter':      ['Dog walking','Pet sitting & home visits','Doggy day care','Holiday pet care'],
  'Pet Groomer':                  ['Full grooming','Bath & blow-dry','Nail trimming','Breed-specific cuts'],
  'Veterinary Practice':          ['Routine check-ups','Vaccinations','Surgery','Emergency care'],
  'Pet Shop':                     ['Pet food & accessories','Small animals','Aquatics','Grooming products'],
  'Accountant / Bookkeeper':      ['Tax returns','Monthly bookkeeping','VAT returns','Payroll','Business accounts'],
  'Solicitor / Legal Services':   ['Conveyancing','Wills & probate','Employment law','Family law','Business legal advice'],
  'Financial Adviser':            ['Financial planning','Pension advice','Investments','Protection & insurance'],
  'Mortgage Broker':              ['Residential mortgages','Buy-to-let mortgages','Remortgaging','First-time buyer advice'],
  'Business Consultant':          ['Business strategy','Operations improvement','Growth planning','Project management'],
  'Marketing Agency':             ['Social media management','SEO & content','Paid advertising','Brand strategy'],
  'Coach (Life / Business)':      ['1-to-1 coaching','Group programmes','Online courses','Workshops'],
  'HR Consultant':                ['HR strategy','Recruitment support','Employment contracts','Training & development'],
  'Real Estate Agent':            ['Property sales','Property valuations','New listings','Investment properties'],
  'Letting Agent':                ['Residential lettings','Property management','Tenant finding','Rent collection'],
  'Interior Designer':            ['Full interior design','Room makeovers','Styling & mood boards','3D visualisation'],
  'Architect':                    ['Architectural design','Planning applications','Building regulations','Project management'],
  'Photographer':                 ['Portrait photography','Wedding photography','Commercial photography','Events photography'],
  'Videographer':                 ['Wedding videography','Corporate video','Event filming','Social media content'],
  'Graphic Designer':             ['Logo & brand identity','Print design','Social media graphics','Packaging design'],
  'Web Designer / Developer':     ['Website design','E-commerce sites','WordPress development','Landing pages'],
  'Copywriter':                   ['Website copy','Blog & article writing','Email campaigns','SEO content'],
  'Social Media Manager':         ['Social media management','Content creation','Paid social ads','Community management'],
  'Landscaper / Gardener':        ['Garden design & landscaping','Lawn care','Patio & decking','Planting & maintenance'],
  'Tree Surgeon':                 ['Tree removal','Crown reduction & pruning','Stump grinding','Hedge trimming'],
  'Window Cleaner':               ['Domestic window cleaning','Commercial window cleaning','Conservatory cleaning','Gutter cleaning'],
  'Domestic Cleaner':             ['Regular home cleaning','One-off deep cleans','End of tenancy cleans','Ironing & laundry'],
  'Commercial Cleaner':           ['Office cleaning','Industrial cleaning','Retail & hospitality','Contract cleaning'],
  'End of Tenancy Cleaner':       ['End of tenancy deep clean','Carpet cleaning','Oven cleaning','Window cleaning'],
  'Driving Instructor':           ['Driving lessons','Intensive crash courses','Pass Plus','Theory test prep'],
  'Music Teacher':                ['Instrument lessons','Music theory','Online lessons','School workshops'],
  'Tutoring Service':             ['1-to-1 tutoring','Online tutoring','Exam preparation','Small group tuition'],
  'Childminder / Nursery':        ['Full-day childcare','After-school care','Holiday clubs','Wraparound care'],
  'Therapist / Counsellor':       ['Individual therapy','Couples counselling','CBT','Online therapy sessions'],
  'Event Planner':                ['Corporate events','Weddings & parties','Product launches','Conference management'],
  'Florist':                      ['Wedding florals','Event flowers','Bouquets & arrangements','Funeral flowers'],
  'Wedding Planner':              ['Full wedding planning','Day coordination','Venue sourcing','Styling & decor'],
  'Entertainer / DJ':             ['DJ sets & music','Live entertainment','Kids parties','Corporate events'],
  'Mechanic / Garage':            ['MOT testing','Servicing & maintenance','Diagnostics','Tyre fitting','Repairs'],
  'Mobile Mechanic':              ['Mobile servicing','Roadside repairs','Pre-purchase inspections','Tyre replacement'],
  'Car Wash / Valeting':          ['Basic wash & dry','Full valet','Interior deep clean','Paint protection'],
  'Retail Shop':                  ['In-store sales','Click & collect','Gift wrapping','Bespoke orders'],
  'Online Shop':                  ['Product sales','Subscription boxes','Custom & personalised items','Wholesale'],
  'Franchise':                    ['Franchise services','Local franchise operations','Franchise packages'],
  'Other local business':         ['Core service','Specialist service','Consultations','Custom orders']
};
var SERVICE_DEFAULT = ['Core service','Installation & fitting','Repairs & maintenance','Consultations','Custom orders','Project management'];

/* ------------------------------------------------------------
   Q4 / Q5 SELECT HELPERS
   ------------------------------------------------------------ */
function getSelectOrOther(selId, otherId) {
  var sel = document.getElementById(selId);
  if (!sel) return '';
  var val = (sel.value || '').trim();
  if (val === '__other__') {
    var oth = document.getElementById(otherId);
    return oth ? (oth.value || '').trim() : '';
  }
  return val;
}

function updateServicePresets() {
  var type = ((document.getElementById('q-type') || {}).value || '').trim();
  var presets = SERVICE_PRESETS[type] || SERVICE_DEFAULT;
  var sel = document.getElementById('q-service-sel');
  if (!sel) return;
  sel.innerHTML = '<option value="">— Select a service / product —</option>';
  presets.forEach(function(p) {
    var o = document.createElement('option');
    o.value = p; o.textContent = p;
    sel.appendChild(o);
  });
  var oo = document.createElement('option');
  oo.value = '__other__'; oo.textContent = 'Other (type your own)';
  sel.appendChild(oo);
  sel.value = '';
  var oi = document.getElementById('q-service-other');
  if (oi) { oi.style.display = 'none'; oi.value = ''; }
  updateProgress();
}

function onServiceChange() {
  var sel = document.getElementById('q-service-sel');
  var oth = document.getElementById('q-service-other');
  if (!sel || !oth) return;
  if (sel.value === '__other__') { oth.style.display = 'block'; oth.focus(); }
  else { oth.style.display = 'none'; oth.value = ''; }
  updateProgress();
}

function onServiceOtherType() { updateProgress(); }

function onCustomerChange() {
  var sel = document.getElementById('q-customer-sel');
  var oth = document.getElementById('q-customer-other');
  if (!sel || !oth) return;
  if (sel.value === '__other__') { oth.style.display = 'block'; oth.focus(); }
  else { oth.style.display = 'none'; oth.value = ''; }
  updateProgress();
}

function onCustomerOtherType() { updateProgress(); }

/* ------------------------------------------------------------
   PROGRESS BAR
   ------------------------------------------------------------ */
function updateProgress() {
  var textIds = ['q-type','q-name','q-location','q-usp','q-price','q-goal'];
  var filled = textIds.filter(function(id) {
    var el = document.getElementById(id);
    return el && el.value && el.value.trim();
  }).length;
  if (getSelectOrOther('q-service-sel','q-service-other')) filled++;
  if (getSelectOrOther('q-customer-sel','q-customer-other')) filled++;
  var radios = ['years','web'].filter(function(name) {
    return !!document.querySelector('input[name="' + name + '"]:checked');
  }).length;
  var total = 10; // 6 text + 2 select-or-other + 2 radios
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
    service:  getSelectOrOther('q-service-sel','q-service-other'),
    customer: getSelectOrOther('q-customer-sel','q-customer-other'),
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
  _kit = { landing: { headline: '', subheadline: '', body: '' }, emails: [], posts: [], videoScript: '' };

  var btn = document.getElementById('gen-btn');
  btn.disabled = true;

  // Go straight to results page with per-section loading spinners
  var desc = document.getElementById('results-desc');
  if (desc) desc.textContent = f.name + ' · ' + f.location + ' · ' + f.type;
  renderSectionLoading('out-landing');
  renderSectionLoading('out-emails');
  renderSectionLoading('out-social');
  renderSectionLoading('out-video');
  setPage('page-results');

  // Fire all 4 API calls in parallel; each section renders as its promise resolves
  await Promise.allSettled([
    callGenerate(f, 'landing')
      .then(function(text) { renderPartResult('landing', text, f); })
      .catch(function(e) { renderSectionError('out-landing', e.message); }),
    callGenerate(f, 'emails')
      .then(function(text) { renderPartResult('emails', text, f); })
      .catch(function(e) { renderSectionError('out-emails', e.message); }),
    callGenerate(f, 'social')
      .then(function(text) { renderPartResult('social', text, f); })
      .catch(function(e) { renderSectionError('out-social', e.message); }),
    callGenerate(f, 'video')
      .then(function(text) { renderPartResult('video', text, f); })
      .catch(function(e) { renderSectionError('out-video', e.message); })
  ]);

  btn.disabled = false;
}

async function callGenerate(f, part) {
  var payload = Object.assign({}, f, { part: part });
  var res = await fetch('/.netlify/functions/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    var errMsg;
    try { errMsg = (await res.json()).error; } catch (_) { errMsg = await res.text(); }
    throw new Error(errMsg || 'Generation failed (' + part + ').');
  }
  var data = await res.json();
  if (data.error) throw new Error(data.error);
  return data.text;
}

function renderSectionLoading(elId) {
  var el = document.getElementById(elId);
  if (!el) return;
  el.innerHTML = '<div class="section-loading"><div class="spinner-sm"></div><p>Generating…</p></div>';
}

function renderSectionError(elId, msg) {
  var el = document.getElementById(elId);
  if (!el) return;
  el.innerHTML = '<div class="section-error"><p>⚠️ ' + esc(msg || 'Generation failed. Please try again.') + '</p></div>';
}

function renderPartResult(part, text, f) {
  if (part === 'landing') {
    var lpBlock = extract(text, '=== LANDING PAGE ===', null);
    var landing = {
      headline:    extractLine(lpBlock, 'HEADLINE'),
      subheadline: extractLine(lpBlock, 'SUBHEADLINE'),
      body:        extractBody(lpBlock)
    };
    if (_kit) _kit.landing = landing;
    renderLanding(landing, f);

  } else if (part === 'emails') {
    var emailMeta = [
      { label: 'Enquiry Reply',    badge: 'eb-1', start: '=== EMAIL 1: ENQUIRY REPLY ===',    next: '=== EMAIL 2' },
      { label: 'Quote Follow-Up',  badge: 'eb-2', start: '=== EMAIL 2: QUOTE FOLLOW-UP ===',  next: '=== EMAIL 3' },
      { label: 'Review Request',   badge: 'eb-3', start: '=== EMAIL 3: REVIEW REQUEST ===',   next: '=== EMAIL 4' },
      { label: 'Seasonal Offer',   badge: 'eb-4', start: '=== EMAIL 4: SEASONAL OFFER ===',   next: '=== EMAIL 5' },
      { label: 'Referral Request', badge: 'eb-5', start: '=== EMAIL 5: REFERRAL REQUEST ===', next: null }
    ];
    var emails = emailMeta.map(function(m) {
      var block = extract(text, m.start, m.next);
      return { label: m.label, badge: m.badge, subject: extractLine(block, 'SUBJECT'), body: extractBody(block) || block };
    });
    if (_kit) _kit.emails = emails;
    renderEmails(emails);

  } else if (part === 'social') {
    var platCycle = ['Facebook','Instagram','LinkedIn','Facebook','Instagram','LinkedIn','Facebook','Instagram','Facebook','LinkedIn'];
    var posts = [];
    for (var i = 1; i <= 10; i++) {
      var plat = platCycle[i - 1];
      var s = '=== SOCIAL POST ' + i + ' (' + plat + ') ===';
      var nxt = i < 10 ? '=== SOCIAL POST ' + (i + 1) : null;
      var block = extract(text, s, nxt);
      var hashMatch = block.match(/HASHTAGS:\s*([^\n]+)/i);
      var postText = block.replace(/^POST:\s*/i, '').replace(/HASHTAGS:\s*[^\n]+/i, '').trim();
      posts.push({ num: i, platform: plat, text: postText, hashtags: hashMatch ? hashMatch[1].trim() : '' });
    }
    if (_kit) _kit.posts = posts;
    renderPosts(posts);

  } else if (part === 'video') {
    var videoScript = extract(text, '=== VIDEO SCRIPT ===', null);
    if (_kit) _kit.videoScript = videoScript;
    renderVideoPanel('initial', videoScript);
    if (videoScript) startVideoGeneration(videoScript, f.name);
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
  updateServicePresets(); // populates Q4 and calls updateProgress()
  chatInit();
});

/* ============================================================
   CHAT WIDGET
   Injects the floating chat UI and manages the conversation.
   ============================================================ */

var _chatHistory = [];   // [{role: 'user'|'assistant', content: string}]
var _chatOpen    = false;
var _chatBusy    = false;

var CHAT_FALLBACK = 'Sorry, something went wrong — please email des@webbcareconsultancy.com or click Get Started above.';

function chatInit() {
  var widget = document.createElement('div');
  widget.id = 'chat-widget';
  widget.innerHTML =
    '<button id="chat-toggle-btn" onclick="chatToggle()" aria-label="Open chat" aria-expanded="false">' +
      '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" style="flex-shrink:0"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>' +
      '<span class="chat-btn-label">Ask a question</span>' +
    '</button>' +
    '<div id="chat-panel" style="display:none;" role="dialog" aria-label="Chat with us">' +
      '<div class="chat-header">' +
        '<div class="chat-header-info">' +
          '<div class="chat-avatar">◈</div>' +
          '<div><div class="chat-name">Local Business AI Hub</div><div class="chat-status">Usually replies in seconds</div></div>' +
        '</div>' +
        '<button class="chat-close" onclick="chatToggle()" aria-label="Close chat">✕</button>' +
      '</div>' +
      '<div id="chat-messages" class="chat-messages">' +
        '<div class="chat-msg bot"><div class="chat-bubble">Hi there! 👋 I can help you understand what we offer — our self-serve marketing kit or our boutique video service. What would you like to know?</div></div>' +
      '</div>' +
      '<div id="chat-typing" class="chat-typing" aria-live="polite" aria-label="Assistant is typing">' +
        '<span></span><span></span><span></span>' +
      '</div>' +
      '<div class="chat-input-row">' +
        '<input type="text" id="chat-input" class="chat-input" placeholder="Type a message…" onkeydown="chatKeydown(event)" maxlength="500" autocomplete="off">' +
        '<button id="chat-send-btn" class="chat-send" onclick="chatSend()" aria-label="Send message">' +
          '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>' +
        '</button>' +
      '</div>' +
    '</div>';
  document.body.appendChild(widget);
}

function chatToggle() {
  _chatOpen = !_chatOpen;
  var panel  = document.getElementById('chat-panel');
  var btn    = document.getElementById('chat-toggle-btn');
  if (!panel) return;
  panel.style.display = _chatOpen ? 'flex' : 'none';
  if (btn) btn.setAttribute('aria-expanded', String(_chatOpen));
  if (_chatOpen) {
    chatScrollBottom();
    setTimeout(function() {
      var input = document.getElementById('chat-input');
      if (input) input.focus();
    }, 60);
  }
}

function chatKeydown(e) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    chatSend();
  }
}

function chatScrollBottom() {
  var msgs = document.getElementById('chat-messages');
  if (msgs) msgs.scrollTop = msgs.scrollHeight;
}

function chatAppendMsg(role, text) {
  var msgs = document.getElementById('chat-messages');
  if (!msgs) return;
  var wrap   = document.createElement('div');
  wrap.className = 'chat-msg ' + role;
  var bubble = document.createElement('div');
  bubble.className = 'chat-bubble';
  bubble.textContent = text;   // textContent — never innerHTML, avoids XSS
  wrap.appendChild(bubble);
  msgs.appendChild(wrap);
  chatScrollBottom();
}

async function chatSend() {
  if (_chatBusy) return;
  var input   = document.getElementById('chat-input');
  var sendBtn = document.getElementById('chat-send-btn');
  var typing  = document.getElementById('chat-typing');
  if (!input) return;

  var text = input.value.trim();
  if (!text) return;

  // Show user message immediately
  input.value = '';
  chatAppendMsg('user', text);
  _chatHistory.push({ role: 'user', content: text });

  // Enter busy state
  _chatBusy = true;
  input.disabled = true;
  if (sendBtn)  sendBtn.disabled  = true;
  if (typing)   typing.style.display = 'flex';
  chatScrollBottom();

  try {
    var res = await fetch('/.netlify/functions/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: _chatHistory })
    });

    var data;
    try { data = await res.json(); } catch (e) { data = {}; }

    if (!res.ok || data.error) {
      chatAppendMsg('bot', CHAT_FALLBACK);
    } else {
      var reply = (typeof data.reply === 'string' && data.reply) ? data.reply : CHAT_FALLBACK;
      chatAppendMsg('bot', reply);
      _chatHistory.push({ role: 'assistant', content: reply });
    }
  } catch (err) {
    chatAppendMsg('bot', CHAT_FALLBACK);
  } finally {
    _chatBusy = false;
    input.disabled = false;
    if (sendBtn)  sendBtn.disabled  = false;
    if (typing)   typing.style.display = 'none';
    input.focus();
    chatScrollBottom();
  }
}
