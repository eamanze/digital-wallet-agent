# Skill 09 — Observability, SRE, and Incident Response

## Purpose

Build production-grade observability, alerting, SLOs, runbooks, incident response, and RCA practices for the Digital Wallet / Mobile Money platform.

## When to Use This Skill

Use this skill when working on:

- Logs
- Metrics
- Distributed tracing
- Dashboards
- Alerts
- SLOs
- Runbooks
- Incident simulations
- RCA documents
- On-call readiness
- Production support

## Observability Goals

The team must be able to answer:

1. Is the platform available?
2. Are users able to log in?
3. Are wallet transfers succeeding?
4. Are provider integrations healthy?
5. Are transactions stuck in pending?
6. Are ledger postings balanced?
7. Are reconciliation exceptions increasing?
8. Are fraud rules blocking normal users?
9. Are notifications being delivered?
10. Are infrastructure components healthy?
11. Are costs behaving normally?

## Required Telemetry

Each service must emit:

- Structured JSON logs
- Metrics
- Distributed traces
- Audit events where applicable
- Health and readiness endpoints

Recommended endpoints:

```text
GET /health/live
GET /health/ready
GET /metrics
```

## Logging Standards

Log format:

```json
{
  "timestamp": "2026-06-02T10:00:00Z",
  "level": "INFO",
  "service": "transaction-service",
  "environment": "prod",
  "message": "transaction state changed",
  "request_id": "req_123",
  "correlation_id": "corr_123",
  "transaction_id": "txn_123",
  "state_from": "pending",
  "state_to": "completed"
}
```

Do not log:

- OTP
- Password
- Transaction PIN
- Full token
- Full identity number
- Full card number
- Raw KYC document data
- Provider secret keys

## Metrics Standards

### RED Metrics

For APIs:

- Rate
- Errors
- Duration

### USE Metrics

For infrastructure:

- Utilization
- Saturation
- Errors

### Business Metrics

Track:

- Registrations
- Login success/failure
- KYC approvals/rejections
- Wallet funding success/failure
- Transfer success/failure
- Withdrawal success/failure
- Bill payment success/failure
- Airtime success/failure
- Pending transactions
- Reversals
- Fraud blocks
- Manual review backlog
- Reconciliation exceptions

## Distributed Tracing

Every request should carry:

- trace_id
- span_id
- correlation_id
- request_id
- transaction_id where applicable

Trace critical flows:

- Login
- KYC submission
- Wallet funding
- Transfer
- Withdrawal
- Bill payment
- Airtime purchase
- Provider callback
- Ledger posting
- Reconciliation

## Required Dashboards

### Executive Dashboard

- Active users
- Transaction volume
- Transaction success rate
- Failed transaction rate
- Revenue/fees
- Fraud blocks
- Provider health

### Engineering Dashboard

- API latency
- API error rate
- Service CPU/memory
- DB connections
- Queue depth
- DLQ count
- Redis evictions
- Deployment status

### Finance/Reconciliation Dashboard

- Ledger postings
- Ledger imbalance attempts
- Settlement totals
- Reconciliation matches
- Reconciliation exceptions
- Reversals
- Suspense account balance

### Security Dashboard

- Login failures
- OTP failures
- PIN failures
- New device events
- Admin actions
- WAF blocks
- Suspicious transaction spikes

## Critical Alerts

Immediate page:

- Ledger imbalance detected
- Wallet transfer failure spike
- Funding success but no ledger credit
- RDS unavailable
- Transaction service unavailable
- Auth service unavailable
- Provider callback processing stopped
- DLQ messages for financial workflow
- Reconciliation exception spike
- Unauthorized admin access attempt

Ticket/working-hours alert:

- Notification provider degradation
- OpenSearch indexing delay
- Cost anomaly
- Slow KYC provider
- Increased manual review backlog

## SLO and Error Budget

Define SLOs for:

- Auth availability
- Wallet transfer availability
- Ledger posting availability
- Transaction history latency
- Provider callback processing latency
- Notification dispatch latency
- Reconciliation completion time

Example:

```text
Wallet transfer API: 99.9% monthly availability
Ledger posting API: 99.95% monthly availability
Transaction history: p95 latency < 800ms
```

## Runbook Template

```markdown
# Runbook: <Incident Name>

## Symptoms

## Customer Impact

## Dashboards

## Alerts

## First 5 Minutes

## Diagnosis Steps

## Mitigation Steps

## Rollback Steps

## Escalation

## Verification

## Follow-Up Actions
```

## RCA Template

```markdown
# RCA: <Incident Title>

## Summary

## Impact

## Timeline

## Root Cause

## Contributing Factors

## Detection

## Resolution

## What Went Well

## What Went Wrong

## Action Items

| Action | Owner | Due Date | Status |
|---|---|---|---|
```

## Required Incident Simulations

Simulate and document:

1. API down due to security group rule
2. RDS connection exhaustion
3. Redis outage
4. Queue backlog spike
5. DLQ financial messages
6. Provider timeout
7. Duplicate provider callback
8. Stuck pending transaction
9. Ledger imbalance attempt
10. KYC provider outage
11. SMS provider outage
12. Failed deployment and rollback
13. Failed database migration
14. High CPU in transaction service
15. RDS storage pressure
16. Expired certificate
17. WAF false-positive block
18. Reconciliation mismatch
19. Fraud false-positive spike
20. Cost anomaly

## Required Tests

- Health endpoint returns correct status.
- Readiness fails when critical dependency is unavailable.
- Metrics endpoint exposes service metrics.
- Logs contain correlation_id.
- Sensitive values are not present in logs.
- Traces connect API request to ledger posting.
- Alert fires for DLQ message.
- Alert fires for ledger imbalance attempt.
- Runbook mitigation is tested.

## Common Mistakes to Avoid

- Only monitoring CPU and memory.
- No business metrics.
- Alerts without runbooks.
- Logging sensitive data.
- No correlation ID across services.
- Treating dashboards as production readiness without tested alerts.
- No RCA after incidents.
