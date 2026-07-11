import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

export default function Page() {
  return (
    <>
      <header className="topbar"><div><h1 className="page-title">KYC review</h1><p className="page-subtitle">Approve, reject and escalate KYC cases with compliance audit trail.</p></div></header>
      <div className="grid grid-3">
        <Card title="Queue"><div className="stat-value">24</div><Badge tone="warn">Needs review</Badge></Card>
        <Card title="Approved today"><div className="stat-value">128</div><Badge tone="good">Stable</Badge></Card>
        <Card title="Escalations"><div className="stat-value">7</div><Badge tone="danger">High priority</Badge></Card>
      </div>
      <div style={{ height: 18 }} />
      <Card title="Production note" meta="Connect this page to the admin API with RBAC and MFA enforced server-side."><p className="card-meta">Sensitive actions must create audit events and may require maker-checker approval.</p></Card>
    </>
  );
}
