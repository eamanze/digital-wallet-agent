"use client";

import { useState } from "react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select } from "@/components/ui/Input";
import { MoneyInput } from "@/components/ui/MoneyInput";
import { createIdempotencyKey } from "@/lib/api/client";

export function WithdrawForm() {
  const [prepared, setPrepared] = useState(false);
  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPrepared(true);
  }
  return (
    <form className="form" onSubmit={onSubmit}>
      {prepared ? <Alert tone="success">Withdrawal request prepared with key <strong>{createIdempotencyKey("withdrawal")}</strong>. Backend must verify bank account and post ledger entries.</Alert> : null}
      <Field label="Bank"><Select name="bankCode" required><option value="044">Access Bank</option><option value="058">GTBank</option><option value="011">First Bank</option></Select></Field>
      <Field label="Account number"><Input name="accountNumber" inputMode="numeric" minLength={10} maxLength={10} required /></Field>
      <Field label="Amount"><MoneyInput name="amount" required /></Field>
      <Field label="Transaction PIN"><Input name="transactionPin" type="password" inputMode="numeric" autoComplete="off" required /></Field>
      <Button>Review withdrawal</Button>
    </form>
  );
}
