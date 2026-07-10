class LedgerClient {
  constructor(baseUrl) {
    this.baseUrl = baseUrl.replace(/\/$/, "");
  }

  async request(path, options = {}) {
    const response = await fetch(`${this.baseUrl}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {})
      }
    });
    const body = await response.json();
    if (!response.ok || body.error) {
      const error = new Error(body.error?.message || "Ledger service request failed");
      error.code = body.error?.code || "LEDGER_SERVICE_ERROR";
      error.status = response.status;
      throw error;
    }
    return body.data;
  }

  createAccount(input) {
    return this.request("/ledger/accounts", {
      method: "POST",
      body: JSON.stringify(input)
    });
  }

  getAccount(id) {
    return this.request(`/ledger/accounts/${id}`);
  }

  getAccountBalance(id) {
    return this.request(`/ledger/accounts/${id}/balance`);
  }

  getAccountEntries(id, limit = 100, offset = 0) {
    return this.request(`/ledger/accounts/${id}/entries?limit=${limit}&offset=${offset}`);
  }
}

module.exports = { LedgerClient };

