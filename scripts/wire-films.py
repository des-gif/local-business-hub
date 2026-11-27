#!/usr/bin/env python3
"""On the 5 sector pages that now have films, remove the
'<span>Film coming soon —</span>' prefix inside both screen figures.
Leaves the 'Discuss your project' link intact. Idempotent."""
import pathlib, re, sys

FILM_SLUGS = [
    "care-providers",
    "builders-maintenance",
    "electricians-plumbers",
    "property-lettings",
    "professional-services",
]
REPO = pathlib.Path.home() / "local-business-hub"
PREFIX_RE = re.compile(r"<span>Film coming soon —</span>\s*")

changed = []
for slug in FILM_SLUGS:
    page = REPO / "src" / "sectors" / slug / "index.html"
    if not page.exists():
        print(f"  MISS  {slug}: page not found", file=sys.stderr)
        continue
    html = page.read_text(encoding="utf-8")
    new_html, n = PREFIX_RE.subn("", html)
    if n == 0:
        print(f"  skip  {slug}: nothing to strip (already clean)")
        continue
    page.write_text(new_html, encoding="utf-8")
    changed.append(f"{slug} ({n} figures)")

print(f"  edited {len(changed)} / {len(FILM_SLUGS)} pages: {', '.join(changed) or '(none)'}")
