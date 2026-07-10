const { createApp } = require("./app");
const { getConfig, createLogger } = require("@wallet/common");

const config = getConfig("user-service");
const logger = createLogger("user-service");
const { app } = createApp({ config, logger });

app.listen(config.port, () => {
  logger.info({ port: config.port }, "user-service listening");
});

