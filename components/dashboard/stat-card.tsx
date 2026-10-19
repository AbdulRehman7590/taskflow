import type { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";

export function StatCard({
  label,
  value,
  icon,
  accent = "text-white",
}: {
  label: string;
  value: ReactNode;
  icon?: ReactNode;
  accent?: string;
}) {
  return (
    <Card className="rounded-2xl border-white/10 bg-white/[0.045] shadow-lg shadow-black/10">
      <CardContent className="flex items-start justify-between p-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            {label}
          </p>
          <p className={`mt-1 text-3xl font-black ${accent}`}>{value}</p>
        </div>
        {icon && (
          <span className="grid size-9 place-items-center rounded-xl bg-white/5 text-slate-400">
            {icon}
          </span>
        )}
      </CardContent>
    </Card>
  );
}
