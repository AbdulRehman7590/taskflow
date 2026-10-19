"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Native modal dialogs provide focus trapping, Escape handling and focus restoration. */
export function Dialog({
  children,
  labelledBy,
  onClose,
  busy = false,
  className,
}: {
  children: ReactNode;
  labelledBy: string;
  onClose: () => void;
  busy?: boolean;
  className?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current!;
    const overflow = document.documentElement.style.overflow;
    dialog.showModal();
    document.documentElement.style.overflow = "hidden";
    return () => {
      dialog.close();
      document.documentElement.style.overflow = overflow;
    };
  }, []);
  return (
    <dialog
      ref={ref}
      aria-labelledby={labelledBy}
      aria-busy={busy}
      onCancel={(event) => {
        event.preventDefault();
        if (!busy) onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget && !busy) onClose();
      }}
      className={cn(
        "fixed inset-0 m-auto max-h-[94dvh] w-full max-w-2xl overflow-y-auto border-0 bg-transparent p-4 text-white backdrop:bg-slate-950/75 backdrop:backdrop-blur-sm",
        className,
      )}
    >
      {children}
    </dialog>
  );
}
