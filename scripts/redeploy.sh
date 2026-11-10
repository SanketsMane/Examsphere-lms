#!/bin/bash
# Deploy the latest main to examsphere.online. Touches ONLY examsphere on this shared server.
#
#   bash /root/examsphere/scripts/redeploy.sh
#
# The live site keeps serving the whole time the new release builds. The new build goes into
# a separate directory (.next-a / .next-b), is started on a spare port and tested, and only
# then does pm2 switch over (~2 s). If the site fails its check after the switch, the script
# switches straight back to the previous build. Nothing is deleted until a release is live.
set -euo pipefail
cd /root/examsphere

APP=examsphere
LIVE_PORT=3300
CANDIDATE_PORT=3301
PUBLIC_ORIGIN=https://examsphere.online

log() { echo "[$(date -u +%H:%M:%S)] $*"; }

# Pages must render (status 200 and no Next.js error page). Login must accept our own origin
# (401 for bad credentials) and refuse a foreign one (403): that proves CSRF protection is on
# and that the real site isn't locked out by it.
check_site() {
  local base=$1 p code body
  for p in / /login /register /courses /about; do
    body=$(mktemp)
    code=$(curl -s -o "$body" -w '%{http_code}' --max-time 30 "$base$p" || true)
    if [ "$code" != 200 ] || grep -qE "Application error|Internal Server Error" "$body"; then
      log "  FAIL $p -> HTTP $code"; rm -f "$body"; return 1
    fi
    rm -f "$body"
  done
  code=$(curl -s -o /dev/null -w '%{http_code}' --max-time 30 "$base/api/auth/ok" || true)
  [ "$code" = 200 ] || { log "  FAIL /api/auth/ok -> $code"; return 1; }
  login() { curl -s -o /dev/null -w '%{http_code}' --max-time 30 -X POST "$base/api/auth/sign-in/email" \
    -H 'content-type: application/json' -H "origin: $1" -H "x-forwarded-for: 10.255.$((RANDOM%250)).$((RANDOM%250))" \
    -d '{"email":"deploy-check@invalid.example","password":"not-a-real-password"}' || true; }
  code=$(login "$PUBLIC_ORIGIN");          [ "$code" = 401 ] || { log "  FAIL login from $PUBLIC_ORIGIN -> $code (want 401)"; return 1; }
  code=$(login "https://evil.example");     [ "$code" = 403 ] || { log "  FAIL login from foreign origin -> $code (want 403)"; return 1; }
  return 0
}

wait_ready() { # url
  for _ in $(seq 1 60); do
    [ "$(curl -s -o /dev/null -w '%{http_code}' --max-time 5 "$1/api/auth/ok" || true)" = 200 ] && return 0
    sleep 1
  done
  return 1
}

switch_to() { # slot
  echo "$1" > .live-slot
  pm2 delete "$APP" >/dev/null 2>&1 || true
  pm2 start ecosystem.config.js --only "$APP" --update-env >/dev/null
}

log "Pulling"
git pull --ff-only
npm install --legacy-peer-deps --no-audit --no-fund

# Schema check, while the current build is still serving. This used to run `prisma db push`,
# which alters the production database to match whatever the schema says, with no review.
# Instead, stop if they differ: apply the matching file from prisma/sql/ (after a backup).
#   exit 0 = in sync, 2 = differences, anything else = could not check
set +e
npx prisma migrate diff \
  --from-schema-datasource prisma/schema.prisma \
  --to-schema-datamodel prisma/schema.prisma \
  --script --exit-code > /tmp/examsphere-schema-diff.sql 2>&1
diff_status=$?
set -e
if [ "$diff_status" -eq 2 ]; then
  log "ABORT: the database does not match prisma/schema.prisma. Pending SQL:"
  cat /tmp/examsphere-schema-diff.sql
  log "Back up the DB, apply the matching file from prisma/sql/, then re-run. Live site untouched."
  exit 1
elif [ "$diff_status" -ne 0 ]; then
  log "ABORT: could not compare schema with the database:"; cat /tmp/examsphere-schema-diff.sql
  exit 1
fi

LIVE=$(cat .live-slot 2>/dev/null || echo .next)
if [ "$LIVE" = .next-a ]; then CANDIDATE=.next-b; else CANDIDATE=.next-a; fi
log "Live build: $LIVE. Building the new release into $CANDIDATE"
rm -rf "$CANDIDATE"
export NODE_OPTIONS="--max-old-space-size=4096"
NEXT_DIST_DIR="$CANDIDATE" npm run build

log "Testing the new build on port $CANDIDATE_PORT"
NODE_ENV=production NEXT_DIST_DIR="$CANDIDATE" PORT=$CANDIDATE_PORT \
  node node_modules/next/dist/bin/next start -p $CANDIDATE_PORT > /tmp/examsphere-candidate.log 2>&1 &
CANDIDATE_PID=$!
trap 'kill $CANDIDATE_PID 2>/dev/null || true' EXIT
if ! wait_ready "http://127.0.0.1:$CANDIDATE_PORT" || ! check_site "http://127.0.0.1:$CANDIDATE_PORT"; then
  log "ABORT: the new build failed its checks. Live site untouched. Candidate log:"
  tail -40 /tmp/examsphere-candidate.log
  exit 1
fi
kill $CANDIDATE_PID 2>/dev/null || true; wait $CANDIDATE_PID 2>/dev/null || true; trap - EXIT
log "New build passed"

log "Switching $APP to $CANDIDATE"
switch_to "$CANDIDATE"
if wait_ready "http://127.0.0.1:$LIVE_PORT" && check_site "http://127.0.0.1:$LIVE_PORT"; then
  pm2 save >/dev/null
  # Keep the previous slot for a manual rollback; drop the pre-slot .next once off it.
  [ "$LIVE" != .next ] || rm -rf .next
  log "examsphere redeployed from $CANDIDATE (rollback: echo $LIVE > .live-slot && pm2 delete $APP && pm2 start ecosystem.config.js --only $APP)"
else
  log "Live check FAILED after switch. Rolling back to $LIVE"
  switch_to "$LIVE"
  wait_ready "http://127.0.0.1:$LIVE_PORT" && log "Rolled back; site is on $LIVE" || log "ROLLBACK ALSO FAILED: check pm2 logs now"
  pm2 save >/dev/null
  exit 1
fi
