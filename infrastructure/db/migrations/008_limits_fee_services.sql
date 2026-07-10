-- Durable limit reservations and versioned fee/limit policy.
BEGIN;

CREATE TABLE risk.limit_config_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version INTEGER NOT NULL UNIQUE CHECK (version > 0),
  status TEXT NOT NULL CHECK (status IN ('draft', 'active', 'retired')),
  description TEXT,
  effective_from TIMESTAMPTZ NOT NULL DEFAULT now(),
  effective_to TIMESTAMPTZ,
  created_by_admin_user_id UUID REFERENCES admin.admin_users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX limit_config_one_active_idx ON risk.limit_config_versions (status) WHERE status = 'active';

CREATE TABLE risk.limit_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  config_version_id UUID NOT NULL REFERENCES risk.limit_config_versions(id),
  rule_code TEXT NOT NULL,
  kyc_tier TEXT NOT NULL CHECK (kyc_tier IN ('tier_0','tier_1','tier_2','tier_3')),
  transaction_type TEXT NOT NULL,
  channel TEXT NOT NULL,
  currency CHAR(3) NOT NULL,
  window_type TEXT NOT NULL CHECK (window_type IN ('single','daily','monthly','rolling')),
  window_seconds INTEGER CHECK (window_seconds IS NULL OR window_seconds > 0),
  max_amount_minor BIGINT CHECK (max_amount_minor IS NULL OR max_amount_minor >= 0),
  max_count INTEGER CHECK (max_count IS NULL OR max_count >= 0),
  priority INTEGER NOT NULL DEFAULT 100,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  UNIQUE (config_version_id, rule_code),
  CHECK (window_type <> 'rolling' OR window_seconds IS NOT NULL),
  CHECK (max_amount_minor IS NOT NULL OR max_count IS NOT NULL)
);

CREATE TABLE risk.limit_reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_reference TEXT NOT NULL UNIQUE,
  idempotency_key TEXT NOT NULL UNIQUE,
  request_hash TEXT NOT NULL,
  transaction_reference TEXT NOT NULL UNIQUE,
  user_id UUID NOT NULL REFERENCES identity.users(id),
  kyc_tier TEXT NOT NULL,
  transaction_type TEXT NOT NULL,
  channel TEXT NOT NULL,
  amount_minor BIGINT NOT NULL CHECK (amount_minor > 0),
  currency CHAR(3) NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('reserved','committed','released','expired')),
  config_version_id UUID NOT NULL REFERENCES risk.limit_config_versions(id),
  reserved_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  committed_at TIMESTAMPTZ,
  released_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);
CREATE INDEX limit_reservations_usage_idx ON risk.limit_reservations
  (user_id, currency, status, reserved_at);

CREATE TABLE risk.limit_decisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES identity.users(id),
  transaction_reference TEXT,
  decision TEXT NOT NULL CHECK (decision IN ('allow','deny')),
  reason_codes TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  amount_minor BIGINT NOT NULL CHECK (amount_minor > 0),
  currency CHAR(3) NOT NULL,
  config_version_id UUID NOT NULL REFERENCES risk.limit_config_versions(id),
  evaluated_usage JSONB NOT NULL DEFAULT '{}'::jsonb,
  correlation_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE risk.fee_config_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version INTEGER NOT NULL UNIQUE CHECK (version > 0),
  status TEXT NOT NULL CHECK (status IN ('draft','active','retired')),
  description TEXT,
  effective_from TIMESTAMPTZ NOT NULL DEFAULT now(),
  effective_to TIMESTAMPTZ,
  created_by_admin_user_id UUID REFERENCES admin.admin_users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX fee_config_one_active_idx ON risk.fee_config_versions (status) WHERE status = 'active';

CREATE TABLE risk.fee_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  config_version_id UUID NOT NULL REFERENCES risk.fee_config_versions(id),
  fee_code TEXT NOT NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('wallet_transfer','withdrawal','bill_payment','airtime_purchase')),
  channel TEXT NOT NULL,
  currency CHAR(3) NOT NULL,
  fixed_amount_minor BIGINT NOT NULL DEFAULT 0 CHECK (fixed_amount_minor >= 0),
  percentage_bps INTEGER NOT NULL DEFAULT 0 CHECK (percentage_bps >= 0),
  min_fee_minor BIGINT CHECK (min_fee_minor IS NULL OR min_fee_minor >= 0),
  max_fee_minor BIGINT CHECK (max_fee_minor IS NULL OR max_fee_minor >= 0),
  waived BOOLEAN NOT NULL DEFAULT false,
  waiver_conditions JSONB NOT NULL DEFAULT '{}'::jsonb,
  revenue_account_code TEXT NOT NULL DEFAULT 'platform_fee_revenue:NGN',
  priority INTEGER NOT NULL DEFAULT 100,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  UNIQUE (config_version_id, fee_code),
  CHECK (max_fee_minor IS NULL OR min_fee_minor IS NULL OR max_fee_minor >= min_fee_minor)
);

CREATE TABLE risk.fee_quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_reference TEXT NOT NULL UNIQUE,
  idempotency_key TEXT NOT NULL UNIQUE,
  request_hash TEXT NOT NULL,
  user_id UUID REFERENCES identity.users(id),
  transaction_reference TEXT,
  transaction_type TEXT NOT NULL,
  channel TEXT NOT NULL,
  amount_minor BIGINT NOT NULL CHECK (amount_minor > 0),
  fee_minor BIGINT NOT NULL CHECK (fee_minor >= 0),
  currency CHAR(3) NOT NULL,
  fee_code TEXT NOT NULL,
  config_version_id UUID NOT NULL REFERENCES risk.fee_config_versions(id),
  calculation JSONB NOT NULL,
  correlation_id UUID,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO risk.limit_config_versions (version, status, description) VALUES
  (1, 'active', 'Initial NGN KYC-tier limits');
INSERT INTO risk.limit_rules (config_version_id, rule_code, kyc_tier, transaction_type, channel, currency, window_type, max_amount_minor, max_count)
SELECT v.id, x.rule_code, x.kyc_tier, '*', '*', 'NGN', x.window_type, x.max_amount_minor, x.max_count
FROM risk.limit_config_versions v
CROSS JOIN (VALUES
 ('T0_SINGLE','tier_0','single',0::bigint,NULL::integer), ('T0_DAILY','tier_0','daily',0::bigint,0), ('T0_MONTHLY','tier_0','monthly',0::bigint,0),
 ('T1_SINGLE','tier_1','single',5000000::bigint,NULL::integer), ('T1_DAILY','tier_1','daily',5000000::bigint,20), ('T1_MONTHLY','tier_1','monthly',30000000::bigint,200),
 ('T2_SINGLE','tier_2','single',20000000::bigint,NULL::integer), ('T2_DAILY','tier_2','daily',50000000::bigint,100), ('T2_MONTHLY','tier_2','monthly',500000000::bigint,2000),
 ('T3_SINGLE','tier_3','single',100000000::bigint,NULL::integer), ('T3_DAILY','tier_3','daily',500000000::bigint,500), ('T3_MONTHLY','tier_3','monthly',5000000000::bigint,10000)
) AS x(rule_code,kyc_tier,window_type,max_amount_minor,max_count)
WHERE v.version = 1;

INSERT INTO risk.fee_config_versions (version, status, description) VALUES
  (1, 'active', 'Initial deterministic NGN fees');
INSERT INTO risk.fee_rules (config_version_id, fee_code, transaction_type, channel, currency, fixed_amount_minor, percentage_bps, max_fee_minor)
SELECT v.id, x.fee_code, x.transaction_type, '*', 'NGN', x.fixed_amount_minor, x.percentage_bps, x.max_fee_minor
FROM risk.fee_config_versions v
CROSS JOIN (VALUES
 ('WALLET_TRANSFER_NGN','wallet_transfer',0::bigint,50,10000::bigint),
 ('WITHDRAWAL_NGN','withdrawal',10000::bigint,50,50000::bigint),
 ('BILL_PAYMENT_NGN','bill_payment',5000::bigint,0,NULL::bigint),
 ('AIRTIME_NGN','airtime_purchase',0::bigint,0,NULL::bigint)
) AS x(fee_code,transaction_type,fixed_amount_minor,percentage_bps,max_fee_minor)
WHERE v.version = 1;

COMMIT;
