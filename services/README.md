# Services

## Purpose

Contains deployable backend services and the admin dashboard for the wallet platform.

## Owner

Platform engineering, with each child service owned by its bounded-context team.

## What Should Go Inside

- Service source code
- Service-specific tests
- Service API definitions
- Service migrations when owned locally
- Service runbooks and operational notes

## What Should Not Go Inside

- Shared libraries that belong in `packages/`
- Terraform infrastructure modules
- Cross-service tests
- Secrets or environment-specific credentials

