# Packages

## Purpose

Contains shared internal libraries used by services.

## Owner

Platform engineering.

## What Should Go Inside

- Shared contracts
- Common utilities
- Configuration loaders
- Logging and tracing helpers
- Standard errors and validation helpers

## What Should Not Go Inside

- Business workflows owned by services
- Service-specific database models
- Secrets or environment credentials
- Code that creates cross-service database coupling

