# RCA-2026-001 — Provider timeout (sample)

**Summary:** A provider latency event left withdrawals pending for 14 minutes. Transaction state and ledger idempotency worked; no duplicate debit occurred.

**Root cause:** Provider response latency exceeded the client timeout while callback delivery was delayed. Contributing factors were insufficient provider-latency alerting and an under-sized pending-reconciliation worker.

**Impact:** 18% of withdrawals in the window were pending; all reached a terminal state after reconciliation.

**Corrective actions:** lower alert threshold, autoscale reconciliation workers on pending age, add provider failover drill, and publish a customer status template. Owners and due dates are tracked in INC-2026-001.
