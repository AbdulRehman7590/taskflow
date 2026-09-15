"use client";

import { useEffect, useMemo, useState } from "react";
import { useAtom, useAtomValue } from "jotai";
import {
  Check,
  Circle,
  MoreHorizontal,
  Plus,
  RefreshCw,
  Settings2,
} from "lucide-react";
import { taskApi } from "@/lib/api";
import {
  editingTaskAtom,
  isLoadingTasksAtom,
  isTaskFormOpenAtom,
  statusesAtom,
  taskCountsAtom,
  taskErrorAtom,
  taskFilterAtom,
  tasksAtom,
} from "@/atoms/taskAtoms";
import StatusManager from "./status-manager";
import TaskCard from "./task-card";
import TaskForm from "./task-form";
import type { Status, Task, TaskInput } from "@/types/task";

const completedKey = "COMPLETED";

function sortStatuses(statuses: Status[]) {
  return [...statuses].sort((left, right) => {
    if (left.key === completedKey) return 1;
    if (right.key === completedKey) return -1;
    return left.position - right.position;
  });
}

function statusTone(status: Status, index: number) {
  if (status.key === completedKey)
    return "text-emerald-600 dark:text-emerald-400";
  return ["text-sky-600", "text-amber-600", "text-rose-600", "text-violet-600"][
    index % 4
  ];
}

export default function TaskManager() {
  const [tasks, setTasks] = useAtom(tasksAtom);
  const [statuses, setStatuses] = useAtom(statusesAtom);
  const [filter, setFilter] = useAtom(taskFilterAtom);
  const [isFormOpen, setFormOpen] = useAtom(isTaskFormOpenAtom);
  const [editing, setEditing] = useAtom(editingTaskAtom);
  const [loading, setLoading] = useAtom(isLoadingTasksAtom);
  const [error, setError] = useAtom(taskErrorAtom);
  const counts = useAtomValue(taskCountsAtom);
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

  useEffect(() => {
    void loadData();
  }, []);

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
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_#dbeafe,_transparent_35%),linear-gradient(135deg,_#f8fafc,_#eef2ff)] dark:bg-[linear-gradient(135deg,_#0f172a,_#172554)]">
      <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8 lg:px-10">
        <header className="flex flex-col gap-7 border-b border-slate-200/80 pb-9 dark:border-slate-700 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm font-black text-sky-700 dark:text-sky-300">
              <span className="grid size-9 place-items-center rounded-2xl bg-slate-950 text-white shadow-xl shadow-sky-900/20">
                <Check size={18} />
              </span>{" "}
              Taskflow
            </div>
            <h1 className="mt-7 text-4xl font-black tracking-tight text-slate-950 dark:text-white sm:text-6xl">
              Make room for <span className="text-sky-600">momentum.</span>
            </h1>
            <p className="mt-3 max-w-xl text-base text-slate-600 dark:text-slate-300">
              A flexible board for the work in front of you today.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSettingsOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white/70 px-4 py-3 text-sm font-bold text-slate-700 shadow-sm hover:border-sky-400 hover:text-sky-700 dark:border-slate-600 dark:bg-slate-900/50 dark:text-slate-200"
            >
              <Settings2 size={17} /> Statuses
            </button>
            <button
              onClick={() => {
                setEditing(null);
                setFormOpen(true);
              }}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-sky-900/20 hover:bg-sky-700"
            >
              <Plus size={18} /> New task
            </button>
          </div>
        </header>

        <section className="mt-7 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/80 bg-white/70 p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900/60">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Total tasks
            </p>
            <p className="mt-1 text-3xl font-black">{counts.ALL}</p>
          </div>
          <div className="rounded-2xl border border-white/80 bg-white/70 p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900/60">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Active statuses
            </p>
            <p className="mt-1 text-3xl font-black text-sky-600">
              {statuses.length}
            </p>
          </div>
          <div className="rounded-2xl border border-white/80 bg-white/70 p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900/60">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Completed
            </p>
            <p className="mt-1 text-3xl font-black text-emerald-600">
              {countFor(completedKey)}
            </p>
          </div>
        </section>

        <section className="mt-7 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setFilter("ALL")}
              className={`rounded-full px-3.5 py-2 text-sm font-bold ${filter === "ALL" ? "bg-slate-950 text-white" : "text-muted-foreground hover:bg-white/70"}`}
            >
              All tasks <span className="ml-1 opacity-60">{counts.ALL}</span>
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
          <div className="mt-5 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
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
                className={`min-h-80 rounded-[1.75rem] border p-4 transition ${dragOver === status.key ? "border-sky-400 bg-sky-500/10 ring-2 ring-sky-400/20" : "border-white/80 bg-white/55 dark:border-slate-700 dark:bg-slate-900/45"}`}
              >
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className={`size-2.5 rounded-full ${status.key === completedKey ? "bg-emerald-500" : "bg-sky-500"}`}
                    />
                    <h2
                      className={`text-sm font-black ${statusTone(status, index)}`}
                    >
                      {status.name}
                    </h2>
                    <span className="grid size-6 place-items-center rounded-full bg-white/80 text-xs font-bold text-muted-foreground dark:bg-slate-800">
                      {columnTasks.length}
                    </span>
                  </div>
                  {status.key === completedKey ? (
                    <Check size={18} className="text-emerald-500" />
                  ) : (
                    <Circle size={18} className={statusTone(status, index)} />
                  )}
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
                    />
                  ))}
                  {columnTasks.length === 0 && (
                    <div className="flex min-h-32 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300/80 bg-white/30 p-5 text-center text-sm text-muted-foreground dark:border-slate-700">
                      <MoreHorizontal size={20} className="mb-2" />
                      Drop a task here
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </section>

        {isFormOpen && (
          <TaskForm statuses={orderedStatuses} onSave={saveTask} />
        )}
        {settingsOpen && (
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
