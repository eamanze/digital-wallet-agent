# Fee Service

Produces deterministic, auditable fee quotes before ledger posting. It never debits wallets or posts ledger entries.

## Behavior

- Supports wallet transfer, withdrawal, bill payment, and airtime purchase.
- Rules can combine fixed fees and percentage basis points (`100 bps = 1%`).
- Percentage results round half-up to the nearest minor unit.
- Minimums and caps apply after fixed/percentage calculation.
- Explicit or conditional waiver rules return zero.
- Every quote is pinned to an immutable configuration version and stores its calculation breakdown.
- The same idempotency key and payload returns the same quote; a changed payload is rejected.
- Non-zero quotes return a ledger posting instruction for transaction-service to include in a balanced journal.

## Endpoints

- `POST /fees/quote` (preferred) or `POST /fees/calculate` — requires `Idempotency-Key`.
- `GET /fees/config`
- `POST /fees/config` — activates a new version; requires a signed token with `finance_admin` role and an audit reason.

Transaction-service must request and persist a quote before creating its financial transaction. Retrying with the same key produces the same result even if active configuration changes later.

Run with `npm run start:fees` (port `3007`). Run tests with `npm test`.

Rollback by activating a new version containing the previous known-good rules. Historical quotes remain bound to their original versions.
