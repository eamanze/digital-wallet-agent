import { RiskBadge } from "@/components/admin/RiskBadge";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { DataTable } from "@/components/ui/DataTable";
import { formatDateTime, titleCase } from "@/lib/formatters";
import { getFraudCases } from "@/lib/api/endpoints";

export default async function FraudPage() {
  const cases = await getFraudCases();
  return <><header className="topbar"><div><h1 className="page-title">Fraud cases</h1><p className="page-subtitle">Review high-risk activities without directly moving funds from this service.</p></div></header><Card title="Cases"><DataTable rows={cases} getRowId={(row) => row.id} columns={[{key:'user', header:'User', render:(row)=>row.user},{key:'reason', header:'Reason', render:(row)=>row.reason},{key:'risk', header:'Risk', render:(row)=><RiskBadge score={row.riskScore}/>},{key:'status', header:'Status', render:(row)=><Badge tone={row.status==='blocked'?'danger':'warn'}>{titleCase(row.status)}</Badge>},{key:'date', header:'Created', render:(row)=>formatDateTime(row.createdAt)}]} /></Card></>;
}
