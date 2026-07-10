const test = require("node:test");
const assert = require("node:assert/strict");
const {
  createWallet,
  balanceResponse,
  ledgerAccountCode
} = require("../src/repository");

test("ledgerAccountCode uses user wallet account convention", () => {
  assert.equal(
    ledgerAccountCode("10000000-0000-0000-0000-000000000001", "NGN"),
    "user_wallet:10000000-0000-0000-0000-000000000001:NGN"
  );
});

test("createWallet rejects non-NGN currency initially", async () => {
  const client = { query: async () => ({ rows: [] }) };
  const ledgerClient = { createAccount: async () => ({}) };
  await assert.rejects(
    () => createWallet(client, { user_id: "10000000-0000-0000-0000-000000000001", currency: "USD" }, ledgerClient),
    /Only NGN wallets/
  );
});

test("createWallet returns existing wallet before creating a ledger account", async () => {
  let ledgerCalled = false;
  const existingWallet = {
    id: "20000000-0000-0000-0000-000000000001",
    user_id: "10000000-0000-0000-0000-000000000001",
    currency: "NGN",
    status: "active"
  };
  const client = {
    async query(sql) {
      if (sql.includes("SELECT * FROM wallet.wallets")) return { rows: [existingWallet] };
      throw new Error(`unexpected SQL: ${sql}`);
    }
  };
  const ledgerClient = {
    async createAccount() {
      ledgerCalled = true;
    }
  };
  const result = await createWallet(client, { user_id: existingWallet.user_id, currency: "NGN" }, ledgerClient);
  assert.equal(result.id, existingWallet.id);
  assert.equal(ledgerCalled, false);
});

test("balanceResponse uses ledger as source of truth when projection disagrees", () => {
  const response = balanceResponse(
    {
      id: "wallet-1",
      ledger_account_id: "ledger-account-1",
      currency: "NGN"
    },
    {
      posted_balance_minor: 500,
      held_balance_minor: 100
    },
    {
      balance_minor: 1000,
      as_of: "2026-06-06T00:00:00Z"
    }
  );
  assert.equal(response.source_of_truth, "ledger");
  assert.equal(response.posted_balance_minor, 1000);
  assert.equal(response.available_balance_minor, 900);
  assert.equal(response.projection_matches_ledger, false);
});

