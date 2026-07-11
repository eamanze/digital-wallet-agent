import { BalanceCard } from "@/components/wallet/BalanceCard";
import { QuickActions } from "@/components/wallet/QuickActions";
import { TransactionList } from "@/components/wallet/TransactionList";
import { Card } from "@/components/ui/Card";
import { getCurrentUser, getTransactions, getWallet } from "@/lib/api/endpoints";

export default async function DashboardPage() {
  const [user, wallet, transactions] = await Promise.all([getCurrentUser(), getWallet(), getTransactions()]);
  return (
    <>
      <header className="topbar">
        <div>
          <h1 className="page-title">Welcome, {user.fullName.split(" ")[0]}</h1>
          <p className="page-subtitle">Your wallet is protected with KYC tiering, transaction PIN, fraud checks, and auditable ledger-backed balances.</p>
        </div>
      </header>
      <div className="grid grid-2">
        <BalanceCard wallet={wallet} />
        <Card title="Account status" meta="Production systems should enforce these controls server-side.">
          <div className="grid">
            <div><strong>User status:</strong> {user.status}</div>
            <div><strong>KYC tier:</strong> {user.kycTier.replace("tier_", "Tier ")}</div>
            <div><strong>Ledger account:</strong> {wallet.ledgerAccountId}</div>
          </div>
        </Card>
      </div>
      <div style={{ height: 18 }} />
      <QuickActions />
      <div style={{ height: 18 }} />
      <Card title="Recent transactions" meta="Wallet balances are projections. The ledger remains the source of truth.">
        <TransactionList transactions={transactions.slice(0, 4)} />
      </Card>
    </>
  );
}
