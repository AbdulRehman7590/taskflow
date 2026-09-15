"use client";

import { useMemo, useState } from "react";
import { useAtom } from "jotai";
import {
  Check,
  Circle,
  LogOut,
  MoreHorizontal,
  Plus,
  RefreshCw,
  Settings2,
} from "lucide-react";
import { taskApi } from "@/api";
import {
  editingTaskAtom,
  isLoadingTasksAtom,
  isTaskFormOpenAtom,
  taskErrorAtom,
  taskFilterAtom,
} from "@/atoms/taskAtoms";
import StatusManager from "./status-manager";
import TaskCard from "./task-card";
import TaskForm from "./task-form";
import type { Status, Task, TaskInput } from "@/types";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

function sortStatuses(statuses: Status[]) {
  return [...statuses].sort((left, right) => {
    return left.position - right.position;
  });
}

function statusTone(status: Status, index: number) {
  return ["text-sky-600", "text-amber-600", "text-rose-600", "text-violet-600"][
    index % 4
  ];
}

export default function TaskManager({
  initialTasks,
  initialStatuses,
  userRole,
}: {
  initialTasks: Task[];
  initialStatuses: Status[];
  userRole: string;
}) {
  const [tasks, setTasks] = useState(initialTasks);
  const [statuses, setStatuses] = useState(initialStatuses);
  const [filter, setFilter] = useAtom(taskFilterAtom);
  const [isFormOpen, setFormOpen] = useAtom(isTaskFormOpenAtom);
  const [editing, setEditing] = useAtom(editingTaskAtom);
  const [loading, setLoading] = useAtom(isLoadingTasksAtom);
  const [error, setError] = useAtom(taskErrorAtom);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [draggedId, setDraggedId] = useState<number | null>(null);
  const [dragOver, setDragOver] = useState<string | null>(null);
  const orderedStatuses = useMemo(() => sortStatuses(statuses), [statuses]);

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      const [loadedTasks, loadedStatuses] = await Promise.all([
        taskApi.list(),
        taskApi.listStatuses(),
      ]);
      setTasks(loadedTasks);
      setStatuses(sortStatuses(loadedStatuses));
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to connect to the task API",
      );
    } finally {
      setLoading(false);
    }
  }

  const visibleTasks =
    filter === "ALL" ? tasks : tasks.filter((task) => task.status === filter);
  const countFor = (key: string) =>
    tasks.filter((task) => task.status === key).length;

  async function saveTask(input: TaskInput) {
    try {
      const saved = editing?.id
        ? await taskApi.update(editing.id, input)
        : await taskApi.create(input);
      setTasks((current) =>
        editing?.id
          ? current.map((task) => (task.id === saved.id ? saved : task))
          : [saved, ...current],
      );
      setError(null);
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Unable to save task",
      );
    }
  }

  async function deleteTask(task: Task) {
    if (!window.confirm(`Delete "${task.title}"?`)) return;
    try {
      await taskApi.remove(task.id);
      setTasks((current) => current.filter((item) => item.id !== task.id));
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Unable to delete task",
      );
    }
  }

  async function changeStatus(task: Task, status: string) {
    if (status === task.status) return;
    try {
      const updated = await taskApi.update(task.id, { status });
      setTasks((current) =>
        current.map((item) => (item.id === updated.id ? updated : item)),
      );
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to update task status",
      );
    }
  }

  function dropOn(status: string) {
    if (draggedId !== null) {
      const task = tasks.find((item) => item.id === draggedId);
      if (task) void changeStatus(task, status);
    }
    setDraggedId(null);
    setDragOver(null);
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_15%_0%,_rgba(14,116,144,0.18),_transparent_30%),radial-gradient(circle_at_90%_10%,_rgba(79,70,229,0.14),_transparent_25%),linear-gradient(145deg,_#030303,_#09090b_48%,_#111827)]">
      <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8 lg:px-10">
        <header className="flex items-center justify-between rounded-[2rem] border border-white/10 bg-black/45 px-5 py-4 shadow-2xl shadow-black/25 backdrop-blur-xl sm:px-6">
          <a href="/" className="flex items-center gap-2.5 text-sm font-black text-sky-300">
            <span className="grid size-10 place-items-center rounded-2xl bg-gradient-to-br from-sky-400 to-indigo-500 text-slate-950 shadow-lg shadow-sky-500/20"><Check size={18} /></span>
            <span>Taskflow</span>
          </a>
          <Button asChild variant="ghost" className="border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white">
            <a href="/logout" aria-label="Log out of Taskflow"><LogOut size={16} /> Log out</a>
          </Button>
        </header>

        <section className="mt-10 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-sky-400">Your workspace</p>
            <h1 className="mt-3 text-4xl font-black tracking-tight text-white sm:text-6xl">
              Make room for <span className="text-sky-400">momentum.</span>
            </h1>
            <p className="mt-3 max-w-xl text-base text-slate-400">A flexible board for the work in front of you today.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {userRole === "admin" && (
              <a
                href="/team"
                className="inline-flex items-center rounded-xl border border-slate-300 bg-white/70 px-4 py-3 text-sm font-bold text-slate-700 dark:border-slate-600 dark:bg-slate-900/50 dark:text-slate-200"
              >
                Team
              </a>
            )}
            {userRole === "admin" && (
              <button
                onClick={() => setSettingsOpen(true)}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white/70 px-4 py-3 text-sm font-bold text-slate-700 shadow-sm hover:border-sky-400 hover:text-sky-700 dark:border-slate-600 dark:bg-slate-900/50 dark:text-slate-200"
              >
                <Settings2 size={17} /> Statuses
              </button>
            )}
            {userRole === "admin" && (
              <button
                onClick={() => {
                  setEditing(null);
                  setFormOpen(true);
                }}
                className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-sky-900/20 hover:bg-sky-700"
              >
                <Plus size={18} /> New task
              </button>
            )}
          </div>
        </section>

        <section className="mt-7 grid gap-3 sm:grid-cols-3">
          <Card className="rounded-2xl border-white/10 bg-white/[0.045] shadow-lg shadow-black/10">
            <CardContent className="p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Total tasks
              </p>
              <p className="mt-1 text-3xl font-black">{tasks.length}</p>
            </CardContent>
          </Card>
          <Card className="rounded-2xl border-white/10 bg-white/[0.045] shadow-lg shadow-black/10">
            <CardContent className="p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Active statuses
              </p>
              <p className="mt-1 text-3xl font-black text-sky-600">
                {statuses.length}
              </p>
            </CardContent>
          </Card>
          <Card className="rounded-2xl border-white/10 bg-white/[0.045] shadow-lg shadow-black/10">
            <CardContent className="p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Completed
              </p>
              <p className="mt-1 text-3xl font-black text-emerald-600">
                {countFor("COMPLETED")}
              </p>
            </CardContent>
          </Card>
        </section>

        <section className="mt-7 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="task-filter-tabs flex flex-wrap items-center gap-2">
            <button
              onClick={() => setFilter("ALL")}
              className={`rounded-full px-3.5 py-2 text-sm font-bold ${filter === "ALL" ? "bg-slate-950 text-white" : "text-muted-foreground hover:bg-white/70"}`}
            >
              All tasks <span className="ml-1 opacity-60">{tasks.length}</span>
            </button>
            {orderedStatuses.map((status) => (
              <button
                key={status.key}
                onClick={() => setFilter(status.key)}
                className={`rounded-full px-3.5 py-2 text-sm font-bold ${filter === status.key ? "bg-slate-950 text-white" : "text-muted-foreground hover:bg-white/70"}`}
              >
                {status.name}{" "}
                <span className="ml-1 opacity-60">{countFor(status.key)}</span>
              </button>
            ))}
          </div>
          <button
            onClick={() => void loadData()}
            className="inline-flex items-center gap-2 self-start rounded-lg px-2 py-1.5 text-sm text-muted-foreground hover:bg-white/70 hover:text-foreground"
            aria-label="Refresh tasks"
          >
            <RefreshCw size={17} className={loading ? "animate-spin" : ""} />{" "}
            Refresh
          </button>
        </section>

        {error && (
          <Alert className="mt-5 border-destructive/30 bg-destructive/5 text-destructive">
            {error}
          </Alert>
        )}

        <section className="mt-7 grid gap-5 [grid-template-columns:repeat(auto-fit,minmax(260px,1fr))]">
          {orderedStatuses.map((status, index) => {
            const columnTasks = visibleTasks.filter(
              (task) => task.status === status.key,
            );
            return (
              <div
                key={status.key}
                onDragOver={(event) => {
                  event.preventDefault();
                  setDragOver(status.key);
                }}
                onDragLeave={() => setDragOver(null)}
                onDrop={() => dropOn(status.key)}
                className={`min-h-80 rounded-[1.75rem] border p-4 transition ${dragOver === status.key ? "border-sky-400 bg-sky-500/10 ring-2 ring-sky-400/20" : "border-white/10 bg-black/25 shadow-xl shadow-black/10"}`}
              >
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="size-2.5 rounded-full bg-sky-500" />
                    <h2
                      className={`text-sm font-black ${statusTone(status, index)}`}
                    >
                      {status.name}
                    </h2>
                    <span className="grid size-6 place-items-center rounded-full bg-white/10 text-xs font-bold text-muted-foreground">
                      {columnTasks.length}
                    </span>
                  </div>
                  <Circle size={18} className={statusTone(status, index)} />
                </div>
                <div className="flex flex-col gap-3">
                  {columnTasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      statuses={orderedStatuses}
                      onDragStart={() => setDraggedId(task.id)}
                      onEdit={() => {
                        setEditing(task);
                        setFormOpen(true);
                      }}
                      onDelete={() => void deleteTask(task)}
                      canEdit={userRole === "admin"}
                    />
                  ))}
                  {columnTasks.length === 0 && (
                    <div className="flex min-h-32 flex-col items-center justify-center rounded-2xl border border-dashed border-white/15 bg-white/[0.025] p-5 text-center text-sm text-muted-foreground">
                      <MoreHorizontal size={20} className="mb-2" />
                      Drop a task here
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </section>

        {isFormOpen && userRole === "admin" && (
          <TaskForm statuses={orderedStatuses} onSave={saveTask} />
        )}
        {settingsOpen && userRole === "admin" && (
          <StatusManager
            statuses={orderedStatuses}
            onClose={() => setSettingsOpen(false)}
            onChanged={setStatuses}
          />
        )}
      </div>
    </main>
  );
}
