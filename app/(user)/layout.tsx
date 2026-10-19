import type { ReactNode } from "react";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { requirePageUser } from "@/services";

export default async function UserLayout({
  children,
}: {
  children: ReactNode;
}) {
  const user = await requirePageUser();
  return <DashboardShell user={user}>{children}</DashboardShell>;
}
