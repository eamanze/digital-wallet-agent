const pino = require("pino");

const redact = [
  "req.headers.authorization",
  "password",
  "otp",
  "pin",
  "transaction_pin",
  "access_token",
  "refresh_token",
  "*.password",
  "*.otp",
  "*.pin",
  "*.token",
  "*.secret"
];

function createLogger(serviceName) {
  return pino({
    name: serviceName,
    level: process.env.LOG_LEVEL || "info",
    redact
  });
}

module.exports = { createLogger };

