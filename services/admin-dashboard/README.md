# Admin Dashboard

## Purpose

Provides secure operational interfaces for support, fraud, finance, compliance, and system administration.

## Owner

Operations platform team.

## What Should Go Inside

- Admin UI
- RBAC-controlled admin APIs if colocated
- Maker-checker workflows
- Manual review interfaces
- Audit-aware support and finance tools

## What Should Not Go Inside

- Direct database mutation that bypasses service APIs
- Direct ledger editing
- Unmasked PII access without role controls
- Secrets or provider credentials

