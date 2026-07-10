# Runbook: Redis unavailable

**Severity:** SEV-2; SEV-1 for auth or transaction safety impact. **Alerts:** Redis errors/latency, evictions, replication failure.

## Immediate action

Confirm multi-AZ/cache status and fail closed for security controls; do not bypass rate limits, PIN throttles, or idempotency protections.

## Diagnosis

Check ElastiCache events, connectivity/security groups, TLS/auth failures, CPU/memory/evictions, and service error logs.

## Safe remediation / rollback

Fail over or restore Redis via AWS, restart affected tasks only after dependency recovery, and use database-backed state where designed. Never use Redis as balance or ledger truth.

## Customer communication

“Sign-in or transaction attempts may be temporarily unavailable while security services recover.”

## RCA questions

Was degraded mode safe? Were counters lost? Were connection timeouts and alarms correctly configured?
