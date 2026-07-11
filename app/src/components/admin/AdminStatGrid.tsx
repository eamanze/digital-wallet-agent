import { Badge } from "@/components/ui/Badge";
import type { AdminMetric } from "@/types/admin";

export function AdminStatGrid({ metrics }: { metrics: AdminMetric[] }) {
  return (
    <section className="grid grid-4">
      {metrics.map((metric) => (
        <div className="card" key={metric.label}>
          <p className="card-meta">{metric.label}</p>
          <div className="stat-value">{metric.value}</div>
          <Badge tone={metric.tone}>{metric.change}</Badge>
        </div>
      ))}
    </section>
  );
}
