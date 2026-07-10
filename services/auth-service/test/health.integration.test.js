const test = require("node:test");
const assert = require("node:assert/strict");
const { createApp } = require("../src/app");
const { inject } = require("../../../tests/helpers/inject-express");

test("auth-service live health returns ok", async () => {
  const { app } = createApp({
    config: {
      serviceName: "auth-service",
      databaseUrl: "postgresql://unused",
      redisUrl: "redis://unused",
      jwtAccessSecret: "test-access",
      jwtRefreshSecret: "test-refresh",
      accessTokenTtlSeconds: 900,
      refreshTokenTtlSeconds: 3600,
      otpTtlSeconds: 300,
      otpRequestLimit: 5,
      otpRequestWindowSeconds: 3600,
      loginAttemptLimit: 10,
      loginAttemptWindowSeconds: 900,
      pinAttemptLimit: 5,
      pinAttemptWindowSeconds: 3600
    },
    pool: { query: async () => ({ rows: [] }) },
    redis: { isOpen: true, ping: async () => "PONG" },
    logger: { warn() {}, error() {}, info() {} }
  });

  const response = await inject(app, { method: "GET", path: "/health/live" });
  assert.equal(response.status, 200);
  assert.equal(response.body.status, "ok");
});
