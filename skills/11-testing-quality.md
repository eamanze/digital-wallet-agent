# Skill 11 — Testing and Quality Engineering

## Purpose

Create a comprehensive test strategy for a production-grade Digital Wallet / Mobile Money platform, including unit, integration, contract, E2E, security, performance, chaos, reconciliation, and disaster recovery tests.

## When to Use This Skill

Use this skill when designing or implementing:

- Test plans
- Automated test suites
- CI quality gates
- Load tests
- Chaos tests
- Security tests
- Provider mocks
- Reconciliation tests
- Ledger correctness tests

## Testing Principles

1. Money movement logic must be heavily tested.
2. Ledger balancing must have property/invariant tests.
3. Provider integrations must be tested with mocks, sandboxes, and replayed callbacks.
4. All write APIs must be tested for idempotency.
5. Concurrency tests must prove no overspending.
6. Security tests must cover abuse paths.
7. Reconciliation must be tested with mismatched reports.
8. Failure tests are as important as success tests.

## Test Pyramid

```text
Unit tests: many
Integration tests: many for critical flows
Contract tests: required between services/providers
E2E tests: key happy paths and failure paths
Performance tests: critical APIs and transaction flows
Chaos tests: selected infrastructure and provider failures
Manual exploratory tests: admin and risk operations
```

## Required Unit Tests

### Auth

- Password hashing and verification
- OTP expiry
- OTP retry limit
- PIN hashing
- Token expiry
- Refresh token rotation

### Ledger

- Balanced posting accepted
- Unbalanced posting rejected
- Duplicate idempotency key handled
- Reversal entries created
- Fee entries posted correctly
- Currency mismatch rejected

### Transaction

- Transfer validation
- Insufficient funds
- Limit exceeded
- Fraud challenge
- Provider timeout handling
- State transition validity

### Fees/Limits/Fraud

- Tier-based limit
- Velocity limit
- Fee cap
- Fee waiver
- Risk score decision

## Required Integration Tests

- Register → verify phone → login
- KYC submit → provider callback → tier update
- Create wallet → fund wallet → balance update
- Wallet transfer with fee
- Withdrawal to bank provider mock
- Bill payment provider mock
- Airtime provider mock
- Provider callback duplicate
- Reconciliation report ingestion
- Admin manual review decision

## Required Contract Tests

Between internal services:

- Auth and User
- Transaction and Ledger
- Transaction and Fraud
- Transaction and Limits
- Transaction and Fee
- Transaction and Notification
- Transaction and Payment Integration
- Reconciliation and Payment Integration

For providers:

- Funding initialization response
- Payout response
- Callback payload
- Status query response
- Settlement report format

## Required E2E Tests

1. New user registers, completes KYC, funds wallet, transfers money, views history.
2. User attempts transfer above limit and is blocked.
3. User fails PIN repeatedly and transaction capability is locked.
4. Funding callback duplicates but wallet is credited once.
5. Withdrawal provider times out and transaction remains pending.
6. Reconciliation detects provider/internal mismatch.
7. Admin reviews suspicious transaction and approves/rejects.

## Security Tests

Required:

- SQL injection tests
- XSS tests for admin dashboard
- Auth bypass tests
- Horizontal authorization tests
- Rate limit tests
- OTP brute force tests
- PIN brute force tests
- Token replay tests
- Webhook signature failure tests
- Webhook replay tests
- Secrets scan
- Dependency vulnerability scan
- Container vulnerability scan
- IaC security scan

## Performance Tests

Critical scenarios:

- Login spike
- OTP spike
- Transaction history pagination
- Wallet transfer throughput
- Ledger posting throughput
- Provider callback burst
- Notification queue burst
- Reconciliation report processing

Measure:

- p50/p95/p99 latency
- throughput
- error rate
- CPU/memory
- database connections
- locks
- queue depth
- cost estimate under load

## Chaos and Resilience Tests

Simulate:

- Transaction service restart during transfer
- Ledger service restart during posting
- Redis unavailable
- RDS failover
- Queue backlog
- Provider timeout
- Provider returns duplicate callback
- Notification provider unavailable
- OpenSearch unavailable
- Bad deployment rollback
- AZ failure where feasible

Expected behavior:

- No duplicate money movement.
- No lost transaction state.
- Pending transactions recover.
- DLQs capture failed async work.
- Alerts fire.
- Runbooks work.

## Reconciliation Tests

Test cases:

- Internal success, provider success, settlement match.
- Internal success, provider success, settlement missing.
- Internal pending, provider success.
- Internal failed, provider success.
- Internal success, provider failed.
- Amount mismatch.
- Duplicate provider reference.
- Unknown provider reference.
- Fee mismatch.

## Test Data Management

Rules:

- Do not use real customer PII in tests.
- Use synthetic identities.
- Use provider sandbox credentials.
- Mask test reports.
- Seed predictable test wallets.
- Reset environments safely.

## CI Quality Gates

Pipeline must fail on:

- Failed unit tests
- Failed ledger invariants
- Failed contract tests
- Critical security findings
- Secret leak
- Terraform validation error
- Failed smoke test
- Broken migration

## Acceptance Criteria

Testing is production-grade when:

- Critical financial flows have success and failure tests.
- Ledger invariants are automated.
- Idempotency is tested for all write APIs.
- Provider callbacks are tested for duplicates and invalid signatures.
- Concurrency tests prove no overspending.
- Load tests meet defined targets.
- Chaos tests show safe recovery.
- Security tests run in CI.

## Common Mistakes to Avoid

- Only testing happy paths.
- Not testing duplicate requests.
- Not testing concurrent transfers.
- Not testing provider timeout.
- Not testing reconciliation mismatches.
- Using real PII in test data.
- Running security scans only manually.
