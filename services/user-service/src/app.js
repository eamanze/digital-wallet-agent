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
const { createUserProfile, getUserProfile, updateUserProfile } = require("./repository");

const createProfileSchema = z.object({
  phone_e164: z.string().min(7).optional(),
  email: z.string().email().optional(),
  first_name: z.string().min(1).optional(),
  middle_name: z.string().optional(),
  last_name: z.string().min(1).optional(),
  date_of_birth: z.string().optional(),
  address_line1: z.string().optional(),
  address_line2: z.string().optional(),
  city: z.string().optional(),
  state_region: z.string().optional(),
  country_code: z.string().length(2).optional(),
  status: z.enum(["pending", "active", "suspended", "closed"]).optional(),
  metadata: z.record(z.any()).optional()
});

const updateProfileSchema = createProfileSchema.extend({
  phone_verified: z.boolean().optional(),
  email_verified: z.boolean().optional()
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

function createApp(deps = {}) {
  const config = deps.config || getConfig("user-service");
  const logger = deps.logger || createLogger("user-service");
  const pool = deps.pool || createPool(config);
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

  app.post("/users", authMiddleware(config), async (req, res) => {
    const parsed = createProfileSchema.safeParse(req.body);
    if (!parsed.success) return sendError(res, 400, "VALIDATION_ERROR", "Invalid user profile payload");

    try {
      const profile = await withTransaction(pool, async (client) => {
        const created = await createUserProfile(client, parsed.data);
        await publishOutboxEvent(client, {
          event_type: "user.created",
          producer: "user-service",
          correlation_id: req.correlationId,
          payload: { user_id: created.id, status: created.status }
        });
        await writeAudit(client, {
          actor_type: "user",
          actor_id: req.user.id,
          action: "user.profile.created",
          resource_type: "user",
          resource_id: created.id,
          result: "success",
          correlation_id: req.correlationId,
          request_id: req.requestId
        });
        return created;
      });
      return sendOk(res, profile, 201);
    } catch (error) {
      logger.warn({ err: error, request_id: req.requestId }, "user profile creation failed");
      return sendError(res, 409, "USER_CREATE_FAILED", "Could not create user profile");
    }
  });

  app.get("/users/me", authMiddleware(config), async (req, res) => {
    const profile = await getUserProfile(pool, req.user.id);
    if (!profile) return sendError(res, 404, "USER_NOT_FOUND", "User profile not found");
    return sendOk(res, profile);
  });

  app.get("/users/:id", authMiddleware(config), async (req, res) => {
    const profile = await getUserProfile(pool, req.params.id);
    if (!profile) return sendError(res, 404, "USER_NOT_FOUND", "User profile not found");
    return sendOk(res, profile);
  });

  app.patch("/users/:id", authMiddleware(config), async (req, res) => {
    const parsed = updateProfileSchema.safeParse(req.body);
    if (!parsed.success) return sendError(res, 400, "VALIDATION_ERROR", "Invalid user profile payload");

    try {
      const profile = await withTransaction(pool, async (client) => {
        const updated = await updateUserProfile(client, req.params.id, parsed.data);
        if (!updated) return null;
        await publishOutboxEvent(client, {
          event_type: "user.updated",
          producer: "user-service",
          correlation_id: req.correlationId,
          payload: { user_id: updated.id, status: updated.status }
        });
        await writeAudit(client, {
          actor_type: "user",
          actor_id: req.user.id,
          action: "user.profile.updated",
          resource_type: "user",
          resource_id: updated.id,
          result: "success",
          correlation_id: req.correlationId,
          request_id: req.requestId,
          metadata: { fields: Object.keys(parsed.data) }
        });
        return updated;
      });
      if (!profile) return sendError(res, 404, "USER_NOT_FOUND", "User profile not found");
      return sendOk(res, profile);
    } catch (error) {
      logger.warn({ err: error, request_id: req.requestId }, "user profile update failed");
      return sendError(res, 400, error.code || "USER_UPDATE_FAILED", "Could not update user profile");
    }
  });

  return { app, pool };
}

module.exports = { createApp };

