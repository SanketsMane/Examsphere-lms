#!/bin/bash
# End-to-end: AI note generation (with NOTES_AI_PROVIDER=mock), draft editing, PDF render,
# settings, and the refund-request flow. Needs the web app AND the worker running:
#   node_modules/.bin/tsx --conditions=react-server scripts/notes-worker.ts
BASE=${1:-http://localhost:3399}
PROJ=$(git -C "$(dirname "$0")" rev-parse --show-toplevel)
S=${FIXTURES:-/tmp/examsphere-e2e}
T=$(mktemp -d)
RUN=$(date +%s)
pass=0; fail=0
ok()   { echo "PASS  $1"; pass=$((pass+1)); }
bad()  { echo "FAIL  $1"; fail=$((fail+1)); }
sql()  { docker exec es-test-mysql mysql -uroot -ptestpass examsphere_lms -N -e "$1" 2>/dev/null; }
ip()   { echo "10.$((RANDOM%250)).$((RANDOM%250)).$((RANDOM%250))"; }
api()  { local d=(); [ -n "$4" ] && d=(-H 'content-type: application/json' -d "$4")
  curl -s -o $T/body -w '%{http_code}' -b $T/$1 -c $T/$1 -X $2 "$BASE$3" -H "origin: $BASE" -H "x-forwarded-for: $(ip)" "${d[@]}"; }
field() { node -e 'try{const j=JSON.parse(require("fs").readFileSync(process.argv[1],"utf8"));const v=process.argv[2].split(".").reduce((o,k)=>o==null?o:o[k],j);console.log(v==null?"":typeof v==="object"?JSON.stringify(v):v)}catch(e){console.log("")}' $T/body "$1"; }
signup() { api $1 POST /api/auth/sign-up/email "{\"email\":\"$2\",\"password\":\"Password123!\",\"name\":\"$1 user\"}" >/dev/null; }
signin() { rm -f $T/$1; api $1 POST /api/auth/sign-in/email "{\"email\":\"$2\",\"password\":\"Password123!\"}" >/dev/null; }
action_id() { node -e 'const m=require(process.argv[1]+"/.next/server/server-reference-manifest.json");for(const[id,v]of Object.entries(m.node||{})){if(v.exportedName===process.argv[2]&&Object.keys(v.workers||{}).some(w=>w.includes(process.argv[3]))){console.log(id);break}}' $PROJ "$1" "$2"; }
action() { curl -s -b $T/$1 -X POST "$BASE$2" -H "Next-Action: $3" -H 'accept: text/x-component' -H 'content-type: text/plain;charset=UTF-8' -H "origin: $BASE" --data-binary "$4"; }
wait_job() { # jar note job wanted-status-regex
  for _ in $(seq 1 60); do
    api $1 GET "/api/admin/notes/$2/ai/jobs/$3" >/dev/null
    st=$(field job.status); echo "$st" | grep -qE "$4" && return 0
    echo "$st" | grep -qE "FAILED|CANCELLED" && return 1
    sleep 1
  done; return 1
}
OPTS='{"depth":"detailed","language":"English","exam":"NEET","audience":"","includeQuestions":true,"includeDiagrams":true,"extraInstructions":""}'

ADMIN="aiadmin$RUN@example.com"; STU="aistu$RUN@example.com"
signup a $ADMIN; sql "UPDATE user SET role='admin' WHERE email='$ADMIN'"; signin a $ADMIN; signup s $STU
CREATE=$(action_id createNoteAction "admin/notes/new")
out=$(action a /admin/notes/new $CREATE "[{\"title\":\"AI Cell Notes $RUN\",\"slug\":\"ai-cell-$RUN\",\"accessType\":\"PAID\",\"priceRupees\":99,\"program\":\"NEET\",\"subject\":\"Biology\"}]")
NOTE=$(echo "$out" | grep -oE '"id":"[a-z0-9]{20,}"' | head -1 | cut -d'"' -f4)
[ -n "$NOTE" ] && ok "note created" || bad "note create"

# --- start generation ----------------------------------------------------------------
up() { curl -s -o $T/body -w '%{http_code}' -b $T/$1 -H "origin: $BASE" "${@:2}" "$BASE/api/admin/notes/$NOTE/ai/jobs"; }
code=$(up a -F "files=@$S/test-notes.pdf" -F "options=$OPTS"); [ "$code" = 400 ] && grep -q "right" $T/body && ok "rights confirmation required" || bad "no-rights -> $code $(cat $T/body)"
code=$(up a -F "files=@$S/not-a-pdf.pdf" -F "options=$OPTS" -F rights=yes); [ "$code" = 400 ] && ok "unsupported file rejected ($(field error | cut -c1-50))" || bad "fake file -> $code"
code=$(up s -F "files=@$S/test-notes.pdf" -F "options=$OPTS" -F rights=yes); [ "$code" = 403 ] && ok "student cannot start AI generation" || bad "student start -> $code"
sql "UPDATE notes_settings SET aiMonthlyBudgetUsd=0 WHERE id='default'"; sql "INSERT IGNORE INTO notes_settings (id,refundWindowHours,refundMaxReadPercent,refundRequiresNoDownload,autoApproveRefunds,aiModel,aiMonthlyBudgetUsd,updatedAt) VALUES ('default',48,20,1,0,'claude-opus-5-5',0,NOW())"
code=$(up a -F "files=@$S/test-notes.pdf" -F "options=$OPTS" -F rights=yes); [ "$code" = 400 ] && grep -q "budget" $T/body && ok "monthly AI budget enforced" || bad "budget -> $code $(cat $T/body)"
sql "UPDATE notes_settings SET aiMonthlyBudgetUsd=50 WHERE id='default'"
code=$(up a -F "files=@$S/test-notes.pdf" -F "files=@$S/test-cover.png" -F "options=$OPTS" -F rights=yes)
JOB=$(field job.id); [ "$code" = 200 ] && [ "$(field pages)" = 13 ] && ok "generation queued (13 pages: 12-page PDF + photo)" || bad "start -> $code $(cat $T/body)"
[ "$(sql "SELECT status FROM notes WHERE id='$NOTE'")" = PROCESSING ] && ok "note marked PROCESSING" || bad "note status not PROCESSING"
code=$(up a -F "files=@$S/test-cover.png" -F "options=$OPTS" -F rights=yes); [ "$code" = 400 ] && grep -q "already running" $T/body && ok "second concurrent generation refused" || bad "concurrent -> $code"

wait_job a $NOTE $JOB "REVIEW" && ok "worker produced a draft (REVIEW)" || bad "job did not reach REVIEW: $(field job.status) $(field job.error)"
[ -n "$(field draft.sections)" ] && [ "$(field issues)" != "[]" ] && ok "draft has sections and fact-check issues" || bad "draft/issues missing"
[ "$(sql "SELECT status FROM notes WHERE id='$NOTE'")" = REVIEW ] && ok "note marked REVIEW" || bad "note not REVIEW"
SRC=$(node -e 'const j=JSON.parse(require("fs").readFileSync(process.argv[1]));console.log(j.sources[0].id)' $T/body)
code=$(curl -s -o /dev/null -w '%{http_code}|%{content_type}' -b $T/a "$BASE/api/admin/notes/$NOTE/ai/sources/$SRC"); [ "${code%%|*}" = 200 ] && ok "admin can open original source ($code)" || bad "source -> $code"
code=$(curl -s -o /dev/null -w '%{http_code}' -b $T/s "$BASE/api/admin/notes/$NOTE/ai/sources/$SRC"); [ "$code" = 403 ] && ok "student cannot open sources" || bad "student source -> $code"

# --- edit, preview, rewrite --------------------------------------------------------------
DOC=$(node -e 'const j=JSON.parse(require("fs").readFileSync(process.argv[1]));j.draft.title="Edited title '$RUN'";console.log(JSON.stringify(j.draft))' $T/body)
code=$(api a PUT /api/admin/notes/$NOTE/ai/jobs/$JOB "{\"doc\":$DOC}"); [ "$code" = 200 ] && ok "draft saved after edit" || bad "save -> $code $(cat $T/body)"
code=$(api a PUT /api/admin/notes/$NOTE/ai/jobs/$JOB '{"doc":{"title":1}}'); [ "$code" = 400 ] && ok "invalid draft rejected" || bad "invalid draft -> $code"
code=$(curl -s -o $T/prev.html -w '%{http_code}' -b $T/a -X POST "$BASE/api/admin/notes/$NOTE/ai/preview" -H 'content-type: application/json' -H "origin: $BASE" -d "{\"doc\":$DOC,\"style\":{\"style\":\"topper\",\"paper\":\"grid\"}}")
[ "$code" = 200 ] && grep -q "Edited title $RUN" $T/prev.html && grep -q "Content-Security-Policy" $T/prev.html && ! grep -q "<script" $T/prev.html && ok "preview HTML rendered (CSP, no scripts)" || bad "preview -> $code"
SEC=$(node -e 'console.log(JSON.stringify(JSON.parse(process.argv[1]).sections[0]))' "$DOC")
code=$(api a POST /api/admin/notes/$NOTE/ai/jobs/$JOB/rewrite "{\"sectionIndex\":0,\"instruction\":\"make it simpler\",\"section\":$SEC}"); [ "$code" = 200 ] && grep -q "make it simpler" $T/body && ok "section rewrite returns the rewritten section" || bad "rewrite -> $code $(cat $T/body)"

# --- render to PDF ----------------------------------------------------------------------
code=$(api a POST /api/admin/notes/$NOTE/ai/jobs/$JOB/render '{"style":{"style":"notebook","paper":"ruled"}}'); RJOB=$(field job.id)
[ "$code" = 200 ] && ok "render queued" || bad "render -> $code $(cat $T/body)"
wait_job a $NOTE $RJOB "DONE" && ok "worker rendered the PDF version ($(field job.message))" || bad "render did not finish: $(field job.error)"
[ "$(sql "SELECT v.origin FROM notes n JOIN note_versions v ON v.id=n.currentVersionId WHERE n.id='$NOTE'")" = AI ] && ok "note's current version is the AI PDF" || bad "current version not AI"
[ "$(sql "SELECT status FROM notes WHERE id='$NOTE'")" = DRAFT ] && ok "note back to DRAFT (ready to publish)" || bad "note status after render"
code=$(curl -s -o $T/ai.pdf -w '%{http_code}' -b $T/a "$BASE/api/notes/$NOTE/read"); [ "$code" = 200 ] && head -c 5 $T/ai.pdf | grep -q "%PDF" && ok "admin can read the generated PDF" || bad "read AI pdf -> $code"

# --- cancel -------------------------------------------------------------------------------
code=$(up a -F "files=@$S/test-cover.png" -F "options=$OPTS" -F rights=yes); CJOB=$(field job.id)
api a POST /api/admin/notes/$NOTE/ai/jobs/$CJOB/cancel >/dev/null
[ "$(sql "SELECT status FROM note_generation_jobs WHERE id='$CJOB'")" = CANCELLED ] && ok "job cancelled" || bad "cancel: $(sql "SELECT status FROM note_generation_jobs WHERE id='$CJOB'")"

# --- refund policy flow ---------------------------------------------------------------------
STATUS=$(action_id setNoteStatusAction "admin/notes/[id]"); action a /admin/notes/$NOTE $STATUS "[\"$NOTE\",\"PUBLISHED\"]" >/dev/null
STUID=$(sql "SELECT id FROM user WHERE email='$STU'")
sql "INSERT INTO wallets (id,userId,balance,createdAt,updatedAt) VALUES (UUID(),'$STUID',500,NOW(),NOW()) ON DUPLICATE KEY UPDATE balance=500"
BUY=$(action_id buyNoteWithWalletAction "notes/[slug]"); action s /notes/ai-cell-$RUN $BUY "[\"$NOTE\"]" | grep -q success && ok "student bought AI notes with wallet (₹99)" || bad "wallet buy"
curl -s -o /dev/null -b $T/s "$BASE/notes/ai-cell-$RUN"; curl -s -b $T/s "$BASE/notes/ai-cell-$RUN" | grep -q "Refund available within 2 days" && ok "refund policy shown on the note page" || bad "policy text missing"
curl -s -b $T/s "$BASE/dashboard/notes/ai-cell-$RUN" | grep -qF 'eligible\":true' && ok "reader offers a refund while eligible" || bad "reader refund option missing"
code=$(api s POST /api/notes/$NOTE/refund-request '{"reason":"Bought by mistake"}'); [ "$code" = 200 ] && [ "$(field status)" = PENDING ] && ok "refund requested (pending admin review)" || bad "refund request -> $code $(cat $T/body)"
code=$(api s POST /api/notes/$NOTE/refund-request '{"reason":"again"}'); [ "$code" = 400 ] && ok "duplicate request refused ($(field error))" || bad "duplicate -> $code"
REQ=$(sql "SELECT id FROM note_refund_requests WHERE userId='$STUID'")
DECIDE=$(action_id decideRefundAction "admin/notes/refunds")
curl -s -o /dev/null -b $T/a "$BASE/admin/notes/refunds"
action a /admin/notes/refunds $DECIDE "[\"$REQ\",true,\"ok\"]" | grep -q success && ok "admin approved the refund" || bad "approve"
[ "$(sql "SELECT balance FROM wallets WHERE userId='$STUID'")" = 500 ] && ok "₹99 returned to wallet" || bad "wallet after refund: $(sql "SELECT balance FROM wallets WHERE userId='$STUID'")"
[ "$(sql "SELECT status FROM note_entitlements WHERE userId='$STUID' AND noteId='$NOTE'")" = REFUNDED ] && ok "access refunded" || bad "entitlement not refunded"
# ineligible: read too much
action s /notes/ai-cell-$RUN $BUY "[\"$NOTE\"]" >/dev/null
PAGES=$(sql "SELECT v.pageCount FROM notes n JOIN note_versions v ON v.id=n.currentVersionId WHERE n.id='$NOTE'")
api s POST /api/notes/$NOTE/progress "{\"page\":$PAGES}" >/dev/null; api s POST /api/notes/$NOTE/progress '{"page":1}' >/dev/null
sql "DELETE FROM note_refund_requests WHERE userId='$STUID'"
code=$(api s POST /api/notes/$NOTE/refund-request '{"reason":"try"}'); [ "$code" = 400 ] && grep -q "read" $T/body && ok "refund refused after reading too much (furthest page counts, not last page)" || bad "ineligible -> $code $(cat $T/body)"
# auto-approve
SETTINGS=$(action_id updateNotesSettingsAction "admin/notes/settings")
curl -s -o /dev/null -b $T/a "$BASE/admin/notes/settings"
action a /admin/notes/settings $SETTINGS '[{"refundWindowHours":48,"refundMaxReadPercent":100,"refundRequiresNoDownload":true,"autoApproveRefunds":true,"aiModel":"claude-opus-5-5","aiMonthlyBudgetUsd":50}]' | grep -q success && ok "settings saved (auto-approve on)" || bad "settings save"
code=$(api s POST /api/notes/$NOTE/refund-request '{"reason":"auto"}'); [ "$code" = 200 ] && [ "$(field status)" = APPROVED ] && ok "eligible request auto-approved" || bad "auto-approve -> $code $(cat $T/body)"
action a /admin/notes/settings $SETTINGS '[{"refundWindowHours":48,"refundMaxReadPercent":20,"refundRequiresNoDownload":true,"autoApproveRefunds":false,"aiModel":"claude-opus-5-5","aiMonthlyBudgetUsd":50}]' >/dev/null

# --- pages ----------------------------------------------------------------------------------
for p in /admin/notes/settings /admin/notes/refunds /admin/notes/$NOTE; do
  code=$(curl -s -o $T/page -w '%{http_code}' -b $T/a "$BASE$p")
  [ "$code" = 200 ] && ! grep -qE "Application error|Internal Server Error" $T/page && ok "admin page $p" || bad "admin page $p -> $code"
done

echo "---- $pass passed, $fail failed"
rm -rf $T
[ $fail -eq 0 ]
