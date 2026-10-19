"use client";

import { useEffect, useRef, useState } from "react";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import {
  Download,
  ListTodo,
  Plus,
  RefreshCw,
  SlidersHorizontal,
} from "lucide-react";
import { taskApi } from "@/api";
import {
  feedbackAtom,
  statusDialogOpenAtom,
  taskDialogAtom,
  taskDetailAtom,
} from "@/atoms/task-atoms";
import { useUrlQuery } from "@/lib/use-url-query";
import { clientEnv } from "@/lib/client-env";
import { isManualBoardOrder } from "@/lib/validations";
import { Button } from "@/components/ui/button";
import { FeedbackAlert } from "@/components/ui/alert";
import { PaginationControls } from "@/components/dashboard/pagination-controls";
import { StatusManager } from "./status-manager";
import { TaskBoard } from "./task-board";
import { TaskDetail } from "./task-detail";
import { TaskForm } from "./task-form";
import { TaskQueryControls } from "./task-query-controls";
import { TaskStatistics } from "./task-statistics";
import { TaskTable } from "./task-table";
import type { Status, Task, TaskListQuery, TaskPage, TeamUser } from "@/types";

export function TaskManager({
  page,
  statuses,
  query,
  isAdmin,
  users,
  currentUserId,
}: {
  page: TaskPage;
  statuses: Status[];
  query: TaskListQuery;
  isAdmin: boolean;
  users: TeamUser[];
  currentUserId: number;
}) {
  const { isPending, navigate, refresh } = useUrlQuery("/", query);

  const [feedback, setFeedback] = useAtom(feedbackAtom);
  const [taskDialog, setTaskDialog] = useAtom(taskDialogAtom);
  const isStatusOpen = useAtomValue(statusDialogOpenAtom);
  const setStatusOpen = useSetAtom(statusDialogOpenAtom);
  const setTaskDetail = useSetAtom(taskDetailAtom);
  const mutationLock = useRef(false);
  const [isMutating, setMutating] = useState(false);
  const busy = isPending || isMutating;

  const [search, setSearch] = useState(query.q);
  const [dragOver, setDragOver] = useState<string | null>(null);
  const [dragged, setDragged] = useState<Task | null>(null);
  const canReorder = isAdmin && isManualBoardOrder(query) && !busy;
  const hasFilters = Boolean(
    query.q ||
    query.priority !== "ALL" ||
    query.status !== "ALL" ||
    query.assignee !== "ALL" ||
    query.due !== "ALL" ||
    query.deadline,
  );

  useEffect(() => {
    setTaskDetail((task) =>
      task ? (page.items.find((item) => item.id === task.id) ?? null) : null,
    );
  }, [page.items, setTaskDetail]);

  useEffect(() => setSearch(query.q), [query.q]);

  useEffect(() => {
    if (search === query.q) return;
    const timer = setTimeout(() => navigate({ q: search }), 350);
    return () => clearTimeout(timer);
  }, [search, query.q, navigate]);

  async function mutate(run: () => Promise<unknown>, message: string) {
    if (mutationLock.current) return;
    mutationLock.current = true;
    setMutating(true);
    setFeedback(null);
    try {
      await run();
      setFeedback({ tone: "success", message });
      refresh();
    } catch (error) {
      setFeedback({
        tone: "error",
        message:
          error instanceof Error ? error.message : "That action did not work.",
      });
    } finally {
      mutationLock.current = false;
      setMutating(false);
    }
  }

  function changeStatus(task: Task, status: string) {
    if (status === task.status || busy) return;
    void mutate(
      () => taskApi.changeStatus(task.id, status),
      `Moved "${task.title}".`,
    );
  }

  function moveTask(status: string, beforeTaskId?: number) {
    setDragOver(null);
    if (!dragged || busy || beforeTaskId === dragged.id) return;
    const task = dragged;
    setDragged(null);

    if (!canReorder) {
      if (task.status === status) return;
      void mutate(
        () => taskApi.changeStatus(task.id, status),
        `Moved "${task.title}".`,
      );
      return;
    }

    const targetIds = page.items
      .filter((item) => item.status === status && item.id !== task.id)
      .map((item) => item.id);
    const insertionIndex = beforeTaskId
      ? Math.max(0, targetIds.indexOf(beforeTaskId))
      : targetIds.length;
    targetIds.splice(insertionIndex, 0, task.id);

    void mutate(
      async () => {
        if (task.status !== status) {
          await taskApi.changeStatus(task.id, status);
        }
        await taskApi.reorderTasks(status, targetIds);
      },
      task.status === status
        ? `Reordered "${task.title}".`
        : `Moved "${task.title}".`,
    );
  }

  function deleteTask(task: Task) {
    if (!window.confirm(`Delete "${task.title}"?`)) return;
    void mutate(() => taskApi.remove(task.id), `Deleted "${task.title}".`);
  }

  function deleteAttachment(task: Task, attachmentId: number) {
    void mutate(
      () => taskApi.deleteAttachment(task.id, attachmentId),
      "Attachment deleted.",
    );
  }

  return (
    <div className="mx-auto w-full max-w-[100rem] px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-sky-400">
            Workspace
          </p>
          <h1 className="mt-2 text-4xl font-black tracking-tight sm:text-5xl">
            Tasks
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            {isAdmin
              ? "Create work, move it forward and attach the files that matter."
              : "Drag a task to another column to update where the work stands."}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="ghost"
            onClick={refresh}
            disabled={busy}
            className="gap-2 border border-white/10"
          >
            <RefreshCw
              className={isPending ? "size-4 animate-spin" : "size-4"}
            />
            {isPending ? "Refreshing" : "Refresh"}
          </Button>
          <Button
            asChild
            variant="ghost"
            className="gap-2 border border-white/10"
          >
            <a
              href={`${clientEnv.apiBaseUrl}/tasks/export?${new URLSearchParams(Object.entries(query).map(([key, value]) => [key, String(value)]))}`}
              download
            >
              <Download className="size-4" aria-hidden="true" /> Export CSV
            </a>
          </Button>
          {isAdmin && (
            <>
              <Button
                variant="ghost"
                onClick={() => setStatusOpen(true)}
                className="gap-2 border border-white/10"
              >
                <SlidersHorizontal className="size-4" /> Statuses
              </Button>
              <Button
                onClick={() => setTaskDialog({ open: true, task: null })}
                className="gap-2 bg-sky-400 font-bold text-slate-950 hover:bg-sky-300"
              >
                <Plus className="size-4" /> New task
              </Button>
            </>
          )}
        </div>
      </header>

      <FeedbackAlert
        feedback={feedback}
        className="mt-5"
        onDismiss={() => setFeedback(null)}
      />

      <TaskStatistics stats={page.stats} statuses={statuses} />

      <TaskQueryControls
        query={query}
        search={search}
        isPending={isPending}
        onSearchChange={setSearch}
        onQueryChange={navigate}
        statuses={statuses}
        users={users}
        currentUserId={currentUserId}
      />

      <p className="mt-4 text-sm text-slate-400" role="status">
        {page.total} matching {page.total === 1 ? "task" : "tasks"}
        {busy ? " · Updating…" : ""}
      </p>

      {page.total === 0 && !hasFilters && (
        <section className="mt-5 rounded-3xl border border-dashed border-white/10 bg-black/15 px-6 py-12 text-center">
          <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-sky-400/10 text-sky-300">
            <ListTodo className="size-5" aria-hidden="true" />
          </span>
          <h2 className="mt-4 text-lg font-bold">Your workspace is ready</h2>
          <p className="mt-2 text-sm text-slate-400">
            {isAdmin
              ? "Create a task to get your team's work moving."
              : "Your administrator will add the first task."}
          </p>
          {isAdmin && (
            <Button
              onClick={() => setTaskDialog({ open: true, task: null })}
              className="mt-5 bg-sky-400 font-bold text-slate-950 hover:bg-sky-300"
            >
              <Plus className="size-4" aria-hidden="true" /> Create your first
              task
            </Button>
          )}
        </section>
      )}

      {query.view === "board" ? (
        <TaskBoard
          tasks={page.items}
          statuses={statuses}
          dragOver={dragOver}
          canEdit={isAdmin}
          onDragStart={setDragged}
          onDragOver={setDragOver}
          onDragLeave={() => setDragOver(null)}
          onDrop={moveTask}
          canReorder={canReorder}
          busy={busy}
          users={users}
          onDragEnd={() => {
            setDragged(null);
            setDragOver(null);
          }}
          onDelete={deleteTask}
          onDeleteAttachment={deleteAttachment}
        />
      ) : (
        <TaskTable
          tasks={page.items}
          statuses={statuses}
          canEdit={isAdmin}
          onDelete={deleteTask}
          users={users}
          busy={busy}
          onStatusChange={changeStatus}
        />
      )}

      {query.view === "table" && (
        <PaginationControls
          page={page.page}
          totalPages={page.totalPages}
          total={page.total}
          itemLabel="tasks"
          isPending={isPending}
          onPageChange={(next) => navigate({ page: next })}
        />
      )}

      {taskDialog.open && <TaskForm statuses={statuses} users={users} />}
      <TaskDetail
        statuses={statuses}
        users={users}
        busy={busy}
        onStatusChange={changeStatus}
      />
      {isStatusOpen && <StatusManager statuses={statuses} />}
    </div>
  );
}
