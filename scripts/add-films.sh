#!/bin/bash
# Compress HeyGen sector films from ~/Downloads into src/video/,
# generate poster frames, and strip "Film coming soon —" on film pages.
# One-shot. Idempotent. Copies only — never moves/deletes from ~/Downloads.
set -eo pipefail

FFMPEG="/tmp/ff/node_modules/ffmpeg-static/ffmpeg"
SRC_DIR="$HOME/Downloads"
OUT_DIR="$HOME/local-business-hub/src/video"
REPO_ROOT="$HOME/local-business-hub"
WIRE_PY="$REPO_ROOT/scripts/wire-films.py"

[ -x "$FFMPEG" ] || { echo "ffmpeg not found at $FFMPEG"; exit 2; }
mkdir -p "$OUT_DIR"

echo "[1/3] Compressing 18 films (H.264 CRF26, max 1280w, AAC 128k)..."
FAIL=0
# slug|kind|exact source filename (ignore "(1)" duplicates)
while IFS='|' read -r slug kind src; do
  [ -z "$slug" ] && continue
  input="$SRC_DIR/$src"
  out_mp4="$OUT_DIR/${slug}-${kind}.mp4"
  out_jpg="$OUT_DIR/${slug}-${kind}.jpg"

  if [ ! -f "$input" ]; then
    echo "  MISS  $slug-$kind  (no source: $src)"
    FAIL=$((FAIL+1))
    continue
  fi

  if [ -f "$out_mp4" ] && [ -f "$out_jpg" ] && [ -s "$out_mp4" ] && [ -s "$out_jpg" ]; then
    echo "  SKIP  $slug-$kind  (already encoded)"
    continue
  fi

  echo "  ENC   $slug-$kind"
  "$FFMPEG" -nostdin -hide_banner -loglevel error -y -i "$input" \
    -vf "scale='min(1280,iw)':-2" \
    -c:v libx264 -preset veryfast -crf 26 -movflags +faststart -pix_fmt yuv420p \
    -c:a aac -b:a 128k -ac 2 \
    "$out_mp4"

  "$FFMPEG" -nostdin -hide_banner -loglevel error -y -ss 3 -i "$input" \
    -frames:v 1 -vf "scale='min(1280,iw)':-2" -q:v 3 \
    "$out_jpg"
done <<'MAP'
care-providers|website|Your website & apps_1080p.mp4
care-providers|ai|AI & automation_1080p.mp4
builders-maintenance|website|Your website & apps Builders & maintenance,_1080p.mp4
builders-maintenance|ai|Film 2_ AI & automation (export as builders-maintenance-ai.mp4)_1080p.mp4
electricians-plumbers|website|Film 1_ Your website & apps (export as electricians-plumbers-website.mp4)_1080p.mp4
electricians-plumbers|ai|Film 2_ AI & automation (export as electricians-plumbers-ai.mp4_1080p.mp4
property-lettings|website|Film 1_ Your website & apps (export as property-lettings-website.mp4)_1080p.mp4
property-lettings|ai|Film 2_ AI & automation (export as property-lettings-ai.mp4)_1080p.mp4
professional-services|website|Film 1_ Your website & apps (export as professional-services-website.mp4)_1080p.mp4
professional-services|ai|Film 2_ AI & automation (export as professional-services-ai.mp4)_1080p.mp4
hospitality|website|Film 1_ Your website & apps (export as hospitality-website.mp4)_1080p.mp4
hospitality|ai|Film 2_ AI & automation (export as hospitality-ai.mp4)_1080p.mp4
shops-retail|website|Film 1_ Your website & apps (export as shops-retail-website.mp4)_1080p.mp4
shops-retail|ai|Film 2_ AI & automation (export as shops-retail-ai.mp4)_1080p.mp4
training-education|website|Film 1_ Your website & apps (export as training-education-website.mp4)_1080p.mp4
training-education|ai|Film 2_ AI & automation (export as training-education-ai.mp4)_1080p.mp4
other-businesses|website|Film 1_ Your website & apps (export as other-businesses-website.mp4)_1080p.mp4
other-businesses|ai|Film 2_ AI & automation (export as other-businesses-ai.mp4)_1080p.mp4
MAP

echo
echo "[2/3] Output summary:"
ls -lh "$OUT_DIR" | awk 'NR>1 {printf "  %-40s %s\n", $NF, $5}'

echo
echo "[3/3] Wiring: hide 'Film coming soon —' on 5 film sector pages..."
python3 "$WIRE_PY"

echo
if [ "$FAIL" -gt 0 ]; then
  echo "DONE with $FAIL missing source(s)."
  exit 1
fi
echo "DONE: 18 films + 18 posters + wiring complete."
