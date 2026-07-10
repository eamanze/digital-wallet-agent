const { randomUUID } = require("crypto");
const { sha256 } = require("@wallet/common");
const { selectRule, calculateFee } = require("./fees");

async function getActiveConfig(client) {
  const result=await client.query(`SELECT * FROM risk.fee_config_versions WHERE status='active' AND effective_from<=now() AND (effective_to IS NULL OR effective_to>now())`);
  const config=result.rows[0]; if(!config)return null;
  const rules=await client.query("SELECT r.*, a.id AS revenue_account_id FROM risk.fee_rules r LEFT JOIN ledger.ledger_accounts a ON a.account_code=r.revenue_account_code WHERE r.config_version_id=$1 ORDER BY r.priority, r.fee_code",[config.id]);
  return {...config,rules:rules.rows};
}

async function quote(client, context, idempotencyKey, correlationId, ttlSeconds=300) {
  const requestHash=sha256(JSON.stringify(context));
  const existing=await client.query(
    `SELECT q.*, v.version AS config_version, r.revenue_account_code, a.id AS revenue_account_id
     FROM risk.fee_quotes q
     JOIN risk.fee_config_versions v ON v.id=q.config_version_id
     JOIN risk.fee_rules r ON r.config_version_id=q.config_version_id AND r.fee_code=q.fee_code
     LEFT JOIN ledger.ledger_accounts a ON a.account_code=r.revenue_account_code
     WHERE q.idempotency_key=$1`,[idempotencyKey]);
  if(existing.rows[0]){
    if(existing.rows[0].request_hash!==requestHash){const error=new Error("Idempotency key payload conflict");error.code="IDEMPOTENCY_CONFLICT";throw error;}
    const row=existing.rows[0];
    return {...row,waived:Number(row.fee_minor)===0,repeated:true,revenue_account_id:row.revenue_account_id,ledger_posting_instruction:Number(row.fee_minor)===0?null:{credit_account_id:row.revenue_account_id,credit_account_code:row.revenue_account_code,amount_minor:Number(row.fee_minor),currency:row.currency}};
  }
  const config=await getActiveConfig(client);if(!config){const error=new Error("No active fee configuration");error.code="FEE_CONFIG_MISSING";throw error;}
  const rule=selectRule(config.rules,context);if(!rule){const error=new Error("No applicable fee rule");error.code="FEE_RULE_NOT_FOUND";throw error;}
  const calculated=calculateFee(rule,context);
  const saved=await client.query(
    `INSERT INTO risk.fee_quotes (quote_reference,idempotency_key,request_hash,user_id,transaction_reference,transaction_type,channel,amount_minor,fee_minor,currency,fee_code,config_version_id,calculation,correlation_id,expires_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,now()+($15*interval '1 second')) RETURNING *`,
    [`FEE-${randomUUID()}`,idempotencyKey,requestHash,context.user_id||null,context.transaction_reference||null,context.transaction_type,context.channel,context.amount_minor,calculated.fee_minor,context.currency,rule.fee_code,config.id,calculated.calculation,correlationId||null,ttlSeconds]
  );
  return {...saved.rows[0],config_version:config.version,waived:calculated.waived,revenue_account_id:rule.revenue_account_id,revenue_account_code:calculated.revenue_account_code,ledger_posting_instruction:calculated.ledger_posting_instruction ? {...calculated.ledger_posting_instruction,credit_account_id:rule.revenue_account_id} : null,repeated:false};
}

async function createConfig(client,input,adminId){
  await client.query("UPDATE risk.fee_config_versions SET status='retired',effective_to=now() WHERE status='active'");
  const version=await client.query("SELECT COALESCE(MAX(version),0)+1 AS version FROM risk.fee_config_versions");
  const created=await client.query(`INSERT INTO risk.fee_config_versions (version,status,description,created_by_admin_user_id) VALUES ($1,'active',$2,$3) RETURNING *`,[version.rows[0].version,input.description,adminId]);
  for(const rule of input.rules)await client.query(
    `INSERT INTO risk.fee_rules (config_version_id,fee_code,transaction_type,channel,currency,fixed_amount_minor,percentage_bps,min_fee_minor,max_fee_minor,waived,waiver_conditions,revenue_account_code,priority,metadata)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)`,
    [created.rows[0].id,rule.fee_code,rule.transaction_type,rule.channel,rule.currency,rule.fixed_amount_minor||0,rule.percentage_bps||0,rule.min_fee_minor??null,rule.max_fee_minor??null,rule.waived||false,rule.waiver_conditions||{},rule.revenue_account_code||`platform_fee_revenue:${rule.currency}`,rule.priority||100,rule.metadata||{}]
  );
  return getActiveConfig(client);
}
module.exports={getActiveConfig,quote,createConfig};
