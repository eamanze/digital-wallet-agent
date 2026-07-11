import { ReconciliationTable } from "@/components/admin/ReconciliationTable";
import { Card } from "@/components/ui/Card";
import { getReconciliationItems } from "@/lib/api/endpoints";

export default async function ReconciliationPage() {
  const items = await getReconciliationItems();
  return <><header className="topbar"><div><h1 className="page-title">Reconciliation</h1><p className="page-subtitle">Provider settlement matching must never silently modify ledger records.</p></div></header><Card title="Latest batch"><ReconciliationTable items={items} /></Card></>;
}
