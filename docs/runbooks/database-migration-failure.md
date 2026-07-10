# Runbook: Database migration failure

**Severity:** SEV-1 for ledger/transaction schema; SEV-2 otherwise. **Alerts:** migration job failure, readiness failure, lock duration, database errors.

## Immediate action

Stop deployment and further migration attempts. Preserve migration number, logs, database snapshot ID, and transaction impact.

## Diagnosis

Check migration transaction state, locks, schema version, dependent service compatibility, backup/PITR status, and whether any statements committed.

## Safe remediation / rollback

Restore/forward-fix only through reviewed SQL. Use a snapshot before high-risk correction; do not run destructive rollback against production ledger data. Deploy compatible application versions and validate reads/writes.

## Customer communication

“A maintenance change is taking longer than expected. Some features may be temporarily unavailable while financial records remain protected.”

## RCA questions

Was the migration expand-contract and tested on realistic data? Were locks bounded? Was restore/forward-fix documented and tested?
