const test = require("node:test");
const assert = require("node:assert/strict");
const { createApp } = require("../src/app");
const { inject } = require("../../../tests/helpers/inject-express");

test("wallet-service live health returns ok", async () => {
  const { app } = createApp({
    config: {
      serviceName: "wallet-service",
      databaseUrl: "postgresql://unused",
      redisUrl: "redis://unused",
      jwtAccessSecret: "test-access",
      jwtRefreshSecret: "test-refresh",
      ledgerServiceUrl: "http://ledger.local"
    },
    pool: { query: async () => ({ rows: [] }) },
    ledgerClient: {
      createAccount: async () => ({}),
      getAccountBalance: async () => ({}),
      getAccountEntries: async () => ({ entries: [] })
    },
    logger: { warn() {}, error() {}, info() {} }
  });

  const response = await inject(app, { method: "GET", path: "/health/live" });
  assert.equal(response.status, 200);
  assert.equal(response.body.status, "ok");
});

