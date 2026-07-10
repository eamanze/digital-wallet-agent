# Production Risks

## Purpose

This document records the main production risks for the Digital Wallet / Mobile Money architecture and the controls required before launch.

## Critical Risks

| Risk | Impact | Required Controls |
|---|---|---|
| Ledger not treated as source of truth | Incorrect balances, financial loss, unreproducible reports | Independent ledger-service, balanced journal constraints, immutable entries, reconciliation jobs. |
| Duplicate provider callback credits wallet twice | Direct financial loss | Callback dedupe, ledger idempotency key, provider reference uniqueness, reconciliation. |
| Provider timeout treated as failure | Customer funds incorrectly reversed or lost | Explicit pending/unknown states, status polling, reconciliation. |
| Direct admin mutation of transaction/ledger data | Fraud, audit failure, accounting corruption | Admin APIs only, maker-checker, audit events, no direct DB mutation. |
| Missing idempotency on write APIs | Duplicate users, duplicate transactions, duplicate provider calls | Required `Idempotency-Key`, request hash storage, duplicate response replay. |
| Sensitive PII leaked into logs/events/search | Regulatory and customer harm | Redaction, event payload policy, OpenSearch masking, security tests. |
| Redis used as source of truth | Data loss or inconsistent limits/balances | Redis restricted to ephemeral state; DB/audit persistence for decisions. |
| Reconciliation not implemented from day one | Provider/internal mismatches remain hidden | Provider report ingestion, exception workflows, suspense monitoring. |
| Fraud rules block legitimate users at scale | Customer impact and revenue loss | Dashboards, allow/challenge/manual-review/block outcomes, rule rollback process. |
| Provider integration lacks circuit breaker | Cascading failures | Timeout, retry, circuit breaker, provider health metrics, fallback policy. |

## Flow-Specific Risks

| Flow | Risk | Control |
|---|---|---|
| Registration and login | Credential stuffing, OTP abuse, SIM swap | WAF, rate limits, OTP TTL/retry/cooldown, MFA, device trust, audit events. |
| KYC verification | Fake identities, document leakage, provider spoofing | Encrypted S3, provider signature validation, manual review, PII masking. |
| Wallet funding | Crediting wallet before confirmed provider success | Ledger post only after verified provider success or approved settlement policy. |
| Wallet transfer | Overspending due to concurrency | Ledger transaction isolation, projection locks, idempotency, concurrent transfer tests. |
| Bank withdrawal | Debiting user while provider status is unknown | Holds/pending states, provider polling, stale hold alerts, reversal rules. |
| Bill payment | Provider says success but biller settlement missing | Settlement reconciliation and exception workflow. |
| Airtime purchase | Unknown response marked failed too early | Pending state and provider status polling. |
| Failed callback | Reversal of already completed valid transaction | Terminal-state checks and dispute workflow. |
| Duplicate callback | Double posting | Callback dedupe and ledger idempotency. |
| Reversal | Mutating original journal | Compensating entries only. |
| Fraud review | Insider abuse | RBAC, maker-checker, audit logs, reviewer separation. |
| Reconciliation | Silent manual adjustment | Approved adjustment journal and audit evidence. |

## Operational Risks

| Risk | Control |
|---|---|
| RDS outage | Multi-AZ, PITR, tested restore, degraded mode documentation. |
| Queue backlog | Queue age alerts, DLQs, autoscaling workers, redrive runbooks. |
| Audit write failure | Page on failure, retry queue, fallback durable buffer where feasible. |
| Secrets leakage | Secrets Manager, scanning, no secret Terraform outputs, rotation policy. |
| Bad deployment | Blue/green or canary, health checks, smoke tests, rollback plan. |
| Schema migration breaks services | Backward-compatible migrations, dry run, staging validation, rollback/forward-fix plan. |
| Search unavailable | Continue core flows; OpenSearch is not source of truth. |
| Notification provider down | Retry/fallback; do not reverse completed money movement. |

## Launch Readiness Gates

The platform is not production-ready until:

- Ledger invariant tests pass.
- All write APIs enforce idempotency.
- Provider callbacks are signature-verified and deduplicated.
- Reconciliation jobs exist for every external provider.
- Audit events exist for login, KYC, money movement, admin actions, callbacks, reversals, and config changes.
- Sensitive data redaction is tested.
- Core dashboards and page alerts exist.
- Disaster recovery and restore tests have been run.
- Admin maker-checker is implemented for sensitive actions.
- Incident runbooks exist for ledger imbalance, callback processing failure, stuck pending transactions, provider outage, reconciliation mismatch, and audit write failure.

