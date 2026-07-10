# Runbook: Reconciliation mismatch

**Severity:** SEV-1 for amount/ledger mismatch; SEV-2 for isolated status mismatch. **Alerts:** exception spike, settlement missing, suspense growth.

## Immediate action

Freeze manual adjustments, assign finance owner, preserve provider file checksum and batch ID, and stop no ledger records automatically.

## Diagnosis

Compare internal transaction, provider reference/status, ledger journal, amount/currency, callback, and settlement report. Check duplicate references and time-zone windows.

## Safe remediation / rollback

Create an exception with evidence, query provider status, and use approved adjustment/reversal workflows only. Never close an exception without evidence or edit ledger rows.

## Customer communication

Contact affected users only after finance confirms whether funds are pending, completed, or reversed.

## RCA questions

Was the source file complete and immutable? Which match key failed? Did the report run before the SLA?
