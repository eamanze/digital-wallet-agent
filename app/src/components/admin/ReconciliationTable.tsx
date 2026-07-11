import { Badge } from "@/components/ui/Badge";
import { DataTable } from "@/components/ui/DataTable";
import { formatMoney, titleCase } from "@/lib/formatters";
import type { ReconciliationItem } from "@/types/admin";

function tone(status: ReconciliationItem["status"]) {
  return status === "matched" ? "good" : status === "amount_mismatch" ? "warn" : "danger";
}

export function ReconciliationTable({ items }: { items: ReconciliationItem[] }) {
  return (
    <DataTable
      rows={items}
      getRowId={(row) => row.id}
      columns={[
        { key: "provider", header: "Provider ref", render: (row) => row.providerReference },
        { key: "internal", header: "Internal ref", render: (row) => row.internalReference },
        { key: "amount", header: "Amount", render: (row) => formatMoney(row.amount) },
        { key: "status", header: "Status", render: (row) => <Badge tone={tone(row.status)}>{titleCase(row.status)}</Badge> }
      ]}
    />
  );
}
