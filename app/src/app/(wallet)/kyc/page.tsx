import { KycForm } from "@/components/forms/KycForm";
import { Card } from "@/components/ui/Card";

export default function Page() {
  return (
    <>
      <header className="topbar">
        <div>
          <h1 className="page-title">KYC verification</h1>
          <p className="page-subtitle">Upload identity information securely. Documents should go to encrypted object storage via pre-signed URLs.</p>
        </div>
      </header>
      <div className="grid grid-2">
        <Card title="KYC verification">
          <KycForm />
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
