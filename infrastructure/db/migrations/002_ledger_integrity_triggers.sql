-- 002_ledger_integrity_triggers.sql
-- Database-level ledger and audit integrity controls.

BEGIN;

CREATE OR REPLACE FUNCTION ledger.assert_ledger_transaction_balanced()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  target_ledger_transaction_id UUID;
  debit_total BIGINT;
  credit_total BIGINT;
  entry_count INTEGER;
  currency_mismatch_count INTEGER;
  ledger_status TEXT;
BEGIN
  IF TG_TABLE_NAME = 'ledger_entries' THEN
    IF TG_OP = 'DELETE' THEN
      target_ledger_transaction_id := OLD.ledger_transaction_id;
    ELSE
      target_ledger_transaction_id := NEW.ledger_transaction_id;
    END IF;
  ELSE
    IF TG_OP = 'DELETE' THEN
      target_ledger_transaction_id := OLD.id;
    ELSE
      target_ledger_transaction_id := NEW.id;
    END IF;
  END IF;

  SELECT status
    INTO ledger_status
  FROM ledger.ledger_transactions
  WHERE id = target_ledger_transaction_id;

  IF ledger_status <> 'posted' THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  SELECT
    COALESCE(SUM(CASE WHEN le.entry_type = 'debit' THEN le.amount_minor ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN le.entry_type = 'credit' THEN le.amount_minor ELSE 0 END), 0),
    COUNT(*),
    COUNT(*) FILTER (WHERE le.currency <> lt.currency)
  INTO debit_total, credit_total, entry_count, currency_mismatch_count
  FROM ledger.ledger_transactions lt
  LEFT JOIN ledger.ledger_entries le ON le.ledger_transaction_id = lt.id
  WHERE lt.id = target_ledger_transaction_id
  GROUP BY lt.id;

  IF entry_count < 2 THEN
    RAISE EXCEPTION 'posted ledger transaction % must contain at least two entries', target_ledger_transaction_id
      USING ERRCODE = '23514';
  END IF;

  IF currency_mismatch_count > 0 THEN
    RAISE EXCEPTION 'posted ledger transaction % contains entry currency mismatch', target_ledger_transaction_id
      USING ERRCODE = '23514';
  END IF;

  IF debit_total <> credit_total THEN
    RAISE EXCEPTION 'posted ledger transaction % is unbalanced: debit %, credit %', target_ledger_transaction_id, debit_total, credit_total
      USING ERRCODE = '23514';
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE CONSTRAINT TRIGGER ledger_transactions_balanced_on_transaction
AFTER INSERT OR UPDATE ON ledger.ledger_transactions
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW
EXECUTE FUNCTION ledger.assert_ledger_transaction_balanced();

CREATE CONSTRAINT TRIGGER ledger_transactions_balanced_on_entries
AFTER INSERT OR UPDATE OR DELETE ON ledger.ledger_entries
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW
EXECUTE FUNCTION ledger.assert_ledger_transaction_balanced();

CREATE OR REPLACE FUNCTION ledger.prevent_posted_ledger_transaction_mutation()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'ledger transactions are append-only'
      USING ERRCODE = '25006';
  END IF;

  IF OLD.status IN ('posted', 'reversed') THEN
    IF OLD.status = 'posted' AND NEW.status NOT IN ('posted', 'reversed') THEN
      RAISE EXCEPTION 'posted ledger transaction % can only remain posted or move to reversed', OLD.id
        USING ERRCODE = '25006';
    END IF;

    IF OLD.status = 'reversed' AND NEW.status <> 'reversed' THEN
      RAISE EXCEPTION 'reversed ledger transaction % status is immutable', OLD.id
        USING ERRCODE = '25006';
    END IF;

    IF NEW.transaction_request_id IS DISTINCT FROM OLD.transaction_request_id
      OR NEW.ledger_reference IS DISTINCT FROM OLD.ledger_reference
      OR NEW.transaction_reference IS DISTINCT FROM OLD.transaction_reference
      OR NEW.idempotency_key IS DISTINCT FROM OLD.idempotency_key
      OR NEW.transaction_type IS DISTINCT FROM OLD.transaction_type
      OR NEW.currency IS DISTINCT FROM OLD.currency
      OR NEW.reversal_of_ledger_transaction_id IS DISTINCT FROM OLD.reversal_of_ledger_transaction_id
    THEN
      RAISE EXCEPTION 'posted ledger transaction % financial fields are immutable', OLD.id
        USING ERRCODE = '25006';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER prevent_posted_ledger_transaction_mutation
BEFORE UPDATE OR DELETE ON ledger.ledger_transactions
FOR EACH ROW
EXECUTE FUNCTION ledger.prevent_posted_ledger_transaction_mutation();

CREATE OR REPLACE FUNCTION ledger.prevent_posted_ledger_entry_mutation()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  parent_status TEXT;
  parent_id UUID;
BEGIN
  IF TG_OP = 'DELETE' THEN
    parent_id := OLD.ledger_transaction_id;
  ELSE
    parent_id := NEW.ledger_transaction_id;
  END IF;

  SELECT status INTO parent_status
  FROM ledger.ledger_transactions
  WHERE id = parent_id;

  IF parent_status IN ('posted', 'reversed') THEN
    RAISE EXCEPTION 'ledger entries for posted/reversed transaction % are immutable', parent_id
      USING ERRCODE = '25006';
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER prevent_posted_ledger_entry_mutation
BEFORE INSERT OR UPDATE OR DELETE ON ledger.ledger_entries
FOR EACH ROW
EXECUTE FUNCTION ledger.prevent_posted_ledger_entry_mutation();

CREATE OR REPLACE FUNCTION audit.prevent_audit_log_mutation()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'audit logs are append-only'
    USING ERRCODE = '25006';
END;
$$;

CREATE TRIGGER prevent_audit_log_update
BEFORE UPDATE OR DELETE ON audit.audit_logs
FOR EACH ROW
EXECUTE FUNCTION audit.prevent_audit_log_mutation();

COMMIT;
