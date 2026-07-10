# Errors Package

## Purpose

Provides standard error types, public error codes, and safe error response patterns.

## Owner

Platform engineering.

## What Should Go Inside

- Domain-safe error classes
- Public error code catalog
- Retryability markers
- Error serialization helpers

## What Should Not Go Inside

- Raw provider error leakage to users
- Stack traces in public responses
- Secrets or sensitive values
- Service-specific state machines

