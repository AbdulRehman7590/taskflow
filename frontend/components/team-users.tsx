"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, UserRound } from "lucide-react";
import { updateUserRoleAction } from "@/actions/auth-actions";
import { StatCard } from "@/components/dashboard/stat-card";
import { Badge } from "@/components/ui/badge";
import { FeedbackAlert } from "@/components/ui/alert";
import { ASSIGNABLE_USER_ROLES } from "@/lib/validations";
import type { Feedback, TeamUser, UserRole } from "@/types";

export function TeamUsers({
  users,
  currentUserId,
  canManageRoles,
}: {
  users: TeamUser[];
  currentUserId: number;
  canManageRoles: boolean;
}) {
  const admins = users.filter((user) => user.role === "admin").length;
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  async function changeRole(userId: number, role: UserRole) {
    setFeedback(null);
    const result = await updateUserRoleAction({ userId, role });
    if (!result.success) {
      setFeedback({ tone: "error", message: result.error });
      return;
    }
    setFeedback({ tone: "success", message: "User role updated." });
    startTransition(() => router.refresh());
  }

  return (
    <div className="mx-auto w-full max-w-[100rem] px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <header className="max-w-2xl">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-sky-400">
          Workspace access
        </p>
        <h1 className="mt-2 text-4xl font-black tracking-tight sm:text-5xl">
          Team members
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-400">
          {canManageRoles
            ? "Everyone who signs up joins as a member. Administrators are protected; non-admin roles can be managed here."
            : "View the people who share this workspace and their access roles."}
        </p>
      </header>

      <section className="mt-6 grid gap-3 sm:grid-cols-3">
        <StatCard
          label="People"
          value={users.length}
          icon={<UserRound size={18} />}
        />
        <StatCard
          label="Admins"
          value={admins}
          accent="text-violet-400"
          icon={<ShieldCheck size={18} />}
        />
        <StatCard
          label="Members"
          value={users.length - admins}
          accent="text-sky-400"
          icon={<UserRound size={18} />}
        />
      </section>

      <FeedbackAlert
        feedback={feedback}
        className="mt-5"
        onDismiss={() => setFeedback(null)}
      />

      <section className="mt-5 overflow-hidden rounded-3xl border border-white/10 bg-black/25">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[38rem] text-left">
            <caption className="sr-only">
              Team members and their access roles
            </caption>
            <thead className="border-b border-white/10 bg-black/25 text-xs uppercase tracking-wider text-slate-500">
              <tr>
                <th scope="col" className="px-5 py-4 font-semibold">
                  Member
                </th>
                <th scope="col" className="px-5 py-4 font-semibold">
                  Email
                </th>
                <th scope="col" className="px-5 py-4 font-semibold">
                  Joined
                </th>
                <th scope="col" className="px-5 py-4 font-semibold">
                  Role
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.07]">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-white/[0.04]">
                  <th scope="row" className="px-5 py-4 font-normal">
                    <div className="flex items-center gap-3">
                      <span className="grid size-10 shrink-0 place-items-center rounded-xl border border-sky-400/15 bg-gradient-to-br from-sky-400/20 to-indigo-500/20 text-sky-300">
                        {user.role === "admin" ? (
                          <ShieldCheck size={18} aria-hidden="true" />
                        ) : (
                          <UserRound size={18} aria-hidden="true" />
                        )}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white">
                          {user.name}
                        </span>
                        {user.id === currentUserId && (
                          <Badge
                            variant="outline"
                            className="border-sky-400/30 bg-sky-400/10 text-sky-300"
                          >
                            You
                          </Badge>
                        )}
                      </div>
                    </div>
                  </th>
                  <td className="px-5 py-4 text-sm text-slate-400">
                    {user.email}
                  </td>
                  <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-500">
                    {user.createdAt.slice(0, 10)}
                  </td>
                  <td className="px-5 py-4">
                    {user.role === "admin" ? (
                      <Badge
                        variant="secondary"
                        className="bg-violet-500/10 text-violet-300"
                      >
                        Admin
                      </Badge>
                    ) : canManageRoles ? (
                      <select
                        value={user.role}
                        disabled={isPending}
                        onChange={(event) =>
                          void changeRole(
                            user.id,
                            event.target.value as UserRole,
                          )
                        }
                        aria-label={`Role for ${user.name}`}
                        className="h-9 rounded-xl border border-white/10 bg-slate-950 px-3 text-sm capitalize text-slate-200"
                      >
                        {ASSIGNABLE_USER_ROLES.map((role) => (
                          <option key={role} value={role}>
                            {role}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <Badge variant="outline" className="capitalize">
                        {user.role}
                      </Badge>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
