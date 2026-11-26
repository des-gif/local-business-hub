// Webb Digital enquiry endpoint — modelled on Ant Wired's. Validates, enforces
// honeypot, and sends via Resend from the verified webbcareconsultancy.com domain.
// TO is ENQUIRY_TO (default des@webbcareconsultancy.com).

const FROM = 'Webb Digital <enquiries@webbcareconsultancy.com>';
const THANKS_URL = '/thanks.html';

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
  for (const [k, v] of params) out[k] = v;
  return out;
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: { Allow: 'POST' }, body: 'method not allowed' };
  }

  const d = parseBody(event);
  const type = String(d.type || '').trim();
  const name = String(d.name || '').trim();
  const business = String(d.business || '').trim();
  const phone = String(d.phone || '').trim();
  const email = String(d.email || '').trim();
  const message = String(d.message || '').trim();
  const honeypot = String(d['company-website'] || '').trim();

  if (honeypot) {
    return { statusCode: 303, headers: { Location: THANKS_URL }, body: '' };
  }
  if (!name || !email) {
    return { statusCode: 400, body: 'Please fill in your name and email.' };
  }

  const TO = process.env.ENQUIRY_TO || 'des@webbcareconsultancy.com';
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.error('RESEND_API_KEY is not set on this site');
    return { statusCode: 500, body: 'email config missing' };
  }

  const subject = `Webb Digital — new enquiry (${type || 'unspecified'}): ${name}`;
  const rows = [
    ['You are', type], ['Name', name], ['Business', business],
    ['Phone', phone], ['Email', email], ['Message', message],
  ].filter(([, v]) => v);

  const text = `A new enquiry came in from the Webb Digital website.\n\n`
    + rows.map(([k, v]) => `${k}: ${v}`).join('\n')
    + `\n\n— Sent automatically by shop.webbcareconsultancy.com. Reply directly to this email to reach ${email}.`;

  const htmlRows = rows
    .map(([k, v]) => `<tr><td style="padding:6px 12px 6px 0;color:#4b5576;font-weight:600;vertical-align:top">${esc(k)}</td><td style="padding:6px 0;color:#0b1640;white-space:pre-wrap">${esc(v)}</td></tr>`)
    .join('');
  const html = `<!doctype html><html><body style="margin:0;background:#f4f6fb;font-family:Inter,Arial,sans-serif;color:#0b1640">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:24px 0"><tr><td align="center">
  <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;padding:28px 32px;border:1px solid #e3e8f4">
    <tr><td style="font-family:'Space Grotesk',Arial,sans-serif;font-weight:800;font-size:20px;color:#0b1640;padding-bottom:4px">New Webb Digital enquiry</td></tr>
    <tr><td style="color:#4b5576;font-size:14px;padding-bottom:18px">${esc(type || 'Type not specified')}</td></tr>
    <tr><td><table role="presentation" cellpadding="0" cellspacing="0" style="font-size:15px;line-height:1.5">${htmlRows}</table></td></tr>
    <tr><td style="color:#8a92a8;font-size:12px;padding-top:18px;border-top:1px solid #eef1f8;margin-top:12px">Reply directly to this email to reach ${esc(email)}.</td></tr>
  </table>
</td></tr></table></body></html>`;

  const body = { from: FROM, to: [TO], subject, text, html, reply_to: email };

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify(body),
  });
  const txt = await res.text();
  if (!res.ok) {
    console.error('Resend send failed', res.status, txt);
    return { statusCode: 502, body: `Email send failed. Please email des@webbcareconsultancy.com directly.` };
  }
  console.log('Resend sent OK');

  const accept = (event.headers.accept || event.headers.Accept || '').toLowerCase();
  if (accept.includes('application/json')) {
    return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ok: true, thanks: THANKS_URL }) };
  }
  return { statusCode: 303, headers: { Location: THANKS_URL }, body: '' };
};
