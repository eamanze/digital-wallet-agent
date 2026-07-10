# Ledger Service

## Purpose

Owns the double-entry ledger and is the financial source of truth for the wallet platform.

## Features

- Create ledger accounts
- Get ledger accounts
- Create atomic ledger transactions
- Create balanced ledger entries
- Reject unbalanced transactions
- Get account ledger entries
- Compute account balance from ledger entries
- Get transaction by ledger or business reference
- Reverse posted transactions with compensating entries
- Publish `ledger.journal.posted` and `ledger.journal.reversed`
- Audit ledger posting and reversal actions

## Critical Rules

- Every posted ledger transaction must have total debit equal total credit.
- Every posted ledger transaction must contain at least two entries.
- Do not mutate posted ledger entries.
- Do not delete ledger entries.
- Do not update wallet balances directly.
- Use idempotency keys for all writes.
- Reversals are explicit new ledger transactions.
- Ledger writes are atomic database transactions.

## Required Platform Accounts

Seeded platform accounts include:

```text
platform_cash_clearing:NGN
platform_fee_revenue:NGN
platform_suspense:NGN
provider_clearing:default:NGN
biller_clearing:default:NGN
airtime_clearing:default:NGN
```

## Local Run

Start local dependencies:

```sh
./scripts/local/start.sh
```

Install dependencies:

```sh
npm install
```

Run ledger-service:

```sh
npm run start:ledger
```

Defaults:

```text
PORT=3004
DATABASE_URL=postgresql://wallet:wallet_dev_password@localhost:5432/wallet_dev
```

## API Docs

OpenAPI: [docs/api/ledger-service.openapi.yaml](../../docs/api/ledger-service.openapi.yaml)

## What Should Not Go Inside

- Product workflow orchestration
- Provider API calls
- Notification delivery
- Direct wallet balance mutation

