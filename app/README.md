# Digital Wallet Frontend

Production-ready frontend scaffold for a Digital Wallet / Mobile Money platform.

This frontend is designed for customer wallet users and internal operations teams. It supports wallet onboarding, secure login, KYC, wallet funding, transfers, withdrawals, bill payment, airtime purchase, transaction history, notifications, security settings, and admin operations.

## Stack

- Next.js App Router
- React
- TypeScript
- Server Components by default
- Client Components only for interactive forms
- CSS design system with responsive layouts
- HTTP-only cookie session model through Backend-for-Frontend/API Gateway
- Typed API client
- Docker-ready deployment
- GitHub Actions CI
- Vitest unit tests
- Playwright E2E test scaffold

## Production security principles

This app is designed for fintech-style controls:

- No access tokens, refresh tokens, OTPs, PINs, or secrets are stored in localStorage/sessionStorage.
- API calls use `credentials: "include"` to support HTTP-only secure cookies from the BFF/API Gateway.
- Money operations require an `Idempotency-Key` header.
- Transaction PIN is collected only for money movement and is never logged.
- Sensitive values are masked in UI and logs.
- Security headers are configured in `next.config.mjs`.
- Admin routes are separated from customer wallet routes.

## Folder structure

```text
src/
  app/                  Next.js routes
  components/           UI, wallet, admin, and form components
  lib/                  API client, formatting, validators, mocks, telemetry helpers
  types/                Shared frontend TypeScript contracts
docs/                   Frontend architecture and production notes
tests/                  Unit and E2E test scaffolds
.github/workflows/      CI pipeline
```

## Local setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open:

```text
http://localhost:3000
```

## Environment variables

```bash
NEXT_PUBLIC_APP_NAME="MobiMoney"
NEXT_PUBLIC_API_BASE_URL="http://localhost:8080"
NEXT_PUBLIC_ENABLE_MOCKS="true"
NEXT_PUBLIC_SUPPORT_EMAIL="support@example.com"
```

Use mocks only for local demos and portfolio walkthroughs. In staging/prod, point `NEXT_PUBLIC_API_BASE_URL` to the deployed API Gateway/BFF and set mocks to false.

## Scripts

```bash
npm run dev
npm run build
npm run start
npm run lint
npm run typecheck
npm run test
npm run test:e2e
```

## Main routes

Customer:

```text
/login
/register
/dashboard
/send
/fund
/withdraw
/bills
/airtime
/transactions
/kyc
/security
/notifications
```

Admin:

```text
/admin
/admin/users
/admin/transactions
/admin/kyc
/admin/fraud
/admin/reconciliation
/admin/audit
```

## Backend integration expectation

The backend should expose an API Gateway/BFF with these groups:

```text
/auth
/users
/kyc
/wallets
/transactions
/payments
/bills
/airtime
/notifications
/admin
```

Money movement requests must require an idempotency key and transaction PIN where appropriate.

## Docker

```bash
docker build -t digital-wallet-frontend .
docker run -p 3000:3000 --env-file .env.local digital-wallet-frontend
```

## Production readiness checklist

Before go-live:

- Replace mock mode with real API Gateway/BFF.
- Verify CSP domains for analytics, images, and API endpoints.
- Enforce secure, HTTP-only, SameSite cookies from the BFF.
- Run accessibility checks.
- Run Playwright journeys against staging.
- Confirm no secrets are exposed in client environment variables.
- Confirm WAF, rate limiting, and fraud controls are active at API layer.
- Confirm admin MFA and RBAC are enforced by backend.
