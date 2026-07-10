# Secrets management

Production secrets are stored per environment in AWS Secrets Manager encrypted with a dedicated KMS key. ECS task roles receive only the specific secret ARNs needed by that service. Applications load secrets at startup or through a controlled sidecar; values are never emitted in logs, Terraform outputs, images, or CI console output.

Required secrets include database credentials, JWT signing keys, provider API/webhook credentials, notification credentials, and admin bootstrap material. Rotate provider/webhook keys and signing keys on a documented schedule; use overlapping key IDs for zero-downtime rotation. Revoke and investigate on suspected exposure. Local `.env` values are development-only and must never be promoted.
