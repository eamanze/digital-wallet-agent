#!/usr/bin/env bash
set -euo pipefail
BASE_URL="${BASE_URL:-http://localhost:8080/api/v1}"
OUT="${DEMO_STATE:-/tmp/digital-wallet-demo.env}"
EMAIL_A="demo.alice+$(date +%s)@example.test"; EMAIL_B="demo.bob+$(date +%s)@example.test"
post(){ curl -fsS -H 'Content-Type: application/json' -H "X-Correlation-ID: demo-$(date +%s)" -d "$2" "$BASE_URL$1"; }
extract(){ node -e 'let x=JSON.parse(require("fs").readFileSync(0,"utf8")); console.log(x.data?.access_token||x.access_token||x.data?.user?.id||x.user?.id||"")'; }
alice=$(post /auth/register "{\"email\":\"$EMAIL_A\",\"phone\":\"+15550000001\",\"password\":\"DemoPassword123\"}")
bob=$(post /auth/register "{\"email\":\"$EMAIL_B\",\"phone\":\"+15550000002\",\"password\":\"DemoPassword123\"}")
ALICE_ID=$(printf '%s' "$alice" | extract); BOB_ID=$(printf '%s' "$bob" | extract)
login(){ post /auth/login "{\"email\":\"$1\",\"password\":\"DemoPassword123\",\"device_id\":\"demo-device-$2\"}" | extract; }
ALICE_TOKEN=$(login "$EMAIL_A" alice); BOB_TOKEN=$(login "$EMAIL_B" bob)
cat > "$OUT" <<EOF
BASE_URL=$BASE_URL
ALICE_EMAIL=$EMAIL_A
BOB_EMAIL=$EMAIL_B
ALICE_ID=$ALICE_ID
BOB_ID=$BOB_ID
ALICE_TOKEN=$ALICE_TOKEN
BOB_TOKEN=$BOB_TOKEN
EOF
chmod 600 "$OUT"; echo "Demo users created. State: $OUT (synthetic data only)."
