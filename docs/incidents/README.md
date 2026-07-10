# Incident Docs

## Purpose

Stores incident response plans, simulation plans, and active incident templates.

## Owner

SRE and incident management team.

## What Should Go Inside

- Incident simulation plans
- Response procedures
- Communication templates
- Severity definitions
- Game day records

## What Should Not Go Inside

- Secrets
- Customer PII
- Direct database mutation steps without controls
- Informal notes that should become RCAs
# Incident management and simulations

Use the [runbooks](../runbooks/README.md) for live response. These mock tickets and exercises are safe, non-production scenarios for on-call training.

## Mock tickets

- [INC-2026-001 — provider timeout](INC-2026-001-provider-timeout.md)
- [INC-2026-002 — ledger imbalance alert](INC-2026-002-ledger-imbalance.md)
- [INC-2026-003 — reconciliation mismatch](INC-2026-003-reconciliation-mismatch.md)

## Simulation catalogue

See [incident simulations](simulations.md). Every exercise must have an incident commander, communications owner, explicit abort criteria, and a cleanup/verification step. Never inject faults into production without an approved change and rollback plan.

## Ticket template

Copy a mock ticket and record ID, severity, status, commander, detection time, impact, alerts, timeline, actions, customer communication, linked runbook, and close criteria. Link the completed RCA before closing a SEV-1/SEV-2 incident.
