# Ledger Model

## Purpose

This document defines the production double-entry ledger model. The ledger is the source of truth for all money movement. Wallet balances are derived from posted ledger entries and controlled projections.

## Core Rules

1. Every financial movement must create a ledger transaction.
2. Every posted ledger transaction must contain at least two ledger entries.
3. Total debit must equal total credit per ledger transaction.
4. Ledger entries store `amount_minor` and `currency`.
5. Posted ledger entries must not be deleted or amount-mutated.
6. Reversals are new compensating ledger transactions.
7. Failed transactions must not create unbalanced ledger entries.
8. Every ledger transaction must link to a transaction reference and an idempotency key.

## Chart of Accounts

Account types:

```text
asset
liability
revenue
expense
settlement
suspense
```

Required seed account examples:

```text
platform_cash_clearing:NGN
platform_fee_revenue:NGN
provider_settlement:default:NGN
bank_settlement:default:NGN
biller_settlement:default:NGN
airtime_provider_settlement:default:NGN
chargeback_suspense:NGN
reversal_suspense:NGN
fraud_hold:NGN
```

User wallet accounts use:

```text
user_wallet:<user_id>:<currency>
```

User wallet accounts are platform liabilities.

## Ledger Tables

`ledger.ledger_accounts` stores the chart of accounts.

`ledger.ledger_transactions` stores posting batches. This is equivalent to a journal batch. It has:

- immutable `transaction_reference`
- unique `ledger_reference`
- unique `idempotency_key`
- `transaction_request_id` link when the posting came from a business transaction
- status
- reversal linkage

`ledger.ledger_entries` stores debit and credit lines for each ledger transaction.

`wallet.wallet_balance_projections` stores controlled balance projections for wallet accounts.

## Posting Lifecycle

Recommended lifecycle:

```text
draft -> posted
posted -> reversed
```

Draft postings are internal assembly state only. A financial transaction is not complete until the ledger transaction is `posted`.

## Database Integrity

The migration creates deferred constraint triggers that validate posted ledger transactions at commit time:

- a posted ledger transaction has at least two entries
- total debit equals total credit
- all entries use the same currency as the ledger transaction
- entries have positive `amount_minor`

The migration also creates immutability triggers:

- posted ledger transactions cannot have financial fields edited
- ledger entries under posted/reversed transactions cannot be updated or deleted
- audit logs cannot be updated or deleted

These database constraints are a last line of defense. The ledger service must still validate before writing.

## Posting Examples

### Wallet Funding

Provider confirms successful collection of NGN 20,000.

| Account | Debit | Credit |
|---|---:|---:|
| Provider/cash clearing asset | 2,000,000 | |
| User wallet liability | | 2,000,000 |

### Wallet Transfer With Fee

Sender transfers NGN 10,000 and pays NGN 50 fee.

| Account | Debit | Credit |
|---|---:|---:|
| Sender wallet liability | 1,005,000 | |
| Receiver wallet liability | | 1,000,000 |
| Platform fee revenue | | 5,000 |

### Withdrawal With Fee

User withdraws NGN 5,000 and pays NGN 25 fee.

| Account | Debit | Credit |
|---|---:|---:|
| User wallet liability | 502,500 | |
| Bank/provider settlement payable | | 500,000 |
| Platform fee revenue | | 2,500 |

## Reversals

Reversal rules:

- never delete original entries
- never mutate posted entry amounts
- create a new ledger transaction with `transaction_type = 'reversal'`
- set `reversal_of_ledger_transaction_id`
- post equal and opposite entries
- audit actor, reason, and approval workflow

## Balance Projection

Projection fields:

```text
posted_balance_minor
available_balance_minor
held_balance_minor
last_ledger_transaction_id
version
```

`posted_balance_minor` is derived from posted ledger entries. `available_balance_minor` is posted balance minus holds/reservations and policy-based restrictions. Projection updates must use row-level locks or optimistic concurrency.

The projection may be cached for read performance, but reconciliation must compare it back to ledger entries.

