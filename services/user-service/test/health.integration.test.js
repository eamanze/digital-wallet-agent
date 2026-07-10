const test = require("node:test");
const assert = require("node:assert/strict");
const { createApp } = require("../src/app");
const { inject } = require("../../../tests/helpers/inject-express");

test("user-service live health returns ok", async () => {
  const { app } = createApp({
    config: {
      serviceName: "user-service",
      databaseUrl: "postgresql://unused",
      redisUrl: "redis://unused",
      jwtAccessSecret: "test-access",
      jwtRefreshSecret: "test-refresh"
    },
    pool: { query: async () => ({ rows: [] }) },
    logger: { warn() {}, error() {}, info() {} }
  });

  const response = await inject(app, { method: "GET", path: "/health/live" });
  assert.equal(response.status, 200);
  assert.equal(response.body.status, "ok");
});
