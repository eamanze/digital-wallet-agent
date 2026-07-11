import { RegisterForm } from "@/components/forms/RegisterForm";
import { Card } from "@/components/ui/Card";
import { env } from "@/lib/env";

export default function RegisterPage() {
  return (
    <main className="auth-page" id="main-content">
      <section className="auth-hero">
        <div className="brand"><div className="brand-mark">MW</div><div className="brand-name">{env.appName}</div></div>
        <div>
          <h1 className="page-title">Create your secure wallet account.</h1>
          <p className="page-subtitle">Register, verify your identity and start transacting with KYC-based limits and fraud controls.</p>
        </div>
      </section>
      <section className="auth-card">
        <div>
          <Card title="Create account" meta="Use accurate details. KYC verification may require government ID.">
            <RegisterForm />
          </Card>
        </div>
      </section>
    </main>
  );
}
