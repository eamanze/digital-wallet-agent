-- 006_ledger_service.sql
-- Align ledger transaction statuses with service API and seed required platform accounts.

BEGIN;

ALTER TABLE ledger.ledger_transactions
  DROP CONSTRAINT IF EXISTS ledger_transactions_status_check;

UPDATE ledger.ledger_transactions
SET status = 'pending'
WHERE status = 'draft';

UPDATE ledger.ledger_transactions
SET status = 'failed'
WHERE status = 'voided';

ALTER TABLE ledger.ledger_transactions
  ADD CONSTRAINT ledger_transactions_status_check
  CHECK (status IN ('pending', 'posted', 'reversed', 'failed'));

INSERT INTO ledger.ledger_accounts (
  account_code,
  account_name,
  account_type,
  owner_type,
  currency,
  status
) VALUES
  ('platform_suspense:NGN', 'Platform Suspense NGN', 'suspense', 'platform', 'NGN', 'active'),
  ('provider_clearing:default:NGN', 'Default Provider Clearing NGN', 'settlement', 'provider', 'NGN', 'active'),
  ('biller_clearing:default:NGN', 'Default Biller Clearing NGN', 'settlement', 'biller', 'NGN', 'active'),
  ('airtime_clearing:default:NGN', 'Default Airtime Clearing NGN', 'settlement', 'provider', 'NGN', 'active')
ON CONFLICT (account_code) DO NOTHING;

COMMIT;

