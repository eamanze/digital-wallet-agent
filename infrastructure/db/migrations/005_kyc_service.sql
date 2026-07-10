-- 005_kyc_service.sql
-- KYC workflow support for provider attempts, rejection reasons, and document access metadata.

BEGIN;

ALTER TABLE kyc.kyc_profiles
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
  ADD COLUMN IF NOT EXISTS reviewed_by_admin_user_id UUID REFERENCES admin.admin_users(id),
  ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS resubmission_count INTEGER NOT NULL DEFAULT 0 CHECK (resubmission_count >= 0);

ALTER TABLE kyc.kyc_documents
  ADD COLUMN IF NOT EXISTS access_policy TEXT NOT NULL DEFAULT 'private',
  ADD COLUMN IF NOT EXISTS encryption_status TEXT NOT NULL DEFAULT 'kms_encrypted'
    CHECK (encryption_status IN ('kms_encrypted', 'client_encrypted')),
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS kyc.kyc_verification_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kyc_profile_id UUID NOT NULL REFERENCES kyc.kyc_profiles(id),
  user_id UUID NOT NULL REFERENCES identity.users(id),
  provider_name TEXT NOT NULL,
  provider_reference TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('created', 'sent', 'approved', 'rejected', 'manual_review', 'failed', 'timeout')),
  request_hash TEXT NOT NULL,
  response_hash TEXT,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  UNIQUE (provider_name, provider_reference)
);

CREATE INDEX IF NOT EXISTS kyc_verification_attempts_profile_idx
  ON kyc.kyc_verification_attempts (kyc_profile_id, created_at DESC);

CREATE INDEX IF NOT EXISTS kyc_profiles_status_tier_idx
  ON kyc.kyc_profiles (status, tier);

COMMIT;

