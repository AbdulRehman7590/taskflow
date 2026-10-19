import {
  CalendarDays,
  CheckCircle2,
  ClockAlert,
  Flame,
  ListTodo,
} from "lucide-react";
import { StatCard } from "@/components/dashboard/stat-card";
import { Card, CardContent } from "@/components/ui/card";
import { StatusDistributionChart } from "./status-distribution-chart";
import type { Status, TaskStats } from "@/types";

export function TaskStatistics({
  stats,
  statuses,
}: {
  stats: TaskStats;
  statuses: Status[];
}) {
  const completed = stats.byStatus.COMPLETED ?? 0;
  return (
    <section
      className="mt-6 grid gap-3 xl:grid-cols-[minmax(0,1fr)_minmax(18rem,0.7fr)]"
      aria-label="Statistics for matching tasks"
    >
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-2">
        <StatCard
          label="Matching tasks"
          value={stats.total}
          icon={<ListTodo size={18} />}
        />
        <StatCard
          label="Completion rate"
          value={`${stats.total ? Math.round((completed / stats.total) * 100) : 0}%`}
          accent="text-emerald-400"
          icon={<CheckCircle2 size={18} />}
        />
        <StatCard
          label="Overdue"
          value={stats.overdue}
          accent="text-rose-300"
          icon={<ClockAlert size={18} />}
        />
        <StatCard
          label="Due today"
          value={stats.dueToday}
          accent="text-amber-300"
          icon={<CalendarDays size={18} />}
        />
        <StatCard
          label="High priority open"
          value={stats.highPriority}
          accent="text-orange-300"
          icon={<Flame size={18} />}
        />
        <StatCard
          label="Completed tasks"
          value={completed}
          accent="text-emerald-300"
          icon={<CheckCircle2 size={18} />}
        />
      </div>
      <Card className="rounded-2xl border-white/10 bg-white/[0.045]">
        <CardContent className="p-5">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Status distribution
          </h2>
          <StatusDistributionChart
            data={statuses.map((status) => ({
              name: status.name,
              count: stats.byStatus[status.key] ?? 0,
            }))}
          />
        </CardContent>
      </Card>
    </section>
  );
}
