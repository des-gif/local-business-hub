// Netlify Function — AI chat assistant for Local Business AI Hub
// Accepts POST { messages: [{role, content}, ...] }
// Always returns valid JSON, even on error.

'use strict';

var SYSTEM_PROMPT = 'You are the friendly assistant for Local Business AI Hub, a service that helps local businesses get professional marketing content quickly. Many visitors are NOT technical and may be nervous about AI — be warm, plain, jargon-free, and brief. We offer two things: (1) Self-serve kit — the customer answers about 10 simple questions and the AI instantly generates a complete marketing kit: a professional landing page, 5 email templates, 10 social posts, and a marketing video script. Fast and low-cost, do-it-yourself. (2) Boutique service — Des personally produces a full bespoke marketing video; the customer approves a script first, then Des produces it, and a fully-edited video with images/visuals is a premium upgrade. RULES: never quote prices or specific figures — if asked, say pricing depends on what they need and invite them to get in touch for a quote. Never promise delivery times. Don\'t invent features. If someone wants to buy, get a quote, or asks something you can\'t answer, warmly tell them to email des@webbcareconsultancy.com or click Get Started. Stay on topic; politely decline unrelated requests.';

exports.handler = async function (event) {
  var headers = { 'Content-Type': 'application/json' };

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: headers, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  try {
    var apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return { statusCode: 500, headers: headers, body: JSON.stringify({ error: 'API key not configured.' }) };
    }

    var body;
    try {
      body = JSON.parse(event.body);
    } catch (e) {
      return { statusCode: 400, headers: headers, body: JSON.stringify({ error: 'Invalid JSON body.' }) };
    }

    var messages = body && body.messages;
    if (!Array.isArray(messages) || messages.length === 0) {
      return { statusCode: 400, headers: headers, body: JSON.stringify({ error: 'messages array is required.' }) };
    }

    // Validate each message has role and content strings
    for (var i = 0; i < messages.length; i++) {
      var m = messages[i];
      if (!m || typeof m.role !== 'string' || typeof m.content !== 'string') {
        return { statusCode: 400, headers: headers, body: JSON.stringify({ error: 'Each message must have role and content strings.' }) };
      }
      if (m.role !== 'user' && m.role !== 'assistant') {
        return { statusCode: 400, headers: headers, body: JSON.stringify({ error: 'Message role must be "user" or "assistant".' }) };
      }
    }

    var res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 600,
        system: SYSTEM_PROMPT,
        messages: messages
      })
    });

    var data = await res.json();

    if (!res.ok) {
      var errMsg = (data && data.error && data.error.message) ? data.error.message : 'Anthropic API error.';
      return { statusCode: res.status, headers: headers, body: JSON.stringify({ error: errMsg }) };
    }

    var reply = (data.content && data.content[0] && data.content[0].text) ? data.content[0].text : '';
    return {
      statusCode: 200,
      headers: headers,
      body: JSON.stringify({ reply: reply })
    };

  } catch (err) {
    return {
      statusCode: 500,
      headers: headers,
      body: JSON.stringify({ error: err.message || 'Unexpected server error.' })
    };
  }
};
