"use client";

import { PaginationControls } from "@/components/dashboard/pagination-controls";
import { useUrlQuery } from "@/lib/use-url-query";
import type { ExternalUserQuery } from "@/lib/validations";
import type { ExternalUserPage } from "@/types";

export function DirectoryPagination({
  query,
  page,
}: {
  query: ExternalUserQuery;
  page: ExternalUserPage;
}) {
  const { isPending, navigate } = useUrlQuery("/directory", query);

  return (
    <PaginationControls
      page={page.page}
      totalPages={page.totalPages}
      total={page.total}
      itemLabel="people"
      isPending={isPending}
      onPageChange={(next) => navigate({ page: next })}
    />
  );
}
