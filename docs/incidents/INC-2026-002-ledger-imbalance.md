# INC-2026-002 — Ledger imbalance alert

- **Severity/status:** SEV-1 / Resolved (mock)
- **Commander/communications:** Finance-ops lead / Incident communications
- **Detected:** 2026-07-10 11:04 UTC
- **Impact:** One batch failed balance validation; customer balances were not changed.
- **Alerts:** ledger balance invariant, transaction posting failures
- **Runbook:** [Ledger imbalance](../runbooks/ledger-imbalance.md)

## Timeline and actions

11:04 posting paused; 11:07 affected batch isolated and read-only queries run; 11:16 missing entry identified; 11:25 approved compensating transaction prepared; 11:38 maker-checker approval completed; 11:45 posting resumed. No direct balance edits or destructive SQL were used.

## Customer communication

Support receives a status note only if customer-visible transactions are delayed; never disclose internal ledger details.

## Close criteria

All affected transactions reconciled, invariant green for two checks, adjustment audited, and RCA owner assigned.
