# Terraform Environments

## Purpose

Contains environment-specific Terraform root modules.

## Owner

Cloud platform engineering.

## What Should Go Inside

- Dev, staging, and production root configurations
- Environment-specific variable definitions
- Backend references
- Approved environment overrides

## What Should Not Go Inside

- Shared reusable modules
- Secrets
- Generated plans or state
- One-off manual infrastructure changes

