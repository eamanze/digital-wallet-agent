# API Gateway

The API gateway is the public edge for mobile and web clients. It exposes `/api/v1` routes, forwards requests to bounded internal services, generates/propagates `X-Request-ID` and `X-Correlation-ID`, validates bearer tokens, requires idempotency keys for money operations, requires transaction PINs for transfers/withdrawals/bills/airtime, applies rate limiting, and normalizes upstream failures.

Only public route groups are routed: `auth`, `users`, `kyc`, `wallets`, `transactions`, `payments`, `bills`, `airtime`, and `notifications`. Internal service URLs are never returned to clients. Request logs contain route and correlation metadata only; bodies, tokens, PINs, and PII are not logged.

The local limiter is an in-memory safety net. Production deployments should place AWS WAF/API Gateway rate limits at the edge and use a distributed Redis limiter for multi-instance gateway deployments. Run with `npm run start:gateway` (port `8080`). OpenAPI is available at `/openapi.json` and in `docs/api/api-gateway.openapi.yaml`.
