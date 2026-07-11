"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Input";

export function LoginForm() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);
    const form = new FormData(event.currentTarget);
    const login = String(form.get("phoneOrEmail") || "");
    const response = await fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json", "X-Correlation-ID": crypto.randomUUID() }, credentials: "include", body: JSON.stringify({ login, password: form.get("password"), device: { device_fingerprint: crypto.randomUUID(), device_name: navigator.userAgent.slice(0, 80), platform: navigator.platform } }) }).catch(() => null);
    if (!response) { setError("Unable to reach the authentication service."); setLoading(false); return; }
    if (response.status === 202) { window.location.href = "/login?mfa=required"; return; }
    if (!response.ok) { setError("Sign-in failed. Check your details and try again."); setLoading(false); return; }
    const returnTo = new URLSearchParams(window.location.search).get("returnTo");
    window.location.href = returnTo?.startsWith("/") ? returnTo : "/dashboard";
  }

  return (
    <form className="form" onSubmit={onSubmit}>
      <Field label="Phone number or email">
        <Input name="phoneOrEmail" autoComplete="username" required placeholder="you@example.com" />
      </Field>
      <Field label="Password">
        <Input name="password" type="password" autoComplete="current-password" required minLength={8} />
      </Field>
      <Button fullWidth disabled={loading}>{loading ? "Checking secure session..." : "Sign in"}</Button>
      {error ? <p className="error" role="alert">{error}</p> : null}
      <p className="help">New user? <Link href="/register">Create an account</Link></p>
    </form>
  );
}
