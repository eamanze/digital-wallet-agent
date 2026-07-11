export function getCorrelationId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `corr_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

export function safeLog(message: string, metadata?: Record<string, unknown>) {
  if (process.env.NODE_ENV !== "production") {
    console.info(message, metadata ?? {});
  }
}
