import Link from "next/link";
import { formatMoney } from "@/lib/formatters";
import type { Wallet } from "@/types/wallet";
import { Badge } from "@/components/ui/Badge";

export function BalanceCard({ wallet }: { wallet: Wallet }) {
  return (
    <section className="card card-soft">
      <p className="card-meta">Available balance</p>
      <div className="stat-value">{formatMoney(wallet.availableBalance, wallet.currency)}</div>
      <p className="card-meta">Book balance: {formatMoney(wallet.bookBalance, wallet.currency)} · KYC {wallet.kycTier.replace("tier_", "Tier ")}</p>
      <div className="actions" style={{ marginTop: 18 }}>
        <Link className="btn btn-secondary" href="/fund">Fund wallet</Link>
        <Link className="btn btn-secondary" href="/send">Send money</Link>
        <Badge tone="good">{wallet.status}</Badge>
      </div>
    </section>
  );
}
