# End-to-end checks

Run these against a **local production build** before every deploy. They exercise the real
HTTP routes, server actions, Better Auth, Razorpay webhook signatures and the database.
Never point them at production: they create users, notes and test purchases.

## One-time setup: a throwaway MySQL

```bash
docker run -d --name es-test-mysql -e MYSQL_ROOT_PASSWORD=testpass -e MYSQL_DATABASE=examsphere_lms \
  -p 127.0.0.1:3317:3306 mysql:8.0
```

Test environment (keep it outside the repo, e.g. `/tmp/examsphere-e2e.env`):

```bash
SKIP_ENV_VALIDATION=1
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1
DATABASE_URL=mysql://root:testpass@127.0.0.1:3317/examsphere_lms
BETTER_AUTH_SECRET=local-test-secret-0123456789abcdef0123456789abcdef
BETTER_AUTH_URL=http://localhost:3399
NEXT_PUBLIC_APP_URL=http://localhost:3399
NEXT_PUBLIC_S3_BUCKET_NAME_IMAGES=local-test-bucket
NEXT_PUBLIC_AWS_REGION=auto
RAZORPAY_WEBHOOK_SECRET=whsec_local_test_only
PRIVATE_STORAGE_DIR=/tmp/examsphere-e2e/private-storage
```

## Run

```bash
set -a; source /tmp/examsphere-e2e.env; set +a
npx prisma db push --skip-generate        # local test DB only
node scripts/e2e/make-fixtures.mjs        # PDFs/images used by notes-e2e.sh
npm run build && npx next start -p 3399 &
EXPECT_CSRF=1 bash scripts/e2e/site-smoke.sh   # pages, auth, CSRF, admin, course create (34 checks)
bash scripts/e2e/notes-e2e.sh                  # notes: create, upload, sell, read, refund, webhook (71 checks)
```

## Browser check

`curl` cannot see client-side crashes (a page can return 200 and then fail in the browser).
`browser-check.mjs` drives headless Chrome over the DevTools protocol and reports console
errors, failed requests and whether the PDF viewer drew a page:

```bash
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --remote-debugging-port=9333 about:blank &
WS=$(curl -s http://127.0.0.1:9333/json/version | node -pe 'JSON.parse(require("fs").readFileSync(0)).webSocketDebuggerUrl')
node scripts/e2e/browser-check.mjs "$WS" http://localhost:3399/notes/<slug> 8000 "" /tmp/shot.png
MOBILE=1 node scripts/e2e/browser-check.mjs "$WS" http://localhost:3399/notes/<slug> 8000 "" /tmp/shot-mobile.png
```
