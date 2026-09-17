"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PaginationControls({
  page,
  totalPages,
  total,
  itemLabel,
  isPending,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  total: number;
  itemLabel: string;
  isPending?: boolean;
  onPageChange: (page: number) => void;
}) {
  return (
    <nav
      aria-label={`${itemLabel} pagination`}
      aria-busy={isPending}
      className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-black/25 px-4 py-3"
    >
      <p className="text-sm text-slate-400" aria-live="polite">
        Page {page} of {totalPages} · {total} {itemLabel}
      </p>
      <div className="flex gap-2">
        <Button
          variant="ghost"
          className="gap-1 border border-white/10"
          disabled={page <= 1 || isPending}
          onClick={() => onPageChange(page - 1)}
        >
          <ChevronLeft size={16} aria-hidden="true" /> Previous
        </Button>
        <Button
          variant="ghost"
          className="gap-1 border border-white/10"
          disabled={page >= totalPages || isPending}
          onClick={() => onPageChange(page + 1)}
        >
          Next <ChevronRight size={16} aria-hidden="true" />
        </Button>
      </div>
    </nav>
  );
}
