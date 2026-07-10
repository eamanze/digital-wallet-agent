# Runbooks

## Purpose

Contains operational runbooks for incidents, maintenance, recovery, and support workflows.

## Owner

SRE and service owners.

## What Should Go Inside

- Alert response steps
- Diagnosis steps
- Mitigation and rollback steps
- Escalation paths
- Verification checks

## What Should Not Go Inside

- Secrets
- Manual ledger mutation instructions that bypass reversal rules
- Unsupported production shortcuts
- Unreviewed emergency access steps
# Production runbooks

Runbooks are for trained on-call responders. Preserve correlation IDs, transaction references, provider references, and timestamps. Never log or paste PINs, OTPs, tokens, raw identity numbers, card data, or provider secrets. Do not manually edit ledger or transaction records; use the owning service and approved compensating workflows.

Runbooks:

1. [Transaction pending](transaction-stuck-pending.md)
2. [Duplicate provider callback](duplicate-provider-callback.md)
3. [Debited but provider failed](debited-provider-failed.md)
4. [Funding not credited](funded-wallet-not-credited.md)
5. [Ledger imbalance](ledger-imbalance.md)
6. [RDS CPU high](rds-cpu-high.md)
7. [Redis unavailable](redis-unavailable.md)
8. [SQS DLQ growing](sqs-dlq-growing.md)
9. [ECS unhealthy](ecs-service-unhealthy.md)
10. [Provider timeout](payment-provider-timeout.md)
11. [Fraud false positives](fraud-false-positive-spike.md)
12. [Reconciliation mismatch](reconciliation-mismatch.md)
13. [KYC upload failure](kyc-document-upload-failure.md)
14. [Notification outage](notification-provider-outage.md)
15. [Suspicious login spike](suspicious-login-spike.md)
16. [WAF false positive](waf-valid-traffic-blocked.md)
17. [Deployment rollback](failed-deployment-rollback.md)
18. [Migration failure](database-migration-failure.md)
