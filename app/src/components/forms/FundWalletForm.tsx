"use client";

import { useState } from "react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Field, Select } from "@/components/ui/Input";
import { MoneyInput } from "@/components/ui/MoneyInput";
import { createIdempotencyKey } from "@/lib/api/client";

export function FundWalletForm() {
  const [prepared, setPrepared] = useState(false);
  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPrepared(true);
  }
  return (
    <form className="form" onSubmit={onSubmit}>
      {prepared ? <Alert tone="success">Funding request prepared. Idempotency key: <strong>{createIdempotencyKey("fund")}</strong></Alert> : null}
      <Field label="Amount"><MoneyInput name="amount" required /></Field>
      <Field label="Funding method">
        <Select name="method" required>
          <option value="bank_transfer">Bank transfer</option>
          <option value="card">Card</option>
        </Select>
      </Field>
      <Button>Continue funding</Button>
    </form>
  );
}
