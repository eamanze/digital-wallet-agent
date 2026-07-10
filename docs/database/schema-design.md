# Database Schema Design

## Purpose

This document defines the production PostgreSQL schema design for the Digital Wallet / Mobile Money platform. The design follows service ownership boundaries and keeps the double-entry ledger as the source of truth for financial balances.

## Database Ownership Model

Use separate PostgreSQL schemas at minimum. Mature production can split these into separate databases or clusters, especially for `ledger` and `audit`.

| Schema | Owner | Purpose |
|---|---|---|
| `platform` | Platform engineering | Shared idempotency records and common infrastructure tables. |
| `identity` | user-service | Users, profiles, devices. |
| `auth` | auth-service | Sessions and auth lifecycle records. |
| `kyc` | kyc-service | KYC profiles and encrypted document metadata. |
| `wallet` | wallet-service | Wallet metadata and balance projections derived from ledger. |
| `ledger` | ledger-service | Accounts, ledger transactions, immutable ledger entries. |
| `transactions` | transaction-service and payment-integration-service | Transaction requests, provider attempts, provider callback dedupe. |
| `risk` | limits-service, fee-service, fraud-service | Limits, fee rules, fraud rules, fraud cases. |
| `notifications` | notification-service | Notification jobs and delivery status. |
| `reconciliation` | reconciliation-service | Reconciliation batches and matched/mismatched items. |
| `audit` | audit-service | Immutable audit logs. |
| `admin` | admin-dashboard | Admin users and admin actions. |

Services should access their owned schema directly. Cross-service behavior must use APIs, events, or documented reporting projections.

## Required Tables

| Table | Schema | Owner |
|---|---|---|
| `users` | `identity` | user-service |
| `user_profiles` | `identity` | user-service |
| `user_devices` | `identity` | user-service |
| `auth_sessions` | `auth` | auth-service |
| `kyc_profiles` | `kyc` | kyc-service |
| `kyc_documents` | `kyc` | kyc-service |
| `wallets` | `wallet` | wallet-service |
| `ledger_accounts` | `ledger` | ledger-service |
| `ledger_transactions` | `ledger` | ledger-service |
| `ledger_entries` | `ledger` | ledger-service |
| `wallet_balance_projections` | `wallet` | wallet-service from ledger events |
| `transaction_requests` | `transactions` | transaction-service |
| `payment_provider_requests` | `transactions` | payment-integration-service |
| `idempotency_keys` | `platform` | platform/common |
| `limits` | `risk` | limits-service |
| `fees` | `risk` | fee-service |
| `fraud_rules` | `risk` | fraud-service |
| `fraud_cases` | `risk` | fraud-service |
| `notifications` | `notifications` | notification-service |
| `reconciliation_batches` | `reconciliation` | reconciliation-service |
| `reconciliation_items` | `reconciliation` | reconciliation-service |
| `audit_logs` | `audit` | audit-service |
| `admin_users` | `admin` | admin-dashboard |
| `admin_actions` | `admin` | admin-dashboard |

## Money Storage

All monetary values use integer minor units:

```text
amount_minor BIGINT
currency CHAR(3)
```

Do not use floating-point types for money. Do not infer currency from country, phone number, wallet owner, or provider.

## Identity and Auth

`identity.users` stores the platform account state and safe contact metadata. Password hashes, transaction PIN hashes, OTP state, and refresh token state belong to auth-service tables, not user-service tables.

`identity.user_profiles` stores customer profile fields and only encrypted/tokenized sensitive identity values. Full BVN, NIN, national ID numbers, card data, OTPs, passwords, PINs, and full access tokens must never be stored in plaintext.

`auth.auth_sessions` stores session lifecycle metadata and refresh token hashes, not raw tokens.

## KYC

`kyc.kyc_profiles` stores KYC status, tier, risk status, and encrypted/tokenized identity references.

`kyc.kyc_documents` stores metadata only. Raw files must be stored in private KMS-encrypted S3. Object keys must avoid meaningful public filenames or identity numbers.

## Wallets and Balances

`wallet.wallets` stores wallet metadata and status.

`wallet.wallet_balance_projections` is a controlled projection of ledger state and holds. It is not the accounting source of truth. It may be updated only by ledger projection workers or ledger-service controlled transactions.

Balances must be explainable from:

```text
ledger.ledger_entries
wallet.wallet_balance_projections
hold/reservation records when implemented
```

## Transactions and Providers

`transactions.transaction_requests` stores the business transaction state machine. It tracks user intent, state transitions, idempotency, provider references, ledger references, and audit traceability.

`transactions.payment_provider_requests` stores outbound provider attempts and callback/status normalization. Provider callbacks are deduplicated by provider, provider callback ID, provider reference, and payload hash.

## Risk Configuration

`risk.limits`, `risk.fees`, and `risk.fraud_rules` are effective-dated configuration tables. Changes must be admin-approved and audited.

`risk.fraud_cases` stores manual review and fraud investigation workflow records.

## Notifications

`notifications.notifications` stores notification jobs and delivery state. Notification failure must not roll back completed financial transactions.

## Reconciliation

`reconciliation.reconciliation_batches` stores imported settlement/provider file metadata and run state.

`reconciliation.reconciliation_items` stores match results, exceptions, evidence, and resolution metadata. Manual adjustments must create approved ledger transactions and audit logs.

## Audit and Admin

`audit.audit_logs` is append-only by policy and trigger. It stores actor, action, resource, result, reason, correlation ID, and tamper-evidence hash fields.

`admin.admin_actions` stores admin workflow actions and maker-checker decisions. Sensitive actions must not bypass service APIs or ledger reversal rules.

## Migration Rules

- Migrations are versioned under `infrastructure/db/migrations`.
- Migrations must be repeatable across dev, staging, and production.
- Destructive changes require an approved maintenance plan.
- Ledger constraint changes are high risk and require staging load tests.
- Production migrations must be backward-compatible unless an approved maintenance window exists.

