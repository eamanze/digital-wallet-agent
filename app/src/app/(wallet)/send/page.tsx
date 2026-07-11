import { TransferForm } from "@/components/forms/TransferForm";
import { Card } from "@/components/ui/Card";

export default function Page() {
  return (
    <>
      <header className="topbar">
        <div>
          <h1 className="page-title">Send money</h1>
          <p className="page-subtitle">Wallet-to-wallet transfer with limits, fraud checks, transaction PIN and idempotency.</p>
        </div>
      </header>
      <div className="grid grid-2">
        <Card title="Send money">
          <TransferForm />
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
