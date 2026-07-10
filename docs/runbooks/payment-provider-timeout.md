# Runbook: Payment provider timeout

**Severity:** SEV-2; SEV-1 if debits or callbacks are affected broadly. **Alerts:** provider timeout count, circuit open, pending age.

## Immediate action

Open/confirm provider incident, stop unsafe retries, and keep transaction status pending/unknown.

## Diagnosis

Check provider latency/status page, circuit breaker, request idempotency/reference, callback queue, and status polling results.

## Safe remediation / rollback

Poll with the same provider reference, retry only idempotent operations with bounded backoff, and keep ledger unposted until verified success. Rollback faulty adapter releases, not provider records.

## Customer communication

“The payment provider is taking longer than expected. Please do not retry; your transaction remains protected.”

## RCA questions

Was timeout bounded? Did the circuit open? Were unknown outcomes reconciled later?
