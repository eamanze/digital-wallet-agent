# Admin access control

Roles: `support_agent` (read/support), `compliance_officer` (KYC), `finance_ops` (reconciliation), `fraud_analyst` (fraud cases), `auditor` (read-only), and `super_admin` (break-glass only). Admin login requires MFA, short session timeout, device/IP risk checks, and re-authentication for sensitive actions.

Maker-checker is mandatory for freezes, reversals, limit/fee/provider changes, KYC overrides, role assignments, and manual status changes. Maker and checker must be distinct principals; approval records include reason, before/after values, timestamps, correlation ID, and immutable audit event. Exports are masked, scoped, watermarked, and audited.
