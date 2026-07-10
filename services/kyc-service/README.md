# KYC Service

## Purpose

Owns customer identity verification, KYC profile state, encrypted document references, provider verification attempts, manual decisions, rejection reasons, and KYC tier updates.

## Features

- Submit or resubmit KYC profile
- Upload KYC document metadata
- Store S3/object storage references only
- Request mock provider verification
- Apply manual admin decisions
- Approve KYC and update tier
- Reject KYC with reason
- Publish `kyc.submitted`, `kyc.approved`, `kyc.rejected`, and `kyc.tier_changed`
- Audit user and admin KYC actions

## KYC Tiers

```text
tier_0: registered but not verified
tier_1: phone/email verified, low transaction limit
tier_2: ID verified, medium transaction limit
tier_3: full KYC, higher transaction limit
```

## Document Security

Documents are never stored directly in PostgreSQL. The service stores:

- S3 bucket
- S3 object key
- checksum
- KMS key ID
- access policy
- encryption status

Raw KYC files must live in private, KMS-encrypted object storage. Logs and events must not contain full identity numbers or raw document data.

## Local Run

Start local dependencies:

```sh
./scripts/local/start.sh
```

Install dependencies:

```sh
npm install
```

Run kyc-service:

```sh
npm run start:kyc
```

Defaults:

```text
PORT=3003
DATABASE_URL=postgresql://wallet:wallet_dev_password@localhost:5432/wallet_dev
```

## API Docs

OpenAPI: [docs/api/kyc-service.openapi.yaml](../../docs/api/kyc-service.openapi.yaml)

## What Should Not Go Inside

- Password, OTP, or transaction PIN logic
- Raw document files in the database
- Wallet balances
- Direct ledger posting

