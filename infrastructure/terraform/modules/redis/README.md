# Redis Module

## Purpose

Creates ElastiCache Redis resources for ephemeral caches, throttling, and short-lived locks.

## Owner

Cloud platform engineering.

## What Should Go Inside

- Redis subnet groups
- Replication groups
- Encryption and auth settings
- Alarms for memory, CPU, evictions, and connections

## What Should Not Go Inside

- Source-of-truth wallet balances
- Permanent audit records
- Secrets in plaintext
- Business transaction state

