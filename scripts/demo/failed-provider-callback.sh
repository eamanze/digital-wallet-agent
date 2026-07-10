#!/usr/bin/env bash
set -euo pipefail; source "${DEMO_STATE:-/tmp/digital-wallet-demo.env}"
curl -fsS -X POST "${TRANSACTION_URL:-http://localhost:3009}/providers/mock-bank/callbacks" -H 'Content-Type: application/json' -d '{"provider_reference":"demo-provider-ref-failed","provider_callback_id":"demo-callback-failed-001","normalized_status":"failed","signature_valid":true}'
