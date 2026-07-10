#!/usr/bin/env bash
set -euo pipefail; source "${DEMO_STATE:-/tmp/digital-wallet-demo.env}"
curl -fsS -X POST "$BASE_URL/transactions/airtime" -H "Authorization: Bearer $ALICE_TOKEN" -H 'Content-Type: application/json' -H 'Idempotency-Key: demo-airtime-001' -d "{\"amount_minor\":${1:-500},\"phone\":\"+15550000003\",\"provider_name\":\"mock-airtime\",\"transaction_pin\":\"1234\"}"
