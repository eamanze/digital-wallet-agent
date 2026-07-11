"use client";

import { useState } from "react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Field, Input, Textarea } from "@/components/ui/Input";
import { MoneyInput } from "@/components/ui/MoneyInput";
import { createIdempotencyKey } from "@/lib/api/client";

export function TransferForm() {
  const [submitted, setSubmitted] = useState(false);
  const [idempotencyKey, setIdempotencyKey] = useState("");

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIdempotencyKey(createIdempotencyKey("transfer"));
    setSubmitted(true);
  }

  return (
    <form className="form" onSubmit={onSubmit}>
      {submitted ? <Alert tone="success">Transfer request prepared with idempotency key <strong>{idempotencyKey}</strong>. Connect this form to the transaction-service/BFF to execute.</Alert> : null}
      <Field label="Recipient phone, wallet tag or account"><Input name="recipient" required placeholder="+234... or @wallettag" /></Field>
      <Field label="Amount"><MoneyInput name="amount" required /></Field>
      <Field label="Narration"><Textarea name="narration" maxLength={120} placeholder="Optional note" /></Field>
      <Field label="Transaction PIN" help="PIN is required by the backend for money movement and must never be logged."><Input name="transactionPin" type="password" inputMode="numeric" autoComplete="off" required minLength={4} maxLength={6} /></Field>
      <Button>Review and send</Button>
    </form>
  );
}
