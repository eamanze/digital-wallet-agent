-- 007_wallet_service.sql
-- Wallet lifecycle alignment and projection indexes.

BEGIN;

ALTER TABLE wallet.wallets
  DROP CONSTRAINT IF EXISTS wallets_status_check;

UPDATE wallet.wallets
SET status = CASE
  WHEN status = 'closed' THEN 'closed'
  WHEN status IN ('restricted', 'suspended') THEN 'frozen'
  ELSE 'active'
END;

ALTER TABLE wallet.wallets
  ADD CONSTRAINT wallets_status_check
  CHECK (status IN ('active', 'frozen', 'closed'));

CREATE INDEX IF NOT EXISTS wallets_user_currency_idx
  ON wallet.wallets (user_id, currency);

CREATE INDEX IF NOT EXISTS wallet_balance_projections_updated_idx
  ON wallet.wallet_balance_projections (updated_at);

COMMIT;

