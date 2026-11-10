#!/bin/bash
# End-to-end test of the notes module against a running build + local test DB.
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
api()  { # jar method url [json]
  local d=(); [ -n "$4" ] && d=(-H 'content-type: application/json' -d "$4")
  curl -s -o $T/body -w '%{http_code}' -b $T/$1 -c $T/$1 -X $2 "$BASE$3" -H "origin: $BASE" -H "x-forwarded-for: $(ip)" "${d[@]}"
}
signup() { # jar email
  api $1 POST /api/auth/sign-up/email "{\"email\":\"$2\",\"password\":\"Password123!\",\"name\":\"$1 user\"}" >/dev/null
}
signin() { rm -f $T/$1; api $1 POST /api/auth/sign-in/email "{\"email\":\"$2\",\"password\":\"Password123!\"}" >/dev/null; }
action_id() { # exportedName workerSubstring
  node -e 'const m=require(process.argv[1]+"/.next/server/server-reference-manifest.json");for(const[id,v]of Object.entries(m.node||{})){if(v.exportedName===process.argv[2]&&Object.keys(v.workers||{}).some(w=>w.includes(process.argv[3]))){console.log(id);break}}' $PROJ "$1" "$2"
}
action() { # jar pagePath actionId argsJson
  curl -s -b $T/$1 -X POST "$BASE$2" -H "Next-Action: $3" -H 'accept: text/x-component' \
    -H 'content-type: text/plain;charset=UTF-8' -H "origin: $BASE" --data-binary "$4"
}
pdfpages() { node -e 'require(process.argv[1]+"/node_modules/pdf-lib").PDFDocument.load(require("fs").readFileSync(process.argv[2])).then(d=>console.log(d.getPageCount()+"|"+(d.getSubject()||""))).catch(()=>console.log("ERR"))' $PROJ "$1"; }

# --- actors -------------------------------------------------------------------
ADMIN="nadmin$RUN@example.com"; STU="nstu$RUN@example.com"; STU2="nstu2$RUN@example.com"; STU3="nstu3$RUN@example.com"
signup a $ADMIN; sql "UPDATE user SET role='admin' WHERE email='$ADMIN'"; signin a $ADMIN
signup s $STU; signup s2 $STU2; signup s3 $STU3

# --- 1. Admin creates a paid note (server action) ------------------------------
CREATE=$(action_id createNoteAction "admin/notes/new")
out=$(action a /admin/notes/new $CREATE "[{\"title\":\"NEET Cell Biology $RUN\",\"slug\":\"neet-cell-$RUN\",\"shortDescription\":\"Cell structure notes\",\"description\":\"Everything about cells\",\"program\":\"NEET\",\"subject\":\"Biology\",\"chapter\":\"Cell\",\"language\":\"English\",\"accessType\":\"PAID\",\"priceRupees\":199,\"discountPriceRupees\":149,\"previewPages\":2,\"allowDownload\":false,\"maxDownloads\":3,\"isFeatured\":true}]")
NOTE=$(echo "$out" | grep -oE '"id":"[a-z0-9]{20,}"' | head -1 | cut -d'"' -f4)
[ -n "$NOTE" ] && ok "admin creates paid note ($NOTE)" || bad "create note: $(echo "$out" | tail -c 300)"
out=$(action a /admin/notes/new $CREATE "[{\"title\":\"Dup\",\"slug\":\"neet-cell-$RUN\",\"accessType\":\"PAID\",\"priceRupees\":10}]")
echo "$out" | grep -q '"slug"' && ok "duplicate slug rejected with field error" || bad "dup slug: $(echo "$out" | tail -c 200)"
out=$(action a /admin/notes/new $CREATE "[{\"title\":\"Paid zero\",\"slug\":\"paid-zero-$RUN\",\"accessType\":\"PAID\",\"priceRupees\":0}]")
echo "$out" | grep -q '"priceRupees"' && ok "paid note with ₹0 rejected" || bad "zero price: $(echo "$out" | tail -c 200)"
out=$(action s /admin/notes/new $CREATE "[{\"title\":\"Hack\",\"slug\":\"hack-$RUN\",\"accessType\":\"FREE\"}]")
[ "$(sql "SELECT COUNT(*) FROM notes WHERE slug='hack-$RUN'")" = 0 ] && ok "student cannot call admin create action" || bad "student created a note!"

# --- 2. Uploads ------------------------------------------------------------------
code=$(curl -s -o $T/body -w '%{http_code}' -b $T/a -H "origin: $BASE" -F "file=@$S/not-a-pdf.pdf;type=application/pdf" "$BASE/api/admin/notes/$NOTE/file")
[ "$code" = 400 ] && grep -q "not a PDF" $T/body && ok "fake PDF rejected by content" || bad "fake pdf -> $code $(cat $T/body)"
code=$(curl -s -o $T/body -w '%{http_code}' -b $T/s -H "origin: $BASE" -F "file=@$S/test-notes.pdf" "$BASE/api/admin/notes/$NOTE/file")
[ "$code" = 403 ] && ok "student cannot upload (403)" || bad "student upload -> $code"
code=$(curl -s -o $T/body -w '%{http_code}' -b $T/a -H "origin: $BASE" -F "file=@$S/test-notes.pdf" "$BASE/api/admin/notes/$NOTE/file")
[ "$code" = 200 ] && grep -q '"pageCount":12' $T/body && ok "PDF uploaded as v1 (12 pages)" || bad "upload -> $code $(cat $T/body)"
code=$(curl -s -o $T/body -w '%{http_code}' -b $T/a -H "origin: $BASE" -F "cover=@$S/test-cover.png" "$BASE/api/admin/notes/$NOTE/cover")
[ "$code" = 200 ] && ok "cover uploaded" || bad "cover -> $code $(cat $T/body)"
[ "$(sql "SELECT COUNT(*) FROM notes WHERE id='$NOTE' AND coverKey LIKE '%.webp'")" = 1 ] && ok "cover re-encoded to WebP" || bad "cover not webp"

# --- 3. Draft is hidden ----------------------------------------------------------
curl -s -o $T/page -b $T/s "$BASE/notes/neet-cell-$RUN"; ! grep -q "NEET Cell Biology $RUN" $T/page && grep -qi "not found" $T/page && ok "draft note page shows not-found, no content" || bad "draft page leaked content"
code=$(curl -s -o /dev/null -w '%{http_code}' "$BASE/api/notes/$NOTE/preview"); [ "$code" = 404 ] && ok "draft preview hidden" || bad "draft preview -> $code"

# --- 4. Publish ------------------------------------------------------------------
STATUS=$(action_id setNoteStatusAction "admin/notes/[id]")
out=$(action a /admin/notes/$NOTE $STATUS "[\"$NOTE\",\"PUBLISHED\"]")
echo "$out" | grep -q '"status":"success"' && ok "note published" || bad "publish: $(echo "$out" | tail -c 200)"

# --- 5. Public pages, preview, cover ---------------------------------------------
curl -s "$BASE/notes" > $T/page; grep -q "NEET Cell Biology $RUN" $T/page && ok "listed in /notes catalog" || bad "not in catalog"
curl -s "$BASE/notes?price=free" > $T/page; ! grep -q "NEET Cell Biology $RUN" $T/page && ok "free filter excludes paid note" || bad "free filter shows paid note"
code=$(curl -s -o $T/page -w '%{http_code}' "$BASE/notes/neet-cell-$RUN"); [ "$code" = 200 ] && grep -q '"@type":"Product"' $T/page && grep -q '149' $T/page && ok "detail page 200 with Product JSON-LD and offer price" || bad "detail -> $code"
curl -s -o $T/prev.pdf -D $T/h "$BASE/api/notes/$NOTE/preview"; r=$(pdfpages $T/prev.pdf); [ "${r%%|*}" = 2 ] && ok "public preview = 2 pages" || bad "preview pages: $r"
code=$(curl -s -o /dev/null -w '%{http_code}|%{content_type}' "$BASE/api/notes/$NOTE/cover?v=1"); [ "$code" = "200|image/webp" ] && ok "cover served as webp" || bad "cover -> $code"

# --- 6. Paid access control ------------------------------------------------------
code=$(curl -s -o $T/body -w '%{http_code}' "$BASE/api/notes/$NOTE/read"); [ "$code" = 401 ] && ok "read without login -> 401" || bad "anon read -> $code"
code=$(curl -s -o $T/body -w '%{http_code}' -b $T/s "$BASE/api/notes/$NOTE/read"); [ "$code" = 403 ] && grep -q NEEDS_PURCHASE $T/body && ok "unpaid student read -> 403 NEEDS_PURCHASE" || bad "unpaid read -> $code $(cat $T/body)"
code=$(curl -s -o /dev/null -w '%{http_code}' -b $T/s "$BASE/dashboard/notes/neet-cell-$RUN"); [ "$code" = 307 ] || [ "$code" = 200 ] && ok "reader page redirects unpaid student ($code)" || bad "reader page unpaid -> $code"
code=$(api s POST /api/notes/checkout "{\"noteId\":\"$NOTE\"}"); [ "$code" = 503 ] && ok "Razorpay checkout -> 503 when payments not configured" || bad "checkout -> $code $(cat $T/body)"

# --- 7. Wallet purchase ----------------------------------------------------------
STUID=$(sql "SELECT id FROM user WHERE email='$STU'")
sql "INSERT INTO wallets (id,userId,balance,createdAt,updatedAt) VALUES (UUID(),'$STUID',100,NOW(),NOW()) ON DUPLICATE KEY UPDATE balance=100"
BUY=$(action_id buyNoteWithWalletAction "notes/[slug]")
out=$(action s /notes/neet-cell-$RUN $BUY "[\"$NOTE\"]")
echo "$out" | grep -q "Insufficient balance" && ok "wallet purchase refused with ₹100 < ₹149" || bad "low balance: $(echo "$out" | tail -c 200)"
[ "$(sql "SELECT balance FROM wallets WHERE userId='$STUID'")" = 100 ] && ok "wallet untouched after failed purchase" || bad "wallet changed after failure"
sql "UPDATE wallets SET balance=500 WHERE userId='$STUID'"
out=$(action s /notes/neet-cell-$RUN $BUY "[\"$NOTE\"]")
echo "$out" | grep -q '"status":"success"' && ok "wallet purchase succeeds" || bad "wallet buy: $(echo "$out" | tail -c 300)"
[ "$(sql "SELECT balance FROM wallets WHERE userId='$STUID'")" = 351 ] && ok "wallet charged offer price ₹149 (500 -> 351)" || bad "balance: $(sql "SELECT balance FROM wallets WHERE userId='$STUID'")"
[ "$(sql "SELECT COUNT(*) FROM system_transactions WHERE userId='$STUID' AND type='NOTE_PURCHASE' AND amount=14900 AND status='SUCCESS'")" = 1 ] && ok "SystemTransaction NOTE_PURCHASE 14900 paise recorded" || bad "no system transaction"
[ "$(sql "SELECT COUNT(*) FROM wallet_transactions wt JOIN wallets w ON w.id=wt.walletId WHERE w.userId='$STUID' AND wt.type='NOTE_PURCHASE'")" = 1 ] && ok "wallet transaction NOTE_PURCHASE recorded" || bad "no wallet transaction"
out=$(action s /notes/neet-cell-$RUN $BUY "[\"$NOTE\"]")
echo "$out" | grep -q "already have" && ok "second purchase refused" || bad "double buy: $(echo "$out" | tail -c 200)"

# --- 8. Reading: watermark, progress, download policy ----------------------------
code=$(curl -s -o $T/read.pdf -w '%{http_code}' -b $T/s "$BASE/api/notes/$NOTE/read"); r=$(pdfpages $T/read.pdf)
[ "$code" = 200 ] && [ "${r%%|*}" = 12 ] && ok "buyer reads full 12-page PDF" || bad "read -> $code $r"
echo "$r" | grep -q "$STU" && ok "PDF watermarked with buyer email" || bad "watermark missing: $r"
code=$(curl -s -o /dev/null -w '%{http_code}' -b $T/s "$BASE/dashboard/notes/neet-cell-$RUN"); [ "$code" = 200 ] && ok "reader page renders for buyer" || bad "reader page -> $code"
code=$(api s POST /api/notes/$NOTE/progress '{"page":7}'); [ "$code" = 200 ] && [ "$(sql "SELECT lastReadPage FROM note_entitlements WHERE userId='$STUID' AND noteId='$NOTE'")" = 7 ] && ok "reading progress saved (page 7)" || bad "progress -> $code"
code=$(api s POST /api/notes/$NOTE/progress '{"page":999}'); [ "$(sql "SELECT lastReadPage FROM note_entitlements WHERE userId='$STUID' AND noteId='$NOTE'")" = 12 ] && ok "progress clamped to page count" || bad "progress clamp"
code=$(curl -s -o $T/body -w '%{http_code}' -b $T/s "$BASE/api/notes/$NOTE/download"); [ "$code" = 403 ] && ok "download blocked when not allowed" || bad "download -> $code"
code=$(curl -s -o /dev/null -w '%{http_code}' -b $T/s "$BASE/dashboard/notes"); curl -s -b $T/s "$BASE/dashboard/notes" | grep -q "NEET Cell Biology $RUN" && ok "appears in My Notes" || bad "not in My Notes ($code)"

# --- 9. Free note with downloads -------------------------------------------------
out=$(action a /admin/notes/new $CREATE "[{\"title\":\"Free Formula Sheet $RUN\",\"slug\":\"free-formulas-$RUN\",\"accessType\":\"FREE\",\"previewPages\":0,\"allowDownload\":true,\"maxDownloads\":2,\"language\":\"Hindi\"}]")
FREE=$(echo "$out" | grep -oE '"id":"[a-z0-9]{20,}"' | head -1 | cut -d'"' -f4)
curl -s -o /dev/null -b $T/a -H "origin: $BASE" -F "file=@$S/test-notes.pdf" "$BASE/api/admin/notes/$FREE/file"
action a /admin/notes/$FREE $STATUS "[\"$FREE\",\"PUBLISHED\"]" >/dev/null
code=$(curl -s -o /dev/null -w '%{http_code}' "$BASE/api/notes/$FREE/preview"); [ "$code" = 404 ] && ok "preview off when previewPages=0" || bad "preview -> $code"
code=$(api s2 POST /api/notes/$FREE/claim); [ "$code" = 200 ] && ok "student claims free note" || bad "claim -> $code $(cat $T/body)"
S2ID=$(sql "SELECT id FROM user WHERE email='$STU2'")
[ "$(sql "SELECT CONCAT(source,'/',status) FROM note_entitlements WHERE userId='$S2ID' AND noteId='$FREE'")" = "FREE/ACTIVE" ] && ok "free claim recorded as FREE/ACTIVE" || bad "free entitlement"
c1=$(curl -s -o $T/d1.pdf -w '%{http_code}' -b $T/s2 "$BASE/api/notes/$FREE/download"); c2=$(curl -s -o /dev/null -w '%{http_code}' -b $T/s2 "$BASE/api/notes/$FREE/download"); c3=$(curl -s -o $T/body -w '%{http_code}' -b $T/s2 "$BASE/api/notes/$FREE/download")
[ "$c1$c2$c3" = "200200403" ] && ok "download limit enforced (2 allowed, 3rd blocked)" || bad "downloads: $c1 $c2 $c3"
r=$(pdfpages $T/d1.pdf); echo "$r" | grep -q "$STU2" && ok "download watermarked with downloader email" || bad "download watermark: $r"

# --- 10. Course-only note ----------------------------------------------------------
COURSE=$(sql "SELECT id FROM Course WHERE status='Published' LIMIT 1")
if [ -z "$COURSE" ]; then
  COURSE=$(sql "SELECT id FROM Course LIMIT 1"); sql "UPDATE Course SET status='Published' WHERE id='$COURSE'"
fi
out=$(action a /admin/notes/new $CREATE "[{\"title\":\"Course Notes $RUN\",\"slug\":\"course-notes-$RUN\",\"accessType\":\"COURSE_ONLY\",\"previewPages\":1}]")
CN=$(echo "$out" | grep -oE '"id":"[a-z0-9]{20,}"' | head -1 | cut -d'"' -f4)
curl -s -o /dev/null -b $T/a -H "origin: $BASE" -F "file=@$S/test-notes.pdf" "$BASE/api/admin/notes/$CN/file"
out=$(action a /admin/notes/$CN $STATUS "[\"$CN\",\"PUBLISHED\"]"); echo "$out" | grep -q "Link at least one course" && ok "course-only note can't publish without a course" || bad "course-only publish guard: $(echo "$out" | tail -c 200)"
LINKS=$(action_id setCourseLinksAction "admin/notes/[id]")
out=$(action a /admin/notes/$CN $LINKS "[\"$CN\",[{\"courseId\":\"$COURSE\",\"includedWithCourse\":true}]]"); echo "$out" | grep -q success && ok "course linked" || bad "link: $(echo "$out" | tail -c 200)"
action a /admin/notes/$CN $STATUS "[\"$CN\",\"PUBLISHED\"]" | grep -q success && ok "course-only note published" || bad "publish course-only"
S3ID=$(sql "SELECT id FROM user WHERE email='$STU3'")
code=$(curl -s -o $T/body -w '%{http_code}' -b $T/s3 "$BASE/api/notes/$CN/read"); [ "$code" = 403 ] && grep -q COURSE_ONLY $T/body && ok "not enrolled -> 403 COURSE_ONLY" || bad "course-only unenrolled -> $code"
sql "INSERT INTO Enrollment (id,amount,status,createdAt,updatedAt,courseId,userId) VALUES (UUID(),0,'Active',NOW(),NOW(),'$COURSE','$S3ID')"
code=$(curl -s -o /dev/null -w '%{http_code}' -b $T/s3 "$BASE/api/notes/$CN/read"); [ "$code" = 200 ] && ok "enrolled student reads course notes" || bad "enrolled read -> $code"
curl -s -b $T/s3 "$BASE/dashboard/notes" | grep -q "Course Notes $RUN" && ok "course notes in My Notes" || bad "course notes missing from My Notes"
sql "UPDATE Enrollment SET status='Cancelled' WHERE userId='$S3ID' AND courseId='$COURSE'"
code=$(curl -s -o /dev/null -w '%{http_code}' -b $T/s3 "$BASE/api/notes/$CN/read"); [ "$code" = 403 ] && ok "access ends when enrollment is cancelled" || bad "cancelled enrollment still reads -> $code"

# --- 11. Admin grant / revoke ------------------------------------------------------
GRANT=$(action_id grantNoteAccessAction "admin/notes/[id]"); REVOKE=$(action_id revokeNoteAccessAction "admin/notes/[id]")
action a /admin/notes/$NOTE $GRANT "[\"$NOTE\",\"$STU3\"]" | grep -q success && ok "admin grants access by email" || bad "grant"
code=$(curl -s -o /dev/null -w '%{http_code}' -b $T/s3 "$BASE/api/notes/$NOTE/read"); [ "$code" = 200 ] && ok "granted student can read" || bad "granted read -> $code"
ENT3=$(sql "SELECT id FROM note_entitlements WHERE userId='$S3ID' AND noteId='$NOTE'")
action a /admin/notes/$NOTE $REVOKE "[\"$NOTE\",\"$ENT3\",\"test\"]" | grep -q success && ok "admin revokes access" || bad "revoke"
code=$(curl -s -o $T/body -w '%{http_code}' -b $T/s3 "$BASE/api/notes/$NOTE/read"); [ "$code" = 403 ] && grep -q REVOKED $T/body && ok "revoked student blocked (403 REVOKED)" || bad "revoked read -> $code"

# --- 12. Wallet refund -------------------------------------------------------------
REFUND=$(action_id refundNotePurchaseAction "admin/notes/[id]")
ENT1=$(sql "SELECT id FROM note_entitlements WHERE userId='$STUID' AND noteId='$NOTE'")
action a /admin/notes/$NOTE $REFUND "[\"$NOTE\",\"$ENT1\",\"test refund\"]" | grep -q success && ok "admin refunds wallet purchase" || bad "refund"
[ "$(sql "SELECT balance FROM wallets WHERE userId='$STUID'")" = 500 ] && ok "₹149 returned to wallet (351 -> 500)" || bad "refund balance: $(sql "SELECT balance FROM wallets WHERE userId='$STUID'")"
[ "$(sql "SELECT status FROM system_transactions WHERE userId='$STUID' AND type='NOTE_PURCHASE'")" = REFUNDED ] && ok "SystemTransaction marked REFUNDED" || bad "txn not refunded"
code=$(curl -s -o /dev/null -w '%{http_code}' -b $T/s "$BASE/api/notes/$NOTE/read"); [ "$code" = 403 ] && ok "refunded buyer loses access" || bad "refunded read -> $code"
action a /admin/notes/$NOTE $REFUND "[\"$NOTE\",\"$ENT1\",\"again\"]" | grep -q "Only active" && ok "double refund refused" || bad "double refund"

# --- 13. Razorpay webhook (signed locally) -----------------------------------------
SECRET=whsec_local_test_only
hook() { # body
  local sig; sig=$(printf '%s' "$1" | openssl dgst -sha256 -hmac "$SECRET" | sed 's/^.* //')
  curl -s -o $T/body -w '%{http_code}' -X POST "$BASE/api/webhook/razorpay" -H "x-razorpay-signature: $sig" -H 'content-type: application/json' --data-binary "$1"
}
S2ID=$(sql "SELECT id FROM user WHERE email='$STU2'")
sql "INSERT INTO note_entitlements (id,userId,noteId,source,status,amountPaise,razorpayOrderId,downloadCount,createdAt,updatedAt) VALUES ('ent_hook_$RUN','$S2ID','$NOTE','PURCHASE','PENDING',14900,'order_T$RUN',0,NOW(),NOW())"
P="{\"event\":\"payment.captured\",\"payload\":{\"payment\":{\"entity\":{\"id\":\"pay_T$RUN\",\"order_id\":\"order_T$RUN\",\"amount\":14900,\"currency\":\"INR\",\"method\":\"upi\",\"email\":\"$STU2\",\"notes\":{}}}}}"
code=$(hook "$P"); [ "$code" = 200 ] && [ "$(sql "SELECT CONCAT(source,'/',status) FROM note_entitlements WHERE id='ent_hook_$RUN'")" = "PURCHASE/ACTIVE" ] && ok "webhook activates paid note" || bad "webhook -> $code $(cat $T/body)"
hook "$P" >/dev/null; [ "$(sql "SELECT COUNT(*) FROM system_transactions WHERE providerPaymentId='pay_T$RUN'")" = 1 ] && ok "webhook replay records the payment once" || bad "duplicate transactions on replay"
code=$(curl -s -o /dev/null -w '%{http_code}' -b $T/s2 "$BASE/api/notes/$NOTE/read"); [ "$code" = 200 ] && ok "webhook buyer can read" || bad "webhook buyer read -> $code"
# superseded order id: matched through the entitlement id in the order notes
sql "INSERT INTO note_entitlements (id,userId,noteId,source,status,amountPaise,razorpayOrderId,downloadCount,createdAt,updatedAt) VALUES ('ent_sup_$RUN','$S3ID','$FREE','PURCHASE','PENDING',100,'order_NEW$RUN',0,NOW(),NOW())"
P2="{\"event\":\"order.paid\",\"payload\":{\"payment\":{\"entity\":{\"id\":\"pay_O$RUN\",\"order_id\":\"order_OLD$RUN\",\"amount\":100,\"currency\":\"INR\",\"notes\":{}}},\"order\":{\"entity\":{\"notes\":{\"type\":\"NOTE_PURCHASE\",\"entitlementId\":\"ent_sup_$RUN\"}}}}}"
hook "$P2" >/dev/null; [ "$(sql "SELECT razorpayPaymentId FROM note_entitlements WHERE id='ent_sup_$RUN'")" = "pay_O$RUN" ] && ok "payment on a superseded order still matched" || bad "superseded order not matched"
# underpayment
sql "INSERT INTO note_entitlements (id,userId,noteId,source,status,amountPaise,razorpayOrderId,downloadCount,createdAt,updatedAt) VALUES ('ent_under_$RUN','$S2ID','$CN','PURCHASE','PENDING',14900,'order_U$RUN',0,NOW(),NOW())"
hook "{\"event\":\"payment.captured\",\"payload\":{\"payment\":{\"entity\":{\"id\":\"pay_U$RUN\",\"order_id\":\"order_U$RUN\",\"amount\":100,\"currency\":\"INR\",\"notes\":{}}}}}" >/dev/null
[ "$(sql "SELECT status FROM note_entitlements WHERE id='ent_under_$RUN'")" = PENDING ] && grep -q ignored $T/body && ok "underpaid webhook ignored, no access" || bad "underpayment: $(cat $T/body)"
# payment without an order id must not fulfil anything (regression for the undefined-filter bug)
before=$(sql "SELECT COUNT(*) FROM Enrollment WHERE status='Active'")
code=$(hook "{\"event\":\"payment.captured\",\"payload\":{\"payment\":{\"entity\":{\"id\":\"pay_N$RUN\",\"amount\":99999999,\"currency\":\"INR\",\"notes\":{}}}}}")
after=$(sql "SELECT COUNT(*) FROM Enrollment WHERE status='Active'")
[ "$code" = 200 ] && [ "$before" = "$after" ] && [ "$(sql "SELECT COUNT(*) FROM system_transactions WHERE providerPaymentId='pay_N$RUN'")" = 0 ] && ok "payment without order_id fulfils nothing" || bad "no-order payment: $code $before->$after"
code=$(curl -s -o /dev/null -w '%{http_code}' -X POST "$BASE/api/webhook/razorpay" -H "x-razorpay-signature: deadbeef" --data-binary "$P"); [ "$code" = 400 ] && ok "bad webhook signature rejected" || bad "bad signature -> $code"

# --- 14. Admin pages + export ------------------------------------------------------
for p in /admin/notes /admin/notes/new /admin/notes/$NOTE /admin/notes/analytics; do
  code=$(curl -s -o $T/page -w '%{http_code}' -b $T/a "$BASE$p")
  [ "$code" = 200 ] && ! grep -qE "Application error|Internal Server Error" $T/page && ok "admin page $p" || bad "admin page $p -> $code"
done
grep -q "Sales &amp; analytics\|Notes sales" $T/page && ok "analytics page content" || bad "analytics content"
code=$(curl -s -o $T/csv -w '%{http_code}|%{content_type}' -b $T/a "$BASE/api/admin/notes/export?noteId=$NOTE"); [ "${code%%|*}" = 200 ] && grep -q "$STU2" $T/csv && grep -q "Payment ID" $T/csv && ok "CSV export lists buyers" || bad "export -> $code"
code=$(curl -s -o /dev/null -w '%{http_code}' -b $T/s "$BASE/api/admin/notes/export"); [ "$code" = 403 ] && ok "student cannot export (403)" || bad "student export -> $code"
curl -s -o $T/page -b $T/s "$BASE/admin/notes"; ! grep -q "NEET Cell Biology $RUN" $T/page && grep -q "not-admin" $T/page && ok "student redirected away from admin notes, no data" || bad "student saw admin notes data"

echo "---- $pass passed, $fail failed"
rm -rf $T
[ $fail -eq 0 ]
