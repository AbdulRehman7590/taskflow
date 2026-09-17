"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useAtom } from "jotai";
import { Check, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { DashboardHeader } from "./dashboard-header";
import { DashboardLogout, DashboardNavigation } from "./dashboard-navigation";
import { JotaiProvider } from "@/components/jotai-provider";
import { sidebarCollapsedAtom } from "@/atoms/task-atoms";
import { cn } from "@/lib/utils";
import type { AuthUser } from "@/types";

export function DashboardShell({
  children,
  user,
}: {
  children: ReactNode;
  user: AuthUser;
}) {
  return (
    <JotaiProvider>
      <DashboardShellContent user={user}>{children}</DashboardShellContent>
    </JotaiProvider>
  );
}

function DashboardShellContent({
  children,
  user,
}: {
  children: ReactNode;
  user: AuthUser;
}) {
  const [collapsed, setCollapsed] = useAtom(sidebarCollapsedAtom);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_15%_0%,_rgba(14,116,144,0.18),_transparent_30%),radial-gradient(circle_at_90%_10%,_rgba(79,70,229,0.14),_transparent_25%),linear-gradient(145deg,_#030303,_#09090b_48%,_#111827)] text-white">
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-30 hidden flex-col border-r border-white/10 bg-black/55 p-4 backdrop-blur-xl transition-[width] duration-300 lg:flex",
          collapsed ? "w-20" : "w-64",
        )}
      >
        <div className="flex items-center justify-between gap-2">
          <Link
            href="/"
            title={collapsed ? "Taskflow" : undefined}
            className={cn(
              "flex min-w-0 items-center gap-3 text-sm font-black text-sky-300",
              collapsed && "mx-auto",
            )}
          >
            <span className="grid size-10 place-items-center rounded-2xl bg-gradient-to-br from-sky-400 to-indigo-500 text-slate-950">
              <Check size={18} aria-hidden="true" />
            </span>
            <span className={collapsed ? "sr-only" : undefined}>Taskflow</span>
          </Link>
          {!collapsed && (
            <button
              type="button"
              onClick={() => setCollapsed(true)}
              aria-label="Collapse sidebar"
              className="grid size-9 place-items-center rounded-xl text-slate-500 hover:bg-white/10 hover:text-white"
            >
              <PanelLeftClose className="size-4" />
            </button>
          )}
        </div>

        {collapsed && (
          <button
            type="button"
            onClick={() => setCollapsed(false)}
            aria-label="Expand sidebar"
            title="Expand sidebar"
            className="mx-auto mt-4 grid size-10 place-items-center rounded-xl text-slate-500 hover:bg-white/10 hover:text-white"
          >
            <PanelLeftOpen className="size-4" />
          </button>
        )}

        <div className="mt-8 flex-1">
          <DashboardNavigation role={user.role} collapsed={collapsed} />
        </div>

        {collapsed ? (
          <DashboardLogout collapsed />
        ) : (
          <div className="mb-3 flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] p-3">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold">{user.name}</p>
              <p className="mt-1 truncate text-xs text-slate-500">
                {user.email}
              </p>
              <p className="mt-2 text-[0.65rem] font-bold uppercase tracking-widest text-sky-400">
                {user.role}
              </p>
            </div>
            <DashboardLogout compact />
          </div>
        )}
      </aside>

      <DashboardHeader user={user} />
      <main
        className={cn(
          "min-w-0 transition-[padding] duration-300",
          collapsed ? "lg:pl-20" : "lg:pl-64",
        )}
      >
        {children}
      </main>
    </div>
  );
}
