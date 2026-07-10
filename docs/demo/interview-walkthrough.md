# Interview walkthrough

1. Register Alice and Bob and explain KYC state plus its audit event.
2. Create wallets and fund Alice through the mock bank provider.
3. Explain transfer ordering: idempotency, PIN, KYC limit, fee quote, fraud check, then one atomic ledger journal.
4. Show airtime and bill payment through mock providers; notification failure cannot fail money movement.
5. Show withdrawal provider reference, timeout/failure states, and reconciliation.
6. Trigger a high-value/new-device/suspicious-IP fraud review; fraud never moves money.
7. Replay a callback twice and demonstrate deduplication/no duplicate debit or credit.
8. Import a synthetic settlement file and review mismatch exceptions.
9. Show transaction history, wallet/ledger statement, correlation ID, and audit events.
10. Copy `docs/rca/template.md` for the failed transaction and record timeline, impact, root cause, communication, and corrective actions.

The key architecture message: transaction-service orchestrates, ledger-service owns financial truth, providers are normalized and verified, fraud/limits gate risk, and reconciliation closes the loop.
