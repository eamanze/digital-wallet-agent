# GitHub Actions

## Purpose

Stores GitHub Actions workflow definitions and reusable CI templates.

## Owner

Release engineering.

## What Should Go Inside

- Application pipelines
- Terraform pipelines
- Security scan workflows
- Reusable workflow templates

## What Should Not Go Inside

- GitHub secrets in plaintext
- Generated artifacts
- Environment-specific secret values
- Manual deployment notes without pipeline backing
GitHub Actions workflows live in `.github/workflows`:

- `pr-validation.yml` — pull request quality, security, Terraform, and image gates.
- `service-build-test.yml` — matrix service tests and image builds.
- `security.yml` — secret, filesystem, CodeQL, and vulnerability scans.
- `terraform.yml` — environment plans and manually dispatched applies gated by GitHub Environments.
- `migrations.yml` — ordered migration checks and PostgreSQL dry run.
- `deploy.yml` — immutable SHA image build/push, ECS rollout, stable-service wait, and smoke test.
- `rollback.yml` — manually approved ECS task-definition rollback and smoke test.

Configure GitHub Environments named `dev`, `staging`, and `prod`. Store AWS OIDC role ARN, Terraform state bucket, AWS region, smoke-test URL, and deployment settings as environment secrets/variables. Configure required reviewers on `prod`; do not store AWS access keys in repository secrets.
