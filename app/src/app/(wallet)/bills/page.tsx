import { BillsForm } from "@/components/forms/BillsForm";
import { Card } from "@/components/ui/Card";

export default function Page() {
  return (
    <>
      <header className="topbar">
        <div>
          <h1 className="page-title">Pay bills</h1>
          <p className="page-subtitle">Pay billers safely with provider callbacks and reconciliation.</p>
        </div>
      </header>
      <div className="grid grid-2">
        <Card title="Pay bills">
          <BillsForm />
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
