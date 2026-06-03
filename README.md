# Local Business AI Hub

AI-powered business kit generator for UK local trades and small businesses.

## What it does

Users answer 10 questions about their trade and business, then the Anthropic API generates a complete marketing kit including:

- Landing page copy
- Email templates (enquiry reply, quote follow-up, review request)
- 10 social media posts
- Professional quote template
- WhatsApp/SMS follow-up messages

## Tech stack

- HTML / CSS / JavaScript (vanilla, no framework)
- Anthropic API (claude-sonnet-4-6)
- Netlify (hosting)

## Project structure

```
local-business-hub/
├── src/
│   ├── index.html       # Main page
│   ├── css/
│   │   └── styles.css   # All styles
│   └── js/
│       └── app.js       # All JavaScript logic
├── public/              # Static assets
├── netlify.toml         # Netlify config (publish dir: src)
├── package.json
└── README.md
```

## Running locally

```bash
npx serve src
```

Then open http://localhost:3000

## Deployment

Deployed automatically via Netlify on push to `main`.

**Live site:** https://local-business-hub.netlify.app

## Status

In Development — built by [Webb Care Consultancy](https://webbcareconsultancy.com)
