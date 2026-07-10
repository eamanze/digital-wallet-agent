# INC-2026-003 — Provider reconciliation mismatch

- **Severity/status:** SEV-2 / Investigating (mock)
- **Commander/communications:** Reconciliation owner / Finance support
- **Detected:** 2026-07-10 15:20 UTC
- **Impact:** Three provider references had amount mismatches; settlement was held.
- **Alerts:** reconciliation exception count, settlement variance
- **Runbook:** [Reconciliation mismatch](../runbooks/reconciliation-mismatch.md)

## Timeline and actions

15:20 batch imported and checksums verified; 15:28 duplicate reference quarantined; 15:40 internal transaction and ledger records compared; 16:05 provider clarification requested. Do not silently modify the ledger; create an approved adjustment only after evidence review.

## Customer communication

Contact only affected customers with a neutral “payment verification is in progress” message.

## Close criteria

Every exception classified, settlement decision approved, customer impact assessed, and RCA linked.
