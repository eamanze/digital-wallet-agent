# Production-readiness action plan

## Phase 0 — stop-the-line (before any production money)

1. Fix PR-001 Terraform syntax and make clean-checkout plan artifacts reproducible.
2. Close PR-002 internal ledger authorization and PR-011 TLS/service identity.
3. Add staging ALB/ECS health, autoscaling and WAF association (PR-005/006).
4. Wire Secrets Manager injection and production fail-closed configuration (PR-007).

## Phase 1 — prove financial correctness

1. Build database-backed E2E and concurrency suites (PR-003).
2. Exercise provider signature/replay/status verification (PR-010).
3. Provision scheduled reconciliation and settlement jobs (PR-009).
4. Run fraud, limit, fee, failed-provider, reversal and notification-failure scenarios.

## Phase 2 — prove operations and recovery

1. Run RDS PITR/snapshot, S3 restore, secret recovery and Terraform rebuild drills (PR-004/015).
2. Fire every critical CloudWatch alarm and validate paging/runbook ownership (PR-013).
3. Run peak load, Redis failover, queue backlog, provider outage and rollback tests (PR-012/014).
4. Set budgets, anomaly alarms and cleanup ownership (PR-016).

## Phase 3 — release governance

1. Complete ADR/diagram and API/event contract review (PR-017).
2. Obtain security, finance, compliance and operations sign-off.
3. Deploy canary to staging, run smoke/reconciliation checks, then require production approval.
4. Maintain a release evidence bundle: commit, image digest, Terraform plan, migrations, test reports, security scans, rollback revision, dashboards, and approvals.

## Suggested owners and deadlines

| Workstream | Owner | Target |
|---|---|---|
| Terraform/network/ECS | Platform | before staging sign-off |
| Ledger/auth boundary | Backend + security | before any production credentials |
| E2E/concurrency/chaos | QA + backend | before pilot |
| Reconciliation/DR | Finance ops + SRE | before pilot and quarterly thereafter |
| Admin controls | Security/compliance | before admin access |
| Cost/observability | SRE/FinOps | before production budget approval |
