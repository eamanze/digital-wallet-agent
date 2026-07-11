import { Input } from "./Input";
import type { InputHTMLAttributes } from "react";

export function MoneyInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return <Input inputMode="decimal" min="1" step="0.01" placeholder="0.00" {...props} />;
}
