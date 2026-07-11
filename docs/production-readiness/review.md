# Production-readiness review

**Review basis:** AGENT.md, all `skills/*.md`, service source/tests, database migrations, Terraform, CI/CD workflows, observability/security/operations docs, runbooks, and demo scripts. This is a repository review, not evidence of a deployed AWS environment or completed restore/chaos exercise.

## Executive decision

**Status: NO-GO for production money movement.** The repository has a credible bounded-service design and unusually broad operational documentation, but Terraform currently contains parser-invalid one-line blocks and the deployed edge/authorization topology is not yet proven. Production approval should wait for the critical/high gaps in [gaps.md](gaps.md) to be closed with evidence.

## Capability assessment

| Area | Assessment | Evidence/remaining concern |
|---|---|---|
| Architecture/boundaries | Partial / amber | 15 service boundaries and API docs exist; deployment and service-to-service contracts are not fully enforced. |
| Ledger correctness | Strong code baseline / amber | Double-entry validation, idempotency, reversals and tests exist; ledger HTTP endpoints lack a demonstrated internal auth boundary. |
| Idempotency/state | Partial / amber | Transaction state machine and callback dedupe exist; end-to-end crash/concurrency evidence and all callback signature paths need deployment proof. |
| Fraud/limits/fees | Partial / amber | Rules, reservations, fee determinism and tests exist; Redis-backed distributed enforcement and policy operations need production verification. |
| Reconciliation | Partial / amber | Matching, reports and exceptions exist; scheduled jobs, ownership/SLA and settlement evidence are not shown. |
| Security | Partial / amber | MFA/PIN/hash/redaction/WAF/IAM docs and scans exist; TLS, Secrets Manager injection, key rotation and admin MFA need runtime proof. |
| CI/CD | Partial / amber | GitHub/Jenkins workflows include tests/scans/approvals; Terraform cannot currently pass parsing/format validation. |
| Infrastructure | **Red** | Terraform syntax is invalid in environment/module files; ECS lacks visible ALB target groups, health checks and autoscaling resources. |
| Observability | Partial / amber | JSON logging, traces, metrics, dashboards/alarms and SLO docs exist; alert delivery and useful production dashboards are unverified. |
| Testing | Partial / amber | Unit/service tests are broad; required E2E, load, chaos, security-abuse and restore runs are not evidenced as executed. |
| Runbooks/operations | Strong documentation / amber execution | 18 runbooks, incident simulations, backup/DR/cost docs exist; drills and RCAs need records. |
| HA/backup/DR | Partial / amber | Multi-AZ intent, encrypted backups and recovery procedures are documented; cross-region recovery, restore tests and DNS failover are not proven. |
| Cost controls | Partial / amber | Tags, lifecycle policies and billing alarm support exist; budget values, owners and actual monthly reports are absent. |
| Documentation/interview readiness | Strong / amber | APIs, architecture, security, demo and interview walkthrough exist; architecture ADR/sequence completeness and live evidence should be added. |

## Positive controls already present

- Ledger service validates balanced entries and supports compensating reversals.
- Transaction service calls wallet, PIN, limits, fee, fraud and ledger clients with idempotency keys.
- Provider integration normalizes status, retries with circuit breaking, verifies callbacks and stores references.
- Audit service redacts sensitive fields and maintains a hash chain.
- S3 public access blocks, KMS encryption, private RDS, Redis encryption, WAF rules, dependency/container/secret/IaC scans are represented.
- Tests cover duplicate callbacks, duplicate posting, balancing, fee/limit/fraud rules, state transitions, reconciliation matching and RBAC basics.
