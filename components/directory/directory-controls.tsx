"use client";

import { useEffect, useState } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useUrlQuery } from "@/lib/use-url-query";
import {
  DIRECTORY_PAGE_SIZES,
  type ExternalUserQuery,
} from "@/lib/validations";

const SELECT_CLASS =
  "h-11 rounded-xl border border-white/10 bg-slate-950 px-3 text-sm text-slate-200";

export function DirectoryControls({ query }: { query: ExternalUserQuery }) {
  const { isPending, navigate } = useUrlQuery("/directory", query);
  const [search, setSearch] = useState(query.q);

  useEffect(() => setSearch(query.q), [query.q]);

  useEffect(() => {
    if (search === query.q) return;
    const timer = setTimeout(() => navigate({ q: search }), 350);
    return () => clearTimeout(timer);
  }, [search, query.q, navigate]);

  return (
    <section
      aria-busy={isPending}
      className="mt-6 grid gap-3 rounded-2xl border border-white/10 bg-black/25 p-4 lg:grid-cols-[minmax(16rem,1fr)_auto_auto_auto]"
    >
      <label className="relative block">
        <span className="sr-only">Search people</span>
        <Search
          aria-hidden="true"
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-500"
        />
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by name or username"
          maxLength={100}
          className="h-11 border-white/10 bg-white/5 pl-9 pr-10"
        />
        {search && (
          <button
            type="button"
            onClick={() => setSearch("")}
            aria-label="Clear search"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
          >
            <X className="size-4" />
          </button>
        )}
      </label>

      <select
        value={query.sort}
        onChange={(event) => navigate({ sort: event.target.value })}
        aria-label="Sort people by"
        className={SELECT_CLASS}
      >
        <option value="name">Name</option>
        <option value="username">Username</option>
        <option value="email">Email</option>
        <option value="age">Age</option>
      </select>

      <select
        value={query.order}
        onChange={(event) => navigate({ order: event.target.value })}
        aria-label="Sort direction"
        className={SELECT_CLASS}
      >
        <option value="asc">Ascending</option>
        <option value="desc">Descending</option>
      </select>

      <select
        value={query.pageSize}
        onChange={(event) => navigate({ pageSize: Number(event.target.value) })}
        aria-label="People per page"
        className={SELECT_CLASS}
      >
        {DIRECTORY_PAGE_SIZES.map((size) => (
          <option key={size} value={size}>
            {size} per page
          </option>
        ))}
      </select>
    </section>
  );
}
