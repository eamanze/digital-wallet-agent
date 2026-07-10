# Platform test strategy

## Test pyramid

Service-local tests are the fast unit layer. Cross-service tests run against Docker Compose/PostgreSQL/Redis/WireMock. Contract tests validate stable HTTP/event envelopes. E2E tests run only against an explicitly configured environment and synthetic data. Load and chaos tests are never pointed at production.

## Categories and commands

| Category | Location | Purpose |
|---|---|---|
| Unit | `tests/unit`, `services/*/test` | Rules, state machines, redaction, ledger invariants |
| Integration | `tests/integration` | PostgreSQL, Redis, WireMock and outbox flows |
| Contract | `tests/contract` | Gateway, ledger, provider and event contracts |
| E2E | `tests/e2e` | Registration → KYC → wallet → funding → transfer journeys |
| Concurrency/idempotency | service repositories and integration tests | Duplicate callbacks/requests and no double debit |
| Security | `tests/security` | Auth bypass, redaction, signatures, rate limits, secrets |
| Load | `tests/load` | k6 API throughput and latency thresholds |
| Chaos | `tests/chaos` | Provider timeout, Redis outage, restart, queue/DLQ behavior |

Run the normal suite with `npm test`. Run load tests with `k6 run tests/load/transaction-load.js`; set `BASE_URL`, `VUS`, and `DURATION`. Run E2E only with `RUN_E2E=1 E2E_BASE_URL=...`.

## Critical acceptance scenarios

- Duplicate funding callback has one provider callback record and one ledger posting.
- Duplicate transfer idempotency key returns the original transaction and cannot create a second debit.
- Ledger rejects every unbalanced journal and every currency mismatch.
- Failed/unknown withdrawal remains pending or creates a compensating reversal; it never silently loses funds.
- Reversal creates a new compensating journal linked to the original.
- Limits, fraud review, suspended users, frozen wallets, and PIN throttling stop money movement before posting.
- Notification failure is isolated from successful transaction state.
- Reconciliation reports detect missing records, amount mismatch, duplicate references, and late callbacks.
- Admin actions require MFA/RBAC, maker-checker approval, and audit records.

## CI quality gates

CI must fail on unit/integration/contract failures, ledger invariant failures, high/critical vulnerabilities, secret leaks, invalid migrations, Terraform validation failures, and failed smoke tests. Load and chaos tests run in scheduled or pre-release pipelines against isolated environments.
