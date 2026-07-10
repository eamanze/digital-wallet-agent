# Runbook: User funded but wallet not credited

**Severity:** SEV-1. **Alerts:** provider success without ledger credit, funding reconciliation mismatch.

## Immediate action

Stop duplicate funding retries, preserve provider and transaction references, and page transaction, ledger, payment, and finance owners.

## Diagnosis

Verify provider success/status query, callback signature, callback processing, transaction state, ledger journal, wallet projection, and settlement report. Reconcile provider amount/currency against internal records.

## Safe remediation / rollback

Retry ledger posting with the original idempotency key after verified provider success; refresh wallet projection from ledger. If provider success cannot be verified, leave pending. Never credit by direct wallet update.

## Customer communication

“Your payment was received and is being verified. Do not submit another payment; we will update your wallet after confirmation.”

## RCA questions

Where did the trace stop? Did callback processing or ledger posting fail? Was the projection stale? Why did reconciliation not alert first?
