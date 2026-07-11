# Frontend Architecture

The frontend is split into customer wallet routes and admin operations routes.

## Customer routes

Customer routes focus on registration, login, KYC, wallet overview, money movement, payments, transaction history, notifications and security settings.

## Admin routes

Admin routes focus on operations monitoring, KYC review, fraud cases, reconciliation exceptions and audit logs. The frontend assumes backend-enforced RBAC, MFA and maker-checker controls.

## Rendering model

Use Server Components for read-heavy pages and Client Components only for forms or interactive flows. This reduces client-side JavaScript and improves security posture.

## API model

The frontend talks to a BFF/API Gateway. It should not call internal microservices directly.

Expected backend groups:

- `/auth`
- `/users`
- `/kyc`
- `/wallets`
- `/transactions`
- `/payments`
- `/bills`
- `/airtime`
- `/notifications`
- `/admin`

## Money movement

Money movement screens must pass an `Idempotency-Key` header to the BFF/API Gateway. The backend must verify transaction PIN, limits, fraud rules and KYC tier before creating any ledger transaction.
