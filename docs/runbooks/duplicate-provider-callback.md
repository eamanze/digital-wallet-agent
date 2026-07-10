# Runbook: Duplicate provider callback

**Severity:** SEV-1 if a duplicate posting is possible; otherwise SEV-2. **Alerts:** duplicate callback counter, provider callback burst, ledger posting duplicate conflict.

## Immediate action

Do not replay callbacks manually or post a ledger entry. Page transaction, payment-integration, ledger, and reconciliation owners; identify affected provider references.

## Diagnosis

Check callback ID/payload hash, provider attempt idempotency key, ledger journal idempotency key, transaction state, and whether more than one journal exists. Compare provider settlement records.

## Safe remediation / rollback

Use callback deduplication and ledger idempotency to replay safely. If duplicate money movement occurred, stop further processing, open a finance incident, and create an approved compensating journal. Never delete the original record.

## Customer communication

Do not disclose internal callback details. Contact only affected customers with a corrected balance/status after finance confirms the remediation.

## RCA questions

Why did deduplication fail? Was the callback ID stable? Did database uniqueness and ledger idempotency hold? Were alerts and reconciliation timely?
