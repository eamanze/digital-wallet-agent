# Skill 05 — Wallet and Double-Entry Ledger

## Purpose

Build the financial core of the wallet platform using a double-entry ledger where every debit has corresponding credit entries and wallet balances are derived from immutable accounting records.

## When to Use This Skill

Use this skill when implementing:

- Wallet creation
- Wallet balance
- Ledger posting
- Transfers
- Funding
- Withdrawals
- Fees
- Reversals
- Holds/reservations
- Balance reconciliation
- Financial reporting

## Non-Negotiable Ledger Rules

1. The ledger is the source of truth.
2. Every posting batch must balance.
3. Total debits must equal total credits.
4. Do not delete ledger entries.
5. Do not update posted ledger amounts.
6. Reverse mistakes with new compensating entries.
7. Store amount in minor units where possible.
8. Store currency on every entry.
9. Every posting must be idempotent.
10. Every ledger batch must link to a transaction reference.

## Chart of Accounts

Suggested account types:

```text
asset
liability
revenue
expense
settlement
suspense
```

Example accounts:

```text
user_wallet:<user_id>
platform_fee_revenue
provider_settlement:<provider_name>
bank_settlement:<bank_name>
biller_settlement:<biller_name>
airtime_provider_settlement:<provider_name>
chargeback_suspense
reversal_suspense
fraud_hold
```

Accounting interpretation:

- User wallet balances are platform liabilities.
- Provider settlement accounts track external money owed/receivable.
- Fee revenue is posted separately.
- Suspense accounts track unresolved exceptions.

## Ledger Data Model

### ledger_accounts

```sql
CREATE TABLE ledger_accounts (
  id UUID PRIMARY KEY,
  account_code TEXT UNIQUE NOT NULL,
  account_type TEXT NOT NULL,
  owner_type TEXT NOT NULL,
  owner_id TEXT,
  currency CHAR(3) NOT NULL,
  status TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### ledger_journals

```sql
CREATE TABLE ledger_journals (
  id UUID PRIMARY KEY,
  transaction_id UUID NOT NULL,
  journal_reference TEXT UNIQUE NOT NULL,
  idempotency_key TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  posted_at TIMESTAMPTZ
);
```

### ledger_entries

```sql
CREATE TABLE ledger_entries (
  id UUID PRIMARY KEY,
  journal_id UUID NOT NULL REFERENCES ledger_journals(id),
  account_id UUID NOT NULL REFERENCES ledger_accounts(id),
  entry_type TEXT NOT NULL CHECK (entry_type IN ('debit', 'credit')),
  amount_minor BIGINT NOT NULL CHECK (amount_minor > 0),
  currency CHAR(3) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### balance_projections

```sql
CREATE TABLE ledger_balance_projections (
  account_id UUID PRIMARY KEY REFERENCES ledger_accounts(id),
  currency CHAR(3) NOT NULL,
  posted_balance_minor BIGINT NOT NULL DEFAULT 0,
  available_balance_minor BIGINT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

## Posting Engine Requirements

Posting function must:

1. Accept idempotency key.
2. Validate journal reference uniqueness.
3. Validate transaction reference exists.
4. Validate all accounts exist and are active.
5. Validate single currency or explicitly handle FX.
6. Validate total debit equals total credit.
7. Persist journal and entries in one database transaction.
8. Update balance projection safely.
9. Publish ledger event.
10. Return same response for duplicate idempotency key.

## Example: Wallet-to-Wallet Transfer With Fee

Scenario:

- User A sends ₦10,000 to User B.
- Platform fee is ₦50 paid by sender.
- Total debit from User A is ₦10,050.

Ledger entries:

| Account | Debit | Credit |
|---|---:|---:|
| User A wallet liability | ₦10,050 | - |
| User B wallet liability | - | ₦10,000 |
| Platform fee revenue | - | ₦50 |

Batch total:

```text
Debit = ₦10,050
Credit = ₦10,050
Balanced = true
```

## Example: Wallet Funding by Card/Bank

Scenario:

- User funds wallet with ₦20,000.
- Payment provider confirms successful collection.

Ledger entries:

| Account | Debit | Credit |
|---|---:|---:|
| Provider settlement receivable/cash clearing | ₦20,000 | - |
| User wallet liability | - | ₦20,000 |

When provider settlement hits bank account, reconcile provider settlement to bank settlement account according to finance policy.

## Example: Bank Withdrawal

Scenario:

- User withdraws ₦5,000 to bank.
- Fee ₦25.

Ledger entries:

| Account | Debit | Credit |
|---|---:|---:|
| User wallet liability | ₦5,025 | - |
| Bank/provider settlement payable | - | ₦5,000 |
| Platform fee revenue | - | ₦25 |

## Holds and Reservations

Use holds for pending transactions when final status depends on an external provider.

Hold lifecycle:

```text
created -> captured -> released
created -> expired
created -> reversed
```

Rules:

- Holds reduce available balance.
- Holds do not necessarily reduce posted balance until captured, depending on accounting policy.
- Holds must expire or resolve.
- Stale holds must alert.

## Balance Query Rules

Balance response should include:

```json
{
  "wallet_id": "wal_123",
  "currency": "NGN",
  "posted_balance_minor": 1000000,
  "available_balance_minor": 950000,
  "held_balance_minor": 50000,
  "as_of": "2026-06-02T10:00:00Z"
}
```

Balance must be explainable by ledger entries and holds.

## Reversals

Rules:

- Never delete original transaction.
- Never mutate original ledger entry amount.
- Create reversal journal.
- Link reversal to original journal.
- Reverse fees according to product policy.
- Audit the reversal reason and actor.

## Concurrency Controls

Required:

- Database transactions
- Row-level locks or optimistic concurrency for balance projections
- Unique idempotency keys
- Unique transaction references
- Safe retry handling
- Isolation level chosen and documented

Test concurrent transfers from the same wallet to ensure no overspending.

## Required APIs

```text
POST /wallets
GET  /wallets/{wallet_id}
GET  /wallets/{wallet_id}/balance
POST /ledger/postings
GET  /ledger/journals/{journal_id}
GET  /ledger/accounts/{account_id}/entries
POST /ledger/journals/{journal_id}/reverse
POST /wallets/{wallet_id}/holds
POST /wallets/{wallet_id}/holds/{hold_id}/capture
POST /wallets/{wallet_id}/holds/{hold_id}/release
```

## Required Events

```text
wallet.created
wallet.status.changed
ledger.journal.posted
ledger.journal.reversed
wallet.balance_projection.updated
wallet.hold.created
wallet.hold.captured
wallet.hold.released
wallet.hold.expired
```

## Required Tests

- Ledger posting succeeds when debits equal credits.
- Ledger posting fails when unbalanced.
- Duplicate idempotency key returns same result.
- Duplicate transaction reference is rejected or deduplicated.
- Concurrent debit cannot overspend wallet.
- Reversal creates compensating entries.
- Fee posting balances.
- Multi-currency posting is rejected unless FX flow exists.
- Balance projection matches ledger entries.
- Holds reduce available balance.
- Expired holds release available balance.

## Observability

Metrics:

- ledger_posting_total
- ledger_posting_failed_total
- ledger_posting_latency_ms
- ledger_imbalance_attempt_total
- wallet_balance_query_total
- wallet_hold_created_total
- wallet_hold_expired_total
- ledger_reversal_total

Critical alert:

```text
ledger_imbalance_detected > 0
```

This must page immediately.

## Runbooks

Create runbooks for:

- Ledger imbalance attempt
- Balance projection mismatch
- Duplicate posting request
- Reversal required
- Wallet overspend alert
- Stale holds
- Ledger database lock contention

## Common Mistakes to Avoid

- Storing wallet balance as the only record of money.
- Updating balances without ledger journal.
- Using floating-point numbers for money.
- Ignoring duplicate requests.
- Not separating fees from transfer principal.
- Deleting failed transactions.
- Allowing unbalanced journals.
