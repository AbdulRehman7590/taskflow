import { Activity, CheckCircle2, Flame, ListTodo } from "lucide-react";
import { StatCard } from "@/components/dashboard/stat-card";
import { Card, CardContent } from "@/components/ui/card";
import { StatusDistributionChart } from "./status-distribution-chart";
import type { Status, TaskStats } from "@/types";

export function TaskStatistics({
  stats,
  statuses,
  isAdmin,
  activeHighPriorityCount,
}: {
  stats: TaskStats;
  statuses: Status[];
  isAdmin: boolean;
  activeHighPriorityCount: number;
}) {
  const chartData = statuses.map((status) => ({
    name: status.name,
    count: stats.byStatus[status.key] ?? 0,
  }));
  const completed = stats.byStatus.COMPLETED ?? 0;

  if (!isAdmin) {
    return (
      <section className="mt-6 grid gap-3 sm:grid-cols-2">
        <StatCard
          label="Total tasks"
          value={stats.total}
          icon={<ListTodo size={18} />}
        />
        <StatCard
          label="Completed tasks"
          value={completed}
          accent="text-emerald-400"
          icon={<CheckCircle2 size={18} />}
        />
      </section>
    );
  }

  return (
    <section className="mt-6 grid gap-3 xl:grid-cols-[minmax(0,1fr)_minmax(20rem,0.85fr)]">
      <div className="grid gap-3 sm:grid-cols-2">
        <StatCard
          label="Matching tasks"
          value={stats.total}
          icon={<ListTodo size={18} />}
        />
        <StatCard
          label="Active statuses"
          value={statuses.length}
          accent="text-sky-400"
          icon={<Activity size={18} />}
        />
        <StatCard
          label="Completed tasks"
          value={completed}
          accent="text-emerald-400"
          icon={<CheckCircle2 size={18} />}
        />
        <StatCard
          label="Active high priority"
          value={activeHighPriorityCount}
          accent="text-rose-400"
          icon={<Flame size={18} />}
        />
      </div>
      <Card className="rounded-2xl border-white/10 bg-white/[0.045]">
        <CardContent className="p-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Status distribution
          </h2>
          <StatusDistributionChart data={chartData} />
        </CardContent>
      </Card>
    </section>
  );
}
