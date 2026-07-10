#!/usr/bin/env bash
set -euo pipefail; source "${DEMO_STATE:-/tmp/digital-wallet-demo.env}"
curl -fsS -X POST "$BASE_URL/transactions/transfers" -H "Authorization: Bearer $ALICE_TOKEN" -H 'Content-Type: application/json' -H 'Idempotency-Key: demo-transfer-001' -d "{\"receiver_user_id\":\"$BOB_ID\",\"amount_minor\":${1:-2500},\"currency\":\"NGN\",\"transaction_pin\":\"1234\"}"
