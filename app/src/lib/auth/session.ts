import { cookies } from "next/headers";
import { serverEnv } from "@/lib/env";

export type SessionStatus = "authenticated" | "anonymous" | "mfa_required";

export const ACCESS_COOKIE = "dw_access_token";
export const REFRESH_COOKIE = "dw_refresh_token";
export const MFA_COOKIE = "dw_mfa_pending";

export function classifySession(status: number, mfaPending = false): SessionStatus {
  if (mfaPending) return "mfa_required";
  return status === 200 ? "authenticated" : "anonymous";
}

export async function getSessionStatus(requireAdmin = false): Promise<SessionStatus> {
  const jar = await cookies();
  if (jar.get(MFA_COOKIE)?.value === "1") return "mfa_required";
  const access = jar.get(ACCESS_COOKIE)?.value;
  if (!access) return "anonymous";
  try {
    const endpoint = requireAdmin ? `${serverEnv.adminApiUrl}/admin/users` : `${serverEnv.gatewayUrl.replace(/\/$/, "")}/api/v1/users/me`;
    const response = await fetch(endpoint, { headers: { Authorization: `Bearer ${access}` }, cache: "no-store" });
    return classifySession(response.status);
  } catch {
    return "anonymous";
  }
}
