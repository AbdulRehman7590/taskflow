import { Check, LoaderCircle } from "lucide-react";

export function RouteLoading({
  label = "Loading workspace",
}: {
  label?: string;
}) {
  return (
    <div
      className="relative mx-auto w-full max-w-[100rem] overflow-hidden px-4 py-8 sm:px-6 lg:px-8 lg:py-10"
      role="status"
      aria-live="polite"
    >
      <div className="mb-8 flex items-center gap-4">
        <span className="relative grid size-12 place-items-center rounded-2xl bg-gradient-to-br from-sky-400 to-indigo-500 text-slate-950 shadow-lg shadow-sky-500/15">
          <Check className="size-5" />
          <LoaderCircle className="absolute -right-2 -top-2 size-5 animate-spin rounded-full bg-slate-950 text-sky-300" />
        </span>
        <div>
          <p className="font-bold text-white">{label}</p>
          <p className="mt-1 text-xs text-slate-500">
            Preparing the latest workspace data…
          </p>
        </div>
      </div>
      <span className="sr-only">{label}</span>
      <div className="animate-pulse">
        <div className="h-3 w-28 rounded-full bg-gradient-to-r from-sky-400/30 to-indigo-400/20" />
        <div className="mt-5 h-11 w-full max-w-xl rounded-2xl bg-gradient-to-r from-white/10 to-white/[0.04]" />
        <div className="mt-3 h-5 w-full max-w-md rounded-xl bg-white/[0.07]" />
        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          {[0, 1, 2].map((item) => (
            <div
              key={item}
              className="h-28 rounded-3xl border border-white/10 bg-white/[0.035]"
            />
          ))}
        </div>
        <div className="mt-7 h-16 rounded-3xl border border-white/10 bg-white/[0.035]" />
        <div className="mt-5 grid gap-5 lg:grid-cols-3">
          {[0, 1, 2].map((item) => (
            <div
              key={item}
              className="h-72 rounded-[1.75rem] border border-white/10 bg-black/20"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
