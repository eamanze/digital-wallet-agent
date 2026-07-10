# Skill 01 — Domain Architecture

## Purpose

Design the Digital Wallet / Mobile Money platform as a production-grade financial system with clear service boundaries, explicit money movement flows, auditable records, and safe failure handling.

## When to Use This Skill

Use this skill when designing or changing:

- Overall architecture
- Service boundaries
- API contracts
- Event contracts
- Data flow diagrams
- Transaction sequence diagrams
- System context diagrams
- Non-functional requirements
- Production readiness plans

## Core Architecture Principles

1. Separate product workflows from accounting records.
2. The ledger must be independent and trusted.
3. Use service boundaries that match business capabilities.
4. Prefer explicit transaction state machines over hidden side effects.
5. Design every external provider integration as unreliable by default.
6. Make every financial operation traceable from request to ledger to provider settlement.
7. Keep sensitive PII out of logs, queues, traces, analytics, and search unless properly masked/encrypted.
8. Build admin capabilities with maker-checker approval and audit logs.

## Required Service Boundaries

### User Service

Owns:

- User profile
- Account status
- Device registration metadata
- Beneficiaries
- User preferences

Must not own:

- Password verification logic
- Ledger balances
- Provider settlement

### Authentication Service

Owns:

- Login
- Password hashing
- MFA
- OTP lifecycle
- Token issuance
- Refresh token rotation
- Session revocation
- Device trust decisions

Must integrate with:

- Redis for throttling
- Notification service for OTP delivery
- Audit service for login/security events

### KYC Service

Owns:

- KYC profile
- KYC status
- Verification attempts
- Document metadata
- Provider references

Must not store documents directly in the database. Store documents in encrypted object storage and save references only.

### Wallet Service

Owns:

- Wallet metadata
- Wallet status
- Available balance projection
- Holds/reservations

Must not be the source of truth for financial balances. It reads from ledger projections.

### Ledger Service

Owns:

- Chart of accounts
- Journal batches
- Ledger entries
- Posting rules
- Reversals
- Account balances/projections

Must be append-only and double-entry.

### Transaction Service

Owns:

- Business transaction orchestration
- Transaction state machine
- Idempotency
- Coordination between limits, fraud, fees, ledger, notification, and providers

### Payment Integration Service

Owns:

- Bank APIs
- Card processors
- Billers
- Airtime providers
- Provider callbacks
- Provider reference mapping
- Provider status normalization

### Fraud Detection Service

Owns:

- Risk score
- Suspicious activity rules
- Velocity checks
- Device/IP risk
- Manual review recommendations

### Reconciliation Service

Owns:

- Provider report ingestion
- Internal vs external transaction matching
- Settlement matching
- Exception reports
- Finance exports

### Audit Service

Owns:

- Immutable audit events
- Admin action trails
- Security events
- Compliance search

## Required Diagrams

Create these diagrams before implementation:

1. System context diagram
2. Container/service diagram
3. Data flow diagram
4. Deployment diagram
5. Sequence diagram: registration and login
6. Sequence diagram: KYC verification
7. Sequence diagram: wallet funding
8. Sequence diagram: wallet-to-wallet transfer
9. Sequence diagram: withdrawal to bank
10. Sequence diagram: bill payment
11. Sequence diagram: airtime purchase
12. Sequence diagram: provider callback
13. Sequence diagram: reversal/refund
14. Sequence diagram: reconciliation
15. Admin operation sequence diagram

## Required Architecture Decisions

Create ADRs for:

- ECS vs EKS
- SQS/SNS vs Kafka/MSK
- PostgreSQL ledger model
- Ledger source-of-truth strategy
- Balance projection strategy
- Provider integration retry strategy
- KYC provider strategy
- Notification provider failover
- Audit log storage strategy
- Multi-account AWS strategy
- DR and backup approach

## API Design Standards

Every write API must support:

- `Idempotency-Key`
- `X-Request-ID`
- Authentication
- Authorization
- Input validation
- Structured error codes
- Observability fields

Example transfer request:

```json
{
  "source_wallet_id": "wal_123",
  "destination_wallet_id": "wal_456",
  "amount_minor": 1000000,
  "currency": "NGN",
  "narration": "School fees support",
  "transaction_pin": "****"
}
```

Example response:

```json
{
  "request_id": "req_123",
  "status": "pending",
  "data": {
    "transaction_id": "txn_123",
    "transaction_reference": "DW-20260602-000001"
  },
  "error": null
}
```

## Event Taxonomy

Use consistent event names:

```text
user.registered
user.kyc.submitted
user.kyc.approved
user.kyc.rejected
auth.login.succeeded
auth.login.failed
wallet.created
wallet.funded
wallet.transfer.initiated
wallet.transfer.completed
wallet.transfer.failed
wallet.withdrawal.initiated
wallet.withdrawal.completed
ledger.journal.posted
ledger.journal.reversed
payment.provider.callback.received
payment.provider.status.changed
fraud.transaction.flagged
reconciliation.exception.created
admin.action.performed
notification.sent
notification.failed
```

## Architecture Acceptance Criteria

The design is acceptable only when:

- Every service has a bounded context.
- Every financial flow has a sequence diagram.
- Every money movement maps to balanced ledger entries.
- Every external provider operation has callback, timeout, retry, and reconciliation handling.
- Every sensitive field is classified.
- Every critical flow has observability and audit requirements.
- Every service has a deployment and rollback strategy.

## Common Mistakes to Avoid

- Putting all business logic in one monolith without clear boundaries.
- Treating wallet balance as a mutable number instead of a ledger-derived value.
- Making provider callback success the only proof of settlement.
- Ignoring duplicate callbacks.
- Logging sensitive customer identity data.
- Building admin tools without audit logs.
- Designing transaction history directly from provider data instead of internal transaction records.
- Skipping reconciliation.
