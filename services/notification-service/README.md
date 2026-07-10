# Notification Service

## Purpose

Owns SMS, email, push notification templates, dispatch, provider failover, and delivery tracking.

## Owner

Customer communications team.

## What Should Go Inside

- Notification templates
- Dispatch workers
- Provider adapters
- Delivery status tracking
- Retry and fallback handling

## What Should Not Go Inside

- OTP generation ownership unless delegated by auth contract
- Money movement decisions
- Ledger records
- KYC document storage

## API and delivery behavior

The service consumes supported event envelopes at `POST /events`, renders a safe template, checks notification preferences, and creates one durable notification job per enabled channel. Supported events include registration, OTP requests, KYC decisions, wallet creation, transaction outcomes, withdrawal outcomes, fraud cases, and account suspension.

Email, SMS, and push use provider interfaces. Local mock providers return deterministic message IDs; production providers can be injected without changing templates or event handling. Delivery failures are retried with a bounded attempt count and then written to `notifications.dead_letter_jobs`. Notification failure never changes transaction or ledger state.

`GET/PATCH /preferences` controls channel and security/transaction preferences. `GET /notifications` and `GET /notifications/{id}` expose status. Sensitive values are never placed in templates or logs: identifiers are masked, and OTPs, PINs, access tokens, and secrets are not rendered.

Run with `npm run start:notifications` (port `3011`).
