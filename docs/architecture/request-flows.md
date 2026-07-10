# Request Flows

## Purpose

This document defines production request flows for core wallet operations. Each flow describes synchronous API calls, asynchronous events, database writes, idempotency rules, audit logging, failure handling, and retry behavior.

## Common Request Rules

Every write API must require:

```http
Idempotency-Key: <uuid>
X-Request-ID: <uuid>
Authorization: Bearer <token>
```

Every financial transaction must have:

```text
transaction_id
transaction_reference
correlation_id
idempotency_key
explicit internal status
provider reference where applicable
ledger journal reference where money moves
audit events
```

Statuses must be explicit: `created`, `validated`, `risk_checked`, `limit_checked`, `fee_calculated`, `ledger_reserved`, `provider_pending`, `provider_success`, `provider_failed`, `ledger_posted`, `completed`, `failed`, `reversed`, `disputed`, `manual_review`, `expired`.

## Registration and Login

### Synchronous API Calls

1. Client calls `POST /users/register` through API Gateway.
2. user-service validates phone/email uniqueness and creates a user in `registered` state.
3. user-service calls or emits to auth-service to initialize auth identity.
4. auth-service stores password hash and creates OTP challenge.
5. auth-service requests notification-service to send OTP.
6. Client calls `POST /auth/otp/verify`.
7. Client calls `POST /auth/login`.
8. auth-service validates credentials, evaluates device/IP risk, requires MFA for risky login, and issues access/refresh tokens.

### Asynchronous Events

- `user.registered`
- `auth.otp.requested`
- `notification.sent` or `notification.failed`
- `auth.login.succeeded` or `auth.login.failed`
- `auth.device.new_detected`

### Database Writes

- user-service: user profile, account status, device metadata seed.
- auth-service: credential hash, OTP metadata, session, refresh token metadata, login attempts.
- notification-service: notification job and delivery status.
- audit-service: registration, OTP, login, device events.

### Idempotency Rules

- Registration idempotency is keyed by `Idempotency-Key` plus request hash.
- Duplicate registration with same key and same payload returns the original response.
- Duplicate registration with same phone/email but different key returns a safe duplicate identity error.
- OTP send is throttled by purpose, user, destination, and IP.
- Login does not create duplicate sessions on retried token issuance if the same auth challenge is reused.

### Audit Logging

Audit registration attempts, OTP requests, OTP verification, login success/failure, new device detection, MFA challenge, session revocation, and suspicious login outcomes.

### Failure Handling

- Duplicate phone/email returns a safe error without revealing unnecessary identity details.
- OTP provider failure does not create a verified user state.
- Credential failure increments throttling counters.
- New or risky devices require MFA before token issuance.
- Redis throttle failure fails safely for auth abuse controls.

### Retry Behavior

- OTP delivery retries through notification queue with bounded attempts and DLQ.
- Client may retry registration with the same idempotency key.
- Login retries are rate-limited and progressively delayed.

## KYC Verification

### Synchronous API Calls

1. Authenticated client calls `POST /kyc/profile`.
2. Client uploads documents through a short-lived pre-signed URL or KYC upload endpoint.
3. kyc-service stores document metadata and encrypted S3 object reference.
4. kyc-service submits verification request to KYC provider through a provider adapter.
5. Provider returns immediate reference or pending status.
6. Provider later calls `POST /kyc/provider/callback`, or kyc-service polls status.

### Asynchronous Events

- `kyc.submitted`
- `kyc.provider.requested`
- `kyc.provider.callback.received`
- `kyc.approved`
- `kyc.rejected`
- `kyc.manual_review_required`
- `user.kyc.tier_changed`

### Database Writes

- kyc-service: KYC profile, document metadata, checksums, provider reference, verification attempts, normalized decision.
- user-service: user capability/status projection after KYC decision.
- S3: encrypted document object.
- audit-service: KYC submission, document upload metadata, provider decision, manual review route.

### Idempotency Rules

- KYC submission uses `Idempotency-Key` and request hash.
- Provider request uses an internal provider idempotency/reference key.
- Provider callbacks are deduplicated by provider callback ID, provider reference, and normalized event hash.

### Audit Logging

Audit profile submission, document upload, provider request, callback receipt, approval/rejection/manual review, and any admin override.

### Failure Handling

- S3 upload failure leaves KYC profile incomplete, not submitted.
- Provider timeout leaves verification `pending_provider`.
- Invalid callback signature is rejected and audited.
- Conflicting provider responses move case to manual review.

### Retry Behavior

- Provider submission retries only when request reference is idempotent.
- Pending KYC records are polled on schedule.
- Callback processing is queued and retried with DLQ on poison messages.

## Wallet Funding

### Synchronous API Calls

1. Client calls `POST /transactions/fund-wallet`.
2. transaction-service validates auth, wallet status, KYC tier, limits, fraud, and fees if applicable.
3. transaction-service creates transaction in `created/provider_pending`.
4. payment-integration-service initializes provider payment with an idempotent provider reference.
5. Client completes payment with provider.
6. Provider sends callback to payment-integration-service.
7. transaction-service verifies normalized provider success and requests ledger-service to post funding journal.
8. ledger-service posts balanced entries and publishes event.
9. transaction-service marks transaction `completed`.

### Asynchronous Events

- `transaction.created`
- `transaction.provider_pending`
- `payment.provider.callback.received`
- `payment.provider.status.changed`
- `ledger.journal.posted`
- `wallet.funded`
- `transaction.completed`
- `notification.sent`

### Database Writes

- transaction-service: transaction, idempotency record, state transitions.
- payment-integration-service: provider attempt, provider reference, callback dedupe record, normalized status.
- ledger-service: journal and entries after verified provider success.
- wallet-service: balance projection/hold view update from ledger event.
- audit-service: funding initiated, provider callback, ledger posting, completion.

### Idempotency Rules

- Funding initiation requires `Idempotency-Key`.
- Provider initialization uses stable internal transaction reference.
- Callback dedupe prevents duplicate credit.
- Ledger posting uses unique journal idempotency key.

### Audit Logging

Audit funding initiation, provider reference creation, callback receipt, callback verification result, ledger posting, and transaction completion/failure.

### Failure Handling

- Provider callback delayed leaves transaction pending.
- Provider says failed: transaction becomes failed without ledger credit.
- Provider says success but ledger posting fails: critical alert, retry ledger posting idempotently.
- Settlement missing later creates reconciliation exception.

### Retry Behavior

- Provider initialization retries only when provider reference is idempotent.
- Callback queue retries with DLQ.
- Ledger posting retries with same ledger idempotency key.
- Status polling reconciles stale pending transactions.

## Wallet-to-Wallet Transfer

### Synchronous API Calls

1. Client calls `POST /transactions/transfers`.
2. transaction-service verifies auth and transaction PIN through auth-service.
3. transaction-service validates source/destination wallets through wallet-service.
4. transaction-service checks user/account status, KYC tier, limits, fraud, and fee.
5. transaction-service creates transaction and posting instruction.
6. ledger-service posts balanced transfer journal, including fee revenue when applicable.
7. transaction-service marks transaction `completed`.
8. notification-service notifies sender and receiver.

### Asynchronous Events

- `transaction.created`
- `transaction.risk_checked`
- `transaction.limit_checked`
- `fees.calculated`
- `ledger.journal.posted`
- `wallet.transfer.completed`
- `transaction.completed`
- `notification.sent`

### Database Writes

- auth-service: PIN verification attempt.
- transaction-service: idempotency record, transaction, state transitions.
- fraud-service: evaluation record.
- limits-service: decision/usage record where required.
- fee-service: fee calculation record where required.
- ledger-service: journal and entries.
- audit-service: transfer initiation, PIN result, decisions, ledger posting, completion.

### Idempotency Rules

- Same `Idempotency-Key` plus same request hash returns original transaction response.
- Same key plus different request hash is rejected.
- Ledger journal reference is unique per transaction.
- Retried completion cannot create a second journal.

### Audit Logging

Audit transfer request, PIN verification result, fraud decision, limit decision, fee calculation, ledger posting, and notification enqueue.

### Failure Handling

- PIN failure increments risk counters and may temporarily block money movement.
- Insufficient available balance fails before ledger posting.
- Fraud `block` fails; `challenge` requires stronger auth; `manual_review` pauses transaction.
- Ledger rejects unbalanced posting and transaction does not complete.
- Notification failure does not reverse successful transfer.

### Retry Behavior

- Client retries with same idempotency key.
- Ledger posting retries only with same journal idempotency key.
- Notification retries asynchronously.

## Bank Withdrawal

### Synchronous API Calls

1. Client calls `POST /transactions/withdrawals`.
2. transaction-service verifies auth, PIN, wallet, beneficiary, KYC tier, limits, fraud, and fee.
3. transaction-service creates transaction.
4. wallet-service creates hold or ledger-service posts debit to payable account based on approved accounting policy.
5. payment-integration-service sends payout request to provider with idempotent reference.
6. Provider returns immediate status or pending.
7. Callback/status polling resolves provider result.
8. transaction-service captures/reverses hold or posts final ledger entries.
9. transaction-service marks completed, failed, reversed, or pending.

### Asynchronous Events

- `transaction.created`
- `wallet.hold.created`
- `transaction.provider_pending`
- `payment.provider.status.changed`
- `ledger.journal.posted`
- `wallet.withdrawal.completed`
- `transaction.failed`
- `transaction.reversed`
- `notification.sent`

### Database Writes

- transaction-service: transaction and state transitions.
- wallet-service: hold lifecycle if hold policy is used.
- payment-integration-service: payout attempt and provider status.
- ledger-service: debit, payable, fee, capture, release, or reversal journals.
- audit-service: withdrawal request, beneficiary risk, provider response, final result.

### Idempotency Rules

- Withdrawal initiation requires `Idempotency-Key`.
- Provider payout reference must be stable and idempotent.
- Callback dedupe prevents duplicate capture or reversal.
- Ledger capture/reversal uses unique idempotency keys linked to original transaction.

### Audit Logging

Audit withdrawal initiation, PIN/MFA result, beneficiary validation, risk/limit/fee decisions, hold creation, provider request, callback, ledger posting, and final status.

### Failure Handling

- Provider timeout leaves transaction pending and hold active until status resolution or expiry.
- Provider failure releases hold or posts reversal according to policy.
- Unknown provider status is not treated as failure blindly.
- Stale holds trigger alerts.

### Retry Behavior

- Provider requests retry only with idempotent payout reference.
- Status polling resolves pending transactions.
- Hold expiry jobs release or escalate stale holds.
- Ledger retries use same posting key.

## Bill Payment

### Synchronous API Calls

1. Client calls `POST /transactions/bills`.
2. transaction-service validates biller, customer account, auth/PIN, wallet, KYC tier, limits, fraud, and fee.
3. transaction-service creates transaction and hold/debit instruction.
4. payment-integration-service validates customer/account with biller when available.
5. ledger-service posts debit/hold capture according to policy.
6. payment-integration-service submits bill payment.
7. Provider response/callback resolves status.
8. transaction-service completes or reverses.

### Asynchronous Events

- `transaction.created`
- `fees.calculated`
- `payment.provider.status.changed`
- `ledger.journal.posted`
- `transaction.completed`
- `transaction.failed`
- `transaction.reversed`
- `notification.sent`

### Database Writes

- transaction-service: bill transaction and state transitions.
- payment-integration-service: biller validation, provider attempt, provider reference.
- ledger-service: debit to biller settlement, fee revenue, reversal if required.
- audit-service: bill validation, debit, provider status, completion/reversal.

### Idempotency Rules

- Bill payment initiation requires `Idempotency-Key`.
- Provider bill payment reference is unique and retry-safe.
- Ledger debit/capture posts once.
- Duplicate callbacks do not duplicate debit or reversal.

### Audit Logging

Audit bill payment initiation, validation result, risk/limit/fee decisions, provider request/callback, ledger posting, and final state.

### Failure Handling

- Invalid biller/customer fails before ledger posting.
- Provider timeout leaves transaction pending.
- Provider failure after debit triggers reversal.
- Provider success with internal failure creates critical retry path and reconciliation monitoring.

### Retry Behavior

- Retry provider calls only with idempotent reference.
- Poll provider status for pending/unknown outcomes.
- Retry ledger reversal/posting idempotently.

## Airtime Purchase

### Synchronous API Calls

1. Client calls `POST /transactions/airtime`.
2. transaction-service validates phone/network/product, auth/PIN if required, wallet, KYC tier, limits, fraud, and fee/commission.
3. transaction-service creates transaction.
4. ledger-service posts debit to airtime provider settlement and fee/commission entries according to policy.
5. payment-integration-service submits airtime purchase.
6. Provider response/callback resolves status.
7. transaction-service completes or reverses.

### Asynchronous Events

- `transaction.created`
- `payment.provider.status.changed`
- `ledger.journal.posted`
- `transaction.completed`
- `transaction.failed`
- `transaction.reversed`
- `notification.sent`

### Database Writes

- transaction-service: airtime transaction and states.
- payment-integration-service: provider attempt and status.
- ledger-service: debit, provider settlement, commission/fee, reversal if needed.
- audit-service: initiation, provider status, ledger posting, final state.

### Idempotency Rules

- Airtime initiation requires `Idempotency-Key`.
- Provider purchase reference is stable.
- Duplicate provider callback cannot duplicate completion or reversal.
- Ledger posting and reversal are idempotent.

### Audit Logging

Audit airtime request, validation, provider request/callback, ledger posting, and completion/reversal.

### Failure Handling

- Invalid network/product fails before ledger posting.
- Unknown provider response remains pending.
- Failed provider result after debit triggers reversal.
- Notification failure does not alter transaction state.

### Retry Behavior

- Provider retry only with stable reference.
- Poll pending purchases.
- Retry reversal idempotently.

## Failed Payment Callback

### Synchronous API Calls

1. Provider calls callback endpoint.
2. payment-integration-service validates signature, timestamp, provider reference, and replay window.
3. payment-integration-service stores callback and normalized failed status.
4. transaction-service loads transaction and validates state transition.
5. transaction-service marks failed or triggers release/reversal where funds were held/debited.

### Asynchronous Events

- `payment.provider.callback.received`
- `payment.provider.status.changed`
- `transaction.failed`
- `wallet.hold.released` or `ledger.journal.reversed`
- `notification.sent`

### Database Writes

- payment-integration-service: callback dedupe record and normalized status.
- transaction-service: failed state transition.
- wallet-service or ledger-service: hold release or reversal journal.
- audit-service: callback verification, failure decision, release/reversal.

### Idempotency Rules

- Callback ID and provider reference dedupe.
- State transition must be terminal-safe.
- Reversal/release uses idempotency key derived from original transaction and provider event.

### Audit Logging

Audit callback receipt, verification result, normalized failure, state transition, and release/reversal result.

### Failure Handling

- Invalid signature is rejected and audited.
- Unknown provider reference creates reconciliation exception.
- Failure for already successful transaction moves to dispute/reconciliation review, not blind reversal.

### Retry Behavior

- Callback processing retries through queue.
- Reversal retries idempotently.
- Reconciliation re-checks provider report later.

## Duplicate Provider Callback

### Synchronous API Calls

1. Provider sends callback already processed.
2. payment-integration-service validates signature and dedupe key.
3. payment-integration-service returns success acknowledgement without reprocessing financial effects.

### Asynchronous Events

- `payment.provider.callback.duplicate`

### Database Writes

- payment-integration-service may update duplicate counter or received timestamp.
- audit-service records duplicate callback.
- No transaction, wallet, or ledger mutation occurs.

### Idempotency Rules

- Deduplicate by provider callback ID, provider reference, event type, amount, currency, and payload hash.
- Existing terminal transaction state is not overwritten.
- Existing ledger journal is not reposted.

### Audit Logging

Audit duplicate callback detection and response.

### Failure Handling

- Duplicate with conflicting payload is treated as suspicious and sent to reconciliation/manual review.
- Duplicate with same payload is acknowledged safely.

### Retry Behavior

- No financial retry is performed.
- Conflicting duplicates create exception workflow.

## Transaction Reversal

### Synchronous API Calls

1. User/admin/system requests reversal through approved endpoint or workflow.
2. transaction-service validates original transaction state and reversal eligibility.
3. Admin-initiated sensitive reversals require maker-checker.
4. transaction-service requests ledger-service to create compensating reversal journal.
5. transaction-service marks transaction `reversed` or creates linked reversal transaction.
6. notification-service notifies affected user.

### Asynchronous Events

- `admin.approval.requested`
- `admin.approval.decided`
- `transaction.reversal.requested`
- `ledger.journal.reversed`
- `transaction.reversed`
- `notification.sent`

### Database Writes

- admin-dashboard: maker-checker request where applicable.
- transaction-service: reversal state/linkage.
- ledger-service: compensating entries linked to original journal.
- audit-service: request, approval, reversal reason, ledger reversal, final state.

### Idempotency Rules

- Reversal request uses unique key tied to original transaction and reason.
- Original ledger entries are never mutated.
- Duplicate reversal request returns existing reversal result.

### Audit Logging

Audit actor, reason, evidence, maker-checker decision, ledger journal reference, and notification result.

### Failure Handling

- Ineligible transaction cannot be reversed automatically.
- Partial provider uncertainty requires dispute/manual review.
- Ledger reversal rejection leaves request failed and audited.

### Retry Behavior

- Ledger reversal retries with same reversal idempotency key.
- Notification retries asynchronously.
- Provider refund/reversal retries only if provider supports idempotent reversal references.

## Fraud Review

### Synchronous API Calls

1. transaction-service calls fraud-service during money movement.
2. fraud-service returns `allow`, `challenge`, `manual_review`, `block`, or `restrict_account`.
3. For `manual_review`, admin-dashboard shows review item.
4. Fraud analyst decides through maker-checker where required.
5. transaction-service resumes, fails, or reverses transaction based on decision.

### Asynchronous Events

- `fraud.transaction.evaluated`
- `fraud.transaction.flagged`
- `fraud.manual_review.created`
- `admin.action.performed`
- `fraud.manual_review.decided`
- `transaction.completed` or `transaction.failed`

### Database Writes

- fraud-service: evaluation, score, reason codes, manual review item.
- transaction-service: paused/manual_review state and final state.
- admin-dashboard: review workflow and decision.
- audit-service: risk decision, reviewer action, final outcome.

### Idempotency Rules

- Fraud evaluation is idempotent per transaction version.
- Manual review decision can be submitted once by authorized reviewer.
- Checker cannot approve own maker request.

### Audit Logging

Audit score, reason codes, challenge/block/manual review decision, reviewer identity, comments, and final transaction state.

### Failure Handling

- Fraud service unavailable fails closed for high-risk money movement or routes to manual review based on policy.
- Review SLA breach alerts operations.
- Conflicting admin decisions are rejected by approval state machine.

### Retry Behavior

- Fraud enrichment jobs retry asynchronously.
- Transaction resume retries from persisted state.
- Admin notification retries through notification-service.

## Reconciliation

### Synchronous API Calls

1. Finance/admin user calls `POST /reconciliation/runs` or scheduled job starts run.
2. reconciliation-service loads provider settlement file from S3 or provider API.
3. reconciliation-service compares provider records to transaction, provider, ledger, and settlement records through approved APIs/projections.
4. Exceptions are created for mismatches.
5. Admin/finance resolves exceptions through audited workflow.

### Asynchronous Events

- `reconciliation.run.started`
- `reconciliation.exception.created`
- `reconciliation.run.completed`
- `reconciliation.exception.resolved`
- `ledger.journal.posted` for approved settlement adjustment where applicable

### Database Writes

- reconciliation-service: run, input file metadata, match results, exceptions.
- S3: imported provider files and finance exports.
- audit-service: run start/end, exception creation/resolution, exports.
- ledger-service: approved adjustment/reversal journals only when required.

### Idempotency Rules

- Reconciliation runs are idempotent by provider, settlement date, file checksum, and run type.
- Same file cannot create duplicate exceptions.
- Exception resolution is single-decision and audited.

### Audit Logging

Audit report ingestion, file checksum, run results, exception details, resolver, evidence, and any ledger adjustment reference.

### Failure Handling

- Missing provider file creates operational alert.
- Amount/status mismatch creates exception, not automatic silent correction.
- Unknown provider reference creates exception.
- Suspense balances above threshold page finance/SRE.

### Retry Behavior

- File ingestion retries with checksum validation.
- Provider report fetch retries with bounded backoff.
- Exception creation is idempotent.
- Failed run can resume from checkpoint.

