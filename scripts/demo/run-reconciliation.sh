#!/usr/bin/env bash
set -euo pipefail; source "${DEMO_STATE:-/tmp/digital-wallet-demo.env}"
curl -fsS -X POST "${RECONCILIATION_URL:-http://localhost:3013}/reconciliation/runs" -H "Authorization: Bearer $ALICE_TOKEN" -H 'Content-Type: application/json' -d '{"provider_name":"mock-bank","format":"json","settlement_date":"2026-01-01","pending_threshold_hours":1,"content":"[]"}'
