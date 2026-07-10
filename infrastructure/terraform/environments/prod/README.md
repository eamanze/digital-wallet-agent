# Production Environment

## Purpose

Defines production infrastructure for the wallet platform.

## Owner

Cloud platform engineering with security approval.

## What Should Go Inside

- Production Terraform root configuration
- Multi-AZ production resources
- Production tagging and guardrails
- Backup, monitoring, and security baselines

## What Should Not Go Inside

- Plaintext secrets
- Destructive changes without approved migration plans
- Terraform state files
- Non-production shortcuts

