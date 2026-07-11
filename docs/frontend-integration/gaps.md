# Frontend/backend integration gaps

No implementation changes were made for this review.

| ID | Severity | Affected route/service | Gap and production risk | Required resolution / acceptance criteria |
|---|---|---|---|---|
| FE-001 | Critical | All protected routes / auth | `getSessionStatus()` always returns `authenticated`; unauthenticated users could see protected UI. | Implement BFF session validation, anonymous/MFA states, expiry handling and route redirects. Tests prove anonymous users cannot access wallet/admin routes. |
| FE-002 | Critical | All money forms / transaction-service | Transfer, funding, withdrawal, bill and airtime forms only show “prepared”; they do not submit transactions. | Implement real calls with validated minor-unit payloads, stable idempotency key per intent, PIN handling and pending/error states. E2E tests prove one ledger effect. |
| FE-003 | Critical | `/login`, `/register` / auth-service | Login/register forms use `setTimeout` redirects and never call auth APIs. | Integrate login/register, device fingerprint, MFA/OTP challenges, secure cookie session and normalized errors. |
| FE-004 | High | `/send` / transaction-service | Frontend uses `recipient`, `transactionPin`, major-unit amount; backend requires wallet UUIDs, `pin`, `amount_minor`, currency. | Resolve recipient to wallet ID and map exact schema; never expose or log PIN. Contract test passes. |
| FE-005 | High | `/fund`, `/withdraw`, `/bills`, `/airtime` | Frontend request schemas are not defined in gateway OpenAPI and provider fields are incomplete. | Define gateway request/response schemas and implement typed clients; contract tests cover every money operation. |
| FE-006 | High | `/dashboard` / wallet-service | Frontend calls `/wallets/me`; documented backend exposes `/wallets/{id}` and `/wallets/{id}/balance`. | Add BFF `/wallets/me` or fetch authenticated wallet ID then call correct endpoint; verify ledger-backed balance. |
| FE-007 | High | `/transactions` / transaction-service | Frontend expects `Transaction[]`, backend implementation returns `{transactions: [...]}` and OpenAPI lacks pagination schema. | Standardize `{data:{items,page,pageSize,total}}` or update client/types; add pagination and authorization tests. |
| FE-008 | High | Admin fraud/reconciliation/audit | Frontend paths `/admin/fraud/cases`, `/admin/reconciliation/items`, `/admin/audit/logs` do not match `/admin/fraud-cases`, `/admin/reconciliation-exceptions`, `/admin/audit-logs`. | Route through exact admin BFF contracts; add 401/403 tests and masked data assertions. |
| FE-009 | High | Admin dashboard | `/admin/metrics` is not in admin OpenAPI; users/KYC pages are hardcoded placeholders. | Add documented metrics endpoint or remove call; implement real admin APIs with MFA/RBAC/maker-checker and audit evidence. |
| FE-010 | High | `/kyc` / kyc-service | Frontend sends raw ID/file form concept; backend requires encrypted object-storage reference, checksum and KMS key. | Upload through pre-signed private S3 flow, submit only metadata, mask identity number, and test upload failure/retry. |
| FE-011 | High | `/security` / auth-service | No API functions for MFA, OTP, PIN, devices or logout. | Add typed security client and UI flows; enforce backend MFA/PIN throttles and never persist secrets. |
| FE-012 | High | Admin routes | Admin layout/navigation has no visible session/RBAC enforcement; customer shell links to `/admin`. | Add server-side/admin BFF authorization and frontend role-aware navigation; backend remains authoritative. |
| FE-013 | Medium | All API calls | `apiFetch` creates a new correlation ID but does not copy `X-Request-ID` from response or normalize backend `{error:{...}}` consistently. | Preserve request/correlation IDs in errors and support support-reference display without exposing internals. |
| FE-014 | Medium | Mock mode | `env.enableMocks` defaults to true unless explicitly set to false, risking mock data in staging. | Make mocks opt-in (`=== "true"`), fail production build without API URL, and add environment tests. |
| FE-015 | Medium | Errors | `error.tsx` renders `error.message`, potentially exposing internal provider/database details. | Show generic production message plus correlation ID; log sanitized details server-side only. |
| FE-016 | Medium | Build | `app/src/app/admin/users/page.tsx` and `admin/kyc/page.tsx` contain `style={height:18}`, which is invalid JSX/TypeScript. | Change to `style={{height:18}}`; `npm run typecheck`, lint and build must pass. |
| FE-017 | Medium | Fees/limits/fraud | No frontend quote/remaining-limit/risk-state functions exist; confirmation UI cannot explain fee or review outcome. | Add read-only typed quote/limit/status calls through BFF; frontend must not duplicate authoritative calculations. |
| FE-018 | Medium | Notifications | Notification page has no API function despite gateway `/notifications`. | Implement authenticated list/status/preferences calls and safe retry handling. |
| FE-019 | Low | API documentation | Gateway OpenAPI is too thin for request/response/error schemas and omits several transaction GET/detail routes. | Expand OpenAPI schemas and generate/validate client types from the contract. |
| FE-020 | Low | Test coverage | Existing tests cover formatters and a scaffolded auth/dashboard journey, not real authenticated money flows. | Add MSW/contract tests plus Playwright journeys for MFA, KYC, transfer, duplicate submit, provider pending/failure, admin approval and logout. |

## Priority order

1. FE-001–FE-003: authentication and actual write operations.
2. FE-004–FE-012: exact API contracts, KYC security, and admin authorization.
3. FE-013–FE-018: observability, production configuration, errors, and missing capabilities.
4. FE-019–FE-020: contract generation and expanded test evidence.
