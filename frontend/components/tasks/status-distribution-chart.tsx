"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export type StatusChartDatum = {
  name: string;
  count: number;
};

export function StatusDistributionChart({
  data,
}: {
  data: StatusChartDatum[];
}) {
  if (!data.some((item) => item.count > 0)) {
    return (
      <div className="grid h-56 place-items-center text-sm text-slate-500">
        No task data yet
      </div>
    );
  }

  return (
    <div className="h-56 w-full" role="img" aria-label="Task count by status">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 8, right: 4, left: -22, bottom: 0 }}
        >
          <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
          <XAxis
            dataKey="name"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#94a3b8", fontSize: 11 }}
          />
          <YAxis
            allowDecimals={false}
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#64748b", fontSize: 11 }}
          />
          <Tooltip
            cursor={{ fill: "rgba(255,255,255,0.04)" }}
            contentStyle={{
              background: "#09090b",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: "0.75rem",
            }}
          />
          <Bar dataKey="count" fill="#38bdf8" radius={[7, 7, 2, 2]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
