const { createClient } = require("redis");

function createRedis(config) {
  const client = createClient({ url: config.redisUrl });
  client.on("error", () => {
    // Redis errors are surfaced through command failures. Do not log payloads here.
  });
  return client;
}

async function incrementRateLimit(redis, key, limit, windowSeconds) {
  const count = await redis.incr(key);
  if (count === 1) {
    await redis.expire(key, windowSeconds);
  }
  const ttl = await redis.ttl(key);
  return {
    allowed: count <= limit,
    count,
    limit,
    retryAfterSeconds: ttl > 0 ? ttl : windowSeconds
  };
}

module.exports = { createRedis, incrementRateLimit };

