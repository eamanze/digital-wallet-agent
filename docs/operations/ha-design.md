# High-availability design

## Target topology

Production runs the ALB, ECS tasks, Redis replicas, and private app/database subnets across at least two AZs. RDS is Multi-AZ with encrypted storage and automatic failover. SQS is the durability boundary for provider callbacks, notifications, reconciliation, and retryable work; every queue has a DLQ. S3 is regional, versioned, encrypted, and private.

ECS services use minimum two tasks in production, deployment circuit breakers, connection draining, readiness/liveness checks, and autoscaling on CPU, memory, request count, or queue depth. ALB health checks remove unhealthy tasks without taking the service offline. NAT gateways are per-AZ where the availability requirement justifies the cost; otherwise document the single-egress risk.

## Failure handling

Provider timeouts remain pending and retry through queues. Duplicate callbacks are acknowledged idempotently. Consumers use bounded retries and DLQs. Ledger posting is atomic and never bypassed during failover. Redis is a cache/rate-limit dependency: services degrade safely but do not weaken financial controls when it is unavailable.

## Availability objectives

API/auth/transactions: 99.9%; ledger and RDS: 99.95%; notifications: 99.5%; admin: 99.0%. Review quarterly against measured SLOs, traffic, and budget.
