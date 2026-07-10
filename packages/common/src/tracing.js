const { randomBytes } = require("crypto");
function id(bytes) { return randomBytes(bytes).toString("hex"); }
function traceContext(req) { const incoming=req.get("traceparent")||""; const match=/^00-([0-9a-f]{32})-([0-9a-f]{16})-([0-9a-f]{2})$/i.exec(incoming); const traceId=match?match[1]:id(16); const parentSpanId=match?match[2]:null; const spanId=id(8); return {traceId,spanId,parentSpanId,traceparent:`00-${traceId}-${spanId}-01`}; }
module.exports={traceContext};
