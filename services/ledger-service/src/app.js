const express = require("express");
const helmet = require("helmet");
const { z } = require("zod");
const {
  getConfig,
  createPool,
  createLogger,
  withTransaction,
  requestContext,
  sendOk,
  sendError
} = require("@wallet/common");
const repo = require("./repository");

const accountSchema = z.object({
  account_code: z.string().min(3),
  account_name: z.string().min(3),
  account_type: z.enum(["asset", "liability", "revenue", "expense", "settlement", "suspense"]),
  owner_type: z.enum(["platform", "user", "provider", "bank", "biller", "system"]),
  owner_id: z.string().uuid().optional(),
  currency: z.string().length(3)
});

const entrySchema = z.object({
  account_id: z.string().uuid(),
  entry_type: z.enum(["debit", "credit"]),
  amount_minor: z.number().int().positive(),
  currency: z.string().length(3),
  metadata: z.record(z.any()).optional()
});

const transactionSchema = z.object({
  transaction_request_id: z.string().uuid().optional(),
  ledger_reference: z.string().min(3).optional(),
  transaction_reference: z.string().min(3).optional(),
  idempotency_key: z.string().min(8).optional(),
  transaction_type: z.enum(["funding", "transfer", "withdrawal", "bill_payment", "airtime_purchase", "fee", "settlement_adjustment", "manual_adjustment"]),
  currency: z.string().length(3),
  description: z.string().optional(),
  entries: z.array(entrySchema).min(2),
  metadata: z.record(z.any()).optional()
});

const reversalSchema = z.object({
  idempotency_key: z.string().min(8).optional(),
  ledger_reference: z.string().min(3).optional(),
  transaction_reference: z.string().min(3).optional(),
  reason: z.string().min(3).optional()
});

function createApp(deps = {}) {
  const config = deps.config || getConfig("ledger-service");
  const logger = deps.logger || createLogger("ledger-service");
  const pool = deps.pool || createPool(config);
  const app = express();

  app.use(helmet());
  app.use(express.json({ limit: "512kb" }));
  app.use(requestContext);

  app.get("/health/live", (_req, res) => res.json({ status: "ok" }));
  app.get("/health/ready", async (_req, res) => {
    try {
      await pool.query("SELECT 1");
      res.json({ status: "ready" });
    } catch (_error) {
      res.status(503).json({ status: "not_ready" });
    }
  });

  app.post("/ledger/accounts", async (req, res) => {
    const parsed = accountSchema.safeParse(req.body);
    if (!parsed.success) return sendError(res, 400, "VALIDATION_ERROR", "Invalid ledger account payload");
    try {
      const account = await withTransaction(pool, (client) => repo.createLedgerAccount(client, parsed.data));
      return sendOk(res, account, 201);
    } catch (error) {
      logger.warn({ err: error, request_id: req.requestId }, "ledger account creation failed");
      return sendError(res, 409, "LEDGER_ACCOUNT_CREATE_FAILED", "Could not create ledger account");
    }
  });

  app.get("/ledger/accounts/:id", async (req, res) => {
    const account = await repo.getLedgerAccount(pool, req.params.id);
    if (!account) return sendError(res, 404, "LEDGER_ACCOUNT_NOT_FOUND", "Ledger account not found");
    return sendOk(res, account);
  });

  app.get("/ledger/accounts/:id/balance", async (req, res) => {
    const balance = await repo.getAccountBalance(pool, req.params.id);
    if (!balance) return sendError(res, 404, "LEDGER_ACCOUNT_NOT_FOUND", "Ledger account not found");
    return sendOk(res, balance);
  });

  app.get("/ledger/accounts/:id/entries", async (req, res) => {
    const limit = Math.min(Number(req.query.limit || 100), 500);
    const offset = Number(req.query.offset || 0);
    const entries = await repo.getAccountEntries(pool, req.params.id, limit, offset);
    return sendOk(res, { entries });
  });

  app.post("/ledger/transactions", async (req, res) => {
    const parsed = transactionSchema.safeParse(req.body);
    if (!parsed.success) return sendError(res, 400, "VALIDATION_ERROR", "Invalid ledger transaction payload");
    const idempotencyKey = req.get("Idempotency-Key") || parsed.data.idempotency_key;
    if (!idempotencyKey) return sendError(res, 400, "IDEMPOTENCY_KEY_REQUIRED", "Idempotency key is required");
    try {
      const transaction = await withTransaction(pool, (client) => repo.insertPostedLedgerTransaction(client, {
        ...parsed.data,
        idempotency_key: idempotencyKey,
        created_by_service: "ledger-service",
        correlation_id: req.correlationId
      }));
      return sendOk(res, transaction, 201);
    } catch (error) {
      logger.warn({ err: error, request_id: req.requestId }, "ledger transaction creation failed");
      const status = error.code === "LEDGER_UNBALANCED" ? 422 : 400;
      return sendError(res, status, error.code || "LEDGER_TRANSACTION_FAILED", error.message);
    }
  });

  app.get("/ledger/transactions/:reference", async (req, res) => {
    const transaction = await repo.getLedgerTransactionByReference(pool, req.params.reference);
    if (!transaction) return sendError(res, 404, "LEDGER_TRANSACTION_NOT_FOUND", "Ledger transaction not found");
    return sendOk(res, transaction);
  });

  app.post("/ledger/transactions/:reference/reverse", async (req, res) => {
    const parsed = reversalSchema.safeParse(req.body);
    if (!parsed.success) return sendError(res, 400, "VALIDATION_ERROR", "Invalid reversal payload");
    const idempotencyKey = req.get("Idempotency-Key") || parsed.data.idempotency_key;
    if (!idempotencyKey) return sendError(res, 400, "IDEMPOTENCY_KEY_REQUIRED", "Idempotency key is required");
    try {
      const reversal = await withTransaction(pool, (client) => repo.reverseLedgerTransaction(client, req.params.reference, {
        ...parsed.data,
        idempotency_key: idempotencyKey,
        correlation_id: req.correlationId
      }));
      if (!reversal) return sendError(res, 404, "LEDGER_TRANSACTION_NOT_FOUND", "Ledger transaction not found");
      return sendOk(res, reversal, 201);
    } catch (error) {
      logger.warn({ err: error, request_id: req.requestId }, "ledger reversal failed");
      return sendError(res, 400, error.code || "LEDGER_REVERSAL_FAILED", error.message);
    }
  });

  return { app, pool };
}

module.exports = { createApp };

