# Service Boundaries

## Purpose

This document defines bounded contexts, ownership rules, databases, APIs, events, and forbidden responsibilities. These boundaries are mandatory production controls, not implementation preferences.

## Boundary Rules

1. Product workflow state is separate from accounting records.
2. The ledger is independent, append-only, and double-entry.
3. Services own their data and expose APIs/events for collaboration.
4. Financial operations must be traceable from request to ledger to provider settlement.
5. Redis, queues, and OpenSearch are not sources of truth.
6. Admin tools must not bypass service APIs, ledger rules, audit logging, or maker-checker controls.

## Service Ownership Matrix

| Service | Owns | Database Writes | Publishes | Consumes | Must Not Own |
|---|---|---|---|---|---|
| auth-service | Login, password hash, OTP, MFA, sessions, PIN verification, device trust | Auth users, sessions, OTP metadata, PIN hash metadata, device auth state | `auth.login.succeeded`, `auth.login.failed`, `auth.pin.failed`, `auth.device.new_detected` | `user.registered`, notification delivery status | User profile, KYC decision, ledger balances |
| user-service | Profile, account status, beneficiaries, preferences, device metadata | User profiles, account status, beneficiaries | `user.registered`, `user.status.changed`, `user.beneficiary.created` | KYC tier/status events, fraud restrictions | Password/PIN auth, ledger, provider settlement |
| kyc-service | KYC profile, documents metadata, provider attempts, KYC tier | KYC profiles, document references, provider references, verification attempts | `kyc.submitted`, `kyc.approved`, `kyc.rejected`, `kyc.manual_review_required` | Provider callback/status events, admin review decisions | Raw document DB storage, wallet balances |
| wallet-service | Wallet lifecycle, status, holds, balance view | Wallet metadata, hold records, wallet status | `wallet.created`, `wallet.hold.created`, `wallet.hold.released` | `ledger.journal.posted`, `ledger.journal.reversed`, KYC/user status events | Source-of-truth balance mutation |
| ledger-service | Accounts, journals, entries, reversals, projections | Ledger accounts, journals, entries, projections | `ledger.journal.posted`, `ledger.journal.reversed`, `ledger.imbalance.rejected` | Posting requests from transaction/reconciliation/admin-approved workflows | Product orchestration, provider calls |
| transaction-service | Transaction state machine, idempotency, orchestration | Transactions, idempotency records, state transitions | `transaction.created`, `transaction.completed`, `transaction.failed`, `transaction.reversed` | Fraud, limit, fee, ledger, provider, admin decisions | Ledger source of truth |
| fraud-service | Risk score, velocity, suspicious activity, manual review recommendation | Fraud evaluations, rule hits, manual review recommendations | `fraud.transaction.evaluated`, `fraud.transaction.flagged`, `fraud.manual_review.created` | Auth/device signals, transaction events, admin decisions | Final accounting |
| limits-service | KYC-tier and velocity limit decisions | Limit configs, usage snapshots where needed, decisions | `limits.transaction.allowed`, `limits.transaction.denied`, `limits.config.changed` | KYC/user status, transaction events | Fraud scoring, fee calculation |
| fee-service | Fee/commission/tax rules and account mapping | Fee configs, fee calculation audit records | `fees.calculated`, `fees.config.changed` | Transaction context, admin-approved config changes | Ledger execution |
| payment-integration-service | Provider adapters, references, callbacks, status normalization | Provider attempts, callback dedupe, provider status records | `payment.provider.callback.received`, `payment.provider.status.changed`, `payment.provider.timeout` | Transaction requests, provider callbacks | Ledger posting, raw card storage |
| notification-service | SMS/email/push templates, dispatch, delivery status | Notification jobs, provider delivery state | `notification.sent`, `notification.failed` | User, auth, transaction, KYC, fraud events | Money movement decisions |
| reconciliation-service | Provider/settlement/ledger matching, exceptions, finance exports | Reconciliation runs, matches, exceptions, export metadata | `reconciliation.run.completed`, `reconciliation.exception.created`, `reconciliation.exception.resolved` | Provider settlement files, transaction/ledger/provider events | Direct ledger edits without reversal/adjustment journals |
| audit-service | Immutable audit trail, compliance search projections | Audit events and archives | `audit.event.created`, `audit.event.write_failed` | All auditable domain/security/admin events | Mutable operational state |
| admin-dashboard | Admin UI, maker-checker workflows, support/fraud/finance views | Admin workflow state, approval requests | `admin.action.performed`, `admin.approval.requested`, `admin.approval.decided` | Audit/search projections, service APIs | Direct database mutation bypassing owners |

## Financial Boundary

Only `ledger-service` may create posted financial entries. Other services request postings through a validated command:

```text
transaction_id
transaction_reference
journal_reference
idempotency_key
currency
entries[]
metadata
```

`ledger-service` must reject:

- unbalanced entries
- missing or inactive accounts
- duplicate idempotency key with different payload
- currency mismatch
- negative or zero amounts
- mutation of posted journals

## Admin Boundary

Admin actions use service APIs and must create audit events. Sensitive actions require maker-checker:

- account freeze/unfreeze
- KYC override
- limit override
- fee configuration change
- manual reversal
- settlement adjustment
- provider configuration change
- admin role assignment
- bulk export

## Event Boundary

Events communicate facts, not commands, unless explicitly modeled as workflow jobs. Event payloads must be:

- versioned
- immutable
- idempotent for consumers
- safe to replay
- free of raw secrets and sensitive unmasked PII

