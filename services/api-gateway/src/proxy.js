const { randomUUID } = require("crypto");
const ROUTES = { auth: "authServiceUrl", users: "userServiceUrl", kyc: "kycServiceUrl", wallets: "walletServiceUrl", transactions: "transactionServiceUrl", payments: "transactionServiceUrl", bills: "transactionServiceUrl", airtime: "transactionServiceUrl", notifications: "notificationServiceUrl" };
const MONEY = /^(transactions\/(transfers|fund-wallet|withdrawals|bills|airtime)|payments\/(fund-wallet|initiate))/;
const PUBLIC = /^\/(auth\/(login|register|refresh|otp\/request|otp\/verify|mfa\/verify)|health\/)/;
function requestIds(req) { return { requestId: req.get("X-Request-ID") || randomUUID(), correlationId: req.get("X-Correlation-ID") || randomUUID() }; }
function isMoney(method, path) { return method !== "GET" && MONEY.test(path.replace(/^\//, "")); }
function requiresPin(path) { return /^(transactions\/(transfers|withdrawals|bills|airtime))/.test(path.replace(/^\//, "")); }
function normalizeError(status, body, requestId) { return { request_id: requestId, status: "failed", data: null, error: { code: body?.error?.code || "UPSTREAM_ERROR", message: status >= 500 ? "Upstream service unavailable" : (body?.error?.message || "Request failed") } }; }
module.exports = { ROUTES, MONEY, PUBLIC, requestIds, isMoney, requiresPin, normalizeError };
