import type { ReactNode } from "react";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { requirePageUser } from "@/services";

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const user = await requirePageUser("admin");
  return <DashboardShell user={user}>{children}</DashboardShell>;
}
