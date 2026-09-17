"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, LogOut, Users, UsersRound } from "lucide-react";
import { logoutAction } from "@/actions/auth-actions";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/types";

const NAV_ITEMS = [
  { href: "/", label: "Tasks", icon: LayoutDashboard },
  { href: "/directory", label: "Directory", icon: UsersRound, adminOnly: true },
  { href: "/team", label: "Team", icon: Users },
];

const LINK_CLASS =
  "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition";

export function DashboardNavigation({
  role,
  onNavigate,
  collapsed = false,
}: {
  role: UserRole;
  onNavigate?: () => void;
  collapsed?: boolean;
}) {
  const pathname = usePathname();

  return (
    <nav aria-label="Dashboard navigation" className="grid gap-1.5">
      {NAV_ITEMS.filter((item) => !item.adminOnly || role === "admin").map(
        ({ href, label, icon: Icon }) => {
          const active =
            href === "/" ? pathname === "/" : pathname.startsWith(href);

          return (
            <Link
              key={href}
              href={href}
              onClick={onNavigate}
              title={collapsed ? label : undefined}
              aria-current={active ? "page" : undefined}
              className={cn(
                LINK_CLASS,
                collapsed && "justify-center px-2",
                active
                  ? "bg-sky-400 text-slate-950"
                  : "text-slate-400 hover:bg-white/[0.07] hover:text-white",
              )}
            >
              <Icon className="size-4.5" aria-hidden="true" />
              <span className={collapsed ? "sr-only" : undefined}>{label}</span>
            </Link>
          );
        },
      )}
    </nav>
  );
}

export function DashboardLogout({
  collapsed = false,
  compact = false,
}: {
  collapsed?: boolean;
  compact?: boolean;
}) {
  return (
    <form action={logoutAction}>
      <button
        type="submit"
        title={collapsed || compact ? "Logout" : undefined}
        aria-label={compact ? "Logout" : undefined}
        className={cn(
          LINK_CLASS,
          collapsed && "justify-center px-2",
          compact && "size-10 justify-center p-0",
          "text-slate-400 hover:bg-rose-500/10 hover:text-rose-300",
        )}
      >
        <LogOut className="size-4.5" aria-hidden="true" />
        <span className={collapsed || compact ? "sr-only" : undefined}>
          Logout
        </span>
      </button>
    </form>
  );
}
