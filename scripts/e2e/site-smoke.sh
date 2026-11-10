#!/bin/bash
# End-to-end smoke test against a running ExamSphere build + local test DB.
# Usage: smoke.sh [BASE_URL]   (needs the es-test-mysql container for the admin promotion step)
BASE=${1:-http://localhost:3399}
PROJ=$(git -C "$(dirname "$0")" rev-parse --show-toplevel)
T=$(mktemp -d)
RUN=$(date +%s)
pass=0; fail=0
ok()   { echo "PASS  $1"; pass=$((pass+1)); }
bad()  { echo "FAIL  $1"; fail=$((fail+1)); }
info() { echo "INFO  $1"; }
post() { # jar url json [origin]
  curl -s -H "x-forwarded-for: 10.$((RANDOM%250)).$((RANDOM%250)).$((RANDOM%250))" -o $T/body -w '%{http_code}' -b $T/$1 -c $T/$1 -X POST "$BASE$2" \
    -H 'content-type: application/json' -H "origin: ${4:-$BASE}" -d "$3"
}
field() { node -e 'try{const j=JSON.parse(require("fs").readFileSync(process.argv[1],"utf8"));const v=process.argv[2].split(".").reduce((o,k)=>o==null?o:o[k],j);console.log(v==null?"":typeof v==="object"?JSON.stringify(v):v)}catch(e){console.log("")}' $T/body "$1"; }

# 1. Pages render (SSR, including authClient.useSession() in the navbar)
for p in / /login /register /courses /about /contact /programs /forgot-password /register/teacher; do
  code=$(curl -s -o $T/page -w '%{http_code}' "$BASE$p")
  if [ "$code" = 200 ] && ! grep -qE "Application error|Internal Server Error|digest" $T/page; then ok "page $p"; else bad "page $p -> $code"; fi
done

# 2. Signup / session / signout / signin
E="student$RUN@example.com"
c=$(post s /api/auth/sign-up/email "{\"email\":\"$E\",\"password\":\"Password123!\",\"name\":\"Test Student\"}")
[ "$c" = 200 ] && ok "signup" || bad "signup -> $c $(head -c 200 $T/body)"
curl -s -b $T/s "$BASE/api/auth/get-session" > $T/body
[ "$(field user.email)" = "$E" ] && ok "get-session after signup" || bad "get-session after signup: $(head -c 200 $T/body)"
c=$(post s /api/auth/sign-out '{}'); [ "$c" = 200 ] && ok "sign-out" || bad "sign-out -> $c"
curl -s -b $T/s "$BASE/api/auth/get-session" > $T/body
[ -z "$(field user.email)" ] && ok "session cleared after sign-out" || bad "session still present after sign-out"
c=$(post s2 /api/auth/sign-in/email "{\"email\":\"$E\",\"password\":\"Password123!\"}")
[ "$c" = 200 ] && ok "sign-in" || bad "sign-in -> $c $(head -c 200 $T/body)"
c=$(post s3 /api/auth/sign-in/email "{\"email\":\"$E\",\"password\":\"wrong-password\"}")
[ "$c" = 401 ] && ok "wrong password rejected (401)" || bad "wrong password -> $c"
c=$(post s4 /api/auth/sign-up/email "{\"email\":\"short$RUN@example.com\",\"password\":\"short\",\"name\":\"X\"}")
[ "$c" = 400 ] && [ "$(field code)" = PASSWORD_TOO_SHORT ] && ok "short password rejected" || bad "short password -> $c $(head -c 120 $T/body)"
c=$(post s5 /api/auth/sign-up/email "{\"email\":\"$E\",\"password\":\"Password123!\",\"name\":\"Dup\"}")
[ "$c" = 422 ] || [ "$c" = 400 ] && ok "duplicate signup rejected ($c)" || bad "duplicate signup -> $c"

# 3. Long user-agent (in-app browsers) must not break session creation
c=$(curl -s -H "x-forwarded-for: 10.9.9.$((RANDOM%250))" -o $T/body -w "%{http_code}" -X POST "$BASE/api/auth/sign-in/email" -H 'content-type: application/json' -H "origin: $BASE" \
  -A "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 [FBAN/FBIOS;FBAV/470.0.0.35.110;FBBV/612345678;FBDV/iPhone14,5;FBMD/iPhone;FBSN/iOS;FBSV/17.5;FBSS/3;FBID/phone;FBLC/en_US;FBOP/5;FBRV/613456789;IABMV/1]" \
  -d "{\"email\":\"$E\",\"password\":\"Password123!\"}")
[ "$c" = 200 ] && ok "sign-in with 290-char user agent" || bad "long UA sign-in -> $c $(head -c 150 $T/body)"

# 4. Cross-site request (CSRF / origin check)
c=$(post x /api/auth/sign-in/email "{\"email\":\"$E\",\"password\":\"Password123!\"}" "https://evil.example")
c2=$(post s2 /api/auth/sign-out '{}' "https://evil.example")   # s2 holds a live session cookie
c3=$(post x2 /api/auth/sign-in/email "{\"email\":\"$E\",\"password\":\"Password123!\",\"callbackURL\":\"https://evil.example/steal\"}")
c4=$(post x3 /api/auth/sign-in/email "{\"email\":\"$E\",\"password\":\"Password123!\",\"callbackURL\":\"/dashboard\"}")
c5=$(post x4 /api/auth/sign-in/email "{\"email\":\"$E\",\"password\":\"Password123!\"}" "https://www.examsphere.online")
if [ "${EXPECT_CSRF:-0}" = 1 ]; then
  [ "$c" = 403 ] && ok "cross-site sign-in blocked (403)" || bad "cross-site sign-in -> $c"
  [ "$c2" = 403 ] && ok "cross-site sign-out with session cookie blocked (403)" || bad "cross-site sign-out -> $c2"
  [ "$c3" = 403 ] && ok "external callbackURL rejected (403)" || bad "external callbackURL -> $c3"
  [ "$c4" = 200 ] && ok "relative callbackURL still allowed" || bad "relative callbackURL -> $c4"
  [ "$c5" = 200 ] && ok "trusted origin www.examsphere.online allowed" || bad "trusted origin -> $c5"
else
  info "cross-site sign-in -> $c | cross-site sign-out w/ cookie -> $c2 | external callbackURL -> $c3 | relative callbackURL -> $c4 | www origin -> $c5"
fi

# 4b. Zod validation error from an API route comes back as 400 + message (ZodError.issues), not 500
code=$(curl -s -o $T/body -w '%{http_code}' -b $T/s2 -X PATCH "$BASE/api/profile" -H 'content-type: application/json' -H "origin: $BASE" -d '{"image":"not a url","bio":"ok"}')
[ "$code" = 400 ] && [ -n "$(field error)" ] && ok "API zod error -> 400 \"$(field error)\"" || bad "API zod error -> $code $(head -c 150 $T/body)"
code=$(curl -s -o $T/body -w '%{http_code}' -b $T/s2 -X PATCH "$BASE/api/profile" -H 'content-type: application/json' -H "origin: $BASE" -d "{\"bio\":\"Bio $RUN\"}")
[ "$code" = 200 ] && ok "API profile update with valid data" || bad "profile update -> $code $(head -c 150 $T/body)"

# 5. Password reset + email OTP endpoints respond (email delivery itself is not configured locally)
c=$(post r /api/auth/request-password-reset "{\"email\":\"$E\",\"redirectTo\":\"/reset-password\"}")
info "request-password-reset -> $c $(head -c 100 $T/body)"
c=$(post o /api/auth/email-otp/send-verification-otp "{\"email\":\"$E\",\"type\":\"sign-in\"}")
info "email-otp send -> $c $(head -c 100 $T/body)"

# 6. Admin: promote, sign in, admin pages, admin plugin, create course with long description
A="admin$RUN@example.com"
post a /api/auth/sign-up/email "{\"email\":\"$A\",\"password\":\"Password123!\",\"name\":\"Test Admin\"}" >/dev/null
docker exec es-test-mysql mysql -uroot -ptestpass examsphere_lms -e "UPDATE user SET role='admin' WHERE email='$A'" 2>/dev/null
rm -f $T/a; c=$(post a /api/auth/sign-in/email "{\"email\":\"$A\",\"password\":\"Password123!\"}")
[ "$c" = 200 ] && ok "admin sign-in" || bad "admin sign-in -> $c"
for p in /admin /admin/courses /admin/courses/create /admin/users; do
  code=$(curl -s -o $T/page -w '%{http_code}' -b $T/a "$BASE$p")
  if [ "$code" = 200 ] && ! grep -qE "Application error|Internal Server Error" $T/page; then ok "admin page $p"; else bad "admin page $p -> $code"; fi
done
code=$(curl -s -o $T/body -w '%{http_code}' -b $T/a "$BASE/api/auth/admin/list-users?limit=5")
[ "$code" = 200 ] && ok "admin plugin list-users" || bad "admin list-users -> $code $(head -c 120 $T/body)"

ACTION=$(node -e 'const m=require(process.argv[1]+"/.next/server/server-reference-manifest.json");for(const[id,v]of Object.entries(m.node||{})){if(v.exportedName==="CreateCourse"&&Object.keys(v.workers||{}).some(w=>w.includes("admin/courses/create"))){console.log(id);break}}' $PROJ)
desc=$(node -e 'console.log("Long course description. ".repeat(400).trim())')   # ~10,000 chars
course() { # json-values
  curl -s -b $T/a -X POST "$BASE/admin/courses/create" -H "Next-Action: $ACTION" -H 'accept: text/x-component' \
    -H 'content-type: text/plain;charset=UTF-8' -H "origin: $BASE" --data-binary "[$1]"
}
base="\"fileKey\":\"thumb.png\",\"price\":499,\"duration\":10,\"level\":\"Beginner\",\"category\":\"NEET\",\"smallDescription\":\"NEET crash course\",\"status\":\"Draft\",\"isFeatured\":false"
out=$(course "{\"title\":\"MBBS Crash Course $RUN\",\"description\":\"$desc\",\"slug\":\"mbbs-crash-course-$RUN\",$base}")
echo "$out" | grep -q '"status":"success"' && ok "create course with ~10k-char description" || bad "create course: $(echo "$out" | tail -c 300)"
out=$(course "{\"title\":\"x\",\"description\":\"ok description\",\"slug\":\"bad-$RUN\",$base}")
echo "$out" | grep -q '"fieldErrors":{[^}]*"title"' && ok "invalid course rejected with title field error" || bad "invalid course: $(echo "$out" | tail -c 300)"
out=$(course "{\"title\":\"Discount check $RUN\",\"description\":\"ok description\",\"slug\":\"disc-$RUN\",\"discountPrice\":900,$base}")
echo "$out" | grep -q '"discountPrice"' && ok "discount >= price rejected (superRefine)" || bad "discount rule: $(echo "$out" | tail -c 300)"

echo "---- $pass passed, $fail failed"
rm -rf $T
[ $fail -eq 0 ]
