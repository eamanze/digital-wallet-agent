-- 001_initial_schema.sql
-- Initial PostgreSQL schemas and tables for the Digital Wallet / Mobile Money platform.

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS citext;

CREATE SCHEMA IF NOT EXISTS platform;
CREATE SCHEMA IF NOT EXISTS identity;
CREATE SCHEMA IF NOT EXISTS auth;
CREATE SCHEMA IF NOT EXISTS kyc;
CREATE SCHEMA IF NOT EXISTS wallet;
CREATE SCHEMA IF NOT EXISTS ledger;
CREATE SCHEMA IF NOT EXISTS transactions;
CREATE SCHEMA IF NOT EXISTS risk;
CREATE SCHEMA IF NOT EXISTS notifications;
CREATE SCHEMA IF NOT EXISTS reconciliation;
CREATE SCHEMA IF NOT EXISTS audit;
CREATE SCHEMA IF NOT EXISTS admin;

CREATE TABLE platform.idempotency_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_name TEXT NOT NULL,
  operation_name TEXT NOT NULL,
  idempotency_key TEXT NOT NULL,
  actor_type TEXT NOT NULL DEFAULT 'user',
  actor_id UUID,
  request_hash TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('in_progress', 'completed', 'failed', 'conflict', 'expired')),
  locked_until TIMESTAMPTZ,
  response_code INTEGER,
  response_body JSONB,
  resource_type TEXT,
  resource_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  UNIQUE (service_name, operation_name, idempotency_key)
);

CREATE TABLE identity.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_reference TEXT NOT NULL UNIQUE,
  phone_e164 TEXT UNIQUE,
  email CITEXT UNIQUE,
  status TEXT NOT NULL CHECK (status IN ('registered', 'phone_verified', 'email_verified', 'kyc_pending', 'kyc_approved', 'active', 'restricted', 'suspended', 'closed')),
  kyc_tier TEXT NOT NULL DEFAULT 'tier_0',
  risk_status TEXT NOT NULL DEFAULT 'normal',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  closed_at TIMESTAMPTZ
);

CREATE TABLE identity.user_profiles (
  user_id UUID PRIMARY KEY REFERENCES identity.users(id),
  first_name TEXT,
  middle_name TEXT,
  last_name TEXT,
  date_of_birth DATE,
  address_line1 TEXT,
  address_line2 TEXT,
  city TEXT,
  state_region TEXT,
  country_code CHAR(2),
  identity_type TEXT,
  identity_number_ciphertext TEXT,
  identity_number_fingerprint TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE identity.user_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES identity.users(id),
  device_fingerprint TEXT NOT NULL,
  device_name TEXT,
  platform TEXT,
  app_version TEXT,
  trust_status TEXT NOT NULL CHECK (trust_status IN ('new', 'trusted', 'risky', 'blocked', 'removed')),
  first_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  removed_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  UNIQUE (user_id, device_fingerprint)
);

CREATE TABLE auth.auth_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES identity.users(id),
  device_id UUID REFERENCES identity.user_devices(id),
  refresh_token_hash TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('active', 'revoked', 'expired', 'reused')),
  ip_address_hash TEXT,
  user_agent_hash TEXT,
  issued_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  last_used_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE kyc.kyc_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES identity.users(id),
  legal_name TEXT,
  date_of_birth DATE,
  country_code CHAR(2),
  identity_type TEXT,
  identity_number_ciphertext TEXT,
  identity_number_fingerprint TEXT,
  status TEXT NOT NULL CHECK (status IN ('not_started', 'pending', 'provider_pending', 'approved', 'rejected', 'manual_review', 'expired')),
  tier TEXT NOT NULL DEFAULT 'tier_0',
  risk_status TEXT NOT NULL DEFAULT 'normal',
  provider_name TEXT,
  provider_reference TEXT,
  submitted_at TIMESTAMPTZ,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE kyc.kyc_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kyc_profile_id UUID NOT NULL REFERENCES kyc.kyc_profiles(id),
  user_id UUID NOT NULL REFERENCES identity.users(id),
  document_type TEXT NOT NULL,
  s3_bucket TEXT NOT NULL,
  s3_object_key TEXT NOT NULL,
  checksum_sha256 TEXT NOT NULL,
  kms_key_id TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('uploaded', 'submitted', 'accepted', 'rejected', 'expired')),
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  UNIQUE (s3_bucket, s3_object_key)
);

CREATE TABLE wallet.wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES identity.users(id),
  wallet_reference TEXT NOT NULL UNIQUE,
  currency CHAR(3) NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'active', 'restricted', 'suspended', 'closed')),
  ledger_account_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  closed_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  UNIQUE (user_id, currency)
);

CREATE TABLE transactions.transaction_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES identity.users(id),
  source_wallet_id UUID REFERENCES wallet.wallets(id),
  destination_wallet_id UUID REFERENCES wallet.wallets(id),
  transaction_reference TEXT NOT NULL UNIQUE,
  idempotency_key_id UUID NOT NULL REFERENCES platform.idempotency_keys(id),
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('wallet_funding', 'wallet_transfer', 'bank_withdrawal', 'bill_payment', 'airtime_purchase', 'reversal', 'adjustment')),
  status TEXT NOT NULL CHECK (status IN ('created', 'validated', 'risk_checked', 'limit_checked', 'fee_calculated', 'ledger_reserved', 'provider_pending', 'provider_success', 'provider_failed', 'ledger_posted', 'completed', 'failed', 'reversed', 'disputed', 'manual_review', 'expired')),
  amount_minor BIGINT NOT NULL CHECK (amount_minor > 0),
  fee_minor BIGINT NOT NULL DEFAULT 0 CHECK (fee_minor >= 0),
  currency CHAR(3) NOT NULL,
  narration TEXT,
  failure_reason TEXT,
  reversed_transaction_request_id UUID REFERENCES transactions.transaction_requests(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE ledger.ledger_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_code TEXT NOT NULL UNIQUE,
  account_name TEXT NOT NULL,
  account_type TEXT NOT NULL CHECK (account_type IN ('asset', 'liability', 'revenue', 'expense', 'settlement', 'suspense')),
  owner_type TEXT NOT NULL CHECK (owner_type IN ('platform', 'user', 'provider', 'bank', 'biller', 'system')),
  owner_id UUID,
  currency CHAR(3) NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('active', 'restricted', 'closed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE wallet.wallets
  ADD CONSTRAINT wallets_ledger_account_id_fkey
  FOREIGN KEY (ledger_account_id) REFERENCES ledger.ledger_accounts(id);

CREATE TABLE ledger.ledger_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_request_id UUID REFERENCES transactions.transaction_requests(id),
  ledger_reference TEXT NOT NULL UNIQUE,
  transaction_reference TEXT NOT NULL,
  idempotency_key TEXT NOT NULL UNIQUE,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('funding', 'transfer', 'withdrawal', 'bill_payment', 'airtime_purchase', 'fee', 'reversal', 'settlement_adjustment', 'manual_adjustment')),
  status TEXT NOT NULL CHECK (status IN ('draft', 'posted', 'reversed', 'voided')),
  currency CHAR(3) NOT NULL,
  description TEXT,
  reversal_of_ledger_transaction_id UUID REFERENCES ledger.ledger_transactions(id),
  created_by_service TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  posted_at TIMESTAMPTZ,
  reversed_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  CHECK (
    (transaction_type = 'reversal' AND reversal_of_ledger_transaction_id IS NOT NULL)
    OR (transaction_type <> 'reversal' AND reversal_of_ledger_transaction_id IS NULL)
  )
);

CREATE TABLE ledger.ledger_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ledger_transaction_id UUID NOT NULL REFERENCES ledger.ledger_transactions(id) ON DELETE RESTRICT,
  account_id UUID NOT NULL REFERENCES ledger.ledger_accounts(id),
  entry_type TEXT NOT NULL CHECK (entry_type IN ('debit', 'credit')),
  amount_minor BIGINT NOT NULL CHECK (amount_minor > 0),
  currency CHAR(3) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE wallet.wallet_balance_projections (
  wallet_id UUID PRIMARY KEY REFERENCES wallet.wallets(id),
  ledger_account_id UUID NOT NULL UNIQUE REFERENCES ledger.ledger_accounts(id),
  currency CHAR(3) NOT NULL,
  posted_balance_minor BIGINT NOT NULL DEFAULT 0,
  available_balance_minor BIGINT NOT NULL DEFAULT 0,
  held_balance_minor BIGINT NOT NULL DEFAULT 0 CHECK (held_balance_minor >= 0),
  last_ledger_transaction_id UUID REFERENCES ledger.ledger_transactions(id),
  version BIGINT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (available_balance_minor <= posted_balance_minor),
  CHECK (posted_balance_minor - held_balance_minor = available_balance_minor)
);

CREATE TABLE transactions.payment_provider_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_request_id UUID NOT NULL REFERENCES transactions.transaction_requests(id),
  provider_name TEXT NOT NULL,
  provider_operation TEXT NOT NULL CHECK (provider_operation IN ('funding_initialize', 'funding_verify', 'payout', 'bill_validate', 'bill_payment', 'airtime_purchase', 'refund', 'status_query')),
  provider_reference TEXT NOT NULL,
  provider_idempotency_key TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('created', 'sent', 'pending', 'successful', 'failed', 'timeout', 'unknown', 'reversed')),
  request_hash TEXT NOT NULL,
  response_hash TEXT,
  provider_status_code TEXT,
  provider_message TEXT,
  sent_at TIMESTAMPTZ,
  responded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  UNIQUE (provider_name, provider_reference),
  UNIQUE (provider_name, provider_idempotency_key)
);

CREATE TABLE transactions.payment_provider_callbacks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_provider_request_id UUID REFERENCES transactions.payment_provider_requests(id),
  provider_name TEXT NOT NULL,
  provider_reference TEXT NOT NULL,
  provider_callback_id TEXT,
  event_type TEXT NOT NULL,
  normalized_status TEXT NOT NULL CHECK (normalized_status IN ('pending', 'successful', 'failed', 'reversed', 'disputed', 'unknown')),
  payload_hash TEXT NOT NULL,
  signature_valid BOOLEAN NOT NULL DEFAULT false,
  received_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed_at TIMESTAMPTZ,
  processing_status TEXT NOT NULL CHECK (processing_status IN ('received', 'processed', 'duplicate', 'rejected', 'conflict')),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE UNIQUE INDEX payment_provider_callbacks_provider_callback_uidx
  ON transactions.payment_provider_callbacks (provider_name, provider_callback_id)
  WHERE provider_callback_id IS NOT NULL;

CREATE UNIQUE INDEX payment_provider_callbacks_payload_uidx
  ON transactions.payment_provider_callbacks (provider_name, provider_reference, event_type, payload_hash);

CREATE TABLE risk.limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  limit_code TEXT NOT NULL UNIQUE,
  kyc_tier TEXT NOT NULL,
  transaction_type TEXT NOT NULL,
  channel TEXT NOT NULL,
  currency CHAR(3) NOT NULL,
  window_type TEXT NOT NULL CHECK (window_type IN ('single', 'daily', 'monthly', 'rolling')),
  max_amount_minor BIGINT CHECK (max_amount_minor IS NULL OR max_amount_minor >= 0),
  max_count INTEGER CHECK (max_count IS NULL OR max_count >= 0),
  status TEXT NOT NULL CHECK (status IN ('active', 'inactive')),
  effective_from TIMESTAMPTZ NOT NULL DEFAULT now(),
  effective_to TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE risk.fees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fee_code TEXT NOT NULL UNIQUE,
  transaction_type TEXT NOT NULL,
  channel TEXT NOT NULL,
  currency CHAR(3) NOT NULL,
  fee_type TEXT NOT NULL CHECK (fee_type IN ('fixed', 'percentage', 'tiered', 'waived')),
  fixed_amount_minor BIGINT CHECK (fixed_amount_minor IS NULL OR fixed_amount_minor >= 0),
  percentage_bps INTEGER CHECK (percentage_bps IS NULL OR percentage_bps >= 0),
  min_fee_minor BIGINT CHECK (min_fee_minor IS NULL OR min_fee_minor >= 0),
  max_fee_minor BIGINT CHECK (max_fee_minor IS NULL OR max_fee_minor >= 0),
  revenue_account_id UUID REFERENCES ledger.ledger_accounts(id),
  status TEXT NOT NULL CHECK (status IN ('active', 'inactive')),
  effective_from TIMESTAMPTZ NOT NULL DEFAULT now(),
  effective_to TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE risk.fraud_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_code TEXT NOT NULL UNIQUE,
  rule_name TEXT NOT NULL,
  description TEXT,
  decision TEXT NOT NULL CHECK (decision IN ('allow', 'challenge', 'manual_review', 'block', 'restrict_account')),
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  status TEXT NOT NULL CHECK (status IN ('active', 'inactive')),
  priority INTEGER NOT NULL DEFAULT 100,
  rule_config JSONB NOT NULL DEFAULT '{}'::jsonb,
  effective_from TIMESTAMPTZ NOT NULL DEFAULT now(),
  effective_to TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE risk.fraud_cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_reference TEXT NOT NULL UNIQUE,
  transaction_request_id UUID REFERENCES transactions.transaction_requests(id),
  user_id UUID REFERENCES identity.users(id),
  risk_score INTEGER CHECK (risk_score IS NULL OR (risk_score >= 0 AND risk_score <= 100)),
  decision TEXT NOT NULL CHECK (decision IN ('allow', 'challenge', 'manual_review', 'block', 'restrict_account')),
  status TEXT NOT NULL CHECK (status IN ('open', 'assigned', 'investigating', 'approved', 'declined', 'restricted', 'closed')),
  reason_codes TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  evidence JSONB NOT NULL DEFAULT '{}'::jsonb,
  assigned_admin_user_id UUID,
  decided_by_admin_user_id UUID,
  reviewer_comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  decided_at TIMESTAMPTZ
);

CREATE TABLE notifications.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES identity.users(id),
  channel TEXT NOT NULL CHECK (channel IN ('sms', 'email', 'push')),
  template_code TEXT NOT NULL,
  destination_masked TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('queued', 'sent', 'failed', 'delivered', 'undeliverable')),
  provider_name TEXT,
  provider_reference TEXT,
  correlation_id UUID,
  queued_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  failure_reason TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE reconciliation.reconciliation_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_name TEXT NOT NULL,
  batch_type TEXT NOT NULL CHECK (batch_type IN ('transaction_status', 'settlement', 'ledger_projection', 'fee_commission', 'suspense', 'finance_close')),
  settlement_date DATE NOT NULL,
  source_file_bucket TEXT,
  source_file_key TEXT,
  source_file_checksum TEXT,
  status TEXT NOT NULL CHECK (status IN ('created', 'processing', 'completed', 'failed', 'partial')),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  UNIQUE (provider_name, batch_type, settlement_date, source_file_checksum)
);

CREATE TABLE reconciliation.reconciliation_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reconciliation_batch_id UUID NOT NULL REFERENCES reconciliation.reconciliation_batches(id),
  transaction_request_id UUID REFERENCES transactions.transaction_requests(id),
  payment_provider_request_id UUID REFERENCES transactions.payment_provider_requests(id),
  ledger_transaction_id UUID REFERENCES ledger.ledger_transactions(id),
  provider_reference TEXT,
  transaction_reference TEXT,
  amount_minor BIGINT CHECK (amount_minor IS NULL OR amount_minor >= 0),
  currency CHAR(3),
  match_status TEXT NOT NULL CHECK (match_status IN ('matched', 'exception', 'ignored')),
  exception_type TEXT CHECK (exception_type IN ('missing_provider_record', 'missing_internal_record', 'amount_mismatch', 'currency_mismatch', 'status_mismatch', 'duplicate_provider_reference', 'settlement_missing', 'fee_mismatch', 'unknown_provider_record', 'late_callback', 'manual_review_required')),
  resolution_status TEXT NOT NULL DEFAULT 'open' CHECK (resolution_status IN ('open', 'assigned', 'investigating', 'resolved', 'closed', 'escalated')),
  evidence JSONB NOT NULL DEFAULT '{}'::jsonb,
  resolved_by_admin_user_id UUID,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE audit.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_reference TEXT NOT NULL UNIQUE,
  actor_type TEXT NOT NULL CHECK (actor_type IN ('user', 'admin', 'system', 'provider')),
  actor_id UUID,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id UUID,
  result TEXT NOT NULL CHECK (result IN ('success', 'failed', 'blocked', 'pending')),
  reason TEXT,
  correlation_id UUID,
  request_id UUID,
  ip_address_hash TEXT,
  device_id UUID,
  before_metadata JSONB,
  after_metadata JSONB,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  previous_hash TEXT,
  event_hash TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE admin.admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email CITEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('invited', 'active', 'suspended', 'disabled')),
  mfa_enabled BOOLEAN NOT NULL DEFAULT false,
  roles TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE admin.admin_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID NOT NULL REFERENCES admin.admin_users(id),
  action_type TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id UUID,
  status TEXT NOT NULL CHECK (status IN ('requested', 'approved', 'rejected', 'executed', 'failed', 'cancelled')),
  requires_maker_checker BOOLEAN NOT NULL DEFAULT false,
  checker_admin_user_id UUID REFERENCES admin.admin_users(id),
  reason TEXT NOT NULL,
  request_metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  decision_metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  decided_at TIMESTAMPTZ,
  executed_at TIMESTAMPTZ,
  CHECK (checker_admin_user_id IS NULL OR checker_admin_user_id <> admin_user_id)
);

ALTER TABLE risk.fraud_cases
  ADD CONSTRAINT fraud_cases_assigned_admin_user_id_fkey
  FOREIGN KEY (assigned_admin_user_id) REFERENCES admin.admin_users(id);

ALTER TABLE risk.fraud_cases
  ADD CONSTRAINT fraud_cases_decided_by_admin_user_id_fkey
  FOREIGN KEY (decided_by_admin_user_id) REFERENCES admin.admin_users(id);

ALTER TABLE reconciliation.reconciliation_items
  ADD CONSTRAINT reconciliation_items_resolved_by_admin_user_id_fkey
  FOREIGN KEY (resolved_by_admin_user_id) REFERENCES admin.admin_users(id);

COMMIT;

