# Secrets Manager Module

## Purpose

Creates secret containers and access policies for managed credentials.

## Owner

Security and cloud platform engineering.

## What Should Go Inside

- Secret metadata
- Rotation configuration
- IAM access policies
- Environment-specific secret naming

## What Should Not Go Inside

- Secret values committed to Git
- Terraform outputs exposing secrets
- Application config defaults containing credentials
- Broad wildcard access policies

