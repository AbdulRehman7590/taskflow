import { FileQuestion, Home, UsersRound } from "lucide-react";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto grid min-h-[65vh] max-w-3xl place-items-center px-4 py-10 sm:px-6">
      <section className="w-full rounded-[2rem] border border-white/10 bg-white/[0.035] p-8 text-center shadow-2xl shadow-black/20 sm:p-12">
        <span className="mx-auto grid size-16 place-items-center rounded-2xl border border-sky-400/20 bg-sky-400/10 text-sky-300">
          <FileQuestion className="size-7" aria-hidden="true" />
        </span>
        <p className="mt-6 text-xs font-bold uppercase tracking-[0.22em] text-sky-400">
          Nothing here
        </p>
        <h1 className="mt-3 text-3xl font-black tracking-tight text-white sm:text-4xl">
          That page is no longer available.
        </h1>
        <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-slate-400">
          The page may have moved, or the requested result page may now be
          empty.
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <Link
            href="/"
            className="inline-flex h-11 items-center gap-2 rounded-xl bg-sky-400 px-5 text-sm font-bold text-slate-950 transition hover:bg-sky-300"
          >
            <Home className="size-4" aria-hidden="true" />
            View tasks
          </Link>
          <Link
            href="/directory"
            className="inline-flex h-11 items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 text-sm font-bold text-slate-300 transition hover:bg-white/10 hover:text-white"
          >
            <UsersRound className="size-4" aria-hidden="true" />
            Open directory
          </Link>
        </div>
      </section>
    </div>
  );
}
