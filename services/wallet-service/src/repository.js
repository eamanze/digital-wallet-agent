const { randomUUID } = require("crypto");

function walletReference() {
  return `wal_${randomUUID()}`;
}

function ledgerAccountCode(userId, currency) {
  return `user_wallet:${userId}:${currency}`;
}

async function createWallet(client, input, ledgerClient) {
  const currency = input.currency || "NGN";
  if (currency !== "NGN") {
    const error = new Error("Only NGN wallets are supported initially");
    error.code = "UNSUPPORTED_CURRENCY";
    throw error;
  }

  const existing = await client.query(
    "SELECT * FROM wallet.wallets WHERE user_id = $1 AND currency = $2",
    [input.user_id, currency]
  );
  if (existing.rows[0]) return existing.rows[0];

  const ledgerAccount = await ledgerClient.createAccount({
    account_code: ledgerAccountCode(input.user_id, currency),
    account_name: `User Wallet ${input.user_id} ${currency}`,
    account_type: "liability",
    owner_type: "user",
    owner_id: input.user_id,
    currency
  });

  const walletResult = await client.query(
    `INSERT INTO wallet.wallets (
      user_id, wallet_reference, currency, status, ledger_account_id, metadata
    ) VALUES ($1,$2,$3,'active',$4,$5)
    RETURNING *`,
    [
      input.user_id,
      input.wallet_reference || walletReference(),
      currency,
      ledgerAccount.id,
      input.metadata || {}
    ]
  );

  await client.query(
    `INSERT INTO wallet.wallet_balance_projections (
      wallet_id, ledger_account_id, currency, posted_balance_minor, available_balance_minor, held_balance_minor
    ) VALUES ($1,$2,$3,0,0,0)
    ON CONFLICT (wallet_id) DO NOTHING`,
    [walletResult.rows[0].id, ledgerAccount.id, currency]
  );

  return walletResult.rows[0];
}

async function getWallet(client, id) {
  const result = await client.query(
    `SELECT w.*, p.posted_balance_minor, p.available_balance_minor, p.held_balance_minor, p.updated_at AS projection_updated_at
    FROM wallet.wallets w
    LEFT JOIN wallet.wallet_balance_projections p ON p.wallet_id = w.id
    WHERE w.id = $1`,
    [id]
  );
  return result.rows[0] || null;
}

async function getWalletByUserCurrency(client, userId, currency = "NGN") {
  const result = await client.query(
    "SELECT * FROM wallet.wallets WHERE user_id = $1 AND currency = $2",
    [userId, currency]
  );
  return result.rows[0] || null;
}

async function updateWalletStatus(client, id, status) {
  const result = await client.query(
    `UPDATE wallet.wallets
    SET status = $2,
      closed_at = CASE WHEN $2 = 'closed' THEN COALESCE(closed_at, now()) ELSE closed_at END,
      updated_at = now()
    WHERE id = $1
    RETURNING *`,
    [id, status]
  );
  return result.rows[0] || null;
}

async function upsertProjectionFromLedgerBalance(client, wallet, ledgerBalance) {
  const postedBalance = Number(ledgerBalance.balance_minor || 0);
  const current = await client.query(
    "SELECT held_balance_minor FROM wallet.wallet_balance_projections WHERE wallet_id = $1",
    [wallet.id]
  );
  const held = Number(current.rows[0]?.held_balance_minor || 0);
  const available = postedBalance - held;
  const result = await client.query(
    `INSERT INTO wallet.wallet_balance_projections (
      wallet_id, ledger_account_id, currency, posted_balance_minor, available_balance_minor, held_balance_minor, version, updated_at
    ) VALUES ($1,$2,$3,$4,$5,$6,1,now())
    ON CONFLICT (wallet_id) DO UPDATE SET
      posted_balance_minor = EXCLUDED.posted_balance_minor,
      available_balance_minor = EXCLUDED.available_balance_minor,
      held_balance_minor = EXCLUDED.held_balance_minor,
      version = wallet.wallet_balance_projections.version + 1,
      updated_at = now()
    RETURNING *`,
    [wallet.id, wallet.ledger_account_id, wallet.currency, postedBalance, available, held]
  );
  return result.rows[0];
}

function balanceResponse(wallet, projection, ledgerBalance) {
  const ledgerPosted = Number(ledgerBalance.balance_minor || 0);
  const projectionPosted = Number(projection?.posted_balance_minor || 0);
  const projectionMatchesLedger = projectionPosted === ledgerPosted;
  const held = Number(projection?.held_balance_minor || 0);
  return {
    wallet_id: wallet.id,
    ledger_account_id: wallet.ledger_account_id,
    currency: wallet.currency,
    posted_balance_minor: ledgerPosted,
    available_balance_minor: ledgerPosted - held,
    held_balance_minor: held,
    source_of_truth: "ledger",
    projection_matches_ledger: projectionMatchesLedger,
    projection_posted_balance_minor: projectionPosted,
    as_of: ledgerBalance.as_of || new Date().toISOString()
  };
}

module.exports = {
  createWallet,
  getWallet,
  getWalletByUserCurrency,
  updateWalletStatus,
  upsertProjectionFromLedgerBalance,
  balanceResponse,
  ledgerAccountCode
};

