"use client";

import { useState } from "react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select } from "@/components/ui/Input";
import { MoneyInput } from "@/components/ui/MoneyInput";
import { createIdempotencyKey } from "@/lib/api/client";

export function AirtimeForm() {
  const [prepared, setPrepared] = useState(false);
  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPrepared(true);
  }
  return (
    <form className="form" onSubmit={onSubmit}>
      {prepared ? <Alert tone="success">Airtime request prepared with key <strong>{createIdempotencyKey("airtime")}</strong>.</Alert> : null}
      <Field label="Network"><Select name="network" required><option value="mtn">MTN</option><option value="airtel">Airtel</option><option value="glo">Glo</option><option value="9mobile">9mobile</option></Select></Field>
      <Field label="Phone number"><Input name="phone" type="tel" required /></Field>
      <Field label="Amount"><MoneyInput name="amount" required /></Field>
      <Field label="Transaction PIN"><Input name="transactionPin" type="password" inputMode="numeric" autoComplete="off" required /></Field>
      <Button>Review airtime purchase</Button>
    </form>
  );
}
