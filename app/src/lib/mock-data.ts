import type { AdminMetric, AuditLog, FraudCase, ReconciliationItem } from "@/types/admin";
import type { User } from "@/types/auth";
import type { Transaction } from "@/types/transaction";
import type { Wallet } from "@/types/wallet";

export const currentUser: User = {
  id: "usr_001",
  fullName: "Ada Johnson",
  email: "ada@example.com",
  phone: "+2348012345678",
  status: "active",
  kycTier: "tier_2"
};

export const wallet: Wallet = {
  id: "wal_001",
  userId: currentUser.id,
  currency: "NGN",
  ledgerAccountId: "led_acc_001",
  availableBalance: 785_450_00,
  bookBalance: 785_450_00,
  status: "active",
  kycTier: "tier_2"
};

export const transactions: Transaction[] = [
  {
    id: "txn_001",
    reference: "MM-2026-000001",
    type: "transfer",
    status: "successful",
    amount: 50_000_00,
    fee: 50_00,
    currency: "NGN",
    counterparty: "Tunde Balogun",
    description: "Wallet transfer",
    createdAt: "2026-07-09T13:22:00.000Z"
  },
  {
    id: "txn_002",
    reference: "MM-2026-000002",
    type: "funding",
    status: "successful",
    amount: 250_000_00,
    fee: 0,
    currency: "NGN",
    counterparty: "Bank Transfer Provider",
    description: "Wallet funding",
    createdAt: "2026-07-08T08:10:00.000Z"
  },
  {
    id: "txn_003",
    reference: "MM-2026-000003",
    type: "bill_payment",
    status: "pending_provider",
    amount: 18_500_00,
    fee: 100_00,
    currency: "NGN",
    counterparty: "Electricity Biller",
    description: "Electricity bill payment",
    createdAt: "2026-07-07T19:42:00.000Z"
  },
  {
    id: "txn_004",
    reference: "MM-2026-000004",
    type: "airtime",
    status: "failed",
    amount: 5_000_00,
    fee: 0,
    currency: "NGN",
    counterparty: "MTN Airtime",
    description: "Airtime purchase failed at provider",
    createdAt: "2026-07-06T12:05:00.000Z"
  }
];

export const adminMetrics: AdminMetric[] = [
  { label: "Transaction volume", value: "₦148.2M", change: "+12.4% today", tone: "good" },
  { label: "Pending provider txns", value: "38", change: "needs review", tone: "warn" },
  { label: "Fraud cases", value: "14", change: "+3 high risk", tone: "danger" },
  { label: "Reconciliation match", value: "99.13%", change: "above target", tone: "good" }
];

export const fraudCases: FraudCase[] = [
  { id: "frd_001", user: "Ada Johnson", reason: "New device high-value transfer", riskScore: 86, status: "reviewing", createdAt: "2026-07-10T08:15:00.000Z" },
  { id: "frd_002", user: "Musa Bello", reason: "Rapid funding then withdrawal", riskScore: 91, status: "open", createdAt: "2026-07-10T09:02:00.000Z" },
  { id: "frd_003", user: "Chika Okoro", reason: "Multiple failed PIN attempts", riskScore: 72, status: "blocked", createdAt: "2026-07-09T21:31:00.000Z" }
];

export const reconciliationItems: ReconciliationItem[] = [
  { id: "rec_001", providerReference: "PRV-001", internalReference: "MM-2026-000001", amount: 50_050_00, status: "matched" },
  { id: "rec_002", providerReference: "PRV-002", internalReference: "MM-2026-000003", amount: 18_600_00, status: "amount_mismatch" },
  { id: "rec_003", providerReference: "PRV-003", internalReference: "-", amount: 7_000_00, status: "missing_internal" }
];

export const auditLogs: AuditLog[] = [
  { id: "aud_001", actor: "finance.ops@example.com", action: "APPROVED_REVERSAL", entity: "MM-2026-000004", severity: "high", createdAt: "2026-07-10T10:30:00.000Z" },
  { id: "aud_002", actor: "fraud.analyst@example.com", action: "BLOCKED_TRANSACTION", entity: "MM-2026-000118", severity: "critical", createdAt: "2026-07-10T09:55:00.000Z" },
  { id: "aud_003", actor: "compliance@example.com", action: "APPROVED_KYC", entity: "usr_001", severity: "medium", createdAt: "2026-07-09T16:44:00.000Z" }
];
