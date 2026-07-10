const { CircuitBreaker } = require("./providers");
async function retry(operation, options = {}) { const attempts = options.attempts || 3; const sleep = options.sleep || ((ms) => new Promise((resolve) => setTimeout(resolve, ms))); let last; for (let i = 0; i < attempts; i += 1) { try { return await operation(); } catch (error) { last = error; if (i === attempts - 1) throw error; await sleep(Math.min(1000 * (2 ** i), 5000)); } } throw last; }
module.exports = { CircuitBreaker, retry };
