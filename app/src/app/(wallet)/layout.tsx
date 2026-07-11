import { AppShell } from "@/components/layout/AppShell";
import { getSessionStatus } from "@/lib/auth/session";
import { redirect } from "next/navigation";

export default async function WalletLayout({ children }: { children: React.ReactNode }) {
  const status = await getSessionStatus();
  if (status === "anonymous") redirect("/login");
  if (status === "mfa_required") redirect("/login?mfa=required");
  return <AppShell>{children}</AppShell>;
}
