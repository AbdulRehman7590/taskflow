"use client";

import { useState } from "react";
import { useAtom } from "jotai";
import { X } from "lucide-react";
import { editingTaskAtom, isTaskFormOpenAtom } from "@/atoms/taskAtoms";
import type { Status, TaskInput } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export default function TaskForm({
  statuses,
  onSave,
}: {
  statuses: Status[];
  onSave: (input: TaskInput) => Promise<void>;
}) {
  const [editing, setEditing] = useAtom(editingTaskAtom);
  const [, setOpen] = useAtom(isTaskFormOpenAtom);
  const [title, setTitle] = useState(editing?.title ?? "");
  const [description, setDescription] = useState(editing?.description ?? "");

  const [status, setStatus] = useState(
    editing?.status ?? statuses[0]?.key ?? "",
  );

  async function submit(event: React.FormEvent) {
    event.preventDefault();

    if (!title.trim() || !status) return;
    await onSave({
      title: title.trim(),
      description: description.trim(),
      status,
    });
    setEditing(null);
    setOpen(false);
  }

  function close() {
    setEditing(null);
    setOpen(false);
  }

  return (
    <div
      className="fixed inset-0 z-40 grid place-items-center bg-slate-950/45 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
    >
      <form
        onSubmit={submit}
        className="w-full max-w-lg rounded-[2rem] border border-white/70 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-900 sm:p-8"
      >
        <div className="mb-7 flex items-start justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-sky-600">
              Task details
            </p>
            <h2 className="mt-2 text-2xl font-black">
              {editing ? "Edit task" : "Create a task"}
            </h2>
          </div>
          <button
            type="button"
            onClick={close}
            className="rounded-xl p-2 text-muted-foreground hover:bg-muted"
            aria-label="Close form"
          >
            <X />
          </button>
        </div>
        <div className="space-y-5">
          <label className="flex flex-col gap-2 text-sm font-bold">
            Title
            <Input
              autoFocus
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="What needs to get done?"
              className="rounded-xl border border-input bg-background px-3.5 py-3 font-normal outline-none focus:ring-2 focus:ring-sky-500"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm font-bold">
            Description
            <Textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Add a little context..."
              rows={4}
              className="resize-none rounded-xl border border-input bg-background px-3.5 py-3 font-normal outline-none focus:ring-2 focus:ring-sky-500"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm font-bold">
            Status
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              className="rounded-xl border border-input bg-background px-3.5 py-3 font-normal outline-none focus:ring-2 focus:ring-sky-500"
            >
              {statuses.map((item) => (
                <option key={item.key} value={item.key}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="mt-8 flex justify-end gap-3">
          <Button type="button" onClick={close} variant="ghost">
            Cancel
          </Button>
          <Button type="submit" className="bg-slate-950 hover:bg-sky-700">
            {editing ? "Save changes" : "Create task"}
          </Button>
        </div>
      </form>
    </div>
  );
}
