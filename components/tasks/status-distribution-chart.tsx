export function StatusDistributionChart({
  data,
}: {
  data: { name: string; count: number }[];
}) {
  const total = data.reduce((sum, item) => sum + item.count, 0);
  if (!total)
    return (
      <p className="grid h-48 place-items-center text-sm text-slate-500">
        No task data yet
      </p>
    );
  return (
    <ul className="mt-5 space-y-4" aria-label="Task count by status">
      {data.map((item) => (
        <li key={item.name}>
          <div className="mb-2 flex justify-between gap-4 text-sm">
            <span className="truncate text-slate-300">{item.name}</span>
            <span className="font-semibold tabular-nums text-sky-300">
              {item.count}
            </span>
          </div>
          <div
            className="h-2 overflow-hidden rounded-full bg-white/5"
            aria-hidden="true"
          >
            <div
              className="h-full rounded-full bg-sky-400"
              style={{ width: `${(item.count / total) * 100}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
