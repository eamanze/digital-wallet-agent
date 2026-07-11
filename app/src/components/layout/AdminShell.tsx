import Link from "next/link";

const adminLinks = [
  ["Overview", "/admin"],
  ["Users", "/admin/users"],
  ["Transactions", "/admin/transactions"],
  ["KYC Review", "/admin/kyc"],
  ["Fraud Cases", "/admin/fraud"],
  ["Reconciliation", "/admin/reconciliation"],
  ["Audit Logs", "/admin/audit"],
  ["Customer App", "/dashboard"]
] as const;

export function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="shell">
      <aside className="sidebar" aria-label="Admin navigation">
        <div className="brand">
          <div className="brand-mark" aria-hidden>AD</div>
          <div>
            <div className="brand-name">Ops Console</div>
            <div className="mobile-menu-note">MFA required</div>
          </div>
        </div>
        <nav className="nav-section">
          <div className="nav-section-title">Admin</div>
          {adminLinks.map(([label, href]) => (
            <Link key={href} href={href} className="nav-link">
              <span>{label}</span><span aria-hidden>›</span>
            </Link>
          ))}
        </nav>
      </aside>
      <main className="main" id="main-content">{children}</main>
    </div>
  );
}
