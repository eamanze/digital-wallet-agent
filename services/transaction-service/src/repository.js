const { randomUUID } = require("crypto");
const { sha256 } = require("@wallet/common");
const { assertTransition } = require("./state-machine");

async function create(client, input, idempotencyKey) {
  const requestHash = sha256(JSON.stringify(input));
  const existingKey = await client.query("SELECT * FROM platform.idempotency_keys WHERE service_name='transaction-service' AND operation_name=$1 AND idempotency_key=$2", [input.transaction_type, idempotencyKey]);
  if (existingKey.rows[0]) {
    if (existingKey.rows[0].request_hash !== requestHash) { const error = new Error("Idempotency key payload conflict"); error.code = "IDEMPOTENCY_CONFLICT"; throw error; }
    const existing = await client.query("SELECT * FROM transactions.transaction_requests WHERE idempotency_key_id=$1", [existingKey.rows[0].id]);
    return { transaction: existing.rows[0], repeated: true };
  }
  const key = await client.query(`INSERT INTO platform.idempotency_keys(service_name,operation_name,idempotency_key,request_hash,status,expires_at)
    VALUES ('transaction-service',$1,$2,$3,'in_progress',now()+interval '24 hours') RETURNING *`, [input.transaction_type, idempotencyKey, requestHash]);
  const reference = `TX-${randomUUID()}`;
  const result = await client.query(`INSERT INTO transactions.transaction_requests
    (user_id,source_wallet_id,destination_wallet_id,transaction_reference,idempotency_key_id,transaction_type,status,amount_minor,fee_minor,currency,narration,metadata)
    VALUES ($1,$2,$3,$4,$5,$6,'initiated',$7,0,$8,$9,$10) RETURNING *`,
    [input.user_id || null, input.source_wallet_id || null, input.destination_wallet_id || null, reference, key.rows[0].id, input.transaction_type, input.amount_minor, input.currency, input.narration || null, input.metadata || {}]);
  return { transaction: result.rows[0], repeated: false };
}

async function transition(client, id, target, metadata = {}) {
  const current = await client.query("SELECT * FROM transactions.transaction_requests WHERE id=$1 FOR UPDATE", [id]);
  if (!current.rows[0]) return null;
  assertTransition(current.rows[0].status, target);
  const result = await client.query(`UPDATE transactions.transaction_requests SET status=$2, updated_at=now(), completed_at=CASE WHEN $2='successful' THEN now() ELSE completed_at END,
    failure_reason=COALESCE($3,failure_reason), failure_code=COALESCE($4,failure_code), ledger_reference=COALESCE($5,ledger_reference), provider_name=COALESCE($6,provider_name), provider_reference=COALESCE($7,provider_reference),
    limit_reservation_reference=COALESCE($8,limit_reservation_reference), fee_quote_reference=COALESCE($9,fee_quote_reference), fraud_decision_id=COALESCE($10,fraud_decision_id), reversed_at=CASE WHEN $2='reversed' THEN now() ELSE reversed_at END
    WHERE id=$1 RETURNING *`, [id, target, metadata.failure_reason || null, metadata.failure_code || null, metadata.ledger_reference || null, metadata.provider_name || null, metadata.provider_reference || null, metadata.limit_reservation_reference || null, metadata.fee_quote_reference || null, metadata.fraud_decision_id || null]);
  return result.rows[0];
}

async function get(client, idOrReference) { const result = await client.query("SELECT * FROM transactions.transaction_requests WHERE id::text=$1 OR transaction_reference=$1", [idOrReference]); return result.rows[0] || null; }
async function history(client, userId, limit = 50, offset = 0) { const result = await client.query("SELECT * FROM transactions.transaction_requests WHERE user_id=$1 ORDER BY created_at DESC,id DESC LIMIT $2 OFFSET $3", [userId, Math.min(limit, 100), offset]); return result.rows; }
async function saveProviderRequest(client, transactionId, providerName, operation, providerReference) { const result = await client.query(`INSERT INTO transactions.payment_provider_requests(transaction_request_id,provider_name,provider_operation,provider_reference,provider_idempotency_key,status,request_hash) VALUES ($1,$2,$3,$4,$5,'created',$6) RETURNING *`, [transactionId, providerName, operation, providerReference, providerReference, sha256(`${transactionId}:${providerReference}`)]); return result.rows[0]; }
async function callback(client, input) {
  const hash = sha256(JSON.stringify(input.payload || {}));
  const existing = await client.query("SELECT * FROM transactions.payment_provider_callbacks WHERE provider_name=$1 AND provider_reference=$2 AND event_type=$3 AND payload_hash=$4", [input.provider_name, input.provider_reference, input.event_type, hash]);
  if (existing.rows[0]) return { callback: existing.rows[0], duplicate: true };
  const result = await client.query(`INSERT INTO transactions.payment_provider_callbacks(provider_name,provider_reference,provider_callback_id,event_type,normalized_status,payload_hash,signature_valid,processing_status) VALUES ($1,$2,$3,$4,$5,$6,$7,'received') RETURNING *`, [input.provider_name, input.provider_reference, input.provider_callback_id || null, input.event_type, input.normalized_status, hash, input.signature_valid === true]);
  return { callback: result.rows[0], duplicate: false };
}
module.exports = { create, transition, get, history, saveProviderRequest, callback };
