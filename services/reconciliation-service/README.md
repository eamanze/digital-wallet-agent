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

## API and behavior

`POST /reconciliation/runs` imports a provider CSV or JSON settlement file, creates a batch, normalizes records, compares them with internal transactions and ledger postings, creates typed exceptions, and stores a reproducible CSV report. It detects missing provider/internal records, amount mismatches, duplicate references, and stale pending transactions.

`GET /reconciliation/runs/{id}/exceptions` and `/report` expose finance results. Critical exceptions can emit a manual-review event. This service never edits or reverses ledger records; corrections require approved adjustment transactions and are separately audited.

Provider-specific formats are handled by the parser and normalized record model. Run with `npm run start:reconciliation` (port `3013`).
