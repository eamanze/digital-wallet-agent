const {createApp}=require("./app");
const {getConfig,createLogger}=require("@wallet/common");
const config=getConfig("fee-service");const logger=createLogger("fee-service");const {app}=createApp({config,logger});
app.listen(config.port,()=>logger.info({port:config.port},"fee-service listening"));
