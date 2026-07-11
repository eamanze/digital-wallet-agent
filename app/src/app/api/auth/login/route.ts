import { NextResponse } from "next/server";
import { serverEnv } from "@/lib/env";
import { ACCESS_COOKIE, MFA_COOKIE, REFRESH_COOKIE } from "@/lib/auth/session";

function cookieOptions(maxAge: number) {
  return { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax" as const, path: "/", maxAge };
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: { code: "INVALID_JSON", message: "Invalid login request" } }, { status: 400 });
  const response = await fetch(`${serverEnv.gatewayUrl.replace(/\/$/, "")}/api/v1/auth/login`, {
    method: "POST", headers: { "Content-Type": "application/json", "X-Correlation-ID": request.headers.get("X-Correlation-ID") || crypto.randomUUID() }, body: JSON.stringify(body), cache: "no-store"
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const result = NextResponse.json(payload, { status: response.status });
    if (response.status === 202) result.cookies.set(MFA_COOKIE, "1", cookieOptions(300));
    return result;
  }
  const data = payload.data || payload;
  if (!data.access_token || !data.refresh_token) return NextResponse.json({ error: { code: "INVALID_AUTH_RESPONSE", message: "Authentication service returned an invalid response" } }, { status: 502 });
  const result = NextResponse.json({ data: { status: "authenticated", expires_in: data.expires_in } }, { status: response.status });
  result.cookies.set(ACCESS_COOKIE, data.access_token, cookieOptions(Number(data.expires_in || 900)));
  result.cookies.set(REFRESH_COOKIE, data.refresh_token, cookieOptions(60 * 60 * 24 * 30));
  result.cookies.delete(MFA_COOKIE);
  return result;
}
