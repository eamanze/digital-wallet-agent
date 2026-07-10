#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"; export DEMO_STATE="${DEMO_STATE:-/tmp/digital-wallet-demo.env}"
echo 'Digital Wallet demo: local/mock only; no real funds or customer data.'
"$ROOT/scripts/demo/create-users.sh"
source "$DEMO_STATE"
for step in fund-wallet.sh transfer-money.sh buy-airtime.sh pay-bill.sh withdraw.sh trigger-fraud.sh duplicate-callback.sh failed-provider-callback.sh run-reconciliation.sh; do echo "--- $step ---"; "$ROOT/scripts/demo/$step" || echo "(expected demo failure/blocked outcome; continuing)"; done
echo '--- transaction history, ledger statement, audit ---'
curl -fsS "$BASE_URL/transactions" -H "Authorization: Bearer $ALICE_TOKEN" || true; echo
curl -fsS "${WALLET_URL:-http://localhost:3005}/wallets/$ALICE_ID/statement" -H "Authorization: Bearer $ALICE_TOKEN" || true; echo
curl -fsS "${AUDIT_URL:-http://localhost:3012}/audit/events?resource_type=transaction" -H "Authorization: Bearer $ALICE_TOKEN" || true; echo
echo 'Generate the failed-transaction RCA from docs/rca/template.md using the captured reference and correlation ID.'
