# Skill 04 — Authentication, User, and KYC

## Purpose

Implement secure user onboarding, authentication, MFA, OTP, device trust, transaction PIN, and KYC verification for a production-grade Digital Wallet / Mobile Money app.

## When to Use This Skill

Use this skill for:

- User registration
- Login/logout
- MFA
- OTP verification
- Transaction PIN
- Device registration
- Session management
- KYC document upload
- KYC provider integration
- KYC tier limits

## User Lifecycle

Recommended states:

```text
registered
phone_verified
email_verified
kyc_pending
kyc_approved
kyc_rejected
active
restricted
suspended
closed
```

Rules:

- A user may register before KYC.
- Wallet limits must depend on KYC tier.
- High-risk activity may move account to restricted state.
- Suspended users cannot initiate money movement.
- Closed accounts must preserve historical records.

## Registration Flow

1. User submits phone/email/password.
2. Validate input.
3. Check duplicate identity.
4. Create user with pending verification.
5. Send OTP.
6. Audit registration attempt.
7. Return masked destination.

Acceptance criteria:

- Duplicate phone/email is handled safely.
- OTP is rate-limited.
- Password is hashed.
- User creation is auditable.
- No sensitive data is logged.

## Login Flow

1. User submits credential.
2. Validate credential.
3. Evaluate device and IP risk.
4. Require MFA if new/risky device.
5. Issue short-lived access token.
6. Issue refresh token with rotation.
7. Store session metadata.
8. Audit login result.

Acceptance criteria:

- Failed login attempts are throttled.
- Refresh token reuse is detected.
- Login from a new device creates notification.
- Session can be revoked.

## OTP Flow

OTP requirements:

- Short TTL
- Hashed or securely stored OTP
- Retry limit
- Resend cooldown
- Purpose-specific OTP
- Audit events

OTP purposes:

```text
phone_verification
email_verification
login_mfa
pin_reset
password_reset
new_device_verification
high_risk_transaction
```

Do not reuse OTP across purposes.

## Device Trust

Device states:

```text
new
trusted
risky
blocked
removed
```

Device events:

- First login
- Device trusted
- Device removed
- Device blocked
- Device risk changed

Actions requiring stronger authentication:

- New device login
- Add beneficiary
- Change password
- Change PIN
- Transfer above threshold
- Withdrawal to new bank account

## Transaction PIN

PIN setup:

1. Require authenticated session.
2. Verify OTP/MFA.
3. Accept PIN.
4. Hash separately from password.
5. Store PIN hash metadata.
6. Audit event.

PIN verification:

- Required for transfer, withdrawal, bills, airtime, and sensitive operations.
- Rate-limited with progressive delay.
- Too many failures should lock transaction capability temporarily.

## KYC Data Model

Suggested entities:

```text
kyc_profile
kyc_document
kyc_verification_attempt
kyc_provider_response
kyc_tier
```

KYC profile fields:

- user_id
- legal_name
- date_of_birth
- address
- identity_type
- identity_number_tokenized_or_encrypted
- kyc_status
- kyc_tier
- risk_status
- verified_at

KYC document fields:

- document_id
- user_id
- document_type
- s3_object_key
- checksum
- encryption_key_id
- uploaded_at
- status

## KYC Flow

1. User uploads identity data and document/selfie.
2. Store document in private encrypted S3.
3. Save document metadata in database.
4. Submit verification request to KYC provider.
5. Store provider reference.
6. Receive provider callback or poll provider status.
7. Normalize provider decision.
8. Approve, reject, or route to manual review.
9. Update KYC tier.
10. Publish KYC event.
11. Audit the decision.

## KYC Tiers

Example:

| Tier | Requirements | Example Capability |
|---|---|---|
| Tier 0 | Registered only | View app, limited actions |
| Tier 1 | Phone verified | Small wallet limit |
| Tier 2 | ID verified | Higher transfers |
| Tier 3 | Enhanced KYC | Higher business/merchant limits |

Limits must be configurable and enforced by Limits Service.

## Required APIs

```text
POST /users/register
POST /auth/login
POST /auth/logout
POST /auth/refresh
POST /auth/otp/send
POST /auth/otp/verify
POST /auth/mfa/verify
POST /auth/pin/setup
POST /auth/pin/verify
POST /auth/pin/reset
GET  /users/me
PATCH /users/me
GET  /users/devices
POST /users/devices/{id}/trust
DELETE /users/devices/{id}
POST /kyc/profile
POST /kyc/documents
GET  /kyc/status
POST /kyc/provider/callback
```

## Required Events

```text
user.registered
user.phone.verified
user.email.verified
auth.login.succeeded
auth.login.failed
auth.device.new_detected
auth.pin.created
auth.pin.failed
kyc.submitted
kyc.approved
kyc.rejected
kyc.manual_review_required
```

## Tests

Required test cases:

- Register user successfully
- Reject duplicate phone/email
- OTP expires
- OTP retry limit works
- OTP resend cooldown works
- Login with valid credentials
- Login blocked after brute force threshold
- New device requires MFA
- Refresh token rotation works
- Reused refresh token is rejected
- PIN setup requires MFA
- PIN verification throttles failed attempts
- KYC upload stores only object reference in DB
- KYC provider callback is idempotent
- KYC rejection does not delete submitted evidence

## Observability

Metrics:

- registration_success_total
- registration_failure_total
- login_success_total
- login_failure_total
- otp_requested_total
- otp_verified_total
- otp_failed_total
- otp_rate_limited_total
- pin_failed_total
- kyc_submitted_total
- kyc_approved_total
- kyc_rejected_total
- kyc_manual_review_total

Alerts:

- Login failure spike
- OTP abuse spike
- KYC provider failure spike
- PIN failure spike
- New device login spike

## Runbooks

Create runbooks for:

- OTP provider outage
- KYC provider outage
- High login failure rate
- Account takeover suspicion
- PIN brute force attack
- KYC document upload failure

## Common Mistakes to Avoid

- Storing OTP in plaintext.
- Logging OTP or PIN.
- Allowing unlimited OTP resend.
- Treating KYC provider approval as unreviewable truth.
- Storing KYC images in the database.
- Giving full wallet limits before KYC verification.
