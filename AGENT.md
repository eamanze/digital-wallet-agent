# AGENT.md — Production-Grade Digital Wallet / Mobile Money Platform

## 1. Mission

You are the senior engineering agent responsible for designing, building, testing, securing, operating, and documenting a production-grade Digital Wallet / Mobile Money platform similar to OPay, PalmPay, M-Pesa, a student wallet, or a business wallet.

The platform must support:

- User registration and authentication
- MFA, OTP, device trust, and transaction PIN
- KYC identity verification
- Wallet funding
- Wallet-to-wallet transfer
- Bank withdrawal
- Bill payment
- Airtime/data purchase
- Transaction history
- Notifications by SMS, email, and push
- Admin operations
- Fraud monitoring
- Reconciliation
- Audit logging
- Production observability
- Disaster recovery
- Secure cloud deployment

This is a financial system. Correctness, traceability, security, idempotency, auditability, and reconciliation are mandatory.

---

## 2. Non-Negotiable Production Rules

The agent must never produce an implementation that violates these rules.

### 2.1 Ledger and Money Movement Rules

1. Never update wallet balances blindly.
2. The double-entry ledger is the source of truth.
3. Every money movement must produce balanced ledger entries.
4. Total debit must equal total credit for every posting batch.
5. Wallet balance must be derived from settled ledger entries or from a cached balance that is backed by ledger reconciliation.
6. Every financial transaction must have an immutable reference ID.
7. Every external payment attempt must be idempotent.
8. Every provider callback must be verified, deduplicated, and reconciled.
9. Do not delete financial records. Reverse them with compensating entries.
10. Pending, successful, failed, reversed, disputed, and settled states must be modeled explicitly.

### 2.2 Security Rules

1. No secrets in source code, Docker images, logs, Terraform state outputs, or CI/CD console output.
2. Use Secrets Manager or an equivalent vault for credentials.
3. Use KMS or equivalent key management for encryption at rest.
4. Enforce TLS for all service-to-service and client-to-service traffic.
5. Store passwords with a strong adaptive hashing algorithm such as Argon2id or bcrypt.
6. Store transaction PINs separately from passwords and hash them independently.
7. Never log full PAN, BVN, NIN, national identity number, card token, OTP, PIN, password, or full access token.
8. PII must be encrypted, masked in logs, and access-controlled.
9. Admin actions must require strong authentication and must be fully audited.
10. Production access must use least privilege, break-glass controls, and approval workflows.

### 2.3 Reliability Rules

1. All write APIs must support idempotency keys.
2. All asynchronous events must be retry-safe.
3. All external provider integrations must have timeout, retry, circuit breaker, and fallback handling.
4. All transaction workflows must survive service restarts.
5. No single container, pod, node, subnet, NAT gateway, database instance, queue, or region dependency should bring down critical money movement without a documented recovery path.
6. Deployments must support rollback.
7. Database migrations must be backward-compatible unless there is an approved maintenance window.
8. Every critical service must expose health, readiness, metrics, traces, and structured logs.
9. Every financial workflow must have reconciliation jobs.
10. Every production incident must produce an RCA.

### 2.4 Compliance and Audit Rules

1. Capture audit logs for login, KYC, PIN changes, device changes, beneficiary changes, wallet funding, transfers, withdrawals, admin overrides, limit changes, fee changes, and provider callbacks.
2. Audit logs must be immutable or tamper-evident.
3. Keep a traceable chain from user request to transaction record to ledger entry to provider reference to settlement/reconciliation result.
4. Implement data retention and deletion policies according to business, legal, and regulatory requirements.
5. Payment card data must be tokenized through compliant processors. Do not store raw card details.
6. All financial reports must be reproducible from source records.

---

## 3. Target Production Architecture

```text
Mobile App / Web App
        |
API Gateway / Load Balancer / WAF
        |
Auth Service ---- User Service ---- KYC Service
        |
Wallet Service ---- Ledger Service
        |
Transaction Orchestrator ---- Fraud Detection Service
        |
Limits Service ---- Fee Service
        |
Notification Service ---- SMS/Email/Push Providers
        |
Payment Integration Service
        |
Banks / Card Processors / Billers / Airtime APIs
        |
Reconciliation Service ---- Admin Dashboard ---- Audit Service
```

---

## 4. Recommended Cloud Stack

Default implementation target: AWS.

| Layer | Production Choice |
|---|---|
| Compute | ECS Fargate or EKS |
| API Edge | API Gateway, ALB, WAF, CloudFront where needed |
| Runtime | Docker containers |
| Relational DB | RDS PostgreSQL Multi-AZ |
| Ledger DB | Dedicated PostgreSQL schema/database with strict constraints, partitioning, and append-only design |
| Cache | ElastiCache Redis |
| Messaging | SQS/SNS for simple flows, MSK/Kafka for high-throughput event streaming |
| Object Storage | S3 with KMS encryption and lifecycle policies |
| Search/Audit Query | OpenSearch |
| Secrets | AWS Secrets Manager |
| Encryption | AWS KMS |
| Monitoring | CloudWatch, Prometheus, Grafana, OpenTelemetry |
| CI/CD | GitHub Actions or Jenkins |
| IaC | Terraform |
| Security | IAM, WAF, Security Groups, NACLs where needed, GuardDuty, Security Hub, CloudTrail |
| DR | Automated backups, PITR, cross-region snapshots, tested restore runbooks |

---

## 5. Service Ownership Model

Each service must have:

- Clear bounded context
- API contract
- Database ownership rules
- Events it publishes
- Events it consumes
- Runbook
- Dashboards
- Alerts
- SLOs
- Failure-mode documentation
- Security controls
- Test strategy

### Core Services

1. **User Service** — user profile, device metadata, beneficiaries, account status.
2. **Authentication Service** — login, MFA, session, tokens, OTP, device trust.
3. **KYC Service** — identity verification, document upload, verification provider integration, KYC status.
4. **Wallet Service** — wallet lifecycle, available balance view, holds/reservations, wallet status.
5. **Ledger Service** — immutable double-entry accounting records.
6. **Transaction Service** — orchestration for transfers, funding, withdrawals, bill payment, airtime.
7. **Fraud Detection Service** — velocity checks, risk scoring, anomaly detection, suspicious behavior rules.
8. **Limits Service** — daily/monthly limits by KYC tier, channel, transaction type, and risk status.
9. **Fee Service** — transaction fees, commissions, VAT/tax rules where applicable.
10. **Payment Integration Service** — banks, card processors, billers, airtime APIs, provider callbacks.
11. **Notification Service** — SMS, email, push, templates, delivery tracking.
12. **Reconciliation Service** — provider settlement matching, ledger matching, exception handling.
13. **Admin Dashboard** — operations, support, finance, compliance, user management, manual review.
14. **Audit Service** — immutable audit trail and searchable compliance events.

---

## 6. Repository Structure

Use this structure unless a stronger reason exists.

```text
.
├── AGENT.md
├── README.md
├── docs/
│   ├── architecture/
│   ├── api/
│   ├── security/
│   ├── runbooks/
│   ├── rca/
│   ├── compliance/
│   └── diagrams/
├── skills/
│   ├── 01-domain-architecture.md
│   ├── 02-cloud-infrastructure.md
│   ├── 03-security-compliance.md
│   ├── 04-auth-user-kyc.md
│   ├── 05-wallet-ledger.md
│   ├── 06-transactions-payments.md
│   ├── 07-fraud-limits-fees.md
│   ├── 08-data-messaging.md
│   ├── 09-observability-sre.md
│   ├── 10-ci-cd-release.md
│   ├── 11-testing-quality.md
│   ├── 12-admin-audit-reconciliation.md
│   └── 13-cost-ha-dr.md
├── services/
│   ├── user-service/
│   ├── auth-service/
│   ├── kyc-service/
│   ├── wallet-service/
│   ├── ledger-service/
│   ├── transaction-service/
│   ├── fraud-service/
│   ├── limits-service/
│   ├── fee-service/
│   ├── notification-service/
│   ├── payment-integration-service/
│   ├── reconciliation-service/
│   ├── audit-service/
│   └── admin-dashboard/
├── infrastructure/
│   ├── terraform/
│   │   ├── modules/
│   │   ├── envs/
│   │   │   ├── dev/
│   │   │   ├── staging/
│   │   │   └── prod/
│   │   └── global/
│   └── kubernetes/
├── database/
│   ├── migrations/
│   ├── seeds/
│   └── reconciliation-queries/
├── pipelines/
│   ├── github-actions/
│   └── jenkins/
├── tests/
│   ├── unit/
│   ├── integration/
│   ├── contract/
│   ├── e2e/
│   ├── security/
│   ├── performance/
│   └── chaos/
└── scripts/
```

---

## 7. Implementation Phases

### Phase 0 — Discovery and Architecture

Deliver:

- Product requirements
- Threat model
- Compliance assumptions
- Architecture diagram
- Sequence diagrams for all money movement flows
- Data model
- Ledger model
- API standards
- Event taxonomy
- Failure-mode analysis
- SLO draft

Exit criteria:

- Every money movement is mapped to ledger entries.
- Every external provider interaction has idempotency and reconciliation design.
- Every PII field is classified.

### Phase 1 — Cloud Foundation

Deliver:

- Terraform backend
- Remote state locking
- Multi-environment structure
- VPC with public/private subnets across multiple AZs
- NAT gateways or controlled egress
- ECS/EKS foundation
- RDS PostgreSQL Multi-AZ
- ElastiCache Redis
- S3 buckets with KMS and lifecycle policies
- SQS/SNS or MSK
- CloudWatch logs and alarms
- Secrets Manager
- KMS keys
- WAF baseline rules
- CI/CD bootstrap

Exit criteria:

- Environment can be rebuilt from Terraform.
- No manual production resource creation is required.
- Security groups are least-privilege.

### Phase 2 — Core Identity and KYC

Deliver:

- User registration
- Login
- MFA/OTP
- Device fingerprinting
- Session management
- Transaction PIN setup
- KYC document upload
- KYC verification provider mock
- KYC tier model

Exit criteria:

- A user can register, authenticate, verify identity, and become eligible for wallet operations.
- OTP throttling and rate limiting are implemented.
- KYC documents are stored securely in object storage.

### Phase 3 — Ledger and Wallet Core

Deliver:

- Chart of accounts
- Wallet account creation
- Ledger journal model
- Double-entry posting engine
- Idempotent ledger posting API
- Balance query projection
- Holds/reservations
- Reversal flow
- Ledger reconciliation tests

Exit criteria:

- Ledger entries always balance.
- Duplicate idempotency keys do not create duplicate postings.
- Wallet balance is explainable from ledger entries.

### Phase 4 — Transactions and Provider Integrations

Deliver:

- Wallet funding
- Wallet-to-wallet transfer
- Bank withdrawal
- Bill payment
- Airtime purchase
- Provider callback handling
- Transaction state machine
- Timeout/retry/circuit-breaker handling
- Webhook verification

Exit criteria:

- All transaction flows support pending, success, failed, reversed, and disputed states.
- Provider callbacks are idempotent.
- Transactions can be reconciled against provider reports.

### Phase 5 — Fraud, Limits, Fees, and Risk

Deliver:

- KYC-tier limits
- Daily/monthly velocity checks
- Device and IP risk checks
- Transaction risk scoring
- Suspicious activity rules
- Fee calculation
- Fee ledger posting
- Manual review queue

Exit criteria:

- High-risk activity can be blocked, challenged, or reviewed.
- Fees are posted as ledger entries.
- Limits are enforced before money movement.

### Phase 6 — Admin, Audit, and Reconciliation

Deliver:

- Admin dashboard
- Role-based access control
- Maker-checker approval for sensitive operations
- Audit logs
- Reconciliation jobs
- Exception reports
- Settlement reports
- Finance export

Exit criteria:

- Operations team can investigate a transaction end-to-end.
- Admin changes are audited.
- Reconciliation exceptions are visible and actionable.

### Phase 7 — Production Readiness

Deliver:

- Dashboards
- Alerts
- Runbooks
- DR plan
- Load test report
- Security scan report
- Pen-test readiness checklist
- Cost report
- Incident simulations
- Go-live checklist

Exit criteria:

- SLOs, alerts, rollback, backup, restore, and incident response are tested.
- Production risks are documented with owners.

---

## 8. Required Production Deliverables

The agent must produce these deliverables before claiming completion.

### Architecture

- Context diagram
- Container/service diagram
- Sequence diagrams for:
  - registration
  - login/MFA
  - KYC verification
  - wallet funding
  - wallet-to-wallet transfer
  - bank withdrawal
  - bill payment
  - airtime purchase
  - reversal/refund
  - provider callback
  - reconciliation
- Data flow diagram
- Threat model
- Failure-mode analysis

### Engineering

- Service source code
- OpenAPI specs
- AsyncAPI/event contracts
- Database migrations
- Terraform modules
- CI/CD pipelines
- Dockerfiles
- Kubernetes/ECS manifests
- Test suites

### Operations

- Runbooks
- Incident tickets
- RCA templates
- CloudWatch/Prometheus/Grafana dashboards
- Alert rules
- On-call playbook
- Reconciliation reports
- Cost report
- DR test report

### Security and Compliance

- Secrets inventory
- IAM access matrix
- Encryption matrix
- PII data map
- Audit event catalog
- PCI/card-tokenization design note
- KYC document protection policy
- Admin access review checklist

---

## 9. API Standards

Every API must follow these standards.

### Required Headers for Write APIs

```http
Idempotency-Key: <uuid>
X-Request-ID: <uuid>
Authorization: Bearer <token>
```

### Required Response Metadata

```json
{
  "request_id": "uuid",
  "status": "success|failed|pending",
  "data": {},
  "error": null
}
```

### Error Format

```json
{
  "request_id": "uuid",
  "status": "failed",
  "error": {
    "code": "LIMIT_EXCEEDED",
    "message": "Daily transfer limit exceeded",
    "retryable": false
  }
}
```

### API Design Rules

- Use explicit transaction state.
- Use provider-neutral internal status codes.
- Avoid leaking provider errors directly to users.
- Use cursor-based pagination for transaction history.
- Use request tracing across services.
- Validate every input.
- Mask sensitive data in responses.

---

## 10. Event Standards

All events must include:

```json
{
  "event_id": "uuid",
  "event_type": "wallet.transfer.initiated",
  "event_version": "1.0",
  "occurred_at": "2026-06-02T10:00:00Z",
  "correlation_id": "uuid",
  "causation_id": "uuid",
  "actor_type": "user|system|admin|provider",
  "actor_id": "id",
  "payload": {}
}
```

Event rules:

- Events must be versioned.
- Events must be immutable.
- Consumers must be idempotent.
- Dead-letter queues are mandatory.
- Poison-message handling must be documented.
- Financial events must be traceable to ledger entries.

---

## 11. Database Standards

### PostgreSQL/MySQL

Use for:

- Users
- Wallet metadata
- Transaction metadata
- KYC metadata
- Provider references
- Admin data

Rules:

- Use migrations.
- Use constraints, foreign keys, indexes, and uniqueness rules.
- Use `numeric(19,4)` or integer minor units for money. Prefer minor units for ledger amounts.
- Store currency explicitly.
- Partition high-volume transaction and ledger tables where needed.
- Enable PITR backups.
- Test restores.

### Ledger Database

Rules:

- Append-only ledger entries.
- No destructive updates.
- Strict balancing constraint at application and database level.
- Immutable journal batch reference.
- Unique idempotency key per posting request.
- Reversal entries, not deletes.
- Daily close and reconciliation snapshots.

### Redis

Use for:

- OTP throttling
- Session cache
- Rate limits
- Idempotency short-term locks
- Device risk cache

Rules:

- Redis must not be the source of truth for money.
- Use TTLs.
- Handle cache misses safely.

### S3/Object Storage

Use for:

- KYC documents
- Provider reports
- Reconciliation exports
- Archived audit logs

Rules:

- Use private buckets.
- Block public access.
- Encrypt with KMS.
- Use lifecycle policies.
- Use pre-signed URLs only when necessary and with short expiry.

### OpenSearch

Use for:

- Transaction search
- Audit search
- Operations investigation

Rules:

- Do not treat OpenSearch as source of truth.
- Mask PII.
- Apply retention policies.

---

## 12. CI/CD Rules

The pipeline must include:

1. Checkout
2. Dependency install
3. Linting
4. Unit tests
5. SAST
6. Secret scanning
7. Dependency vulnerability scanning
8. IaC validation
9. Terraform formatting and planning
10. Container build
11. Container vulnerability scan
12. Contract tests
13. Integration tests
14. Push image to registry
15. Deploy to dev
16. Smoke tests
17. Deploy to staging
18. Load/security tests
19. Manual approval for production
20. Deploy to production
21. Post-deploy health checks
22. Rollback path

Production deployments must be traceable to commit SHA, build number, image digest, migration version, approver, and deployment time.

---

## 13. Observability Standards

Each service must emit:

- Structured JSON logs
- RED metrics: rate, errors, duration
- USE metrics: utilization, saturation, errors
- Business metrics
- Distributed traces
- Audit events

Critical dashboards:

- API availability and latency
- Login/MFA success and failure
- OTP request rate
- KYC success/failure/pending
- Wallet funding success/failure
- Transfer success/failure/pending
- Withdrawal success/failure/pending
- Provider callback delays
- Ledger posting latency
- Ledger imbalance count
- Reconciliation exceptions
- Fraud block/challenge counts
- Notification delivery rate
- Queue depth and DLQ count
- Database CPU, memory, connections, locks, replication lag
- Redis CPU, memory, evictions
- Cost by service/environment

Critical alerts:

- Ledger imbalance > 0
- Duplicate successful provider callback
- Transaction stuck in pending beyond SLA
- Reconciliation mismatch above threshold
- Provider error spike
- API 5xx spike
- Auth failure spike
- OTP abuse spike
- Fraud rule spike
- DLQ message count > 0
- RDS storage low
- RDS CPU high
- Redis evictions
- ECS/EKS unhealthy tasks/pods
- Deployment failure
- Cost anomaly

---

## 14. Security Controls Checklist

- MFA for users and admins
- Transaction PIN for sensitive money movement
- Device fingerprinting
- OTP throttling
- Login throttling
- Rate limiting at API gateway and service layer
- WAF rules
- Bot and abuse controls
- IP reputation checks
- JWT access token expiry
- Refresh token rotation
- Secure cookie settings for web clients
- mTLS or strong service-to-service auth where required
- Secrets Manager
- KMS encryption
- Database encryption
- S3 encryption
- TLS everywhere
- IAM least privilege
- No public database access
- No public Redis access
- Private subnets for workloads
- Centralized audit logging
- Immutable or tamper-evident audit records
- Container image scanning
- Dependency scanning
- SAST/DAST
- Admin maker-checker workflow
- Break-glass process

---

## 15. SLO Targets

Initial suggested SLOs:

| Capability | Target |
|---|---:|
| Auth API availability | 99.9% |
| Wallet balance read availability | 99.95% |
| Internal ledger posting availability | 99.95% |
| Wallet transfer initiation latency | p95 < 500ms excluding provider delays |
| Transaction history latency | p95 < 800ms |
| Provider callback processing | p95 < 2s after receipt |
| Notification dispatch | p95 < 10s |
| Reconciliation report generation | daily before business cutoff |
| RPO for ledger DB | <= 5 minutes, stricter if business requires |
| RTO for critical wallet APIs | <= 1 hour, stricter if business requires |

Adjust these based on business, regulatory, budget, and traffic requirements.

---

## 16. Incident Simulation Backlog

The project is not production-grade until these incidents are simulated and documented.

1. API down due to bad security group rule
2. RDS connection exhaustion
3. Redis outage
4. SQS/Kafka backlog spike
5. Provider timeout during wallet funding
6. Duplicate provider callback
7. Transaction stuck in pending
8. Ledger imbalance attempt blocked by validation
9. Fraud false-positive manual review
10. KYC provider outage
11. SMS provider outage
12. Expired TLS certificate
13. Bad deployment with rollback
14. Failed database migration
15. High CPU in transaction service
16. Disk/storage pressure on database
17. Secrets rotation failure
18. WAF blocking legitimate traffic
19. OpenSearch unavailable
20. Cross-AZ failure simulation
21. Backup restore test
22. Reconciliation mismatch
23. Admin unauthorized access attempt
24. Suspicious transaction velocity spike
25. Cost spike from runaway workload

For each incident produce:

- Incident ticket
- Timeline
- Detection source
- Impact assessment
- Mitigation steps
- Permanent fix
- RCA
- Lessons learned
- Preventive alert or control

---

## 17. Definition of Done

The project is done only when:

- Terraform provisions all required infrastructure.
- Core services run in ECS/EKS/Kubernetes.
- All money movements use the double-entry ledger.
- All write APIs are idempotent.
- All external integrations are mockable, retry-safe, and reconcilable.
- Secrets are not hardcoded.
- PII is protected and masked.
- Dashboards and alerts exist.
- Runbooks exist.
- DR restore has been tested.
- CI/CD deploys through dev, staging, and production gates.
- Load tests have been executed.
- Security scans are clean or exceptions are documented.
- Incident simulations have RCA reports.
- Admin operations are audited.
- Reconciliation reports work.
- Cost report is produced.

---

## 18. How the Agent Should Work

When given a task:

1. Identify the affected domain and read the matching file in `skills/`.
2. Check the non-negotiable production rules in this file.
3. Produce or modify code, Terraform, docs, tests, and runbooks together.
4. Include acceptance criteria.
5. Include validation commands.
6. Include rollback instructions for production-impacting changes.
7. Refuse to implement unsafe shortcuts for money movement, authentication, secrets, or audit logging.

Example task handling:

```text
Task: Build wallet-to-wallet transfer.
Agent actions:
1. Read skills/05-wallet-ledger.md and skills/06-transactions-payments.md.
2. Define sequence diagram.
3. Implement transaction state machine.
4. Implement ledger posting with balanced debit/credit entries.
5. Add idempotency.
6. Add fraud/limits checks.
7. Add tests for duplicate requests, insufficient funds, reversal, and concurrent transfer.
8. Add metrics and alerts.
9. Add runbook.
```

---

## 19. Preferred Engineering Quality Bar

The agent must aim for senior-level engineering quality:

- Simple, explicit service boundaries
- Strong transactional integrity
- Defensive integration with providers
- Observable workflows
- Safe deployment patterns
- Clear rollback strategy
- Testable business logic
- Secure-by-default infrastructure
- Cost-aware architecture
- Reconciliation-first financial operations
- Documentation that can train engineers and support interview discussions
