// Affiliate — "introduce a new client" form (from the gated /affiliates/ page).
// Modelled on enquiry.js. Uses Resend, sends to info@webbcareconsultancy.com.

const FROM = 'Webb Digital Affiliates <enquiries@webbcareconsultancy.com>';
const THANKS_URL = '/affiliates/thanks.html';

function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function parseBody(event) {
  const ct = (event.headers['content-type'] || event.headers['Content-Type'] || '').toLowerCase();
  const raw = event.body || '';
  if (ct.includes('application/json')) {
    try { return JSON.parse(raw); } catch { return {}; }
  }
  const params = new URLSearchParams(raw);
  const out = {};
  for (const [k, v] of params) {
    if (out[k] === undefined) out[k] = v;
    else out[k] = Array.isArray(out[k]) ? out[k].concat(v) : [out[k], v];
  }
  return out;
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: { Allow: 'POST' }, body: 'method not allowed' };
  }
  const d = parseBody(event);

  const honeypot = String(d['company-website'] || '').trim();
  if (honeypot) {
    return { statusCode: 303, headers: { Location: THANKS_URL }, body: '' };
  }

  const yourName = String(d['your-name'] || '').trim();
  const yourEmail = String(d['your-email'] || '').trim();
  const yourPhone = String(d['your-phone'] || '').trim();
  const business = String(d['business'] || '').trim();
  const contactName = String(d['contact-name'] || '').trim();
  const contactReach = String(d['contact-reach'] || '').trim();
  const notes = String(d['notes'] || '').trim();
  const consent = String(d['consent'] || '').trim();

  let productsRaw = d['products'];
  if (productsRaw === undefined) productsRaw = [];
  if (!Array.isArray(productsRaw)) productsRaw = [productsRaw];
  const products = productsRaw.map((p) => String(p).trim()).filter(Boolean);

  if (!yourName || !yourEmail || !business || !contactName || !contactReach || products.length === 0) {
    return { statusCode: 400, body: 'Please fill in your details, the business and contact, and pick at least one product.' };
  }
  if (!consent) {
    return { statusCode: 400, body: 'Please tick to confirm the contact is happy to hear from us.' };
  }

  const TO = process.env.ENQUIRY_TO || 'info@webbcareconsultancy.com';
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.error('RESEND_API_KEY is not set on this site');
    return { statusCode: 500, body: 'email config missing' };
  }

  const subject = `New affiliate introduction — ${business}`;
  const rows = [
    ['Affiliate (you)', yourName],
    ['Your email', yourEmail],
    ['Your phone', yourPhone],
    ['Business being introduced', business],
    ['Their contact name', contactName],
    ['Phone or email for the contact', contactReach],
    ['Products', products.join(', ')],
    ['Notes', notes],
    ['Contact is happy to hear from us', consent ? 'Yes' : 'No'],
  ].filter(([, v]) => v);

  const text = `A Webb Digital affiliate has introduced a new client.\n\n`
    + rows.map(([k, v]) => `${k}: ${v}`).join('\n')
    + `\n\n— Sent automatically by shop.webbcareconsultancy.com/affiliates. Reply directly to this email to reach ${yourEmail}.`;

  const htmlRows = rows
    .map(([k, v]) => `<tr><td style="padding:6px 12px 6px 0;color:#4b5576;font-weight:600;vertical-align:top">${esc(k)}</td><td style="padding:6px 0;color:#0b1640;white-space:pre-wrap">${esc(v)}</td></tr>`)
    .join('');
  const html = `<!doctype html><html><body style="margin:0;background:#f4f6fb;font-family:Inter,Arial,sans-serif;color:#0b1640">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:24px 0"><tr><td align="center">
  <table role="presentation" width="580" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;padding:28px 32px;border:1px solid #e3e8f4">
    <tr><td style="font-family:'Space Grotesk',Arial,sans-serif;font-weight:800;font-size:20px;color:#0b1640;padding-bottom:4px">New affiliate introduction</td></tr>
    <tr><td style="color:#4b5576;font-size:14px;padding-bottom:18px">${esc(business)}</td></tr>
    <tr><td><table role="presentation" cellpadding="0" cellspacing="0" style="font-size:15px;line-height:1.5">${htmlRows}</table></td></tr>
    <tr><td style="color:#8a92a8;font-size:12px;padding-top:18px;border-top:1px solid #eef1f8;margin-top:12px">Reply directly to this email to reach ${esc(yourEmail)}.</td></tr>
  </table>
</td></tr></table></body></html>`;

  const body = { from: FROM, to: [TO], subject, text, html, reply_to: yourEmail };

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify(body),
  });
  const txt = await res.text();
  if (!res.ok) {
    console.error('Resend send failed', res.status, txt);
    return { statusCode: 502, body: `Email send failed. Please email info@webbcareconsultancy.com directly.` };
  }
  console.log('Affiliate intro sent OK');

  const accept = (event.headers.accept || event.headers.Accept || '').toLowerCase();
  if (accept.includes('application/json')) {
    return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ok: true, thanks: THANKS_URL }) };
  }
  return { statusCode: 303, headers: { Location: THANKS_URL }, body: '' };
};
