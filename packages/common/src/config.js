function getEnv(name, fallback) {
  const value = process.env[name];
  if (value === undefined || value === "") {
    if (fallback !== undefined) return fallback;
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function getNumberEnv(name, fallback) {
  const raw = getEnv(name, String(fallback));
  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) {
    throw new Error(`Environment variable ${name} must be a number`);
  }
  return parsed;
}

function getConfig(serviceName) {
  const defaultPorts = {
    "auth-service": 3001,
    "user-service": 3002,
    "kyc-service": 3003,
    "ledger-service": 3004,
    "wallet-service": 3005,
    "limits-service": 3006,
    "fee-service": 3007,
    "fraud-service": 3008,
    "transaction-service": 3009,
    "payment-integration-service": 3010,
    "notification-service": 3011,
    "audit-service": 3012,
    "reconciliation-service": 3013
  };
  return {
    serviceName,
    environment: getEnv("NODE_ENV", "development"),
    port: getNumberEnv("PORT", defaultPorts[serviceName] || 3000),
    databaseUrl: getEnv("DATABASE_URL", "postgresql://wallet:wallet_dev_password@localhost:5432/wallet_dev"),
    redisUrl: getEnv("REDIS_URL", "redis://localhost:6379"),
    jwtAccessSecret: getEnv("JWT_ACCESS_SECRET", "local-dev-access-secret-change-me"),
    jwtRefreshSecret: getEnv("JWT_REFRESH_SECRET", "local-dev-refresh-secret-change-me"),
    accessTokenTtlSeconds: getNumberEnv("ACCESS_TOKEN_TTL_SECONDS", 900),
    refreshTokenTtlSeconds: getNumberEnv("REFRESH_TOKEN_TTL_SECONDS", 2592000),
    ledgerServiceUrl: getEnv("LEDGER_SERVICE_URL", "http://localhost:3004"),
    walletServiceUrl: getEnv("WALLET_SERVICE_URL", "http://localhost:3005"),
    authServiceUrl: getEnv("AUTH_SERVICE_URL", "http://localhost:3001"),
    limitsServiceUrl: getEnv("LIMITS_SERVICE_URL", "http://localhost:3006"),
    feeServiceUrl: getEnv("FEE_SERVICE_URL", "http://localhost:3007"),
    fraudServiceUrl: getEnv("FRAUD_SERVICE_URL", "http://localhost:3008"),
    providerServiceUrl: getEnv("PROVIDER_SERVICE_URL", "http://localhost:8092"),
    providerWebhookSecret: getEnv("PROVIDER_WEBHOOK_SECRET", "local-provider-webhook-secret"),
    providerTimeoutMs: getNumberEnv("PROVIDER_TIMEOUT_MS", 5000),
    providerMaxAttempts: getNumberEnv("PROVIDER_MAX_ATTEMPTS", 3),
    providerFailureThreshold: getNumberEnv("PROVIDER_FAILURE_THRESHOLD", 3),
    providerCircuitResetMs: getNumberEnv("PROVIDER_CIRCUIT_RESET_MS", 30000),
    notificationMaxAttempts: getNumberEnv("NOTIFICATION_MAX_ATTEMPTS", 3),
    notificationRetryDelayMs: getNumberEnv("NOTIFICATION_RETRY_DELAY_MS", 30000),
    otpTtlSeconds: getNumberEnv("OTP_TTL_SECONDS", 300),
    otpRequestLimit: getNumberEnv("OTP_REQUEST_LIMIT", 5),
    otpRequestWindowSeconds: getNumberEnv("OTP_REQUEST_WINDOW_SECONDS", 3600),
    loginAttemptLimit: getNumberEnv("LOGIN_ATTEMPT_LIMIT", 10),
    loginAttemptWindowSeconds: getNumberEnv("LOGIN_ATTEMPT_WINDOW_SECONDS", 900),
    pinAttemptLimit: getNumberEnv("PIN_ATTEMPT_LIMIT", 5),
    pinAttemptWindowSeconds: getNumberEnv("PIN_ATTEMPT_WINDOW_SECONDS", 3600)
  };
}

module.exports = { getEnv, getNumberEnv, getConfig };
