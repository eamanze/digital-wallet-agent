# Local demo script

This demo is synthetic: `example.test` users, fake identifiers, mock providers, and local services only. Never point it at production.

```bash
docker compose up -d postgres redis localstack mock-payment-provider mock-biller-provider mock-airtime-provider
npm ci
bash scripts/demo/run-full-demo.sh
```

Set `BASE_URL` for another local gateway (default `http://localhost:8080/api/v1`). State is written mode 600 to `/tmp/digital-wallet-demo.env`; delete it after the demo. The flow covers registration/login, mock funding, transfer and fee path, airtime, bill, withdrawal, fraud review, duplicate callback, reconciliation, history, ledger statement, audit lookup, and RCA preparation.

Expected outcomes include pending provider work, fraud review/block, and a duplicate callback with no second ledger effect. Provider failures must be reconciled, never repaired by editing balances.
