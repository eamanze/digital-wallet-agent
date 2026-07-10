# RCA Docs

## Purpose

Stores root cause analyses for production incidents and major simulations.

## Owner

SRE, incident commanders, and service owners.

## What Should Go Inside

- Incident summaries
- Impact analysis
- Timelines
- Root causes
- Corrective actions

## What Should Not Go Inside

- Blame-focused notes
- Secrets
- Raw PII
- Untracked follow-up commitments
# Root-cause analysis

- [RCA template](template.md)
- [Sample provider-timeout RCA](RCA-2026-001-provider-timeout.md)

Complete an RCA for every SEV-1/SEV-2 incident and recurring SEV-3 incident. Focus on system causes and actionable controls; do not include secrets, full account identifiers, PINs, OTPs, or tokens.
