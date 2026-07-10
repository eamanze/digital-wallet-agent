const test = require("node:test");
const assert = require("node:assert/strict");
const { registerUser } = require("../src/repository");

test("registerUser stores hashed password, never plaintext password", async () => {
  const calls = [];
  const client = {
    async query(sql, params) {
      calls.push({ sql, params });
      if (sql.includes("INSERT INTO identity.users")) {
        return {
          rows: [{
            id: "00000000-0000-0000-0000-000000000001",
            user_reference: "usr_test",
            email: "test@example.com",
            status: "pending"
          }]
        };
      }
      return { rows: [] };
    }
  };

  await registerUser(client, {
    email: "test@example.com",
    password: "CorrectHorse123",
    first_name: "Test"
  });

  const credentialInsert = calls.find((call) => call.sql.includes("INSERT INTO auth.user_credentials"));
  assert.ok(credentialInsert);
  assert.notEqual(credentialInsert.params[1], "CorrectHorse123");
  assert.match(credentialInsert.params[1], /^bcrypt\$/);
});
