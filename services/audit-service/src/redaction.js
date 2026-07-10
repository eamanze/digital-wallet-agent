const SENSITIVE = /(password|passwd|secret|token|authorization|access[_-]?token|refresh[_-]?token|otp|pin|pan|cvv|bvn|nin|identity[_-]?number|document|card[_-]?number|private[_-]?key)/i;
function redact(value, key = "") { if (SENSITIVE.test(key)) return "[REDACTED]"; if (Array.isArray(value)) return value.map((item) => redact(item)); if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([name, item]) => [name, redact(item, name)])); return value; }
module.exports = { redact, SENSITIVE };
