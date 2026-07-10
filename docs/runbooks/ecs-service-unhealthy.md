# Runbook: ECS service unhealthy

**Severity:** SEV-1 for gateway/auth/transaction/ledger; SEV-2 for non-critical services. **Alerts:** unhealthy tasks, 5xx spike, readiness failures.

## Immediate action

Check ECS deployment and stop further rollout; preserve image digest and deployment SHA.

## Diagnosis

Inspect task stopped reasons, ALB target health, CloudWatch logs/metrics, secrets/network access, dependency readiness, and recent image/config changes.

## Safe remediation / rollback

Rollback to the last healthy task definition, scale only within approved limits, and redeploy through ECS. Run health and smoke tests before reopening traffic.

## Customer communication

“Some services are temporarily unavailable; transaction state remains protected and pending operations are being checked.”

## RCA questions

Did health checks detect failure? Was the image/config valid? Did deployment alarms and rollback work?
