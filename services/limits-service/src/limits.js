function periodStart(windowType, now = new Date(), windowSeconds) {
  if (windowType === "daily") return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  if (windowType === "monthly") return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  if (windowType === "rolling") return new Date(now.getTime() - windowSeconds * 1000);
  return null;
}

function ruleApplies(rule, context) {
  return rule.kyc_tier === context.kyc_tier
    && rule.currency === context.currency
    && (rule.transaction_type === "*" || rule.transaction_type === context.transaction_type)
    && (rule.channel === "*" || rule.channel === context.channel);
}

function evaluateRules(rules, context, usageByRule = {}) {
  const applicable = rules.filter((rule) => ruleApplies(rule, context));
  if (applicable.length === 0) return { decision: "deny", reason_codes: ["NO_LIMIT_CONFIGURATION"], evaluations: [] };
  const evaluations = applicable.map((rule) => {
    const usage = usageByRule[rule.id] || { amount_minor: 0, count: 0 };
    const projectedAmount = rule.window_type === "single"
      ? context.amount_minor
      : Number(usage.amount_minor) + context.amount_minor;
    const projectedCount = rule.window_type === "single" ? 1 : Number(usage.count) + 1;
    const amountExceeded = rule.max_amount_minor !== null && projectedAmount > Number(rule.max_amount_minor);
    const countExceeded = rule.max_count !== null && projectedCount > Number(rule.max_count);
    return {
      rule_code: rule.rule_code,
      window_type: rule.window_type,
      used_amount_minor: Number(usage.amount_minor),
      used_count: Number(usage.count),
      requested_amount_minor: context.amount_minor,
      projected_amount_minor: projectedAmount,
      projected_count: projectedCount,
      max_amount_minor: rule.max_amount_minor === null ? null : Number(rule.max_amount_minor),
      max_count: rule.max_count === null ? null : Number(rule.max_count),
      remaining_amount_minor: rule.max_amount_minor === null ? null : Math.max(0, Number(rule.max_amount_minor) - Number(usage.amount_minor)),
      remaining_count: rule.max_count === null ? null : Math.max(0, Number(rule.max_count) - Number(usage.count)),
      allowed: !amountExceeded && !countExceeded,
      reason_code: amountExceeded ? `${rule.window_type.toUpperCase()}_AMOUNT_LIMIT_EXCEEDED`
        : countExceeded ? `${rule.window_type.toUpperCase()}_VELOCITY_LIMIT_EXCEEDED` : null
    };
  });
  const reasonCodes = evaluations.filter((item) => !item.allowed).map((item) => item.reason_code);
  return { decision: reasonCodes.length ? "deny" : "allow", reason_codes: [...new Set(reasonCodes)], evaluations };
}

module.exports = { periodStart, ruleApplies, evaluateRules };
