// Netlify Function — HeyGen video generation and status polling
const HEYGEN_BASE = 'https://api.heygen.com';

// Professional public avatars available on all HeyGen plans
const DEFAULT_AVATAR_ID = 'Anna_public_3_20240108';
const DEFAULT_VOICE_ID  = '2d5b0e6cf36f460aa7fc47e3eee4ba54'; // calm, professional British-adjacent

exports.handler = async function(event) {
  const method = event.httpMethod;

  if (method === 'OPTIONS') {
    return { statusCode: 200, headers: corsHeaders() };
  }
  if (method !== 'POST' && method !== 'GET') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const apiKey = process.env.HEYGEN_API_KEY;
  if (!apiKey) {
    return { statusCode: 500, headers: corsHeaders(), body: JSON.stringify({ error: 'HEYGEN_API_KEY not configured.' }) };
  }

  // GET — poll video status
  if (method === 'GET') {
    const videoId = event.queryStringParameters && event.queryStringParameters.video_id;
    if (!videoId) return { statusCode: 400, body: JSON.stringify({ error: 'video_id required' }) };

    try {
      const res = await fetch(`${HEYGEN_BASE}/v1/video_status.get?video_id=${videoId}`, {
        headers: { 'X-Api-Key': apiKey, 'Accept': 'application/json' }
      });
      const data = await res.json();
      return { statusCode: 200, headers: corsHeaders(), body: JSON.stringify(data) };
    } catch (err) {
      return { statusCode: 500, headers: corsHeaders(), body: JSON.stringify({ error: err.message }) };
    }
  }

  // POST — create video
  let body;
  try { body = JSON.parse(event.body); } catch {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid body.' }) };
  }

  const { script, businessName } = body;
  if (!script) return { statusCode: 400, body: JSON.stringify({ error: 'script is required.' }) };

  const payload = {
    video_inputs: [{
      character: {
        type: 'avatar',
        avatar_id: DEFAULT_AVATAR_ID,
        avatar_style: 'normal'
      },
      voice: {
        type: 'text',
        input_text: script,
        voice_id: DEFAULT_VOICE_ID,
        speed: 1.0
      },
      background: {
        type: 'color',
        value: '#f0f9ff'
      }
    }],
    dimension: { width: 1280, height: 720 },
    aspect_ratio: '16:9',
    title: (businessName || 'Business') + ' — Marketing Video'
  };

  try {
    const res = await fetch(`${HEYGEN_BASE}/v2/video/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': apiKey
      },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) {
      return { statusCode: res.status, headers: corsHeaders(), body: JSON.stringify({ error: data.message || data.error || 'HeyGen error.' }) };
    }
    return { statusCode: 200, headers: corsHeaders(), body: JSON.stringify(data) };
  } catch (err) {
    return { statusCode: 500, headers: corsHeaders(), body: JSON.stringify({ error: err.message }) };
  }
};

function corsHeaders() {
  return {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type'
  };
}
