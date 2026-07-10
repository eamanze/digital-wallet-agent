#!/usr/bin/env bash
set -euo pipefail; source "${DEMO_STATE:-/tmp/digital-wallet-demo.env}"
WALLET_ID="${1:-$ALICE_ID}"; AMOUNT="${2:-100000}"
curl -fsS -X POST "$BASE_URL/transactions/fund-wallet" -H "Authorization: Bearer $ALICE_TOKEN" -H 'Content-Type: application/json' -H "Idempotency-Key: demo-fund-$WALLET_ID-$AMOUNT" -d "{\"wallet_id\":\"$WALLET_ID\",\"amount_minor\":$AMOUNT,\"currency\":\"NGN\",\"provider_name\":\"mock-bank\",\"provider_type\":\"wallet_funding\"}"
