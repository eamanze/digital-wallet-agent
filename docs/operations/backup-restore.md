# Backup and restore

## Policy

RDS uses encrypted automated backups and PITR. Dev retains 7 days; staging 14 days; production 35 days, plus encrypted manual snapshots before migrations. Production snapshots are copied to a separate recovery account/region according to regulatory and budget requirements. S3 KYC/report buckets use KMS encryption, versioning, lifecycle expiration for non-current versions, and optional cross-region replication for critical records. Terraform state uses a versioned, locked, private backend.

## RDS restore procedure

1. Declare incident and freeze risky writes through the approved transaction control.
2. Identify the recovery timestamp/snapshot and obtain finance/compliance approval.
3. Restore to an isolated private subnet with a new security group; never overwrite the source first.
4. Apply compatible migrations and rotate the restored database credentials.
5. Validate row counts, ledger balance invariants, transaction idempotency records, audit chain, and reconciliation state.
6. Point a staging service at the restored endpoint and run smoke/contract tests.
7. Promote via approved DNS/service configuration, monitor, and retain the original for evidence.

## S3 restore

Restore the exact object version, verify checksum and KMS access, preserve metadata, and record an audit event. Do not make KYC documents public.

## Test cadence

Perform quarterly snapshot/PITR and S3 version restore tests; record RTO/RPO, defects, and evidence in an RCA or change ticket.
