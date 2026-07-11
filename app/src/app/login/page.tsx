import { LoginForm } from "@/components/forms/LoginForm";
import { Card } from "@/components/ui/Card";
import { env } from "@/lib/env";

export default function LoginPage() {
  return (
    <main className="auth-page" id="main-content">
      <section className="auth-hero">
        <div className="brand"><div className="brand-mark">MW</div><div className="brand-name">{env.appName}</div></div>
        <div>
          <h1 className="page-title">Secure mobile money for everyday payments.</h1>
          <p className="page-subtitle">Sign in with MFA-ready session controls. Tokens are expected to live in HTTP-only cookies managed by the BFF/API Gateway.</p>
        </div>
        <p className="help" style={{ color: "#dbeafe" }}>Never share your OTP or transaction PIN with anyone.</p>
      </section>
      <section className="auth-card">
        <div>
          <Card title="Welcome back" meta="Access your wallet, transaction history and payments.">
            <LoginForm />
          </Card>
        </div>
      </section>
    </main>
  );
}
