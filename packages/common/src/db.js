const { Pool } = require("pg");

function createPool(config) {
  return new Pool({
    connectionString: config.databaseUrl,
    application_name: config.serviceName,
    max: Number(process.env.DB_POOL_MAX || 10)
  });
}

async function withTransaction(pool, fn) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

module.exports = { createPool, withTransaction };

