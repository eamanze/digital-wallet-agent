# Disaster recovery

## Objectives and authority

Ledger/transaction databases: RTO ≤1 hour, RPO ≤5 minutes. KYC documents: RTO ≤4 hours, RPO ≤15 minutes. Admin/search: RTO ≤8/24 hours, RPO ≤1 hour/24 hours. The incident commander may fail over; finance-ops and compliance approve resuming money movement.

## Recovery sequence

1. Detect regional or data-integrity failure, declare severity, and stop unsafe posting.
2. Preserve provider references and queue messages; do not delete or replay blindly.
3. Restore encrypted RDS from PITR/snapshot in the recovery region and restore S3 versions/replicas.
4. Rebuild VPC, security groups, KMS grants, ECS, queues, ALB, and alarms from pinned Terraform.
5. Recover Secrets Manager values from replicated secrets or approved break-glass re-seeding; rotate any uncertain credentials.
6. Run ledger invariants, idempotency, audit-chain, and reconciliation checks.
7. Shift Route 53/ALB traffic only after health checks pass; use low TTLs and a documented manual fallback if DNS health checks are unavailable.
8. Drain/reconcile pending provider work, notify customers, and monitor before lifting controls.

## DR strategy and tests

The default is backup-and-restore with a pilot-light recovery region for production. Active-active financial posting is not enabled without a consistency design. Test quarterly: Terraform rebuild, RDS failover/PITR, S3 restore, Redis failover, provider outage/queue recovery, DNS shift, and reconciliation. Record measured RTO/RPO and return-to-primary steps.
