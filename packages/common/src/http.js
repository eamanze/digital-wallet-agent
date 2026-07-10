const { randomUUID } = require("crypto");
const { traceContext } = require("./tracing");
const { increment, observe, metricsHandler } = require("./metrics");

function requestContext(req, res, next) {
  req.requestId = req.get("X-Request-ID") || randomUUID();
  req.correlationId = req.get("X-Correlation-ID") || req.requestId;
  req.trace = traceContext(req); req.traceId = req.trace.traceId; req.spanId = req.trace.spanId; req._observabilityStartedAt = process.hrtime.bigint();
  res.setHeader("X-Request-ID", req.requestId); res.setHeader("X-Correlation-ID", req.correlationId); res.setHeader("traceparent", req.trace.traceparent);
  if (req.path === "/metrics") return metricsHandler(req, res);
  res.on("finish", () => { const durationMs=Number(process.hrtime.bigint()-req._observabilityStartedAt)/1e6; const route=req.route?.path||req.path; const labels={method:req.method,route,status:String(res.statusCode)}; increment("http_requests_total",labels); if(res.statusCode>=400&&res.statusCode<500)increment("http_client_errors_total",labels); if(res.statusCode>=500)increment("http_server_errors_total",labels); observe("http_request_duration_ms",durationMs,{method:req.method,route}); });
  next();
}

function sendError(res, status, code, message) {
  return res.status(status).json({
    request_id: res.req.requestId,
    status: "failed",
    data: null,
    error: { code, message }
  });
}

function sendOk(res, data, status = 200) {
  return res.status(status).json({
    request_id: res.req.requestId,
    status: "success",
    data,
    error: null
  });
}

module.exports = { requestContext, sendError, sendOk };
