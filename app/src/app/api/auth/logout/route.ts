import { NextResponse } from "next/server";
import { serverEnv } from "@/lib/env";
import { ACCESS_COOKIE, MFA_COOKIE, REFRESH_COOKIE } from "@/lib/auth/session";
import { cookies } from "next/headers";

export async function POST(request: Request) {
  const jar = await cookies();
  const access = jar.get(ACCESS_COOKIE)?.value;
  if (access) await fetch(`${serverEnv.gatewayUrl.replace(/\/$/, "")}/api/v1/auth/logout`, { method: "POST", headers: { Authorization: `Bearer ${access}`, "X-Correlation-ID": request.headers.get("X-Correlation-ID") || crypto.randomUUID() }, cache: "no-store" }).catch(() => undefined);
  const result = NextResponse.json({ data: { status: "anonymous" } });
  result.cookies.delete(ACCESS_COOKIE); result.cookies.delete(REFRESH_COOKIE); result.cookies.delete(MFA_COOKIE);
  return result;
}
