"use client";

import { AlertTriangle, RotateCcw } from "lucide-react";

export function RouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto grid min-h-[65vh] max-w-3xl place-items-center px-4 py-10 sm:px-6">
      <section className="w-full rounded-[2rem] border border-rose-400/20 bg-rose-500/[0.055] p-8 text-center shadow-2xl shadow-black/20 sm:p-12">
        <span className="mx-auto grid size-16 place-items-center rounded-2xl border border-rose-400/20 bg-rose-400/10 text-rose-300">
          <AlertTriangle className="size-7" aria-hidden="true" />
        </span>
        <p className="mt-6 text-xs font-bold uppercase tracking-[0.22em] text-rose-300">
          Something went wrong
        </p>
        <h1 className="mt-3 text-3xl font-black tracking-tight text-white sm:text-4xl">
          This workspace view could not load.
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-400">
          Try again now. If the problem continues, return later or contact your
          workspace administrator.
        </p>
        <button
          type="button"
          onClick={reset}
          className="mt-7 inline-flex h-11 items-center gap-2 rounded-xl bg-sky-400 px-5 text-sm font-bold text-slate-950 transition hover:bg-sky-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300"
        >
          <RotateCcw className="size-4" aria-hidden="true" />
          Try again
        </button>
        {error.digest && (
          <p className="mt-5 text-xs text-slate-600">
            Reference: {error.digest}
          </p>
        )}
      </section>
    </div>
  );
}
