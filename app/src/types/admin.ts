export type AdminMetric = {
  label: string;
  value: string;
  change: string;
  tone: "neutral" | "good" | "warn" | "danger";
};

export type FraudCase = {
  id: string;
  user: string;
  reason: string;
  riskScore: number;
  status: "open" | "reviewing" | "resolved" | "blocked";
  createdAt: string;
};

export type AuditLog = {
  id: string;
  actor: string;
  action: string;
  entity: string;
  severity: "low" | "medium" | "high" | "critical";
  createdAt: string;
};

export type ReconciliationItem = {
  id: string;
  providerReference: string;
  internalReference: string;
  amount: number;
  status: "matched" | "missing_provider" | "missing_internal" | "amount_mismatch" | "duplicate";
};
