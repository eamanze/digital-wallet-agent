const templates = {
  "user.registered": { subject: "Welcome to your wallet", body: (p) => `Welcome${p.first_name ? `, ${String(p.first_name).slice(0, 40)}` : ""}. Your account is ready.` },
  "otp.requested": { subject: "Your verification code", body: () => "A verification code was requested. Use it in the secure app flow. Never share your code." },
  "kyc.approved": { subject: "Identity verification approved", body: () => "Your identity verification was approved. You can now use the features available to your account." },
  "kyc.rejected": { subject: "Identity verification update", body: () => "We could not approve your identity verification. Please review the app for next steps." },
  "wallet.created": { subject: "Wallet created", body: (p) => `Your ${p.currency || "wallet"} wallet ${mask(p.wallet_id)} was created.` },
  "transaction.successful": { subject: "Transaction successful", body: (p) => `Transaction ${mask(p.transaction_reference)} was successful for ${p.currency || ""} ${safeAmount(p.amount_minor)}.` },
  "transaction.failed": { subject: "Transaction failed", body: (p) => `Transaction ${mask(p.transaction_reference)} could not be completed. Check the app for details.` },
  "withdrawal.pending": { subject: "Withdrawal pending", body: (p) => `Withdrawal ${mask(p.transaction_reference)} is being processed.` },
  "withdrawal.successful": { subject: "Withdrawal successful", body: (p) => `Withdrawal ${mask(p.transaction_reference)} was successful.` },
  "fraud.case_created": { subject: "Security review required", body: () => "A security review was opened for activity on your account. Please contact support if this was not you." },
  "account.suspended": { subject: "Account status update", body: () => "Your account has been temporarily restricted. Please contact support for assistance." }
};
function mask(value) { if (value === undefined || value === null) return "reference"; const text = String(value); return text.length <= 6 ? "••••" : `${text.slice(0, 3)}••••${text.slice(-3)}`; }
function safeAmount(value) { const n = Number(value); return Number.isSafeInteger(n) && n >= 0 ? (n / 100).toFixed(2) : "an amount"; }
function render(eventType, payload = {}) { const template = templates[eventType] || { subject: "Wallet notification", body: () => "There is an update in your wallet app." }; return { template_code: eventType, subject: template.subject, body: template.body(payload) }; }
module.exports = { templates, mask, safeAmount, render };
