# Skill 08 — Data Storage, Messaging, and Search

## Purpose

Design and implement reliable data storage, caching, messaging, event processing, object storage, and search for a production-grade wallet platform.

## When to Use This Skill

Use this skill when working on:

- PostgreSQL/MySQL schemas
- Ledger database
- Redis caching
- SQS/SNS/Kafka/MSK
- S3 object storage
- OpenSearch
- Data retention
- Event contracts
- Database migration
- Backup and restore

## Data Ownership Rules

1. Each service owns its data model.
2. Other services should access data through APIs or events, not direct database reads, unless a documented reporting replica exists.
3. Ledger data must be protected more strictly than ordinary metadata.
4. Redis is not a source of truth.
5. OpenSearch is not a source of truth.
6. S3 objects must be encrypted and access-controlled.
7. Financial data must be retained according to policy.

## Database Categories

### Operational Database

Stores:

- Users
- Wallet metadata
- Transaction metadata
- KYC metadata
- Provider references
- Admin data

### Ledger Database

Stores:

- Accounts
- Journal batches
- Ledger entries
- Balance projections
- Reversals
- Financial close snapshots

### Audit Store

Stores:

- Security events
- Admin actions
- Financial workflow events
- Data access events

### Search Store

Stores indexed copies for fast search:

- Masked transaction summaries
- Audit summaries
- Operations metadata

## Database Migration Rules

Migrations must be:

- Version-controlled
- Repeatable in dev/staging/prod
- Backward-compatible where possible
- Tested in CI
- Tested against realistic data volume
- Reversible or have a documented forward-fix plan

High-risk changes:

- Dropping columns
- Renaming columns
- Changing money precision
- Changing ledger constraints
- Adding non-null columns without defaults
- Long-running locks on high-volume tables

## Money Storage Rules

Use one of these:

- Integer minor units, recommended: `amount_minor BIGINT`
- Decimal fixed precision: `NUMERIC(19,4)`

Avoid:

- Floating-point values for money
- Missing currency column
- Implicit currency from user country

## Redis Usage

Valid uses:

- OTP throttling
- Session cache
- Rate limiting counters
- Short-lived distributed locks
- Idempotency in-progress marker
- Device risk cache

Invalid uses:

- Source of wallet balance
- Source of transaction state
- Permanent audit records
- Permanent fraud evidence

Redis failure handling:

- Auth/security flows should fail safely.
- Money movement should not bypass limits because Redis is down.
- Degraded mode must be documented.

## Messaging Architecture

### Required Queue Patterns

Use queues for:

- Notification sending
- Fraud enrichment
- Provider callback processing
- Reconciliation report processing
- Audit event fanout
- Search indexing

Every queue must have:

- DLQ
- Visibility timeout
- Retry policy
- Redrive policy
- Message retention
- Alarm for oldest message age
- Alarm for DLQ count

### Event Contract Rules

Events must be:

- Versioned
- Immutable
- Traceable
- Idempotent for consumers
- Validated with schemas
- Safe to replay where possible

Event envelope:

```json
{
  "event_id": "uuid",
  "event_type": "transaction.completed",
  "event_version": "1.0",
  "occurred_at": "timestamp",
  "correlation_id": "uuid",
  "causation_id": "uuid",
  "payload": {}
}
```

## S3 Object Storage

Use S3 for:

- KYC documents
- Reconciliation reports
- Provider settlement files
- Archived audit logs
- Finance exports
- Build artifacts

Controls:

- Block public access
- KMS encryption
- Bucket policy denies insecure transport
- Versioning where needed
- Lifecycle transition/expiration
- Access logging or CloudTrail data events for sensitive buckets
- Pre-signed URLs with short TTL only

KYC object key example:

```text
kyc/<env>/<user_id>/<document_id>/<version>.encrypted
```

Do not use meaningful public filenames containing identity numbers.

## OpenSearch

Index only what is needed for investigation.

Rules:

- Mask PII.
- Store references to source records.
- Use index lifecycle policies.
- Restrict access.
- Do not rely on OpenSearch for financial truth.

Example transaction search document:

```json
{
  "transaction_id": "txn_123",
  "reference": "DW-20260602-000001",
  "masked_user_phone": "+234******1234",
  "type": "wallet_transfer",
  "status": "successful",
  "amount_minor": 1000000,
  "currency": "NGN",
  "created_at": "timestamp"
}
```

## Backup and Restore

Required:

- RDS automated backups
- PITR
- Manual snapshots before risky migrations
- S3 versioning/lifecycle where needed
- OpenSearch snapshots if used for critical investigation
- Terraform state backup
- Restore runbooks
- Scheduled restore tests

## Required Tests

- Database migration test.
- Ledger schema rejects invalid data.
- Queue consumer handles duplicate message.
- Queue consumer sends poison message to DLQ.
- Redis outage behavior is safe.
- S3 bucket denies public access.
- KYC object is encrypted.
- OpenSearch document masks PII.
- Backup restore test in non-production.

## Observability

Metrics:

- db_connection_count
- db_query_latency_ms
- db_lock_wait_ms
- queue_depth
- queue_oldest_message_age
- dlq_message_count
- redis_memory_usage
- redis_evictions
- opensearch_indexing_failures
- s3_put_failures

Alerts:

- RDS high CPU
- RDS storage low
- RDS connection exhaustion
- Redis evictions
- DLQ > 0
- Queue age beyond SLA
- OpenSearch indexing failure spike
- Backup failure

## Common Mistakes to Avoid

- Shared database tables across services without ownership.
- No DLQ on queues.
- Consuming messages without idempotency.
- Storing sensitive KYC documents in a public bucket.
- Indexing full identity numbers in OpenSearch.
- Not testing restore.
