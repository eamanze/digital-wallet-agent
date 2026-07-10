# Runbook: Transaction stuck in pending

**Severity:** SEV-2; page SEV-1 if money is debited or volume is widespread. **Alerts:** pending age/SLO breach, provider callback delay, transaction pending spike. **Symptoms:** transaction remains `pending_provider` or `under_review` beyond SLA.

## Immediate action

Freeze automated retries for the affected provider/operation, preserve transaction/correlation/provider references, and notify incident command. Do not mark success or failure manually.

## Diagnosis

Check transaction state history, provider attempt/callback records, ledger journal reference, queue age/DLQ, provider status endpoint, and reconciliation dashboard. Compare a small sample across providers and regions.

## Safe remediation / rollback

Poll the provider with the same idempotency reference; replay the callback through the verified callback path. If status is unknown, keep pending and create a reconciliation exception. Roll back only application code/configuration, never the financial record; use a compensating reversal after confirmed outcome.

## Customer communication

“Your transaction is still being processed. We have not asked you to retry. We will update you when the provider confirms the final status.”

## RCA questions

Which state transition or callback failed? Was money posted? Were retries idempotent? Did alerts fire within the SLO? What prevents recurrence?
