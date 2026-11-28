# CLAUDE.md

## Shop deploys ONLY via `netlify deploy --dir=src` (never git push)

**Mandatory (Des, 2026-11-28).** `src/video/` is gitignored (large mp4s). Git-triggered Netlify builds DO NOT include the videos — pushing to `main` therefore wipes every film from live. Git auto-builds for the shop site (`e08fc1be-db84-40ce-ab89-9904614b06b5`, `localbusinessai`) are now **stopped** (`build_settings.stop_builds=true`). Do not re-enable them.

Every production deploy of the shop goes through:

```bash
npx -y netlify-cli deploy --prod \
  --dir=/Users/desmondwebb/local-business-hub/src \
  --site=e08fc1be-db84-40ce-ab89-9904614b06b5 \
  --message="…"
```

After each deploy, confirm every mp4 referenced in `src/` returns 200:

```bash
for f in src/video/*.mp4; do
  n=$(basename "$f")
  c=$(curl -sI -o /dev/null -w "%{http_code}" "https://shop.webbcareconsultancy.com/video/$n")
  [ "$c" = "200" ] || echo "MISSING: $n ($c)"
done
```

Git pushes are still fine for keeping the repo in sync — they just no longer deploy.

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
