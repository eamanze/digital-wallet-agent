export const APP_ROUTES = {
  login: "/login",
  register: "/register",
  dashboard: "/dashboard",
  send: "/send",
  fund: "/fund",
  withdraw: "/withdraw",
  bills: "/bills",
  airtime: "/airtime",
  transactions: "/transactions",
  kyc: "/kyc",
  security: "/security",
  notifications: "/notifications",
  admin: "/admin"
} as const;

export const MONEY_OPERATION_IDEMPOTENCY_HEADER = "Idempotency-Key";
