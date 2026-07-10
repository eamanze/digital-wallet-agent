const { createApp } = require("./app");
const { getConfig, createLogger } = require("@wallet/common");
const config = getConfig("fraud-service");
const { app } = createApp({ config, logger: createLogger("fraud-service") });
app.listen(config.port, () => createLogger("fraud-service").info({ port: config.port }, "fraud-service listening"));
