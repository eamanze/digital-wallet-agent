# Fraud Service

## Purpose

Owns risk scoring, fraud rules, velocity analysis, device/IP risk signals, suspicious activity decisions, and manual review recommendations.

## Owner

Risk and fraud team.

## What Should Go Inside

- Fraud evaluation APIs
- Risk rules and reason codes
- Manual review creation
- Fraud metrics and events
- Safe persistence of fraud evidence

## What Should Not Go Inside

- Final ledger posting
- KYC document storage
- Fee calculation ownership
- Direct account balance mutation

## API and behavior

`POST /risk/evaluate` evaluates transaction, login, device, IP, or velocity context. Specialized routes are available under `/risk/evaluate/{login|device|ip|velocity}`. Every write requires a bearer token and `Idempotency-Key`.

Decisions are deterministic and return `allow`, `challenge`, `manual_review`, `block`, or `restrict_account`, with a 0–100 risk score and reason codes. Blocked and manual-review decisions create durable fraud cases. The service never posts ledger entries or changes balances.

`GET /risk/cases` and `GET /risk/cases/{reference}` expose review cases. Transaction-service must call fraud-service before executing risky transactions and must stop execution for `block` or `manual_review` decisions.

Fraud decisions are persisted, audit-hashed, and emitted through the outbox as `fraud.case_created` and `fraud.transaction_blocked`. Do not place PINs, passwords, access tokens, raw IP addresses, or KYC documents in evaluation payloads or metadata.

Run with `npm run start:fraud` (port `3008`).
