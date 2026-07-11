# Go-live checklist

Go live only when every critical/high item in `gaps.md` is closed and evidence is linked.

## Architecture and application

- [ ] Service owners, API contracts, event schemas, ADRs and sequence diagrams approved.
- [ ] Transaction states, idempotency keys, provider references and correlation IDs are traceable end to end.
- [ ] Ledger balance invariant, currency checks, reversals and duplicate posting tests pass.
- [ ] Limits, fees, fraud review/block and suspended/frozen-wallet behavior pass E2E tests.

## Security and compliance

- [ ] Production uses Secrets Manager/KMS; no defaults or secrets in logs/images/state.
- [ ] TLS/mTLS or signed service authentication is enforced; DB/Redis/S3 are private.
- [ ] MFA, RBAC, maker-checker, PII masking, audit immutability and retention are approved.
- [ ] SAST, dependency, secret, container, IaC, API authorization and abuse scans pass.

## Infrastructure and delivery

- [ ] Terraform fmt/validate/plan passes for dev, staging and prod from clean checkout.
- [ ] ALB/WAF, private subnets, SGs, ECS health checks, two-task minimum and autoscaling verified.
- [ ] RDS Multi-AZ/deletion protection/backups and Redis HA settings match environment policy.
- [ ] CI image digest promotion, migration gate, smoke tests, approval and rollback are tested.

## Operations and recovery

- [ ] CloudWatch dashboards/alarms page named owners and link to runbooks.
- [ ] Queue retries/DLQs, provider timeout handling and scheduled reconciliation are active.
- [ ] RDS PITR/snapshot, S3 version, secret recovery, Terraform rebuild and DNS/traffic-shift drills meet RTO/RPO.
- [ ] Incident commander, customer communication, RCA and escalation contacts are current.

## Financial and business sign-off

- [ ] Finance validates settlement, suspense, fee and daily reconciliation reports.
- [ ] Compliance approves KYC/PII/retention and admin access review.
- [ ] FinOps approves budgets, tags, sizing and cleanup schedule.
- [ ] Product approves customer messaging and pilot limits.
- [ ] Final go/no-go decision is recorded with rollback revision and evidence bundle.
