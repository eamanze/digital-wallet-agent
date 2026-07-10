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

