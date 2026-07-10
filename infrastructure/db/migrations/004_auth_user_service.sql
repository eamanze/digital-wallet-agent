-- 004_auth_user_service.sql
-- Auth and user-service support tables for credentials, OTP, MFA, PINs, and outbox events.

BEGIN;

ALTER TABLE identity.users
  DROP CONSTRAINT IF EXISTS users_status_check;

ALTER TABLE identity.users
  ADD CONSTRAINT users_status_check
  CHECK (status IN ('pending', 'registered', 'phone_verified', 'email_verified', 'kyc_pending', 'kyc_approved', 'active', 'restricted', 'suspended', 'closed'));

ALTER TABLE identity.users
  ADD COLUMN IF NOT EXISTS phone_verified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS platform.outbox_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  event_version TEXT NOT NULL DEFAULT '1.0',
  producer TEXT NOT NULL,
  correlation_id UUID,
  causation_id UUID,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS auth.user_credentials (
  user_id UUID PRIMARY KEY REFERENCES identity.users(id),
  password_hash TEXT NOT NULL,
  password_changed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  failed_login_count INTEGER NOT NULL DEFAULT 0 CHECK (failed_login_count >= 0),
  locked_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS auth.otp_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES identity.users(id),
  destination_hash TEXT NOT NULL,
  purpose TEXT NOT NULL CHECK (purpose IN ('phone_verification', 'email_verification', 'login_mfa', 'pin_reset', 'password_reset', 'new_device_verification', 'high_risk_transaction')),
  otp_hash TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'verified', 'expired', 'failed', 'cancelled')),
  attempts INTEGER NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  max_attempts INTEGER NOT NULL DEFAULT 5 CHECK (max_attempts > 0),
  expires_at TIMESTAMPTZ NOT NULL,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS auth.mfa_factors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES identity.users(id),
  factor_type TEXT NOT NULL CHECK (factor_type IN ('totp', 'sms', 'email')),
  factor_secret_hash TEXT,
  status TEXT NOT NULL CHECK (status IN ('pending', 'active', 'disabled')),
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, factor_type)
);

CREATE TABLE IF NOT EXISTS auth.transaction_pins (
  user_id UUID PRIMARY KEY REFERENCES identity.users(id),
  pin_hash TEXT NOT NULL,
  failed_attempts INTEGER NOT NULL DEFAULT 0 CHECK (failed_attempts >= 0),
  locked_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE auth.auth_sessions
  ADD COLUMN IF NOT EXISTS refresh_token_family_id UUID,
  ADD COLUMN IF NOT EXISTS rotated_from_session_id UUID REFERENCES auth.auth_sessions(id);

CREATE INDEX IF NOT EXISTS outbox_events_unpublished_idx ON platform.outbox_events (created_at) WHERE published_at IS NULL;
CREATE INDEX IF NOT EXISTS otp_challenges_user_purpose_idx ON auth.otp_challenges (user_id, purpose, status);
CREATE INDEX IF NOT EXISTS otp_challenges_destination_idx ON auth.otp_challenges (destination_hash, purpose, created_at);
CREATE INDEX IF NOT EXISTS mfa_factors_user_status_idx ON auth.mfa_factors (user_id, status);

COMMIT;

