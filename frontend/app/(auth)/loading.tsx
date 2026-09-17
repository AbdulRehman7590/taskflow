import { Check, LoaderCircle } from "lucide-react";

export default function AuthLoading() {
  return (
    <main
      className="relative grid min-h-screen place-items-center overflow-hidden bg-slate-950 p-5 text-white"
      role="status"
    >
      <div className="absolute -left-32 top-10 size-96 rounded-full bg-sky-500/15 blur-3xl" />
      <div className="absolute -right-24 bottom-0 size-[28rem] rounded-full bg-indigo-500/15 blur-3xl" />
      <section className="relative w-full max-w-md rounded-[2rem] border border-white/10 bg-white/[0.045] p-10 text-center backdrop-blur-xl">
        <span className="relative mx-auto grid size-16 place-items-center rounded-2xl bg-gradient-to-br from-sky-400 to-indigo-500 text-slate-950">
          <Check className="size-7" />
          <LoaderCircle className="absolute -right-2 -top-2 size-6 animate-spin rounded-full bg-slate-950 text-sky-300" />
        </span>
        <h1 className="mt-6 text-xl font-black">Opening Taskflow</h1>
        <p className="mt-2 text-sm text-slate-500">
          Preparing your secure sign-in…
        </p>
        <div className="mt-8 space-y-3 animate-pulse">
          <div className="h-12 rounded-xl bg-white/[0.07]" />
          <div className="h-12 rounded-xl bg-white/[0.07]" />
          <div className="h-12 rounded-xl bg-sky-400/15" />
        </div>
      </section>
      <span className="sr-only">Loading authentication</span>
    </main>
  );
}
