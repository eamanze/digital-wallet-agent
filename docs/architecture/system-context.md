# System Context

## Purpose

This document defines the production system context for the Digital Wallet / Mobile Money platform. The platform supports user onboarding, authentication, KYC, wallet funding, wallet-to-wallet transfer, bank withdrawal, bill payment, airtime purchase, transaction history, notifications, admin operations, reconciliation, audit, fraud controls, limits, and fees.

The ledger is the source of truth. Wallet balances are derived from posted ledger entries and holds/reservations, never from blind balance updates.

## External Actors

| Actor | Interaction |
|---|---|
| Customer | Registers, logs in, completes KYC, funds wallet, transfers, withdraws, pays bills, buys airtime, views history. |
| Admin user | Supports customers, reviews fraud/KYC cases, handles reconciliation exceptions, requests reversals, manages configs through maker-checker. |
| KYC provider | Verifies identity data and documents, returns callbacks or status responses. |
| Bank/card processor | Accepts funding and withdrawal requests, sends callbacks and settlement reports. |
| Biller provider | Validates and fulfills bill payments, sends status/callback data and settlement files. |
| Airtime/data provider | Fulfills airtime/data purchases and provides status/callback data. |
| Notification providers | Send SMS, email, and push notifications. |
| Finance/compliance teams | Consume reports, audit trails, settlement exports, and exception queues. |

## System Boundary

```text
Mobile App / Web App / Admin Browser
        |
CloudFront where useful
        |
AWS WAF
        |
API Gateway / ALB
        |
Internal Services
        |
AWS Data, Queue, Search, Object Storage, and Observability Components
        |
External Providers
```

## Core Internal Services

| Service | Context |
|---|---|
| auth-service | Authentication, OTP, MFA, sessions, transaction PIN verification, device trust. |
| user-service | User profile, account status, device metadata, beneficiaries, preferences. |
| kyc-service | KYC profile, document metadata, provider verification attempts, KYC status and tier. |
| wallet-service | Wallet lifecycle, wallet status, available-balance view, holds/reservations. |
| ledger-service | Chart of accounts, immutable journals, ledger entries, reversals, ledger projections. |
| transaction-service | Money movement orchestration and transaction state machine. |
| fraud-service | Risk scoring, suspicious activity rules, velocity checks, manual review recommendations. |
| limits-service | KYC-tier, channel, transaction type, daily/monthly, and risk-based limits. |
| fee-service | Fees, commissions, waivers, caps, taxes, revenue account mapping. |
| payment-integration-service | Bank, card, biller, airtime providers, callbacks, provider status normalization. |
| notification-service | SMS, email, push templates, dispatch, delivery tracking. |
| reconciliation-service | Provider report ingestion, internal/external matching, settlement exceptions, finance exports. |
| audit-service | Immutable or tamper-evident audit events and compliance search projections. |
| admin-dashboard | Operations UI for support, fraud, finance, compliance, and security teams. |

## Trust Boundaries

| Boundary | Controls |
|---|---|
| Client to edge | TLS, WAF, rate limits, request size limits, token validation, device signals. |
| Edge to services | TLS, service identity, least-privilege routing, structured request IDs. |
| Services to data stores | Private subnets, security groups, IAM, KMS, DB credentials from Secrets Manager. |
| Services to providers | Request signing, timeouts, retries, circuit breakers, callback signature validation. |
| Admin access | MFA, RBAC, maker-checker, audit logging, IP allowlist or zero-trust controls. |
| Audit and ledger | Append-only records, strict authorization, immutable or tamper-evident storage. |

## Source of Truth

| Data | Source of Truth |
|---|---|
| Authentication secrets and sessions | auth-service database plus Redis for ephemeral state. |
| User profile and status | user-service database. |
| KYC status and tier | kyc-service database. |
| Wallet metadata and holds | wallet-service database. |
| Financial balances | ledger-service ledger entries and balance projections. |
| Transaction workflow status | transaction-service database. |
| Provider references and normalized statuses | payment-integration-service database. |
| Reconciliation exceptions | reconciliation-service database. |
| Audit trail | audit-service immutable store. |
| Search | OpenSearch projections only, not source of truth. |

## Required Traceability

Every financial flow must preserve this chain:

```text
request_id
  -> correlation_id
  -> idempotency_key
  -> transaction_id
  -> transaction_reference
  -> ledger_journal_reference
  -> provider_reference where applicable
  -> settlement_batch_id where applicable
  -> reconciliation_result
  -> audit_event_ids
```

