# Runbook: User debited but provider failed

**Severity:** SEV-1. **Alerts:** provider failed after debit, reversal backlog, suspense balance increase.

## Immediate action

Stop retries for the affected operation, identify every transaction and ledger journal, and page finance/ledger incident owners. Do not mutate balances.

## Diagnosis

Verify provider final status independently, internal transaction state, debit journal, holds, fee entries, callback evidence, and reconciliation result. Determine whether the provider truly failed or is unknown.

## Safe remediation / rollback

For confirmed failure, request an approved ledger reversal/compensating journal and release any hold. For unknown status, keep pending until provider verification/reconciliation. Roll back only the faulty deployment, not data.

## Customer communication

“We could not complete the provider operation. Your funds are protected while we verify the outcome; we will confirm the reversal or completion.”

## RCA questions

Why was debit allowed before final provider certainty? Were holds and reversal policies followed? Was provider timeout classified correctly?
