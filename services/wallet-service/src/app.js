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
  sendError,
  verifyAccessToken,
  writeAudit,
  publishOutboxEvent
} = require("@wallet/common");
const { LedgerClient } = require("./ledger-client");
const repo = require("./repository");

const createWalletSchema = z.object({
  user_id: z.string().uuid().optional(),
  currency: z.string().length(3).default("NGN"),
  metadata: z.record(z.any()).optional()
});

function authMiddleware(config) {
  return (req, res, next) => {
    const auth = req.get("authorization") || "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
    if (!token) return sendError(res, 401, "UNAUTHORIZED", "Missing bearer token");
    try {
      const claims = verifyAccessToken(config, token);
      req.user = { id: claims.sub, session_id: claims.session_id };
      next();
    } catch (_error) {
      return sendError(res, 401, "UNAUTHORIZED", "Invalid bearer token");
    }
  };
}

async function publishStatusChanged(client, req, wallet, previousStatus) {
  await publishOutboxEvent(client, {
    event_type: "wallet.status_changed",
    producer: "wallet-service",
    correlation_id: req.correlationId,
    payload: {
      wallet_id: wallet.id,
      user_id: wallet.user_id,
      previous_status: previousStatus,
      current_status: wallet.status
    }
  });
}

function createApp(deps = {}) {
  const config = deps.config || getConfig("wallet-service");
  const logger = deps.logger || createLogger("wallet-service");
  const pool = deps.pool || createPool(config);
  const ledgerClient = deps.ledgerClient || new LedgerClient(config.ledgerServiceUrl);
  const app = express();

  app.use(helmet());
  app.use(express.json({ limit: "256kb" }));
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

  app.post("/wallets", authMiddleware(config), async (req, res) => {
    const parsed = createWalletSchema.safeParse(req.body);
    if (!parsed.success) return sendError(res, 400, "VALIDATION_ERROR", "Invalid wallet payload");
    const userId = parsed.data.user_id || req.user.id;
    try {
      const wallet = await withTransaction(pool, async (client) => {
        const created = await repo.createWallet(client, {
          user_id: userId,
          currency: parsed.data.currency,
          metadata: parsed.data.metadata
        }, ledgerClient);
        await publishOutboxEvent(client, {
          event_type: "wallet.created",
          producer: "wallet-service",
          correlation_id: req.correlationId,
          payload: {
            wallet_id: created.id,
            user_id: created.user_id,
            currency: created.currency,
            ledger_account_id: created.ledger_account_id
          }
        });
        await writeAudit(client, {
          actor_type: "user",
          actor_id: req.user.id,
          action: "wallet.created",
          resource_type: "wallet",
          resource_id: created.id,
          result: "success",
          correlation_id: req.correlationId,
          request_id: req.requestId,
          metadata: { currency: created.currency, ledger_account_id: created.ledger_account_id }
        });
        return created;
      });
      return sendOk(res, wallet, 201);
    } catch (error) {
      logger.warn({ err: error, request_id: req.requestId }, "wallet creation failed");
      return sendError(res, error.code === "UNSUPPORTED_CURRENCY" ? 400 : 409, error.code || "WALLET_CREATE_FAILED", error.message);
    }
  });

  app.get("/wallets/:id", authMiddleware(config), async (req, res) => {
    const wallet = await repo.getWallet(pool, req.params.id);
    if (!wallet) return sendError(res, 404, "WALLET_NOT_FOUND", "Wallet not found");
    return sendOk(res, wallet);
  });

  app.get("/wallets/:id/balance", authMiddleware(config), async (req, res) => {
    const wallet = await repo.getWallet(pool, req.params.id);
    if (!wallet) return sendError(res, 404, "WALLET_NOT_FOUND", "Wallet not found");
    try {
      const ledgerBalance = await ledgerClient.getAccountBalance(wallet.ledger_account_id);
      const projection = await repo.upsertProjectionFromLedgerBalance(pool, wallet, ledgerBalance);
      return sendOk(res, repo.balanceResponse(wallet, projection, ledgerBalance));
    } catch (error) {
      logger.error({ err: error, request_id: req.requestId }, "wallet balance lookup failed");
      return sendError(res, 502, error.code || "LEDGER_BALANCE_FAILED", "Could not read ledger balance");
    }
  });

  app.get("/wallets/:id/statement", authMiddleware(config), async (req, res) => {
    const wallet = await repo.getWallet(pool, req.params.id);
    if (!wallet) return sendError(res, 404, "WALLET_NOT_FOUND", "Wallet not found");
    const limit = Math.min(Number(req.query.limit || 100), 500);
    const offset = Number(req.query.offset || 0);
    try {
      const statement = await ledgerClient.getAccountEntries(wallet.ledger_account_id, limit, offset);
      return sendOk(res, {
        wallet_id: wallet.id,
        ledger_account_id: wallet.ledger_account_id,
        entries: statement.entries || []
      });
    } catch (error) {
      logger.error({ err: error, request_id: req.requestId }, "wallet statement lookup failed");
      return sendError(res, 502, error.code || "LEDGER_STATEMENT_FAILED", "Could not read ledger statement");
    }
  });

  async function statusRoute(req, res, status) {
    const wallet = await repo.getWallet(pool, req.params.id);
    if (!wallet) return sendError(res, 404, "WALLET_NOT_FOUND", "Wallet not found");
    if (wallet.status === "closed" && status !== "closed") {
      return sendError(res, 409, "WALLET_CLOSED", "Closed wallet cannot be reopened");
    }
    const updated = await withTransaction(pool, async (client) => {
      const changed = await repo.updateWalletStatus(client, req.params.id, status);
      await publishStatusChanged(client, req, changed, wallet.status);
      await writeAudit(client, {
        actor_type: "user",
        actor_id: req.user.id,
        action: `wallet.${status}`,
        resource_type: "wallet",
        resource_id: changed.id,
        result: "success",
        correlation_id: req.correlationId,
        request_id: req.requestId,
        before_metadata: { status: wallet.status },
        after_metadata: { status: changed.status }
      });
      return changed;
    });
    return sendOk(res, updated);
  }

  app.post("/wallets/:id/freeze", authMiddleware(config), (req, res) => statusRoute(req, res, "frozen"));
  app.post("/wallets/:id/unfreeze", authMiddleware(config), (req, res) => statusRoute(req, res, "active"));
  app.post("/wallets/:id/close", authMiddleware(config), (req, res) => statusRoute(req, res, "closed"));

  return { app, pool, ledgerClient };
}

module.exports = { createApp };

