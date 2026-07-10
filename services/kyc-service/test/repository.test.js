const test = require("node:test");
const assert = require("node:assert/strict");
const { tierForDecision, addKycDocument } = require("../src/repository");

test("tierForDecision maps approval, rejection, and manual review safely", () => {
  assert.equal(tierForDecision("approved", "tier_3"), "tier_3");
  assert.equal(tierForDecision("approved"), "tier_2");
  assert.equal(tierForDecision("rejected", "tier_3"), "tier_0");
  assert.equal(tierForDecision("manual_review", "tier_2"), "tier_2");
});

test("addKycDocument stores only object storage reference metadata", async () => {
  const calls = [];
  const client = {
    async query(sql, params) {
      calls.push({ sql, params });
      if (sql.includes("SELECT * FROM kyc.kyc_profiles")) {
        return {
          rows: [{
            id: "10000000-0000-0000-0000-000000000001",
            user_id: "20000000-0000-0000-0000-000000000001"
          }]
        };
      }
      if (sql.includes("INSERT INTO kyc.kyc_documents")) {
        return {
          rows: [{
            id: "30000000-0000-0000-0000-000000000001",
            document_type: params[2],
            s3_bucket: params[3],
            s3_object_key: params[4],
            checksum_sha256: params[5],
            kms_key_id: params[6],
            status: "uploaded",
            access_policy: "private",
            encryption_status: "kms_encrypted"
          }]
        };
      }
      return { rows: [] };
    }
  };

  await addKycDocument(client, "20000000-0000-0000-0000-000000000001", {
    document_type: "national_id",
    s3_bucket: "wallet-kyc-documents-local",
    s3_object_key: "kyc/local/user/document.encrypted",
    checksum_sha256: "a".repeat(64),
    kms_key_id: "alias/local-kyc"
  });

  const insert = calls.find((call) => call.sql.includes("INSERT INTO kyc.kyc_documents"));
  assert.ok(insert);
  assert.equal(insert.params.includes(Buffer.from("raw-document")), false);
  assert.equal(insert.params.includes("raw-document-bytes"), false);
  assert.equal(insert.params[3], "wallet-kyc-documents-local");
  assert.equal(insert.params[4], "kyc/local/user/document.encrypted");
  assert.equal(insert.params[6], "alias/local-kyc");
});

