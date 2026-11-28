// Gates /affiliates/* behind a shared password.
// - GET /affiliates/* with no valid cookie -> renders a self-contained login page.
// - POST /affiliates/login with the right password -> sets HttpOnly cookie, 303 to /affiliates/.
// - GET /affiliates/* with a valid cookie -> context.next() (serve the static page).
//
// Cookie format: <iso-timestamp>.<base64url-hmac(iso-timestamp, secret)>
// Verification recomputes the HMAC and checks the timestamp is <= 30 days old.
// Secret lives in env AFFILIATES_COOKIE_SECRET. Password in AFFILIATES_PASSWORD.
// Both are set via Netlify UI / env:set; never client-visible.

const COOKIE = 'aff_session';
const MAX_AGE_DAYS = 30;

function b64urlFromBytes(bytes) {
  let s = '';
  for (const b of new Uint8Array(bytes)) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function hmacSign(message, secret) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(message));
  return b64urlFromBytes(sig);
}

function timingSafeEq(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

function parseCookies(header) {
  const out = {};
  if (!header) return out;
  for (const part of header.split(/;\s*/)) {
    const i = part.indexOf('=');
    if (i < 0) continue;
    out[part.slice(0, i)] = decodeURIComponent(part.slice(i + 1));
  }
  return out;
}

async function verifyCookie(value, secret) {
  if (!value) return false;
  const dot = value.lastIndexOf('.');
  if (dot < 0) return false;
  const ts = value.slice(0, dot);
  const sig = value.slice(dot + 1);
  const expected = await hmacSign(ts, secret);
  if (!timingSafeEq(sig, expected)) return false;
  const when = Date.parse(ts);
  if (!when) return false;
  const ageMs = Date.now() - when;
  if (ageMs < 0 || ageMs > MAX_AGE_DAYS * 24 * 60 * 60 * 1000) return false;
  return true;
}

async function makeCookie(secret) {
  const ts = new Date().toISOString();
  const sig = await hmacSign(ts, secret);
  return `${ts}.${sig}`;
}

function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function renderLogin({ error, next }, status = 200) {
  const nextPath = next || '/affiliates/';
  const errBlock = error
    ? `<p class="aff-login__err" role="alert">${esc(error)}</p>`
    : '';
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="robots" content="noindex, nofollow">
<title>Affiliates — Webb Digital</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Manrope:wght@500;600;700;800&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
  :root{--bg:#080D1F;--ink:#fff;--muted:#a9b2d1;--card:#121a35;--line:rgba(255,255,255,.1);--accent:#f2b65a}
  html,body{margin:0;padding:0;background:var(--bg);color:var(--ink);font-family:Inter,system-ui,-apple-system,sans-serif;min-height:100vh}
  body{display:flex;align-items:center;justify-content:center;padding:32px 16px}
  .aff-login{width:360px;max-width:100%;background:var(--card);border:1px solid var(--line);border-radius:18px;padding:32px 28px;box-shadow:0 24px 60px rgba(0,0,0,.4)}
  .aff-login h1{font-family:Manrope,sans-serif;font-weight:800;font-size:22px;margin:0 0 6px}
  .aff-login p{font-size:14px;color:var(--muted);line-height:1.5;margin:0 0 20px}
  .aff-login label{display:block;font-size:12px;color:var(--muted);margin-bottom:6px;font-weight:600;letter-spacing:.02em}
  .aff-login input[type=password]{width:100%;padding:12px 14px;border-radius:10px;border:1px solid rgba(255,255,255,.15);background:rgba(255,255,255,.05);color:#fff;font-size:15px;font-family:inherit;box-sizing:border-box;margin-bottom:16px}
  .aff-login input[type=password]:focus{outline:2px solid var(--accent);outline-offset:2px}
  .aff-login button{width:100%;padding:13px;border:0;border-radius:10px;background:var(--accent);color:#0b1640;font-weight:700;font-size:15px;cursor:pointer;font-family:inherit}
  .aff-login button:hover{filter:brightness(1.05)}
  .aff-login__err{color:#ffb4ab;font-size:13px;margin:0 0 12px}
  .aff-login__foot{font-size:12px;color:var(--muted);text-align:center;margin-top:16px;line-height:1.5}
  .aff-login__foot a{color:var(--accent);text-decoration:none}
</style>
</head>
<body>
<main class="aff-login">
  <h1>Webb Digital Affiliates</h1>
  <p>Enter the password we sent you to view the programme.</p>
  <form method="POST" action="/affiliates/login" autocomplete="off">
    <input type="hidden" name="next" value="${esc(nextPath)}">
    ${errBlock}
    <label for="aff-pw">Password</label>
    <input id="aff-pw" type="password" name="password" required autofocus>
    <button type="submit">Sign in</button>
  </form>
  <p class="aff-login__foot">Not a Webb Digital affiliate yet? <a href="/refer/">Apply here</a>.</p>
</main>
</body>
</html>`;
  return new Response(html, {
    status,
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'no-store',
      'x-robots-tag': 'noindex, nofollow',
    },
  });
}

export default async (request, context) => {
  const url = new URL(request.url);
  const path = url.pathname;

  // Only guards /affiliates/* — the Netlify edge route config enforces this too.
  if (!path.startsWith('/affiliates/') && path !== '/affiliates') {
    return context.next();
  }

  const password = Deno.env.get('AFFILIATES_PASSWORD') || '';
  const secret = Deno.env.get('AFFILIATES_COOKIE_SECRET') || '';
  if (!password || !secret) {
    return new Response(
      'Affiliates page is not fully configured yet. Please email info@webbcareconsultancy.com.',
      { status: 503, headers: { 'content-type': 'text/plain; charset=utf-8' } },
    );
  }

  // Handle the login POST.
  if (request.method === 'POST' && (path === '/affiliates/login' || path === '/affiliates/login/')) {
    let form;
    try { form = await request.formData(); }
    catch { return renderLogin({ error: 'Something went wrong — please try again.' }, 400); }
    const submitted = String(form.get('password') || '');
    const nextPath = String(form.get('next') || '/affiliates/');
    // Only allow redirecting to /affiliates/ paths — no open-redirect.
    const safeNext = nextPath.startsWith('/affiliates/') ? nextPath : '/affiliates/';
    if (submitted !== password) {
      return renderLogin({ error: 'That password is not right.', next: safeNext }, 401);
    }
    const cookie = await makeCookie(secret);
    const maxAge = MAX_AGE_DAYS * 24 * 60 * 60;
    return new Response('', {
      status: 303,
      headers: {
        'location': safeNext,
        'set-cookie': `${COOKIE}=${cookie}; HttpOnly; Secure; Path=/; SameSite=Lax; Max-Age=${maxAge}`,
        'cache-control': 'no-store',
      },
    });
  }

  // GET: check cookie, pass through if valid.
  const cookies = parseCookies(request.headers.get('cookie'));
  const sess = cookies[COOKIE];
  if (await verifyCookie(sess, secret)) {
    return context.next();
  }
  return renderLogin({ next: path }, 401);
};

export const config = { path: ['/affiliates', '/affiliates/*'] };
