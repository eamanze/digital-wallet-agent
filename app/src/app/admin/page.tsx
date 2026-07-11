import { AdminStatGrid } from "@/components/admin/AdminStatGrid";
import { Card } from "@/components/ui/Card";
import { getAdminMetrics, getFraudCases, getReconciliationItems } from "@/lib/api/endpoints";
import { ReconciliationTable } from "@/components/admin/ReconciliationTable";
import { RiskBadge } from "@/components/admin/RiskBadge";

export default async function AdminOverviewPage() {
  const [metrics, fraudCases, reconciliation] = await Promise.all([getAdminMetrics(), getFraudCases(), getReconciliationItems()]);
  return (
    <>
      <header className="topbar"><div><h1 className="page-title">Operations overview</h1><p className="page-subtitle">Monitor transaction health, fraud reviews, reconciliation exceptions and audit-sensitive workflows.</p></div></header>
      <AdminStatGrid metrics={metrics} />
      <div style={{ height: 18 }} />
      <div className="grid grid-2">
        <Card title="High-risk fraud cases">
          <div className="grid">
            {fraudCases.map((item) => <div key={item.id} className="alert"><strong>{item.user}</strong><br /><span>{item.reason}</span><br /><RiskBadge score={item.riskScore} /></div>)}
          </div>
        </Card>
        <Card title="Reconciliation exceptions"><ReconciliationTable items={reconciliation} /></Card>
      </div>
    </>
  );
}
