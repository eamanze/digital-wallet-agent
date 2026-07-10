async function request(baseUrl, path, options = {}) {
  const response = await fetch(`${baseUrl.replace(/\/$/, "")}${path}`, { ...options, headers: { "Content-Type": "application/json", ...(options.headers || {}) } });
  const body = await response.json().catch(() => ({}));
  if (!response.ok || body.error) { const error = new Error(body.error?.message || "Downstream request failed"); error.code = body.error?.code || "DOWNSTREAM_ERROR"; error.status = response.status; throw error; }
  return body.data;
}
function createClients(config, deps = {}) {
  const tokenHeaders = (token) => token ? { Authorization: token.startsWith("Bearer ") ? token : `Bearer ${token}` } : {};
  return {
    wallet: deps.wallet || ((id, token) => request(config.walletServiceUrl, `/wallets/${id}`, { headers: tokenHeaders(token) })),
    pin: deps.pin || ((token, pin) => request(config.authServiceUrl, "/auth/pin/verify", { method: "POST", headers: tokenHeaders(token), body: JSON.stringify({ pin }) })),
    limits: deps.limits || ((context, token, key) => request(config.limitsServiceUrl, "/limits/reservations", { method: "POST", headers: { ...tokenHeaders(token), "Idempotency-Key": key }, body: JSON.stringify(context) })),
    limitCommit: deps.limitCommit || ((reference, token) => request(config.limitsServiceUrl, `/limits/reservations/${reference}/commit`, { method: "POST", headers: tokenHeaders(token) })),
    limitRelease: deps.limitRelease || ((reference, token) => request(config.limitsServiceUrl, `/limits/reservations/${reference}/release`, { method: "POST", headers: tokenHeaders(token) })),
    fee: deps.fee || ((context, token, key) => request(config.feeServiceUrl, "/fees/quote", { method: "POST", headers: { ...tokenHeaders(token), "Idempotency-Key": key }, body: JSON.stringify(context) })),
    fraud: deps.fraud || ((context, token, key) => request(config.fraudServiceUrl, "/risk/evaluate", { method: "POST", headers: { ...tokenHeaders(token), "Idempotency-Key": key }, body: JSON.stringify(context) })),
    ledger: deps.ledger || ((payload, key) => request(config.ledgerServiceUrl, "/ledger/transactions", { method: "POST", headers: { "Idempotency-Key": key }, body: JSON.stringify(payload) })),
    ledgerReverse: deps.ledgerReverse || ((reference, key, reason) => request(config.ledgerServiceUrl, `/ledger/transactions/${reference}/reverse`, { method: "POST", headers: { "Idempotency-Key": key }, body: JSON.stringify({ reason }) })),
    provider: deps.provider || ((baseUrl, path, payload, key) => request(baseUrl, path, { method: "POST", headers: { "Idempotency-Key": key }, body: JSON.stringify(payload) }))
  };
}
module.exports = { request, createClients };
