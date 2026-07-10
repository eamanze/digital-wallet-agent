# Skill 12 — Admin, Audit, and Reconciliation

## Purpose

Implement secure admin operations, immutable audit logging, finance-grade reconciliation, settlement matching, exception handling, and operational reporting for a production Digital Wallet / Mobile Money platform.

## When to Use This Skill

Use this skill when building:

- Admin dashboard
- Support tools
- Finance operations
- Audit service
- Reconciliation service
- Settlement reports
- Manual reversals
- Manual review queue
- Maker-checker flows
- Compliance exports

## Admin Dashboard Principles

1. Admin access must be strongly authenticated.
2. Admin actions must be role-based.
3. Sensitive admin actions require maker-checker approval.
4. Every admin action must be audited.
5. Admin tools must not bypass ledger rules.
6. Admin users must see only the data required for their role.
7. PII must be masked unless the role has explicit permission.

## Admin Roles

Suggested roles:

```text
support_readonly
support_agent
support_manager
fraud_analyst
fraud_manager
finance_operator
finance_manager
compliance_officer
system_admin
security_admin
auditor
```

## Maker-Checker Required Actions

Require maker-checker for:

- Manual reversal
- Manual transaction status correction
- Account freeze/unfreeze
- KYC override
- User limit override
- Fee configuration change
- Provider configuration change
- Admin role assignment
- Bulk export
- Settlement adjustment

## Audit Event Requirements

Audit all:

- User login success/failure
- OTP request/verification
- PIN setup/change/failure
- Device trust changes
- KYC submission/decision
- Wallet creation/status change
- Transaction initiation/status change
- Ledger posting/reversal
- Provider callback
- Admin login
- Admin data search
- Admin export
- Admin manual update
- Fraud decision
- Reconciliation exception decision

Audit event must include:

- actor
- action
- target resource
- result
- reason
- timestamp
- correlation_id
- source IP/device where appropriate
- before/after metadata for config changes

## Reconciliation Principles

1. Reconciliation is mandatory for every external provider.
2. Internal records must be matched against provider records and settlement reports.
3. Reconciliation exceptions must be tracked to closure.
4. Finance reports must be reproducible.
5. Suspense accounts must be monitored.
6. Manual adjustments must create ledger entries and audit records.

## Reconciliation Types

### Transaction Reconciliation

Compare:

- Internal transaction status
- Provider transaction status
- Provider callback status
- Provider status query result

### Settlement Reconciliation

Compare:

- Internal successful transactions
- Provider settlement report
- Bank statement/settlement account
- Fees/commissions

### Ledger Reconciliation

Compare:

- Ledger journal totals
- Balance projections
- Suspense accounts
- Provider settlement accounts
- Wallet liabilities

## Reconciliation Match Keys

Use combinations of:

- internal transaction_id
- internal reference
- provider reference
- provider session ID
- amount
- currency
- timestamp window
- destination account/phone
- settlement batch ID

## Exception Types

```text
missing_provider_record
missing_internal_record
amount_mismatch
currency_mismatch
status_mismatch
duplicate_provider_reference
settlement_missing
fee_mismatch
unknown_provider_record
late_callback
manual_review_required
```

## Exception Workflow

```text
created -> assigned -> investigating -> resolved -> closed
created -> escalated -> resolved -> closed
```

Each exception must have:

- owner
- severity
- due date/SLA
- evidence
- resolution type
- audit trail

## Required APIs

```text
GET  /admin/users
GET  /admin/users/{id}
POST /admin/users/{id}/freeze
POST /admin/users/{id}/unfreeze
GET  /admin/transactions
GET  /admin/transactions/{id}
POST /admin/transactions/{id}/manual-review
POST /admin/transactions/{id}/reverse-request
POST /admin/approvals/{id}/approve
POST /admin/approvals/{id}/reject
GET  /audit/events
GET  /reconciliation/runs
POST /reconciliation/runs
GET  /reconciliation/exceptions
POST /reconciliation/exceptions/{id}/resolve
GET  /reports/settlement
GET  /reports/finance-export
```

## Required Reconciliation Jobs

1. Hourly provider status reconciliation for pending transactions.
2. Daily settlement report ingestion.
3. Daily ledger balance projection reconciliation.
4. Daily suspense account report.
5. Daily provider fee/commission reconciliation.
6. Weekly admin access review report.
7. Monthly finance close report.

## Required Reports

- Transaction volume report
- Failed transaction report
- Pending transaction report
- Reversal report
- Fee revenue report
- Provider settlement report
- Reconciliation exception report
- Suspense account report
- Admin activity report
- Audit export

## Required Tests

- Admin role cannot access unauthorized data.
- Sensitive action creates approval request.
- Checker cannot approve own maker request.
- Admin action creates audit log.
- Manual reversal creates ledger reversal entries.
- Reconciliation detects missing provider record.
- Reconciliation detects amount mismatch.
- Reconciliation detects duplicate provider reference.
- Exception resolution is audited.
- Finance export is reproducible.

## Observability

Metrics:

- admin_login_total
- admin_action_total
- admin_approval_pending_total
- audit_event_write_total
- audit_event_write_failure_total
- reconciliation_run_total
- reconciliation_exception_total
- reconciliation_exception_open_total
- settlement_mismatch_total
- suspense_balance_minor

Alerts:

- Audit event write failure
- Reconciliation job failure
- Reconciliation exception spike
- Suspense account balance above threshold
- Admin unauthorized attempt
- Approval backlog high

## Runbooks

Create runbooks for:

- Reconciliation mismatch
- Settlement missing
- Duplicate provider reference
- Audit logging failure
- Unauthorized admin attempt
- Manual reversal request
- Suspense account investigation
- Finance close issue

## Common Mistakes to Avoid

- Allowing admin status changes without ledger entries.
- Letting admins edit transaction records directly.
- No audit trail for data searches.
- No maker-checker for sensitive actions.
- Treating provider reports as always correct.
- Closing reconciliation exceptions without evidence.
