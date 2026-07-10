# Staging Environment

## Purpose

Defines staging infrastructure that closely mirrors production for release validation.

## Owner

Cloud platform engineering.

## What Should Go Inside

- Staging Terraform root configuration
- Production-like topology
- Release validation resources
- Provider sandbox wiring

## What Should Not Go Inside

- Production secrets
- Real customer PII
- Experimental resources without ownership
- Terraform state files

