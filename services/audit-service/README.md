# Audit Service

## Purpose

Owns immutable or tamper-evident audit events for security, financial workflows, admin actions, data access, and compliance search.

## Owner

Security and compliance engineering team.

## What Should Go Inside

- Audit event ingestion
- Audit event schema
- Compliance search projections
- Archive/export pipelines
- Tamper-evidence controls

## What Should Not Go Inside

- Mutable transaction state
- Ledger posting logic
- User password or PIN handling
- Operational business workflows

## API and controls

`POST /audit/events` accepts security, financial, provider, and admin events from authenticated service/admin callers. Every event requires a correlation ID and is recursively redacted before persistence. `GET /audit/events` and `GET /audit/events/{id}` are restricted to auditors, compliance roles, and system administrators and support filtering by actor, action, service, event, resource, and date range.

Audit rows are hash-chained and protected by database triggers that reject updates and deletes. Audit data is append-only; normal users have no modification or search access. Before/after metadata is supported for configuration and admin changes. The service never stores secrets, PINs, OTPs, tokens, raw identity numbers, or document contents.

Run with `npm run start:audit` (port `3012`).
