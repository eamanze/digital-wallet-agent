import { Card } from "@/components/ui/Card";
import { TransactionList } from "@/components/wallet/TransactionList";
import { getTransactions } from "@/lib/api/endpoints";

export default async function AdminTransactionsPage() {
  const transactions = await getTransactions();
  return <><header className="topbar"><div><h1 className="page-title">Transaction operations</h1><p className="page-subtitle">Operations view for pending, failed, reversed and provider-dependent transactions.</p></div></header><Card title="All transactions"><TransactionList transactions={transactions} /></Card></>;
}
