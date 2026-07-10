# Logger Package

## Purpose

Provides structured logging standards for all services.

## Owner

SRE and platform engineering.

## What Should Go Inside

- JSON logger setup
- Redaction utilities
- Correlation/request ID enrichment
- Service log conventions

## What Should Not Go Inside

- Logging of OTPs, PINs, passwords, full tokens, or full identity numbers
- Service-specific business logic
- Audit log source-of-truth storage
- Secrets

