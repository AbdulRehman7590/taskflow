"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { authApi } from "@/api";
import type { AuthMode } from "@/types";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type PasswordCredentialConstructor = new (data: {
  id: string;
  password: string;
  name?: string;
}) => Credential;

async function offerPasswordSave(email: string, password: string, name?: string) {
  const browser = window as Window & {
    PasswordCredential?: PasswordCredentialConstructor;
  };

  if (!browser.PasswordCredential || !navigator.credentials) return;
  try {
    await navigator.credentials.store(
      new browser.PasswordCredential({ id: email, password, name }),
    );
  } catch {
    // Password saving is controlled by the browser and may be disabled by users.
  }
}

export default function AuthForm({ mode }: { mode: AuthMode }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");

    try {
      if (mode === "login") await authApi.login({ email, password });
      else await authApi.signup({ name, email, password });
      await offerPasswordSave(email, password, mode === "signup" ? name : undefined);
      router.push("/");
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Unable to continue.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-slate-950 p-5 text-white">
      <Card className="w-full max-w-md border-slate-700 bg-slate-900 shadow-2xl">
        <CardContent className="p-8">
          <form onSubmit={submit} className="space-y-5" method="post">
            <p className="text-sm font-bold uppercase tracking-[.2em] text-sky-400">
              Taskflow
            </p>
            <h1 className="text-3xl font-black">
              {mode === "login" ? "Welcome back" : "Create your account"}
            </h1>
            {mode === "signup" && (
              <Input
                required
                name="name"
                autoComplete="name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Your name"
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3"
              />
            )}
            <Input
              required
              name="email"
              autoComplete="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Email"
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3"
            />
            <Input
              required
              minLength={8}
              name="password"
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Password (8+ characters)"
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3"
            />
            {error && (
              <Alert className="border-red-500/30 bg-red-500/10 text-red-300">
                {error}
              </Alert>
            )}
            <Button
              disabled={busy}
              className="w-full rounded-xl bg-sky-500 px-4 py-3 font-bold text-slate-950 disabled:opacity-50"
            >
              {busy
                ? "Please wait..."
                : mode === "login"
                  ? "Log in"
                  : "Sign up"}
            </Button>
            <Button
              variant="ghost"
              type="button"
              onClick={() =>
                router.push(mode === "login" ? "/signup" : "/login")
              }
              className="w-full text-sm text-slate-400 hover:text-white"
            >
              {mode === "login"
                ? "Need an account? Sign up"
                : "Already have an account? Log in"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
