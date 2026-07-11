import { Badge } from "@/components/ui/Badge";

export function RiskBadge({ score }: { score: number }) {
  if (score >= 85) return <Badge tone="danger">Risk {score}</Badge>;
  if (score >= 65) return <Badge tone="warn">Risk {score}</Badge>;
  return <Badge tone="good">Risk {score}</Badge>;
}
