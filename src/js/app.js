'use strict';

/* ===== STATE ===== */
var state = {
  step: 1,
  trade: '',
  bizName: '', firstName: '', location: '', yearsInBiz: '', phone: '', email: '',
  services: [],
  otherServices: '',
  customers: [],
  coverageArea: '', usp: '',
  pricingModel: '',
  startPrice: '', guarantees: '',
  apiKey: ''
};

/* ===== TRADE SERVICES MAP ===== */
var tradeServices = {
  'Builder':['Extensions & loft conversions','New builds & self-build','Renovations & refurbishments','Plastering & rendering','Bricklaying & blockwork','Roofing & guttering','Patios & driveways','Garden walls & fencing'],
  'Plumber':['Emergency callouts','Boiler installation & servicing','Bathroom fitting','Leak detection & repairs','Central heating installation','Drain unblocking','Power flushing','General plumbing'],
  'Electrician':['Full & partial rewires','Consumer unit installation','Fault finding & testing','EV charger installation','PAT testing','Lighting design & installation','CCTV & alarms','Solar panel installation'],
  'Hairdresser':['Cuts & styling','Colouring & highlights','Balayage & ombre','Blow dry & finish','Keratin & smoothing treatments','Hair extensions','Bridal hair','Kids\' cuts'],
  'Barber':['Men\'s cuts & styling','Fades & tapers','Beard trim & shaping','Hot towel shave','Kids\' cuts','Scalp treatments','Hair colouring','Line-ups & designs'],
  'Cleaner':['Regular domestic cleaning','End of tenancy clean','Deep clean & spring clean','Office & commercial cleaning','Oven & appliance cleaning','Carpet & upholstery cleaning','Window cleaning','After-build clean'],
  'Decorator':['Interior painting & decorating','Exterior painting','Wallpaper hanging','Wood staining & varnishing','Commercial & office decorating','New build decoration','Feature walls','Colour consultation'],
  'Gardener':['Lawn mowing & edging','Garden clearance & tidying','Hedge trimming & shaping','Planting & landscaping','Tree surgery & pruning','Decking & patio installation','Regular maintenance contracts','Garden design'],
  'Mobile Mechanic':['Full servicing','Brakes & pads','Tyres & punctures','Battery replacement','Diagnostic checks','MOT preparation','Oil & filter changes','Clutch & gearbox'],
  'Beauty Therapist':['Nails & gel extensions','Lashes & brow tinting','Waxing & threading','Facials & skin treatments','Massage therapy','Spray tanning','Eyelash extensions','Bridal packages'],
  'Tutor':['Primary school support','Secondary school tutoring','GCSE preparation','A-Level tutoring','Maths','English & literacy','Science & biology','11+ exam preparation'],
  'Dog Groomer':['Full groom & styling','Bath & brush','Nail clipping & filing','Ear & teeth cleaning','De-matting & de-shedding','Breed-specific styling','Puppy first groom','Mobile grooming'],
  'Photographer':['Wedding photography','Family portraits','Newborn & bump','Commercial & product','Events & corporate','Headshots & personal brand','Property & interiors','Graduation'],
  'Personal Trainer':['Weight loss programmes','Muscle building & toning','Online coaching','Group training sessions','Nutrition advice & planning','HIIT & functional fitness','Rehabilitation & recovery','Home & gym sessions'],
  'Childminder':['Full-time childcare','Before & after school care','Holiday childcare','EYFS activities & learning','School runs','Flexible drop-in sessions','Baby & toddler care','Ofsted registered care'],
  'Other':['Enquiries & consultations','Appointments & bookings','Home visits','Remote & online services','Bespoke projects','Emergency call-outs','Maintenance & servicing','Installations']
};

/* ===== STEP NAVIGATION ===== */
function goStep(n) {
  var cur = document.getElementById('step' + state.step);
  var next = document.getElementById('step' + n);
  if (!next) return;

  if (state.step === 1 && n > 1 && !state.trade) {
    alert('Please select your trade type first.');
    return;
  }
  if (state.step === 2 && n > 2) {
    if (!document.getElementById('bizName').value.trim()) {
      alert('Please enter your business name.');
      return;
    }
    if (!document.getElementById('location').value.trim()) {
      alert('Please enter your town or city.');
      return;
    }
    collectStep2();
  }
  if (state.step === 3 && n > 3) collectStep3();
  if (state.step === 4 && n > 4) collectStep4();
  if (state.step === 5 && n > 5) collectStep5();

  cur.classList.remove('active');
  next.classList.add('active');
  state.step = n;
  updateProgress(n);

  document.getElementById('demo').scrollIntoView({behavior:'smooth', block:'start'});
}

function updateProgress(step) {
  var steps = document.querySelectorAll('.progress-step');
  steps.forEach(function(s, i) {
    s.classList.remove('active', 'done');
    if (i < step - 1) s.classList.add('done');
    else if (i === step - 1) s.classList.add('active');
  });
  var pct = (step / 6) * 100;
  document.getElementById('progressFill').style.width = pct + '%';
}

/* ===== TRADE SELECTION ===== */
function selectTrade(btn) {
  document.querySelectorAll('.trade-btn').forEach(function(b) { b.classList.remove('selected'); });
  btn.classList.add('selected');
  state.trade = btn.dataset.trade;
  var otherField = document.getElementById('other-trade-field');
  otherField.style.display = state.trade === 'Other' ? 'block' : 'none';
  renderServicesForTrade(state.trade);
  document.getElementById('trade-label-4').textContent = state.trade.toLowerCase() + 's';
}

function renderServicesForTrade(trade) {
  var services = tradeServices[trade] || tradeServices['Other'];
  var grid = document.getElementById('servicesGrid');
  grid.innerHTML = '';
  services.forEach(function(svc) {
    var label = document.createElement('label');
    label.className = 'check-item';
    label.innerHTML = '<input type="checkbox" value="' + escHtml(svc) + '"> ' + escHtml(svc);
    var cb = label.querySelector('input');
    cb.addEventListener('change', function() {
      label.classList.toggle('checked', cb.checked);
    });
    grid.appendChild(label);
  });
}

/* ===== DATA COLLECTION ===== */
function collectStep2() {
  state.bizName = document.getElementById('bizName').value.trim();
  state.firstName = document.getElementById('firstName').value.trim();
  state.location = document.getElementById('location').value.trim();
  state.yearsInBiz = document.getElementById('yearsInBiz').value.trim();
  state.phone = document.getElementById('phone').value.trim();
  state.email = document.getElementById('email').value.trim();
}
function collectStep3() {
  var checks = document.querySelectorAll('#servicesGrid input:checked');
  state.services = Array.from(checks).map(function(c) { return c.value; });
  state.otherServices = document.getElementById('otherServices').value.trim();
}
function collectStep4() {
  var checks = document.querySelectorAll('#customerGrid input:checked');
  state.customers = Array.from(checks).map(function(c) { return c.value; });
  state.coverageArea = document.getElementById('coverageArea').value.trim();
  state.usp = document.getElementById('usp').value.trim();
}
function collectStep5() {
  var radio = document.querySelector('input[name="pricing"]:checked');
  state.pricingModel = radio ? radio.value : '';
  state.startPrice = document.getElementById('startPrice').value.trim();
  state.guarantees = document.getElementById('guarantees').value.trim();
}

/* ===== GENERATION ===== */
var loadingMessages = [
  'Analysing your business',
  'Writing your landing page',
  'Creating your email templates',
  'Building your social posts',
  'Crafting your quote template',
  'Writing your follow-up messages',
  'Your kit is almost ready'
];

function generateKit() {
  collectStep2(); collectStep3(); collectStep4(); collectStep5();
  var key = document.getElementById('apiKey').value.trim();
  if (!key) { showError('Please enter your Anthropic API key.'); return; }
  if (!key.startsWith('sk-ant-')) { showError('That doesn\'t look like a valid Anthropic API key. It should start with sk-ant-'); return; }
  state.apiKey = key;

  document.getElementById('generateArea').style.display = 'none';
  document.getElementById('loadingArea').style.display = 'block';
  document.getElementById('errorArea').style.display = 'none';

  var msgEl = document.getElementById('loadingMsg');
  var msgIdx = 0;
  var msgInterval = setInterval(function() {
    msgIdx = (msgIdx + 1) % loadingMessages.length;
    msgEl.innerHTML = loadingMessages[msgIdx] + '<span class="loading-dots"></span>';
  }, 2200);

  callAnthropicAPI(buildPrompt())
    .then(function(result) {
      clearInterval(msgInterval);
      parseAndDisplay(result);
      goStep(7);
    })
    .catch(function(err) {
      clearInterval(msgInterval);
      document.getElementById('loadingArea').style.display = 'none';
      document.getElementById('generateArea').style.display = 'block';
      showError('Generation failed: ' + err.message + '. Check your API key and try again.');
    });
}

function buildPrompt() {
  var trade = state.trade === 'Other' ? (document.getElementById('otherTrade').value.trim() || 'local business') : state.trade;
  var allServices = state.services.concat(state.otherServices ? [state.otherServices] : []).join(', ') || 'general services';
  var customers = state.customers.join(', ') || 'homeowners and local customers';
  var yearsText = state.yearsInBiz ? state.yearsInBiz + ' years in business' : '';
  var priceText = state.pricingModel + (state.startPrice ? ', starting from ' + state.startPrice : '');

  return 'Generate a complete business marketing kit for this local business.\n\n' +
    'BUSINESS DETAILS:\n' +
    'Trade: ' + trade + '\n' +
    'Business Name: ' + (state.bizName || trade + ' Services') + '\n' +
    'First Name: ' + (state.firstName || 'the owner') + '\n' +
    'Location: ' + (state.location || 'local area') + '\n' +
    (yearsText ? 'Experience: ' + yearsText + '\n' : '') +
    'Phone: ' + (state.phone || '[phone number]') + '\n' +
    'Email: ' + (state.email || '[email address]') + '\n' +
    'Services: ' + allServices + '\n' +
    'Main customers: ' + customers + '\n' +
    'Coverage area: ' + (state.coverageArea || state.location || 'local area') + '\n' +
    'What makes them different: ' + (state.usp || 'reliable, professional service') + '\n' +
    'Pricing model: ' + (priceText || 'free quotes available') + '\n' +
    (state.guarantees ? 'Guarantees: ' + state.guarantees + '\n' : '') + '\n' +
    'INSTRUCTIONS:\n' +
    'Generate ALL FIVE sections below. Use clear section headers exactly as shown.\n\n' +
    '=== LANDING PAGE COPY ===\n' +
    'Write: a compelling headline, a subheadline (2 sentences), an "About" paragraph (3-4 sentences), a services section listing each service with a 1-sentence description, 5 FAQs with answers, a strong call to action, and 4 trust badges.\n\n' +
    '=== EMAIL TEMPLATES ===\n' +
    'Write 4 complete emails:\n' +
    '1. INSTANT ENQUIRY REPLY — sent within minutes of a new enquiry\n' +
    '2. QUOTE FOLLOW-UP — sent 3 days after quote if no response\n' +
    '3. NO RESPONSE CHASE — sent 7 days after first contact\n' +
    '4. REVIEW REQUEST — sent after job completion\n' +
    'Each email should have: Subject line, greeting, body (3-5 sentences), sign-off.\n\n' +
    '=== SOCIAL MEDIA POSTS ===\n' +
    'Write 10 social media posts for Facebook and Instagram. Each post should have a caption (2-4 sentences, conversational and engaging) and 5-8 relevant hashtags. Number each post 1-10.\n\n' +
    '=== QUOTE TEMPLATE ===\n' +
    'Write a professional quote template with: business name header, date and quote number fields, customer details section, itemised services/costs table (with example rows for their services), terms and conditions (5 bullet points), payment terms, and a professional sign-off.\n\n' +
    '=== FOLLOW-UP MESSAGES ===\n' +
    'Write 5 short WhatsApp/SMS messages (under 160 characters each where possible, but can be longer if needed):\n' +
    '1. NEW ENQUIRY RECEIVED — confirming you got their message\n' +
    '2. QUOTE SENT — letting them know the quote is on its way\n' +
    '3. JOB BOOKED — confirmation and next steps\n' +
    '4. JOB COMPLETE — thank you and what happens next\n' +
    '5. REVIEW REQUEST — friendly ask for a Google review\n\n' +
    'Make everything specific to their trade, location and business name. Use warm, professional, locally-relevant language. Never use generic corporate language.';
}

function callAnthropicAPI(prompt) {
  return fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': state.apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
      'anthropic-dangerous-direct-browser-access': 'true'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 8000,
      system: 'You are an expert marketing copywriter specialising in local trade businesses in the UK. You write professional, conversion-focused copy for small local businesses including builders, plumbers, electricians, hairdressers, cleaners, gardeners and other tradespeople. Your copy is warm, trustworthy, locally relevant and designed to capture leads and convert enquiries into paying customers. Always use the business name and location provided. Always make the copy specific to the trade. Never use generic corporate language. Write like a trusted local business, not a big company.',
      messages: [{role: 'user', content: prompt}]
    })
  }).then(function(res) {
    if (!res.ok) {
      return res.json().then(function(e) {
        throw new Error(e.error ? e.error.message : 'API error ' + res.status);
      });
    }
    return res.json();
  }).then(function(data) {
    if (!data.content || !data.content[0]) throw new Error('No content returned from API.');
    return data.content[0].text;
  });
}

function parseAndDisplay(text) {
  var sections = {
    landing: extract(text, '=== LANDING PAGE COPY ===', '=== EMAIL TEMPLATES ==='),
    emails:  extract(text, '=== EMAIL TEMPLATES ===', '=== SOCIAL MEDIA POSTS ==='),
    social:  extract(text, '=== SOCIAL MEDIA POSTS ===', '=== QUOTE TEMPLATE ==='),
    quote:   extract(text, '=== QUOTE TEMPLATE ===', '=== FOLLOW-UP MESSAGES ==='),
    followup:extract(text, '=== FOLLOW-UP MESSAGES ===', null)
  };
  document.getElementById('out-landing').textContent = sections.landing || text;
  document.getElementById('out-emails').textContent  = sections.emails  || 'See Landing Page tab for full output.';
  document.getElementById('out-social').textContent  = sections.social  || 'See Landing Page tab for full output.';
  document.getElementById('out-quote').textContent   = sections.quote   || 'See Landing Page tab for full output.';
  document.getElementById('out-followup').textContent= sections.followup|| 'See Landing Page tab for full output.';
}

function extract(text, startMarker, endMarker) {
  var s = text.indexOf(startMarker);
  if (s === -1) return '';
  s += startMarker.length;
  var e = endMarker ? text.indexOf(endMarker, s) : text.length;
  if (e === -1) e = text.length;
  return text.slice(s, e).trim();
}

/* ===== TAB SWITCHING ===== */
function switchTab(btn, panelId) {
  document.querySelectorAll('.output-tab').forEach(function(t) { t.classList.remove('active'); });
  document.querySelectorAll('.output-panel').forEach(function(p) { p.classList.remove('active'); });
  btn.classList.add('active');
  document.getElementById(panelId).classList.add('active');
}

/* ===== COPY & DOWNLOAD ===== */
function copyTab(elId) {
  var el = document.getElementById(elId);
  if (!el) return;
  navigator.clipboard.writeText(el.textContent).then(function() {
    var btn = el.parentElement.querySelector('button');
    var orig = btn.textContent;
    btn.textContent = '✓ Copied!';
    setTimeout(function() { btn.textContent = orig; }, 2000);
  }).catch(function() {
    var ta = document.createElement('textarea');
    ta.value = el.textContent;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
  });
}

function downloadTab(elId, filename) {
  var el = document.getElementById(elId);
  if (!el) return;
  var blob = new Blob([el.textContent], {type:'text/plain'});
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = url; a.download = filename + '.txt';
  document.body.appendChild(a); a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/* ===== UTILITIES ===== */
function showError(msg) {
  var el = document.getElementById('errorArea');
  el.textContent = msg;
  el.style.display = 'block';
}

function escHtml(s) {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function resetTool() {
  state = {step:1,trade:'',bizName:'',firstName:'',location:'',yearsInBiz:'',phone:'',email:'',services:[],otherServices:'',customers:[],coverageArea:'',usp:'',pricingModel:'',startPrice:'',guarantees:'',apiKey:''};
  document.querySelectorAll('.tool-step').forEach(function(s){s.classList.remove('active');});
  document.getElementById('step1').classList.add('active');
  document.querySelectorAll('.trade-btn').forEach(function(b){b.classList.remove('selected');});
  document.querySelectorAll('.field-input').forEach(function(i){i.value='';});
  document.getElementById('other-trade-field').style.display='none';
  document.getElementById('generateArea').style.display='block';
  document.getElementById('loadingArea').style.display='none';
  document.getElementById('errorArea').style.display='none';
  updateProgress(1);
  document.getElementById('demo').scrollIntoView({behavior:'smooth'});
}

/* Checkbox/radio styling sync */
document.addEventListener('change', function(e) {
  if (e.target.type === 'checkbox') {
    e.target.closest('.check-item').classList.toggle('checked', e.target.checked);
  }
  if (e.target.type === 'radio') {
    document.querySelectorAll('.radio-item').forEach(function(r) { r.classList.remove('selected'); });
    e.target.closest('.radio-item').classList.add('selected');
  }
});

/* Init */
renderServicesForTrade('Builder');
