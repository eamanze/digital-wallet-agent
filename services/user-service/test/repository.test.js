const test = require("node:test");
const assert = require("node:assert/strict");
const { updateUserProfile } = require("../src/repository");

test("updateUserProfile rejects unsupported lifecycle status", async () => {
  const client = { query: async () => ({ rows: [] }) };
  await assert.rejects(
    () => updateUserProfile(client, "00000000-0000-0000-0000-000000000001", { status: "restricted" }),
    /Invalid user status/
  );
});

