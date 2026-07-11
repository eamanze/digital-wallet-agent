"use client";

import { useState } from "react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select } from "@/components/ui/Input";

export function KycForm() {
  const [submitted, setSubmitted] = useState(false);
  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
  }
  return (
    <form className="form" onSubmit={onSubmit}>
      {submitted ? <Alert tone="success">KYC submission prepared. In production, files should upload to a pre-signed S3 URL and only the object reference should be stored.</Alert> : null}
      <Field label="Government ID type"><Select name="idType" required><option value="nin">NIN</option><option value="passport">Passport</option><option value="drivers_license">Driver&apos;s licence</option></Select></Field>
      <Field label="ID number"><Input name="idNumber" required /></Field>
      <Field label="Date of birth"><Input name="dateOfBirth" type="date" required /></Field>
      <Field label="Address"><Input name="address" required /></Field>
      <Field label="Document upload"><Input name="document" type="file" accept="image/*,.pdf" required /></Field>
      <Button>Submit KYC</Button>
    </form>
  );
}
