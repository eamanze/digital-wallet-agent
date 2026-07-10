const test = require("node:test");
const assert = require("node:assert/strict");
const { canTransition, assertTransition } = require("../src/state-machine");
test("allows the transfer happy path", () => { assert.equal(canTransition("initiated", "pending_validation"), true); assert.equal(canTransition("pending_validation", "pending_fraud_check"), true); assert.equal(canTransition("pending_fraud_check", "successful"), true); });
test("rejects invalid terminal transitions", () => { assert.equal(canTransition("successful", "failed"), false); assert.throws(() => assertTransition("successful", "failed"), /Invalid transaction transition/); });
test("allows reversal only from successful or pending provider", () => { assert.equal(canTransition("successful", "reversed"), true); assert.equal(canTransition("pending_provider", "reversed"), true); });
