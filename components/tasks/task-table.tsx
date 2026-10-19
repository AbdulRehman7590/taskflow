"use client";

import { useSetAtom } from "jotai";
import { Download, Pencil, Trash2 } from "lucide-react";
import { taskDetailAtom, taskDialogAtom } from "@/atoms/task-atoms";
import { Badge } from "@/components/ui/badge";
import { priorityClass } from "@/lib/utils";
import { isOverdue } from "@/lib/dates";
import type { Status, Task, TeamUser } from "@/types";

export function TaskTable({
  tasks,
  statuses,
  canEdit,
  onDelete,
  users,
  busy,
  onStatusChange,
}: {
  tasks: Task[];
  statuses: Status[];
  canEdit: boolean;
  onDelete: (task: Task) => void;
  users: TeamUser[];
  busy: boolean;
  onStatusChange: (task: Task, status: string) => void;
}) {
  const setTaskDialog = useSetAtom(taskDialogAtom);
  const setTaskDetail = useSetAtom(taskDetailAtom);
  const names = new Map(users.map((user) => [user.id, user.name]));

  return (
    <section className="mt-5 overflow-hidden rounded-3xl border border-white/10 bg-black/25">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[58rem] text-left text-sm">
          <caption className="sr-only">
            Tasks matching the current filters
          </caption>
          <thead className="border-b border-white/10 bg-black/25 text-xs uppercase tracking-wider text-slate-500">
            <tr>
              <th scope="col" className="px-5 py-4 font-semibold">
                Task
              </th>
              <th scope="col" className="px-5 py-4 font-semibold">
                Status
              </th>
              <th scope="col" className="px-5 py-4 font-semibold">
                Priority
              </th>
              <th scope="col" className="px-5 py-4 font-semibold">
                Assignee
              </th>
              <th scope="col" className="px-5 py-4 font-semibold">
                Dates
              </th>
              <th scope="col" className="px-5 py-4 font-semibold">
                Attachments
              </th>
              {canEdit && (
                <th scope="col" className="px-5 py-4 text-right font-semibold">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.07]">
            {tasks.map((task) => (
              <tr key={task.id} className="hover:bg-white/[0.035]">
                <td className="max-w-md px-5 py-4">
                  <button
                    type="button"
                    onClick={() => setTaskDetail(task)}
                    className="text-left font-bold text-white hover:text-sky-300"
                  >
                    {task.title}
                  </button>
                  {task.description && (
                    <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">
                      {task.description}
                    </p>
                  )}
                </td>
                <td className="px-5 py-4">
                  <select
                    value={task.status}
                    disabled={busy}
                    onChange={(event) =>
                      onStatusChange(task, event.target.value)
                    }
                    aria-label={`Status for ${task.title}`}
                    className="h-9 max-w-40 rounded-lg border border-white/10 bg-slate-950 px-2 text-sky-300"
                  >
                    {statuses.map((status) => (
                      <option key={status.key} value={status.key}>
                        {status.name}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-5 py-4">
                  <Badge
                    variant="outline"
                    className={`capitalize ${priorityClass(task.priority)}`}
                  >
                    {task.priority}
                  </Badge>
                </td>
                <td className="px-5 py-4 text-slate-300">
                  {task.assigneeId
                    ? (names.get(task.assigneeId) ?? "Unassigned")
                    : "Unassigned"}
                </td>
                <td className="whitespace-nowrap px-5 py-4 text-slate-400">
                  <p>Created {task.createdAt.slice(0, 10)}</p>
                  <p
                    className={
                      isOverdue(task)
                        ? "mt-1 text-xs text-rose-300"
                        : "mt-1 text-xs text-slate-500"
                    }
                  >
                    {task.deadline
                      ? `Due ${task.deadline.slice(0, 10)}`
                      : "No deadline"}
                  </p>
                </td>
                <td className="px-5 py-4">
                  <div className="flex flex-wrap gap-1">
                    {task.attachments.length ? (
                      task.attachments.map((attachment) => (
                        <a
                          key={attachment.id}
                          href={attachment.url}
                          target="_blank"
                          rel="noreferrer"
                          download={attachment.fileName}
                          title={attachment.fileName}
                          onClick={(event) => event.stopPropagation()}
                          className="inline-flex items-center gap-1 rounded-lg bg-white/5 px-2 py-1 text-xs text-slate-400 hover:text-white"
                        >
                          <Download className="size-3" aria-hidden="true" />
                          <span className="max-w-28 truncate">
                            {attachment.fileName}
                          </span>
                        </a>
                      ))
                    ) : (
                      <span className="text-slate-600">—</span>
                    )}
                  </div>
                </td>
                {canEdit && (
                  <td className="px-5 py-4">
                    <div className="flex justify-end gap-1">
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          setTaskDialog({ open: true, task });
                        }}
                        aria-label={`Edit ${task.title}`}
                        disabled={busy}
                        className="rounded-lg p-2 text-slate-400 hover:bg-white/10 hover:text-white"
                      >
                        <Pencil className="size-4" />
                      </button>
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          onDelete(task);
                        }}
                        aria-label={`Delete ${task.title}`}
                        disabled={busy}
                        className="rounded-lg p-2 text-slate-400 hover:bg-rose-500/10 hover:text-rose-400"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!tasks.length && (
        <p className="px-5 py-16 text-center text-sm text-slate-500">
          No tasks match these filters.
        </p>
      )}
    </section>
  );
}
