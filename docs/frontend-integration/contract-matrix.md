# Frontend/backend integration contract matrix

**Scope:** `app/src/app`, `app/src/components/forms`, `app/src/lib/api`, and OpenAPI files under `docs/api`. This document records the current contract; it deliberately does not implement changes. `MFA` means required by policy/risk or admin role, even where the current OpenAPI omits an explicit field.

## Current frontend API functions

| Frontend route | Function/source | Method | Backend endpoint | Request/body | Response expected by frontend | Auth | MFA | PIN | Idempotency | Expected errors |
|---|---|---|---|---|---|---|---|---|---|---|
| `/login` | `LoginForm` (currently no API call) | POST | `/auth/login` | `{phoneOrEmail,password,device}` must map to `{phone_e164/email,password,device:{device_fingerprint,...}}` | Auth response/access or MFA challenge | No initial; session cookie after success | Conditional, backend returns 202 | No | No | 400/401/429 |
| `/register` | `RegisterForm` (currently no API call) | POST | `/auth/register` | `{fullName,email,phone,password}` must map to `first_name,last_name,email,phone_e164,password,country_code,device` | 201 registered/auth result | No | Possibly OTP/device verification | No | No | 400/409 |
| `/dashboard` | `getCurrentUser()` | GET | Gateway `/users/me` | None | `ApiResponse<User>`; gateway must return `data` | Yes | Existing session/MFA satisfied | No | No | 401/404 |
| `/dashboard` | `getWallet()` | GET | No exact gateway route; service has `/wallets/{id}` and `/wallets/{id}/balance` | None; frontend uses `/wallets/me` | `ApiResponse<Wallet>` | Yes | Existing session | No | No | 401/404 |
| `/dashboard`, `/transactions` | `getTransactions()` | GET | Gateway has no documented `/transactions` GET; transaction service has `/transactions` | Query pagination should be supported | `ApiResponse<Transaction[]>`; backend currently returns `{transactions:[...]}` | Yes | Existing session | No | No | 401/404 |
| `/send` | `TransferForm` (currently preparation only) | POST | `/transactions/transfers` | Frontend `{recipient,amount,narration,transactionPin}` must resolve wallet IDs and map to `{source_wallet_id,destination_wallet_id,amount_minor,currency,pin,channel}` | Transaction with state/reference | Yes | Risk step-up if required | Yes (`pin`, not `transactionPin`) | Required; key must persist for retry | 400/401/403/409/422/429/503 |
| `/fund` | `FundWalletForm` (currently preparation only) | POST | `/transactions/fund-wallet` | Frontend `{amount,method}` is missing wallet/provider fields required by implementation; use minor units and provider type | Pending transaction/provider attempt | Yes | Conditional for card/high risk | Backend policy; gateway currently may not require funding PIN | Required | 400/401/409/422/502/503 |
| `/withdraw` | `WithdrawForm` (currently preparation only) | POST | `/transactions/withdrawals` | `{bankCode,accountNumber,amount,transactionPin}` must map to backend schema/provider fields and minor units | Pending transaction | Yes | New beneficiary/high risk | Yes | Required | 400/401/403/409/422/429/502 |
| `/bills` | `BillsForm` (currently preparation only) | POST | `/transactions/bills` | `{biller,customerReference,amount,transactionPin}` must map to biller/provider fields and minor units | Pending transaction | Yes | Risk dependent | Yes | Required | 400/401/403/409/422/502 |
| `/airtime` | `AirtimeForm` (currently preparation only) | POST | `/transactions/airtime` | `{network,phone,amount,transactionPin}` must map to provider fields and minor units | Pending transaction | Yes | Risk dependent | Yes | Required | 400/401/403/409/422/502 |
| `/kyc` | `KycForm` (currently no API call) | POST + POST | `/kyc/profile`, then `/kyc/documents` | Profile requires `legal_name`; document requires encrypted S3 object reference, checksum, KMS key—not raw file | KYC profile/document status | Yes | MFA/step-up recommended for identity changes | No | Required for writes | 400/401/404/409 |
| `/kyc` | No frontend function | GET | `/kyc/status` | None | KYC status/document metadata | Yes | Existing session | No | No | 401/404 |
| `/notifications` | No frontend API function | GET | Gateway `/notifications` | None | Notification list | Yes | Existing session | No | No | 401/404 |
| `/security` | No frontend API function | POST | Auth `/auth/mfa/setup`, `/auth/mfa/verify`, `/auth/pin/setup`, `/auth/devices`, `/auth/logout` | Purpose-specific payloads; never log secrets | MFA/PIN/device/session response | Yes except challenge endpoints | MFA flow | PIN setup/verification | Not normally; use request IDs | 400/401/403/409/429 |
| `/admin` | `getAdminMetrics()` | GET | No `/admin/metrics` path in admin OpenAPI | None | `AdminMetric[]` | Admin bearer/session | Required | No | No | 401/403 |
| `/admin/fraud` | `getFraudCases()` | GET | Backend OpenAPI `/admin/fraud-cases`; frontend calls `/admin/fraud/cases` | None | `FraudCase[]` | Admin role | Required | No | No | 401/403/404 |
| `/admin/reconciliation` | `getReconciliationItems()` | GET | Backend `/admin/reconciliation-exceptions`; frontend calls `/admin/reconciliation/items` | None | `ReconciliationItem[]` | Finance role | Required | No | No | 401/403/404 |
| `/admin/audit` | `getAuditLogs()` | GET | Backend `/admin/audit-logs`; frontend calls `/admin/audit/logs` | Filters/pagination should be supported | `AuditLog[]` | Auditor/admin role | Required | No | No | 401/403/404 |
| `/admin/transactions` | `getTransactions()` | GET | Should use `/admin/transactions`, not customer `/transactions` | Filters/pagination | Admin transaction result | Admin role | Required | No | No | 401/403 |
| `/admin/users` | No frontend function | GET/POST | `/admin/users`, `/admin/actions` | Masked user query; sensitive actions include reason | Users/approval request | Admin role | Required | No | Action request key recommended | 401/403/409 |
| `/admin/kyc` | No frontend function | POST | `/admin/kyc/{profileId}/decision` or `/admin/actions` | Decision, tier, reason, reviewer ID | Decision/approval | Compliance role | Required | No | Required for mutation | 401/403/409 |

## Backend-only contracts relevant to integration

| Capability | Backend endpoint(s) | Frontend status |
|---|---|---|
| Fee quote | `POST /fees/quote` or `/fees/calculate` | No frontend API function; fee must be quoted before confirmation. |
| Limits | `POST /limits/evaluate`, `POST /limits/reservations`, commit/release, `GET /limits/remaining` | No frontend API function; transaction UI should display denial/pending states, not calculate limits locally. |
| Fraud | `POST /risk/evaluate`, `/risk/evaluate/{login,device,ip,velocity}` | No customer API function; frontend only displays backend review/block state. |
| Payment provider | `POST /payments/initiate`, verify/status, provider callbacks | Browser must never call provider integration directly. |
| Ledger | `/ledger/*` | Backend-only; frontend may use masked admin read endpoint only. |
| Reconciliation | `/reconciliation/runs*` | Admin/finance frontend currently points to nonexistent paths. |
| Audit | `/audit/events` | Admin frontend should use admin proxy; users must not query audit service directly. |

## Response-shape assumptions to resolve

The frontend `apiFetch` unwraps `payload.data`. Current service implementations generally return `{data: ...}`, but some list endpoints return nested objects such as `{transactions: [...]}` or `{events: [...]}`. Before implementation, choose one stable gateway contract and update TypeScript types accordingly. Amounts must be explicitly minor units; current mock formatting assumes minor units.
