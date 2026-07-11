"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Input";

export function RegisterForm() {
  const [loading, setLoading] = useState(false);
  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    window.setTimeout(() => {
      window.location.href = "/kyc";
    }, 350);
  }
  return (
    <form className="form" onSubmit={onSubmit}>
      <Field label="Full name"><Input name="fullName" autoComplete="name" required /></Field>
      <Field label="Email"><Input name="email" type="email" autoComplete="email" required /></Field>
      <Field label="Phone"><Input name="phone" type="tel" autoComplete="tel" required /></Field>
      <Field label="Password" help="Use at least 10 characters. Do not reuse your email password."><Input name="password" type="password" autoComplete="new-password" minLength={10} required /></Field>
      <Button fullWidth disabled={loading}>{loading ? "Creating account..." : "Create secure account"}</Button>
      <p className="help">Already registered? <Link href="/login">Sign in</Link></p>
    </form>
  );
}
