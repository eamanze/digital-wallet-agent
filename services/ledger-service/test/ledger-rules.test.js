const test = require("node:test");
const assert = require("node:assert/strict");
const {
  validateEntries,
  calculateNormalBalance,
  reversalEntries
} = require("../src/ledger-rules");

const accountA = "10000000-0000-0000-0000-000000000001";
const accountB = "20000000-0000-0000-0000-000000000001";

test("validateEntries accepts balanced entries", () => {
  const totals = validateEntries([
    { account_id: accountA, entry_type: "debit", amount_minor: 1000, currency: "NGN" },
    { account_id: accountB, entry_type: "credit", amount_minor: 1000, currency: "NGN" }
  ], "NGN");
  assert.deepEqual(totals, { debit: 1000, credit: 1000 });
});

test("validateEntries rejects unbalanced entries", () => {
  assert.throws(() => validateEntries([
    { account_id: accountA, entry_type: "debit", amount_minor: 1000, currency: "NGN" },
    { account_id: accountB, entry_type: "credit", amount_minor: 900, currency: "NGN" }
  ], "NGN"), /unbalanced/);
});

test("calculateNormalBalance respects debit and credit normal accounts", () => {
  assert.equal(calculateNormalBalance("asset", 1500, 500), 1000);
  assert.equal(calculateNormalBalance("liability", 500, 1500), 1000);
  assert.equal(calculateNormalBalance("revenue", 0, 2500), 2500);
});

test("reversalEntries creates equal and opposite entries", () => {
  const entries = reversalEntries([
    { id: "e1", account_id: accountA, entry_type: "debit", amount_minor: 1000, currency: "NGN" },
    { id: "e2", account_id: accountB, entry_type: "credit", amount_minor: 1000, currency: "NGN" }
  ]);
  assert.equal(entries[0].entry_type, "credit");
  assert.equal(entries[1].entry_type, "debit");
  assert.equal(entries[0].amount_minor, 1000);
});

