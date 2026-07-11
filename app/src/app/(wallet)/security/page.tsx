import { Alert } from "@/components/ui/Alert";
import { Card } from "@/components/ui/Card";

export default function SecurityPage() {
  return (
    <>
      <header className="topbar">
        <div>
          <h1 className="page-title">Security settings</h1>
          <p className="page-subtitle">Manage MFA, trusted devices, transaction PIN and active sessions.</p>
        </div>
      </header>
      <div className="grid grid-2">
        <Card title="MFA"><Alert tone="success">MFA is enabled. Backend should enforce MFA on high-risk logins and admin actions.</Alert></Card>
        <Card title="Transaction PIN"><p className="card-meta">PIN is required for transfers, withdrawals, bills and airtime. PIN verification belongs to the auth/security service.</p></Card>
        <Card title="Trusted devices"><p className="card-meta">2 trusted devices. New devices should trigger risk scoring for high-value transactions.</p></Card>
        <Card title="Active sessions"><p className="card-meta">Session revocation should be handled by Redis/session store at the BFF or auth service.</p></Card>
      </div>
    </>
  );
}
