const { createApp } = require("./app");
const { getConfig, createLogger } = require("@wallet/common");

const config = getConfig("ledger-service");
const logger = createLogger("ledger-service");
const { app } = createApp({ config, logger });

app.listen(config.port, () => {
  logger.info({ port: config.port }, "ledger-service listening");
});

