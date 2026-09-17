"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Check, Menu, X } from "lucide-react";
import { DashboardLogout, DashboardNavigation } from "./dashboard-navigation";
import type { AuthUser } from "@/types";

export function DashboardHeader({ user }: { user: AuthUser }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <>
      <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-white/10 bg-black/65 px-4 backdrop-blur-xl sm:px-6 lg:hidden">
        <Link
          href="/"
          className="flex items-center gap-2.5 text-sm font-black text-sky-300"
        >
          <span className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-sky-400 to-indigo-500 text-slate-950">
            <Check size={17} aria-hidden="true" />
          </span>
          Taskflow
        </Link>
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-expanded={open}
          aria-controls="mobile-navigation"
          aria-label="Open navigation"
          className="grid size-10 place-items-center rounded-xl border border-white/10 bg-white/5 text-slate-300"
        >
          <Menu className="size-5" />
        </button>
      </header>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close navigation"
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          />
          <aside
            id="mobile-navigation"
            role="dialog"
            aria-modal="true"
            aria-label="Navigation menu"
            className="absolute inset-y-0 right-0 flex w-[min(21rem,88vw)] flex-col border-l border-white/10 bg-slate-950 p-5"
          >
            <div className="flex items-center justify-between">
              <div className="min-w-0">
                <p className="truncate font-bold">{user.name}</p>
                <p className="text-xs capitalize text-slate-500">{user.role}</p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                autoFocus
                aria-label="Close navigation"
                className="grid size-10 place-items-center rounded-xl text-slate-400 hover:bg-white/10 hover:text-white"
              >
                <X className="size-5" />
              </button>
            </div>
            <div className="mt-8 flex-1">
              <DashboardNavigation
                role={user.role}
                onNavigate={() => setOpen(false)}
              />
            </div>
            <DashboardLogout />
          </aside>
        </div>
      )}
    </>
  );
}
