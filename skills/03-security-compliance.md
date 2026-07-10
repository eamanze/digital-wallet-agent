# Skill 03 — Security and Compliance

## Purpose

Implement production-grade security, privacy, access control, secrets management, encryption, fraud-aware controls, and auditability for a Digital Wallet / Mobile Money platform.

## When to Use This Skill

Use this skill when working on:

- Authentication security
- MFA/OTP
- Transaction PIN
- Device fingerprinting
- Secrets management
- IAM policies
- Encryption
- Data protection
- Audit logging
- Admin access
- Compliance documentation
- Threat modeling
- Payment processor/card/tokenization boundaries

## Security Baseline

The platform handles financial data and sensitive user identity data. Treat it as a high-risk workload.

Mandatory controls:

- MFA for sensitive actions
- Transaction PIN for money movement
- Device fingerprinting
- OTP throttling
- Login throttling
- Rate limiting
- Password hashing with Argon2id or bcrypt
- Refresh token rotation
- Short-lived access tokens
- Secrets Manager for secrets
- KMS encryption
- TLS everywhere
- IAM least privilege
- Audit logs
- Admin maker-checker
- PII masking
- WAF protection
- Vulnerability scanning
- Incident response runbooks

## Threat Model Areas

Create a threat model for:

1. Account takeover
2. SIM swap / OTP compromise
3. Device theft
4. Brute-force PIN attempts
5. Credential stuffing
6. Fake KYC identities
7. Duplicate provider callbacks
8. Insider admin abuse
9. Ledger tampering
10. Reconciliation manipulation
11. API abuse and bot traffic
12. Secrets leakage
13. PII exposure in logs
14. Payment provider spoofing
15. Webhook replay attacks
16. Privilege escalation in cloud IAM
17. Container image compromise
18. CI/CD credential compromise
19. Data exfiltration from S3/RDS/OpenSearch
20. Denial of service

## Authentication Security

Requirements:

- Passwords hashed with Argon2id or bcrypt.
- Enforce password strength policy.
- MFA for login or risky login.
- OTP expiry between 3 and 10 minutes depending on risk policy.
- OTP retry limit.
- OTP resend cooldown.
- Login lockout or progressive delay.
- Refresh token rotation.
- Token revocation on password/PIN/device changes.
- Device trust scoring.
- Suspicious login notification.

## Transaction PIN Security

Requirements:

- PIN must be hashed separately from password.
- PIN verification attempts must be throttled.
- PIN reset must require strong re-authentication.
- PIN failure should create fraud/audit events.
- Never log PIN values.
- Never expose PIN validation reason to attackers.

## Device Fingerprinting

Capture risk signals such as:

- Device ID
- OS/browser
- App version
- IP address
- Geo approximation
- SIM/network where legally and technically appropriate
- Jailbreak/root signals where available
- First-seen timestamp
- Last-seen timestamp
- Trust status

Do not use device fingerprinting as the only security control. Use it as a risk signal.

## Rate Limiting

Apply rate limits at:

- API Gateway/WAF
- Auth service
- OTP endpoints
- Transaction PIN endpoint
- Transfer initiation
- KYC upload
- Provider callback endpoints

Use Redis for service-level counters with TTL.

## Secrets Management

Use Secrets Manager for:

- Database credentials
- Provider API keys
- Webhook secrets
- JWT signing keys or private key references
- Notification provider credentials
- Admin bootstrap secrets

Rules:

- Rotate secrets where possible.
- Restrict access by IAM task role.
- Do not print secret values.
- Do not expose secrets in Terraform outputs.
- Use separate secrets per environment.

## Encryption

Use KMS for:

- RDS encryption
- S3 bucket encryption
- Secrets Manager encryption
- OpenSearch encryption
- EBS volumes where applicable
- Backup encryption

Use TLS for:

- Public APIs
- Service-to-service calls
- Database connections
- Redis connections where supported
- Provider integrations

## PII Data Classification

Classify and protect:

| Data | Classification | Handling |
|---|---|---|
| Name | PII | Mask in logs |
| Phone | PII | Mask in logs; verify ownership |
| Email | PII | Mask where possible |
| BVN/NIN/National ID | Sensitive PII | Encrypt/tokenize; never log |
| KYC document | Sensitive PII | Store in private KMS-encrypted S3 |
| Selfie/biometric | Highly sensitive | Strong access control and retention policy |
| Card data | PCI-sensitive | Do not store raw card data; use provider tokenization |
| OTP | Secret | Never log; short TTL |
| Transaction PIN | Secret | Hash only; never log |
| Access token | Secret | Never log |

## Admin Security

Admin dashboard must include:

- MFA
- RBAC
- Least privilege roles
- Maker-checker for sensitive actions
- Session timeout
- IP allowlist or zero-trust access where appropriate
- Audit log for every action
- Reason/comment for manual overrides
- Export controls
- Read-only finance/compliance roles

Sensitive actions requiring maker-checker:

- User account freeze/unfreeze
- Limit override
- Fee rule change
- Manual transaction status update
- Manual reversal
- KYC override
- Provider configuration change
- Admin role assignment

## Audit Logging

Audit events must include:

```json
{
  "audit_id": "uuid",
  "actor_type": "user|admin|system|provider",
  "actor_id": "id",
  "action": "wallet.transfer.initiated",
  "resource_type": "transaction",
  "resource_id": "txn_123",
  "ip_address": "masked-or-classified",
  "device_id": "device_123",
  "result": "success|failed|blocked",
  "reason": "optional",
  "correlation_id": "uuid",
  "created_at": "timestamp"
}
```

Audit logs must be tamper-evident or immutable where possible.

## Webhook Security

Provider callbacks must:

- Validate signature
- Validate timestamp
- Reject replayed events
- Use idempotency/deduplication
- Verify provider reference
- Normalize status
- Never trust callback alone for final settlement when provider reports are required

## Security Testing Requirements

CI/CD must run:

- SAST
- Dependency scanning
- Secret scanning
- Container scanning
- IaC scanning
- API security tests
- Authentication abuse tests
- Rate limit tests
- Authorization tests

## Compliance Deliverables

Produce:

- Threat model
- PII data map
- Encryption matrix
- Access control matrix
- Secrets inventory
- Audit event catalog
- Admin privilege review checklist
- Data retention policy
- Incident response plan
- Payment card/tokenization architecture note
- KYC document protection policy

## Security Acceptance Criteria

Security is acceptable when:

- No secrets are committed.
- Public APIs are WAF-protected.
- All sensitive APIs require authentication and authorization.
- MFA/PIN/rate limits are implemented.
- PII is masked in logs.
- KMS encryption is used.
- Audit logs are complete.
- Admin actions are maker-checker controlled.
- Provider callbacks are signature-verified and idempotent.
- Security scans pass or exceptions are formally documented.
