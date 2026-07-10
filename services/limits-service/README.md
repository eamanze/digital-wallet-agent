# Limits Service

Owns durable transaction-limit policy and usage reservations. PostgreSQL is authoritative; Redis must never be the only enforcement record.

## Behavior

- Active, versioned rules match KYC tier, transaction type, channel, and currency.
- `single`, UTC `daily`, UTC `monthly`, and rolling velocity windows support amount and count limits.
- Both `reserved` and `committed` transactions consume limits.
- A failed transaction releases its reservation; a successful transaction commits it.
- Reservation creation uses a per-user PostgreSQL advisory lock to prevent concurrent overspend of a limit.
- Idempotency keys replay the original reservation and reject a different payload.
- Decisions/configuration changes are persisted and emitted through the outbox.

## Transaction-service contract

Before creating a financial transaction, transaction-service must call `POST /limits/reservations`. It may proceed only after receiving a reservation. It must call `/commit` after success or `/release` after terminal failure. Pending transactions retain their reservation until resolved; an expiry worker should mark abandoned reservations `expired`.

## Endpoints

- `POST /limits/evaluate` — non-reserving decision.
- `GET /limits/remaining` — remaining amount/count for applicable rules.
- `POST /limits/reservations` — atomically evaluate and reserve; requires `Idempotency-Key`.
- `POST /limits/reservations/{reference}/commit`
- `POST /limits/reservations/{reference}/release`
- `GET /limits/config`
- `POST /limits/config` — activates a new version; requires a signed token with `risk_admin` role and an audit reason.

Run with `npm run start:limits` (port `3006`). Run tests with `npm test`.

Rollback by deploying the previous application and activating a new configuration that copies the last known-good rules. Never delete usage or decision history.
