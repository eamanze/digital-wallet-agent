#!/usr/bin/env bash
set -euo pipefail; source "${DEMO_STATE:-/tmp/digital-wallet-demo.env}"
curl -fsS -X POST "$BASE_URL/transactions/bills" -H "Authorization: Bearer $ALICE_TOKEN" -H 'Content-Type: application/json' -H 'Idempotency-Key: demo-bill-001' -d "{\"amount_minor\":${1:-2000},\"biller\":\"mock-electricity\",\"customer_reference\":\"DEMO-CUSTOMER-001\",\"provider_name\":\"mock-biller\",\"transaction_pin\":\"1234\"}"
