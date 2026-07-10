# User Service

## Purpose

Owns user profile data, verification status projections, and lifecycle status for wallet customers.

## Features

- Create user profile
- Update user profile
- Get current or specific user profile
- Store phone/email verification timestamps
- Manage user status: `pending`, `active`, `suspended`, `closed`
- Publish `user.created` and `user.updated` events to `platform.outbox_events`
- Write audit logs for profile changes

## Security Boundaries

This service does not own passwords, OTPs, transaction PINs, refresh tokens, or sessions. Those belong to auth-service.

## Local Run

Start local dependencies:

```sh
./scripts/local/start.sh
```

Install dependencies:

```sh
npm install
```

Run user-service:

```sh
npm run start:user
```

Defaults:

```text
PORT=3002
DATABASE_URL=postgresql://wallet:wallet_dev_password@localhost:5432/wallet_dev
REDIS_URL=redis://localhost:6379
```

## API Docs

OpenAPI: [docs/api/user-service.openapi.yaml](../../docs/api/user-service.openapi.yaml)

## What Should Not Go Inside

- Password verification or token issuance
- Transaction PIN storage
- Wallet balance calculations
- Ledger entries or provider settlement logic

