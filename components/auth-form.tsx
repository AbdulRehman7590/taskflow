"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { CheckCircle2, Sparkles } from "lucide-react";
import { loginAction, signupAction } from "@/actions/auth-actions";
import { applyServerErrors } from "@/lib/form-errors";
import { authFormSchema, type AuthFormInput } from "@/lib/validations";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FeedbackAlert } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import type { AuthMode } from "@/types";

const FIELDS = ["name", "email", "password"] as const;

const INPUT_CLASS = "h-12 rounded-xl border-slate-700 bg-slate-950 px-4";

export default function AuthForm({ mode }: { mode: AuthMode }) {
  const router = useRouter();
  const isLogin = mode === "login";
  const schema = useMemo(() => authFormSchema(mode), [mode]);

  const {
    register,
    handleSubmit,
    setError,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm<AuthFormInput>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", email: "", password: "" },
  });

  const submit = handleSubmit(async (values) => {
    const result = isLogin
      ? await loginAction(values)
      : await signupAction(values);

    if (!result.success) {
      applyServerErrors(setError, FIELDS, result);
      return;
    }
    router.replace("/");
  });

  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden bg-slate-950 p-5 text-white">
      <div className="pointer-events-none absolute -left-32 top-10 size-96 rounded-full bg-sky-500/15 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 bottom-0 size-[28rem] rounded-full bg-indigo-500/15 blur-3xl" />
      <div className="relative grid w-full max-w-5xl overflow-hidden rounded-[2.5rem] border border-white/10 bg-white/[0.035] shadow-2xl shadow-black/40 backdrop-blur-xl lg:grid-cols-[1.05fr_0.95fr]">
        <section className="hidden flex-col justify-between bg-gradient-to-br from-sky-400/15 via-indigo-500/10 to-transparent p-12 lg:flex">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-sky-300/20 bg-sky-300/10 px-3 py-1 text-xs font-bold text-sky-300">
              <Sparkles className="size-3.5" /> Work with clarity
            </span>
            <h2 className="mt-7 text-5xl font-black leading-tight tracking-tight">
              Move important work forward.
            </h2>
            <p className="mt-5 max-w-md text-base leading-7 text-slate-400">
              Plan, prioritize and follow every task from idea to completion in
              one focused workspace.
            </p>
          </div>
          <ul className="mt-12 space-y-4 text-sm text-slate-300">
            {[
              "Clear workflow stages",
              "Deadlines and priorities",
              "Files kept with the work",
            ].map((item) => (
              <li key={item} className="flex items-center gap-3">
                <CheckCircle2 className="size-5 text-sky-400" />
                {item}
              </li>
            ))}
          </ul>
        </section>

        <Card className="w-full border-0 bg-slate-900/80 shadow-none">
          <CardContent className="p-8">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-sky-400">
              Taskflow
            </p>
            <h1 className="mt-2 text-3xl font-black">
              {isLogin ? "Welcome back" : "Create your account"}
            </h1>

            <form onSubmit={submit} className="mt-7 space-y-4">
              {!isLogin && (
                <div>
                  <Input
                    {...register("name")}
                    autoComplete="name"
                    placeholder="Your name"
                    aria-label="Your name"
                    aria-invalid={Boolean(errors.name)}
                    className={INPUT_CLASS}
                  />
                  {errors.name && (
                    <p role="alert" className="mt-1.5 text-sm text-rose-300">
                      {errors.name.message}
                    </p>
                  )}
                </div>
              )}

              <div>
                <Input
                  {...register("email")}
                  type="email"
                  autoComplete="email"
                  placeholder="Email"
                  aria-label="Email"
                  aria-invalid={Boolean(errors.email)}
                  className={INPUT_CLASS}
                />
                {errors.email && (
                  <p role="alert" className="mt-1.5 text-sm text-rose-300">
                    {errors.email.message}
                  </p>
                )}
              </div>

              <div>
                <Input
                  {...register("password")}
                  type="password"
                  autoComplete={isLogin ? "current-password" : "new-password"}
                  placeholder="Password (8+ characters)"
                  aria-label="Password"
                  aria-invalid={Boolean(errors.password)}
                  className={INPUT_CLASS}
                />
                {errors.password && (
                  <p role="alert" className="mt-1.5 text-sm text-rose-300">
                    {errors.password.message}
                  </p>
                )}
              </div>

              <FeedbackAlert
                feedback={
                  errors.root?.message
                    ? { tone: "error", message: errors.root.message }
                    : null
                }
                onDismiss={() => clearErrors("root")}
              />

              <Button
                type="submit"
                disabled={isSubmitting}
                className="h-12 w-full rounded-xl bg-sky-400 font-bold text-slate-950 hover:bg-sky-300"
              >
                {isSubmitting ? "Please wait…" : isLogin ? "Log in" : "Sign up"}
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-slate-400">
              {isLogin ? "Need an account? " : "Already have an account? "}
              <Link
                href={isLogin ? "/signup" : "/login"}
                className="font-bold text-sky-400 hover:text-sky-300"
              >
                {isLogin ? "Sign up" : "Log in"}
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
