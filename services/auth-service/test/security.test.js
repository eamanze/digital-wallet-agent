const test = require("node:test");
const assert = require("node:assert/strict");
const {
  hashSecret,
  verifySecret,
  isStrongPassword,
  isValidPin
} = require("@wallet/common");

test("password hash verifies only with password purpose", () => {
  const hash = hashSecret("CorrectHorse123", "password");
  assert.equal(verifySecret("CorrectHorse123", "password", hash), true);
  assert.equal(verifySecret("CorrectHorse123", "transaction_pin", hash), false);
});

test("transaction PIN hash is separate from password hash", () => {
  const pinHash = hashSecret("123456", "transaction_pin");
  assert.equal(verifySecret("123456", "transaction_pin", pinHash), true);
  assert.equal(verifySecret("123456", "password", pinHash), false);
});

test("password and PIN policy helpers reject weak values", () => {
  assert.equal(isStrongPassword("short"), false);
  assert.equal(isStrongPassword("StrongPassword1"), true);
  assert.equal(isValidPin("1234"), true);
  assert.equal(isValidPin("12ab"), false);
});

