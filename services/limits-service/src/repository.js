const { randomUUID } = require("crypto");
const { sha256 } = require("@wallet/common");
const { periodStart, evaluateRules } = require("./limits");

async function getActiveConfig(client) {
  const configResult = await client.query(`SELECT * FROM risk.limit_config_versions
    WHERE status = 'active' AND effective_from <= now() AND (effective_to IS NULL OR effective_to > now())`);
  const config = configResult.rows[0];
  if (!config) return null;
  const rules = await client.query(`SELECT * FROM risk.limit_rules WHERE config_version_id = $1 ORDER BY priority, rule_code`, [config.id]);
  return { ...config, rules: rules.rows };
}

async function usageForRules(client, context, rules, now = new Date()) {
  const usage = {};
  for (const rule of rules) {
    if (rule.window_type === "single") { usage[rule.id] = { amount_minor: 0, count: 0 }; continue; }
    const start = periodStart(rule.window_type, now, rule.window_seconds);
    const typePredicate = rule.transaction_type === "*" ? "" : " AND transaction_type=$3";
    const channelPredicate = rule.channel === "*" ? "" : " AND channel=$4";
    const params = [context.user_id, context.currency, context.transaction_type, context.channel, start];
    const result = await client.query(
      `SELECT COALESCE(SUM(amount_minor),0) AS amount_minor, COUNT(*)::integer AS count
       FROM risk.limit_reservations
       WHERE user_id=$1 AND currency=$2 AND status IN ('reserved','committed')
         ${typePredicate} ${channelPredicate} AND reserved_at >= $5`, params
    );
    usage[rule.id] = result.rows[0];
  }
  return usage;
}

async function evaluate(client, context, correlationId) {
  const config = await getActiveConfig(client);
  if (!config) { const error = new Error("No active limit configuration"); error.code = "LIMIT_CONFIG_MISSING"; throw error; }
  const usage = await usageForRules(client, context, config.rules);
  const result = evaluateRules(config.rules, context, usage);
  const decision = await client.query(
    `INSERT INTO risk.limit_decisions (user_id,transaction_reference,decision,reason_codes,amount_minor,currency,config_version_id,evaluated_usage,correlation_id)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id`,
    [context.user_id, context.transaction_reference || null, result.decision, result.reason_codes, context.amount_minor, context.currency, config.id, JSON.stringify(result.evaluations), correlationId || null]
  );
  return { ...result, decision_id: decision.rows[0].id, config_version: config.version, config_version_id: config.id };
}

async function reserve(client, context, idempotencyKey, correlationId, ttlSeconds = 900) {
  const requestHash = sha256(JSON.stringify(context));
  const existing = await client.query("SELECT * FROM risk.limit_reservations WHERE idempotency_key=$1", [idempotencyKey]);
  if (existing.rows[0]) {
    if (existing.rows[0].request_hash !== requestHash) { const error = new Error("Idempotency key payload conflict"); error.code = "IDEMPOTENCY_CONFLICT"; throw error; }
    return { reservation: existing.rows[0], repeated: true, evaluation: null };
  }
  await client.query("SELECT pg_advisory_xact_lock(hashtext($1))", [context.user_id]);
  const evaluation = await evaluate(client, context, correlationId);
  if (evaluation.decision === "deny") return { reservation: null, repeated: false, evaluation };
  const created = await client.query(
    `INSERT INTO risk.limit_reservations
      (reservation_reference,idempotency_key,request_hash,transaction_reference,user_id,kyc_tier,transaction_type,channel,amount_minor,currency,status,config_version_id,expires_at,metadata)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'reserved',$11,now()+($12*interval '1 second'),$13) RETURNING *`,
    [`LIM-${randomUUID()}`, idempotencyKey, requestHash, context.transaction_reference, context.user_id, context.kyc_tier, context.transaction_type, context.channel, context.amount_minor, context.currency, evaluation.config_version_id, ttlSeconds, context.metadata || {}]
  );
  return { reservation: created.rows[0], repeated: false, evaluation };
}

async function transition(client, reference, target) {
  const timestamp = target === "committed" ? "committed_at" : "released_at";
  const result = await client.query(
    `UPDATE risk.limit_reservations SET status=$2, ${timestamp}=now()
     WHERE reservation_reference=$1 AND status='reserved' RETURNING *`, [reference, target]
  );
  if (result.rows[0]) return result.rows[0];
  const current = await client.query("SELECT * FROM risk.limit_reservations WHERE reservation_reference=$1", [reference]);
  if (!current.rows[0]) return null;
  if (current.rows[0].status === target) return current.rows[0];
  const error = new Error(`Cannot ${target} a ${current.rows[0].status} reservation`); error.code = "INVALID_RESERVATION_STATE"; throw error;
}

async function createConfig(client, input, adminId) {
  await client.query("UPDATE risk.limit_config_versions SET status='retired', effective_to=now() WHERE status='active'");
  const version = await client.query("SELECT COALESCE(MAX(version),0)+1 AS version FROM risk.limit_config_versions");
  const created = await client.query(
    `INSERT INTO risk.limit_config_versions (version,status,description,created_by_admin_user_id) VALUES ($1,'active',$2,$3) RETURNING *`,
    [version.rows[0].version, input.description || null, adminId]
  );
  for (const rule of input.rules) await client.query(
    `INSERT INTO risk.limit_rules (config_version_id,rule_code,kyc_tier,transaction_type,channel,currency,window_type,window_seconds,max_amount_minor,max_count,priority,metadata)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
    [created.rows[0].id, rule.rule_code, rule.kyc_tier, rule.transaction_type, rule.channel, rule.currency, rule.window_type, rule.window_seconds || null, rule.max_amount_minor ?? null, rule.max_count ?? null, rule.priority || 100, rule.metadata || {}]
  );
  return getActiveConfig(client);
}

module.exports = { getActiveConfig, usageForRules, evaluate, reserve, transition, createConfig };
