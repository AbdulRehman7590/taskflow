"use client";

import { useCallback, useTransition } from "react";
import { useRouter } from "next/navigation";

const OMITTED = ["", "ALL"];

export function useUrlQuery<TQuery extends Record<string, string | number>>(
  path: string,
  query: TQuery,
) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const navigate = useCallback(
    (changes: Partial<Record<keyof TQuery, string | number>>) => {
      const next: Record<string, string | number> = {
        ...query,
        ...changes,
        ...("page" in changes ? {} : { page: 1 }),
      };

      const params = new URLSearchParams();
      for (const [key, value] of Object.entries(next)) {
        if (!OMITTED.includes(String(value))) params.set(key, String(value));
      }
      startTransition(() =>
        router.replace(`${path}${params.size ? `?${params}` : ""}`, {
          scroll: false,
        }),
      );
    },
    [path, query, router],
  );

  const refresh = useCallback(() => {
    startTransition(() => router.refresh());
  }, [router]);

  return { isPending, navigate, refresh };
}
