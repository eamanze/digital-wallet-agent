const express = require("express");
const helmet = require("helmet");
const { z } = require("zod");
const { getConfig, createPool, createLogger, withTransaction, requestContext, sendOk, sendError, verifyAccessToken, publishOutboxEvent, writeAudit } = require("@wallet/common");
const repo = require("./repository");

const transactionTypes = ["wallet_transfer", "withdrawal", "bill_payment", "airtime_purchase", "wallet_funding"];
const contextSchema = z.object({
  user_id: z.string().uuid(), kyc_tier: z.enum(["tier_0","tier_1","tier_2","tier_3"]),
  transaction_reference: z.string().min(3), transaction_type: z.enum(transactionTypes), channel: z.string().min(1),
  amount_minor: z.number().int().positive().max(Number.MAX_SAFE_INTEGER), currency: z.string().length(3).transform((v) => v.toUpperCase()),
  metadata: z.record(z.any()).optional()
});
const ruleSchema = z.object({
  rule_code: z.string().min(3), kyc_tier: z.enum(["tier_0","tier_1","tier_2","tier_3"]), transaction_type: z.string().min(1), channel: z.string().min(1),
  currency: z.string().length(3).transform((v) => v.toUpperCase()), window_type: z.enum(["single","daily","monthly","rolling"]),
  window_seconds: z.number().int().positive().optional(), max_amount_minor: z.number().int().nonnegative().optional(), max_count: z.number().int().nonnegative().optional(),
  priority: z.number().int().optional(), metadata: z.record(z.any()).optional()
}).refine((r) => r.max_amount_minor !== undefined || r.max_count !== undefined, "amount or count required")
  .refine((r) => r.window_type !== "rolling" || r.window_seconds, "rolling window requires seconds");
const configSchema = z.object({ description: z.string().min(3), reason: z.string().min(3), rules: z.array(ruleSchema).min(1) });

function bearer(config, requiredRole) {
  return (req, res, next) => {
    const value = req.get("authorization") || "";
    try {
      const claims = verifyAccessToken(config, value.startsWith("Bearer ") ? value.slice(7) : "");
      if (requiredRole && !(claims.roles || []).includes(requiredRole)) return sendError(res, 403, "FORBIDDEN", `Role ${requiredRole} is required`);
      req.actor = { id: claims.sub, roles: claims.roles || [] }; next();
    } catch (_error) { return sendError(res, 401, "UNAUTHORIZED", "Valid bearer token required"); }
  };
}

function createApp(deps = {}) {
  const config = deps.config || getConfig("limits-service");
  const pool = deps.pool || createPool(config); const logger = deps.logger || createLogger("limits-service"); const app = express();
  app.use(helmet()); app.use(express.json({ limit: "256kb" })); app.use(requestContext);
  app.get("/health/live", (_req,res) => res.json({status:"ok"}));
  app.get("/health/ready", async (_req,res) => { try { await pool.query("SELECT 1"); res.json({status:"ready"}); } catch (_e) { res.status(503).json({status:"not_ready"}); } });

  app.post("/limits/evaluate", bearer(config), async (req,res) => {
    const parsed=contextSchema.safeParse(req.body); if(!parsed.success) return sendError(res,400,"VALIDATION_ERROR","Invalid limit context");
    try { const result=await withTransaction(pool, async(client)=>{
      const decision=await repo.evaluate(client,parsed.data,req.correlationId);
      await publishOutboxEvent(client,{event_type:`limits.transaction.${decision.decision === "allow" ? "allowed" : "denied"}`,producer:"limits-service",correlation_id:req.correlationId,payload:{decision_id:decision.decision_id,user_id:parsed.data.user_id,transaction_reference:parsed.data.transaction_reference,reason_codes:decision.reason_codes}});
      return decision;
    }); return sendOk(res,result);
    } catch(error){logger.warn({err:error,request_id:req.requestId},"limit evaluation failed");return sendError(res,503,error.code||"LIMIT_EVALUATION_FAILED",error.message);}
  });

  app.get("/limits/remaining", bearer(config), async(req,res)=>{
    const parsed=contextSchema.safeParse({...req.query,amount_minor:Number(req.query.amount_minor||1)}); if(!parsed.success)return sendError(res,400,"VALIDATION_ERROR","Invalid remaining-limit query");
    try { const result=await withTransaction(pool,(client)=>repo.evaluate(client,parsed.data,req.correlationId)); return sendOk(res,{decision:result.decision,reason_codes:result.reason_codes,remaining:result.evaluations,config_version:result.config_version}); }
    catch(error){return sendError(res,503,error.code||"LIMIT_EVALUATION_FAILED",error.message);}
  });

  app.post("/limits/reservations", bearer(config), async(req,res)=>{
    const parsed=contextSchema.safeParse(req.body); if(!parsed.success)return sendError(res,400,"VALIDATION_ERROR","Invalid limit reservation");
    const key=req.get("Idempotency-Key"); if(!key||key.length<8)return sendError(res,400,"IDEMPOTENCY_KEY_REQUIRED","Idempotency-Key is required");
    try { const result=await withTransaction(pool,async(client)=>{
      const reserved=await repo.reserve(client,parsed.data,key,req.correlationId);
      await publishOutboxEvent(client,{event_type:`limits.transaction.${reserved.reservation ? "allowed" : "denied"}`,producer:"limits-service",correlation_id:req.correlationId,payload:{user_id:parsed.data.user_id,transaction_reference:parsed.data.transaction_reference,reservation_reference:reserved.reservation?.reservation_reference,reason_codes:reserved.evaluation?.reason_codes||[]}});
      return reserved;
    }); if(!result.reservation)return res.status(422).json({request_id:req.requestId,status:"failed",data:result.evaluation,error:{code:"LIMIT_EXCEEDED",message:"Transaction exceeds configured limits"}});
      return sendOk(res,result,result.repeated?200:201);
    } catch(error){return sendError(res,error.code==="IDEMPOTENCY_CONFLICT"?409:400,error.code||"LIMIT_RESERVATION_FAILED",error.message);}
  });

  for (const [path,target] of [["commit","committed"],["release","released"]]) app.post(`/limits/reservations/:reference/${path}`,bearer(config),async(req,res)=>{
    try { const result=await withTransaction(pool,(client)=>repo.transition(client,req.params.reference,target)); if(!result)return sendError(res,404,"RESERVATION_NOT_FOUND","Limit reservation not found"); return sendOk(res,result); }
    catch(error){return sendError(res,409,error.code||"RESERVATION_TRANSITION_FAILED",error.message);}
  });

  app.get("/limits/config",bearer(config),async(_req,res)=>{const value=await repo.getActiveConfig(pool);return value?sendOk(res,value):sendError(res,404,"LIMIT_CONFIG_NOT_FOUND","No active configuration");});
  app.post("/limits/config",bearer(config,"risk_admin"),async(req,res)=>{
    const parsed=configSchema.safeParse(req.body);if(!parsed.success)return sendError(res,400,"VALIDATION_ERROR","Invalid limit configuration");
    try { const created=await withTransaction(pool,async(client)=>{const result=await repo.createConfig(client,parsed.data,req.actor.id);await writeAudit(client,{actor_type:"admin",actor_id:req.actor.id,action:"limits.config.changed",resource_type:"limit_config",resource_id:result.id,result:"success",reason:parsed.data.reason,correlation_id:req.correlationId,request_id:req.requestId,after_metadata:{version:result.version,rule_count:result.rules.length}});return result;});return sendOk(res,created,201); }
    catch(error){logger.error({err:error,request_id:req.requestId},"limit config change failed");return sendError(res,400,"LIMIT_CONFIG_CHANGE_FAILED","Could not activate limit configuration");}
  });
  return {app,pool};
}
module.exports={createApp};
