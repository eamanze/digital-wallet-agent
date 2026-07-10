const { randomUUID } = require("crypto");
const { sha256 } = require("@wallet/common");

function tierForDecision(decision, requestedTier) {
  if (decision === "approved") return requestedTier || "tier_2";
  if (decision === "rejected") return "tier_0";
  return requestedTier || "tier_1";
}

async function submitKycProfile(client, userId, input) {
  const identityFingerprint = input.identity_number ? sha256(input.identity_number) : null;
  const result = await client.query(
    `INSERT INTO kyc.kyc_profiles (
      user_id, legal_name, date_of_birth, country_code, identity_type,
      identity_number_ciphertext, identity_number_fingerprint, status, tier,
      risk_status, submitted_at, rejection_reason, metadata
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,'pending',$8,'normal',now(),NULL,$9)
    ON CONFLICT (user_id) DO UPDATE SET
      legal_name = EXCLUDED.legal_name,
      date_of_birth = EXCLUDED.date_of_birth,
      country_code = EXCLUDED.country_code,
      identity_type = EXCLUDED.identity_type,
      identity_number_ciphertext = EXCLUDED.identity_number_ciphertext,
      identity_number_fingerprint = EXCLUDED.identity_number_fingerprint,
      status = 'pending',
      tier = CASE WHEN kyc.kyc_profiles.status = 'approved' THEN kyc.kyc_profiles.tier ELSE EXCLUDED.tier END,
      submitted_at = now(),
      rejection_reason = NULL,
      resubmission_count = CASE WHEN kyc.kyc_profiles.status = 'rejected' THEN kyc.kyc_profiles.resubmission_count + 1 ELSE kyc.kyc_profiles.resubmission_count END,
      metadata = kyc.kyc_profiles.metadata || EXCLUDED.metadata,
      updated_at = now()
    RETURNING *`,
    [
      userId,
      input.legal_name,
      input.date_of_birth || null,
      input.country_code || null,
      input.identity_type || null,
      input.identity_number ? `encrypted-ref:${identityFingerprint}` : null,
      identityFingerprint,
      input.requested_tier || "tier_1",
      input.metadata || {}
    ]
  );
  await client.query(
    `UPDATE identity.users
    SET status = CASE WHEN status NOT IN ('suspended', 'closed') THEN 'kyc_pending' ELSE status END,
      updated_at = now()
    WHERE id = $1`,
    [userId]
  );
  return result.rows[0];
}

async function addKycDocument(client, userId, input) {
  const profile = await getKycProfileByUser(client, userId);
  if (!profile) {
    const error = new Error("KYC profile not found");
    error.code = "KYC_PROFILE_NOT_FOUND";
    throw error;
  }
  const result = await client.query(
    `INSERT INTO kyc.kyc_documents (
      kyc_profile_id, user_id, document_type, s3_bucket, s3_object_key,
      checksum_sha256, kms_key_id, status, access_policy, encryption_status, expires_at, metadata
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,'uploaded','private','kms_encrypted',$8,$9)
    RETURNING *`,
    [
      profile.id,
      userId,
      input.document_type,
      input.s3_bucket,
      input.s3_object_key,
      input.checksum_sha256,
      input.kms_key_id,
      input.expires_at || null,
      input.metadata || {}
    ]
  );
  return result.rows[0];
}

async function createProviderAttempt(client, profile, input) {
  const providerReference = input.provider_reference || `kyc_mock_${randomUUID()}`;
  const requestHash = sha256(JSON.stringify({
    profile_id: profile.id,
    provider_name: input.provider_name || "mock-kyc-provider",
    provider_reference: providerReference
  }));
  const result = await client.query(
    `INSERT INTO kyc.kyc_verification_attempts (
      kyc_profile_id, user_id, provider_name, provider_reference, status, request_hash, metadata
    ) VALUES ($1,$2,$3,$4,'sent',$5,$6)
    RETURNING *`,
    [
      profile.id,
      profile.user_id,
      input.provider_name || "mock-kyc-provider",
      providerReference,
      requestHash,
      input.metadata || {}
    ]
  );
  await client.query(
    `UPDATE kyc.kyc_profiles
    SET status = 'provider_pending',
      provider_name = $2,
      provider_reference = $3,
      updated_at = now()
    WHERE id = $1`,
    [profile.id, input.provider_name || "mock-kyc-provider", providerReference]
  );
  return result.rows[0];
}

async function getKycProfileByUser(client, userId) {
  const result = await client.query(
    "SELECT * FROM kyc.kyc_profiles WHERE user_id = $1",
    [userId]
  );
  return result.rows[0] || null;
}

async function getKycStatus(client, userId) {
  const result = await client.query(
    `SELECT
      p.*,
      COALESCE(json_agg(
        json_build_object(
          'id', d.id,
          'document_type', d.document_type,
          's3_bucket', d.s3_bucket,
          's3_object_key', d.s3_object_key,
          'checksum_sha256', d.checksum_sha256,
          'kms_key_id', d.kms_key_id,
          'status', d.status,
          'access_policy', d.access_policy,
          'encryption_status', d.encryption_status,
          'uploaded_at', d.uploaded_at
        )
      ) FILTER (WHERE d.id IS NOT NULL), '[]'::json) AS documents
    FROM kyc.kyc_profiles p
    LEFT JOIN kyc.kyc_documents d ON d.kyc_profile_id = p.id
    WHERE p.user_id = $1
    GROUP BY p.id`,
    [userId]
  );
  return result.rows[0] || null;
}

async function decideKyc(client, profileId, input) {
  const profileResult = await client.query(
    "SELECT * FROM kyc.kyc_profiles WHERE id = $1 FOR UPDATE",
    [profileId]
  );
  const profile = profileResult.rows[0];
  if (!profile) return null;

  const nextTier = tierForDecision(input.decision, input.tier);
  const nextStatus = input.decision === "approved" ? "approved" : input.decision === "rejected" ? "rejected" : "manual_review";

  const result = await client.query(
    `UPDATE kyc.kyc_profiles
    SET status = $2,
      tier = $3,
      rejection_reason = CASE WHEN $2 = 'rejected' THEN $4 ELSE NULL END,
      reviewed_by_admin_user_id = $5,
      reviewed_at = now(),
      verified_at = CASE WHEN $2 = 'approved' THEN now() ELSE verified_at END,
      updated_at = now()
    WHERE id = $1
    RETURNING *`,
    [
      profileId,
      nextStatus,
      nextTier,
      input.reason || null,
      input.reviewed_by_admin_user_id || null
    ]
  );

  await client.query(
    `UPDATE identity.users
    SET kyc_tier = $2,
      status = CASE
        WHEN $3 = 'approved' AND status NOT IN ('suspended', 'closed') THEN 'kyc_approved'
        WHEN $3 = 'rejected' AND status NOT IN ('suspended', 'closed') THEN 'kyc_pending'
        ELSE status
      END,
      updated_at = now()
    WHERE id = $1`,
    [profile.user_id, nextTier, nextStatus]
  );

  if (profile.provider_name && profile.provider_reference) {
    await client.query(
      `UPDATE kyc.kyc_verification_attempts
      SET status = $3, reason = $4, response_hash = $5, updated_at = now()
      WHERE provider_name = $1 AND provider_reference = $2`,
      [
        profile.provider_name,
        profile.provider_reference,
        nextStatus === "approved" ? "approved" : nextStatus === "rejected" ? "rejected" : "manual_review",
        input.reason || null,
        sha256(JSON.stringify(input))
      ]
    );
  }

  return { previous: profile, current: result.rows[0] };
}

module.exports = {
  submitKycProfile,
  addKycDocument,
  createProviderAttempt,
  getKycProfileByUser,
  getKycStatus,
  decideKyc,
  tierForDecision
};
