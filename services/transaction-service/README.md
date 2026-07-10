# Transaction Service

Transaction-service owns transaction workflow state and orchestration. It never writes wallet balances or ledger tables directly. All financial postings go through ledger-service, and all external outcomes are represented by provider references and idempotent callbacks.

## Endpoints

- `POST /transactions/transfers` — wallet-to-wallet transfer
- `POST /transactions/fund-wallet` — initiate funding
- `POST /transactions/withdrawals` — initiate withdrawal
- `POST /transactions/bills` — initiate bill payment
- `POST /transactions/airtime` — initiate airtime purchase
- `GET /transactions/{id}` — status/details
- `GET /transactions` — authenticated user history
- `POST /transactions/{id}/reverse` — request ledger reversal
- `POST /providers/{provider}/callbacks` — verified, deduplicated provider callback

All writes require `Authorization`, `X-Request-ID` where supplied, and `Idempotency-Key`. Repeating a key with the same payload returns the original transaction; a different payload is rejected.

Transfer orchestration validates wallets and PIN, reserves limits, quotes fees, evaluates fraud, posts one balanced ledger journal, commits the limit reservation, audits the action, and emits `transaction.successful`. A blocked or reviewed transaction never reaches the ledger.

External requests start in `pending_provider`; callbacks must be signature-verified by the provider adapter before reaching this service. Duplicate callbacks are recorded and do not transition or post a transaction twice. Provider adapters, reconciliation workers, and notification consumers are separate bounded services.

States are: `initiated`, `pending_validation`, `pending_fraud_check`, `pending_provider`, `successful`, `failed`, `reversed`, and `under_review`. Invalid transitions are rejected.

Run with `npm run start:transactions` (port `3009`).
