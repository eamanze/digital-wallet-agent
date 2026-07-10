# Runbook: Failed deployment rollback

**Severity:** SEV-1 for financial/auth services; SEV-2 otherwise. **Alerts:** ECS unhealthy tasks, smoke-test failure, 5xx spike, deployment alarm.

## Immediate action

Stop promotion, record image digest/task definition and migration version, and page release owner.

## Diagnosis

Check ECS stopped reasons, ALB health, logs, dependency readiness, migration compatibility, and deployment diff.

## Safe remediation / rollback

Deploy the last known-good immutable task definition, wait for ECS stability, run smoke tests, and disable feature flags if applicable. Never roll back a schema destructively; use a forward fix if migration ran.

## Customer communication

“We are restoring the previous stable release. Transactions are being reconciled and no customer action is required.”

## RCA questions

Why did tests/smoke checks miss the issue? Was rollback automated and traceable? Were database changes backward-compatible?
