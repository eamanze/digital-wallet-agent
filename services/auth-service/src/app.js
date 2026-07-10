const express = require("express");
const helmet = require("helmet");
const { z } = require("zod");
const { randomUUID } = require("crypto");
const {
  getConfig,
  createPool,
  createRedis,
  createLogger,
  withTransaction,
  requestContext,
  sendOk,
  sendError,
  incrementRateLimit,
  isStrongPassword,
  isValidPin,
  generateOtp,
  generateOpaqueToken,
  hashSecret,
  verifySecret,
  sha256,
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  writeAudit,
  publishOutboxEvent
} = require("@wallet/common");
const repo = require("./repository");

const registerSchema = z.object({
  phone_e164: z.string().min(7).optional(),
  email: z.string().email().optional(),
  password: z.string().min(12),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  country_code: z.string().length(2).optional(),
  device: z.object({
    device_fingerprint: z.string().min(8),
    device_name: z.string().optional(),
    platform: z.string().optional(),
    app_version: z.string().optional(),
    metadata: z.record(z.any()).optional()
  }).optional()
}).refine((data) => data.phone_e164 || data.email, "phone_e164 or email is required");

const loginSchema = z.object({
  login: z.string().min(3),
  password: z.string().min(1),
  device: z.object({
    device_fingerprint: z.string().min(8),
    device_name: z.string().optional(),
    platform: z.string().optional(),
    app_version: z.string().optional(),
    metadata: z.record(z.any()).optional()
  })
});

const otpRequestSchema = z.object({
  login: z.string().min(3).optional(),
  destination: z.string().min(3),
  purpose: z.enum(["phone_verification", "email_verification", "login_mfa", "pin_reset", "password_reset", "new_device_verification", "high_risk_transaction"])
});

const otpVerifySchema = otpRequestSchema.extend({
  otp: z.string().length(6)
});

const refreshSchema = z.object({ refresh_token: z.string().min(20) });
const mfaSetupSchema = z.object({ factor_type: z.enum(["sms", "email"]) });
const mfaVerifySchema = z.object({ challenge_id: z.string().uuid().optional(), destination: z.string().min(3).optional(), otp: z.string().length(6), factor_type: z.enum(["sms", "email"]).optional() });
const pinSetupSchema = z.object({ pin: z.string().min(4).max(6), otp: z.string().length(6).optional(), destination: z.string().min(3).optional() });
const pinVerifySchema = z.object({ pin: z.string().min(4).max(6) });

function authMiddleware(config) {
  return (req, res, next) => {
    const auth = req.get("authorization") || "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
    if (!token) return sendError(res, 401, "UNAUTHORIZED", "Missing bearer token");
    try {
      const claims = verifyAccessToken(config, token);
      req.user = { id: claims.sub, session_id: claims.session_id, device_id: claims.device_id };
      next();
    } catch (_error) {
      return sendError(res, 401, "UNAUTHORIZED", "Invalid bearer token");
    }
  };
}

async function issueTokens({ client, redis, config, user, device, req, rotatedFromSessionId, familyId }) {
  const refreshToken = generateOpaqueToken();
  const session = await repo.createSession(client, {
    user_id: user.id,
    device_id: device?.id || null,
    refresh_token: refreshToken,
    refresh_ttl_seconds: config.refreshTokenTtlSeconds,
    refresh_token_family_id: familyId,
    rotated_from_session_id: rotatedFromSessionId || null,
    ip_address_hash: sha256(req.ip || ""),
    user_agent_hash: sha256(req.get("user-agent") || "")
  });
  const accessToken = signAccessToken(config, {
    sub: user.id,
    session_id: session.id,
    device_id: device?.id || null,
    kyc_tier: user.kyc_tier,
    status: user.status
  });
  const refreshJwt = signRefreshToken(config, {
    sub: user.id,
    session_id: session.id,
    family_id: session.refresh_token_family_id,
    token_hash: sha256(refreshToken)
  });
  await redis.set(`session:${session.id}:refresh_hash`, sha256(refreshToken), { EX: config.refreshTokenTtlSeconds });
  return {
    access_token: accessToken,
    refresh_token: refreshJwt,
    expires_in: config.accessTokenTtlSeconds,
    session_id: session.id
  };
}

function createApp(deps = {}) {
  const config = deps.config || getConfig("auth-service");
  const logger = deps.logger || createLogger("auth-service");
  const pool = deps.pool || createPool(config);
  const redis = deps.redis || createRedis(config);
  const app = express();

  app.use(helmet());
  app.use(express.json({ limit: "256kb" }));
  app.use(requestContext);

  app.get("/health/live", (_req, res) => res.json({ status: "ok" }));
  app.get("/health/ready", async (_req, res) => {
    try {
      await pool.query("SELECT 1");
      if (!redis.isOpen) await redis.connect();
      await redis.ping();
      res.json({ status: "ready" });
    } catch (_error) {
      res.status(503).json({ status: "not_ready" });
    }
  });

  app.post("/auth/register", async (req, res) => {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) return sendError(res, 400, "VALIDATION_ERROR", "Invalid registration payload");
    if (!isStrongPassword(parsed.data.password)) {
      return sendError(res, 400, "WEAK_PASSWORD", "Password does not meet policy");
    }
    try {
      if (!redis.isOpen) await redis.connect();
      const user = await withTransaction(pool, async (client) => {
        const created = await repo.registerUser(client, parsed.data);
        const device = parsed.data.device ? await repo.upsertDevice(client, created.id, parsed.data.device) : null;
        await publishOutboxEvent(client, {
          event_type: "user.created",
          producer: "auth-service",
          correlation_id: req.correlationId,
          payload: { user_id: created.id, status: created.status }
        });
        await writeAudit(client, {
          actor_type: "user",
          actor_id: created.id,
          action: "auth.registered",
          resource_type: "user",
          resource_id: created.id,
          result: "success",
          correlation_id: req.correlationId,
          request_id: req.requestId,
          device_id: device?.id || null
        });
        return created;
      });
      return sendOk(res, { user_id: user.id, status: user.status }, 201);
    } catch (error) {
      logger.warn({ err: error, request_id: req.requestId }, "registration failed");
      return sendError(res, 409, "REGISTRATION_FAILED", "Could not register user");
    }
  });

  app.post("/auth/login", async (req, res) => {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) return sendError(res, 400, "VALIDATION_ERROR", "Invalid login payload");
    if (!redis.isOpen) await redis.connect();
    const rate = await incrementRateLimit(redis, `rate:login:${sha256(parsed.data.login)}:${req.ip}`, config.loginAttemptLimit, config.loginAttemptWindowSeconds);
    if (!rate.allowed) return sendError(res, 429, "RATE_LIMITED", "Too many login attempts");

    try {
      const result = await withTransaction(pool, async (client) => {
        const user = await repo.findUserByLogin(client, parsed.data.login);
        if (!user || user.status === "closed" || user.status === "suspended") {
          await writeAudit(client, {
            actor_type: "user",
            action: "auth.login.failed",
            resource_type: "auth_session",
            result: "failed",
            reason: "invalid_credentials_or_status",
            correlation_id: req.correlationId,
            request_id: req.requestId
          });
          return { invalid: true };
        }
        if (user.locked_until && new Date(user.locked_until).getTime() > Date.now()) return { locked: true };
        if (!verifySecret(parsed.data.password, "password", user.password_hash)) {
          await repo.recordLoginFailure(client, user.id);
          await writeAudit(client, {
            actor_type: "user",
            actor_id: user.id,
            action: "auth.login.failed",
            resource_type: "auth_session",
            result: "failed",
            reason: "invalid_credentials",
            correlation_id: req.correlationId,
            request_id: req.requestId
          });
          return { invalid: true };
        }
        await repo.resetLoginFailures(client, user.id);
        const device = await repo.upsertDevice(client, user.id, parsed.data.device);
        const suspicious = device.trust_status === "new" || device.trust_status === "risky";
        if (suspicious) {
          const challengeId = randomUUID();
          const destination = user.phone_e164 || user.email;
          const otp = generateOtp();
          await repo.createOtp(client, {
            user_id: user.id,
            destination,
            purpose: "login_mfa",
            otp,
            ttl_seconds: config.otpTtlSeconds,
            metadata: { challenge_id: challengeId }
          });
          await redis.set(
            `login_challenge:${challengeId}`,
            JSON.stringify({ user_id: user.id, device_id: device.id, destination }),
            { EX: config.otpTtlSeconds }
          );
          await writeAudit(client, {
            actor_type: "user",
            actor_id: user.id,
            action: "auth.login.mfa_required",
            resource_type: "auth_session",
            result: "pending",
            reason: "new_or_risky_device",
            correlation_id: req.correlationId,
            request_id: req.requestId,
            device_id: device.id
          });
          await publishOutboxEvent(client, {
            event_type: "auth.device.new_detected",
            producer: "auth-service",
            correlation_id: req.correlationId,
            payload: { user_id: user.id, device_id: device.id }
          });
          return { mfa_required: true, challenge_id: challengeId };
        }
        const tokens = await issueTokens({ client, redis, config, user, device, req });
        await writeAudit(client, {
          actor_type: "user",
          actor_id: user.id,
          action: "auth.login.succeeded",
          resource_type: "auth_session",
          resource_id: tokens.session_id,
          result: "success",
          correlation_id: req.correlationId,
          request_id: req.requestId,
          device_id: device.id
        });
        return { tokens };
      });
      if (result.locked) return sendError(res, 423, "ACCOUNT_LOCKED", "Login is temporarily locked");
      if (result.invalid) return sendError(res, 401, "INVALID_CREDENTIALS", "Invalid credentials");
      if (result.mfa_required) return sendOk(res, result, 202);
      return sendOk(res, result.tokens);
    } catch (error) {
      logger.error({ err: error, request_id: req.requestId }, "login failed");
      return sendError(res, 500, "LOGIN_FAILED", "Could not complete login");
    }
  });

  app.post("/auth/refresh", async (req, res) => {
    const parsed = refreshSchema.safeParse(req.body);
    if (!parsed.success) return sendError(res, 400, "VALIDATION_ERROR", "Invalid refresh payload");
    if (!redis.isOpen) await redis.connect();
    try {
      const claims = verifyRefreshToken(config, parsed.data.refresh_token);
      const tokens = await withTransaction(pool, async (client) => {
        const session = await repo.getActiveSession(client, claims.session_id);
        const storedHash = await redis.get(`session:${claims.session_id}:refresh_hash`);
        if (!session || storedHash !== claims.token_hash) {
          await repo.revokeSession(client, claims.session_id, "reused");
          throw Object.assign(new Error("refresh reuse detected"), { code: "REFRESH_REUSE" });
        }
        await repo.revokeSession(client, session.id);
        const userResult = await client.query("SELECT * FROM identity.users WHERE id = $1", [claims.sub]);
        const user = userResult.rows[0];
        return issueTokens({
          client,
          redis,
          config,
          user,
          device: { id: session.device_id },
          req,
          rotatedFromSessionId: session.id,
          familyId: session.refresh_token_family_id
        });
      });
      return sendOk(res, tokens);
    } catch (error) {
      logger.warn({ err: error, request_id: req.requestId }, "refresh failed");
      return sendError(res, 401, error.code || "REFRESH_FAILED", "Refresh token is invalid");
    }
  });

  app.post("/auth/logout", authMiddleware(config), async (req, res) => {
    if (!redis.isOpen) await redis.connect();
    await withTransaction(pool, async (client) => {
      await repo.revokeSession(client, req.user.session_id);
      await redis.del(`session:${req.user.session_id}:refresh_hash`);
      await writeAudit(client, {
        actor_type: "user",
        actor_id: req.user.id,
        action: "auth.logout",
        resource_type: "auth_session",
        resource_id: req.user.session_id,
        result: "success",
        correlation_id: req.correlationId,
        request_id: req.requestId
      });
    });
    return sendOk(res, { logged_out: true });
  });

  app.post("/auth/otp/request", async (req, res) => {
    const parsed = otpRequestSchema.safeParse(req.body);
    if (!parsed.success) return sendError(res, 400, "VALIDATION_ERROR", "Invalid OTP request");
    if (!redis.isOpen) await redis.connect();
    const rate = await incrementRateLimit(redis, `rate:otp:${parsed.data.purpose}:${sha256(parsed.data.destination)}`, config.otpRequestLimit, config.otpRequestWindowSeconds);
    if (!rate.allowed) return sendError(res, 429, "RATE_LIMITED", "Too many OTP requests");
    const otp = generateOtp();
    await withTransaction(pool, async (client) => {
      const user = parsed.data.login ? await repo.findUserByLogin(client, parsed.data.login) : null;
      await repo.createOtp(client, {
        user_id: user?.id || null,
        destination: parsed.data.destination,
        purpose: parsed.data.purpose,
        otp,
        ttl_seconds: config.otpTtlSeconds
      });
      await writeAudit(client, {
        actor_type: user ? "user" : "system",
        actor_id: user?.id || null,
        action: "auth.otp.requested",
        resource_type: "otp",
        result: "success",
        correlation_id: req.correlationId,
        request_id: req.requestId,
        metadata: { purpose: parsed.data.purpose }
      });
    });
    return sendOk(res, { delivery_status: "queued", expires_in: config.otpTtlSeconds }, 202);
  });

  app.post("/auth/otp/verify", async (req, res) => {
    const parsed = otpVerifySchema.safeParse(req.body);
    if (!parsed.success) return sendError(res, 400, "VALIDATION_ERROR", "Invalid OTP verification");
    const result = await withTransaction(pool, async (client) => {
      const verified = await repo.verifyOtp(client, parsed.data);
      if (verified.ok && verified.user_id) await repo.activateVerification(client, verified.user_id, parsed.data.purpose);
      await writeAudit(client, {
        actor_type: verified.user_id ? "user" : "system",
        actor_id: verified.user_id || null,
        action: "auth.otp.verified",
        resource_type: "otp",
        result: verified.ok ? "success" : "failed",
        reason: verified.ok ? null : verified.reason,
        correlation_id: req.correlationId,
        request_id: req.requestId,
        metadata: { purpose: parsed.data.purpose }
      });
      return verified;
    });
    if (!result.ok) return sendError(res, 400, "OTP_INVALID", "OTP verification failed");
    return sendOk(res, { verified: true });
  });

  app.post("/auth/mfa/setup", authMiddleware(config), async (req, res) => {
    const parsed = mfaSetupSchema.safeParse(req.body);
    if (!parsed.success) return sendError(res, 400, "VALIDATION_ERROR", "Invalid MFA setup");
    await withTransaction(pool, async (client) => {
      await repo.setupMfa(client, req.user.id, parsed.data.factor_type);
      await writeAudit(client, {
        actor_type: "user",
        actor_id: req.user.id,
        action: "auth.mfa.setup",
        resource_type: "mfa_factor",
        result: "pending",
        correlation_id: req.correlationId,
        request_id: req.requestId,
        metadata: { factor_type: parsed.data.factor_type }
      });
    });
    return sendOk(res, { status: "pending", factor_type: parsed.data.factor_type }, 201);
  });

  app.post("/auth/mfa/verify", async (req, res) => {
    const parsed = mfaVerifySchema.safeParse(req.body);
    if (!parsed.success) return sendError(res, 400, "VALIDATION_ERROR", "Invalid MFA verification");
    if (!redis.isOpen) await redis.connect();
    try {
      const response = await withTransaction(pool, async (client) => {
        let userId;
        let deviceId;
        let destination = parsed.data.destination;
        if (parsed.data.challenge_id) {
          const raw = await redis.get(`login_challenge:${parsed.data.challenge_id}`);
          if (!raw) return { invalid: true };
          const challenge = JSON.parse(raw);
          userId = challenge.user_id;
          deviceId = challenge.device_id;
          destination = challenge.destination;
          const verified = await repo.verifyOtp(client, {
            destination,
            purpose: "login_mfa",
            otp: parsed.data.otp
          });
          if (!verified.ok) return { invalid: true };
        } else {
          const verified = await repo.verifyOtp(client, {
            destination,
            purpose: "login_mfa",
            otp: parsed.data.otp
          });
          if (!verified.ok) return { invalid: true };
          userId = verified.user_id;
        }
        const userResult = await client.query("SELECT * FROM identity.users WHERE id = $1", [userId]);
        const user = userResult.rows[0];
        if (parsed.data.factor_type) await repo.activateMfa(client, userId, parsed.data.factor_type);
        const tokens = await issueTokens({ client, redis, config, user, device: { id: deviceId }, req });
        await writeAudit(client, {
          actor_type: "user",
          actor_id: userId,
          action: "auth.mfa.verified",
          resource_type: "auth_session",
          resource_id: tokens.session_id,
          result: "success",
          correlation_id: req.correlationId,
          request_id: req.requestId,
          device_id: deviceId || null
        });
        if (parsed.data.challenge_id) await redis.del(`login_challenge:${parsed.data.challenge_id}`);
        return { tokens };
      });
      if (response.invalid) return sendError(res, 400, "MFA_INVALID", "MFA verification failed");
      return sendOk(res, response.tokens);
    } catch (error) {
      logger.warn({ err: error, request_id: req.requestId }, "mfa verification failed");
      return sendError(res, 400, "MFA_FAILED", "MFA verification failed");
    }
  });

  app.post("/auth/pin/setup", authMiddleware(config), async (req, res) => {
    const parsed = pinSetupSchema.safeParse(req.body);
    if (!parsed.success || !isValidPin(parsed.data.pin)) return sendError(res, 400, "VALIDATION_ERROR", "Invalid PIN setup");
    if (!parsed.data.otp || !parsed.data.destination) {
      return sendError(res, 403, "MFA_REQUIRED", "OTP verification is required to set transaction PIN");
    }
    const setup = await withTransaction(pool, async (client) => {
      const verified = await repo.verifyOtp(client, {
        destination: parsed.data.destination,
        purpose: "pin_reset",
        otp: parsed.data.otp
      });
      if (!verified.ok || (verified.user_id && verified.user_id !== req.user.id)) {
        await writeAudit(client, {
          actor_type: "user",
          actor_id: req.user.id,
          action: "auth.pin.setup_failed",
          resource_type: "transaction_pin",
          result: "failed",
          reason: "otp_failed",
          correlation_id: req.correlationId,
          request_id: req.requestId
        });
        return { ok: false };
      }
      await repo.setupPin(client, req.user.id, parsed.data.pin);
      await writeAudit(client, {
        actor_type: "user",
        actor_id: req.user.id,
        action: "auth.pin.created",
        resource_type: "transaction_pin",
        result: "success",
        correlation_id: req.correlationId,
        request_id: req.requestId
      });
      return { ok: true };
    });
    if (!setup.ok) return sendError(res, 403, "MFA_FAILED", "OTP verification failed");
    return sendOk(res, { pin_configured: true }, 201);
  });

  app.post("/auth/pin/verify", authMiddleware(config), async (req, res) => {
    const parsed = pinVerifySchema.safeParse(req.body);
    if (!parsed.success || !isValidPin(parsed.data.pin)) return sendError(res, 400, "VALIDATION_ERROR", "Invalid PIN payload");
    if (!redis.isOpen) await redis.connect();
    const rate = await incrementRateLimit(redis, `rate:pin:${req.user.id}`, config.pinAttemptLimit, config.pinAttemptWindowSeconds);
    if (!rate.allowed) return sendError(res, 429, "RATE_LIMITED", "Too many PIN attempts");
    const result = await withTransaction(pool, async (client) => {
      const verified = await repo.verifyPin(client, req.user.id, parsed.data.pin);
      await writeAudit(client, {
        actor_type: "user",
        actor_id: req.user.id,
        action: verified.ok ? "auth.pin.verified" : "auth.pin.failed",
        resource_type: "transaction_pin",
        result: verified.ok ? "success" : "failed",
        reason: verified.ok ? null : verified.reason,
        correlation_id: req.correlationId,
        request_id: req.requestId
      });
      return verified;
    });
    if (!result.ok) return sendError(res, 401, "PIN_INVALID", "PIN verification failed");
    return sendOk(res, { verified: true });
  });

  app.post("/auth/devices", authMiddleware(config), async (req, res) => {
    const schema = z.object({
      device_fingerprint: z.string().min(8),
      device_name: z.string().optional(),
      platform: z.string().optional(),
      app_version: z.string().optional(),
      metadata: z.record(z.any()).optional()
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return sendError(res, 400, "VALIDATION_ERROR", "Invalid device payload");
    const device = await withTransaction(pool, async (client) => {
      const created = await repo.upsertDevice(client, req.user.id, parsed.data);
      await writeAudit(client, {
        actor_type: "user",
        actor_id: req.user.id,
        action: "auth.device.registered",
        resource_type: "device",
        resource_id: created.id,
        result: "success",
        correlation_id: req.correlationId,
        request_id: req.requestId
      });
      return created;
    });
    return sendOk(res, { device_id: device.id, trust_status: device.trust_status }, 201);
  });

  return { app, pool, redis };
}

module.exports = { createApp };
