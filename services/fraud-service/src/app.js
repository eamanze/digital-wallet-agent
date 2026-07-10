const express = require("express");
const helmet = require("helmet");
const { z } = require("zod");
const { getConfig, createPool, createLogger, withTransaction, requestContext, sendOk, sendError, verifyAccessToken, publishOutboxEvent, writeAudit } = require("@wallet/common");
const repo = require("./repository");

const evaluationSchema = z.object({
  evaluation_type: z.enum(["transaction", "login", "device", "ip", "velocity"]),
  user_id: z.string().uuid().optional(), transaction_request_id: z.string().uuid().optional(), transaction_reference: z.string().min(3).optional(),
  amount_minor: z.number().int().positive().max(Number.MAX_SAFE_INTEGER).optional(), currency: z.string().length(3).transform((value) => value.toUpperCase()).optional(),
  new_device: z.boolean().optional(), suspicious_ip: z.boolean().optional(), failed_pin_attempts: z.number().int().nonnegative().optional(), transaction_count_window: z.number().int().nonnegative().optional(), velocity_window_seconds: z.number().int().positive().optional(), unusual_amount: z.boolean().optional(), device_account_count: z.number().int().nonnegative().optional(), recent_funding_withdrawal_count: z.number().int().nonnegative().optional(), funding_withdrawal_window_seconds: z.number().int().positive().optional(), metadata: z.record(z.any()).optional()
});

function auth(config) { return (req, res, next) => { const value = req.get("authorization") || ""; try { const token = value.startsWith("Bearer ") ? value.slice(7) : ""; const claims = verifyAccessToken(config, token); req.actor = { id: claims.sub }; next(); } catch (_error) { return sendError(res, 401, "UNAUTHORIZED", "Valid bearer token required"); } }; }

function createApp(deps = {}) {
  const config = deps.config || getConfig("fraud-service"); const pool = deps.pool || createPool(config); const logger = deps.logger || createLogger("fraud-service"); const app = express();
  app.use(helmet()); app.use(express.json({ limit: "256kb" })); app.use(requestContext);
  app.get("/health/live", (_req, res) => res.json({ status: "ok" }));
  app.get("/health/ready", async (_req, res) => { try { await pool.query("SELECT 1"); res.json({ status: "ready" }); } catch (_error) { res.status(503).json({ status: "not_ready" }); } });

  const evaluateHandler = async (req, res) => {
    const parsed = evaluationSchema.safeParse(req.body); if (!parsed.success) return sendError(res, 400, "VALIDATION_ERROR", "Invalid fraud evaluation payload");
    const key = req.get("Idempotency-Key"); if (!key || key.length < 8) return sendError(res, 400, "IDEMPOTENCY_KEY_REQUIRED", "Idempotency-Key is required");
    try {
      const result = await withTransaction(pool, async (client) => {
        const decision = await repo.evaluate(client, parsed.data, key, req.correlationId);
        if (!decision.repeated) {
          await writeAudit(client, { actor_type: "system", action: `fraud.${parsed.data.evaluation_type}.evaluated`, resource_type: "fraud_decision", resource_id: decision.id, result: decision.decision === "block" ? "blocked" : "success", reason: decision.reason_codes.join(",") || null, correlation_id: req.correlationId, request_id: req.requestId, metadata: { risk_score: decision.risk_score, reason_codes: decision.reason_codes } });
          if (decision.fraud_case) await publishOutboxEvent(client, { event_type: "fraud.case_created", producer: "fraud-service", correlation_id: req.correlationId, payload: { case_reference: decision.fraud_case.case_reference, decision_id: decision.id, user_id: decision.user_id, decision: decision.decision, risk_score: decision.risk_score, reason_codes: decision.reason_codes } });
          if (decision.decision === "block") await publishOutboxEvent(client, { event_type: "fraud.transaction_blocked", producer: "fraud-service", correlation_id: req.correlationId, payload: { decision_id: decision.id, transaction_reference: decision.transaction_reference, user_id: decision.user_id, reason_codes: decision.reason_codes } });
        }
        return decision;
      });
      return sendOk(res, result, result.repeated ? 200 : 201);
    } catch (error) { logger.warn({ err: error, request_id: req.requestId }, "fraud evaluation failed"); return sendError(res, error.code === "IDEMPOTENCY_CONFLICT" ? 409 : 400, error.code || "FRAUD_EVALUATION_FAILED", error.message); }
  };
  app.post("/risk/evaluate", auth(config), evaluateHandler);
  for (const type of ["login", "device", "ip", "velocity"]) app.post(`/risk/evaluate/${type}`, auth(config), (req, res) => { req.body = { ...req.body, evaluation_type: type }; return evaluateHandler(req, res); });
  app.get("/risk/cases", auth(config), async (req, res) => sendOk(res, { cases: await repo.listCases(pool, req.query.status) }));
  app.get("/risk/cases/:reference", auth(config), async (req, res) => { const fraudCase = await repo.getCase(pool, req.params.reference); return fraudCase ? sendOk(res, fraudCase) : sendError(res, 404, "FRAUD_CASE_NOT_FOUND", "Fraud case not found"); });
  return { app, pool };
}

module.exports = { createApp, evaluationSchema };
