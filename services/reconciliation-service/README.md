# Reconciliation Service

## Purpose

Owns transaction reconciliation, settlement reconciliation, ledger reconciliation, exception workflows, and finance exports.

## Owner

Finance operations team.

## What Should Go Inside

- Provider report ingestion
- Internal/external matching
- Exception workflows
- Settlement reports
- Suspense account reporting
- Finance close jobs

## What Should Not Go Inside

- Direct mutation of posted ledger entries
- Provider callback serving
- Admin actions without audit trail
- Customer-facing transaction initiation

