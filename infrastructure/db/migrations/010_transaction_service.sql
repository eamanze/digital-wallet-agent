BEGIN;

ALTER TABLE transactions.transaction_requests
  DROP CONSTRAINT IF EXISTS transaction_requests_status_check;
UPDATE transactions.transaction_requests SET status = CASE
  WHEN status IN ('created','validated','risk_checked','limit_checked','fee_calculated','ledger_reserved') THEN 'pending_validation'
  WHEN status IN ('provider_pending','provider_success') THEN 'pending_provider'
  WHEN status IN ('completed','ledger_posted') THEN 'successful'
  WHEN status IN ('manual_review','disputed') THEN 'under_review'
  WHEN status = 'expired' THEN 'failed'
  ELSE status END;
ALTER TABLE transactions.transaction_requests
  ADD CONSTRAINT transaction_requests_status_check
  CHECK (status IN ('initiated','pending_validation','pending_fraud_check','pending_provider','successful','failed','reversed','under_review'));

ALTER TABLE transactions.transaction_requests
  ADD COLUMN IF NOT EXISTS ledger_reference TEXT,
  ADD COLUMN IF NOT EXISTS provider_name TEXT,
  ADD COLUMN IF NOT EXISTS provider_reference TEXT,
  ADD COLUMN IF NOT EXISTS limit_reservation_reference TEXT,
  ADD COLUMN IF NOT EXISTS fee_quote_reference TEXT,
  ADD COLUMN IF NOT EXISTS fraud_decision_id UUID,
  ADD COLUMN IF NOT EXISTS failure_code TEXT,
  ADD COLUMN IF NOT EXISTS reversed_at TIMESTAMPTZ;

CREATE UNIQUE INDEX IF NOT EXISTS transaction_requests_ledger_reference_uidx ON transactions.transaction_requests(ledger_reference) WHERE ledger_reference IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS transaction_requests_provider_reference_uidx ON transactions.transaction_requests(provider_name, provider_reference) WHERE provider_reference IS NOT NULL;
CREATE INDEX IF NOT EXISTS transaction_requests_user_history_idx ON transactions.transaction_requests(user_id, created_at DESC, id DESC);

COMMIT;
