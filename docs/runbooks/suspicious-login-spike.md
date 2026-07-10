# Runbook: Suspicious login spike

**Severity:** SEV-1 if account takeover is suspected; SEV-2 otherwise. **Alerts:** auth failures, OTP failures, new-device events, WAF/rate-limit blocks.

## Immediate action

Enable stricter rate limits/challenge policy, preserve masked IP/device cohorts, and page security/fraud owners. Do not disable MFA.

## Diagnosis

Check login failure dimensions, credential-stuffing patterns, OTP requests, device trust, geolocation, WAF events, and account lockouts.

## Safe remediation / rollback

Block abusive IP/device fingerprints, revoke suspicious sessions, require MFA, and tune rules through approved config. Roll back only a bad auth release/config.

## Customer communication

“We detected unusual sign-in activity. Some sign-ins may require additional verification.”

## RCA questions

Were tokens/session revocation effective? Did rate limits protect users without broad lockout? Was PII handled safely?
