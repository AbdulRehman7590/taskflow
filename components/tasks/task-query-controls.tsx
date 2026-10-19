"use client";

import { CalendarDays, LayoutGrid, List, Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { TASK_PAGE_SIZES } from "@/lib/validations";
import type { Status, TaskListQuery, TeamUser } from "@/types";

const SELECT_CLASS =
  "h-11 min-w-0 rounded-xl border border-white/10 bg-slate-950 px-3 text-sm text-slate-200";

export function TaskQueryControls({
  query,
  search,
  isPending,
  onSearchChange,
  onQueryChange,
  statuses,
  users,
  currentUserId,
}: {
  query: TaskListQuery;
  search: string;
  isPending: boolean;
  onSearchChange: (value: string) => void;
  onQueryChange: (
    changes: Partial<Record<keyof TaskListQuery, string | number>>,
  ) => void;
  statuses: Status[];
  users: TeamUser[];
  currentUserId: number;
}) {
  const filtered = Boolean(
    query.q ||
    query.priority !== "ALL" ||
    query.status !== "ALL" ||
    query.assignee !== "ALL" ||
    query.due !== "ALL" ||
    query.deadline,
  );
  return (
    <section
      className="mt-5 space-y-3 rounded-2xl border border-white/10 bg-black/25 p-4"
      aria-label="Task filters"
      aria-busy={isPending}
    >
      <div className="flex flex-wrap gap-3">
        <label className="relative min-w-48 flex-1">
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
        <div
          className="flex rounded-xl border border-white/10 bg-black/20 p-1"
          aria-label="Task view"
        >
          {[
            { value: "board", label: "Board", icon: LayoutGrid },
            { value: "table", label: "Table", icon: List },
          ].map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              type="button"
              onClick={() => onQueryChange({ view: value })}
              aria-pressed={query.view === value}
              className={cn(
                "inline-flex items-center gap-2 rounded-lg px-3 text-sm font-semibold",
                query.view === value
                  ? "bg-sky-400 text-slate-950"
                  : "text-slate-400 hover:text-white",
              )}
            >
              <Icon className="size-4" aria-hidden="true" /> {label}
            </button>
          ))}
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
        <select
          value={query.status}
          onChange={(event) => onQueryChange({ status: event.target.value })}
          aria-label="Filter by status"
          className={SELECT_CLASS}
        >
          <option value="ALL">All statuses</option>
          {statuses.map((status) => (
            <option key={status.key} value={status.key}>
              {status.name}
            </option>
          ))}
        </select>
        <select
          value={query.priority}
          onChange={(event) => onQueryChange({ priority: event.target.value })}
          aria-label="Filter by priority"
          className={SELECT_CLASS}
        >
          <option value="ALL">All priorities</option>
          <option value="high">High priority</option>
          <option value="medium">Medium priority</option>
          <option value="low">Low priority</option>
        </select>
        <select
          value={query.assignee}
          onChange={(event) => onQueryChange({ assignee: event.target.value })}
          aria-label="Filter by assignee"
          className={SELECT_CLASS}
        >
          <option value="ALL">Everyone</option>
          <option value="ME">Assigned to me</option>
          <option value="UNASSIGNED">Unassigned</option>
          {users
            .filter((user) => user.id !== currentUserId)
            .map((user) => (
              <option key={user.id} value={user.id}>
                {user.name}
              </option>
            ))}
        </select>
        <select
          value={query.due}
          onChange={(event) =>
            onQueryChange({ due: event.target.value, deadline: "" })
          }
          aria-label="Filter by due date"
          className={SELECT_CLASS}
        >
          <option value="ALL">Any due date</option>
          <option value="overdue">Overdue</option>
          <option value="today">Due today</option>
          <option value="week">Due in next 7 days</option>
          <option value="none">No deadline</option>
        </select>
        <label className="relative">
          <span className="sr-only">Exact deadline date</span>
          <CalendarDays
            aria-hidden="true"
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-500"
          />
          <Input
            type="date"
            value={query.deadline}
            onChange={(event) =>
              onQueryChange({ deadline: event.target.value, due: "ALL" })
            }
            title="Exact deadline date (UTC)"
            className="h-11 border-white/10 bg-slate-950 pl-9"
          />
        </label>
        <select
          value={query.sort}
          onChange={(event) => onQueryChange({ sort: event.target.value })}
          aria-label="Sort tasks by"
          className={SELECT_CLASS}
        >
          <option value="position">Manual order</option>
          <option value="createdAt">Newest first</option>
          <option value="updatedAt">Recently updated</option>
          <option value="priority">Highest priority</option>
          <option value="deadline">Earliest deadline</option>
        </select>
      </div>
      {(filtered || query.view === "table") && (
        <div className="flex items-center justify-between gap-3">
          {filtered ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                onSearchChange("");
                onQueryChange({
                  q: "",
                  priority: "ALL",
                  status: "ALL",
                  assignee: "ALL",
                  due: "ALL",
                  deadline: "",
                });
              }}
              className="text-slate-400"
            >
              <X className="size-4" /> Clear filters
            </Button>
          ) : (
            <span />
          )}
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
        </div>
      )}
    </section>
  );
}
