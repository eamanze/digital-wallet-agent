const test = require("node:test");
const assert = require("node:assert/strict");
const { evaluateRisk } = require("../src/rules");
const rules = [
  { rule_code: "FAILED_PIN_ATTEMPTS", decision: "block", severity: "high", priority: 10, status: "active", rule_config: { threshold: 5 } },
  { rule_code: "NEW_DEVICE_HIGH_VALUE", decision: "manual_review", severity: "high", priority: 20, status: "active", rule_config: { threshold_minor: 100000 } },
  { rule_code: "UNUSUAL_FREQUENCY", decision: "manual_review", severity: "medium", priority: 30, status: "active", rule_config: { count_threshold: 3 } },
  { rule_code: "SUSPICIOUS_IP", decision: "block", severity: "high", priority: 5, status: "active", rule_config: {} },
  { rule_code: "SHARED_DEVICE", decision: "manual_review", severity: "high", priority: 50, status: "active", rule_config: { account_threshold: 3 } },
  { rule_code: "RAPID_FUNDING_WITHDRAWAL", decision: "manual_review", severity: "high", priority: 25, status: "active", rule_config: { count_threshold: 1 } }
];
test("allows a normal transaction", () => assert.equal(evaluateRisk({ amount_minor: 1000 }, rules).decision, "allow"));
test("blocks suspicious IP and failed PIN velocity", () => { const result = evaluateRisk({ suspicious_ip: true, failed_pin_attempts: 5 }, rules); assert.equal(result.decision, "block"); assert.deepEqual(result.reason_codes, ["SUSPICIOUS_IP", "FAILED_PIN_ATTEMPTS"]); });
test("manual review is returned for new device high value", () => { const result = evaluateRisk({ new_device: true, amount_minor: 100000 }, rules); assert.equal(result.decision, "manual_review"); assert.deepEqual(result.reason_codes, ["NEW_DEVICE_HIGH_VALUE"]); });
test("shared device, frequency, and rapid funding rules fire", () => { const result = evaluateRisk({ transaction_count_window: 3, device_account_count: 3, recent_funding_withdrawal_count: 1 }, rules); assert.equal(result.decision, "manual_review"); assert.equal(result.reason_codes.length, 3); });
