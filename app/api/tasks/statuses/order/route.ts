import { NextResponse } from "next/server";
import { parseJson, withApiHandler } from "@/lib/api-handler";
import { revalidateStatuses } from "@/lib/cache";
import { statusOrderSchema } from "@/lib/validations";
import { requireUser, taskService } from "@/services";

export const PATCH = withApiHandler(
  "PATCH /api/tasks/statuses/order",
  async (request) => {
    await requireUser(request, "admin");
    const { statusIds } = await parseJson(request, statusOrderSchema);
    const statuses = await taskService.reorderStatuses(statusIds);
    revalidateStatuses();
    return NextResponse.json(statuses);
  },
);
