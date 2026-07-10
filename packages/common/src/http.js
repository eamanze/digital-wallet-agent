const { randomUUID } = require("crypto");

function requestContext(req, _res, next) {
  req.requestId = req.get("X-Request-ID") || randomUUID();
  req.correlationId = req.get("X-Correlation-ID") || req.requestId;
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

