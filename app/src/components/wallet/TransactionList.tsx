import { Badge } from "@/components/ui/Badge";
import { DataTable } from "@/components/ui/DataTable";
import { formatDateTime, formatMoney, titleCase } from "@/lib/formatters";
import type { Transaction } from "@/types/transaction";

function statusTone(status: Transaction["status"]) {
  if (status === "successful") return "good";
  if (status === "failed" || status === "reversed") return "danger";
  if (status === "under_review" || status.startsWith("pending")) return "warn";
  return "neutral";
}

export function TransactionList({ transactions }: { transactions: Transaction[] }) {
  return (
    <DataTable
      rows={transactions}
      getRowId={(row) => row.id}
      columns={[
        { key: "reference", header: "Reference", render: (row) => <strong>{row.reference}</strong> },
        { key: "type", header: "Type", render: (row) => titleCase(row.type) },
        { key: "counterparty", header: "Counterparty", render: (row) => row.counterparty },
        { key: "amount", header: "Amount", render: (row) => formatMoney(row.amount, row.currency) },
        { key: "fee", header: "Fee", render: (row) => formatMoney(row.fee, row.currency) },
        { key: "status", header: "Status", render: (row) => <Badge tone={statusTone(row.status)}>{titleCase(row.status)}</Badge> },
        { key: "date", header: "Date", render: (row) => formatDateTime(row.createdAt) }
      ]}
    />
  );
}
