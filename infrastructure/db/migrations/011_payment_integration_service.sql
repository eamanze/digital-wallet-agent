BEGIN;

CREATE TABLE IF NOT EXISTS transactions.provider_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_request_id UUID REFERENCES transactions.transaction_requests(id),
  provider_name TEXT NOT NULL,
  provider_type TEXT NOT NULL CHECK (provider_type IN ('wallet_funding','bank_withdrawal','bill_payment','airtime')),
  internal_reference TEXT NOT NULL UNIQUE,
  provider_reference TEXT NOT NULL,
  idempotency_key TEXT NOT NULL,
  request_hash TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('created','sent','pending','successful','failed','unknown','timeout','reversed')),
  normalized_status TEXT NOT NULL CHECK (normalized_status IN ('pending','successful','failed','reversed','disputed','unknown')),
  response_code TEXT,
  response_hash TEXT,
  attempt_count INTEGER NOT NULL DEFAULT 0 CHECK (attempt_count >= 0),
  last_error_code TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (provider_name, idempotency_key),
  UNIQUE (provider_name, provider_reference)
);

CREATE TABLE IF NOT EXISTS transactions.provider_callback_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_name TEXT NOT NULL,
  provider_reference TEXT NOT NULL,
  callback_id TEXT,
  event_type TEXT NOT NULL,
  normalized_status TEXT NOT NULL CHECK (normalized_status IN ('pending','successful','failed','reversed','disputed','unknown')),
  payload_hash TEXT NOT NULL,
  signature_valid BOOLEAN NOT NULL,
  processing_status TEXT NOT NULL CHECK (processing_status IN ('received','processed','duplicate','rejected')),
  received_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (provider_name, provider_reference, event_type, payload_hash),
  UNIQUE (provider_name, callback_id)
);

CREATE INDEX IF NOT EXISTS provider_attempts_transaction_idx ON transactions.provider_attempts(transaction_request_id, created_at DESC);
CREATE INDEX IF NOT EXISTS provider_attempts_status_idx ON transactions.provider_attempts(provider_name, status, updated_at);

COMMIT;
