# Container Architecture

## Purpose

This document describes the deployable service architecture and the production infrastructure containers around them. The default target is AWS ECS Fargate because it provides managed container operations with lower platform complexity. EKS remains a future option if Kubernetes-specific capabilities are required.

## Production Container View

```text
Internet
  -> CloudFront where useful
  -> WAF
  -> API Gateway / ALB
  -> ECS Fargate services
      - auth-service
      - user-service
      - kyc-service
      - wallet-service
      - ledger-service
      - transaction-service
      - fraud-service
      - limits-service
      - fee-service
      - notification-service
      - payment-integration-service
      - reconciliation-service
      - audit-service
      - admin-dashboard
  -> Private AWS dependencies
      - RDS PostgreSQL
      - ElastiCache Redis
      - SQS/SNS
      - S3
      - OpenSearch
      - Secrets Manager
      - KMS
      - CloudWatch / OpenTelemetry collector
```

## Runtime Topology

| Runtime Component | Production Requirement |
|---|---|
| ECS cluster | Runs across at least 3 AZs in production. |
| ECS services | Minimum 2 tasks for critical services; autoscaling by CPU, memory, request count, and queue depth. |
| ALB/API Gateway | Health checks, TLS, request IDs, throttling, route separation for callbacks and admin. |
| Service tasks | No secrets baked into images; secrets injected at runtime from Secrets Manager. |
| Worker tasks | Consume SQS queues idempotently and send poison messages to DLQs. |
| RDS PostgreSQL | Multi-AZ, encrypted, private, PITR enabled, deletion protection in production. |
| Redis | Private, encrypted, Multi-AZ for production; used only for ephemeral state. |
| S3 | KMS-encrypted, private, versioning/lifecycle policies where required. |
| OpenSearch | Private, encrypted, fine-grained access; masked projections only. |

## Service Deployment Units

| Service | Container Type | Scaling Signal |
|---|---|---|
| auth-service | API and optional workers | Login/OTP request rate, CPU, latency. |
| user-service | API | Request count, CPU, latency. |
| kyc-service | API and provider callback/status workers | KYC submissions, callback queue depth. |
| wallet-service | API | Balance read traffic and hold operations. |
| ledger-service | API/internal service | Posting latency, DB locks, queue backlog for ledger events. |
| transaction-service | API and workflow workers | Transaction initiation rate, pending workflow count. |
| payment-integration-service | API/callback endpoint and provider workers | Provider callback burst, provider request rate. |
| fraud-service | API/worker | Evaluation request rate, manual review backlog. |
| limits-service | API | Evaluation latency and request rate. |
| fee-service | API | Calculation request rate. |
| notification-service | Workers | Notification queue depth and provider latency. |
| reconciliation-service | Scheduled workers and API | Report size, run duration, exception backlog. |
| audit-service | API/worker | Audit event ingestion rate and queue depth. |
| admin-dashboard | Web/API | Admin sessions and search traffic. |

## Database Container Boundaries

The physical database choice may be separate clusters or separate databases/schemas on shared RDS during early production. Ownership remains strict regardless of physical deployment.

```text
wallet_identity       auth-service, user-service, kyc-service owned schemas
wallet_wallet         wallet-service owned schema
wallet_transaction    transaction-service and payment-integration-service owned schemas
wallet_ledger         ledger-service only
wallet_audit          audit-service only
wallet_reconciliation reconciliation-service only
wallet_admin          admin-dashboard workflow state only
```

No service may directly query another service's owned schema for product behavior. Reporting exceptions require documented read replicas or event-built projections.

## Network Segmentation

```text
Public subnets:
  - ALB
  - NAT gateways

Private app subnets:
  - ECS services and workers

Private data subnets:
  - RDS
  - Redis
  - OpenSearch

Private integration path:
  - VPC endpoints for S3, ECR, CloudWatch, Secrets Manager, SSM
```

## Health and Telemetry

Every service exposes:

```text
GET /health/live
GET /health/ready
GET /metrics
```

Every request and async job propagates:

```text
request_id
correlation_id
trace_id
transaction_id where applicable
provider_reference where applicable
```

Logs must be structured JSON and must not include OTPs, PINs, passwords, full access tokens, full identity numbers, raw KYC documents, or raw card data.

