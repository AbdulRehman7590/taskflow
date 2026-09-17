import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function orderStatuses<T extends { position: number; id: number }>(
  statuses: T[],
) {
  return [...statuses].sort(
    (left, right) => left.position - right.position || left.id - right.id,
  );
}

export function priorityClass(priority: "low" | "medium" | "high") {
  return {
    high: "border-rose-400/30 bg-rose-500/10 text-rose-300",
    medium: "border-amber-400/30 bg-amber-500/10 text-amber-300",
    low: "border-emerald-400/30 bg-emerald-500/10 text-emerald-300",
  }[priority];
}
