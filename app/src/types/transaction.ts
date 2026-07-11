import type { Currency } from "./wallet";

export type TransactionType = "funding" | "transfer" | "withdrawal" | "bill_payment" | "airtime" | "fee" | "reversal";
export type TransactionStatus = "initiated" | "pending_validation" | "pending_fraud_check" | "pending_provider" | "successful" | "failed" | "reversed" | "under_review";

export type Transaction = {
  id: string;
  reference: string;
  type: TransactionType;
  status: TransactionStatus;
  amount: number;
  fee: number;
  currency: Currency;
  counterparty: string;
  description: string;
  createdAt: string;
};

export type TransferQuote = {
  amount: number;
  fee: number;
  totalDebit: number;
  currency: Currency;
};
