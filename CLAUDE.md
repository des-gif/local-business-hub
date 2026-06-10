# CLAUDE.md

## Rule: Syntax-check every .js file before pushing

Before pushing **any** change, run `node --check` on every `.js` file you edited — including files in `netlify/functions/`. Only push if **all pass clean**. One JS syntax error can break the whole page or take a function offline.

```bash
# Example — run these for every JS file touched in the session:
node --check netlify/functions/chat.js
node --check netlify/functions/generate.js
node --check netlify/functions/video.js
node --check src/js/app.js
```

If any file fails, fix the error and re-check before pushing. Never skip this step.

## Deploy economy
DEPLOY ECONOMY — minimise Netlify production deploys. Every push to main triggers a Netlify production deploy that costs 15 credits. Therefore:
- Make ALL the file changes for a task FIRST. Do not push after each individual edit.
- Run node --check, then push EVERYTHING for the task in a SINGLE commit (all changed files in one commit — never one commit per file).
- Only push to main when the change is genuinely ready to go live.
- For experimenting or previewing, prefer a branch/preview deploy (free) rather than pushing to main.
