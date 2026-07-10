# SLOs and error budgets

Initial monthly targets:

| Service capability | SLO | Measurement |
|---|---:|---|
| API gateway availability | 99.95% | non-5xx requests / total requests |
| Auth availability | 99.9% | successful health and API requests |
| Wallet transfer availability | 99.9% | completed or explicitly rejected requests; provider wait excluded |
| Ledger posting availability | 99.95% | successful posting requests |
| Transaction history latency | p95 < 800ms | request duration histogram |
| Provider callback processing | 99.9% under 60s | received-to-processed age |
| Notification dispatch | 99.5% under 5m | queued-to-sent age |
| Daily reconciliation | 100% by 06:00 UTC | batch completion timestamp |

Error budgets are 0.05%, 0.1%, or 0.05% respectively for the availability targets. When the budget is exhausted, pause risky production changes, prioritize reliability work, and require an incident review before resuming normal release cadence.

Runbooks are maintained under `docs/runbooks/`; alerts must link to the relevant runbook and include dashboard name, customer impact, first checks, mitigation, rollback, and escalation.
