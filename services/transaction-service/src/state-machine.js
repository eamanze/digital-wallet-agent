const transitions = {
  initiated: ["pending_validation", "failed"],
  pending_validation: ["pending_fraud_check", "failed"],
  pending_fraud_check: ["pending_provider", "successful", "under_review", "failed"],
  pending_provider: ["successful", "failed", "reversed", "under_review"],
  successful: ["reversed"],
  failed: [],
  reversed: [],
  under_review: ["pending_provider", "successful", "failed", "reversed"]
};
function canTransition(from, to) { return from === to || (transitions[from] || []).includes(to); }
function assertTransition(from, to) { if (!canTransition(from, to)) { const error = new Error(`Invalid transaction transition: ${from} -> ${to}`); error.code = "INVALID_TRANSACTION_STATE"; throw error; } }
module.exports = { transitions, canTransition, assertTransition };
