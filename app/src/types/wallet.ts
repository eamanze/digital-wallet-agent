export type Currency = "NGN";

export type Wallet = {
  id: string;
  userId: string;
  currency: Currency;
  ledgerAccountId: string;
  availableBalance: number;
  bookBalance: number;
  status: "active" | "frozen" | "closed";
  kycTier: "tier_0" | "tier_1" | "tier_2" | "tier_3";
};

export type Beneficiary = {
  id: string;
  name: string;
  walletTag: string;
  bankName?: string;
  accountNumber?: string;
};
