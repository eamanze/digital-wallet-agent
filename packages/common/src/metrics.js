const counters = new Map();
const histograms = new Map();
function increment(name, labels = {}, value = 1) { const key = `${name}|${JSON.stringify(labels)}`; counters.set(key, (counters.get(key) || 0) + value); }
function observe(name, value, labels = {}) { const key = `${name}|${JSON.stringify(labels)}`; const bucket = histograms.get(key) || { count: 0, sum: 0 }; bucket.count += 1; bucket.sum += Number(value); histograms.set(key, bucket); }
function labelsText(labels) { return Object.entries(labels).map(([key,value]) => `${key}="${String(value).replace(/"/g,'\\"')}"`).join(","); }
function renderMetrics() { const lines = []; for (const [key,value] of counters) { const [name,raw] = key.split("|",2); lines.push(`${name}{${labelsText(JSON.parse(raw))}} ${value}`); } for (const [key,value] of histograms) { const [name,raw] = key.split("|",2); const labels=labelsText(JSON.parse(raw)); lines.push(`${name}_count{${labels}} ${value.count}`,`${name}_sum{${labels}} ${value.sum}`); } return `${lines.join("\n")}\n`; }
function metricsHandler(_req,res) { res.type("text/plain; version=0.0.4").send(renderMetrics()); }
module.exports = { increment, observe, renderMetrics, metricsHandler };
