const { createApp } = require("./app");
const { getConfig, createLogger } = require("@wallet/common");

const config = getConfig("wallet-service");
const logger = createLogger("wallet-service");
const { app } = createApp({ config, logger });

app.listen(config.port, () => {
  logger.info({ port: config.port }, "wallet-service listening");
});

