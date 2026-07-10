# AWS Terraform infrastructure

Reusable modules cover VPC, ECS Fargate, RDS PostgreSQL, Redis, SQS/DLQs, encrypted S3, KMS, Secrets Manager, IAM, WAF, CloudWatch, ALB, Route53, ACM, and ECR. Environment roots live under `environments/dev`, `staging`, and `prod`.

Use separate AWS accounts and remote state backends per environment. Run `terraform fmt -recursive`, `terraform init`, `terraform validate`, and `terraform plan`. Production requires manual approval, policy scanning (Checkov/tfsec), encrypted state, and tested backup/restore. The sample service map is intentionally empty until immutable ECR image digests are available.
