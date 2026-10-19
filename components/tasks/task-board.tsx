"use client";

import { TaskCard } from "./task-card";
import { cn } from "@/lib/utils";
import type { Status, Task, TeamUser } from "@/types";

/** Drag-and-drop board. Moving a card is allowed for every signed-in member. */
export function TaskBoard({
  tasks,
  statuses,
  dragOver,
  canEdit,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  canReorder,
  onDelete,
  onDeleteAttachment,
  users,
  busy,
  onDragEnd,
}: {
  tasks: Task[];
  statuses: Status[];
  dragOver: string | null;
  canEdit: boolean;
  onDragStart: (task: Task) => void;
  onDragOver: (statusKey: string) => void;
  onDragLeave: () => void;
  onDrop: (statusKey: string, beforeTaskId?: number) => void;
  canReorder: boolean;
  onDelete: (task: Task) => void;
  onDeleteAttachment: (task: Task, attachmentId: number) => void;
  users: TeamUser[];
  busy: boolean;
  onDragEnd: () => void;
}) {
  const byStatus = new Map<string, Task[]>();
  for (const task of tasks) {
    const column = byStatus.get(task.status) ?? [];
    column.push(task);
    byStatus.set(task.status, column);
  }
  const names = new Map(users.map((user) => [user.id, user.name]));
  return (
    <section
      className="mt-5 overflow-x-auto pb-3"
      aria-label="Task status board"
      aria-busy={busy}
      onDragEnd={onDragEnd}
    >
      <div className="flex min-w-max items-start gap-5">
        {statuses.map((status) => {
          const columnTasks = byStatus.get(status.key) ?? [];

          return (
            <div
              key={status.key}
              onDragOver={(event) => {
                if (busy) return;
                event.preventDefault();
                onDragOver(status.key);
              }}
              onDragLeave={onDragLeave}
              onDrop={(event) => {
                event.preventDefault();
                onDrop(status.key);
              }}
              className={cn(
                "min-h-80 w-[20rem] shrink-0 rounded-[1.75rem] border p-4 transition",
                dragOver === status.key
                  ? "border-sky-400 bg-sky-500/10"
                  : "border-white/10 bg-black/25",
              )}
            >
              <div className="mb-4 flex items-center gap-2">
                <span className="size-2.5 rounded-full bg-sky-400" />
                <h2 className="text-sm font-black">{status.name}</h2>
                <span className="grid size-6 place-items-center rounded-full bg-white/10 text-xs font-bold text-slate-400">
                  {columnTasks.length}
                </span>
              </div>

              <div className="flex flex-col gap-3">
                {columnTasks.map((task) => (
                  <div
                    key={task.id}
                    onDragOver={(event) => {
                      if (!canReorder) return;
                      event.preventDefault();
                      event.stopPropagation();
                      onDragOver(status.key);
                    }}
                    onDrop={(event) => {
                      if (!canReorder) return;
                      event.preventDefault();
                      event.stopPropagation();
                      onDrop(status.key, task.id);
                    }}
                  >
                    <TaskCard
                      task={task}
                      statuses={statuses}
                      canEdit={canEdit}
                      busy={busy}
                      assignee={
                        task.assigneeId ? names.get(task.assigneeId) : undefined
                      }
                      onDragStart={() => onDragStart(task)}
                      onDelete={() => onDelete(task)}
                      onDeleteAttachment={(id) => onDeleteAttachment(task, id)}
                    />
                  </div>
                ))}
                {!columnTasks.length && (
                  <p className="grid min-h-32 place-items-center rounded-2xl border border-dashed border-white/15 p-5 text-center text-sm text-slate-500">
                    Drop a task here
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
