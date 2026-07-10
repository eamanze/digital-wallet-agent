const DECISION_ORDER = { allow: 0, challenge: 1, manual_review: 2, restrict_account: 3, block: 4 };

function evaluateRisk(input, rules = []) {
  const fired = [];
  const find = (code) => rules.find((rule) => rule.rule_code === code && rule.status === "active");
  const fire = (code, evidence) => { const rule = find(code); if (rule) fired.push({ rule, code, evidence }); };

  if (Number(input.failed_pin_attempts || 0) >= Number(find("FAILED_PIN_ATTEMPTS")?.rule_config?.threshold || 5)) fire("FAILED_PIN_ATTEMPTS", { failed_pin_attempts: Number(input.failed_pin_attempts) });
  if (input.suspicious_ip === true) fire("SUSPICIOUS_IP", { ip_risk: "suspicious" });
  if (input.new_device === true && Number(input.amount_minor || 0) >= Number(find("NEW_DEVICE_HIGH_VALUE")?.rule_config?.threshold_minor || 10000000)) fire("NEW_DEVICE_HIGH_VALUE", { new_device: true, amount_minor: Number(input.amount_minor) });
  if (Number(input.transaction_count_window || 0) >= Number(find("UNUSUAL_FREQUENCY")?.rule_config?.count_threshold || 10)) fire("UNUSUAL_FREQUENCY", { transaction_count_window: Number(input.transaction_count_window), window_seconds: Number(input.velocity_window_seconds || 300) });
  if (input.unusual_amount === true || Number(input.amount_minor || 0) >= Number(find("UNUSUAL_AMOUNT")?.rule_config?.threshold_minor || 50000000)) fire("UNUSUAL_AMOUNT", { amount_minor: Number(input.amount_minor) });
  if (Number(input.device_account_count || 0) >= Number(find("SHARED_DEVICE")?.rule_config?.account_threshold || 3)) fire("SHARED_DEVICE", { device_account_count: Number(input.device_account_count) });
  if (Number(input.recent_funding_withdrawal_count || 0) >= Number(find("RAPID_FUNDING_WITHDRAWAL")?.rule_config?.count_threshold || 1)) fire("RAPID_FUNDING_WITHDRAWAL", { recent_funding_withdrawal_count: Number(input.recent_funding_withdrawal_count), window_seconds: Number(input.funding_withdrawal_window_seconds || 3600) });

  fired.sort((a, b) => DECISION_ORDER[b.rule.decision] - DECISION_ORDER[a.rule.decision] || Number(a.rule.priority) - Number(b.rule.priority));
  const decision = fired[0]?.rule.decision || "allow";
  const riskScore = Math.min(100, fired.reduce((score, item) => score + ({ low: 10, medium: 25, high: 40, critical: 60 }[item.rule.severity] || 0), 0));
  return { decision, risk_score: riskScore, reason_codes: fired.map((item) => item.code), evidence: Object.assign({}, ...fired.map((item) => ({ [item.code]: item.evidence }))), fired_rules: fired };
}

module.exports = { evaluateRisk, DECISION_ORDER };
