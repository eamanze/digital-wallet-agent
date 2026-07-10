const { createApp } = require("./app");
const { getConfig, createLogger } = require("@wallet/common");

const config = getConfig("kyc-service");
const logger = createLogger("kyc-service");
const { app } = createApp({ config, logger });

app.listen(config.port, () => {
  logger.info({ port: config.port }, "kyc-service listening");
});

