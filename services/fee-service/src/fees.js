function waiverMatches(conditions = {}, context) {
  if (conditions.user_ids?.length && !conditions.user_ids.includes(context.user_id)) return false;
  if (conditions.kyc_tiers?.length && !conditions.kyc_tiers.includes(context.kyc_tier)) return false;
  if (conditions.channels?.length && !conditions.channels.includes(context.channel)) return false;
  if (conditions.min_amount_minor !== undefined && context.amount_minor < conditions.min_amount_minor) return false;
  if (conditions.max_amount_minor !== undefined && context.amount_minor > conditions.max_amount_minor) return false;
  return Object.keys(conditions).length > 0;
}

function calculateFee(rule, context) {
  const waived = rule.waived || waiverMatches(rule.waiver_conditions || {}, context);
  const percentage = Number((BigInt(context.amount_minor) * BigInt(rule.percentage_bps || 0) + 5000n) / 10000n);
  const beforeBounds = Number(rule.fixed_amount_minor || 0) + percentage;
  let fee = waived ? 0 : beforeBounds;
  if (!waived && rule.min_fee_minor !== null && rule.min_fee_minor !== undefined) fee = Math.max(fee, Number(rule.min_fee_minor));
  if (!waived && rule.max_fee_minor !== null && rule.max_fee_minor !== undefined) fee = Math.min(fee, Number(rule.max_fee_minor));
  return {
    fee_minor: fee,
    currency: context.currency,
    fee_code: rule.fee_code,
    waived,
    revenue_account_code: rule.revenue_account_code,
    calculation: {
      amount_minor: context.amount_minor,
      fixed_amount_minor: Number(rule.fixed_amount_minor || 0),
      percentage_bps: Number(rule.percentage_bps || 0),
      percentage_amount_minor: percentage,
      subtotal_minor: beforeBounds,
      min_fee_minor: rule.min_fee_minor === null ? null : Number(rule.min_fee_minor),
      max_fee_minor: rule.max_fee_minor === null ? null : Number(rule.max_fee_minor),
      waived,
      rounding: "nearest_minor_unit_half_up"
    },
    ledger_posting_instruction: fee === 0 ? null : { credit_account_code: rule.revenue_account_code, amount_minor: fee, currency: context.currency }
  };
}

function selectRule(rules, context) {
  return rules
    .filter((rule) => rule.transaction_type === context.transaction_type && rule.currency === context.currency && (rule.channel === "*" || rule.channel === context.channel))
    .sort((a, b) => (Number(a.priority || 100) - Number(b.priority || 100)) || ((a.channel === "*" ? 1 : 0) - (b.channel === "*" ? 1 : 0)) || String(a.fee_code).localeCompare(String(b.fee_code)))[0] || null;
}
module.exports = { waiverMatches, calculateFee, selectRule };
