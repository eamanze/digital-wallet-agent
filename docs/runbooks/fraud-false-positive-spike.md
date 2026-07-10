# Runbook: Fraud false-positive spike

**Severity:** SEV-2; SEV-1 if legitimate money movement is broadly blocked. **Alerts:** fraud block/challenge rate, review backlog, complaint spike.

## Immediate action

Page fraud and product owners; do not disable all fraud controls. Identify the rule, cohort, device/IP region, and release/config version.

## Diagnosis

Compare decision reason codes with confirmed fraud, rule thresholds, new-device/velocity signals, and false-positive samples.

## Safe remediation / rollback

Disable or lower only the offending rule through approved versioned config, route ambiguous cases to review, and preserve audit evidence. Roll back the rule/config, not financial records.

## Customer communication

“Some activity may require an additional security review. We are restoring normal access safely.”

## RCA questions

Was the rule change approved and observable? Were challenge/review paths available? What threshold evidence supports the fix?
