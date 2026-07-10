# Security test checklist

- [ ] Password/PIN hashes use adaptive hashing and are never logged.
- [ ] MFA, OTP expiry, resend cooldown, retry limit, and login/PIN lockout tested.
- [ ] Missing/invalid bearer token, PIN, and idempotency key rejected.
- [ ] Device fingerprint and IP risk affect fraud decisions without being sole controls.
- [ ] Provider signatures, timestamps, references, and callback deduplication tested.
- [ ] PII/token/secret redaction tested in logs and audit metadata.
- [ ] RBAC denies cross-role access; maker-checker prevents self-approval.
- [ ] TLS, secure headers, private database/Redis, S3 public-block and KMS encryption verified.
- [ ] SAST, dependency, secret, container and IaC scans pass in CI.
- [ ] Production Terraform requires approval, deletion protection and encrypted backups.
- [ ] Rate limits and WAF rules tested for false positives and bypass attempts.
- [ ] Restore, key rotation, credential revocation and break-glass procedures exercised.
