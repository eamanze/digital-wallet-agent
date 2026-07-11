import { WithdrawForm } from "@/components/forms/WithdrawForm";
import { Card } from "@/components/ui/Card";

export default function Page() {
  return (
    <>
      <header className="topbar">
        <div>
          <h1 className="page-title">Withdraw to bank</h1>
          <p className="page-subtitle">Withdraw from wallet to a verified bank account. Backend must verify name enquiry and provider callback.</p>
        </div>
      </header>
      <div className="grid grid-2">
        <Card title="Withdraw to bank">
          <WithdrawForm />
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
