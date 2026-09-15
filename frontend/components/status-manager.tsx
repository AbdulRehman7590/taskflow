"use client";

import { useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  Pencil,
  Plus,
  Trash2,
  GripVertical,
  X,
} from "lucide-react";
import { taskApi } from "@/lib/api";
import type { Status } from "@/types/task";

const completedKey = "COMPLETED";

function orderStatuses(statuses: Status[]) {
  return [...statuses].sort((left, right) => {
    if (left.key === completedKey) return 1;
    if (right.key === completedKey) return -1;
    return left.position - right.position;
  });
}

export default function StatusManager({
  statuses,
  onClose,
  onChanged,
}: {
  statuses: Status[];
  onClose: () => void;
  onChanged: (statuses: Status[]) => void;
}) {
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const ordered = orderStatuses(statuses);

  async function addStatus(event: React.FormEvent) {
    event.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    try {
      const created = await taskApi.createStatus({ name: name.trim() });
      onChanged(orderStatuses([...statuses, created]));
      setName("");
    } finally {
      setBusy(false);
    }
  }

  async function renameStatus(status: Status) {
    const nextName = window.prompt("Status name", status.name)?.trim();
    if (!nextName || nextName === status.name) return;
    const updated = await taskApi.updateStatus(status.id, { name: nextName });
    onChanged(
      statuses.map((item) => (item.id === updated.id ? updated : item)),
    );
  }

  async function deleteStatus(status: Status) {
    if (
      status.key === completedKey ||
      !window.confirm(`Delete ${status.name}?`)
    )
      return;
    setBusy(true);
    try {
      await taskApi.deleteStatus(status.id);
      onChanged(statuses.filter((item) => item.id !== status.id));
    } catch (error) {
      window.alert(
        error instanceof Error
          ? error.message
          : "Unable to delete this status.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function moveStatus(status: Status, direction: -1 | 1) {
    const index = ordered.findIndex((item) => item.id === status.id);
    const target = index + direction;
    if (
      target < 0 ||
      target >= ordered.length ||
      ordered[target].key === completedKey
    )
      return;
    const next = [...ordered];
    [next[index], next[target]] = [next[target], next[index]];
    onChanged(await taskApi.reorderStatuses(next.map((item) => item.id)));
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/45 p-4 backdrop-blur-sm">
      <section
        className="w-full max-w-lg rounded-[2rem] border border-white/70 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-900 sm:p-8"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-sky-600">
              Workspace setup
            </p>
            <h2 className="mt-2 text-2xl font-black tracking-tight">
              Shape your workflow
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Add stages and arrange them around the work.
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-2 text-muted-foreground hover:bg-muted"
            aria-label="Close status settings"
          >
            <X />
          </button>
        </div>
        <form onSubmit={addStatus} className="mt-6 flex gap-2">
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="New status name"
            className="min-w-0 flex-1 rounded-xl border border-input bg-background px-3.5 py-3 outline-none focus:ring-2 focus:ring-sky-500"
          />
          <button
            disabled={busy}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-sm font-bold text-white hover:bg-sky-700 disabled:opacity-50"
          >
            <Plus size={17} /> Add
          </button>
        </form>
        <div className="mt-6 space-y-2">
          {ordered.map((status, index) => (
            <div
              key={status.id}
              className="flex items-center gap-3 rounded-xl border border-border bg-background px-3 py-3"
            >
              <GripVertical size={16} className="text-muted-foreground/50" />
              <span
                className={`size-2.5 rounded-full ${status.key === completedKey ? "bg-emerald-500" : "bg-sky-500"}`}
              />
              <span className="min-w-0 flex-1 truncate text-sm font-semibold">
                {status.name}
              </span>
              {status.key === completedKey ? (
                <span className="text-xs text-muted-foreground">
                  Always last
                </span>
              ) : (
                <>
                  <button
                    onClick={() => void moveStatus(status, -1)}
                    disabled={index === 0}
                    className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted disabled:opacity-25"
                    aria-label={`Move ${status.name} up`}
                  >
                    <ArrowUp size={16} />
                  </button>
                  <button
                    onClick={() => void moveStatus(status, 1)}
                    disabled={index === ordered.length - 2}
                    className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted disabled:opacity-25"
                    aria-label={`Move ${status.name} down`}
                  >
                    <ArrowDown size={16} />
                  </button>
                  <button
                    onClick={() => void renameStatus(status)}
                    className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted"
                    aria-label={`Rename ${status.name}`}
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    onClick={() => void deleteStatus(status)}
                    disabled={busy}
                    className="rounded-lg p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive disabled:opacity-40"
                    aria-label={`Delete ${status.name}`}
                  >
                    <Trash2 size={16} />
                  </button>
                </>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
