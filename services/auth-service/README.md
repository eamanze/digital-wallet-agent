# Auth Service

## Purpose

Owns registration authentication, login, OTP, MFA, session management, refresh token rotation, device registration, suspicious login detection, and transaction PIN verification.

## Features

- Register user with secure password hash
- Login with device fingerprinting and suspicious-login MFA challenge
- Refresh token rotation with reuse detection
- Logout and session revocation
- OTP request and verification
- MFA setup and verification
- Transaction PIN setup and verification
- Redis-backed session and rate-limit state
- Audit logs for security actions

## Secret Handling

The service never logs passwords, OTPs, access tokens, refresh tokens, transaction PINs, or secrets. Passwords and transaction PINs are hashed independently. Refresh tokens are stored as hashes.

The implementation uses bcrypt-compatible hashing through the shared `hashSecret`/`verifySecret` boundary. Passwords, OTPs, and transaction PINs are hashed with separate purpose prefixes so hashes are not reusable across secret types.

## Local Run

Start local dependencies:

```sh
./scripts/local/start.sh
```

Install dependencies:

```sh
npm install
```

Run auth-service:

```sh
npm run start:auth
```

Defaults:

```text
PORT=3001
DATABASE_URL=postgresql://wallet:wallet_dev_password@localhost:5432/wallet_dev
REDIS_URL=redis://localhost:6379
JWT_ACCESS_SECRET=local-dev-access-secret-change-me
JWT_REFRESH_SECRET=local-dev-refresh-secret-change-me
```

Local secrets are development-only. Use AWS Secrets Manager or an equivalent vault in deployed environments.

## API Docs

OpenAPI: [docs/api/auth-service.openapi.yaml](../../docs/api/auth-service.openapi.yaml)

## What Should Not Go Inside

- User profile ownership beyond auth identifiers
- KYC decisions
- Ledger balances
- Provider payment integrations
