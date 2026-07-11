"use client";

import { useState } from "react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select } from "@/components/ui/Input";
import { MoneyInput } from "@/components/ui/MoneyInput";
import { createIdempotencyKey } from "@/lib/api/client";

export function BillsForm() {
  const [prepared, setPrepared] = useState(false);
  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPrepared(true);
  }
  return (
    <form className="form" onSubmit={onSubmit}>
      {prepared ? <Alert tone="success">Bill payment request prepared with key <strong>{createIdempotencyKey("bill")}</strong>.</Alert> : null}
      <Field label="Biller"><Select name="biller" required><option value="electricity">Electricity</option><option value="internet">Internet</option><option value="tv">TV subscription</option></Select></Field>
      <Field label="Customer reference"><Input name="customerReference" required placeholder="Meter, account or smartcard number" /></Field>
      <Field label="Amount"><MoneyInput name="amount" required /></Field>
      <Field label="Transaction PIN"><Input name="transactionPin" type="password" inputMode="numeric" autoComplete="off" required /></Field>
      <Button>Review bill payment</Button>
    </form>
  );
}
