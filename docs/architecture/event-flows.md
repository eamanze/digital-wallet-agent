# Event Flows

## Purpose

This document defines the platform's event-driven architecture. Events are used for workflow continuation, notifications, audit fanout, search indexing, reconciliation, and operational monitoring. Events must not replace ledger correctness or database transaction boundaries.

## Event Envelope

```json
{
  "event_id": "uuid",
  "event_type": "transaction.completed",
  "event_version": "1.0",
  "occurred_at": "timestamp",
  "correlation_id": "uuid",
  "causation_id": "uuid",
  "producer": "transaction-service",
  "payload": {}
}
```

## Event Rules

- Events are immutable facts.
- Consumers must be idempotent.
- Events must be versioned and schema-validated.
- Sensitive PII must be masked or excluded.
- Events must carry correlation IDs.
- Queue consumers must have retries, DLQs, and alerts.
- Financial posting events must reference ledger journal IDs, not embed full accounting data unnecessarily.

## Core Event Streams

| Flow | Primary Events | Consumers |
|---|---|---|
| Registration and login | `user.registered`, `auth.login.succeeded`, `auth.login.failed`, `auth.device.new_detected` | audit-service, notification-service, fraud-service, user-service projections |
| KYC verification | `kyc.submitted`, `kyc.approved`, `kyc.rejected`, `kyc.manual_review_required` | user-service, limits-service, audit-service, notification-service |
| Wallet funding | `transaction.created`, `payment.provider.status.changed`, `ledger.journal.posted`, `transaction.completed` | wallet-service, notification-service, reconciliation-service, audit-service |
| Wallet transfer | `transaction.created`, `fraud.transaction.evaluated`, `fees.calculated`, `ledger.journal.posted`, `transaction.completed` | wallet-service, notification-service, reconciliation-service, audit-service |
| Bank withdrawal | `wallet.hold.created`, `transaction.provider_pending`, `payment.provider.status.changed`, `ledger.journal.posted`, `transaction.completed` | wallet-service, notification-service, reconciliation-service, audit-service |
| Bill payment | `transaction.created`, `payment.provider.status.changed`, `ledger.journal.posted`, `transaction.completed` | notification-service, reconciliation-service, audit-service |
| Airtime purchase | `transaction.created`, `payment.provider.status.changed`, `ledger.journal.posted`, `transaction.completed` | notification-service, reconciliation-service, audit-service |
| Failed callback | `payment.provider.callback.received`, `payment.provider.status.changed`, `transaction.failed`, `ledger.journal.reversed` | transaction-service, wallet-service, notification-service, reconciliation-service, audit-service |
| Duplicate callback | `payment.provider.callback.duplicate` | audit-service, reconciliation-service, fraud-service |
| Reversal | `transaction.reversal.requested`, `ledger.journal.reversed`, `transaction.reversed` | wallet-service, notification-service, reconciliation-service, audit-service |
| Fraud review | `fraud.manual_review.created`, `admin.action.performed`, `fraud.manual_review.decided` | transaction-service, audit-service, notification-service |
| Reconciliation | `reconciliation.run.started`, `reconciliation.exception.created`, `reconciliation.run.completed` | admin-dashboard, audit-service, finance reporting |

## Outbox Pattern

Services that update a database and publish events must use an outbox pattern:

1. Write domain state and outbox event in the same database transaction.
2. Outbox publisher reads unpublished rows.
3. Publisher sends event to SNS/SQS or MSK.
4. Publisher marks outbox row as published.
5. Consumers dedupe by `event_id`.

This prevents losing events after successful database commits.

## Queue Strategy

Use SNS/SQS by default:

```text
domain-topic
  -> audit-queue
  -> notification-queue
  -> search-index-queue
  -> reconciliation-queue
  -> fraud-enrichment-queue
```

Every queue requires:

- DLQ
- visibility timeout aligned to worker duration
- bounded retry policy
- oldest-message-age alert
- DLQ-count alert
- idempotent consumer

## Event Idempotency

Consumers maintain a processed-event record:

```text
event_id
consumer_name
processed_at
result
source_correlation_id
```

Financial consumers must also dedupe by domain keys, such as:

- `transaction_id`
- `journal_reference`
- `provider_reference`
- `callback_id`
- `settlement_batch_id`

## Replay Rules

Event replay is allowed for projections, audit fanout, search indexing, and reconciliation enrichment. Event replay must not create new financial postings unless the replayed command passes ledger idempotency checks and targets an existing intended transaction.

## Provider Callback Event Path

```text
Provider callback
  -> payment-integration-service verifies signature and replay window
  -> callback dedupe write
  -> `payment.provider.callback.received`
  -> normalized provider status write
  -> `payment.provider.status.changed`
  -> transaction-service state transition
  -> ledger-service posting/reversal when required
  -> audit/reconciliation/notification events
```

Duplicate callbacks publish `payment.provider.callback.duplicate` and must not trigger ledger posting.

