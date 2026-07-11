import Link from "next/link";
import { env } from "@/lib/env";
import { LogoutButton } from "@/components/auth/LogoutButton";

const walletLinks = [
  ["Dashboard", "/dashboard"],
  ["Send money", "/send"],
  ["Fund wallet", "/fund"],
  ["Withdraw", "/withdraw"],
  ["Pay bills", "/bills"],
  ["Buy airtime", "/airtime"],
  ["Transactions", "/transactions"],
  ["KYC", "/kyc"],
  ["Security", "/security"],
  ["Notifications", "/notifications"]
] as const;

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="shell">
      <aside className="sidebar" aria-label="Customer navigation">
        <div className="brand">
          <div className="brand-mark" aria-hidden>MW</div>
          <div>
            <div className="brand-name">{env.appName}</div>
            <div className="mobile-menu-note">Secure mobile money</div>
          </div>
        </div>
        <nav className="nav-section">
          <div className="nav-section-title">Wallet</div>
          {walletLinks.map(([label, href]) => (
            <Link key={href} href={href} className="nav-link">
              <span>{label}</span><span aria-hidden>›</span>
            </Link>
          ))}
        </nav>
        <nav className="nav-section">
          <div className="nav-section-title">Operations</div>
          <Link href="/admin" className="nav-link"><span>Admin console</span><span aria-hidden>↗</span></Link>
          <LogoutButton />
        </nav>
      </aside>
      <main className="main" id="main-content">{children}</main>
    </div>
  );
}
