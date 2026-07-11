"use client";

import { useState } from "react";

export function LogoutButton() {
  const [loading, setLoading] = useState(false);
  async function logout() {
    setLoading(true);
    await fetch("/api/auth/logout", { method: "POST", credentials: "include", headers: { "X-Correlation-ID": crypto.randomUUID() } }).catch(() => undefined);
    window.location.assign("/login");
  }
  return <button className="nav-link" type="button" onClick={logout} disabled={loading}>{loading ? "Signing out…" : "Sign out"}<span aria-hidden>⎋</span></button>;
}
