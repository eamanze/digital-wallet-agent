import { AirtimeForm } from "@/components/forms/AirtimeForm";
import { Card } from "@/components/ui/Card";

export default function Page() {
  return (
    <>
      <header className="topbar">
        <div>
          <h1 className="page-title">Buy airtime</h1>
          <p className="page-subtitle">Purchase airtime with transaction PIN and idempotent provider handling.</p>
        </div>
      </header>
      <div className="grid grid-2">
        <Card title="Buy airtime">
          <AirtimeForm />
        </Card>
        <Card title="Production checks" meta="The backend must enforce these checks even if the frontend validates input.">
          <ul className="card-meta">
            <li>Validate session and user status.</li>
            <li>Enforce KYC tier, limits and fraud rules.</li>
            <li>Require idempotency for financial operations.</li>
            <li>Create auditable transaction state transitions.</li>
            <li>Never trust client-calculated fees or balances.</li>
          </ul>
        </Card>
      </div>
    </>
  );
}
