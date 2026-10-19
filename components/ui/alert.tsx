import * as React from "react";
import { CheckCircle2, TriangleAlert, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Feedback } from "@/types";

export function Alert({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      role="alert"
      className={cn("relative w-full rounded-xl border p-4 text-sm", className)}
      {...props}
    />
  );
}

export function FeedbackAlert({
  feedback,
  className,
  onDismiss,
}: {
  feedback: Feedback | null;
  className?: string;
  onDismiss: () => void;
}) {
  if (!feedback) return null;
  const isError = feedback.tone === "error";

  return (
    <Alert
      aria-live="polite"
      className={cn(
        "flex items-center gap-2 pr-11",
        isError
          ? "border-rose-400/30 bg-rose-500/10 text-rose-300"
          : "border-emerald-400/30 bg-emerald-500/10 text-emerald-300",
        className,
      )}
    >
      {isError ? (
        <TriangleAlert className="size-4 shrink-0" aria-hidden="true" />
      ) : (
        <CheckCircle2 className="size-4 shrink-0" aria-hidden="true" />
      )}
      <span>{feedback.message}</span>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss alert"
        className="absolute right-2 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-lg hover:bg-white/10"
      >
        <X className="size-4" aria-hidden="true" />
      </button>
    </Alert>
  );
}
