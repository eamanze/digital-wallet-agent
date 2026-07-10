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
    base: { service: serviceName, environment: process.env.NODE_ENV || "development" },
    level: process.env.LOG_LEVEL || "info",
    redact
  });
}

function requestLogger(logger, req) {
  return logger.child({ request_id: req.requestId, correlation_id: req.correlationId, trace_id: req.traceId, span_id: req.spanId });
}

module.exports = { createLogger, requestLogger };
