import { apiFetch } from "@/lib/api/client";
import { env } from "@/lib/env";
import { adminMetrics, auditLogs, currentUser, fraudCases, reconciliationItems, transactions, wallet } from "@/lib/mock-data";
import type { AdminMetric, AuditLog, FraudCase, ReconciliationItem } from "@/types/admin";
import type { User } from "@/types/auth";
import type { Transaction } from "@/types/transaction";
import type { Wallet } from "@/types/wallet";

function fromMock<T>(value: T): Promise<T> {
  return Promise.resolve(value);
}

export async function getCurrentUser(): Promise<User> {
  return env.enableMocks ? fromMock(currentUser) : apiFetch<User>("/users/me");
}

export async function getWallet(): Promise<Wallet> {
  return env.enableMocks ? fromMock(wallet) : apiFetch<Wallet>("/wallets/me");
}

export async function getTransactions(): Promise<Transaction[]> {
  return env.enableMocks ? fromMock(transactions) : apiFetch<Transaction[]>("/transactions");
}

export async function getAdminMetrics(): Promise<AdminMetric[]> {
  return env.enableMocks ? fromMock(adminMetrics) : apiFetch<AdminMetric[]>("/admin/metrics");
}

export async function getFraudCases(): Promise<FraudCase[]> {
  return env.enableMocks ? fromMock(fraudCases) : apiFetch<FraudCase[]>("/admin/fraud/cases");
}

export async function getReconciliationItems(): Promise<ReconciliationItem[]> {
  return env.enableMocks ? fromMock(reconciliationItems) : apiFetch<ReconciliationItem[]>("/admin/reconciliation/items");
}

export async function getAuditLogs(): Promise<AuditLog[]> {
  return env.enableMocks ? fromMock(auditLogs) : apiFetch<AuditLog[]>("/admin/audit/logs");
}
