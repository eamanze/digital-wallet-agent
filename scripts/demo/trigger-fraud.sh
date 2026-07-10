#!/usr/bin/env bash
set -euo pipefail; source "${DEMO_STATE:-/tmp/digital-wallet-demo.env}"
curl -fsS -X POST "${FRAUD_URL:-http://localhost:3008}/risk/evaluate" -H "Authorization: Bearer $ALICE_TOKEN" -H 'Content-Type: application/json' -H 'Idempotency-Key: demo-fraud-001' -d "{\"user_id\":\"$ALICE_ID\",\"amount_minor\":999999999,\"is_new_device\":true,\"transaction_type\":\"wallet_transfer\",\"ip_reputation\":\"suspicious\",\"failed_pin_attempts\":9}"
