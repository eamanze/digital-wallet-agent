# Security threat model

## Scope and trust boundaries

Mobile/web clients cross the WAF/API gateway boundary; services communicate over private TLS; providers cross an authenticated webhook boundary; operators cross the MFA/RBAC/admin boundary. Ledger and audit stores are append-only trust anchors.

| Threat | Abuse path | Required controls | Detection |
|---|---|---|---|
| Account takeover/SIM swap | credential stuffing or stolen OTP | Argon2id/bcrypt, MFA, OTP TTL/cooldown, login throttling, device/IP risk | fraud and auth alerts |
| PIN brute force | repeated transfer attempts | separate PIN hash, progressive lockout, velocity limits | `pin.failure` audit |
| Webhook replay/spoofing | forged or repeated callback | signature/timestamp verification, provider reference lookup, idempotency | duplicate callback metric |
| Insider abuse | admin override | least privilege, MFA, maker-checker, immutable audit | admin action alerts |
| Ledger tampering | direct DB mutation | ledger constraints, restricted DB role, reconciliation, compensating entries only | balance invariant |
| Data exfiltration | leaked token, logs, S3/RDS | masking, KMS, private S3, TLS, secret scanning | CloudTrail/GuardDuty |
| CI/container compromise | malicious dependency/image | lockfiles, SCA, SAST, Gitleaks, Trivy, signed promotion | CI failures |
| API abuse/DoS | bot traffic | WAF managed rules/rate rule, gateway limits, Redis throttles | 4xx/5xx and WAF metrics |

Residual risk is reviewed quarterly and after each SEV-1 incident. Never store raw card data, PINs, OTPs, tokens, or identity numbers in logs.
