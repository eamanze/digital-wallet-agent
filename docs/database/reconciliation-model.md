# Reconciliation Model

## Purpose

This document defines how provider, settlement, transaction, and ledger records are matched. Reconciliation is mandatory for every external provider and every financial workflow that depends on provider state.

## Reconciliation Sources

| Source | Storage |
|---|---|
| Internal transaction state | `transactions.transaction_requests` |
| Provider requests/status | `transactions.payment_provider_requests` |
| Provider callbacks | `transactions.payment_provider_callbacks` |
| Ledger postings | `ledger.ledger_transactions`, `ledger.ledger_entries` |
| Settlement files | encrypted S3, metadata in `reconciliation.reconciliation_batches` |
| Reconciliation results | `reconciliation.reconciliation_items` |

## Batch Model

`reconciliation.reconciliation_batches` represents one reconciliation run or imported provider file.

Batch identity:

```text
provider_name
batch_type
settlement_date
source_file_checksum
```

This identity prevents duplicate processing of the same settlement file.

## Item Model

`reconciliation.reconciliation_items` stores one matched or mismatched item.

Common exception types:

```text
missing_provider_record
missing_internal_record
amount_mismatch
currency_mismatch
status_mismatch
duplicate_provider_reference
settlement_missing
fee_mismatch
unknown_provider_record
late_callback
manual_review_required
```

## Match Keys

Use combinations of:

- internal `transaction_request_id`
- `transaction_reference`
- `provider_request_id`
- provider name
- provider reference
- provider session/reference ID
- amount
- currency
- timestamp window
- destination account/phone
- settlement batch ID

## Resolution Rules

- Matching records are marked `matched`.
- Mismatches create exceptions and must be tracked to closure.
- Manual adjustment must create an approved ledger transaction.
- Exception resolution must create audit logs.
- Suspense accounts must be monitored and reported.

## Idempotency

Reconciliation runs are idempotent by:

```text
provider_name
batch_type
settlement_date
source_file_checksum
```

Reprocessing the same file must not create duplicate exceptions.

## Required Jobs

- Hourly provider status reconciliation for pending transactions.
- Daily provider settlement report ingestion.
- Daily ledger balance projection reconciliation.
- Daily suspense account report.
- Daily provider fee/commission reconciliation.
- Monthly finance close report.

