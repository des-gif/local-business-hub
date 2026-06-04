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
