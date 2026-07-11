# Full system architecture

The production logical architecture is shown below. The ledger is the financial source of truth; frontend and transaction orchestration never update balances directly.

```mermaid
flowchart TB
  Customer[Customer Web/Mobile App\nNext.js frontend] --> Edge[CloudFront / WAF / API Gateway-BFF]
  Admin[Admin Browser] --> Edge
  Edge --> Auth[auth-service\nOTP MFA PIN sessions]
  Edge --> User[user-service\nprofiles devices status]
  Edge --> KYC[kyc-service\nKYC + document metadata]
  Edge --> Wallet[wallet-service\nwallets holds balance view]
  Edge --> Txn[transaction-service\norchestration + state machine]
  Edge --> Notify[notification-service]
  Edge --> AdminAPI[admin-dashboard backend\nRBAC + maker-checker]
  Txn --> Limits[limits-service]
  Txn --> Fees[fee-service]
  Txn --> Fraud[fraud-service]
  Txn --> Ledger[ledger-service\nappend-only double entry]
  Txn --> Payments[payment-integration-service]
  Txn --> Notify
  Wallet --> Ledger
  Payments --> Bank[Bank/Card providers]
  Payments --> Biller[Biller providers]
  Payments --> Airtime[Airtime providers]
  Bank -->|signed callback| Payments
  Biller -->|signed callback| Payments
  Airtime -->|signed callback| Payments
  Payments -->|normalized status| Txn
  Auth --> Audit[audit-service\nimmutable audit trail]
  KYC --> Audit
  Wallet --> Audit
  Txn --> Audit
  Fraud --> Audit
  AdminAPI --> Audit
  Payments --> Recon[reconciliation-service\nsettlements + exceptions]
  Ledger --> Recon
  Txn --> Recon

  subgraph PrivateData[Private AWS data plane]
    RDS[(RDS PostgreSQL\nservice-owned schemas)]
    Redis[(ElastiCache Redis\nTTL limits/risk/session cache)]
    SQS[[SQS queues + DLQs]]
    S3[(Private KMS S3\nKYC docs + reports)]
    Search[(OpenSearch\nmasked projections)]
    Secrets[Secrets Manager]
    KMS[KMS]
    CW[CloudWatch + OpenTelemetry]
  end
  Auth --> RDS
  User --> RDS
  KYC --> RDS
  Wallet --> RDS
  Txn --> RDS
  Ledger --> RDS
  Payments --> RDS
  Recon --> RDS
  Audit --> RDS
  Auth --> Redis
  Limits --> Redis
  Fraud --> Redis
  Payments --> SQS
  Notify --> SQS
  Recon --> SQS
  KYC --> S3
  Recon --> S3
  Audit --> Search
  Secrets --> KMS
  RDS --> KMS
  S3 --> KMS
  Edge --> CW
  RDS --> CW
  Redis --> CW
  SQS --> CW

  CI[GitHub Actions / Jenkins] --> ECR[ECR images] --> ECS[ECS Fargate multi-AZ private subnets] --> Edge
  RDS --> Backup[RDS PITR/snapshots]
  S3 --> Backup
```

## Money movement sequence

```mermaid
sequenceDiagram
  participant C as Customer frontend
  participant G as Gateway/BFF
  participant T as Transaction service
  participant L as Limits
  participant F as Fees
  participant R as Fraud
  participant P as Provider adapter
  participant A as Ledger
  participant N as Notifications
  C->>G: Authenticated write + Idempotency-Key + PIN
  G->>T: Correlated request
  T->>L: Reserve limit
  T->>F: Deterministic fee quote
  T->>R: Risk evaluation
  alt blocked/review
    R-->>T: block or under_review
    T-->>G: No ledger posting
  else wallet transfer
    T->>A: Atomic balanced debit/credit
    A-->>T: Ledger reference
    T->>L: Commit reservation
    T->>N: Success event
    T-->>G: Successful transaction
  else external provider
    T->>P: Idempotent initiation
    P-->>T: Pending + provider reference
    P-->>T: Verified callback/status
    T->>A: Post or reverse once
    T->>N: Final notification
    T-->>G: Final state
  end
```

## Trust and ownership rules

- Browser clients never receive provider, database, AWS, or service credentials.
- The BFF translates secure cookies; backend services remain the authorization authority.
- Transaction-service orchestrates; ledger-service owns posting and reversals.
- Redis is never the source of truth for balances or audit decisions.
- Provider callbacks are signed, replay-protected, deduplicated, normalized, and reconciled.
- Audit records preserve request/correlation, transaction, ledger, provider, settlement, and reconciliation references.
