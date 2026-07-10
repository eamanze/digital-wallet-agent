# Skill 06 — Transactions and Payment Integrations

## Purpose

Implement safe transaction orchestration for wallet funding, wallet-to-wallet transfers, bank withdrawals, bill payments, and airtime/data purchases with provider integration, idempotency, retries, callbacks, and reconciliation.

## When to Use This Skill

Use this skill when building:

- Transaction service
- Payment integration service
- Wallet funding
- Transfers
- Withdrawals
- Bill payment
- Airtime purchase
- Provider callbacks
- Transaction state machine
- Retry/circuit breaker logic

## Transaction State Machine

Recommended states:

```text
created
validated
risk_checked
limit_checked
fee_calculated
ledger_reserved
provider_pending
provider_success
provider_failed
ledger_posted
completed
failed
reversed
disputed
manual_review
expired
```

Simpler external status model:

```text
pending
successful
failed
reversed
disputed
```

Rules:

- Store internal and provider statuses separately.
- Never overwrite terminal states without controlled reversal/dispute flow.
- Log every state transition.
- State transition must be idempotent.

## Idempotency Requirements

Every transaction initiation endpoint must require:

```http
Idempotency-Key: <uuid>
```

Idempotency record must store:

- key
- user_id
- endpoint/action
- request hash
- transaction_id
- response body
- status
- created_at
- expires_at

Duplicate behavior:

- Same key + same request hash = return original response.
- Same key + different request hash = reject.

## Provider Integration Rules

Every provider adapter must implement:

- Request signing
- Response validation
- Timeout
- Retry policy
- Circuit breaker
- Idempotency/reference mapping
- Callback verification
- Status polling fallback
- Error normalization
- Provider health metric
- Reconciliation report ingestion

Do not expose raw provider errors directly to end users.

## Wallet-to-Wallet Transfer Flow

1. Authenticate user.
2. Verify transaction PIN.
3. Validate source wallet.
4. Validate destination wallet.
5. Check account status.
6. Check KYC tier.
7. Check limits.
8. Run fraud/risk checks.
9. Calculate fee.
10. Create transaction record.
11. Post balanced ledger entries.
12. Update transaction status.
13. Publish transaction event.
14. Notify sender and receiver.

Failure handling:

- Insufficient funds: fail before ledger posting.
- Fraud block: fail or manual review before ledger posting.
- Ledger failure: transaction remains failed or retryable depending on exact stage.
- Notification failure must not reverse successful transfer.

## Wallet Funding Flow

1. User initiates funding.
2. Create pending transaction.
3. Generate provider payment reference.
4. Redirect or initialize payment provider.
5. Receive provider callback.
6. Verify callback signature.
7. Deduplicate callback.
8. Confirm provider status if required.
9. Post ledger entries only after valid success.
10. Mark transaction successful.
11. Notify user.
12. Reconcile later against settlement report.

Failure handling:

- Callback delayed: transaction stays pending.
- Callback duplicate: return success but do not post twice.
- Provider success but ledger failure: create critical incident and retry safely.
- Provider says success, settlement missing: reconciliation exception.

## Bank Withdrawal Flow

1. User initiates withdrawal.
2. Verify PIN/MFA depending on risk.
3. Validate destination bank account.
4. Run fraud/limits checks.
5. Calculate fee.
6. Create pending transaction.
7. Place hold or post debit according to policy.
8. Send provider payout request.
9. Handle provider immediate response.
10. Handle callback/poll status.
11. Complete or reverse/release hold.
12. Notify user.
13. Reconcile settlement.

Risk controls:

- New beneficiary cooldown.
- High-value transfer challenge.
- Velocity checks.
- Manual review for suspicious withdrawals.

## Bill Payment Flow

1. Validate biller.
2. Validate customer/account number with provider where possible.
3. Calculate fee.
4. Verify PIN.
5. Run limits/fraud checks.
6. Debit wallet or hold funds.
7. Submit bill payment.
8. Handle provider response/callback.
9. Complete, fail, or reverse.
10. Notify user.
11. Reconcile with biller report.

## Airtime/Data Flow

1. Validate phone/network/product.
2. Calculate amount and commission/fee.
3. Verify PIN when required.
4. Debit wallet.
5. Call airtime provider.
6. Complete or reverse depending on provider status.
7. Notify user.
8. Reconcile provider report.

## Required APIs

```text
POST /transactions/transfers
POST /transactions/fund-wallet
POST /transactions/withdrawals
POST /transactions/bills
POST /transactions/airtime
GET  /transactions/{transaction_id}
GET  /transactions
POST /providers/{provider}/callbacks
GET  /providers/{provider}/status/{reference}
POST /transactions/{transaction_id}/retry
POST /transactions/{transaction_id}/reverse
```

## Required Events

```text
transaction.created
transaction.validated
transaction.risk_checked
transaction.limit_checked
transaction.fee_calculated
transaction.provider_pending
transaction.provider_success
transaction.provider_failed
transaction.completed
transaction.failed
transaction.reversed
payment.provider.callback.received
payment.provider.callback.duplicate
payment.provider.timeout
payment.provider.circuit_opened
```

## Timeout and Retry Standards

Provider request rules:

- Use short connection timeout.
- Use bounded read timeout.
- Retry only retry-safe failures.
- Use exponential backoff with jitter.
- Do not retry non-idempotent provider requests unless provider reference is idempotent.
- Open circuit when provider failures exceed threshold.
- Send traffic to fallback provider only if business flow supports it.

## Reconciliation Hooks

Every provider transaction must store:

- internal transaction_id
- internal reference
- provider name
- provider reference
- provider session/reference ID
- provider request payload hash
- provider response code
- provider status
- provider callback ID
- settlement batch ID when available

## Required Tests

- Transfer success with fee.
- Transfer duplicate idempotency key does not duplicate ledger entries.
- Transfer insufficient funds fails.
- Transfer to restricted wallet fails.
- Funding callback duplicate does not double-credit wallet.
- Withdrawal provider timeout remains pending.
- Withdrawal provider failure releases hold or reverses correctly.
- Bill payment provider success posts correct ledger entries.
- Airtime provider unknown response becomes pending, not failed blindly.
- Provider callback invalid signature is rejected.
- Provider callback replay is rejected.
- Circuit breaker opens after provider failure threshold.

## Observability

Metrics:

- transaction_initiated_total
- transaction_completed_total
- transaction_failed_total
- transaction_pending_total
- transaction_reversed_total
- provider_request_total
- provider_timeout_total
- provider_error_total
- provider_callback_total
- provider_callback_duplicate_total
- provider_latency_ms

Alerts:

- Pending transactions beyond SLA
- Provider error spike
- Duplicate callback spike
- Callback signature failures
- Funding success but ledger not posted
- Withdrawal debited but provider status unknown

## Runbooks

Create runbooks for:

- Provider timeout
- Duplicate callback spike
- Stuck pending transaction
- Failed wallet funding credit
- Failed withdrawal after debit
- Bill payment dispute
- Airtime not delivered
- Circuit breaker open

## Common Mistakes to Avoid

- Marking provider timeout as failed immediately.
- Trusting webhook without signature verification.
- Crediting wallet before confirmed funding success.
- Posting duplicate ledger entries on duplicate callbacks.
- Reversing transactions without accounting entries.
- Ignoring reconciliation after provider success.
