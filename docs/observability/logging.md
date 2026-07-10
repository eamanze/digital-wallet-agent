# Structured logging

All services use Pino JSON logs through `packages/common/src/logger.js`. Logs include service, environment, timestamp, level, message, request ID, correlation ID, trace ID, and span ID when a request logger is used.

Redaction covers authorization headers, passwords, OTPs, PINs, access/refresh tokens, secrets, and nested sensitive fields. Never add raw KYC documents, identity numbers, PANs, or provider credentials to log metadata. CloudWatch log groups retain logs for 90 days in the Terraform baseline; production retention should follow compliance policy.
