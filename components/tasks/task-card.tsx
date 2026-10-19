"use client";

import { useSetAtom } from "jotai";
import {
  CalendarDays,
  Download,
  FileText,
  GripVertical,
  Pencil,
  Trash2,
  X,
} from "lucide-react";
import { taskDetailAtom, taskDialogAtom } from "@/atoms/task-atoms";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { priorityClass } from "@/lib/utils";
import { isOverdue } from "@/lib/dates";
import type { Status, Task } from "@/types";

export function TaskCard({
  task,
  statuses,
  canEdit,
  onDelete,
  onDeleteAttachment,
  onDragStart,
  assignee,
  busy,
}: {
  task: Task;
  statuses: Status[];
  canEdit: boolean;
  onDelete: () => void;
  onDeleteAttachment: (attachmentId: number) => void;
  onDragStart: () => void;
  assignee?: string;
  busy: boolean;
}) {
  const setTaskDialog = useSetAtom(taskDialogAtom);
  const setTaskDetail = useSetAtom(taskDetailAtom);
  const status = statuses.find((item) => item.key === task.status);
  const overdue = isOverdue(task);

  return (
    <Card
      draggable={!busy}
      onDragStart={(event) => {
        event.dataTransfer.setData("text/plain", String(task.id));
        event.dataTransfer.effectAllowed = "move";
        onDragStart();
      }}
      className="group cursor-grab rounded-2xl border-white/10 bg-white/[0.045] transition hover:-translate-y-0.5 hover:border-sky-400/40 active:cursor-grabbing"
    >
      <CardContent className="flex items-start gap-3 p-4">
        <GripVertical
          className="mt-0.5 shrink-0 text-slate-600"
          size={18}
          aria-hidden="true"
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-sm font-bold leading-5">
              <button
                type="button"
                onClick={() => setTaskDetail(task)}
                className="text-left hover:text-sky-300"
                aria-label={`View ${task.title}`}
              >
                {task.title}
              </button>
            </h3>
            {canEdit && (
              <div className="flex shrink-0 transition-opacity sm:opacity-0 group-hover:opacity-100 group-focus-within:opacity-100">
                <button
                  type="button"
                  disabled={busy}
                  onClick={(event) => {
                    event.stopPropagation();
                    setTaskDialog({ open: true, task });
                  }}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white"
                  aria-label={`Edit ${task.title}`}
                >
                  <Pencil size={16} />
                </button>
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    onDelete();
                  }}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-500/10 hover:text-rose-400"
                  aria-label={`Delete ${task.title}`}
                  disabled={busy}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            )}
          </div>

          {task.description && (
            <p className="mt-2 line-clamp-3 text-sm leading-5 text-slate-400">
              {task.description}
            </p>
          )}

          {task.attachments.length > 0 && (
            <ul className="mt-3 grid grid-cols-2 gap-2">
              {task.attachments.slice(0, 2).map((attachment) => (
                <li
                  key={attachment.id}
                  className="relative overflow-hidden rounded-lg border border-white/10 bg-black/30"
                >
                  <a
                    href={attachment.url}
                    target="_blank"
                    rel="noreferrer"
                    download={attachment.fileName}
                    title={`Download ${attachment.fileName}`}
                    onClick={(event) => event.stopPropagation()}
                  >
                    {attachment.mimeType.startsWith("image/") ? (
                      <img
                        src={attachment.url}
                        alt={attachment.fileName}
                        className="h-20 w-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <span className="grid h-20 place-items-center text-slate-400">
                        <FileText size={24} />
                      </span>
                    )}
                    <span className="flex items-center gap-1 px-2 py-1 text-xs text-slate-400">
                      <Download size={11} className="shrink-0" />
                      <span className="truncate">{attachment.fileName}</span>
                    </span>
                  </a>
                  {canEdit && (
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        onDeleteAttachment(attachment.id);
                      }}
                      className="absolute right-1 top-1 rounded-full bg-black/70 p-1 text-white"
                      aria-label={`Delete attachment ${attachment.fileName}`}
                      disabled={busy}
                    >
                      <X size={13} />
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="bg-sky-500/10 text-sky-300">
              {status?.name ?? task.status}
            </Badge>
            <Badge
              variant="outline"
              className={`capitalize ${priorityClass(task.priority)}`}
            >
              {task.priority}
            </Badge>
            {task.deadline && (
              <span
                className={
                  overdue
                    ? "flex items-center gap-1 text-xs text-rose-300"
                    : "flex items-center gap-1 text-xs text-slate-500"
                }
              >
                <CalendarDays className="size-3" />
                {task.deadline.slice(0, 10)}
              </span>
            )}
          </div>
          <p className="mt-3 truncate text-xs text-slate-400">
            {assignee ?? "Unassigned"}
            {task.attachments.length > 2
              ? ` · ${task.attachments.length} attachments`
              : ""}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
