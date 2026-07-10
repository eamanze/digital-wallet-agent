# IAM model

Use separate AWS accounts or strongly isolated roles for dev, staging, and production. Human access is federated, MFA-protected, time-bound, and read-only by default. ECS task roles are service-specific; execution roles can pull only their ECR image and write their CloudWatch stream. Data roles grant only required tables/buckets/queues and deny public access. CI uses GitHub/Jenkins OIDC with environment-scoped roles, not long-lived keys.

Break-glass access requires ticket, approval, short session, CloudTrail review, and automatic revocation. No application role may administer IAM, KMS keys, or production networking.
