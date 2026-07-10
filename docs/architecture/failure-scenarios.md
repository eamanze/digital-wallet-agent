# Failure Scenarios

## Purpose

This document describes expected production failure behavior for critical flows. Financial correctness has priority over optimistic completion. Unknown external outcomes remain pending, disputed, or manual-reviewable until verified.

## Global Failure Rules

- Do not complete money movement without balanced ledger posting.
- Do not double-post a ledger journal on retry.
- Do not trust provider callbacks without signature, timestamp, and replay validation.
- Do not treat provider timeout as provider failure.
- Do not mutate posted financial records; reverse with compensating entries.
- Notification failure must not reverse completed financial transactions.
- Reconciliation exceptions must be tracked to closure.

## Registration and Login Failures

| Scenario | Handling | Retry |
|---|---|---|
| Duplicate phone/email | Return safe duplicate error; do not create second user. | User retries with corrected identity. |
| OTP provider unavailable | Keep user unverified; enqueue/retry notification; show pending/resend path. | Notification queue retries with DLQ. |
| Redis unavailable for throttling | Fail safely for OTP/login abuse controls. | Retry after Redis recovery; alert if prolonged. |
| Refresh token reuse detected | Revoke token family and require re-authentication. | No automatic retry. |

## KYC Failures

| Scenario | Handling | Retry |
|---|---|---|
| Document upload fails | Do not submit KYC; keep profile incomplete. | User retries upload. |
| KYC provider timeout | Mark provider attempt pending. | Poll provider or retry idempotent request. |
| Invalid provider callback | Reject, audit, and alert on spike. | Provider may retry valid callback. |
| Conflicting KYC result | Route to manual review. | Admin decision resumes workflow. |

## Wallet Funding Failures

| Scenario | Handling | Retry |
|---|---|---|
| Provider initialization timeout | Transaction remains provider_pending if reference exists; otherwise failed/retryable based on adapter result. | Retry only with stable provider reference. |
| Provider success callback delayed | Transaction remains pending. | Poll provider status. |
| Provider success but ledger posting fails | Critical alert; transaction remains provider_success/ledger_pending. | Retry ledger posting with same idempotency key. |
| Settlement missing | Reconciliation exception. | Finance investigates; no silent correction. |

## Wallet Transfer Failures

| Scenario | Handling | Retry |
|---|---|---|
| PIN failure | Reject request, audit, update risk counters. | User retry subject to throttle. |
| Insufficient available balance | Fail before ledger posting. | User may retry after funding. |
| Fraud block | Fail or restrict account according to risk policy. | Manual appeal/review only. |
| Ledger rejects unbalanced batch | Fail transaction and page engineering if caused by code defect. | Do not retry same invalid payload. |
| Notification failure | Transaction remains completed. | Notification retries asynchronously. |

## Bank Withdrawal Failures

| Scenario | Handling | Retry |
|---|---|---|
| Provider timeout | Keep transaction pending and hold active. | Poll provider; retry request only with idempotent reference. |
| Provider failure before debit capture | Release hold or fail without posting debit. | No financial retry unless user reinitiates. |
| Provider failure after debit | Post reversal/release according to accounting policy. | Retry reversal idempotently. |
| Stale hold | Alert and route to reconciliation/manual operations. | Expiry worker releases or escalates. |

## Bill Payment and Airtime Failures

| Scenario | Handling | Retry |
|---|---|---|
| Invalid biller/product/customer | Fail before ledger posting. | User corrects input. |
| Provider unknown response | Keep pending. | Poll status. |
| Provider failed after debit | Reverse ledger entries. | Retry reversal idempotently. |
| Provider success but internal completion failed | Alert; recover from persisted provider and ledger state. | Workflow worker resumes. |

## Failed Payment Callback

| Scenario | Handling | Retry |
|---|---|---|
| Valid failed callback for pending transaction | Mark failed and release/reverse funds where applicable. | Callback processing retries through queue. |
| Failed callback for completed transaction | Do not blindly reverse; create dispute/reconciliation exception. | Manual investigation. |
| Unknown provider reference | Create reconciliation exception. | Provider report/status polling may resolve. |

## Duplicate Provider Callback

| Scenario | Handling | Retry |
|---|---|---|
| Same payload duplicate | Acknowledge and record duplicate; no financial mutation. | None. |
| Duplicate with conflicting payload | Mark suspicious; create reconciliation/manual review exception. | Provider status query and settlement matching. |

## Reversal Failures

| Scenario | Handling | Retry |
|---|---|---|
| Ineligible transaction | Reject reversal request and audit. | Manual dispute route only. |
| Maker-checker rejected | No financial mutation. | New request requires new reason/evidence. |
| Ledger reversal failed transiently | Keep reversal pending. | Retry with same reversal idempotency key. |
| Provider refund failed | Keep internal reversal/refund state pending or disputed according to product policy. | Retry only with provider idempotent reference. |

## Fraud Review Failures

| Scenario | Handling | Retry |
|---|---|---|
| Fraud service unavailable | Fail closed for high-risk flows or route to manual review by policy. | Retry evaluation from persisted transaction. |
| Review backlog high | Alert fraud operations; pause affected high-risk transactions. | Manual scaling/escalation. |
| Conflicting admin decisions | Reject second decision through approval state machine. | New escalation workflow if required. |

## Reconciliation Failures

| Scenario | Handling | Retry |
|---|---|---|
| Provider report missing | Create operational alert and pending run. | Retry fetch; escalate to provider. |
| Amount/status mismatch | Create exception. | Manual investigation; adjustment only through approved ledger journal. |
| Duplicate provider reference | Create exception and fraud signal. | Provider query and finance review. |
| Reconciliation job crash | Resume from checkpoint. | Retry run by provider/date/file checksum. |

