# Skill 07 — Fraud, Limits, and Fees

## Purpose

Implement fraud detection, transaction risk controls, KYC-tier limits, velocity checks, transaction fees, commissions, and manual review workflows for the Digital Wallet / Mobile Money platform.

## When to Use This Skill

Use this skill when working on:

- Fraud rules
- Risk scoring
- Velocity checks
- Account restrictions
- Transaction limits
- KYC-tier limits
- Fee calculation
- Commission calculation
- Manual review queue
- Suspicious activity detection

## Risk Decision Model

Recommended decision outcomes:

```text
allow
challenge
manual_review
block
restrict_account
```

Example rules:

- Allow low-risk known-device transfer under threshold.
- Challenge new-device transfer above threshold.
- Manual review high-value withdrawal to new beneficiary.
- Block transaction with impossible velocity or sanctioned/blocked identity.
- Restrict account on confirmed fraud pattern.

## Fraud Signals

Capture these signals where available and lawful:

- User age on platform
- KYC tier
- KYC status
- Device trust status
- New device
- IP reputation
- Geo anomaly
- Transaction amount
- Transaction frequency
- Daily/monthly volume
- New beneficiary
- Beneficiary risk score
- Failed PIN attempts
- Failed login attempts
- OTP failures
- Chargeback/dispute history
- Provider failure patterns
- Account restriction history

## Velocity Checks

Examples:

```text
max_transfer_count_per_5_minutes
max_transfer_value_per_5_minutes
max_daily_transfer_value
max_monthly_transfer_value
max_new_beneficiary_transfer_value_24h
max_pin_failures_per_hour
max_otp_requests_per_hour
max_withdrawals_per_day
```

Use Redis for fast counters, but persist important enforcement decisions in the database/audit system.

## KYC-Tier Limits

Example configurable model:

| Tier | Daily Transfer | Monthly Transfer | Max Balance | Features |
|---|---:|---:|---:|---|
| Tier 0 | ₦0 | ₦0 | ₦0 | Register only |
| Tier 1 | ₦50,000 | ₦300,000 | ₦300,000 | Basic wallet |
| Tier 2 | ₦500,000 | ₦5,000,000 | ₦2,000,000 | Full wallet |
| Tier 3 | Configurable | Configurable | Configurable | Business/enhanced |

Values are examples. Make actual values configurable and aligned with business/regulatory rules.

## Limits Service Requirements

Limits Service must:

1. Load active limit configuration.
2. Evaluate user KYC tier.
3. Evaluate transaction type.
4. Evaluate channel.
5. Evaluate currency.
6. Evaluate daily/monthly/current window usage.
7. Return allow/deny with reason.
8. Publish limit decision event.
9. Support admin-approved limit changes.
10. Audit all configuration changes.

## Fraud Service Requirements

Fraud Service must:

1. Accept transaction context.
2. Evaluate deterministic rules.
3. Optionally call ML/risk model.
4. Return risk score and decision.
5. Explain decision reason codes.
6. Create manual review item where needed.
7. Publish fraud decision event.
8. Audit high-risk decisions.

Example response:

```json
{
  "decision": "challenge",
  "risk_score": 72,
  "reason_codes": [
    "NEW_DEVICE",
    "HIGH_VALUE_TRANSFER",
    "NEW_BENEFICIARY"
  ]
}
```

## Fee Service Requirements

Fee Service must:

1. Calculate fee before ledger posting.
2. Support fixed fees.
3. Support percentage fees.
4. Support tiered fees.
5. Support fee caps.
6. Support waived fees.
7. Support promotional fees.
8. Support provider-specific costs.
9. Return ledger posting instructions.
10. Audit fee configuration changes.

Example fee response:

```json
{
  "fee_minor": 5000,
  "currency": "NGN",
  "fee_account": "platform_fee_revenue",
  "fee_breakdown": [
    {
      "type": "transfer_fee",
      "amount_minor": 5000
    }
  ]
}
```

## Manual Review

Manual review item should include:

- review_id
- transaction_id
- user_id
- risk score
- reason codes
- evidence summary
- recommended action
- status
- assigned reviewer
- reviewer decision
- reviewer comment
- created_at
- decided_at

Manual review decisions:

```text
approve
decline
request_more_info
restrict_account
escalate
```

Manual review must be audited.

## Required APIs

```text
POST /risk/evaluate
POST /limits/evaluate
GET  /limits/config
POST /limits/config
POST /fees/calculate
GET  /fees/config
POST /fees/config
GET  /manual-reviews
POST /manual-reviews/{id}/decision
```

## Required Events

```text
fraud.transaction.evaluated
fraud.transaction.flagged
fraud.transaction.blocked
fraud.manual_review.created
fraud.manual_review.decided
limits.transaction.allowed
limits.transaction.denied
fees.calculated
fees.config.changed
```

## Required Tests

- Tier limit denies transaction above allowed amount.
- Daily limit aggregates previous successful/pending transactions correctly.
- New beneficiary high-value transfer is challenged.
- Failed PIN velocity blocks transaction temporarily.
- Manual review queue is created for high-risk transaction.
- Fee calculation posts fee to platform revenue account.
- Fee cap works.
- Fee waiver works.
- Admin fee change requires audit record.
- Duplicate risk evaluation is safe.

## Observability

Metrics:

- fraud_evaluation_total
- fraud_block_total
- fraud_challenge_total
- fraud_manual_review_total
- limits_allow_total
- limits_deny_total
- fees_calculated_total
- fee_revenue_minor_total
- manual_review_pending_total

Alerts:

- Fraud block spike
- Manual review backlog high
- Limit service unavailable
- Fee service calculation error
- Unusual fee revenue drop

## Runbooks

Create runbooks for:

- Fraud false-positive spike
- Manual review backlog
- Limit service outage
- Fee misconfiguration
- Account restriction appeal
- Suspicious transaction velocity spike

## Common Mistakes to Avoid

- Hardcoding limits in transaction service.
- Applying fees after ledger posting without accounting entry.
- Blocking users without audit trail.
- Trusting Redis as the only record of usage.
- Having no manual review workflow.
- Using black-box risk score without reason codes.
