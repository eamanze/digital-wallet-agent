-- 003_indexes.sql
-- Operational indexes for lookup, idempotency, reconciliation, and audit queries.

BEGIN;

CREATE INDEX idempotency_keys_actor_idx ON platform.idempotency_keys (actor_type, actor_id);
CREATE INDEX idempotency_keys_expiry_idx ON platform.idempotency_keys (expires_at);
CREATE INDEX idempotency_keys_status_idx ON platform.idempotency_keys (status);

CREATE INDEX users_status_idx ON identity.users (status);
CREATE INDEX users_kyc_tier_idx ON identity.users (kyc_tier);
CREATE INDEX user_devices_user_status_idx ON identity.user_devices (user_id, trust_status);
CREATE INDEX auth_sessions_user_status_idx ON auth.auth_sessions (user_id, status);
CREATE INDEX auth_sessions_expiry_idx ON auth.auth_sessions (expires_at);

CREATE INDEX kyc_profiles_user_status_idx ON kyc.kyc_profiles (user_id, status);
CREATE INDEX kyc_profiles_provider_reference_idx ON kyc.kyc_profiles (provider_name, provider_reference);
CREATE INDEX kyc_documents_user_idx ON kyc.kyc_documents (user_id);

CREATE INDEX wallets_user_status_idx ON wallet.wallets (user_id, status);
CREATE INDEX wallets_ledger_account_idx ON wallet.wallets (ledger_account_id);

CREATE INDEX ledger_accounts_owner_idx ON ledger.ledger_accounts (owner_type, owner_id);
CREATE INDEX ledger_accounts_type_currency_idx ON ledger.ledger_accounts (account_type, currency);
CREATE INDEX ledger_transactions_request_idx ON ledger.ledger_transactions (transaction_request_id);
CREATE INDEX ledger_transactions_reference_idx ON ledger.ledger_transactions (transaction_reference);
CREATE INDEX ledger_transactions_status_created_idx ON ledger.ledger_transactions (status, created_at);
CREATE INDEX ledger_entries_account_created_idx ON ledger.ledger_entries (account_id, created_at);
CREATE INDEX ledger_entries_transaction_idx ON ledger.ledger_entries (ledger_transaction_id);

CREATE INDEX transaction_requests_user_created_idx ON transactions.transaction_requests (user_id, created_at DESC);
CREATE INDEX transaction_requests_status_created_idx ON transactions.transaction_requests (status, created_at);
CREATE INDEX transaction_requests_type_status_idx ON transactions.transaction_requests (transaction_type, status);
CREATE INDEX transaction_requests_idempotency_idx ON transactions.transaction_requests (idempotency_key_id);

CREATE INDEX payment_provider_requests_transaction_idx ON transactions.payment_provider_requests (transaction_request_id);
CREATE INDEX payment_provider_requests_status_idx ON transactions.payment_provider_requests (provider_name, status);
CREATE INDEX payment_provider_callbacks_reference_idx ON transactions.payment_provider_callbacks (provider_name, provider_reference);
CREATE INDEX payment_provider_callbacks_status_idx ON transactions.payment_provider_callbacks (processing_status, received_at);

CREATE INDEX limits_active_lookup_idx ON risk.limits (kyc_tier, transaction_type, channel, currency, status);
CREATE INDEX fees_active_lookup_idx ON risk.fees (transaction_type, channel, currency, status);
CREATE INDEX fraud_rules_active_priority_idx ON risk.fraud_rules (status, priority);
CREATE INDEX fraud_cases_status_idx ON risk.fraud_cases (status, created_at);
CREATE INDEX fraud_cases_user_idx ON risk.fraud_cases (user_id);

CREATE INDEX notifications_user_idx ON notifications.notifications (user_id, queued_at DESC);
CREATE INDEX notifications_status_idx ON notifications.notifications (status, queued_at);

CREATE INDEX reconciliation_batches_lookup_idx ON reconciliation.reconciliation_batches (provider_name, batch_type, settlement_date);
CREATE INDEX reconciliation_items_batch_idx ON reconciliation.reconciliation_items (reconciliation_batch_id);
CREATE INDEX reconciliation_items_exception_idx ON reconciliation.reconciliation_items (match_status, exception_type, resolution_status);
CREATE INDEX reconciliation_items_reference_idx ON reconciliation.reconciliation_items (provider_reference, transaction_reference);

CREATE INDEX audit_logs_actor_idx ON audit.audit_logs (actor_type, actor_id, created_at DESC);
CREATE INDEX audit_logs_resource_idx ON audit.audit_logs (resource_type, resource_id, created_at DESC);
CREATE INDEX audit_logs_action_idx ON audit.audit_logs (action, created_at DESC);
CREATE INDEX audit_logs_correlation_idx ON audit.audit_logs (correlation_id);

CREATE INDEX admin_actions_admin_idx ON admin.admin_actions (admin_user_id, requested_at DESC);
CREATE INDEX admin_actions_status_idx ON admin.admin_actions (status, requested_at);

COMMIT;

