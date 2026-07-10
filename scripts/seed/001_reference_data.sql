-- 001_reference_data.sql
-- Synthetic reference data for local/dev environments only. Do not use real customer data.

BEGIN;

INSERT INTO ledger.ledger_accounts (
  account_code,
  account_name,
  account_type,
  owner_type,
  currency,
  status
) VALUES
  ('platform_cash_clearing:NGN', 'Platform Cash Clearing NGN', 'asset', 'platform', 'NGN', 'active'),
  ('platform_fee_revenue:NGN', 'Platform Fee Revenue NGN', 'revenue', 'platform', 'NGN', 'active'),
  ('provider_settlement:default:NGN', 'Default Provider Settlement NGN', 'settlement', 'provider', 'NGN', 'active'),
  ('bank_settlement:default:NGN', 'Default Bank Settlement NGN', 'settlement', 'bank', 'NGN', 'active'),
  ('biller_settlement:default:NGN', 'Default Biller Settlement NGN', 'settlement', 'biller', 'NGN', 'active'),
  ('airtime_provider_settlement:default:NGN', 'Default Airtime Provider Settlement NGN', 'settlement', 'provider', 'NGN', 'active'),
  ('chargeback_suspense:NGN', 'Chargeback Suspense NGN', 'suspense', 'system', 'NGN', 'active'),
  ('reversal_suspense:NGN', 'Reversal Suspense NGN', 'suspense', 'system', 'NGN', 'active'),
  ('fraud_hold:NGN', 'Fraud Hold NGN', 'suspense', 'system', 'NGN', 'active')
  ,('platform_suspense:NGN', 'Platform Suspense NGN', 'suspense', 'platform', 'NGN', 'active')
  ,('provider_clearing:default:NGN', 'Default Provider Clearing NGN', 'settlement', 'provider', 'NGN', 'active')
  ,('biller_clearing:default:NGN', 'Default Biller Clearing NGN', 'settlement', 'biller', 'NGN', 'active')
  ,('airtime_clearing:default:NGN', 'Default Airtime Clearing NGN', 'settlement', 'provider', 'NGN', 'active')
ON CONFLICT (account_code) DO NOTHING;

INSERT INTO risk.limits (
  limit_code,
  kyc_tier,
  transaction_type,
  channel,
  currency,
  window_type,
  max_amount_minor,
  max_count,
  status
) VALUES
  ('tier_1_wallet_transfer_daily_ngn', 'tier_1', 'wallet_transfer', 'mobile', 'NGN', 'daily', 5000000, 20, 'active'),
  ('tier_2_wallet_transfer_daily_ngn', 'tier_2', 'wallet_transfer', 'mobile', 'NGN', 'daily', 50000000, 100, 'active'),
  ('tier_1_withdrawal_daily_ngn', 'tier_1', 'bank_withdrawal', 'mobile', 'NGN', 'daily', 5000000, 10, 'active'),
  ('tier_2_withdrawal_daily_ngn', 'tier_2', 'bank_withdrawal', 'mobile', 'NGN', 'daily', 50000000, 50, 'active')
ON CONFLICT (limit_code) DO NOTHING;

INSERT INTO risk.fees (
  fee_code,
  transaction_type,
  channel,
  currency,
  fee_type,
  fixed_amount_minor,
  percentage_bps,
  min_fee_minor,
  max_fee_minor,
  revenue_account_id,
  status
) VALUES
  (
    'wallet_transfer_flat_50_ngn',
    'wallet_transfer',
    'mobile',
    'NGN',
    'fixed',
    5000,
    NULL,
    0,
    5000,
    (SELECT id FROM ledger.ledger_accounts WHERE account_code = 'platform_fee_revenue:NGN'),
    'active'
  ),
  (
    'withdrawal_flat_25_ngn',
    'bank_withdrawal',
    'mobile',
    'NGN',
    'fixed',
    2500,
    NULL,
    0,
    2500,
    (SELECT id FROM ledger.ledger_accounts WHERE account_code = 'platform_fee_revenue:NGN'),
    'active'
  )
ON CONFLICT (fee_code) DO NOTHING;

INSERT INTO risk.fraud_rules (
  rule_code,
  rule_name,
  description,
  decision,
  severity,
  status,
  priority,
  rule_config
) VALUES
  ('new_device_high_value_transfer', 'New device high value transfer', 'Challenge high value transfers from a new device.', 'challenge', 'high', 'active', 10, '{"signals":["new_device","high_value_transfer"]}'::jsonb),
  ('pin_fail_velocity', 'PIN failure velocity', 'Block money movement after repeated PIN failures.', 'block', 'critical', 'active', 5, '{"max_failures_per_hour":5}'::jsonb),
  ('new_beneficiary_withdrawal', 'New beneficiary withdrawal', 'Route high value withdrawals to new beneficiaries for review.', 'manual_review', 'high', 'active', 20, '{"cooldown_hours":24}'::jsonb)
ON CONFLICT (rule_code) DO NOTHING;

INSERT INTO admin.admin_users (
  email,
  display_name,
  status,
  mfa_enabled,
  roles
) VALUES
  ('admin@example.local', 'Local Admin', 'active', true, ARRAY['system_admin', 'auditor'])
ON CONFLICT (email) DO NOTHING;

COMMIT;
