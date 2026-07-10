const { randomUUID } = require("crypto");
const { publishOutboxEvent, writeAudit } = require("@wallet/common");
const { validateEntries, calculateNormalBalance, reversalEntries } = require("./ledger-rules");

async function createLedgerAccount(client, input) {
  const result = await client.query(
    `INSERT INTO ledger.ledger_accounts (
      account_code, account_name, account_type, owner_type, owner_id, currency, status
    ) VALUES ($1,$2,$3,$4,$5,$6,'active')
    RETURNING *`,
    [
      input.account_code,
      input.account_name,
      input.account_type,
      input.owner_type,
      input.owner_id || null,
      input.currency
    ]
  );
  return result.rows[0];
}

async function getLedgerAccount(client, id) {
  const result = await client.query(
    "SELECT * FROM ledger.ledger_accounts WHERE id = $1",
    [id]
  );
  return result.rows[0] || null;
}

async function getLedgerTransactionByReference(client, reference) {
  const txResult = await client.query(
    "SELECT * FROM ledger.ledger_transactions WHERE ledger_reference = $1 OR transaction_reference = $1",
    [reference]
  );
  const transaction = txResult.rows[0];
  if (!transaction) return null;
  const entries = await client.query(
    `SELECT le.*, la.account_code, la.account_type
    FROM ledger.ledger_entries le
    JOIN ledger.ledger_accounts la ON la.id = le.account_id
    WHERE le.ledger_transaction_id = $1
    ORDER BY le.created_at, le.id`,
    [transaction.id]
  );
  return { ...transaction, entries: entries.rows };
}

async function lockAndValidateAccounts(client, entries) {
  const accountIds = [...new Set(entries.map((entry) => entry.account_id))];
  const result = await client.query(
    `SELECT id, account_code, account_type, currency, status
    FROM ledger.ledger_accounts
    WHERE id = ANY($1::uuid[])
    FOR UPDATE`,
    [accountIds]
  );
  if (result.rows.length !== accountIds.length) {
    const error = new Error("One or more ledger accounts do not exist");
    error.code = "LEDGER_ACCOUNT_NOT_FOUND";
    throw error;
  }
  const byId = new Map(result.rows.map((account) => [account.id, account]));
  for (const entry of entries) {
    const account = byId.get(entry.account_id);
    if (account.status !== "active") {
      const error = new Error("Ledger account is not active");
      error.code = "LEDGER_ACCOUNT_INACTIVE";
      throw error;
    }
    if (account.currency !== entry.currency) {
      const error = new Error("Ledger account currency mismatch");
      error.code = "LEDGER_ACCOUNT_CURRENCY_MISMATCH";
      throw error;
    }
  }
  return result.rows;
}

async function insertPostedLedgerTransaction(client, input) {
  validateEntries(input.entries, input.currency);

  const existing = await client.query(
    "SELECT ledger_reference FROM ledger.ledger_transactions WHERE idempotency_key = $1",
    [input.idempotency_key]
  );
  if (existing.rows[0]) {
    return getLedgerTransactionByReference(client, existing.rows[0].ledger_reference);
  }

  await lockAndValidateAccounts(client, input.entries);

  const reference = input.ledger_reference || `LED-${randomUUID()}`;
  const transactionReference = input.transaction_reference || reference;

  const tx = await client.query(
    `INSERT INTO ledger.ledger_transactions (
      transaction_request_id, ledger_reference, transaction_reference, idempotency_key,
      transaction_type, status, currency, description, reversal_of_ledger_transaction_id,
      created_by_service, metadata
    ) VALUES ($1,$2,$3,$4,$5,'pending',$6,$7,$8,$9,$10)
    RETURNING *`,
    [
      input.transaction_request_id || null,
      reference,
      transactionReference,
      input.idempotency_key,
      input.transaction_type,
      input.currency,
      input.description || null,
      input.reversal_of_ledger_transaction_id || null,
      input.created_by_service || "ledger-service",
      input.metadata || {}
    ]
  );

  for (const entry of input.entries) {
    await client.query(
      `INSERT INTO ledger.ledger_entries (
        ledger_transaction_id, account_id, entry_type, amount_minor, currency, metadata
      ) VALUES ($1,$2,$3,$4,$5,$6)`,
      [
        tx.rows[0].id,
        entry.account_id,
        entry.entry_type,
        entry.amount_minor,
        entry.currency,
        entry.metadata || {}
      ]
    );
  }

  await client.query(
    "UPDATE ledger.ledger_transactions SET status = 'posted', posted_at = now() WHERE id = $1",
    [tx.rows[0].id]
  );

  const posted = await getLedgerTransactionByReference(client, reference);
  await publishOutboxEvent(client, {
    event_type: input.transaction_type === "reversal" ? "ledger.journal.reversed" : "ledger.journal.posted",
    producer: "ledger-service",
    correlation_id: input.correlation_id || null,
    payload: {
      ledger_transaction_id: posted.id,
      ledger_reference: posted.ledger_reference,
      transaction_reference: posted.transaction_reference,
      transaction_type: posted.transaction_type,
      currency: posted.currency
    }
  });
  await writeAudit(client, {
    actor_type: input.actor_type || "system",
    actor_id: input.actor_id || null,
    action: input.transaction_type === "reversal" ? "ledger.transaction.reversed" : "ledger.transaction.posted",
    resource_type: "ledger_transaction",
    resource_id: posted.id,
    result: "success",
    correlation_id: input.correlation_id || null,
    metadata: {
      ledger_reference: posted.ledger_reference,
      transaction_reference: posted.transaction_reference
    }
  });
  return posted;
}

async function getAccountEntries(client, accountId, limit = 100, offset = 0) {
  const result = await client.query(
    `SELECT le.*, lt.ledger_reference, lt.transaction_reference, lt.transaction_type, lt.status AS transaction_status
    FROM ledger.ledger_entries le
    JOIN ledger.ledger_transactions lt ON lt.id = le.ledger_transaction_id
    WHERE le.account_id = $1
    ORDER BY le.created_at DESC, le.id DESC
    LIMIT $2 OFFSET $3`,
    [accountId, limit, offset]
  );
  return result.rows;
}

async function getAccountBalance(client, accountId) {
  const result = await client.query(
    `SELECT
      la.id AS account_id,
      la.account_code,
      la.account_type,
      la.currency,
      COALESCE(SUM(CASE WHEN le.entry_type = 'debit' AND lt.status IN ('posted', 'reversed') THEN le.amount_minor ELSE 0 END), 0) AS debit_total_minor,
      COALESCE(SUM(CASE WHEN le.entry_type = 'credit' AND lt.status IN ('posted', 'reversed') THEN le.amount_minor ELSE 0 END), 0) AS credit_total_minor,
      MAX(le.created_at) AS as_of
    FROM ledger.ledger_accounts la
    LEFT JOIN ledger.ledger_entries le ON le.account_id = la.id
    LEFT JOIN ledger.ledger_transactions lt ON lt.id = le.ledger_transaction_id
    WHERE la.id = $1
    GROUP BY la.id`,
    [accountId]
  );
  const row = result.rows[0];
  if (!row) return null;
  return {
    ...row,
    debit_total_minor: Number(row.debit_total_minor),
    credit_total_minor: Number(row.credit_total_minor),
    balance_minor: calculateNormalBalance(row.account_type, row.debit_total_minor, row.credit_total_minor)
  };
}

async function reverseLedgerTransaction(client, reference, input) {
  const originalResult = await client.query(
    `SELECT * FROM ledger.ledger_transactions
    WHERE (ledger_reference = $1 OR transaction_reference = $1)
    FOR UPDATE`,
    [reference]
  );
  const original = originalResult.rows[0];
  if (!original) return null;
  if (original.status === "reversed") {
    const existing = await client.query(
      "SELECT ledger_reference FROM ledger.ledger_transactions WHERE reversal_of_ledger_transaction_id = $1 ORDER BY created_at DESC LIMIT 1",
      [original.id]
    );
    return existing.rows[0] ? getLedgerTransactionByReference(client, existing.rows[0].ledger_reference) : getLedgerTransactionByReference(client, reference);
  }
  if (original.status !== "posted") {
    const error = new Error("Only posted ledger transactions can be reversed");
    error.code = "LEDGER_REVERSAL_NOT_ALLOWED";
    throw error;
  }

  const entryResult = await client.query(
    "SELECT * FROM ledger.ledger_entries WHERE ledger_transaction_id = $1 ORDER BY created_at, id",
    [original.id]
  );
  const reversal = await insertPostedLedgerTransaction(client, {
    ledger_reference: input.ledger_reference || `REV-${original.ledger_reference}`,
    transaction_reference: input.transaction_reference || `REV-${original.transaction_reference}`,
    idempotency_key: input.idempotency_key,
    transaction_type: "reversal",
    currency: original.currency,
    description: input.reason || `Reversal of ${original.ledger_reference}`,
    reversal_of_ledger_transaction_id: original.id,
    entries: reversalEntries(entryResult.rows),
    created_by_service: input.created_by_service || "ledger-service",
    actor_type: input.actor_type || "system",
    actor_id: input.actor_id || null,
    correlation_id: input.correlation_id || null,
    metadata: { reason: input.reason || null }
  });
  await client.query(
    "UPDATE ledger.ledger_transactions SET status = 'reversed', reversed_at = now() WHERE id = $1",
    [original.id]
  );
  return reversal;
}

module.exports = {
  createLedgerAccount,
  getLedgerAccount,
  getLedgerTransactionByReference,
  insertPostedLedgerTransaction,
  getAccountEntries,
  getAccountBalance,
  reverseLedgerTransaction,
  lockAndValidateAccounts
};
