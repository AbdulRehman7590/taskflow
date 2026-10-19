/** Task deadlines are calendar dates, consistently evaluated in UTC. */
export function todayUtc(now = new Date()) {
  return now.toISOString().slice(0, 10);
}

export function isDateOnly(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(date.getTime()) && todayUtc(date) === value;
}

export function addUtcDays(date: string, days: number) {
  const start = new Date(`${date}T00:00:00.000Z`);
  return todayUtc(new Date(start.getTime() + days * 86400000));
}

export function isOverdue(
  task: { deadline: string | null; status: string },
  today = todayUtc(),
) {
  return Boolean(
    task.deadline &&
    task.deadline.slice(0, 10) < today &&
    task.status !== "COMPLETED",
  );
}
