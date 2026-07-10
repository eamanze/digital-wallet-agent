#!/usr/bin/env bash
set -euo pipefail; source "${DEMO_STATE:-/tmp/digital-wallet-demo.env}"
curl -fsS -X POST "$BASE_URL/transactions/withdrawals" -H "Authorization: Bearer $ALICE_TOKEN" -H 'Content-Type: application/json' -H 'Idempotency-Key: demo-withdraw-001' -d "{\"amount_minor\":${1:-1000},\"bank_code\":\"MOCK001\",\"account_number\":\"0000000000\",\"provider_name\":\"mock-bank\",\"transaction_pin\":\"1234\"}"
