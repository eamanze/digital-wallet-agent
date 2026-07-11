import { AdminShell } from "@/components/layout/AdminShell";
import { getSessionStatus } from "@/lib/auth/session";
import { redirect } from "next/navigation";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const status = await getSessionStatus(true);
  if (status === "anonymous") redirect("/login?returnTo=/admin");
  if (status === "mfa_required") redirect("/login?mfa=required&returnTo=/admin");
  return <AdminShell>{children}</AdminShell>;
}
