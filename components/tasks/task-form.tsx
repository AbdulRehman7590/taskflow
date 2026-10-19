"use client";

import { useEffect, useState } from "react";
import { useAtomValue, useSetAtom } from "jotai";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { FileText, X } from "lucide-react";
import { createTaskAction, updateTaskAction } from "@/actions/task-actions";
import { taskApi } from "@/api";
import { feedbackAtom, taskDialogAtom } from "@/atoms/task-atoms";
import { applyServerErrors } from "@/lib/form-errors";
import {
  ALLOWED_ATTACHMENT_MIME_TYPES,
  attachmentMetadataSchema,
  taskFormSchema,
  type TaskFormInput,
  type TaskFormRawInput,
} from "@/lib/validations";
import { Button } from "@/components/ui/button";
import { FeedbackAlert } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog } from "@/components/ui/dialog";
import type { Status, TeamUser } from "@/types";

type Selection = { file: File; preview?: string };

const FIELDS = [
  "title",
  "description",
  "status",
  "priority",
  "deadline",
  "assigneeId",
] as const;

export function TaskForm({
  statuses,
  users,
}: {
  statuses: Status[];
  users: TeamUser[];
}) {
  const router = useRouter();
  const { task } = useAtomValue(taskDialogAtom);
  const setTaskDialog = useSetAtom(taskDialogAtom);
  const setFeedback = useSetAtom(feedbackAtom);

  const [files, setFiles] = useState<Selection[]>([]);
  const [fileError, setFileError] = useState("");
  const [progress, setProgress] = useState("");

  const close = () => setTaskDialog({ open: false, task: null });

  const {
    register,
    handleSubmit,
    setError,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm<TaskFormRawInput, unknown, TaskFormInput>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      title: task?.title ?? "",
      description: task?.description ?? "",
      status: task?.status ?? "TODO",
      priority: task?.priority ?? "medium",
      deadline: task?.deadline?.slice(0, 10) ?? "",
      assigneeId: task?.assigneeId ?? "",
    },
  });

  useEffect(
    () => () =>
      files.forEach(({ preview }) => preview && URL.revokeObjectURL(preview)),
    [files],
  );

  function chooseFiles(selected: FileList | null) {
    const chosen = Array.from(selected ?? []);
    if (chosen.length > 10) {
      setFileError("Choose up to 10 files at a time.");
      setFiles([]);
      return;
    }
    const invalid = chosen
      .map((file) => ({
        file,
        result: attachmentMetadataSchema.safeParse({
          fileName: file.name,
          mimeType: file.type,
          size: file.size,
        }),
      }))
      .find(({ result }) => !result.success);

    if (invalid) {
      setFiles([]);
      setFileError(
        `${invalid.file.name}: ${invalid.result.error?.issues[0]?.message}`,
      );
      return;
    }

    setFileError("");
    setFiles(
      chosen.map((file) => ({
        file,
        preview: file.type.startsWith("image/")
          ? URL.createObjectURL(file)
          : undefined,
      })),
    );
  }

  const submit = handleSubmit(async (values) => {
    setProgress("");
    let result;

    if (task) {
      result = await updateTaskAction(task.id, values);
    } else {
      const stagedTokens: string[] = [];
      try {
        for (const [index, { file }] of files.entries()) {
          setProgress(`Uploading ${index + 1} of ${files.length}…`);
          const staged = await taskApi.stageAttachment(file);
          stagedTokens.push(staged.token);
        }
      } catch (error) {
        await Promise.all(
          stagedTokens.map((token) =>
            taskApi.discardStagedAttachment(token).catch(() => undefined),
          ),
        );
        setProgress("");
        setError("root", {
          type: "server",
          message:
            error instanceof Error
              ? error.message
              : "An attachment could not be uploaded. No task was created.",
        });
        return;
      }

      setProgress("Creating task…");
      result = await createTaskAction({
        title: values.title,
        description: values.description,
        priority: values.priority,
        deadline: values.deadline,
        assigneeId: values.assigneeId,
        stagedAttachmentTokens: stagedTokens,
      });
    }

    if (!result.success) {
      setProgress("");
      applyServerErrors(setError, FIELDS, result);
      return;
    }

    const failed: string[] = [];
    for (const [index, { file }] of (task ? files : []).entries()) {
      setProgress(`Uploading ${index + 1} of ${files.length}…`);
      try {
        await taskApi.uploadAttachment(result.data.id, file);
      } catch {
        failed.push(file.name);
      }
    }
    setProgress("");

    if (failed.length) {
      router.refresh();
      setError("root", {
        type: "server",
        message: `Task saved, but these files did not upload: ${failed.join(", ")}.`,
      });
      return;
    }

    setFeedback({
      tone: "success",
      message: task ? "Task updated." : "Task created.",
    });
    close();
    router.refresh();
  });

  return (
    <Dialog
      labelledBy="task-form-title"
      onClose={close}
      busy={isSubmitting}
      className="max-w-xl"
    >
      <form
        onSubmit={submit}
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-[2rem] border border-white/10 bg-slate-900 p-6 shadow-2xl sm:p-8"
      >
        <div className="mb-7 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-sky-400">
              Task details
            </p>
            <h2 id="task-form-title" className="mt-2 text-2xl font-black">
              {task ? "Edit task" : "Create a task"}
            </h2>
          </div>
          <button
            type="button"
            onClick={close}
            disabled={isSubmitting}
            className="rounded-xl p-2 text-slate-400 hover:bg-white/10 hover:text-white"
            aria-label="Close form"
          >
            <X />
          </button>
        </div>

        <div className="space-y-5">
          <label className="flex flex-col gap-2 text-sm font-bold">
            Title
            <Input
              {...register("title")}
              autoFocus
              placeholder="What needs to get done?"
              aria-invalid={Boolean(errors.title)}
              className="h-11 rounded-xl border-white/10 bg-white/5 font-normal"
            />
            {errors.title && (
              <span role="alert" className="text-sm font-normal text-rose-400">
                {errors.title.message}
              </span>
            )}
          </label>

          <label className="flex flex-col gap-2 text-sm font-bold">
            Description
            <Textarea
              {...register("description")}
              rows={4}
              placeholder="Add a little context…"
              aria-invalid={Boolean(errors.description)}
              className="resize-none rounded-xl border-white/10 bg-white/5 font-normal"
            />
            {errors.description && (
              <span role="alert" className="text-sm font-normal text-rose-400">
                {errors.description.message}
              </span>
            )}
          </label>

          <label className="flex flex-col gap-2 text-sm font-bold">
            Status
            {task ? (
              <select
                {...register("status")}
                className="h-11 rounded-xl border border-white/10 bg-slate-950 px-3 text-sm font-normal"
              >
                {statuses.map((status) => (
                  <option key={status.key} value={status.key}>
                    {status.name}
                  </option>
                ))}
              </select>
            ) : (
              <>
                <input type="hidden" {...register("status")} />
                <div className="grid h-11 items-center rounded-xl border border-white/10 bg-slate-950 px-3 text-sm font-normal text-slate-300">
                  {statuses.find((status) => status.key === "TODO")?.name ??
                    "To do"}
                </div>
              </>
            )}
            {errors.status && (
              <span role="alert" className="text-sm font-normal text-rose-400">
                {errors.status.message}
              </span>
            )}
            {!task && (
              <span className="text-xs font-normal text-slate-500">
                New tasks start in the initial stage.
              </span>
            )}
          </label>

          <label className="flex flex-col gap-2 text-sm font-bold">
            Assignee
            <select
              {...register("assigneeId")}
              aria-invalid={Boolean(errors.assigneeId)}
              className="h-11 rounded-xl border border-white/10 bg-slate-950 px-3 text-sm font-normal"
            >
              <option value="">Unassigned</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name} ({user.email})
                </option>
              ))}
            </select>
            {errors.assigneeId && (
              <span role="alert" className="text-sm font-normal text-rose-400">
                {String(errors.assigneeId.message)}
              </span>
            )}
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-2 text-sm font-bold">
              Priority
              <select
                {...register("priority")}
                className="h-11 rounded-xl border border-white/10 bg-slate-950 px-3 text-sm font-normal capitalize"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </label>

            <label className="flex flex-col gap-2 text-sm font-bold">
              Deadline
              <Input
                {...register("deadline")}
                type="date"
                aria-invalid={Boolean(errors.deadline)}
                className="h-11 border-white/10 bg-white/5 font-normal"
              />
              {errors.deadline && (
                <span
                  role="alert"
                  className="text-sm font-normal text-rose-400"
                >
                  {String(errors.deadline.message)}
                </span>
              )}
            </label>
          </div>

          <label className="flex flex-col gap-2 text-sm font-bold">
            Attachments
            <Input
              type="file"
              multiple
              disabled={isSubmitting}
              accept={ALLOWED_ATTACHMENT_MIME_TYPES.join(",")}
              onChange={(event) => chooseFiles(event.target.files)}
              className="h-11 cursor-pointer border-white/10 bg-white/5 font-normal file:mr-3 file:font-bold"
            />
            <span className="text-xs font-normal text-slate-500">
              Images, PDF, text, Word or Excel files up to 10 MB each.
            </span>
          </label>

          {files.length > 0 && (
            <div className="grid grid-cols-3 gap-2">
              {files.map(({ file, preview }) => (
                <figure
                  key={`${file.name}-${file.lastModified}`}
                  className="overflow-hidden rounded-xl border border-white/10 bg-white/5"
                >
                  {preview ? (
                    <img
                      src={preview}
                      alt={`Preview of ${file.name}`}
                      className="h-24 w-full object-cover"
                    />
                  ) : (
                    <div className="grid h-24 place-items-center text-slate-400">
                      <FileText />
                    </div>
                  )}
                  <figcaption className="truncate px-2 py-1.5 text-xs text-slate-400">
                    {file.name}
                  </figcaption>
                </figure>
              ))}
            </div>
          )}

          <FeedbackAlert
            feedback={
              fileError
                ? { tone: "error", message: fileError }
                : errors.root?.message
                  ? { tone: "error", message: errors.root.message }
                  : null
            }
            onDismiss={() => {
              setFileError("");
              clearErrors("root");
            }}
          />
        </div>

        <div className="mt-8 flex justify-end gap-3">
          <Button
            type="button"
            variant="ghost"
            onClick={close}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting || Boolean(fileError)}
            className="bg-sky-400 font-bold text-slate-950 hover:bg-sky-300"
          >
            {progress ||
              (isSubmitting
                ? "Saving…"
                : task
                  ? "Save changes"
                  : "Create task")}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
