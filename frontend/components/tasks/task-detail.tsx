"use client";

import { useAtom } from "jotai";
import {
  CalendarDays,
  Download,
  FileText,
  Flag,
  Paperclip,
  X,
} from "lucide-react";
import { taskDetailAtom } from "@/atoms/task-atoms";
import { Badge } from "@/components/ui/badge";
import { priorityClass } from "@/lib/utils";
import type { Status } from "@/types";

export function TaskDetail({ statuses }: { statuses: Status[] }) {
  const [task, setTask] = useAtom(taskDetailAtom);
  if (!task) return null;

  const status =
    statuses.find((item) => item.key === task.status)?.name ?? task.status;
  const overdue = Boolean(
    task.deadline &&
    new Date(task.deadline) < new Date() &&
    task.status !== "COMPLETED",
  );

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-slate-950/70 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="task-detail-title"
      onMouseDown={(event) => {
        if (event.currentTarget === event.target) setTask(null);
      }}
    >
      <article className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-[2rem] border border-white/10 bg-slate-900 p-6 shadow-2xl sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap gap-2">
              <Badge className="bg-sky-500/10 text-sky-300">{status}</Badge>
              <Badge className={`capitalize ${priorityClass(task.priority)}`}>
                {task.priority} priority
              </Badge>
              {overdue && (
                <Badge className="bg-rose-500/10 text-rose-300">Overdue</Badge>
              )}
            </div>
            <h2
              id="task-detail-title"
              className="mt-4 text-2xl font-black text-white sm:text-3xl"
            >
              {task.title}
            </h2>
          </div>
          <button
            type="button"
            onClick={() => setTask(null)}
            aria-label="Close task details"
            className="rounded-xl p-2 text-slate-400 hover:bg-white/10 hover:text-white"
          >
            <X />
          </button>
        </div>

        <p className="mt-5 whitespace-pre-wrap text-sm leading-7 text-slate-300">
          {task.description || "No description was provided."}
        </p>

        <dl className="mt-7 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <dt className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
              <Flag className="size-4" /> Priority
            </dt>
            <dd className={`mt-2 capitalize ${priorityClass(task.priority)}`}>
              {task.priority}
            </dd>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <dt className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
              <CalendarDays className="size-4" /> Created
            </dt>
            <dd className="mt-2 text-white">{task.createdAt.slice(0, 10)}</dd>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <dt className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
              <CalendarDays className="size-4" /> Deadline
            </dt>
            <dd className={overdue ? "mt-2 text-rose-300" : "mt-2 text-white"}>
              {task.deadline?.slice(0, 10) ?? "No deadline"}
            </dd>
          </div>
        </dl>

        {task.attachments.length > 0 && (
          <section className="mt-7">
            <h3 className="flex items-center gap-2 text-sm font-bold text-white">
              <Paperclip className="size-4" /> Attachments
            </h3>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {task.attachments.map((attachment) => (
                <div
                  key={attachment.id}
                  className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.04]"
                >
                  {attachment.mimeType.startsWith("image/") ? (
                    <a
                      href={attachment.url}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={`Preview ${attachment.fileName}`}
                    >
                      <img
                        src={attachment.url}
                        alt={attachment.fileName}
                        className="h-40 w-full object-cover"
                      />
                    </a>
                  ) : (
                    <div className="grid h-40 place-items-center bg-black/20 text-slate-500">
                      <FileText className="size-10" aria-hidden="true" />
                    </div>
                  )}
                  <div className="flex items-center justify-between gap-3 p-3">
                    <span className="truncate text-sm text-slate-300">
                      {attachment.fileName}
                    </span>
                    <a
                      href={attachment.url}
                      download={attachment.fileName}
                      className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-sky-400 px-2.5 py-1.5 text-xs font-bold text-slate-950 hover:bg-sky-300"
                    >
                      <Download className="size-3.5" aria-hidden="true" />
                      Download
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </article>
    </div>
  );
}
