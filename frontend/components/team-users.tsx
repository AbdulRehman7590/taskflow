"use client";

import type { TeamUser } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, LogOut, ShieldCheck, UserRound } from "lucide-react";

export default function TeamUsers({
  initialUsers,
  currentUserId,
}: {
  initialUsers: TeamUser[];
  currentUserId: number;
}) {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_15%_0%,_rgba(14,116,144,0.18),_transparent_30%),linear-gradient(145deg,_#030303,_#111827)] p-6 text-white">
      <div className="mx-auto max-w-4xl">
        <header className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-white/10 bg-black/45 p-5 shadow-2xl shadow-black/25 backdrop-blur-xl">
          <a href="/" className="flex items-center gap-2 text-sm font-black text-sky-300">
            <span className="grid size-9 place-items-center rounded-2xl bg-gradient-to-br from-sky-400 to-indigo-500 text-slate-950"><Check size={17} /></span>
            Taskflow
          </a>
          <div className="flex gap-2">
            <Button asChild variant="ghost" className="border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white"><a href="/">Back to tasks</a></Button>
            <Button asChild variant="ghost" className="border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white"><a href="/logout"><LogOut size={16} /> Log out</a></Button>
          </div>
        </header>
        <section className="mt-12 max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-sky-400">Workspace access</p>
          <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">Team members</h1>
          <p className="mt-3 text-base leading-7 text-slate-400">Everyone who signs up joins this workspace as a member. Admin access is protected and cannot be assigned from here.</p>
        </section>
        <div className="mt-10 grid gap-4">
          {initialUsers.map((user) => (
            <Card
              key={user.id}
              className="overflow-hidden border-white/10 bg-white/[0.045] shadow-xl shadow-black/15 transition hover:border-sky-400/30 hover:bg-white/[0.065]"
            >
              <CardContent className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
                <div className="flex min-w-0 items-center gap-4">
                  <span className="grid size-12 shrink-0 place-items-center rounded-2xl border border-sky-400/15 bg-gradient-to-br from-sky-400/20 to-indigo-500/20 text-sky-300">
                    {user.role === "admin" ? <ShieldCheck size={22} /> : <UserRound size={21} />}
                  </span>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate font-bold text-white">{user.name}</p>
                      {user.id === currentUserId && <Badge variant="outline" className="border-sky-400/30 bg-sky-400/10 text-sky-300">You</Badge>}
                    </div>
                    <p className="mt-1 truncate text-sm text-slate-400">{user.email}</p>
                    <p className="mt-2 text-xs text-slate-500">Joined {new Date(user.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 self-start sm:self-auto">
                  <select
                    defaultValue={user.role}
                    disabled={user.role === "admin"}
                    aria-label={`Role for ${user.name}`}
                    className="h-10 rounded-xl border border-white/10 bg-white/5 px-3 text-sm font-medium text-slate-200 outline-none transition focus:border-sky-400/60 disabled:cursor-not-allowed disabled:opacity-65"
                  >
                    {user.role === "admin" ? (
                      <option value="admin">Admin</option>
                    ) : (
                      <option value="user">Member</option>
                    )}
                  </select>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </main>
  );
}
