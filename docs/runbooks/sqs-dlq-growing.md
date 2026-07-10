# Runbook: SQS DLQ growing

**Severity:** SEV-1 for financial/provider queues; SEV-2 otherwise. **Alerts:** DLQ visible messages >0, oldest message age, queue backlog.

## Immediate action

Stop blind redrive, identify queue/message type, and page the owning service. Preserve message IDs and correlation IDs without exposing payload secrets.

## Diagnosis

Inspect consumer errors, visibility timeout, poison-message pattern, deployment changes, queue age, and duplicate/idempotency behavior.

## Safe remediation / rollback

Fix the consumer, deploy/rollback, then redrive a bounded sample using the original message ID. Verify idempotent handling before bulk redrive; retain irrecoverable messages for manual review.

## Customer communication

Notify only affected customers after determining whether processing is delayed; never ask them to retry money operations prematurely.

## RCA questions

Why was the message poison? Was DLQ alerting immediate? Did redrive preserve idempotency and ordering?
