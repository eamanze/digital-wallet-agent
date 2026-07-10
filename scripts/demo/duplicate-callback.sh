#!/usr/bin/env bash
set -euo pipefail; source "${DEMO_STATE:-/tmp/digital-wallet-demo.env}"
payload='{"provider_reference":"demo-provider-ref-001","provider_callback_id":"demo-callback-001","normalized_status":"successful","signature_valid":true}'
for i in 1 2; do curl -fsS -X POST "${TRANSACTION_URL:-http://localhost:3009}/providers/mock-bank/callbacks" -H 'Content-Type: application/json' -d "$payload"; echo; done
