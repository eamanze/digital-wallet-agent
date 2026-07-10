# Incident simulations

Run in a sandbox or controlled staging environment with synthetic IDs and funds. Capture alert time, acknowledgement, decision log, recovery time, and lessons learned.

| # | Injected scenario | Expected signal and safe outcome |
|---|---|---|
| 1 | Block API-to-RDS security-group traffic | 5xx/DB-latency alarms; fail closed and restore the rule. |
| 2 | Exhaust the RDS connection pool | connection alarm; shed load without data loss. |
| 3 | Stop Redis or revoke its route | cache errors; degrade safely and protect rate limits. |
| 4 | Pause a consumer | queue depth rises; autoscale/restart consumer. |
| 5 | Send poison financial messages | DLQ grows; quarantine and replay only after review. |
| 6 | Delay provider responses | pending-age/timeout alarms; no duplicate posting. |
| 7 | Replay a signed callback | duplicate metric; idempotent 2xx with one ledger effect. |
| 8 | Hold a transaction in pending | pending SLO alert; reconcile or escalate, never guess. |
| 9 | Submit an unbalanced journal | invariant alarm; reject atomically and preserve evidence. |
| 10 | Return KYC provider 5xx | KYC failure alert; retain documents and retry safely. |
| 11 | Fail SMS provider | notification retries/DLQ; financial transaction still completes. |
| 12 | Deploy a deliberately unhealthy image | ECS health alarm; rollback to last known good revision. |
| 13 | Run a migration with a controlled failure | migration alarm; stop rollout and restore from tested backup. |
| 14 | Add CPU load to transaction service | CPU/latency alarms; autoscale and rate-limit. |
| 15 | Fill staging RDS storage | storage alarm; stop growth and expand via approved change. |
| 16 | Present an expired test certificate | TLS alarm; rotate certificate and verify clients. |
| 17 | Add a WAF rule matching normal test traffic | blocked-request alarm; remove rule and add regression test. |
| 18 | Import a mismatched settlement file | exception alarm; hold settlement and open review. |
| 19 | Enable an over-sensitive fraud rule | review/block spike; disable via audited change and backfill decisions. |
| 20 | Create a synthetic cost spike | budget alarm; identify resource and apply approved limits. |

After each exercise, restore configuration, drain test queues, verify ledger invariants, and attach an RCA using the template.
