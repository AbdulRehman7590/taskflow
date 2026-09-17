"use client";

import { useSetAtom } from "jotai";
import { Download, Pencil, Trash2 } from "lucide-react";
import { taskDetailAtom, taskDialogAtom } from "@/atoms/task-atoms";
import { Badge } from "@/components/ui/badge";
import { priorityClass } from "@/lib/utils";
import type { Status, Task } from "@/types";

export function TaskTable({
  tasks,
  statuses,
  canEdit,
  onDelete,
}: {
  tasks: Task[];
  statuses: Status[];
  canEdit: boolean;
  onDelete: (task: Task) => void;
}) {
  const setTaskDialog = useSetAtom(taskDialogAtom);
  const setTaskDetail = useSetAtom(taskDetailAtom);
  const statusName = (key: string) =>
    statuses.find((status) => status.key === key)?.name ?? key;

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
              <tr
                key={task.id}
                onClick={() => setTaskDetail(task)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    setTaskDetail(task);
                  }
                }}
                tabIndex={0}
                className="cursor-pointer hover:bg-white/[0.035]"
              >
                <td className="max-w-md px-5 py-4">
                  <p className="font-bold text-white">{task.title}</p>
                  {task.description && (
                    <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">
                      {task.description}
                    </p>
                  )}
                </td>
                <td className="px-5 py-4">
                  <Badge
                    variant="secondary"
                    className="bg-sky-500/10 text-sky-300"
                  >
                    {statusName(task.status)}
                  </Badge>
                </td>
                <td className="px-5 py-4">
                  <Badge
                    variant="outline"
                    className={`capitalize ${priorityClass(task.priority)}`}
                  >
                    {task.priority}
                  </Badge>
                </td>
                <td className="whitespace-nowrap px-5 py-4 text-slate-400">
                  <p>Created {task.createdAt.slice(0, 10)}</p>
                  <p className="mt-1 text-xs text-slate-500">
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
