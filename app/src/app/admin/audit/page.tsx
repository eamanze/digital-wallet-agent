import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { DataTable } from "@/components/ui/DataTable";
import { formatDateTime, titleCase } from "@/lib/formatters";
import { getAuditLogs } from "@/lib/api/endpoints";

export default async function AuditPage() {
  const logs = await getAuditLogs();
  return <><header className="topbar"><div><h1 className="page-title">Audit logs</h1><p className="page-subtitle">Append-only evidence for admin, security, financial and compliance actions.</p></div></header><Card title="Audit events"><DataTable rows={logs} getRowId={(row) => row.id} columns={[{key:'actor', header:'Actor', render:(row)=>row.actor},{key:'action', header:'Action', render:(row)=>titleCase(row.action)},{key:'entity', header:'Entity', render:(row)=>row.entity},{key:'severity', header:'Severity', render:(row)=><Badge tone={row.severity==='critical'?'danger':row.severity==='high'?'warn':'neutral'}>{row.severity}</Badge>},{key:'date', header:'Date', render:(row)=>formatDateTime(row.createdAt)}]} /></Card></>;
}
