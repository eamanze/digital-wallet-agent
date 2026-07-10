const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

function hashSecret(secret, purpose) {
  const hash = bcrypt.hashSync(`${purpose}:${secret}`, 12);
  return `bcrypt$${hash}`;
}

function verifySecret(secret, purpose, storedHash) {
  if (!storedHash || !storedHash.startsWith("bcrypt$")) return false;
  const hash = storedHash.slice("bcrypt$".length);
  return bcrypt.compareSync(`${purpose}:${secret}`, hash);
}

function sha256(value) {
  return crypto.createHash("sha256").update(String(value)).digest("hex");
}

function generateOtp() {
  return String(crypto.randomInt(0, 1000000)).padStart(6, "0");
}

function generateOpaqueToken() {
  return crypto.randomBytes(48).toString("base64url");
}

function signAccessToken(config, payload) {
  return jwt.sign(payload, config.jwtAccessSecret, {
    algorithm: "HS256",
    expiresIn: config.accessTokenTtlSeconds,
    issuer: "digital-wallet-agent",
    audience: "wallet-api"
  });
}

function verifyAccessToken(config, token) {
  return jwt.verify(token, config.jwtAccessSecret, {
    issuer: "digital-wallet-agent",
    audience: "wallet-api"
  });
}

function signRefreshToken(config, payload) {
  return jwt.sign(payload, config.jwtRefreshSecret, {
    algorithm: "HS256",
    expiresIn: config.refreshTokenTtlSeconds,
    issuer: "digital-wallet-agent",
    audience: "wallet-refresh"
  });
}

function verifyRefreshToken(config, token) {
  return jwt.verify(token, config.jwtRefreshSecret, {
    issuer: "digital-wallet-agent",
    audience: "wallet-refresh"
  });
}

function isStrongPassword(password) {
  return typeof password === "string"
    && password.length >= 12
    && /[a-z]/.test(password)
    && /[A-Z]/.test(password)
    && /[0-9]/.test(password);
}

function isValidPin(pin) {
  return typeof pin === "string" && /^[0-9]{4,6}$/.test(pin);
}

function maskIdentifier(value, visible = 4) {
  if (value === undefined || value === null) return value;
  const text = String(value);
  if (text.length <= visible) return "***";
  return `${"*".repeat(Math.max(3, text.length - visible))}${text.slice(-visible)}`;
}

function deviceFingerprint(input = {}) {
  return sha256([input.deviceId, input.userAgent, input.os, input.appVersion].filter(Boolean).join("|"));
}

// Adapter seam: replace with a provider-backed reputation client without changing callers.
async function checkIpReputation(ip, client) {
  if (client && typeof client.lookup === "function") return client.lookup(ip);
  return { ip: maskIdentifier(ip, 3), risk: "unknown", source: "placeholder" };
}

module.exports = {
  hashSecret,
  verifySecret,
  sha256,
  generateOtp,
  generateOpaqueToken,
  signAccessToken,
  verifyAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  isStrongPassword,
  isValidPin,
  maskIdentifier,
  deviceFingerprint,
  checkIpReputation
};
