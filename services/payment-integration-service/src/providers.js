const crypto = require("crypto");

const STATUS_MAP = { pending: "pending", success: "successful", successful: "successful", failed: "failed", failure: "failed", reversed: "reversed", disputed: "disputed", unknown: "unknown" };
function normalizeResponse(response = {}) { const raw = String(response.status || response.provider_status || "unknown").toLowerCase(); return { normalized_status: STATUS_MAP[raw] || "unknown", provider_reference: response.provider_reference || response.reference || null, response_code: response.response_code || response.code || null, message: response.message || null }; }
function signPayload(body, secret) { return crypto.createHmac("sha256", secret).update(typeof body === "string" ? body : JSON.stringify(body)).digest("hex"); }
function verifySignature(body, signature, secret) { if (!signature || !secret) return false; const expected = signPayload(body, secret); const actual = Buffer.from(signature); const wanted = Buffer.from(expected); return actual.length === wanted.length && crypto.timingSafeEqual(wanted, actual); }

class MockProvider {
  constructor(name, type, behavior = {}) { this.name = name; this.type = type; this.behavior = behavior; }
  async initiate(input) { if (this.behavior.initiateError) throw Object.assign(new Error("Mock provider unavailable"), { code: "PROVIDER_UNAVAILABLE", retryable: true }); return { status: this.behavior.status || "pending", provider: this.name, provider_reference: `${this.name}-${input.internal_reference}`, authorization_url: this.type === "wallet_funding" ? `http://localhost:8092/checkout/${input.internal_reference}` : undefined }; }
  async verify(reference) { return { status: this.behavior.verifyStatus || "pending", provider: this.name, provider_reference: reference }; }
  normalize(response) { const normalized = normalizeResponse(response); return { ...normalized, status: normalized.normalized_status }; }
  sign(body, secret) { return signPayload(body, secret); }
  verifySignature(body, signature, secret) { return verifySignature(body, signature, secret); }
}

class CircuitBreaker {
  constructor({ failureThreshold = 3, resetTimeoutMs = 30000 } = {}) { this.failureThreshold = failureThreshold; this.resetTimeoutMs = resetTimeoutMs; this.failures = 0; this.openedAt = 0; }
  state() { if (this.openedAt && Date.now() - this.openedAt >= this.resetTimeoutMs) return "half_open"; return this.openedAt ? "open" : "closed"; }
  allow() { return this.state() !== "open"; }
  canRequest() { return this.allow(); }
  success() { this.failures = 0; this.openedAt = 0; }
  failure() { this.failures += 1; if (this.failures >= this.failureThreshold) this.openedAt = Date.now(); }
}

function defaultProviders() { return { mock_funding: new MockProvider("mock_funding", "wallet_funding"), mock_card: new MockProvider("mock_card", "wallet_funding"), mock_bank: new MockProvider("mock_bank", "bank_withdrawal"), mock_biller: new MockProvider("mock_biller", "bill_payment"), mock_airtime: new MockProvider("mock_airtime", "airtime") }; }
module.exports = { normalizeResponse, signPayload, verifySignature, MockProvider, CircuitBreaker, defaultProviders };
