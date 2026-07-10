# Runbook: WAF blocking valid traffic

**Severity:** SEV-2; SEV-1 if authentication or payments are broadly unavailable. **Alerts:** WAF blocked requests, gateway 4xx spike, customer reports.

## Immediate action

Identify the rule and affected route/cohort; do not disable WAF globally.

## Diagnosis

Review sampled WAF logs, request IDs, rule match, geography, payload shape, and recent rule/deployment changes. Confirm no attack pattern is being mistaken for valid traffic.

## Safe remediation / rollback

Add the narrowest tested rule exclusion/rate limit through Terraform, validate in staging, and roll back the WAF change if needed. Keep logging enabled.

## Customer communication

“Some requests are being incorrectly rejected; we are correcting edge protection while keeping the platform secure.”

## RCA questions

Which rule caused the block? Was there a staging test and approval? Did the exception preserve protection?
