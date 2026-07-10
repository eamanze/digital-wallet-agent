# Payment Integration Service

## Purpose

Owns external integrations with banks, card processors, billers, airtime/data providers, provider callbacks, and provider status normalization.

## Owner

Payments integration team.

## What Should Go Inside

- Provider adapters
- Callback verification and deduplication
- Provider reference mapping
- Status polling
- Settlement report ingestion hooks
- Circuit breaker and timeout handling

## What Should Not Go Inside

- Ledger source-of-truth records
- Raw card storage
- Final business transaction ownership
- User profile ownership

## Provider boundary

The service exposes a provider-neutral interface for `wallet_funding`, `bank_withdrawal`, `bill_payment`, and `airtime`. Built-in deterministic adapters are `mock_funding`, `mock_bank`, `mock_biller`, and `mock_airtime`; production adapters implement `initiate`, `verify`, `normalize`, and `verifySignature`.

Endpoints:

- `POST /payments/initiate`
- `POST /payments/verify`
- `GET /providers/{provider}/status/{reference}`
- `POST /providers/{provider}/callbacks`

Initiation requires `Idempotency-Key`. Provider references and request hashes are stored in PostgreSQL. Failed calls use bounded exponential retry; repeated failures open a per-provider circuit breaker. Unknown and timeout outcomes remain provider states and do not post ledger entries. Transaction-service owns the final transaction and ledger decision.

Callbacks require `X-Provider-Signature`, an HMAC-SHA256 signature over the exact JSON body using `PROVIDER_WEBHOOK_SECRET`. Callback payloads are deduplicated. Raw card data, PINs, access tokens, and secrets must never be sent here.

Run with `npm run start:payments` (port `3010`).

The built-in providers are `mock_funding`, `mock_card`, `mock_bank`, `mock_biller`, and `mock_airtime`. They implement the production adapter interface and never move real money. Responses normalize to `pending`, `successful`, `failed`, `reversed`, `disputed`, or `unknown`.

Provider calls use bounded retries with exponential backoff and a per-provider circuit breaker. Timeouts and unknown outcomes remain provider states; this service never posts or reverses ledger entries. Transaction-service owns the final financial decision.
