// Netlify Function — calls Anthropic API server-side (key never exposed to browser)
exports.handler = async function(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return { statusCode: 500, body: JSON.stringify({ error: 'ANTHROPIC_API_KEY not configured in environment variables.' }) };
  }

  let body;
  try { body = JSON.parse(event.body); } catch {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid request body.' }) };
  }

  const prompt = buildPrompt(body);

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 8000,
        system: 'You are an expert UK marketing copywriter specialising in local businesses. Generate structured marketing content using EXACTLY the section headers specified. No preamble. No commentary. Start directly with the first section header.',
        messages: [{ role: 'user', content: prompt }]
      })
    });

    const data = await res.json();
    if (!res.ok) {
      return { statusCode: res.status, body: JSON.stringify({ error: data.error?.message || 'Anthropic API error.' }) };
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ text: data.content[0].text })
    };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};

function buildPrompt(f) {
  return [
    'Generate a complete marketing kit for this local business.',
    '',
    'BUSINESS PROFILE:',
    'Business Name: ' + f.name,
    'Business Type: ' + f.type,
    'Location / Service Area: ' + f.location,
    'Key Service or Product: ' + f.service,
    'Target Customer: ' + f.customer,
    'Unique Selling Point: ' + f.usp,
    'Price Range: ' + f.price,
    'Time in Business: ' + f.years,
    'Online Presence: ' + f.web,
    'Main Challenge: ' + f.challenge,
    'Goal for this Kit: ' + f.goal,
    '',
    'Generate ALL of the following. Use EXACTLY these section headers.',
    '',
    '=== LANDING PAGE ===',
    'HEADLINE: [Compelling headline, 8-12 words, specific to business and location]',
    'SUBHEADLINE: [Supporting line, 15-20 words]',
    'BODY:',
    '[300-500 words of professional website copy. Include: who they are, what they do, who they serve, why choose them, and a CTA. Specific to ' + f.name + ' in ' + f.location + '.]',
    '',
    '=== EMAIL 1: ENQUIRY REPLY ===',
    'SUBJECT: [Subject line]',
    'BODY:',
    '[100-150 words. Warm, prompt reply to a new enquiry. Confirms receipt, sets expectations, gives next step.]',
    '',
    '=== EMAIL 2: QUOTE FOLLOW-UP ===',
    'SUBJECT: [Subject line]',
    'BODY:',
    '[100-150 words. Sent 3 days after a quote with no reply. Polite nudge with added value.]',
    '',
    '=== EMAIL 3: REVIEW REQUEST ===',
    'SUBJECT: [Subject line]',
    'BODY:',
    '[100-150 words. Sent after job completion. Genuine, grateful, makes Google review feel easy.]',
    '',
    '=== EMAIL 4: SEASONAL OFFER ===',
    'SUBJECT: [Subject line]',
    'BODY:',
    '[100-150 words. Seasonal promotion relevant to ' + f.type + '. Creates urgency without being pushy.]',
    '',
    '=== EMAIL 5: REFERRAL REQUEST ===',
    'SUBJECT: [Subject line]',
    'BODY:',
    '[100-150 words. Asks happy customer to refer friends. Explains why it matters, easy CTA.]',
    '',
    '=== SOCIAL POST 1 (Facebook) ===',
    'POST: [60-80 chars — warm, community feel]',
    'HASHTAGS: [5-7 relevant hashtags]',
    '',
    '=== SOCIAL POST 2 (Instagram) ===',
    'POST: [60-80 chars — visual hook, aspirational]',
    'HASHTAGS: [8-10 hashtags including location]',
    '',
    '=== SOCIAL POST 3 (LinkedIn) ===',
    'POST: [60-80 chars — professional insight]',
    'HASHTAGS: [4-5 professional hashtags]',
    '',
    '=== SOCIAL POST 4 (Facebook) ===',
    'POST: [60-80 chars — customer result story]',
    'HASHTAGS: [5-7 hashtags]',
    '',
    '=== SOCIAL POST 5 (Instagram) ===',
    'POST: [60-80 chars — tip or education]',
    'HASHTAGS: [8-10 hashtags]',
    '',
    '=== SOCIAL POST 6 (LinkedIn) ===',
    'POST: [60-80 chars — founder or behind-scenes]',
    'HASHTAGS: [4-5 hashtags]',
    '',
    '=== SOCIAL POST 7 (Facebook) ===',
    'POST: [60-80 chars — seasonal/timely]',
    'HASHTAGS: [5-7 hashtags]',
    '',
    '=== SOCIAL POST 8 (Instagram) ===',
    'POST: [60-80 chars — before/after or fact]',
    'HASHTAGS: [8-10 hashtags]',
    '',
    '=== SOCIAL POST 9 (Facebook) ===',
    'POST: [60-80 chars — community engagement]',
    'HASHTAGS: [5-7 hashtags]',
    '',
    '=== SOCIAL POST 10 (LinkedIn) ===',
    'POST: [60-80 chars — industry insight]',
    'HASHTAGS: [4-5 hashtags]',
    '',
    '=== VIDEO SCRIPT ===',
    '[Write a 60-90 second talking head video script for ' + f.name + '. Conversational, professional, warm. Structure: opening hook (5s) → problem they solve (15s) → who they are and USP (20s) → social proof/results (15s) → clear CTA (10s). NO stage directions. Pure spoken word only. End naturally.]',
    '',
    'Make everything specific to ' + f.name + ' in ' + f.location + '. No generic placeholders.'
  ].join('\n');
}
