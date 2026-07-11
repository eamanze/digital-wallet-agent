import { NextResponse, type NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  response.headers.set("X-Request-Path", request.nextUrl.pathname);
  const protectedPath = /^\/(dashboard|send|fund|withdraw|bills|airtime|transactions|kyc|security|notifications|admin)(\/|$)/.test(request.nextUrl.pathname);
  if (protectedPath && !request.cookies.has("dw_access_token") && !request.cookies.has("dw_mfa_pending")) {
    const login = new URL("/login", request.url);
    login.searchParams.set("returnTo", request.nextUrl.pathname);
    return NextResponse.redirect(login);
  }
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"]
};
