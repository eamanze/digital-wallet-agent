import { Card } from "@/components/ui/Card";
import { TransactionList } from "@/components/wallet/TransactionList";
import { getTransactions } from "@/lib/api/endpoints";

export default async function TransactionsPage() {
  const transactions = await getTransactions();
  return (
    <>
      <header className="topbar">
        <div>
          <h1 className="page-title">Transaction history</h1>
          <p className="page-subtitle">Searchable history should come from transaction metadata and OpenSearch/audit indexes, while financial truth remains in the ledger.</p>
        </div>
      </header>
      <Card title="Transactions" meta="Statuses are driven by the transaction state machine.">
        <TransactionList transactions={transactions} />
      </Card>
    </>
  );
}
