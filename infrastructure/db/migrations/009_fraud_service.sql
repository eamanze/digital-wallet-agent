-- Durable fraud evaluations and idempotency for fraud-service.
BEGIN;

CREATE TABLE IF NOT EXISTS risk.fraud_decisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  idempotency_key TEXT NOT NULL UNIQUE,
  request_hash TEXT NOT NULL,
  evaluation_type TEXT NOT NULL CHECK (evaluation_type IN ('transaction','login','device','ip','velocity')),
  user_id UUID REFERENCES identity.users(id),
  transaction_reference TEXT,
  decision TEXT NOT NULL CHECK (decision IN ('allow','challenge','manual_review','block','restrict_account')),
  risk_score INTEGER NOT NULL CHECK (risk_score BETWEEN 0 AND 100),
  reason_codes TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  evidence JSONB NOT NULL DEFAULT '{}'::jsonb,
  correlation_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS fraud_decisions_user_created_idx ON risk.fraud_decisions (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS fraud_decisions_transaction_idx ON risk.fraud_decisions (transaction_reference, created_at DESC);
CREATE INDEX IF NOT EXISTS fraud_decisions_type_created_idx ON risk.fraud_decisions (evaluation_type, created_at DESC);

ALTER TABLE risk.fraud_cases ADD COLUMN IF NOT EXISTS fraud_decision_id UUID REFERENCES risk.fraud_decisions(id);
CREATE UNIQUE INDEX IF NOT EXISTS fraud_cases_decision_uidx ON risk.fraud_cases (fraud_decision_id) WHERE fraud_decision_id IS NOT NULL;

INSERT INTO risk.fraud_rules (rule_code, rule_name, description, decision, severity, status, priority, rule_config)
VALUES
 ('FAILED_PIN_ATTEMPTS', 'Too many failed PIN attempts', 'Blocks repeated failed transaction PIN attempts', 'block', 'high', 'active', 10, '{"threshold":5}'::jsonb),
 ('NEW_DEVICE_HIGH_VALUE', 'New device high-value transaction', 'Routes high-value activity from a new device to review', 'manual_review', 'high', 'active', 20, '{"threshold_minor":10000000}'::jsonb),
 ('UNUSUAL_FREQUENCY', 'Unusual transaction frequency', 'Reviews unusually frequent transactions', 'manual_review', 'medium', 'active', 30, '{"count_threshold":10,"window_seconds":300}'::jsonb),
 ('UNUSUAL_AMOUNT', 'Unusual transaction amount', 'Reviews an amount flagged as unusual by upstream risk controls', 'manual_review', 'medium', 'active', 40, '{"threshold_minor":50000000}'::jsonb),
 ('SUSPICIOUS_IP', 'Suspicious IP', 'Blocks a request classified as suspicious by edge/IP intelligence', 'block', 'high', 'active', 5, '{}'::jsonb),
 ('SHARED_DEVICE', 'Multiple accounts using device', 'Reviews devices shared by many accounts', 'manual_review', 'high', 'active', 50, '{"account_threshold":3}'::jsonb),
 ('RAPID_FUNDING_WITHDRAWAL', 'Rapid funding and withdrawal', 'Reviews rapid fund-in/fund-out behavior', 'manual_review', 'high', 'active', 25, '{"count_threshold":1,"window_seconds":3600}'::jsonb)
ON CONFLICT (rule_code) DO NOTHING;

COMMIT;
