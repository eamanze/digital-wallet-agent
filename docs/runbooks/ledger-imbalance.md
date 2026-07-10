# Runbook: Ledger imbalance alert

**Severity:** SEV-1. **Alerts:** `ledger_imbalance_attempt_total > 0`, unbalanced posting rejection.

## Immediate action

Stop the affected posting path, page ledger/finance/security owners, and preserve the request, journal, and correlation IDs. Do not bypass validation.

## Diagnosis

Inspect rejected entries, debit/credit totals, currency, account status, deployment SHA, recent configuration, and concurrent posting errors. Confirm no unbalanced journal was committed.

## Safe remediation / rollback

Keep the journal rejected; correct application input or configuration and redeploy through approval. If an invalid journal committed, quarantine affected flows and use an approved compensating journal. Never edit/delete ledger rows.

## Customer communication

Only notify customers if a confirmed transaction was delayed or reversed; do not expose accounting internals.

## RCA questions

Which invariant failed? Was database/application validation bypassed? Did tests and alarms work? Is a migration or config rollback required?
