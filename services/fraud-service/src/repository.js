const { randomUUID } = require("crypto");
const { sha256 } = require("@wallet/common");
const { evaluateRisk } = require("./rules");

async function getRules(client) {
  const result = await client.query("SELECT * FROM risk.fraud_rules WHERE status='active' AND effective_from<=now() AND (effective_to IS NULL OR effective_to>now()) ORDER BY priority, rule_code");
  return result.rows;
}

async function evaluate(client, input, idempotencyKey, correlationId) {
  const requestHash = sha256(JSON.stringify(input));
  const existing = await client.query("SELECT * FROM risk.fraud_decisions WHERE idempotency_key=$1", [idempotencyKey]);
  if (existing.rows[0]) {
    if (existing.rows[0].request_hash !== requestHash) { const error = new Error("Idempotency key payload conflict"); error.code = "IDEMPOTENCY_CONFLICT"; throw error; }
    return { ...existing.rows[0], repeated: true };
  }
  const result = evaluateRisk(input, await getRules(client));
  const saved = await client.query(`INSERT INTO risk.fraud_decisions
    (idempotency_key,request_hash,evaluation_type,user_id,transaction_reference,decision,risk_score,reason_codes,evidence,correlation_id)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
    [idempotencyKey, requestHash, input.evaluation_type, input.user_id || null, input.transaction_reference || null, result.decision, result.risk_score, result.reason_codes, JSON.stringify(result.evidence), correlationId || null]);
  const decision = saved.rows[0];
  let fraudCase = null;
  if (["manual_review", "block", "restrict_account"].includes(result.decision)) {
    const created = await client.query(`INSERT INTO risk.fraud_cases
      (case_reference,transaction_request_id,user_id,risk_score,decision,status,reason_codes,evidence,fraud_decision_id)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [`FRC-${randomUUID()}`, input.transaction_request_id || null, input.user_id || null, result.risk_score, result.decision, result.decision === "manual_review" ? "open" : "closed", result.reason_codes, JSON.stringify(result.evidence), decision.id]);
    fraudCase = created.rows[0];
  }
  return { ...decision, fraud_case: fraudCase, repeated: false };
}

async function getCase(client, reference) {
  const result = await client.query("SELECT * FROM risk.fraud_cases WHERE case_reference=$1", [reference]);
  return result.rows[0] || null;
}

async function listCases(client, status) {
  const result = await client.query("SELECT * FROM risk.fraud_cases WHERE ($1::text IS NULL OR status=$1) ORDER BY created_at DESC LIMIT 100", [status || null]);
  return result.rows;
}

module.exports = { getRules, evaluate, getCase, listCases };
