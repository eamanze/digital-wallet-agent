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

## API and security behavior

Admin login requires a password and MFA code. Access tokens carry admin roles and every endpoint enforces least-privilege permissions. `super_admin` is reserved for exceptional administration and should not be used for daily operations.

Read APIs expose masked operational data for users, transactions, ledger journals, fraud cases, reconciliation exceptions, and audit logs. Sensitive changes are submitted through `POST /admin/actions` and require a different checker at `/admin/approvals/{id}/approve` or `/reject`; approval emits a command event for the owning service rather than directly editing ledger data.

All login, searches, action requests, approvals, and exports are audit-recorded. Run with `npm run start:admin` (port `3014`).
