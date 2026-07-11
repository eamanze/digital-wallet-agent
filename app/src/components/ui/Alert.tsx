export function Alert({ children, tone = "warning" }: { children: React.ReactNode; tone?: "warning" | "danger" | "success" }) {
  return <div className={`alert alert-${tone}`}>{children}</div>;
}
