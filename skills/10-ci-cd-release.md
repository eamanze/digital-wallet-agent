# Skill 10 — CI/CD and Release Engineering

## Purpose

Build production-grade CI/CD pipelines for application services, Terraform infrastructure, container images, database migrations, security scanning, deployments, approvals, smoke tests, and rollback.

## When to Use This Skill

Use this skill when creating or modifying:

- GitHub Actions workflows
- Jenkins pipelines
- Docker builds
- Terraform pipelines
- ECS/EKS deployments
- Database migration pipelines
- Security scanning
- Release approvals
- Rollback workflows

## Release Principles

1. Every deployment must be traceable to commit SHA and image digest.
2. Production deployment requires approval.
3. Rollback must be documented and tested.
4. Database migrations must be safe.
5. Security scans must run before deployment.
6. Infrastructure changes must run through plan and approval.
7. Secrets must not appear in logs.
8. Dev, staging, and production must be separate.
9. Smoke tests must run after deployment.
10. Failed deployments must stop automatically.

## Application Pipeline Stages

Required stages:

```text
checkout
install dependencies
lint
unit tests
sast
secret scan
dependency scan
build container image
container vulnerability scan
push image
contract tests
integration tests
deploy to dev
smoke test dev
deploy to staging
smoke test staging
performance/security tests
manual approval
deploy production
post-deploy smoke test
notify
```

## Terraform Pipeline Stages

Required stages:

```text
checkout
terraform fmt check
terraform validate
tflint
checkov/tfsec
terraform plan
manual approval for prod
terraform apply
post-apply validation
```

## Database Migration Pipeline

Required stages:

```text
migration lint
migration dry run
backup/snapshot check
apply to dev
apply to staging
run compatibility tests
manual approval
apply to prod
post-migration validation
```

Rules:

- Avoid destructive production migrations.
- Use expand-contract pattern.
- Take snapshot before high-risk migration.
- Never combine risky schema migration with risky application deployment without rollback plan.

## Deployment Strategies

Recommended:

- Blue/green deployment for critical services
- Rolling deployment for low-risk stateless services
- Canary deployment for high-risk changes
- Feature flags for product behavior

Minimum production deployment requirements:

- Health checks
- Readiness checks
- Auto rollback or documented rollback
- Deployment alarms
- Versioned image tags
- Immutable image digest

## Jenkinsfile Skeleton

```groovy
pipeline {
  agent any

  options {
    timestamps()
    disableConcurrentBuilds()
  }

  environment {
    APP_NAME = 'wallet-service'
    AWS_REGION = 'eu-west-2'
    IMAGE_TAG = "${env.BUILD_NUMBER}-${env.GIT_COMMIT}"
  }

  stages {
    stage('Checkout') {
      steps { checkout scm }
    }

    stage('Install Dependencies') {
      steps { sh 'make install' }
    }

    stage('Lint') {
      steps { sh 'make lint' }
    }

    stage('Unit Tests') {
      steps { sh 'make test-unit' }
      post { always { junit 'reports/unit/*.xml' } }
    }

    stage('Security Scan') {
      steps {
        sh 'make scan-secrets'
        sh 'make scan-dependencies'
        sh 'make scan-sast'
      }
    }

    stage('Build Image') {
      steps { sh 'docker build -t ${APP_NAME}:${IMAGE_TAG} .' }
    }

    stage('Container Scan') {
      steps { sh 'make scan-container IMAGE=${APP_NAME}:${IMAGE_TAG}' }
    }

    stage('Push Image') {
      steps { sh 'make push-image IMAGE=${APP_NAME}:${IMAGE_TAG}' }
    }

    stage('Deploy Staging') {
      steps { sh 'make deploy ENV=staging IMAGE_TAG=${IMAGE_TAG}' }
    }

    stage('Smoke Test Staging') {
      steps { sh 'make smoke ENV=staging' }
    }

    stage('Approval') {
      steps { input message: 'Deploy to production?' }
    }

    stage('Deploy Production') {
      steps { sh 'make deploy ENV=prod IMAGE_TAG=${IMAGE_TAG}' }
    }

    stage('Smoke Test Production') {
      steps { sh 'make smoke ENV=prod' }
    }
  }

  post {
    failure { sh 'make notify-failure' }
    success { sh 'make notify-success' }
  }
}
```

## GitHub Actions Skeleton

```yaml
name: wallet-service-ci-cd

on:
  push:
    branches: [main]
  pull_request:

jobs:
  test-build-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Install dependencies
        run: make install
      - name: Lint
        run: make lint
      - name: Unit tests
        run: make test-unit
      - name: Secret scan
        run: make scan-secrets
      - name: Dependency scan
        run: make scan-dependencies
      - name: SAST
        run: make scan-sast
      - name: Build image
        run: make build-image
      - name: Container scan
        run: make scan-container
      - name: Push image
        if: github.ref == 'refs/heads/main'
        run: make push-image
```

## Required Quality Gates

A build cannot deploy if:

- Unit tests fail.
- Contract tests fail.
- Critical/high vulnerabilities are unresolved without exception.
- Secret scan fails.
- Terraform validation fails.
- Container image scan has critical vulnerabilities without approved exception.
- Database migration dry run fails.
- Smoke test fails.

## Release Documentation

Each release must capture:

- Release version
- Commit SHA
- Image digest
- Services changed
- Database migrations
- Terraform changes
- Risk level
- Rollback plan
- Approver
- Deployment timestamp
- Post-deploy test result

## Rollback Requirements

Rollback plan must include:

- Previous image digest
- Previous Terraform state/version
- Migration rollback or forward-fix plan
- Feature flag disable steps
- Verification steps
- Communication template

## Required Tests

- Pipeline fails on lint error.
- Pipeline fails on failed unit test.
- Secret scan detects sample secret.
- Terraform plan runs for dev/staging/prod.
- Image is tagged with commit SHA.
- Smoke test validates health endpoint.
- Rollback command works in staging.

## Common Mistakes to Avoid

- Using `latest` image tag in production.
- Deploying without smoke tests.
- Running Terraform apply automatically to production without approval.
- Printing secrets in pipeline logs.
- Not scanning containers.
- No rollback path.
- Mixing manual console changes with Terraform.
