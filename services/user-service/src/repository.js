const { randomUUID } = require("crypto");

async function createUserProfile(client, input) {
  const userReference = input.user_reference || `usr_${randomUUID()}`;
  const userResult = await client.query(
    `INSERT INTO identity.users (
      user_reference, phone_e164, email, status, kyc_tier, risk_status
    ) VALUES ($1,$2,$3,$4,$5,$6)
    RETURNING *`,
    [
      userReference,
      input.phone_e164 || null,
      input.email || null,
      input.status || "pending",
      input.kyc_tier || "tier_0",
      input.risk_status || "normal"
    ]
  );

  const user = userResult.rows[0];
  await client.query(
    `INSERT INTO identity.user_profiles (
      user_id, first_name, middle_name, last_name, date_of_birth,
      address_line1, address_line2, city, state_region, country_code, metadata
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
    [
      user.id,
      input.first_name || null,
      input.middle_name || null,
      input.last_name || null,
      input.date_of_birth || null,
      input.address_line1 || null,
      input.address_line2 || null,
      input.city || null,
      input.state_region || null,
      input.country_code || null,
      input.metadata || {}
    ]
  );

  return getUserProfile(client, user.id);
}

async function getUserProfile(client, userId) {
  const result = await client.query(
    `SELECT
      u.id,
      u.user_reference,
      u.phone_e164,
      u.email,
      u.phone_verified_at IS NOT NULL AS phone_verified,
      u.email_verified_at IS NOT NULL AS email_verified,
      u.status,
      u.kyc_tier,
      u.risk_status,
      u.created_at,
      u.updated_at,
      p.first_name,
      p.middle_name,
      p.last_name,
      p.date_of_birth,
      p.address_line1,
      p.address_line2,
      p.city,
      p.state_region,
      p.country_code,
      p.metadata
    FROM identity.users u
    LEFT JOIN identity.user_profiles p ON p.user_id = u.id
    WHERE u.id = $1`,
    [userId]
  );
  return result.rows[0] || null;
}

async function updateUserProfile(client, userId, input) {
  const allowedStatus = ["pending", "active", "suspended", "closed"];
  if (input.status && !allowedStatus.includes(input.status)) {
    const error = new Error("Invalid user status");
    error.code = "INVALID_STATUS";
    throw error;
  }

  await client.query(
    `UPDATE identity.users
    SET
      phone_e164 = COALESCE($2, phone_e164),
      email = COALESCE($3, email),
      status = COALESCE($4, status),
      phone_verified_at = CASE WHEN $5::boolean IS TRUE THEN COALESCE(phone_verified_at, now()) ELSE phone_verified_at END,
      email_verified_at = CASE WHEN $6::boolean IS TRUE THEN COALESCE(email_verified_at, now()) ELSE email_verified_at END,
      updated_at = now()
    WHERE id = $1`,
    [
      userId,
      input.phone_e164 || null,
      input.email || null,
      input.status || null,
      input.phone_verified === true,
      input.email_verified === true
    ]
  );

  await client.query(
    `INSERT INTO identity.user_profiles (
      user_id, first_name, middle_name, last_name, date_of_birth,
      address_line1, address_line2, city, state_region, country_code, metadata
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
    ON CONFLICT (user_id) DO UPDATE SET
      first_name = COALESCE(EXCLUDED.first_name, identity.user_profiles.first_name),
      middle_name = COALESCE(EXCLUDED.middle_name, identity.user_profiles.middle_name),
      last_name = COALESCE(EXCLUDED.last_name, identity.user_profiles.last_name),
      date_of_birth = COALESCE(EXCLUDED.date_of_birth, identity.user_profiles.date_of_birth),
      address_line1 = COALESCE(EXCLUDED.address_line1, identity.user_profiles.address_line1),
      address_line2 = COALESCE(EXCLUDED.address_line2, identity.user_profiles.address_line2),
      city = COALESCE(EXCLUDED.city, identity.user_profiles.city),
      state_region = COALESCE(EXCLUDED.state_region, identity.user_profiles.state_region),
      country_code = COALESCE(EXCLUDED.country_code, identity.user_profiles.country_code),
      metadata = identity.user_profiles.metadata || EXCLUDED.metadata,
      updated_at = now()`,
    [
      userId,
      input.first_name || null,
      input.middle_name || null,
      input.last_name || null,
      input.date_of_birth || null,
      input.address_line1 || null,
      input.address_line2 || null,
      input.city || null,
      input.state_region || null,
      input.country_code || null,
      input.metadata || {}
    ]
  );

  return getUserProfile(client, userId);
}

module.exports = { createUserProfile, getUserProfile, updateUserProfile };

