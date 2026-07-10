const { createApp } = require("./app");
const { getConfig, createLogger } = require("@wallet/common");

const config = getConfig("auth-service");
const logger = createLogger("auth-service");
const { app, redis } = createApp({ config, logger });

redis.connect().then(() => {
  app.listen(config.port, () => {
    logger.info({ port: config.port }, "auth-service listening");
  });
}).catch((error) => {
  logger.error({ err: error }, "auth-service failed to start");
  process.exit(1);
});

