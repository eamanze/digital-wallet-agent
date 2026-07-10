function sumEntries(entries) {
  return entries.reduce((totals, entry) => {
    if (entry.entry_type === "debit") totals.debit += Number(entry.amount_minor);
    if (entry.entry_type === "credit") totals.credit += Number(entry.amount_minor);
    return totals;
  }, { debit: 0, credit: 0 });
}

function validateEntries(entries, currency) {
  if (!Array.isArray(entries) || entries.length < 2) {
    const error = new Error("Ledger transaction requires at least two entries");
    error.code = "LEDGER_MIN_ENTRIES";
    throw error;
  }

  for (const entry of entries) {
    if (!["debit", "credit"].includes(entry.entry_type)) {
      const error = new Error("Invalid ledger entry type");
      error.code = "LEDGER_ENTRY_TYPE_INVALID";
      throw error;
    }
    if (!Number.isInteger(Number(entry.amount_minor)) || Number(entry.amount_minor) <= 0) {
      const error = new Error("Ledger entry amount must be positive minor units");
      error.code = "LEDGER_AMOUNT_INVALID";
      throw error;
    }
    if (entry.currency !== currency) {
      const error = new Error("Ledger entry currency mismatch");
      error.code = "LEDGER_CURRENCY_MISMATCH";
      throw error;
    }
  }

  const totals = sumEntries(entries);
  if (totals.debit !== totals.credit) {
    const error = new Error("Ledger transaction is unbalanced");
    error.code = "LEDGER_UNBALANCED";
    error.details = totals;
    throw error;
  }
  return totals;
}

function normalBalanceSide(accountType) {
  if (["asset", "expense", "settlement", "suspense"].includes(accountType)) return "debit";
  return "credit";
}

function calculateNormalBalance(accountType, debitTotal, creditTotal) {
  return normalBalanceSide(accountType) === "debit"
    ? Number(debitTotal) - Number(creditTotal)
    : Number(creditTotal) - Number(debitTotal);
}

function reversalEntries(entries) {
  return entries.map((entry) => ({
    account_id: entry.account_id,
    entry_type: entry.entry_type === "debit" ? "credit" : "debit",
    amount_minor: Number(entry.amount_minor),
    currency: entry.currency,
    metadata: {
      reversal_of_ledger_entry_id: entry.id
    }
  }));
}

module.exports = {
  sumEntries,
  validateEntries,
  normalBalanceSide,
  calculateNormalBalance,
  reversalEntries
};

