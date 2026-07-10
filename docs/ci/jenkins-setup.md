# Jenkins setup

## Agents and tools

Use separate ephemeral agents or labels such as `docker-aws` and `terraform-aws`. Install Node.js 20, Docker, AWS CLI v2, Terraform 1.6+, TFLint, Checkov, tfsec, Trivy, and Gitleaks. Do not run Docker builds on an untrusted shared agent.

## Credentials

Prefer the Jenkins AWS Credentials/STS or OIDC integration over long-lived access keys. Configure these IDs (values are never committed):

- `wallet-aws-oidc`: IAM role assumption for ECR/ECS/Terraform.
- `wallet-aws-region`: non-secret Jenkins string credential or global variable.
- `wallet-ecr-registry`: ECR registry hostname.
- `wallet-tf-state-bucket`: environment-specific encrypted Terraform state bucket.

Create separate IAM roles for CI read/scan, dev deploy, staging deploy, production deploy, and Terraform apply. Production role access should require Jenkins folder permissions and a second approval. Store `DEV_SMOKE_URL`, `PROD_SMOKE_URL`, and `PREVIOUS_TASK_DEFINITION` as protected environment variables; never print tokens or secret values.

## Jobs

- Multibranch Pipeline using `Jenkinsfile` for application validation/build/deploy.
- Separate Pipeline using `Jenkinsfile.terraform` for infrastructure plans/applies.
- Configure production as a protected Jenkins input gate with named approvers.
- Configure staging approval for promotion from dev.
- Configure webhook triggers for pull requests and main branch pushes.

## Pipeline behavior

Images are tagged with commit SHA and build number, never `latest`. ECS waits for stable services and then runs smoke tests. A failed deployment pauses at the rollback stage and restores the previously recorded task definition. Terraform state must use S3 encryption and locking, with separate keys per environment.

## Shared library

The optional library at `ci/jenkins/shared-library` can be configured in Jenkins as a Global Trusted Pipeline Library named `wallet-ci`. Keep reusable steps free of secrets and pass credentials through `withAWS`/`withCredentials` only at the call site.
