# Skill 02 — Cloud Infrastructure

## Purpose

Build the AWS infrastructure for a production-grade Digital Wallet / Mobile Money platform using Terraform, secure networking, managed databases, containerized compute, observability, and disaster recovery foundations.

## When to Use This Skill

Use this skill when creating or changing:

- Terraform modules
- AWS accounts/environments
- VPC and networking
- ECS/EKS workloads
- RDS PostgreSQL
- ElastiCache Redis
- SQS/SNS/MSK
- S3
- OpenSearch
- WAF
- KMS and Secrets Manager
- CloudWatch/Prometheus/Grafana
- CI/CD deployment infrastructure

## Production Cloud Principles

1. Use Infrastructure as Code for all resources.
2. Separate environments: dev, staging, production.
3. Use separate AWS accounts for production where possible.
4. Use private subnets for application workloads, databases, Redis, and queues.
5. Use public subnets only for load balancers, NAT gateways, and controlled ingress.
6. Encrypt all data stores with KMS.
7. Deny public access to databases, Redis, and S3 buckets.
8. Use least-privilege IAM.
9. Enable centralized logging and audit trails.
10. Test backup and restore, not just backup creation.

## Recommended AWS Account Structure

```text
management-account
security-account
logging-account
shared-services-account
network-account
wallet-dev-account
wallet-staging-account
wallet-prod-account
```

Minimum acceptable training version:

```text
wallet-dev
wallet-staging
wallet-prod
```

## Network Design

Create a VPC across at least 2 Availability Zones for non-production and 3 Availability Zones for production where budget allows.

Required subnets:

- Public subnet per AZ
- Private app subnet per AZ
- Private data subnet per AZ
- Optional private integration subnet per AZ

Required controls:

- Internet Gateway for public ingress
- NAT Gateway for controlled outbound access
- Route tables per subnet tier
- Security groups with least privilege
- VPC endpoints for S3, ECR, CloudWatch, Secrets Manager, SSM where useful
- Flow logs enabled

## Compute Options

### ECS Fargate

Recommended for simpler production operations.

Use when:

- Team wants managed container orchestration
- Workloads are mostly stateless services
- Faster operational maturity is required

Must include:

- ECS cluster
- Fargate services
- Task definitions
- ALB target groups
- Autoscaling policies
- CloudWatch logs
- IAM task roles
- Secrets injection
- Health checks

### EKS

Recommended when Kubernetes experience is a key project goal.

Use when:

- Team wants Kubernetes production experience
- Advanced service mesh, operators, or custom scaling is needed
- Portability matters

Must include:

- Managed node groups or Fargate profiles
- Ingress controller
- External Secrets or equivalent
- Cluster autoscaler/Karpenter
- Metrics server
- Network policies
- Pod disruption budgets
- Resource requests/limits
- RBAC

## RDS PostgreSQL

Required configuration:

- Multi-AZ for production
- Encryption at rest with KMS
- Automated backups
- PITR enabled
- Deletion protection in production
- Performance Insights
- Enhanced monitoring where budget allows
- Parameter group tuned for workload
- Private subnet placement
- No public access
- Security group allows only application services and controlled admin access

Recommended databases/schemas:

```text
wallet_identity
wallet_transaction
wallet_ledger
wallet_audit
wallet_reconciliation
```

For strict isolation, use separate databases or clusters for ledger and operational workloads.

## ElastiCache Redis

Use for:

- Session cache
- OTP throttling
- Rate limiting
- Short-lived idempotency locks
- Device risk cache

Production requirements:

- Private subnet
- Encryption in transit where supported
- Encryption at rest
- Auth token
- Multi-AZ replication for production
- Eviction policy aligned to workload
- CloudWatch alarms for evictions, CPU, memory, and connection count

## Messaging

### SQS/SNS

Use for:

- Notification jobs
- Provider callbacks
- Transaction processing steps
- Reconciliation jobs
- Fraud analysis jobs

Required:

- DLQ for every queue
- Redrive policy
- Message retention policy
- Visibility timeout aligned with worker processing time
- Idempotent consumers
- Alarms for age of oldest message and DLQ count

### Kafka/MSK

Use for:

- High-throughput event streaming
- Event-driven analytics
- Large-scale transaction event pipelines

Required:

- Topic naming standards
- Schema registry approach
- Consumer group strategy
- Retention policies
- Partitioning strategy
- Replay strategy
- Monitoring for lag and broker health

## S3/Object Storage

Buckets:

```text
wallet-kyc-documents-<env>
wallet-reconciliation-reports-<env>
wallet-audit-archive-<env>
wallet-terraform-state-<env>
wallet-app-artifacts-<env>
```

Requirements:

- Block public access
- KMS encryption
- Versioning where appropriate
- Lifecycle policies
- Access logging or CloudTrail data events for sensitive buckets
- Bucket policies that deny insecure transport

## OpenSearch

Use for:

- Transaction search
- Audit search
- Operational investigations

Requirements:

- Private access
- Fine-grained access control
- Encryption at rest
- Node-to-node encryption
- TLS
- Index lifecycle management
- PII masking before indexing

## Terraform Structure

```text
infrastructure/terraform/
├── global/
│   ├── iam/
│   ├── route53/
│   └── security-baseline/
├── modules/
│   ├── vpc/
│   ├── ecs-service/
│   ├── eks-cluster/
│   ├── rds-postgres/
│   ├── redis/
│   ├── sqs/
│   ├── sns/
│   ├── s3-secure-bucket/
│   ├── opensearch/
│   ├── kms-key/
│   ├── secrets/
│   ├── waf/
│   └── observability/
└── envs/
    ├── dev/
    ├── staging/
    └── prod/
```

## Required Terraform Controls

- Remote backend
- State locking
- Provider version pinning
- Module versioning
- Input validation
- No plaintext secrets in variables
- `terraform fmt`
- `terraform validate`
- `terraform plan` in CI
- Policy scanning with Checkov/tfsec/TFLint
- Separate workspaces or directories per environment
- Manual approval before production apply

## Infrastructure Acceptance Criteria

Infrastructure is production-grade when:

- All resources are created by Terraform.
- Production has Multi-AZ architecture.
- Workloads run in private subnets.
- Databases are not publicly accessible.
- S3 buckets block public access.
- Secrets are in Secrets Manager.
- Encryption uses KMS.
- WAF protects public APIs.
- Logs, metrics, and alerts are enabled.
- Backup and restore are tested.
- CI/CD can deploy safely with rollback.

## Common Mistakes to Avoid

- Running RDS in public subnets.
- Putting app containers in public subnets without need.
- Using one security group open to the world.
- Hardcoding secrets in Terraform variables.
- Forgetting DLQs.
- Using Redis as a financial source of truth.
- Having no deletion protection for production databases.
- Building without restore tests.
