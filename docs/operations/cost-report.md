# Monthly cost report

## Sizing assumptions

Dev uses small burstable RDS/Redis nodes, one task where safe, short log retention, and scheduled shutdown. Staging uses Multi-AZ-like topology for release testing. Production uses two or more ECS tasks per service, Multi-AZ RDS/Redis, encrypted backups, queue/DLQ retention, and provider/reconciliation headroom.

## Cost controls

Every resource is tagged `Project`, `Environment`, `Service`, `Owner`, `CostCenter`, `DataClassification`, and `ManagedBy`. Use AWS Budgets/CloudWatch billing alarms, review NAT and data-transfer costs, right-size tasks/RDS/Redis quarterly, apply Savings Plans only to stable production load, expire old logs and S3 versions, and delete unattached EBS/EIPs, stale images, snapshots, and idle dev resources through an approved cleanup ticket.

## Report template

- Total cost by environment:
- Top ten cost drivers:
- Cost by AWS service and application service:
- Month-over-month variance and anomalies:
- Budget/alarm events:
- Optimization recommendations and reliability trade-offs:
- Action, owner, due date, and expected monthly saving:

The Terraform CloudWatch module supports an optional `monthly_budget_usd` alarm. Billing metrics must be enabled in `us-east-1`; alarm actions should target the approved SNS topic.
