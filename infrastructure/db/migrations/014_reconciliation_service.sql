BEGIN;

CREATE TABLE IF NOT EXISTS reconciliation.provider_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reconciliation_batch_id UUID NOT NULL REFERENCES reconciliation.reconciliation_batches(id),
  provider_name TEXT NOT NULL,
  provider_reference TEXT NOT NULL,
  transaction_reference TEXT,
  amount_minor BIGINT NOT NULL CHECK (amount_minor >= 0),
  currency CHAR(3) NOT NULL,
  provider_status TEXT NOT NULL,
  occurred_at TIMESTAMPTZ,
  raw_record JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS provider_records_batch_idx ON reconciliation.provider_records(reconciliation_batch_id);
CREATE INDEX IF NOT EXISTS provider_records_reference_idx ON reconciliation.provider_records(provider_name, provider_reference);
CREATE UNIQUE INDEX IF NOT EXISTS provider_records_batch_reference_uidx ON reconciliation.provider_records(reconciliation_batch_id, provider_name, provider_reference);

ALTER TABLE reconciliation.reconciliation_batches
  ADD COLUMN IF NOT EXISTS exception_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS report_csv TEXT,
  ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE reconciliation.reconciliation_items
  ADD COLUMN IF NOT EXISTS provider_record_id UUID REFERENCES reconciliation.provider_records(id),
  ADD COLUMN IF NOT EXISTS severity TEXT NOT NULL DEFAULT 'medium',
  ADD COLUMN IF NOT EXISTS owner_admin_user_id UUID REFERENCES admin.admin_users(id),
  ADD COLUMN IF NOT EXISTS resolution_type TEXT,
  ADD COLUMN IF NOT EXISTS resolution_comment TEXT;

COMMIT;
