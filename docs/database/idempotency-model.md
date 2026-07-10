# Idempotency Model

## Purpose

This document defines idempotency storage and behavior for API writes, ledger postings, provider requests, provider callbacks, and async event consumers.

## Required Rule

All money operations must use idempotency keys. Duplicate requests must not create duplicate transactions, provider calls, ledger postings, callbacks, notifications, or reversals.

## Idempotency Table

`platform.idempotency_keys` stores:

- service name
- operation name
- idempotency key
- actor ID
- request hash
- status
- locked-until timestamp
- response code/body
- resource type and ID
- expiry

Unique key:

```text
(service_name, operation_name, idempotency_key)
```

## API Behavior

| Scenario | Result |
|---|---|
| Same key and same request hash while in progress | Return in-progress or retry-after response. |
| Same key and same request hash after completion | Return original response. |
| Same key and different request hash | Reject as idempotency conflict. |
| Expired key | Treat as new only when business workflow allows it. |

## Ledger Idempotency

`ledger.ledger_transactions.idempotency_key` is unique. Retrying a ledger posting with the same key must return the original ledger transaction. Retrying with a different payload must be rejected by the ledger service before commit.

Ledger idempotency keys should be derived from stable business intent:

```text
ledger:<transaction_reference>:<posting_type>
ledger:<transaction_reference>:reversal:<reason_or_approval_id>
```

## Provider Request Idempotency

`transactions.payment_provider_requests.provider_idempotency_key` is unique per provider. Outbound provider requests must use stable references:

```text
<provider>:<transaction_reference>:<attempt_type>
```

Retries must reuse the same provider reference when the provider supports idempotency.

## Provider Callback Idempotency

Provider callbacks are deduplicated in `transactions.payment_provider_callbacks`.

Dedupe keys:

- provider name
- provider callback ID when supplied
- provider reference
- event type/status
- payload hash

Behavior:

- same callback: acknowledge and do not reprocess financial effects
- duplicate with conflicting payload: create reconciliation/fraud exception
- unknown provider reference: create reconciliation exception

## Async Consumer Idempotency

Event consumers should store processed event IDs in their owned schema or a shared consumer ledger. Events must be safe to replay. Replayed events must not create new ledger postings unless the ledger idempotency key resolves to the intended original posting.

## Retention

Financial idempotency records must be retained long enough to cover:

- provider callback retry windows
- dispute windows
- reconciliation windows
- legal and audit retention requirements

Short-lived API idempotency may expire earlier only for non-financial operations.

