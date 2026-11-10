#!/bin/bash
# Pull latest code and restart ONLY examsphere. Touches no other project on the server.
#
# Run on the production box:  bash /root/examsphere/scripts/redeploy.sh
set -euo pipefail
cd /root/examsphere

git pull --ff-only
npm install --legacy-peer-deps --no-audit --no-fund

# Schema check, while the current build is still serving.
#
# This used to run `prisma db push`, which alters the production database to match
# whatever the schema says, with no review. Instead, compare and stop if they differ:
# the change has to be applied deliberately (after a backup) from prisma/sql/.
#   exit 0 = in sync, 2 = differences, anything else = could not check
set +e
npx prisma migrate diff \
  --from-schema-datasource prisma/schema.prisma \
  --to-schema-datamodel prisma/schema.prisma \
  --script --exit-code > /tmp/examsphere-schema-diff.sql 2>&1
diff_status=$?
set -e
if [ "$diff_status" -eq 2 ]; then
  echo "ABORT: the database does not match prisma/schema.prisma. Pending SQL:"
  cat /tmp/examsphere-schema-diff.sql
  echo "Back up the DB, apply the matching file from prisma/sql/, then re-run this script."
  echo "The running site was not touched."
  exit 1
elif [ "$diff_status" -ne 0 ]; then
  echo "ABORT: could not compare schema with the database:"
  cat /tmp/examsphere-schema-diff.sql
  exit 1
fi

# Build into a clean .next.
#
# Rebuilding in place over a running server leaves the old chunk files deleted while
# pages still reference them, which surfaces in the browser as:
#   ChunkLoadError: Failed to load chunk server/chunks/ssr/...
# The page still returns HTTP 200, so it only shows up as a client-side crash.
pm2 stop examsphere || true
rm -rf .next

export NODE_OPTIONS="--max-old-space-size=4096"
npm run build

# delete + start (not restart) so changes to ecosystem.config.js take effect.
pm2 delete examsphere || true
pm2 start ecosystem.config.js --only examsphere --update-env
pm2 save

# Smoke test.
for i in $(seq 1 30); do
  code=$(curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:3300/ || true)
  [ "$code" = "200" ] && break
  sleep 2
done
echo "examsphere redeployed. Local check: HTTP ${code}"
[ "$code" = "200" ]
