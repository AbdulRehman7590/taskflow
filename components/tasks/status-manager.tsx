"use client";

import { useState } from "react";
import { useSetAtom } from "jotai";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  ArrowDown,
  ArrowUp,
  Check,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { taskApi } from "@/api";
import { statusDialogOpenAtom } from "@/atoms/task-atoms";
import { orderStatuses } from "@/lib/utils";
import { statusSchema, type StatusInput } from "@/lib/validations";
import { Button } from "@/components/ui/button";
import { FeedbackAlert } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Dialog } from "@/components/ui/dialog";
import type { Feedback, Status } from "@/types";

export function StatusManager({ statuses }: { statuses: Status[] }) {
  const router = useRouter();
  const setOpen = useSetAtom(statusDialogOpenAtom);

  const ordered = orderStatuses(statuses);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [busy, setBusy] = useState(false);
  const [renaming, setRenaming] = useState<number | null>(null);
  const [draftName, setDraftName] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<StatusInput>({
    resolver: zodResolver(statusSchema),
    defaultValues: { name: "" },
  });

  async function run(action: () => Promise<unknown>, message: string) {
    setBusy(true);
    setFeedback(null);
    try {
      await action();
      setFeedback({ tone: "success", message });
      router.refresh();
      return true;
    } catch (error) {
      setFeedback({
        tone: "error",
        message:
          error instanceof Error ? error.message : "That change did not save.",
      });
      return false;
    } finally {
      setBusy(false);
    }
  }

  const addStatus = handleSubmit(async (values) => {
    if (
      await run(() => taskApi.createStatus(values), `Added "${values.name}".`)
    ) {
      reset();
    }
  });

  async function saveRename(status: Status) {
    const parsed = statusSchema.safeParse({ name: draftName });
    if (!parsed.success) {
      setFeedback({
        tone: "error",
        message: parsed.error.issues[0]?.message ?? "Enter a valid name.",
      });
      return;
    }
    if (
      await run(
        () => taskApi.renameStatus(status.id, parsed.data),
        "Status renamed.",
      )
    ) {
      setRenaming(null);
    }
  }

  function move(status: Status, direction: -1 | 1) {
    const index = ordered.findIndex((item) => item.id === status.id);
    const target = index + direction;
    if (target < 0 || target >= ordered.length) return;

    const next = ordered.map((item) => item.id);
    [next[index], next[target]] = [next[target], next[index]];
    void run(() => taskApi.reorderStatuses(next), "Order updated.");
  }

  return (
    <Dialog
      labelledBy="status-manager-title"
      onClose={() => setOpen(false)}
      busy={busy || isSubmitting}
      className="max-w-xl"
    >
      <section className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-[2rem] border border-white/10 bg-slate-900 p-6 shadow-2xl sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-sky-400">
              Workspace setup
            </p>
            <h2 id="status-manager-title" className="mt-2 text-2xl font-black">
              Shape your workflow
            </h2>
            <p className="mt-2 text-sm text-slate-400">
              Add stages and arrange the columns around the work.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded-xl p-2 text-slate-400 hover:bg-white/10 hover:text-white"
            aria-label="Close status settings"
          >
            <X />
          </button>
        </div>

        <form onSubmit={addStatus} className="mt-6 flex gap-2">
          <Input
            {...register("name")}
            placeholder="New status name"
            aria-label="New status name"
            aria-invalid={Boolean(errors.name)}
            className="h-11 min-w-0 flex-1 border-white/10 bg-white/5"
          />
          <Button
            type="submit"
            disabled={busy || isSubmitting}
            className="h-11 gap-2 bg-sky-400 font-bold text-slate-950 hover:bg-sky-300"
          >
            <Plus size={17} /> {isSubmitting ? "Adding…" : "Add"}
          </Button>
        </form>
        {errors.name && (
          <p role="alert" className="mt-2 text-sm text-rose-400">
            {errors.name.message}
          </p>
        )}

        <FeedbackAlert
          feedback={feedback}
          className="mt-3"
          onDismiss={() => setFeedback(null)}
        />

        <ul className="mt-6 space-y-2">
          {ordered.map((status, index) => (
            <li
              key={status.id}
              className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5"
            >
              {renaming === status.id ? (
                <>
                  <Input
                    value={draftName}
                    onChange={(event) => setDraftName(event.target.value)}
                    aria-label={`New name for ${status.name}`}
                    autoFocus
                    className="h-9 min-w-0 flex-1 border-white/10 bg-slate-950"
                  />
                  <button
                    type="button"
                    onClick={() => void saveRename(status)}
                    disabled={busy}
                    className="rounded-lg p-1.5 text-emerald-400 hover:bg-white/10"
                    aria-label={`Save name for ${status.name}`}
                  >
                    <Check size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setRenaming(null)}
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-white/10"
                    aria-label="Cancel rename"
                  >
                    <X size={16} />
                  </button>
                </>
              ) : (
                <>
                  <span className="size-2.5 shrink-0 rounded-full bg-sky-400" />
                  <span className="min-w-0 flex-1 truncate text-sm font-semibold">
                    {status.name}
                  </span>
                  <button
                    type="button"
                    onClick={() => move(status, -1)}
                    disabled={busy || index === 0}
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-white/10 disabled:opacity-25"
                    aria-label={`Move ${status.name} up`}
                  >
                    <ArrowUp size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => move(status, 1)}
                    disabled={busy || index === ordered.length - 1}
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-white/10 disabled:opacity-25"
                    aria-label={`Move ${status.name} down`}
                  >
                    <ArrowDown size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setRenaming(status.id);
                      setDraftName(status.name);
                    }}
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-white/10"
                    aria-label={`Rename ${status.name}`}
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      void run(
                        () => taskApi.deleteStatus(status.id),
                        `Deleted "${status.name}".`,
                      )
                    }
                    disabled={
                      busy ||
                      status.key === "TODO" ||
                      status.key === "COMPLETED"
                    }
                    title={
                      status.key === "TODO" || status.key === "COMPLETED"
                        ? "Required stage; you can rename it"
                        : undefined
                    }
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-500/10 hover:text-rose-400 disabled:opacity-40"
                    aria-label={`Delete ${status.name}`}
                  >
                    <Trash2 size={16} />
                  </button>
                </>
              )}
            </li>
          ))}
        </ul>
      </section>
    </Dialog>
  );
}
