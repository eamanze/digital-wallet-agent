# KMS Module

## Purpose

Creates and manages KMS keys for encryption at rest.

## Owner

Security and cloud platform engineering.

## What Should Go Inside

- KMS keys and aliases
- Key policies
- Rotation configuration
- Environment-specific encryption boundaries

## What Should Not Go Inside

- Decryption of application data
- Plaintext secrets
- Overly broad key policies
- Application business logic

