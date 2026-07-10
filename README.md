# Digital Wallet / Mobile Money Platform

## Purpose

This repository is the production-grade skeleton for a Digital Wallet / Mobile Money platform. It is organized around strict service boundaries, database ownership, audited operations, and a double-entry ledger as the source of truth for all financial balances.

Business logic has not been implemented yet. The current repo establishes the structure, ownership model, and guardrails that future implementation must follow.

## Local Development

The local stack uses Docker Compose and local-only mock providers. It is intended for development and integration testing without real money, real payment providers, real billers, real airtime providers, or production credentials.

Prerequisites:

- Docker Desktop or Docker Engine with Compose v2
- Bash

Start the local stack:

```sh
./scripts/local/start.sh
```

Start with optional OpenSearch:

```sh
./scripts/local/start.sh --with-opensearch
```

Stop the local stack:

```sh
./scripts/local/stop.sh
```

Reset all local containers and volumes, then recreate the stack:

```sh
./scripts/local/reset.sh
```

The first start copies `.env.example` to `.env` if `.env` does not exist. The PostgreSQL container applies SQL migrations from `infrastructure/db/migrations` and local seed data from `scripts/seed`.

Install application dependencies:

```sh
npm install
```

Run the first implemented services:

```sh
npm run start:auth
npm run start:user
npm run start:kyc
npm run start:ledger
npm run start:wallet
```

Run tests:

```sh
npm test
```

Local endpoints:

```text
Auth service:        http://localhost:3001
User service:        http://localhost:3002
KYC service:         http://localhost:3003
Ledger service:      http://localhost:3004
Wallet service:      http://localhost:3005
PostgreSQL:          localhost:5432
Redis:               localhost:6379
LocalStack:          http://localhost:4566
Mailhog UI:          http://localhost:8025
Mock SMS provider:   http://localhost:8091
Mock payment:        http://localhost:8092
Mock biller:         http://localhost:8093
Mock airtime:        http://localhost:8094
OpenSearch optional: http://localhost:9200
```

LocalStack resources:

```text
SQS queues:
- audit-events
- notification-jobs
- provider-callbacks
- reconciliation-jobs
- fraud-enrichment
- search-indexing

S3 buckets:
- wallet-kyc-documents-local
- wallet-reconciliation-reports-local
- wallet-audit-archive-local
- wallet-app-artifacts-local
```

Provider mocks are WireMock services. They expose deterministic local endpoints for funding, withdrawal, bill validation/payment, airtime products/purchase, SMS dispatch, status checks, and callback fixture payloads. Application services should point their local provider configuration at the mock URLs in `.env`.

Important local safety rule: mock provider success only simulates provider behavior. Wallet balances must still be produced through ledger postings and controlled projections. Do not add local shortcuts that directly mutate balances.

## Service Model

Client applications call the API edge, which routes requests to bounded services. Money movement is orchestrated by `transaction-service`, but accounting truth is owned by `ledger-service`.

```text
Client Apps
  -> API Gateway / ALB / WAF
  -> auth-service, user-service, kyc-service
  -> wallet-service, transaction-service
  -> fraud-service, limits-service, fee-service
  -> ledger-service
  -> payment-integration-service
  -> notification-service
  -> reconciliation-service, audit-service, admin-dashboard
```

The ledger must be the source of truth. Wallet balances are projections from posted ledger entries plus holds/reservations. Do not implement direct balance mutation as the financial record.

## Repo Areas

- `services/` contains independently owned deployable services.
- `packages/` contains shared internal libraries and contracts.
- `infrastructure/` contains Terraform and cloud infrastructure modules.
- `docs/` contains architecture, API, security, runbooks, incident, and compliance artifacts.
- `ci/` contains CI/CD definitions.
- `tests/` contains cross-service and system-level tests.
- `scripts/` contains local, database, seed, and operational scripts.
- `skills/` contains implementation playbooks that must be consulted before building features.

## Production Rules

- All write APIs must use idempotency keys.
- All financial records must be immutable or reversed with compensating entries.
- Provider callbacks must be verified, deduplicated, and reconciled.
- Secrets must live in a managed vault, never source code.
- PII must be encrypted, masked in logs, and access-controlled.
- Admin actions must be audited and sensitive actions must use maker-checker approval.
