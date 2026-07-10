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
const repo = require("./repository");

const submitSchema = z.object({
  legal_name: z.string().min(2),
  date_of_birth: z.string().optional(),
  country_code: z.string().length(2).optional(),
  identity_type: z.string().optional(),
  identity_number: z.string().min(4).optional(),
  requested_tier: z.enum(["tier_1", "tier_2", "tier_3"]).optional(),
  metadata: z.record(z.any()).optional()
});

const documentSchema = z.object({
  document_type: z.string().min(2),
  s3_bucket: z.string().min(3),
  s3_object_key: z.string().min(3),
  checksum_sha256: z.string().min(32),
  kms_key_id: z.string().min(3),
  expires_at: z.string().optional(),
  metadata: z.record(z.any()).optional()
});

const verifySchema = z.object({
  provider_name: z.string().optional(),
  provider_reference: z.string().optional(),
  mock_decision: z.enum(["approved", "rejected", "manual_review"]).optional(),
  tier: z.enum(["tier_1", "tier_2", "tier_3"]).optional(),
  reason: z.string().optional(),
  metadata: z.record(z.any()).optional()
});

const decisionSchema = z.object({
  decision: z.enum(["approved", "rejected", "manual_review"]),
  tier: z.enum(["tier_1", "tier_2", "tier_3"]).optional(),
  reason: z.string().optional(),
  reviewed_by_admin_user_id: z.string().uuid().optional()
});

function authMiddleware(config) {
  return (req, res, next) => {
    const auth = req.get("authorization") || "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
    if (!token) return sendError(res, 401, "UNAUTHORIZED", "Missing bearer token");
    try {
      const claims = verifyAccessToken(config, token);
      req.user = { id: claims.sub, session_id: claims.session_id, status: claims.status };
      next();
    } catch (_error) {
      return sendError(res, 401, "UNAUTHORIZED", "Invalid bearer token");
    }
  };
}

function adminMiddleware(config) {
  return (req, res, next) => {
    const adminId = req.get("X-Admin-User-ID");
    if (adminId) {
      req.admin = { id: adminId };
      return next();
    }
    return authMiddleware(config)(req, res, next);
  };
}

function eventForDecision(decision) {
  if (decision === "approved") return "kyc.approved";
  if (decision === "rejected") return "kyc.rejected";
  return "kyc.manual_review_required";
}

async function publishDecisionEvents(client, producer, correlationId, decisionResult) {
  const eventType = eventForDecision(decisionResult.current.status);
  await publishOutboxEvent(client, {
    event_type: eventType,
    producer,
    correlation_id: correlationId,
    payload: {
      user_id: decisionResult.current.user_id,
      kyc_profile_id: decisionResult.current.id,
      status: decisionResult.current.status,
      tier: decisionResult.current.tier
    }
  });
  if (decisionResult.previous.tier !== decisionResult.current.tier) {
    await publishOutboxEvent(client, {
      event_type: "kyc.tier_changed",
      producer,
      correlation_id: correlationId,
      payload: {
        user_id: decisionResult.current.user_id,
        previous_tier: decisionResult.previous.tier,
        current_tier: decisionResult.current.tier
      }
    });
  }
}

function createApp(deps = {}) {
  const config = deps.config || getConfig("kyc-service");
  const logger = deps.logger || createLogger("kyc-service");
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

  app.post("/kyc/profile", authMiddleware(config), async (req, res) => {
    const parsed = submitSchema.safeParse(req.body);
    if (!parsed.success) return sendError(res, 400, "VALIDATION_ERROR", "Invalid KYC profile payload");
    try {
      const profile = await withTransaction(pool, async (client) => {
        const submitted = await repo.submitKycProfile(client, req.user.id, parsed.data);
        await publishOutboxEvent(client, {
          event_type: "kyc.submitted",
          producer: "kyc-service",
          correlation_id: req.correlationId,
          payload: {
            user_id: req.user.id,
            kyc_profile_id: submitted.id,
            requested_tier: parsed.data.requested_tier || "tier_1"
          }
        });
        await writeAudit(client, {
          actor_type: "user",
          actor_id: req.user.id,
          action: "kyc.profile.submitted",
          resource_type: "kyc_profile",
          resource_id: submitted.id,
          result: "success",
          correlation_id: req.correlationId,
          request_id: req.requestId,
          metadata: { requested_tier: parsed.data.requested_tier || "tier_1" }
        });
        return submitted;
      });
      return sendOk(res, { kyc_profile_id: profile.id, status: profile.status, tier: profile.tier }, 201);
    } catch (error) {
      logger.warn({ err: error, request_id: req.requestId }, "kyc profile submission failed");
      return sendError(res, 400, "KYC_SUBMIT_FAILED", "Could not submit KYC profile");
    }
  });

  app.post("/kyc/documents", authMiddleware(config), async (req, res) => {
    const parsed = documentSchema.safeParse(req.body);
    if (!parsed.success) return sendError(res, 400, "VALIDATION_ERROR", "Invalid KYC document metadata");
    try {
      const document = await withTransaction(pool, async (client) => {
        const created = await repo.addKycDocument(client, req.user.id, parsed.data);
        await writeAudit(client, {
          actor_type: "user",
          actor_id: req.user.id,
          action: "kyc.document.metadata_uploaded",
          resource_type: "kyc_document",
          resource_id: created.id,
          result: "success",
          correlation_id: req.correlationId,
          request_id: req.requestId,
          metadata: {
            document_type: created.document_type,
            s3_bucket: created.s3_bucket,
            s3_object_key: created.s3_object_key,
            encryption_status: created.encryption_status,
            access_policy: created.access_policy
          }
        });
        return created;
      });
      return sendOk(res, {
        document_id: document.id,
        document_type: document.document_type,
        s3_bucket: document.s3_bucket,
        s3_object_key: document.s3_object_key,
        encryption_status: document.encryption_status,
        access_policy: document.access_policy
      }, 201);
    } catch (error) {
      logger.warn({ err: error, request_id: req.requestId }, "kyc document metadata upload failed");
      return sendError(res, error.code === "KYC_PROFILE_NOT_FOUND" ? 404 : 400, error.code || "KYC_DOCUMENT_FAILED", "Could not store KYC document metadata");
    }
  });

  app.get("/kyc/status", authMiddleware(config), async (req, res) => {
    const status = await repo.getKycStatus(pool, req.user.id);
    if (!status) return sendError(res, 404, "KYC_PROFILE_NOT_FOUND", "KYC profile not found");
    return sendOk(res, status);
  });

  app.post("/kyc/provider/verify", authMiddleware(config), async (req, res) => {
    const parsed = verifySchema.safeParse(req.body);
    if (!parsed.success) return sendError(res, 400, "VALIDATION_ERROR", "Invalid provider verification payload");
    try {
      const result = await withTransaction(pool, async (client) => {
        const profile = await repo.getKycProfileByUser(client, req.user.id);
        if (!profile) return null;
        const attempt = await repo.createProviderAttempt(client, profile, parsed.data);
        await writeAudit(client, {
          actor_type: "user",
          actor_id: req.user.id,
          action: "kyc.provider.verification_requested",
          resource_type: "kyc_profile",
          resource_id: profile.id,
          result: "success",
          correlation_id: req.correlationId,
          request_id: req.requestId,
          metadata: { provider_name: attempt.provider_name }
        });
        if (parsed.data.mock_decision) {
          const decision = await repo.decideKyc(client, profile.id, {
            decision: parsed.data.mock_decision,
            tier: parsed.data.tier,
            reason: parsed.data.reason
          });
          await publishDecisionEvents(client, "kyc-service", req.correlationId, decision);
          return { attempt, decision: decision.current };
        }
        return { attempt, decision: null };
      });
      if (!result) return sendError(res, 404, "KYC_PROFILE_NOT_FOUND", "KYC profile not found");
      return sendOk(res, {
        provider_reference: result.attempt.provider_reference,
        status: result.decision?.status || "provider_pending",
        tier: result.decision?.tier
      }, 202);
    } catch (error) {
      logger.warn({ err: error, request_id: req.requestId }, "kyc provider verification failed");
      return sendError(res, 400, "KYC_PROVIDER_FAILED", "Could not verify KYC profile");
    }
  });

  app.post("/admin/kyc/:profileId/decision", adminMiddleware(config), async (req, res) => {
    const parsed = decisionSchema.safeParse(req.body);
    if (!parsed.success) return sendError(res, 400, "VALIDATION_ERROR", "Invalid KYC decision payload");
    try {
      const decision = await withTransaction(pool, async (client) => {
        const result = await repo.decideKyc(client, req.params.profileId, {
          ...parsed.data,
          reviewed_by_admin_user_id: parsed.data.reviewed_by_admin_user_id || req.admin?.id || null
        });
        if (!result) return null;
        await publishDecisionEvents(client, "kyc-service", req.correlationId, result);
        await writeAudit(client, {
          actor_type: req.admin ? "admin" : "user",
          actor_id: req.admin?.id || req.user?.id || null,
          action: `kyc.${parsed.data.decision}`,
          resource_type: "kyc_profile",
          resource_id: result.current.id,
          result: "success",
          reason: parsed.data.reason || null,
          correlation_id: req.correlationId,
          request_id: req.requestId,
          metadata: { tier: result.current.tier }
        });
        return result.current;
      });
      if (!decision) return sendError(res, 404, "KYC_PROFILE_NOT_FOUND", "KYC profile not found");
      return sendOk(res, { kyc_profile_id: decision.id, status: decision.status, tier: decision.tier });
    } catch (error) {
      logger.warn({ err: error, request_id: req.requestId }, "kyc admin decision failed");
      return sendError(res, 400, "KYC_DECISION_FAILED", "Could not apply KYC decision");
    }
  });

  return { app, pool };
}

module.exports = { createApp };

