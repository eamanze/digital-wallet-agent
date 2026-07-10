# Wallet Service

## Purpose

Owns wallet lifecycle, wallet metadata, wallet status, statements, and balance projections. It is not the financial source of truth.

## Features

- Create wallet for user
- Create linked ledger account through ledger-service
- Prevent duplicate wallet per user/currency
- Support NGN currency first
- Get wallet
- Get wallet balance from ledger-service
- Maintain `wallet_balance_projections` as a read optimization
- Freeze, unfreeze, and close wallet
- View wallet statement from ledger-service entries
- Publish `wallet.created` and `wallet.status_changed`
- Audit wallet lifecycle changes

## Financial Rule

Ledger-service remains the source of truth. Wallet-service must not perform money movement and must not directly mutate financial balances. If the projection and ledger disagree, ledger wins and the projection is refreshed from ledger-derived balance.

## Local Run

Start local dependencies and ledger-service:

```sh
./scripts/local/start.sh
npm run start:ledger
```

Install dependencies:

```sh
npm install
```

Run wallet-service:

```sh
npm run start:wallet
```

Defaults:

```text
PORT=3005
DATABASE_URL=postgresql://wallet:wallet_dev_password@localhost:5432/wallet_dev
LEDGER_SERVICE_URL=http://localhost:3004
```

## API Docs

OpenAPI: [docs/api/wallet-service.openapi.yaml](../../docs/api/wallet-service.openapi.yaml)

## What Should Not Go Inside

- Ledger posting logic
- Provider payment integrations
- Direct balance mutation as financial truth
- Transaction orchestration

