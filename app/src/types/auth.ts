export type User = {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  status: "pending" | "active" | "suspended" | "closed";
  kycTier: "tier_0" | "tier_1" | "tier_2" | "tier_3";
};
