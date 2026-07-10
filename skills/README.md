# Skills Folder — Digital Wallet / Mobile Money Platform

Use these skills as focused implementation playbooks. Before starting any task, open the main `AGENT.md`, then open the skill file that matches the task.

Recommended usage pattern:

```text
1. Read AGENT.md.
2. Read the relevant skill file.
3. Implement the feature or infrastructure.
4. Add tests, observability, security checks, and runbooks.
5. Validate against acceptance criteria.
```

Skill index:

1. `01-domain-architecture.md` — product domain, service boundaries, diagrams, API/event design.
2. `02-cloud-infrastructure.md` — AWS, Terraform, ECS/EKS, networking, RDS, Redis, queues, S3, OpenSearch.
3. `03-security-compliance.md` — MFA, PIN, secrets, encryption, IAM, audit, PII, PCI/tokenization assumptions.
4. `04-auth-user-kyc.md` — registration, login, OTP, device trust, KYC tiering, identity verification.
5. `05-wallet-ledger.md` — double-entry ledger, wallet balances, holds, reversals, accounting safety.
6. `06-transactions-payments.md` — transfer, funding, withdrawal, bills, airtime, provider integrations.
7. `07-fraud-limits-fees.md` — fraud rules, velocity checks, limits, fees, risk decisions.
8. `08-data-messaging.md` — databases, events, queues, cache, object storage, search.
9. `09-observability-sre.md` — logs, metrics, traces, dashboards, alerts, incidents, RCAs.
10. `10-ci-cd-release.md` — Jenkins/GitHub Actions, scanning, Terraform, deployment, rollback.
11. `11-testing-quality.md` — unit, integration, contract, E2E, load, security, chaos tests.
12. `12-admin-audit-reconciliation.md` — admin dashboard, maker-checker, audit, settlement, reconciliation.
13. `13-cost-ha-dr.md` — cost management, high availability, backup, restore, disaster recovery.
