BEGIN;

CREATE TABLE IF NOT EXISTS admin.admin_credentials (
  admin_user_id UUID PRIMARY KEY REFERENCES admin.admin_users(id),
  password_hash TEXT NOT NULL,
  mfa_secret_hash TEXT,
  failed_login_count INTEGER NOT NULL DEFAULT 0,
  locked_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS admin.admin_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID NOT NULL REFERENCES admin.admin_users(id),
  token_hash TEXT NOT NULL UNIQUE,
  mfa_verified BOOLEAN NOT NULL DEFAULT false,
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS admin_sessions_user_idx ON admin.admin_sessions(admin_user_id, expires_at);

COMMIT;
