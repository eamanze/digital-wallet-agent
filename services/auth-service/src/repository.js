const { randomUUID } = require("crypto");
const { hashSecret, verifySecret, sha256 } = require("@wallet/common");

async function findUserByLogin(client, login) {
  const result = await client.query(
    `SELECT u.*, c.password_hash, c.locked_until
    FROM identity.users u
    JOIN auth.user_credentials c ON c.user_id = u.id
    WHERE lower(u.email::text) = lower($1) OR u.phone_e164 = $1
    LIMIT 1`,
    [login]
  );
  return result.rows[0] || null;
}

async function registerUser(client, input) {
  const userReference = `usr_${randomUUID()}`;
  const userResult = await client.query(
    `INSERT INTO identity.users (
      user_reference, phone_e164, email, status, kyc_tier, risk_status
    ) VALUES ($1,$2,$3,'pending','tier_0','normal')
    RETURNING *`,
    [userReference, input.phone_e164 || null, input.email || null]
  );
  const user = userResult.rows[0];
  await client.query(
    `INSERT INTO identity.user_profiles (
      user_id, first_name, last_name, country_code
    ) VALUES ($1,$2,$3,$4)`,
    [user.id, input.first_name || null, input.last_name || null, input.country_code || null]
  );
  await client.query(
    `INSERT INTO auth.user_credentials (user_id, password_hash)
    VALUES ($1,$2)`,
    [user.id, hashSecret(input.password, "password")]
  );
  return user;
}

async function recordLoginFailure(client, userId) {
  if (!userId) return;
  await client.query(
    `UPDATE auth.user_credentials
    SET failed_login_count = failed_login_count + 1,
      locked_until = CASE WHEN failed_login_count + 1 >= 10 THEN now() + interval '15 minutes' ELSE locked_until END,
      updated_at = now()
    WHERE user_id = $1`,
    [userId]
  );
}

async function resetLoginFailures(client, userId) {
  await client.query(
    `UPDATE auth.user_credentials
    SET failed_login_count = 0, locked_until = NULL, updated_at = now()
    WHERE user_id = $1`,
    [userId]
  );
}

async function upsertDevice(client, userId, input) {
  const fingerprintHash = sha256(input.device_fingerprint);
  const result = await client.query(
    `INSERT INTO identity.user_devices (
      user_id, device_fingerprint, device_name, platform, app_version, trust_status, metadata
    ) VALUES ($1,$2,$3,$4,$5,'new',$6)
    ON CONFLICT (user_id, device_fingerprint) DO UPDATE SET
      device_name = COALESCE(EXCLUDED.device_name, identity.user_devices.device_name),
      platform = COALESCE(EXCLUDED.platform, identity.user_devices.platform),
      app_version = COALESCE(EXCLUDED.app_version, identity.user_devices.app_version),
      last_seen_at = now()
    RETURNING *`,
    [
      userId,
      fingerprintHash,
      input.device_name || null,
      input.platform || null,
      input.app_version || null,
      input.metadata || {}
    ]
  );
  return result.rows[0];
}

async function createOtp(client, input) {
  const result = await client.query(
    `INSERT INTO auth.otp_challenges (
      user_id, destination_hash, purpose, otp_hash, status, expires_at, metadata
    ) VALUES ($1,$2,$3,$4,'pending',now() + ($5 || ' seconds')::interval,$6)
    RETURNING id, expires_at`,
    [
      input.user_id || null,
      sha256(input.destination),
      input.purpose,
      hashSecret(input.otp, `otp:${input.purpose}`),
      String(input.ttl_seconds),
      input.metadata || {}
    ]
  );
  return result.rows[0];
}

async function verifyOtp(client, input) {
  const result = await client.query(
    `SELECT * FROM auth.otp_challenges
    WHERE destination_hash = $1 AND purpose = $2 AND status = 'pending'
    ORDER BY created_at DESC
    LIMIT 1
    FOR UPDATE`,
    [sha256(input.destination), input.purpose]
  );
  const challenge = result.rows[0];
  if (!challenge) return { ok: false, reason: "not_found" };
  if (new Date(challenge.expires_at).getTime() < Date.now()) {
    await client.query("UPDATE auth.otp_challenges SET status = 'expired' WHERE id = $1", [challenge.id]);
    return { ok: false, reason: "expired" };
  }
  if (challenge.attempts >= challenge.max_attempts) {
    await client.query("UPDATE auth.otp_challenges SET status = 'failed' WHERE id = $1", [challenge.id]);
    return { ok: false, reason: "attempts_exceeded" };
  }
  const ok = verifySecret(input.otp, `otp:${input.purpose}`, challenge.otp_hash);
  if (!ok) {
    await client.query("UPDATE auth.otp_challenges SET attempts = attempts + 1 WHERE id = $1", [challenge.id]);
    return { ok: false, reason: "invalid" };
  }
  await client.query(
    "UPDATE auth.otp_challenges SET status = 'verified', verified_at = now() WHERE id = $1",
    [challenge.id]
  );
  return { ok: true, user_id: challenge.user_id };
}

async function activateVerification(client, userId, purpose) {
  if (purpose === "phone_verification") {
    await client.query(
      "UPDATE identity.users SET phone_verified_at = COALESCE(phone_verified_at, now()), status = CASE WHEN status = 'pending' THEN 'phone_verified' ELSE status END, updated_at = now() WHERE id = $1",
      [userId]
    );
  }
  if (purpose === "email_verification") {
    await client.query(
      "UPDATE identity.users SET email_verified_at = COALESCE(email_verified_at, now()), status = CASE WHEN status = 'pending' THEN 'email_verified' ELSE status END, updated_at = now() WHERE id = $1",
      [userId]
    );
  }
}

async function createSession(client, input) {
  const result = await client.query(
    `INSERT INTO auth.auth_sessions (
      user_id, device_id, refresh_token_hash, status, ip_address_hash,
      user_agent_hash, expires_at, refresh_token_family_id, rotated_from_session_id
    ) VALUES ($1,$2,$3,'active',$4,$5,now() + ($6 || ' seconds')::interval,$7,$8)
    RETURNING *`,
    [
      input.user_id,
      input.device_id || null,
      sha256(input.refresh_token),
      input.ip_address_hash || null,
      input.user_agent_hash || null,
      String(input.refresh_ttl_seconds),
      input.refresh_token_family_id || randomUUID(),
      input.rotated_from_session_id || null
    ]
  );
  return result.rows[0];
}

async function revokeSession(client, sessionId, status = "revoked") {
  await client.query(
    `UPDATE auth.auth_sessions
    SET status = $2, revoked_at = now()
    WHERE id = $1 AND status = 'active'`,
    [sessionId, status]
  );
}

async function getActiveSession(client, sessionId) {
  const result = await client.query(
    "SELECT * FROM auth.auth_sessions WHERE id = $1 AND status = 'active'",
    [sessionId]
  );
  return result.rows[0] || null;
}

async function setupMfa(client, userId, factorType) {
  const result = await client.query(
    `INSERT INTO auth.mfa_factors (user_id, factor_type, status)
    VALUES ($1,$2,'pending')
    ON CONFLICT (user_id, factor_type) DO UPDATE SET status = 'pending', updated_at = now()
    RETURNING *`,
    [userId, factorType]
  );
  return result.rows[0];
}

async function activateMfa(client, userId, factorType) {
  await client.query(
    "UPDATE auth.mfa_factors SET status = 'active', verified_at = now(), updated_at = now() WHERE user_id = $1 AND factor_type = $2",
    [userId, factorType]
  );
}

async function setupPin(client, userId, pin) {
  await client.query(
    `INSERT INTO auth.transaction_pins (user_id, pin_hash)
    VALUES ($1,$2)
    ON CONFLICT (user_id) DO UPDATE SET pin_hash = EXCLUDED.pin_hash, failed_attempts = 0, locked_until = NULL, updated_at = now()`,
    [userId, hashSecret(pin, "transaction_pin")]
  );
}

async function verifyPin(client, userId, pin) {
  const result = await client.query(
    "SELECT * FROM auth.transaction_pins WHERE user_id = $1 FOR UPDATE",
    [userId]
  );
  const row = result.rows[0];
  if (!row) return { ok: false, reason: "not_set" };
  if (row.locked_until && new Date(row.locked_until).getTime() > Date.now()) {
    return { ok: false, reason: "locked" };
  }
  if (!verifySecret(pin, "transaction_pin", row.pin_hash)) {
    await client.query(
      `UPDATE auth.transaction_pins
      SET failed_attempts = failed_attempts + 1,
        locked_until = CASE WHEN failed_attempts + 1 >= 5 THEN now() + interval '1 hour' ELSE locked_until END,
        updated_at = now()
      WHERE user_id = $1`,
      [userId]
    );
    return { ok: false, reason: "invalid" };
  }
  await client.query(
    "UPDATE auth.transaction_pins SET failed_attempts = 0, locked_until = NULL, updated_at = now() WHERE user_id = $1",
    [userId]
  );
  return { ok: true };
}

module.exports = {
  findUserByLogin,
  registerUser,
  recordLoginFailure,
  resetLoginFailures,
  upsertDevice,
  createOtp,
  verifyOtp,
  activateVerification,
  createSession,
  revokeSession,
  getActiveSession,
  setupMfa,
  activateMfa,
  setupPin,
  verifyPin
};

