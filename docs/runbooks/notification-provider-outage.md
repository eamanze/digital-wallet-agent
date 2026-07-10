# Runbook: Notification provider outage

**Severity:** SEV-2; SEV-1 for security/OTP delivery outage. **Alerts:** notification failure rate, queue age, provider circuit open.

## Immediate action

Keep completed financial transactions completed; stop unbounded notification retries and activate approved provider fallback if available.

## Diagnosis

Check provider status, queue age/DLQ, template errors, rate limits, and delivery response codes. Separate OTP/security messages from informational messages.

## Safe remediation / rollback

Retry with bounded backoff, redrive safe jobs idempotently, and rotate provider only through configuration approval. Never include secrets in fallback messages.

## Customer communication

Use in-app notices or support channels; never send OTP/PIN values through an unapproved channel.

## RCA questions

Did notification failure affect money state? Were security messages prioritized? Did DLQs preserve jobs?
