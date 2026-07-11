import Link from "next/link";

const actions = [
  ["Send money", "/send", "Wallet-to-wallet transfer with PIN and idempotency"],
  ["Withdraw", "/withdraw", "Move funds to a verified bank account"],
  ["Pay bills", "/bills", "Electricity, internet, TV and other billers"],
  ["Buy airtime", "/airtime", "MTN, Airtel, Glo and 9mobile"]
] as const;

export function QuickActions() {
  return (
    <section className="grid grid-4">
      {actions.map(([title, href, text]) => (
        <Link key={href} href={href} className="card">
          <h2 className="card-title">{title}</h2>
          <p className="card-meta">{text}</p>
        </Link>
      ))}
    </section>
  );
}
