# Skill 13 — Cost Management, High Availability, and Disaster Recovery

## Purpose

Design and operate the Digital Wallet / Mobile Money platform for cost awareness, high availability, resilience, backup, restore, disaster recovery, and production continuity.

## When to Use This Skill

Use this skill when working on:

- High availability design
- Autoscaling
- Cost estimation
- Cost optimization
- Backup strategy
- Restore testing
- Disaster recovery
- Multi-AZ or multi-region planning
- Production capacity planning
- FinOps reports

## High Availability Principles

1. Critical services must run across multiple Availability Zones.
2. Databases must use Multi-AZ in production.
3. Application services must have at least 2 running tasks/pods in production.
4. Queues must absorb temporary provider/service outages.
5. Load balancers must perform health checks.
6. Deployments must avoid taking all replicas down at once.
7. Critical data must be backed up and restorable.
8. DR runbooks must be tested.

## Availability Targets

Suggested starting targets:

| Component | Target |
|---|---:|
| API edge | 99.9%+ |
| Auth service | 99.9% |
| Transaction service | 99.9% |
| Ledger service | 99.95% |
| RDS ledger DB | 99.95% depending on chosen AWS config |
| Notification dispatch | 99.5% |
| Admin dashboard | 99.0% |

These must be adjusted based on business requirements and budget.

## Production HA Checklist

- ALB/API Gateway across multiple AZs
- ECS/EKS services across multiple AZs
- RDS Multi-AZ
- Redis Multi-AZ replication for production
- SQS/SNS managed queues/topics or MSK Multi-AZ
- S3 versioning/lifecycle where needed
- NAT gateway per AZ where high availability requires it
- Autoscaling policies
- Health/readiness checks
- Pod disruption budgets for EKS
- Graceful shutdown handling
- Connection draining
- Database connection pooling

## Autoscaling

Scale on:

- CPU
- Memory
- Request count per target
- Queue depth
- Custom business metrics where appropriate

Do not scale ledger/database writes blindly without understanding locks, connection limits, and transaction contention.

## Disaster Recovery Concepts

Define:

- RTO: Recovery Time Objective
- RPO: Recovery Point Objective

Suggested starting objectives:

| Workload | RTO | RPO |
|---|---:|---:|
| Ledger DB | <= 1 hour | <= 5 minutes |
| Transaction DB | <= 1 hour | <= 5 minutes |
| KYC documents | <= 4 hours | <= 15 minutes |
| Admin dashboard | <= 8 hours | <= 1 hour |
| Search/OpenSearch | <= 24 hours | <= 24 hours if source DB is intact |

Adjust based on business and regulatory requirements.

## Backup Requirements

RDS:

- Automated backups
- PITR
- Manual snapshots before high-risk migrations
- Cross-region snapshot copy for production where required
- Restore testing schedule

S3:

- Versioning for critical buckets
- Lifecycle policies
- Replication for critical data where required
- Object lock for immutable records where appropriate

Terraform state:

- Remote backend
- Versioning
- Locking
- Restricted access

Secrets:

- Rotation policy
- Break-glass access process
- Recovery documentation

## DR Strategies

### Backup and Restore

Lowest cost, slower recovery.

Use for:

- Training environments
- Non-critical admin/search workloads
- Early-stage startups with documented risk acceptance

### Pilot Light

Moderate cost, faster recovery.

Use for:

- Critical database replicated or restorable cross-region
- Minimal core infrastructure in secondary region

### Warm Standby

Higher cost, faster recovery.

Use for:

- Mature wallet platforms with strict uptime requirements

### Active-Active

Highest complexity and cost.

Use only when business requirements justify it.

Financial systems must handle distributed consistency carefully before active-active money movement is attempted.

## Cost Management

Track cost by:

- Environment
- Service
- Team
- Feature area
- Provider integration workload

Required tags:

```text
Environment
Service
Owner
CostCenter
Project
DataClassification
ManagedBy
```

Cost controls:

- Budgets and alerts
- Rightsizing ECS/EKS tasks
- RDS instance sizing review
- Reserved Instances/Savings Plans where appropriate
- S3 lifecycle policies
- OpenSearch retention policies
- NAT gateway traffic review
- Log retention tuning
- Non-production shutdown schedules where safe
- Container resource requests/limits

## Capacity Planning

Estimate:

- Daily active users
- Peak logins per minute
- OTP requests per minute
- Transfers per second
- Provider callbacks per second
- Transaction history reads per second
- Ledger postings per second
- Queue backlog tolerance
- Database storage growth
- Audit log growth
- KYC document storage growth

## Required DR Tests

- Restore RDS snapshot to test environment.
- Perform PITR restore test.
- Restore KYC document from S3 version/backup.
- Rebuild environment from Terraform.
- Recover service from failed deployment.
- Drain and replace unhealthy ECS task/EKS pod.
- Simulate Redis failover.
- Simulate provider outage and queue recovery.
- Simulate database failover.
- Validate reconciliation after recovery.

## Cost Report Template

```markdown
# Monthly Cost Report

## Summary

## Total Cost by Environment

## Top 10 Cost Drivers

## Cost by AWS Service

## Cost by Application Service

## Anomalies

## Optimization Recommendations

## Risks and Trade-Offs

## Action Items
```

## DR Runbook Template

```markdown
# DR Runbook: <System>

## Trigger Conditions

## RTO/RPO

## Decision Authority

## Recovery Steps

## Data Validation

## DNS/Traffic Shift

## Service Verification

## Reconciliation Checks

## Communication Plan

## Rollback / Return to Primary
```

## Acceptance Criteria

Cost/HA/DR is production-grade when:

- Production workloads are Multi-AZ.
- Backups are automated.
- Restore has been tested.
- RTO/RPO are documented.
- Cost dashboards and budgets exist.
- High-cost resources have owners.
- Scaling policies are tested.
- DR runbook exists.
- Reconciliation is validated after recovery.

## Common Mistakes to Avoid

- Having backups but never testing restore.
- Overbuilding active-active before solving ledger consistency.
- No cost tags.
- No budget alerts.
- Single NAT gateway for production without documented risk acceptance.
- Single application replica for critical service.
- No rollback after failed deployment.
