const test = require("node:test");
const assert = require("node:assert/strict");
const { lockAndValidateAccounts, insertPostedLedgerTransaction } = require("../src/repository");

test("lockAndValidateAccounts uses row-level locks for accounts", async () => {
  const calls = [];
  const client = {
    async query(sql, params) {
      calls.push({ sql, params });
      return {
        rows: [
          { id: params[0][0], account_code: "a", account_type: "asset", currency: "NGN", status: "active" },
          { id: params[0][1], account_code: "b", account_type: "liability", currency: "NGN", status: "active" }
        ]
      };
    }
  };
  await lockAndValidateAccounts(client, [
    { account_id: "10000000-0000-0000-0000-000000000001", currency: "NGN" },
    { account_id: "20000000-0000-0000-0000-000000000001", currency: "NGN" }
  ]);
  assert.match(calls[0].sql, /FOR UPDATE/);
});

test("insertPostedLedgerTransaction returns existing transaction for duplicate idempotency key", async () => {
  const client = {
    async query(sql) {
      if (sql.includes("WHERE idempotency_key")) {
        return { rows: [{ ledger_reference: "LED-existing" }] };
      }
      if (sql.includes("FROM ledger.ledger_transactions WHERE ledger_reference")) {
        return {
          rows: [{
            id: "30000000-0000-0000-0000-000000000001",
            ledger_reference: "LED-existing",
            transaction_reference: "TX-existing",
            status: "posted",
            transaction_type: "transfer",
            currency: "NGN"
          }]
        };
      }
      if (sql.includes("FROM ledger.ledger_entries")) return { rows: [] };
      throw new Error(`unexpected SQL: ${sql}`);
    }
  };
  const result = await insertPostedLedgerTransaction(client, {
    ledger_reference: "LED-new",
    transaction_reference: "TX-new",
    idempotency_key: "idem-existing",
    transaction_type: "transfer",
    currency: "NGN",
    entries: [
      { account_id: "10000000-0000-0000-0000-000000000001", entry_type: "debit", amount_minor: 1000, currency: "NGN" },
      { account_id: "20000000-0000-0000-0000-000000000001", entry_type: "credit", amount_minor: 1000, currency: "NGN" }
    ]
  });
  assert.equal(result.ledger_reference, "LED-existing");
});

