BEGIN;

ALTER TABLE audit.audit_logs
  ADD COLUMN IF NOT EXISTS event_id UUID,
  ADD COLUMN IF NOT EXISTS event_type TEXT,
  ADD COLUMN IF NOT EXISTS service_name TEXT;

CREATE INDEX IF NOT EXISTS audit_logs_user_idx ON audit.audit_logs(actor_id, created_at DESC);
CREATE INDEX IF NOT EXISTS audit_logs_service_idx ON audit.audit_logs(service_name, created_at DESC);
CREATE INDEX IF NOT EXISTS audit_logs_event_type_idx ON audit.audit_logs(event_type, created_at DESC);
CREATE INDEX IF NOT EXISTS audit_logs_created_idx ON audit.audit_logs(created_at DESC);

CREATE OR REPLACE FUNCTION audit.prevent_audit_mutation() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'audit logs are append-only';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS audit_logs_no_update ON audit.audit_logs;
DROP TRIGGER IF EXISTS audit_logs_no_delete ON audit.audit_logs;
CREATE TRIGGER audit_logs_no_update BEFORE UPDATE ON audit.audit_logs FOR EACH ROW EXECUTE FUNCTION audit.prevent_audit_mutation();
CREATE TRIGGER audit_logs_no_delete BEFORE DELETE ON audit.audit_logs FOR EACH ROW EXECUTE FUNCTION audit.prevent_audit_mutation();

COMMIT;
