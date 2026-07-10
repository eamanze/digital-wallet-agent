# Runbook: RDS CPU high

**Severity:** SEV-2; SEV-1 when writes/readiness fail. **Alerts:** RDS CPU >80%, connection exhaustion, query latency.

## Immediate action

Page database and service owners; protect ledger capacity and pause non-critical batch jobs.

## Diagnosis

Check Performance Insights, active queries/locks, connections, CPU by service, storage/replication, recent deploys and migration activity.

## Safe remediation / rollback

Scale/read-replica or instance class through Terraform, terminate only confirmed runaway non-financial queries, reduce traffic with gateway rate limits, and rollback the offending release. Do not kill ledger transactions or alter data manually.

## Customer communication

“Some wallet features may be slower while we restore database capacity.”

## RCA questions

What query or capacity assumption caused saturation? Were connection pools bounded? Did autoscaling and alarms respond?
