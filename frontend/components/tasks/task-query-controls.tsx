"use client";

import { CalendarDays, LayoutGrid, List, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { TASK_PAGE_SIZES } from "@/lib/validations";
import type { TaskListQuery, TaskListView } from "@/types";

const SELECT_CLASS =
  "h-11 rounded-xl border border-white/10 bg-slate-950 px-3 text-sm text-slate-200";

const VIEWS: { value: TaskListView; label: string; icon: typeof LayoutGrid }[] =
  [
    { value: "board", label: "Board", icon: LayoutGrid },
    { value: "table", label: "Table", icon: List },
  ];

export function TaskQueryControls({
  query,
  search,
  isPending,
  onSearchChange,
  onQueryChange,
}: {
  query: TaskListQuery;
  search: string;
  isPending: boolean;
  onSearchChange: (value: string) => void;
  onQueryChange: (
    changes: Partial<Record<keyof TaskListQuery, string | number>>,
  ) => void;
}) {
  return (
    <section className="mt-5 grid gap-3 rounded-2xl border border-white/10 bg-black/25 p-4 lg:grid-cols-[minmax(14rem,1fr)_repeat(4,auto)]">
      <label className="relative">
        <span className="sr-only">Search tasks</span>
        <Search
          aria-hidden="true"
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-500"
        />
        <Input
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search title or description"
          maxLength={100}
          className="h-11 border-white/10 bg-white/5 pl-9"
        />
      </label>

      <select
        value={query.priority}
        onChange={(event) => onQueryChange({ priority: event.target.value })}
        aria-label="Pin priority to top"
        className={SELECT_CLASS}
      >
        <option value="ALL">Default priority order</option>
        <option value="high">High priority first</option>
        <option value="medium">Medium priority first</option>
        <option value="low">Low priority first</option>
      </select>

      <select
        value={query.sort}
        onChange={(event) => onQueryChange({ sort: event.target.value })}
        aria-label="Sort tasks by"
        className={SELECT_CLASS}
      >
        <option value="position">Manual order</option>
        <option value="createdAt">Created</option>
        <option value="updatedAt">Updated</option>
        <option value="priority">Priority</option>
        <option value="deadline">Deadline</option>
      </select>

      <label className="relative">
        <span className="sr-only">Filter by deadline date</span>
        <CalendarDays
          aria-hidden="true"
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-500"
        />
        <Input
          type="date"
          value={query.deadline}
          onChange={(event) => onQueryChange({ deadline: event.target.value })}
          title="Filter by deadline date"
          className="h-11 w-auto border-white/10 bg-slate-950 pl-9"
        />
      </label>

      {query.view === "table" && (
        <select
          value={query.pageSize}
          onChange={(event) =>
            onQueryChange({ pageSize: Number(event.target.value) })
          }
          aria-label="Tasks per page"
          className={SELECT_CLASS}
        >
          {TASK_PAGE_SIZES.map((size) => (
            <option key={size} value={size}>
              {size} per page
            </option>
          ))}
        </select>
      )}

      <div
        className="flex rounded-xl border border-white/10 bg-black/20 p-1"
        aria-busy={isPending}
      >
        {VIEWS.map(({ value, label, icon: Icon }) => (
          <button
            key={value}
            type="button"
            onClick={() => onQueryChange({ view: value })}
            aria-pressed={query.view === value}
            className={cn(
              "inline-flex flex-1 items-center justify-center gap-2 rounded-lg px-3 text-sm font-semibold transition",
              query.view === value
                ? "bg-sky-400 text-slate-950"
                : "text-slate-400 hover:text-white",
            )}
          >
            <Icon className="size-4" aria-hidden="true" /> {label}
          </button>
        ))}
      </div>
    </section>
  );
}
