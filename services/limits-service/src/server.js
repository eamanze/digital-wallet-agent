const { createApp } = require("./app");
const { getConfig, createLogger } = require("@wallet/common");
const config = getConfig("limits-service");
const { app } = createApp({ config, logger: createLogger("limits-service") });
app.listen(config.port, () => createLogger("limits-service").info({ port: config.port }, "limits-service listening"));
