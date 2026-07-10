# Security controls

| Area | Implemented baseline | Verification |
|---|---|---|
| Authentication | short-lived access tokens, refresh rotation, MFA/risky-login step-up | auth abuse tests |
| Money movement | transaction PIN, idempotency key, limits/fraud checks before posting | transaction contract tests |
| Throttling | gateway, login, OTP, PIN, callback and transaction limits with Redis TTL counters | rate-limit tests |
| Device/IP | hashed device fingerprint plus replaceable IP reputation adapter | fraud decision audit |
| Encryption | KMS-backed RDS/Redis/S3/secrets; TLS at edge and service/provider boundaries | Terraform/SSL checks |
| Access | service task roles and database roles are least privilege; production approvals | IAM review |
| Edge | Helmet headers, WAF managed rules, known-bad-inputs and per-IP rate rule | WAF logs |
| Privacy | PII masking/redaction and private encrypted buckets | log and bucket tests |
| Supply chain | npm audit, Trivy, Gitleaks, CodeQL, Checkov/tfsec/tflint | CI required checks |
| Audit | append-only events with actor, resource, result, reason and correlation ID | audit API tests |

Controls fail closed for missing credentials, invalid signatures, missing idempotency keys, and unapproved administrative actions.
