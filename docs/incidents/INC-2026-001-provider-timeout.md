# INC-2026-001 — Payment provider timeout

- **Severity/status:** SEV-2 / Resolved (mock)
- **Commander/communications:** Payments on-call / Support lead
- **Detected:** 2026-07-10 09:12 UTC
- **Impact:** 18% of withdrawals remained pending for 14 minutes; no duplicate debits observed.
- **Alerts:** provider timeout rate, transaction pending-age SLO
- **Runbook:** [Payment provider timeout](../runbooks/payment-provider-timeout.md)

## Timeline and actions

09:12 alert acknowledged; 09:15 provider health checked and traffic shifted to the approved fallback; 09:22 callbacks reconciled idempotently; 09:26 customer status update sent; 09:30 incident resolved. Verify provider references, ledger entries, and pending queue before replaying anything.

## Customer communication

“Some withdrawals are taking longer than usual. Your funds are protected; we will update the transaction automatically.”

## Close criteria

Timeouts below threshold for 30 minutes, all transactions terminal or tracked, ledger balanced, and RCA approved.
