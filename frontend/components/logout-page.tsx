"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { authApi } from "@/api";

export default function LogoutPage() {
  const router = useRouter();

  useEffect(() => {
    authApi.logout().finally(() => router.replace("/login"));
  }, [router]);

  return (
    <main className="grid min-h-screen place-items-center bg-slate-950 text-white">
      Signing you out...
    </main>
  );
}
